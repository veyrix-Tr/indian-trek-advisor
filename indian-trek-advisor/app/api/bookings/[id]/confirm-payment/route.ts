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
  const { amount } = body

  // Verify user is the trekker
  const { data: booking } = await supabase
    .from("bookings")
    .select("*")
    .eq("id", params.id)
    .single()

  if (!booking || booking.trekker_id !== user.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
  }

  // Update booking
  const { data: updated, error } = await supabase
    .from("bookings")
    .update({
      status: 'confirmed',
      payment_status: 'paid',
      payment_amount: amount
    })
    .eq("id", params.id)
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // TODO: Send SMS to guide and trekker with contact info

  return NextResponse.json({ booking: updated })
}
