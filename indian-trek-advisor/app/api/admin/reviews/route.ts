import { NextResponse } from "next/server"
import { getAdminClient, getAuthUser } from "@/lib/supabase-admin"

// Admin reviews view: all guide ratings with guide + trekker context.
// Admin-only. Optionally filtered by guide and/or text search.
export async function GET(request: Request) {
  const user = await getAuthUser()
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const supabase = getAdminClient()
  const { data: profile } = await supabase
    .from("profiles")
    .select("account_type")
    .eq("id", user.id)
    .single()

  if (profile?.account_type !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const url = new URL(request.url)
  const guideId = url.searchParams.get("guide_id")?.trim() || ""
  const search = url.searchParams.get("search")?.trim() || ""

  let query = supabase
    .from("guide_ratings")
    .select(
      `id, rating, review, created_at,
       trekker:profiles(name),
       booking:bookings(trek_id, booking_date),
       guide:guides(user_id, profiles(name, id))`
    )
    .order("created_at", { ascending: false })

  if (guideId) query = query.eq("guide_id", guideId)

  const { data: reviews, error } = await query

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const filtered = search
    ? (reviews || []).filter((r: any) => {
        const guideName = r.guide?.profiles?.name?.toLowerCase() || ""
        const trekkerName = r.trekker?.name?.toLowerCase() || ""
        const text = String(r.review || "").toLowerCase()
        const q = search.toLowerCase()
        return guideName.includes(q) || trekkerName.includes(q) || text.includes(q)
      })
    : (reviews || [])

  return NextResponse.json({ reviews: filtered })
}