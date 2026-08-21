import { NextResponse } from "next/server"
import { getAdminClient, getAuthUser } from "@/lib/supabase-admin"
import { recordBookingHistory } from "@/lib/booking-history"
import { canTransition } from "@/lib/booking-flow"
import { withErrorHandling } from "@/lib/api"

export const POST = withErrorHandling(async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const user = await getAuthUser()
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const supabase = getAdminClient()

  const body = await request.json()
  const { reason, refund_method, refund_details } = body

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
  const isAdminActor = profile?.account_type === 'admin'
  const canCancel = isGuideActor || isTrekkerActor || isAdminActor
  if (!canCancel) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
  }

  const actorRole = isAdminActor ? "admin" : isGuideActor ? "guide" : "trekker"

  if (booking.status === 'completed' || booking.status === 'cancelled' || !canTransition(booking.status, "cancelled")) {
    return NextResponse.json({ error: `Booking cannot be cancelled in its current state` }, { status: 400 })
  }

  // Update booking status
  const cancellationNote = reason || "Booking cancelled"
  const refundInfo = refund_method && refund_details
    ? ` [Refund: ${refund_method} — ${refund_details}]`
    : ""
  const { data: updated, error } = await supabase
    .from("bookings")
    .update({
      status: 'cancelled',
      rejection_reason: cancellationNote + refundInfo,
      cancelled_by: user.id,
      cancelled_by_role: actorRole,
      ...(isGuideActor ? { guide_responded_at: new Date().toISOString() } : {}),
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
    toStatus: "cancelled",
    actorId: user.id,
    actorRole,
    note: reason || "Booking cancelled",
  })

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

  // Notify all admins about the cancellation
  const { data: adminProfiles } = await supabase
    .from("profiles")
    .select("id")
    .eq("account_type", "admin")

  if (adminProfiles && adminProfiles.length > 0) {
    const refundMsg = refund_method && refund_details
      ? `\nRefund requested via ${refund_method}: ${refund_details}`
      : ""
    await supabase.from("notifications").insert(
      adminProfiles.map((admin) => ({
        user_id: admin.id,
        type: "booking_status_change",
        booking_id: booking.id,
        message: `Booking cancelled: ${actorRole} cancelled booking for ${booking.booking_date} (${booking.trek_id}).${reason ? ` Reason: ${reason}` : ""}${refundMsg}`,
      }))
    )
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
}, { source: "bookings.cancel", route: "/api/bookings/[id]/cancel" })
