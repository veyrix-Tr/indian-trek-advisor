import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { createClient as createServerSupabaseClient } from "@/utils/supabase/server"

export async function GET(request: Request) {
  const authClient = await createServerSupabaseClient()
  const { data: { user }, error: authError } = await authClient.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { data: guide, error } = await supabase
    .from("guides")
    .select("*, profiles(*), guide_trek_associations(*)")
    .eq("user_id", user.id)
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const { data: reviews } = await supabase
    .from("guide_ratings")
    .select("id, rating, review, created_at, trekker:profiles(name), booking:bookings(trek_id)")
    .eq("guide_id", guide.id)
    .order("created_at", { ascending: false })

  return NextResponse.json({ guide: { ...guide, reviews: reviews || [] } })
}

export async function PUT(request: Request) {
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
  const { experience, phone, base_location, certifications, known_treks } = body

  const { data: guide, error } = await supabase
    .from("guides")
    .update({
      experience,
      phone,
      base_location,
      certifications,
      known_treks,
      updated_at: new Date().toISOString()
    })
    .eq("user_id", user.id)
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ guide })
}
