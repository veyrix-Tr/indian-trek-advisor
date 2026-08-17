import { NextResponse } from "next/server"
import { getAdminClient, getAuthUser } from "@/lib/supabase-admin"

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const user = await getAuthUser()
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const supabase = getAdminClient()

  const { data: booking } = await supabase
    .from("bookings")
    .select("*")
    .eq("id", id)
    .single()

  if (!booking) {
    return NextResponse.json({ error: "Booking not found" }, { status: 404 })
  }

  const { data: guide } = await supabase
    .from("guides")
    .select("id")
    .eq("user_id", user.id)
    .single()

  const { data: profile } = await supabase
    .from("profiles")
    .select("account_type")
    .eq("id", user.id)
    .single()

  const isAdmin = profile?.account_type === "admin"
  const isGuide = Boolean(guide) && booking.guide_id === guide?.id
  const isTrekker = booking.trekker_id === user.id

  if (!isAdmin && !isGuide && !isTrekker) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
  }

  const { data: history, error } = await supabase
    .from("booking_status_history")
    .select("*, actor:profiles(name)")
    .eq("booking_id", id)
    .order("created_at", { ascending: true })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ history })
}