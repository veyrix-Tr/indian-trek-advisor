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

  const body = await request.json()
  const { reason } = body

  // Verify user is guide or admin
  const { data: booking } = await supabase
    .from("bookings")
    .select("*")
    .eq("id", params.id)
    .single()

  if (!booking) {
    return NextResponse.json({ error: "Booking not found" }, { status: 404 })
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("account_type")
    .eq("id", user.id)
    .single()

  const canCancel = booking.guide_id === user.id || profile?.account_type === 'admin'
  if (!canCancel) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
  }

  // Update booking status
  const { data: updated, error } = await supabase
    .from("bookings")
    .update({ status: 'cancelled' })
    .eq("id", params.id)
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // Free up the date
  await supabase
    .from("guide_availability")
    .update({ status: 'available', booking_id: null })
    .eq("booking_id", params.id)

  // TODO: Send SMS notifications

  return NextResponse.json({ booking: updated })
}
