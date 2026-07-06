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

  // Verify user is admin
  const { data: profile } = await supabase
    .from("profiles")
    .select("account_type")
    .eq("id", user.id)
    .single()

  if (!profile || profile.account_type !== 'admin') {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
  }

  // Get current booking
  const { data: booking } = await supabase
    .from("bookings")
    .select("*")
    .eq("id", id)
    .single()

  if (!booking) {
    return NextResponse.json({ error: "Booking not found" }, { status: 404 })
  }

  // Verify booking is in correct state
  if (booking.status !== 'guide_approved') {
    return NextResponse.json({ error: "Booking must be guide-approved before admin approval" }, { status: 400 })
  }

  // Update booking status
  const { data: updated, error } = await supabase
    .from("bookings")
    .update({ status: 'admin_approved' })
    .eq("id", id)
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // Get guide name for SMS
  const { data: guideProfile } = await supabase
    .from("profiles")
    .select("name")
    .eq("id", updated.guide_id)
    .single()

  // Send SMS to trekker
  const { data: trekkerProfile } = await supabase
    .from("profiles")
    .select("phone")
    .eq("id", updated.trekker_id)
    .single()

  // Get base rate from guide_trek_associations
  const { data: association } = await supabase
    .from("guide_trek_associations")
    .select("base_rate")
    .eq("guide_id", updated.guide_id)
    .eq("trek_id", updated.trek_id)
    .single()

  const amount = association?.base_rate || 0

  if (trekkerProfile?.phone) {
    const { sendAdminApprovalSMS } = await import("@/lib/sms/brevo")
    await sendAdminApprovalSMS(
      trekkerProfile.phone,
      guideProfile?.name || 'Guide',
      updated.trek_id,
      amount
    )
  }

  return NextResponse.json({ booking: updated })
}
