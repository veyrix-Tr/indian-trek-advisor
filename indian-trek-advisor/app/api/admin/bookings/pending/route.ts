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

  // Verify admin
  const { data: profile } = await supabase
    .from("profiles")
    .select("account_type")
    .eq("id", user.id)
    .single()

  if (!profile || profile.account_type !== 'admin') {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
  }

  const { data: bookings, error } = await supabase
    .from("bookings")
    .select("*, profiles(*), guides(*, profiles(*))")
    .in("status", ['guide_approved', 'admin_approved'])

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ bookings })
}
