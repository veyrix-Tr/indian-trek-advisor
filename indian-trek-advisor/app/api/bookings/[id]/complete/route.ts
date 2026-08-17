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

  // Verify user is guide or admin
  const { data: booking } = await supabase
    .from("bookings")
    .select("*")
    .eq("id", id)
    .single()

  if (!booking) {
    return NextResponse.json({ error: "Booking not found" }, { status: 404 })
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("account_type")
    .eq("id", user.id)
    .single()

  const { data: guide } = await supabase
    .from("guides")
    .select("id")
    .eq("user_id", user.id)
    .single()

  const canComplete = (guide && booking.guide_id === guide.id) || profile?.account_type === 'admin'
  if (!canComplete) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
  }

  if (booking.status !== 'confirmed' || !canTransition(booking.status, "completed")) {
    return NextResponse.json({ error: "Booking must be confirmed to complete" }, { status: 400 })
  }

  const actorRole = profile?.account_type === 'admin' ? "admin" : "guide"

  // Update booking status
  const { data: updated, error } = await supabase
    .from("bookings")
    .update({
      status: 'completed',
      trek_completion_date: new Date().toISOString().split('T')[0]
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
    toStatus: "completed",
    actorId: user.id,
    actorRole,
    note: "Trek marked complete",
  })

  // Notify the trekker their trek is complete and they can rate the guide
  await supabase.from("notifications").insert({
    user_id: booking.trekker_id,
    type: "booking_status_change",
    booking_id: booking.id,
    message: `Your ${booking.trek_id} trek was marked complete. Rate your guide and share your experience.`,
  })

  // Send SMS to trekker for rating
  const { data: trekkerProfile } = await supabase
    .from("profiles")
    .select("phone")
    .eq("id", booking.trekker_id)
    .single()

  if (trekkerProfile?.phone) {
    // Get guide name for SMS
    const { data: guideRow } = await supabase
      .from("guides")
      .select("profiles(name)")
      .eq("id", booking.guide_id)
      .single()

    const { sendRatingRequestSMS } = await import("@/lib/sms/brevo")
    await sendRatingRequestSMS(
      trekkerProfile.phone,
      (guideRow?.profiles as any)?.name || 'Guide',
      booking.trek_id
    )
  }

  return NextResponse.json({ booking: updated })
}
