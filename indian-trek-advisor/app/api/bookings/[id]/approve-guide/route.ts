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

  const { data: updated, error } = await supabase
    .from("bookings")
    .update({ status: "guide_approved", guide_responded_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // Once the guide accepts this request, that date is booked for them: hold
  // the availability row. This blocks any further requests for the same date.
  await supabase
    .from("guide_availability")
    .upsert({
      guide_id: booking.guide_id,
      date: booking.booking_date,
      status: "booked",
      booking_id: booking.id,
    }, { onConflict: "guide_id,date" })

  // Auto-reject every other pending request from the same guide on the same
  // date — the guide can only take one booking per day.
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
      actorRole: "guide",
      note: "Auto-rejected: guide accepted another request for this date",
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
    toStatus: "guide_approved",
    actorId: user.id,
    actorRole: "guide",
    note: "Guide accepted the request",
  })

  // Notify the trekker their guide approved the booking.
  await supabase.from("notifications").insert({
    user_id: booking.trekker_id,
    type: "booking_status_change",
    booking_id: booking.id,
    message: `Your guide approved your ${booking.trek_id} trek on ${booking.booking_date}. Awaiting admin confirmation.`,
  })

  // Send SMS to admin.
  const { data: adminProfile } = await supabase
    .from("profiles")
    .select("phone")
    .eq("account_type", "admin")
    .limit(1)
    .single()

  if (adminProfile?.phone) {
    const { data: trekkerProfile } = await supabase
      .from("profiles")
      .select("name")
      .eq("id", booking.trekker_id)
      .single()

    const { sendGuideApprovalSMS } = await import("@/lib/sms/brevo")
    await sendGuideApprovalSMS(
      adminProfile.phone,
      user.user_metadata?.name || "Guide",
      trekkerProfile?.name || "Trekker",
      booking.trek_id
    )
  }

  return NextResponse.json({ booking: updated })
}