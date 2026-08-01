import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { createClient as createServerSupabaseClient } from "@/utils/supabase/server"

export async function POST(request: Request) {
  const authClient = await createServerSupabaseClient()
  const { data: { user }, error: authError } = await authClient.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const body = await request.json()
  const { trek_id, guide_id, booking_date, notes } = body

  // Check if guide is available on this date
  const { data: availability, error: availError } = await supabase
    .from("guide_availability")
    .select("*")
    .eq("guide_id", guide_id)
    .eq("date", booking_date)
    .single()

  if (availability && availability.status !== 'available') {
    return NextResponse.json({ error: "Guide not available on this date" }, { status: 400 })
  }

  // Create booking
  const { data: booking, error: bookingError } = await supabase
    .from("bookings")
    .insert({
      trek_id,
      trekker_id: user.id,
      guide_id,
      booking_date,
      notes,
      status: 'pending',
      payment_status: 'pending'
    })
    .select()
    .single()

  if (bookingError) {
    return NextResponse.json({ error: bookingError.message }, { status: 500 })
  }

  // Mark date as booked
  await supabase
    .from("guide_availability")
    .upsert({
      guide_id,
      date: booking_date,
      status: 'booked',
      booking_id: booking.id
    }, { onConflict: "guide_id,date" })

  // Send SMS notification to guide
  const { data: guideData } = await supabase
    .from("guides")
    .select("*, profiles(*)")
    .eq("id", guide_id)
    .single()

  // In-app notification for the guide's own dashboard bell.
  // notifications.user_id is the guide's auth id (guides.user_id), not guides.id.
  if (guideData?.user_id) {
    await supabase.from("notifications").insert({
      user_id: guideData.user_id,
      type: "booking_request",
      booking_id: booking.id,
      message: `${user.user_metadata?.name || "A trekker"} requested a booking for ${booking_date}.`,
    })
  }

  if (guideData?.profiles?.phone) {
    const { sendBookingRequestSMS } = await import("@/lib/sms/brevo")
    await sendBookingRequestSMS(
      guideData.profiles.phone,
      user.user_metadata?.name || 'Trekker',
      trek_id,
      booking_date
    )
  }

  return NextResponse.json({ booking })
}
