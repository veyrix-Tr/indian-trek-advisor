import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

export async function GET(
  request: Request,
  { params }: { params: Promise<{ trekId: string }> }
) {
  const { trekId } = await params
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { searchParams } = new URL(request.url)
  const date = searchParams.get('date')

  // Get guides associated with this trek
  const { data: associations, error: assocError } = await supabase
    .from("guide_trek_associations")
    .select("*, guides(*, profiles(*))")
    .eq("trek_id", trekId)

  if (assocError) {
    return NextResponse.json({ error: assocError.message }, { status: 500 })
  }

  // When a date is chosen, return ONLY guides available on that date. A guide
  // is unavailable if they've marked it unavailable themselves, or if the date
  // falls within a confirmed (final-verified) booking's multi-day span.
  let guides = associations || []
  if (date) {
    const { data: availability } = await supabase
      .from("guide_availability")
      .select("guide_id")
      .eq("date", date)
      .in("status", ['booked', 'unavailable'])

    const unavailableGuideIds = new Set(availability?.map(a => a.guide_id) || [])

    // Include spans of confirmed bookings (a 6-day trek occupies 6 dates).
    const { data: confirmedBookings } = await supabase
      .from("bookings")
      .select("guide_id, booking_date, trek_days")
      .eq("status", "confirmed")

    const { bookingDateSpan } = await import("@/lib/booking-span")
    for (const b of confirmedBookings ?? []) {
      if (bookingDateSpan(b.booking_date, b.trek_days).includes(date)) {
        unavailableGuideIds.add(b.guide_id)
      }
    }

    guides = guides.filter(g => !unavailableGuideIds.has(g.guides.id))
  }

  return NextResponse.json({ guides })
}
