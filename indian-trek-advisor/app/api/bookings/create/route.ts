import { NextResponse } from "next/server"
import { getAdminClient, getAuthUser } from "@/lib/supabase-admin"
import { parseTrekDays, computeBookingPricing } from "@/lib/pricing"
import { recordBookingHistory, resolveActorRole } from "@/lib/booking-history"
import { STALE_REQUEST_MS } from "@/lib/booking-flow"
import { withErrorHandling } from "@/lib/api"

export const POST = withErrorHandling(async function POST(request: Request) {
  const user = await getAuthUser()
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  // Only trekkers can place a booking request for a guide. Guides and admins
  // use the admin/guide flows and must not be able to book as a trekker.
  const { role } = await resolveActorRole(getAdminClient(), user.id)
  if (role !== "trekker") {
    return NextResponse.json(
      { error: "Only trekkers can book a guide. Guides and admins use their own dashboards." },
      { status: 403 },
    )
  }

  const supabase = getAdminClient()
  const body = await request.json()
  const {
    trek_id,
    guide_id,
    booking_date,
    notes,
    num_trekkers = 1,
    trek_days: trekDaysOverride,
    guide_required = true,
    trek_assist_required = false,
  } = body

  if (!trek_id || !guide_id || !booking_date) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
  }

  // Reject past dates
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  if (new Date(booking_date) < today) {
    return NextResponse.json({ error: "Cannot book a date in the past" }, { status: 400 })
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
  // fall back to 1 if we can't determine it. Allow frontend override.
  const { getTrekById } = await import("@/lib/data")
  const defaultDays = parseTrekDays(String(getTrekById(Number(trek_id))?.days ?? ""))
  const trekDays = trekDaysOverride
    ? Math.max(1, Math.floor(Number(trekDaysOverride) || 1))
    : defaultDays

  // Compute full pricing breakdown server-side.
  const pricing = computeBookingPricing({
    trekDays,
    numPeople: trekkerCount,
    guideRequired: guide_required,
    trekAssistRequired: trek_assist_required,
  })

  // Detect an active (non-available) hold on this date for the guide, plus any
  // confirmed booking whose multi-day span covers the date.
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

  const { bookingDateSpan } = await import("@/lib/booking-span")
  const { data: confirmedBookings } = await supabase
    .from("bookings")
    .select("booking_date, trek_days")
    .eq("guide_id", guide_id)
    .eq("status", "confirmed")
    .limit(50)

  const dateIsInConfirmedSpan = (confirmedBookings ?? []).some((b) =>
    bookingDateSpan(b.booking_date, b.trek_days).includes(booking_date)
  )
  if (dateIsInConfirmedSpan) {
    return NextResponse.json({ error: "Guide is booked on this date" }, { status: 400 })
  }

  // Create booking. Duplicate guard / anti-spam: a trekker can have only one
  // active request per booking_date (regardless of which guide), so they can't
  // spam multiple guides for the same day. Exception: if their only request is
  // still unaccepted (pending) and older than 6 hours, they may send a request
  // to a different guide. Once a guide has accepted (guide_approved) or it's
  // confirmed, no further request is allowed for that date. The old request is
  // never auto-cancelled; the trekker can simply send another after 6 hours.
  const SIX_HOURS_MS = STALE_REQUEST_MS
  const { data: existingBooking } = await supabase
    .from("bookings")
    .select("id, status, created_at")
    .eq("trekker_id", user.id)
    .eq("booking_date", booking_date)
    .in("status", ["pending", "guide_approved", "confirmed"])
    .order("created_at", { ascending: true })

  if (existingBooking && existingBooking.length > 0) {
    const oldest = existingBooking[0]

    // A guide has already accepted (or it's confirmed) — never allow another.
    if (oldest.status !== "pending") {
      return NextResponse.json({
        error: "You already have an accepted request for this date. Pay the booking fee to confirm instead.",
      }, { status: 409 })
    }

    // Still pending: allow a fresh request to another guide only after 6h.
    const age = Date.now() - new Date(oldest.created_at).getTime()
    if (age < SIX_HOURS_MS) {
      return NextResponse.json({
        error: "You already have a request pending for this date. You can request another guide after 6 hours, or cancel it.",
      }, { status: 409 })
    }
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
      trek_days: pricing.totalDays,
      base_rate: Number(association.base_rate) || 0,
      total_amount: pricing.totalAmount,
      guide_required: pricing.guideRequired,
      trek_assist_required: pricing.trekAssistRequired,
      guide_fee: pricing.guideFee,
      trek_assist_fee: pricing.trekAssistFee,
      payment_amount: pricing.paymentAmount,
      status: "pending",
      payment_status: "pending",
    })
    .select()
    .single()

  if (bookingError) {
    return NextResponse.json({ error: bookingError.message }, { status: 500 })
  }

  // Note: availability is NOT held here. The guide accepts one of several
  // pending requests; the date only becomes "booked" when the trekker does
  // their final verification (see user-verify).

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

  // Notify all admins about the new booking request
  const { data: adminProfiles } = await supabase
    .from("profiles")
    .select("id")
    .eq("account_type", "admin")

  if (adminProfiles && adminProfiles.length > 0) {
    await supabase.from("notifications").insert(
      adminProfiles.map((admin) => ({
        user_id: admin.id,
        type: "booking_request",
        booking_id: booking.id,
        message: `New booking request: ${user.user_metadata?.name || "Trekker"} requested ${getTrekById(Number(trek_id))?.name || "a trek"} for ${booking_date}.`,
      }))
    )
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
}, { source: "bookings.create", route: "/api/bookings/create" })