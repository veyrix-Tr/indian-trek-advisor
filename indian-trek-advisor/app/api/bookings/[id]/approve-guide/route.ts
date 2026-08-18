import { NextResponse } from "next/server"
import { getAdminClient, getAuthUser } from "@/lib/supabase-admin"
import { recordBookingHistory } from "@/lib/booking-history"
import { canTransition } from "@/lib/booking-flow"

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

  const { data: guide } = await supabase
    .from("guides")
    .select("id")
    .eq("user_id", user.id)
    .single()

  const { data: booking } = await supabase
    .from("bookings")
    .select("*")
    .eq("id", id)
    .single()

  if (!booking || !guide || booking.guide_id !== guide.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
  }

  // State-machine guard: only a pending booking can be approved by the guide.
  if (booking.status !== "pending") {
    return NextResponse.json({ error: "This booking can no longer be approved" }, { status: 400 })
  }
  if (!canTransition(booking.status, "guide_approved")) {
    return NextResponse.json({ error: "Invalid status transition" }, { status: 400 })
  }

  // Soft-hold: the guide accepts one request per guide+date. If another request
  // for the same date is already guide_approved (awaiting the trekker's final
  // verification), the guide can't accept this one too. The date is only hard-
  // locked (booked) when the trekker does their final verification.
  const { data: held } = await supabase
    .from("bookings")
    .select("id")
    .eq("guide_id", booking.guide_id)
    .eq("booking_date", booking.booking_date)
    .in("status", ["guide_approved", "confirmed"])
    .neq("id", booking.id)
    .limit(1)

  if (held && held.length > 0) {
    return NextResponse.json({
      error: "You've already accepted another request for this date. The date becomes locked once that trekker finalizes.",
    }, { status: 400 })
  }

  const { data: updated, error } = await supabase
    .from("bookings")
    .update({ status: "guide_approved", guide_responded_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  await recordBookingHistory(supabase, {
    bookingId: booking.id,
    fromStatus: booking.status,
    toStatus: "guide_approved",
    actorId: user.id,
    actorRole: "guide",
    note: "Guide accepted the request",
  })

  // Notify the trekker their guide approved the booking and they need to do the
  // final verification.
  await supabase.from("notifications").insert({
    user_id: booking.trekker_id,
    type: "booking_status_change",
    booking_id: booking.id,
    message: `${user.user_metadata?.name || "Your guide"} accepted your ${booking.trek_id} trek on ${booking.booking_date}. Complete the final verification in your bookings.`,
  })

  return NextResponse.json({ booking: updated })
}