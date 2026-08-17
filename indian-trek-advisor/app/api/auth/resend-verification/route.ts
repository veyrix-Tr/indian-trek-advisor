import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { sendVerificationEmail } from "@/lib/email/brevo"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

export async function POST(request: Request) {
  const body = await request.json()
  const { email, name, password } = body

  if (!email) {
    return NextResponse.json({ error: "Email is required" }, { status: 400 })
  }

  if (!password || typeof password !== "string") {
    return NextResponse.json(
      { error: "Password is required to resend verification" },
      { status: 400 },
    )
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })

  // Only resend for an existing, unconfirmed user.
  const { data: users } = await supabase.auth.admin.listUsers({ page: 1, perPage: 100 })
  const user = (users?.users ?? []).find(
    (u) => u.email?.toLowerCase() === email.toLowerCase(),
  )
  if (!user) {
    return NextResponse.json({ error: "No account found for that email" }, { status: 404 })
  }
  if (user.email_confirmed_at) {
    return NextResponse.json({ error: "This email is already verified" }, { status: 400 })
  }

  const siteOrigin = process.env.NEXT_PUBLIC_SITE_URL || new URL(request.url).origin
  const { data: linkData, error: linkError } = await supabase.auth.admin.generateLink({
    type: "signup",
    email,
    password,
    options: { redirectTo: `${siteOrigin}/auth/confirm` },
  })
  const actionLink = linkData?.properties?.action_link

  if (linkError || !actionLink) {
    return NextResponse.json(
      { error: linkError?.message || "Could not create a verification link" },
      { status: 500 },
    )
  }

  const sent = await sendVerificationEmail({
    to: email,
    name: name || user.email || email,
    actionLink,
  })

  return NextResponse.json({ sent })
}