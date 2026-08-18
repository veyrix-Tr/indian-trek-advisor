import { NextResponse } from "next/server"
import { getAdminClient, getAuthUser } from "@/lib/supabase-admin"

// Returns the current trekker's active booking for a trek + date (if any), so
// the guide cards can show "request pending / guide accepted / confirmed"
// instead of discouraging duplicate requests.
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ trekId: string }> }
) {
  const { trekId } = await params
  const user = await getAuthUser()
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const url = new URL(_request.url)
  const date = url.searchParams.get("date")
  if (!date) {
    return NextResponse.json({ booking: null })
  }

  const supabase = getAdminClient()

  const { data: booking } = await supabase
    .from("bookings")
    .select("id, guide_id, status")
    .eq("trekker_id", user.id)
    .eq("trek_id", trekId)
    .eq("booking_date", date)
    .in("status", ["pending", "guide_approved", "confirmed"])
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle()

  return NextResponse.json({ booking: booking || null })
}