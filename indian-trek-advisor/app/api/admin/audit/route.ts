import { NextResponse } from "next/server"
import { getAdminClient, getAuthUser } from "@/lib/supabase-admin"

// Admin audit log: return booking status history with booking context
// (trek, guide, trekker, date). Admin-only.
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
  const search = url.searchParams.get("search")?.trim() || ""
  const toStatus = url.searchParams.get("to")?.trim() || ""
  const actorRole = url.searchParams.get("actor")?.trim() || ""
  const limit = Math.min(200, Math.max(1, Number(url.searchParams.get("limit")) || 100))
  const offset = Math.max(0, Number(url.searchParams.get("offset")) || 0)

  let query = supabase
    .from("booking_status_history")
    .select(
      `*,
       actor:profiles(name, email),
       booking:bookings(trek_id, booking_date, trek_days, status, guide_id, trekker_id)`
    )
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1)

  if (toStatus) query = query.eq("to_status", toStatus)
  if (actorRole) query = query.eq("actor_role", actorRole)

  const { data: history, error, count } = await query

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // Post-filter by free-text search across note/actor/booking fields.
  let rows = history || []
  if (search) {
    const s = search.toLowerCase()
    rows = rows.filter((h: any) =>
      h.note?.toLowerCase().includes(s) ||
      h.actor?.name?.toLowerCase().includes(s) ||
      h.actor?.email?.toLowerCase().includes(s) ||
      h.actor_role?.toLowerCase().includes(s) ||
      String(h.booking?.trek_id || "").toLowerCase().includes(s) ||
      String(h.booking?.booking_date || "").includes(s) ||
      h.to_status?.toLowerCase().includes(s) ||
      h.from_status?.toLowerCase().includes(s)
    )
  }

  return NextResponse.json({ history: rows, total: count })
}