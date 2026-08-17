import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { createClient as createServerSupabaseClient } from "@/utils/supabase/server"

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const authClient = await createServerSupabaseClient()
  const { data: { user }, error: authError } = await authClient.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const body = await request.json()
  const { reason } = body

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

  const isGuideActor = Boolean(guide) && booking.guide_id === guide?.id
  const isTrekkerActor = booking.trekker_id === user.id
  const canCancel = isGuideActor || isTrekkerActor || profile?.account_type === 'admin'
  if (!canCancel) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
  }

  if (booking.status === 'completed' || booking.status === 'cancelled') {
    return NextResponse.json({ error: `Booking is already ${booking.status}` }, { status: 400 })
  }

  // Update booking status
  const { data: updated, error } = await supabase
    .from("bookings")
    .update({
      status: 'cancelled',
      rejection_reason: reason || null,
      ...(isGuideActor ? { guide_responded_at: new Date().toISOString() } : {}),
    })
    .eq("id", id)
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // Notify the counterpart about the cancellation
  const cancelMessage = `Your ${booking.trek_id} trek on ${booking.booking_date} was cancelled.${reason ? ` Reason: ${reason}` : ""}`
  if (isTrekkerActor) {
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
        message: cancelMessage,
      })
    }
  } else {
    await supabase.from("notifications").insert({
      user_id: booking.trekker_id,
      type: "booking_status_change",
      booking_id: booking.id,
      message: cancelMessage,
    })
  }

  // Free up the date
  await supabase
    .from("guide_availability")
    .update({ status: 'available', booking_id: null })
    .eq("booking_id", id)

  // Send SMS notifications
  const { data: guideRow } = await supabase
    .from("guides")
    .select("profiles(phone)")
    .eq("id", booking.guide_id)
    .single()
  const guidePhone = (guideRow?.profiles as any)?.phone

  const { data: trekkerProfile } = await supabase
    .from("profiles")
    .select("phone")
    .eq("id", booking.trekker_id)
    .single()

  if (guidePhone && trekkerProfile?.phone) {
    const { sendCancellationSMS } = await import("@/lib/sms/brevo")
    await sendCancellationSMS(
      guidePhone,
      trekkerProfile.phone,
      reason || 'Booking cancelled'
    )
  }

  return NextResponse.json({ booking: updated })
}
