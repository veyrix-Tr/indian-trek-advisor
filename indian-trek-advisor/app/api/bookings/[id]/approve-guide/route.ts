import { NextResponse } from "next/server"
import { getAdminClient, getAuthUser } from "@/lib/supabase-admin"
import { recordBookingHistory } from "@/lib/booking-history"
import { canTransition, isStaleRequest } from "@/lib/booking-flow"
import { bookingDateSpan } from "@/lib/booking-span"
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

  // Soft-hold: the guide accepts one request per guide + date span. If another
  // request whose date span overlaps this one is already guide_approved (awaiting
  // the trekker's final verification) or confirmed, the guide can't accept this
  // one too — UNLESS the overlapping approval is stale (the trekker hasn't
  // finalized within 6 hours), in which case the guide may accept a new request
  // instead. The date is only hard-locked (booked) once a trekker finalizes.
  const spanSet = new Set(bookingDateSpan(booking.booking_date, booking.trek_days))
  const { data: existing } = await supabase
    .from("bookings")
    .select("id, status, created_at, guide_responded_at, booking_date, trek_days")
    .eq("guide_id", booking.guide_id)
    .in("status", ["guide_approved", "confirmed"])
    .neq("id", booking.id)
    .limit(50)

  for (const ex of existing ?? []) {
    const exSpan = bookingDateSpan(ex.booking_date, ex.trek_days)
    const overlaps = exSpan.some((d) => spanSet.has(d))
    if (!overlaps) continue

    // A confirmed (paid + verified) booking for this span is a hard block.
    if (ex.status === "confirmed") {
      return NextResponse.json({
        error: "Guide is already booked for this date range.",
      }, { status: 400 })
    }

    // guide_approved: block unless it's stale (>6h since the guide accepted,
    // i.e. the trekker never finalized). Counting from guide_responded_at (not
    // created_at) means a request accepted just now isn't instantly stale.
    const approvedAt = ex.guide_responded_at ?? ex.created_at
    if (!isStaleRequest(approvedAt)) {
      return NextResponse.json({
        error: "You've already accepted another request for this date range. The date becomes locked once that trekker finalizes.",
      }, { status: 400 })
    }
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
    message: `${user.user_metadata?.name || "Your guide"} accepted your ${booking.trek_id} trek on ${booking.booking_date}. Pay the booking fee to confirm in your bookings.`,
  })

  // Notify all admins about the guide approval
  const { data: adminProfiles } = await supabase
    .from("profiles")
    .select("id")
    .eq("account_type", "admin")

  if (adminProfiles && adminProfiles.length > 0) {
    await supabase.from("notifications").insert(
      adminProfiles.map((admin) => ({
        user_id: admin.id,
        type: "booking_status_change",
        booking_id: booking.id,
        message: `Guide approved booking: ${user.user_metadata?.name || "A guide"} accepted booking #${id} for ${booking.booking_date}.`,
      }))
    )
  }

  return NextResponse.json({ booking: updated })
}, { source: "bookings.approveGuide", route: "/api/bookings/[id]/approve-guide" })