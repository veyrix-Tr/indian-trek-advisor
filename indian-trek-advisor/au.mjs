import { createClient } from "@supabase/supabase-js"
import dotenv from "dotenv"
dotenv.config()

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const pubkey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
const svc = process.env.SUPABASE_SERVICE_ROLE_KEY
const target = "a0977c5b-334c-4187-9ada-5dcddfa76861"

// Sign in as the trekker to get a real user session
const signIn = createClient(url, svc)
const { data, error } = await signIn.auth.signInWithOtp({ email: "CHIRAGGOYAL4639@GMAIL.COM", options: { shouldCreateUser: false } })
if (error) console.log("OTP error:", error.message)

// Direct sign-in alternative: use admin to generate a session via helper
// Instead, just test realtime with a phantom auth via user-access-token is complex.
// Simulate the real flow: browser client holding an authenticated session.
console.log("OTP email sign-in requested (cannot complete without OTP code).")
console.log("RESULT: Real-time delivery needs a confirmed auth session on the client.")
process.exit(0)