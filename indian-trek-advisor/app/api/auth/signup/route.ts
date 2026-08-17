import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { cloudinary } from "@/lib/cloudinary"
import { sendOtpEmail } from "@/lib/email/brevo"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

function parseJSONArray(value: FormDataEntryValue | null): string[] {
  if (typeof value !== "string") return []
  try {
    const parsed = JSON.parse(value)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

async function uploadToCloudinary(file: File | null, folder: string) {
  if (!file) return null
  const bytes = await file.arrayBuffer()
  const buffer = Buffer.from(bytes)
  const cleanName = file.name.replace(/[^a-zA-Z0-9.-]/g, "_").replace(/\.[^.]+$/, "")
  const publicId = `${Date.now()}-${cleanName}`
  const result = await new Promise<{ secure_url: string }>((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: `trekadvisor/${folder}`,
        public_id: publicId,
        resource_type: "auto",
      },
      (error, result) => {
        if (error) reject(error)
        else resolve(result as { secure_url: string })
      },
    )
    stream.end(buffer)
  })
  return result.secure_url
}

export async function POST(request: Request) {
  const formData = await request.formData()

  const email = String(formData.get("email") || "")
  const password = String(formData.get("password") || "")
  const name = String(formData.get("name") || "")
  const account_type = String(formData.get("account_type") || "")

  if (!email || !password || !name || !account_type) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
  }

  if (!["trekker", "guide"].includes(account_type)) {
    return NextResponse.json({ error: "Invalid account type" }, { status: 400 })
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })

  // Create the user WITHOUT auto-confirming their email so verification
  // is required via the Brevo email we send below.
  const { data, error } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: false,
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

  if (account_type === "trekker") {
    await supabase.from("trekkers").upsert({
      user_id: userId,
      saved_treks: [],
      review_count: 0,
    }).maybeSingle()
  } else {
    // Guide: upload documents and insert all profile fields server-side,
    // since the user has no authenticated session before verifying email.
    const idProofFile = formData.get("idProof") as File | null
    const certFile = formData.get("cert") as File | null

    const [idProofUrl, certUrl] = await Promise.all([
      uploadToCloudinary(idProofFile, "guide-documents"),
      uploadToCloudinary(certFile, "guide-certificates"),
    ])

    const phone = String(formData.get("phone") || "")
    const guideRow: Record<string, unknown> = { user_id: userId }
    if (idProofUrl) guideRow.id_proof_url = idProofUrl
    if (certUrl) guideRow.cert_doc_url = certUrl
    if (phone) guideRow.phone = phone
    if (formData.get("experience")) guideRow.experience = String(formData.get("experience"))
    if (formData.get("address")) guideRow.base_location = String(formData.get("address"))
    const certifications = parseJSONArray(formData.get("certifications"))
    if (certifications.length > 0) guideRow.certifications = certifications
    const knownTreks = parseJSONArray(formData.get("knownTreks"))
    if (knownTreks.length > 0) guideRow.known_treks = knownTreks

    await supabase.from("guides").upsert(guideRow).maybeSingle()

    // Keep phone in sync on the profile row too
    if (phone) {
      await supabase.from("profiles").update({ phone }).eq("id", userId).maybeSingle()
    }
  }

  // Generate an OTP for email verification and send it via Brevo.
  // Also keeping this consistent so we don't need a separate field of the project.
  const { data: linkData } = await supabase.auth.admin.generateLink({
    type: "signup",
    email,
    password,
  })
  const otp = linkData?.properties?.email_otp

  let otpSent = false
  if (otp) {
    otpSent = await sendOtpEmail({ to: email, name, otp, purpose: "verification" })
  } else {
    console.error("Could not generate signup OTP")
  }

  return NextResponse.json({
    user: { id: userId, email },
    otpSent,
  })
}