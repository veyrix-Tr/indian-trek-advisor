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

  const { data: guide, error: guideError } = await supabase
    .from("guides")
    .select("id")
    .eq("user_id", user.id)
    .single()

  if (guideError || !guide) {
    return NextResponse.json({ error: "Guide profile not found" }, { status: 404 })
  }

  const body = await request.json()
  // dates = the guide's FULL set of dates they are unavailable on.
  // Unmarked dates are available by default, so the guide only sends the
  // days they're blocking. On save we reconcile: unblock dates that were
  // previously unavailable but are no longer in the set.
  const { dates } = body
  const blocking = Array.isArray(dates) ? (dates as string[]) : []

  const updates = blocking.map((date: string) => ({
    guide_id: guide.id,
    date,
    status: 'unavailable'
  }))

  const { data: existing } = await supabase
    .from("guide_availability")
    .select("date")
    .eq("guide_id", guide.id)
    .eq("status", "unavailable")

  const blockedSet = new Set(blocking)
  const toUnblock = (existing ?? [])
    .map((r) => r.date)
    .filter((d) => !blockedSet.has(d))

  if (toUnblock.length > 0) {
    // Unmarked dates are available by default; just delete the stale rows so
    // the date reverts to bookable (getting it out of 'unavailable' status).
    await supabase
      .from("guide_availability")
      .delete()
      .eq("guide_id", guide.id)
      .in("status", ["unavailable"])
      .in("date", toUnblock)
  }

  const { data, error } = await supabase
    .from("guide_availability")
    .upsert(updates, { onConflict: "guide_id,date" })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}

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

  const { data: availability, error } = await supabase
    .from("guide_availability")
    .select("*")
    .eq("guide_id", guide.id)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ availability })
}
