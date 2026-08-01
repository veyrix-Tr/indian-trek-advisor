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

  const { searchParams } = new URL(request.url)
  const status = searchParams.get('status')

  let query = supabase
    .from("bookings")
    .select("*, trekker:profiles!bookings_trekker_id_fkey(*), guides(*)")
    .eq("guide_id", guide.id)

  if (status) {
    query = query.eq("status", status)
  }

  const { data: bookings, error } = await query

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ bookings })
}
