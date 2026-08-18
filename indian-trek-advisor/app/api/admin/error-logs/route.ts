import { NextResponse } from "next/server"
import { getAdminClient, getAuthUser } from "@/lib/supabase-admin"

// Admin error log viewer: returns recorded app_error_logs rows. Admin-only;
// the table has no RLS policies so only the service-role client can read it.
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
  const source = url.searchParams.get("source")?.trim() || ""
  const limit = Math.min(200, Math.max(1, Number(url.searchParams.get("limit")) || 100))
  const offset = Math.max(0, Number(url.searchParams.get("offset")) || 0)

  let query = supabase
    .from("app_error_logs")
    .select("*", { count: "exact" })
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1)

  if (source) query = query.eq("source", source)

  const { data: logs, error, count } = await query

  if (error) {
    // The migration may not be applied yet — tell the admin instead of failing.
    return NextResponse.json({ error: error.message, migrationRequired: true }, { status: 500 })
  }

  return NextResponse.json({ logs: logs || [], total: count || 0 })
}