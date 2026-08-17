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

  // Verify user is admin
  const { data: profile } = await supabase
    .from("profiles")
    .select("account_type")
    .eq("id", user.id)
    .single()

  if (!profile || profile.account_type !== 'admin') {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
  }

  // Get current booking
  const { data: booking } = await supabase
    .from("bookings")
    .select("*")
    .eq("id", id)
    .single()

  if (!booking) {
    return NextResponse.json({ error: "Booking not found" }, { status: 404 })
  }

  // State-machine guard
  if (booking.status !== 'guide_approved' || !canTransition(booking.status, "admin_approved")) {
    return NextResponse.json({ error: "Booking must be guide-approved before admin approval" }, { status: 400 })
  }

  // Update booking status
  const { data: updated, error } = await supabase
    .from("bookings")
    .update({ status: 'admin_approved' })
    .eq("id", id)
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  await recordBookingHistory(supabase, {
    bookingId: booking.id,
    fromStatus: booking.status,
    toStatus: "admin_approved",
    actorId: user.id,
    actorRole: "admin",
    note: "Admin approved",
  })

  // Notify the trekker their booking is confirmed and ready to pay
  await supabase.from("notifications").insert({
    user_id: updated.trekker_id,
    type: "booking_status_change",
    booking_id: updated.id,
    message: `Your ${updated.trek_id} trek on ${updated.booking_date} was confirmed. Complete payment in your bookings.`,
  })

  // Get guide name for SMS
  const { data: guideRow } = await supabase
    .from("guides")
    .select("profiles(name)")
    .eq("id", updated.guide_id)
    .single()
  const guideProfile = guideRow?.profiles as any

  // Send SMS to trekker
  const { data: trekkerProfile } = await supabase
    .from("profiles")
    .select("phone")
    .eq("id", updated.trekker_id)
    .single()

  const amount = updated.total_amount || 0

  if (trekkerProfile?.phone) {
    const { sendAdminApprovalSMS } = await import("@/lib/sms/brevo")
    await sendAdminApprovalSMS(
      trekkerProfile.phone,
      guideProfile?.name || 'Guide',
      updated.trek_id,
      amount
    )
  }

  return NextResponse.json({ booking: updated })
}
