import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { createClient as createServerSupabaseClient } from "@/utils/supabase/server"
import { computeDisplayRating } from "@/lib/guide-rating"

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

  // Update guide's displayed rating — a weighted blend of real reviews plus
  // a baseline, not a raw average (see lib/guide-rating.ts for why).
  const { data: ratings } = await supabase
    .from("guide_ratings")
    .select("rating")
    .eq("guide_id", booking.guide_id)

  const { rating: displayRating, totalRatings } = computeDisplayRating(
    (ratings ?? []).map((r) => r.rating)
  )

  const { data: guideRow, error: updateError } = await supabase
    .from("guides")
    .update({
      rating: displayRating,
      total_ratings: totalRatings
    })
    .eq("id", booking.guide_id)
    .select("user_id")
    .single()

  if (updateError) {
    // The review itself was already saved above — don't fail the request,
    // but this must never be silently swallowed again.
    console.error("Failed to update guide's blended rating:", updateError.message)
  }

  if (guideRow?.user_id) {
    await supabase.from("notifications").insert({
      user_id: guideRow.user_id,
      type: "review_received",
      booking_id,
      message: `You received a ${rating}-star review for your ${booking.trek_id} trek.`,
    })
  }

  // Increment trekker's review_count
  const { data: trekker } = await supabase
    .from("trekkers")
    .select("review_count")
    .eq("user_id", user.id)
    .single()

  if (trekker) {
    await supabase
      .from("trekkers")
      .update({ review_count: (trekker.review_count || 0) + 1 })
      .eq("user_id", user.id)
  }

  return NextResponse.json({ rating: newRating })
}
