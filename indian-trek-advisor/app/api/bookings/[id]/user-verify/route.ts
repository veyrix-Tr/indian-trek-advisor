import { NextResponse } from "next/server"
import { getAdminClient, getAuthUser } from "@/lib/supabase-admin"
import { recordBookingHistory } from "@/lib/booking-history"
import { canTransition } from "@/lib/booking-flow"

// The trekker's final verification: moves a guide_approved booking to
// confirmed. This is the step that hard-locks the guide's date (booked) and
// auto-rejects any other pending requests for the same guide + date.
//
// Payment will be bundled into this step later; for now confirming here simply
// locks the booking in and, since it becomes non-cancellable, finalizes it.
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const user = await getAuthUser()
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const supabase = getAdminClient()

  const { data: booking } = await supabase
    .from("bookings")
    .select("*")
    .eq("id", id)
    .single()

  if (!booking) {
    return NextResponse.json({ error: "Booking not found" }, { status: 404 })
  }

  // Only the trekker who owns the booking can do the final verification.
  if (booking.trekker_id !== user.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
  }

  // State-machine guard: only a guide_approved booking can be finalized by the
  // trekker.
  if (booking.status !== "guide_approved" || !canTransition(booking.status, "confirmed")) {
    return NextResponse.json({ error: "Booking must be accepted by the guide before final verification" }, { status: 400 })
  }

  const { data: updated, error } = await supabase
    .from("bookings")
    .update({ status: "confirmed" })
    .eq("id", id)
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // Hard-lock the date for the guide: this blocks any further requests now.
  await supabase
    .from("guide_availability")
    .upsert({
      guide_id: booking.guide_id,
      date: booking.booking_date,
      status: "booked",
      booking_id: booking.id,
    }, { onConflict: "guide_id,date" })

  // Auto-reject every other pending request for the same guide + date — the
  // guide can only take one booking per day, and this trekker's is confirmed.
  const { data: siblings } = await supabase
    .from("bookings")
    .select("id, trekker_id, trek_id, booking_date")
    .eq("guide_id", booking.guide_id)
    .eq("booking_date", booking.booking_date)
    .eq("status", "pending")
    .neq("id", booking.id)

  for (const sibling of siblings ?? []) {
    await supabase
      .from("bookings")
      .update({ status: "cancelled", rejection_reason: "Guide accepted another request for this date" })
      .eq("id", sibling.id)

    await recordBookingHistory(supabase, {
      bookingId: sibling.id,
      fromStatus: "pending",
      toStatus: "cancelled",
      actorId: user.id,
      actorRole: "trekker",
      note: "Auto-rejected: another request for this date was confirmed",
    })

    await supabase.from("notifications").insert({
      user_id: sibling.trekker_id,
      type: "booking_status_change",
      booking_id: sibling.id,
      message: `Your ${sibling.trek_id} trek request on ${sibling.booking_date} was cancelled because the guide accepted another request for that date.`,
    })
  }

  await recordBookingHistory(supabase, {
    bookingId: booking.id,
    fromStatus: booking.status,
    toStatus: "confirmed",
    actorId: user.id,
    actorRole: "trekker",
    note: "Trekker completed final verification — booking locked in",
  })

  // Notify the guide their date is now locked in.
  const { data: guideRow } = await supabase
    .from("guides")
    .select("user_id")
    .eq("id", booking.guide_id)
    .single()

  if (guideRow?.user_id) {
    await supabase.from("notifications").insert({
      user_id: guideRow.user_id,
      type: "booking_status_change",
      booking_id: booking.id,
      message: `${user.user_metadata?.name || "A trekker"} confirmed the ${booking.trek_id} trek on ${booking.booking_date}. This date is now locked for you.`,
    })
  }

  return NextResponse.json({ booking: updated })
}