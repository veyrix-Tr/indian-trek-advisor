import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  // Verify user is the guide
  const { data: booking } = await supabase
    .from("bookings")
    .select("*")
    .eq("id", params.id)
    .single()

  if (!booking || booking.guide_id !== user.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
  }

  // Update booking status
  const { data: updated, error } = await supabase
    .from("bookings")
    .update({ status: 'guide_approved' })
    .eq("id", params.id)
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // TODO: Send SMS to admin

  return NextResponse.json({ booking: updated })
}
