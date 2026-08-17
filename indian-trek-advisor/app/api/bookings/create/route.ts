import { NextResponse } from "next/server"
import { getAdminClient, getAuthUser } from "@/lib/supabase-admin"
import { parseTrekDays, computeBookingAmount } from "@/lib/pricing"
import { recordBookingHistory, resolveActorRole } from "@/lib/booking-history"

export async function POST(request: Request) {
  const user = await getAuthUser()
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const supabase = getAdminClient()
  const body = await request.json()
  const { trek_id, guide_id, booking_date, notes, num_trekkers = 1 } = body

  if (!trek_id || !guide_id || !booking_date) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
  }

  const trekkerCount = Math.min(20, Math.max(1, Math.floor(Number(num_trekkers) || 1)))

  // Validate the guide actually serves this trek and fetch their base rate.
  const { data: association, error: assocError } = await supabase
    .from("guide_trek_associations")
    .select("base_rate")
    .eq("guide_id", guide_id)
    .eq("trek_id", trek_id)
    .single()

  if (assocError || !association) {
    return NextResponse.json({
      error: "This guide is not associated with this trek",
    }, { status: 400 })
  }

  // Parse trek duration from the static trek data (days may be "5–6");
  // fall back to 1 if we can't determine it.
  const { getTrekById } = await import("@/lib/data")
  const trekDays = parseTrekDays(String(getTrekById(Number(trek_id))?.days ?? ""))
  const baseRate = Number(association.base_rate) || 0
  const totalAmount = computeBookingAmount(baseRate, trekkerCount, trekDays)

  // Detect an active (non-available) hold on this date for the guide.
  const { data: existingAvail } = await supabase
    .from("guide_availability")
    .select("*")
    .eq("guide_id", guide_id)
    .eq("date", booking_date)
    .neq("status", "available")
    .maybeSingle()

  if (existingAvail) {
    return NextResponse.json({ error: "Guide not available on this date" }, { status: 400 })
  }

  // Create booking (idempotence guard: one pending request per trekker+date).
  const { data: existingBooking } = await supabase
    .from("bookings")
    .select("id")
    .eq("trekker_id", user.id)
    .eq("guide_id", guide_id)
    .eq("booking_date", booking_date)
    .in("status", ["pending", "guide_approved", "admin_approved"])
    .maybeSingle()

  if (existingBooking) {
    return NextResponse.json({
      error: "You already have an active request for this guide on this date",
    }, { status: 409 })
  }

  const { data: booking, error: bookingError } = await supabase
    .from("bookings")
    .insert({
      trek_id,
      trekker_id: user.id,
      guide_id,
      booking_date,
      notes: notes || null,
      num_trekkers: trekkerCount,
      trek_days: trekDays,
      base_rate: baseRate,
      total_amount: totalAmount,
      status: "pending",
      payment_status: "pending",
    })
    .select()
    .single()

  if (bookingError) {
    return NextResponse.json({ error: bookingError.message }, { status: 500 })
  }

  // Hold the guide's date for this booking.
  await supabase
    .from("guide_availability")
    .upsert({
      guide_id,
      date: booking_date,
      status: "booked",
      booking_id: booking.id,
    }, { onConflict: "guide_id,date" })

  // Audit + notifications.
  await recordBookingHistory(supabase, {
    bookingId: booking.id,
    fromStatus: "none",
    toStatus: "pending",
    actorId: user.id,
    actorRole: (await resolveActorRole(supabase, user.id)).role,
    note: "Booking requested",
  })

  const { data: guideData } = await supabase
    .from("guides")
    .select("*, profiles(*)")
    .eq("id", guide_id)
    .single()

  if (guideData?.user_id) {
    await supabase.from("notifications").insert({
      user_id: guideData.user_id,
      type: "booking_request",
      booking_id: booking.id,
      message: `${user.user_metadata?.name || "A trekker"} requested a booking for ${booking_date} (${trekkerCount} trekker${trekkerCount > 1 ? "s" : ""}).`,
    })
  }

  if (guideData?.profiles?.phone) {
    const { sendBookingRequestSMS } = await import("@/lib/sms/brevo")
    await sendBookingRequestSMS(
      guideData.profiles.phone,
      user.user_metadata?.name || "Trekker",
      trek_id,
      booking_date
    )
  }

  return NextResponse.json({ booking })
}