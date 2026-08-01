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

  const { data: guide, error: guideError } = await supabase
    .from("guides")
    .select("id")
    .eq("user_id", user.id)
    .single()

  if (guideError || !guide) {
    return NextResponse.json({ error: "Guide profile not found" }, { status: 404 })
  }

  const { data: rates, error } = await supabase
    .from("guide_trek_associations")
    .select("id, trek_id, base_rate")
    .eq("guide_id", guide.id)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ rates })
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
  const { id, base_rate } = body

  if (!id || typeof base_rate !== "number" || base_rate <= 0) {
    return NextResponse.json({ error: "A valid id and base_rate are required" }, { status: 400 })
  }

  const { data: guide, error: guideError } = await supabase
    .from("guides")
    .select("id")
    .eq("user_id", user.id)
    .single()

  if (guideError || !guide) {
    return NextResponse.json({ error: "Guide profile not found" }, { status: 404 })
  }

  const { data: rate, error } = await supabase
    .from("guide_trek_associations")
    .update({ base_rate })
    .eq("id", id)
    .eq("guide_id", guide.id) // scope the update to the calling guide's own rows only
    .select()
    .maybeSingle()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  if (!rate) {
    return NextResponse.json({ error: "Rate not found" }, { status: 404 })
  }

  return NextResponse.json({ rate })
}
