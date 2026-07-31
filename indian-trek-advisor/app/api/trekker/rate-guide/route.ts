import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

export async function POST(request: Request) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const body = await request.json()
  const { booking_id, rating, review } = body

  // Verify booking exists and belongs to user
  const { data: booking } = await supabase
    .from("bookings")
    .select("*")
    .eq("id", booking_id)
    .eq("trekker_id", user.id)
    .single()

  if (!booking) {
    return NextResponse.json({ error: "Booking not found" }, { status: 404 })
  }

  if (booking.status !== 'completed') {
    return NextResponse.json({ error: "Booking must be completed to rate" }, { status: 400 })
  }

  // Create rating
  const { data: newRating, error: ratingError } = await supabase
    .from("guide_ratings")
    .insert({
      guide_id: booking.guide_id,
      trekker_id: user.id,
      booking_id,
      rating,
      review
    })
    .select()
    .single()

  if (ratingError) {
    return NextResponse.json({ error: ratingError.message }, { status: 500 })
  }

  // Update guide average rating
  const { data: ratings } = await supabase
    .from("guide_ratings")
    .select("rating")
    .eq("guide_id", booking.guide_id)

  const avgRating = (ratings?.reduce((sum, r) => sum + r.rating, 0) ?? 0) / (ratings?.length || 1)

  const { data: guideRow } = await supabase
    .from("guides")
    .update({
      rating: avgRating,
      total_ratings: ratings?.length || 0
    })
    .eq("id", booking.guide_id)
    .select("user_id")
    .single()

  if (guideRow?.user_id) {
    await supabase.from("notifications").insert({
      user_id: guideRow.user_id,
      type: "review_received",
      booking_id,
      message: `You received a ${rating}-star review for your ${booking.trek_id} trek.`,
    })
  }

  return NextResponse.json({ rating: newRating })
}
