import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { createClient as createServerSupabaseClient } from "@/utils/supabase/server"

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const authClient = await createServerSupabaseClient()
  const { data: { user }, error: authError } = await authClient.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { data: guide } = await supabase
    .from("guides")
    .select("id")
    .eq("user_id", user.id)
    .single()

  // Verify user is the guide
  const { data: booking } = await supabase
    .from("bookings")
    .select("*")
    .eq("id", id)
    .single()

  if (!booking || !guide || booking.guide_id !== guide.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
  }

  // Update booking status
  const { data: updated, error } = await supabase
    .from("bookings")
    .update({ status: 'guide_approved', guide_responded_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // Notify the trekker their guide approved the booking
  await supabase.from("notifications").insert({
    user_id: booking.trekker_id,
    type: "booking_status_change",
    booking_id: booking.id,
    message: `Your guide approved your ${booking.trek_id} trek on ${booking.booking_date}. Awaiting admin confirmation.`,
  })

  // Send SMS to admin
  const { data: adminProfile } = await supabase
    .from("profiles")
    .select("phone")
    .eq("account_type", "admin")
    .limit(1)
    .single()

  if (adminProfile?.phone) {
    // Get trekker name for SMS
    const { data: trekkerProfile } = await supabase
      .from("profiles")
      .select("name")
      .eq("id", booking.trekker_id)
      .single()

    const { sendGuideApprovalSMS } = await import("@/lib/sms/brevo")
    await sendGuideApprovalSMS(
      adminProfile.phone,
      user.user_metadata?.name || 'Guide',
      trekkerProfile?.name || 'Trekker',
      booking.trek_id
    )
  }

  return NextResponse.json({ booking: updated })
}
