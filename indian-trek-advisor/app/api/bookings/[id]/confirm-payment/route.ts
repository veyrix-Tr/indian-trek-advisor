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

  // Verify user is the trekker
  const { data: booking } = await supabase
    .from("bookings")
    .select("*")
    .eq("id", id)
    .single()

  if (!booking || booking.trekker_id !== user.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
  }

  // State-machine guard
  if (booking.status !== 'admin_approved' || !canTransition(booking.status, "confirmed")) {
    return NextResponse.json({ error: "Booking must be admin-approved before payment" }, { status: 400 })
  }

  // Amount is server-computed at booking time; never trust a client-supplied value.
  const amount = booking.total_amount || 0

  // Update booking
  const { data: updated, error } = await supabase
    .from("bookings")
    .update({
      status: 'confirmed',
      payment_status: 'paid',
      payment_amount: amount,
    })
    .eq("id", id)
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  await recordBookingHistory(supabase, {
    bookingId: booking.id,
    fromStatus: booking.status,
    toStatus: "confirmed",
    actorId: user.id,
    actorRole: "trekker",
    note: "Payment confirmed — booking locked in",
  })

  // Get guide and trekker profiles for SMS
  const { data: guideRow } = await supabase
    .from("guides")
    .select("user_id, profiles(phone, name)")
    .eq("id", booking.guide_id)
    .single()
  const guideProfile = guideRow?.profiles as any

  const { data: trekkerProfile } = await supabase
    .from("profiles")
    .select("phone, name")
    .eq("id", booking.trekker_id)
    .single()

  if (guideRow?.user_id) {
    await supabase.from("notifications").insert({
      user_id: guideRow.user_id,
      type: "booking_status_change",
      booking_id: booking.id,
      message: `Payment confirmed for your ${booking.booking_date} trek — it's locked in.`,
    })
  }

  if (guideProfile?.phone && trekkerProfile?.phone) {
    const { sendPaymentConfirmationSMS } = await import("@/lib/sms/brevo")
    await sendPaymentConfirmationSMS(
      guideProfile.phone,
      trekkerProfile.phone,
      guideProfile.name || 'Guide',
      trekkerProfile.name || 'Trekker',
      booking.trek_id
    )
  }

  return NextResponse.json({ booking: updated })
}