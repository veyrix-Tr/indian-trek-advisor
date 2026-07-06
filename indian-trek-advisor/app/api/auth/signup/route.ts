import { NextResponse } from "next/server"
import { createServerClient } from "@supabase/ssr"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

export async function POST(request: Request) {
  const { email, password, name, account_type } = await request.json()

  if (!email || !password || !name || !account_type) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
  }

  if (!["trekker", "guide"].includes(account_type)) {
    return NextResponse.json({ error: "Invalid account type" }, { status: 400 })
  }

  const supabase = createServerClient(supabaseUrl, serviceRoleKey, {
    cookies: {
      getAll() { return [] },
      setAll() {},
    },
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })

  const { data, error } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { name, account_type },
  })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }

  const userId = data.user!.id

  // Insert profile directly (bypass triggers to avoid race conditions)
  await supabase.from("profiles").upsert({
    id: userId,
    name,
    email,
    account_type,
    updated_at: new Date().toISOString(),
  }).maybeSingle()

  // Insert role-specific row directly
  if (account_type === "trekker") {
    await supabase.from("trekkers").upsert({
      user_id: userId,
      saved_treks: [],
      review_count: 0,
    }).maybeSingle()
  } else {
    await supabase.from("guides").upsert({
      user_id: userId,
    }).maybeSingle()
  }

  return NextResponse.json({ user: data.user })
}
