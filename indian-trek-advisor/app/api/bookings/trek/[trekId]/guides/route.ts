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
  // is unavailable if they've booked the date (an accepted booking) or marked
  // it unavailable themselves.
  let guides = associations || []
  if (date) {
    const { data: availability } = await supabase
      .from("guide_availability")
      .select("guide_id")
      .eq("date", date)
      .in("status", ['booked', 'unavailable'])

    const unavailableGuideIds = new Set(availability?.map(a => a.guide_id) || [])
    guides = guides.filter(g => !unavailableGuideIds.has(g.guides.id))
  }

  return NextResponse.json({ guides })
}
