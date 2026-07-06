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

  // Verify user is guide or admin
  const { data: booking } = await supabase
    .from("bookings")
    .select("*")
    .eq("id", id)
    .single()

  if (!booking) {
    return NextResponse.json({ error: "Booking not found" }, { status: 404 })
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("account_type")
    .eq("id", user.id)
    .single()

  const canComplete = booking.guide_id === user.id || profile?.account_type === 'admin'
  if (!canComplete) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
  }

  if (booking.status !== 'confirmed') {
    return NextResponse.json({ error: "Booking must be confirmed to complete" }, { status: 400 })
  }

  // Update booking status
  const { data: updated, error } = await supabase
    .from("bookings")
    .update({
      status: 'completed',
      trek_completion_date: new Date().toISOString().split('T')[0]
    })
    .eq("id", id)
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // Send SMS to trekker for rating
  const { data: trekkerProfile } = await supabase
    .from("profiles")
    .select("phone")
    .eq("id", booking.trekker_id)
    .single()

  if (trekkerProfile?.phone) {
    // Get guide name for SMS
    const { data: guideProfile } = await supabase
      .from("profiles")
      .select("name")
      .eq("id", booking.guide_id)
      .single()

    const { sendRatingRequestSMS } = await import("@/lib/sms/brevo")
    await sendRatingRequestSMS(
      trekkerProfile.phone,
      guideProfile?.name || 'Guide',
      booking.trek_id
    )
  }

  return NextResponse.json({ booking: updated })
}
