import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
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
    .eq("id", id)
    .single()

  if (!booking || booking.trekker_id !== user.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
  }

  // Verify booking is in correct state
  if (booking.status !== 'admin_approved') {
    return NextResponse.json({ error: "Booking must be admin-approved before payment" }, { status: 400 })
  }

  // Update booking
  const { data: updated, error } = await supabase
    .from("bookings")
    .update({
      status: 'confirmed',
      payment_status: 'paid',
      payment_amount: amount
    })
    .eq("id", id)
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // Get guide and trekker profiles for SMS
  const { data: guideProfile } = await supabase
    .from("profiles")
    .select("phone, name")
    .eq("id", booking.guide_id)
    .single()

  const { data: trekkerProfile } = await supabase
    .from("profiles")
    .select("phone, name")
    .eq("id", booking.trekker_id)
    .single()

  if (guideProfile?.phone && trekkerProfile?.phone) {
    const { sendPaymentConfirmationSMS } = await import("@/lib/sms/brevo")
    await sendPaymentConfirmationSMS(
      guideProfile.phone,
      trekkerProfile.phone,
      guideProfile.name || 'Guide',
      trekkerProfile.name || 'Trekker',
      booking.trek_id
    )
  }

  return NextResponse.json({ booking: updated })
}
