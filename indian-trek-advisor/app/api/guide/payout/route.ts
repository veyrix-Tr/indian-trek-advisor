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

  const { data: payout, error } = await supabase
    .from("guide_payout_details")
    .select("*")
    .eq("guide_id", guide.id)
    .maybeSingle()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ payout })
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

  const { data: guide, error: guideError } = await supabase
    .from("guides")
    .select("id")
    .eq("user_id", user.id)
    .single()

  if (guideError || !guide) {
    return NextResponse.json({ error: "Guide profile not found" }, { status: 404 })
  }

  const body = await request.json()
  const { method, upi_id, bank_account_number, bank_ifsc, bank_account_name } = body

  if (method !== "upi" && method !== "bank_transfer") {
    return NextResponse.json({ error: "Invalid payout method" }, { status: 400 })
  }
  if (method === "upi" && !upi_id?.trim()) {
    return NextResponse.json({ error: "UPI ID is required" }, { status: 400 })
  }
  if (method === "bank_transfer" && (!bank_account_number?.trim() || !bank_ifsc?.trim() || !bank_account_name?.trim())) {
    return NextResponse.json({ error: "Account number, IFSC, and account name are all required" }, { status: 400 })
  }

  const { data: payout, error } = await supabase
    .from("guide_payout_details")
    .upsert(
      {
        guide_id: guide.id,
        method,
        upi_id: method === "upi" ? upi_id.trim() : null,
        bank_account_number: method === "bank_transfer" ? bank_account_number.trim() : null,
        bank_ifsc: method === "bank_transfer" ? bank_ifsc.trim().toUpperCase() : null,
        bank_account_name: method === "bank_transfer" ? bank_account_name.trim() : null,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "guide_id" }
    )
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ payout })
}
