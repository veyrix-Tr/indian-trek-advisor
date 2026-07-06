import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

export async function GET(
  request: Request,
  { params }: { params: { trekId: string } }
) {
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
    .eq("trek_id", params.trekId)

  if (assocError) {
    return NextResponse.json({ error: assocError.message }, { status: 500 })
  }

  // Filter by availability if date provided
  let guides = associations || []
  if (date) {
    const { data: availability } = await supabase
      .from("guide_availability")
      .select("guide_id")
      .eq("date", date)
      .in("status", ['booked', 'unavailable'])

    const unavailableGuideIds = availability?.map(a => a.guide_id) || []
    guides = guides.filter(g => !unavailableGuideIds.includes(g.guides.id))
  }

  return NextResponse.json({ guides })
}
