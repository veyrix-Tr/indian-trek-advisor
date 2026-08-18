import { NextResponse } from "next/server"
import { getAdminClient, getAuthUser } from "@/lib/supabase-admin"

// Admin overview: aggregate booking stats + revenue. Admin-only, uses the
// service-role client so it reflects real totals regardless of RLS.
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

  const { data: bookings, error } = await supabase
    .from("bookings")
    .select("status, total_amount, payment_status")

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const statusCount: Record<string, number> = {}
  let revenue = 0
  let paidRevenue = 0

  for (const b of bookings || []) {
    statusCount[b.status] = (statusCount[b.status] || 0) + 1
    if (b.status === "confirmed" || b.status === "completed") {
      revenue += (b.total_amount as number) || 0
    }
    if (b.payment_status === "paid") {
      paidRevenue += (b.total_amount as number) || 0
    }
  }

  return NextResponse.json({
    total: (bookings || []).length,
    statusCount,
    revenue,
    paidRevenue,
  })
}