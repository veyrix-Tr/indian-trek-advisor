import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { sendOtpEmail } from "@/lib/email/brevo"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

export async function POST(request: Request) {
  const { email } = await request.json()

  if (!email || typeof email !== "string") {
    return NextResponse.json({ error: "Email is required" }, { status: 400 })
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })

  // Find the account so we can generate a recovery link for it.
  const { data: users } = await supabase.auth.admin.listUsers({ page: 1, perPage: 100 })
  const user = (users?.users ?? []).find(
    (u) => u.email?.toLowerCase() === email.toLowerCase(),
  )

  if (!user) {
    return NextResponse.json(
      { error: "No account found with that email. Please check and try again." },
      { status: 404 },
    )
  }

  const { data: linkData, error: linkError } = await supabase.auth.admin.generateLink({
    type: "recovery",
    email,
  })
  const otp = linkData?.properties?.email_otp

  if (!linkError && otp) {
    const sent = await sendOtpEmail({ to: email, otp, purpose: "password reset" })
    return NextResponse.json({ sent })
  }

  console.error("Could not generate password reset OTP", linkError?.message)
  return NextResponse.json({ sent: false }, { status: 500 })
}