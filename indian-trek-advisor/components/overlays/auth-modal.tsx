"use client"

import { useState, useMemo, Fragment } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/utils/supabase/client"
import { Backpack, Compass, Mountain, ArrowLeft, Check, Eye, EyeOff, MailCheck } from "lucide-react"
import { formatPhoneNumber, isValidPhoneNumber } from "@/lib/utils/phone"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"



type AccountType = "trekker" | "guide"
type AuthTab = "signin" | "join"
type AuthStep = 1 | 2 | 3

const CERTIFICATIONS = [
  { id: "bmc", label: "BMC — Basic Mountaineering Course (HMI/NIM)" },
  { id: "amc", label: "AMC — Advanced Mountaineering Course" },
  { id: "smc", label: "SMC — Search & Mountaineering Course" },
  { id: "rock", label: "Rock Climbing Certificate (NIM/HMI)" },
  { id: "ski", label: "Skiing Certificate" },
  { id: "wfa", label: "Wilderness First Aid (WFA)" },
  { id: "wfr", label: "Wilderness First Responder (WFR)" },
  { id: "swift", label: "Swift Water Rescue" },
  { id: "avalanche", label: "Avalanche Safety" },
  { id: "paragliding", label: "Paragliding License" },
]

const KNOWN_TREKS = [
  "Kedarkantha", "Kashmir Great Lakes", "Roopkund", "Valley of Flowers",
  "Har Ki Dun", "Kuari Pass (Curzon Trail)", "Brahmatal", "Tarsar Marsar",
  "Hampta Pass", "Pin Bhaba Pass", "Markha Valley", "Chadar — Frozen River",
  "Goechala", "Sandakphu–Phalut", "Nag Tibba", "Dayara Bugyal",
  "Dodital Trek", "Deoriatal Chandrashila", "Gaumukh Tapovan", "Kedartal",
  "Rupin Pass", "Phulara Ridge", "Bali Pass", "Pindari Glacier",
  "Milam Glacier", "Pangarchulla Peak", "Satopanth Tal", "Auden's Col",
  "Ali Bedni Bugyal", "Tapovan (Shivling Base Camp)", "Sahastra Tal",
  "Bagji Bugyal", "Ronti Saddle", "Dev Kyara", "Kagbhushandi Tal",
  "Kalindi Khal", "Adi Kailash Yatra", "Sunderdhunga Glacier",
  "Kafni Glacier", "Khatling Glacier", "Tungnath Yatra", "Panwali Kantha",
  "Bagini Glacier", "Kalpeshwar Yatra", "Binsar Wildlife Sanctuary Trek",
  "Nanda Devi Base Camp", "Ralam Glacier Trek", "Gorson Bugyal",
  "Chandrashila Trek", "Madmaheshwar Yatra", "Kedarnath Yatra",
  "Yamunotri Trek", "Hemkund Sahib Trek", "Khaliya Top Trek",
  "Darma Valley Trek", "Rohini Bugyal Trek", "Gidara Bugyal Trek",
  "Vasuki Tal Trek (Kedarnath)", "Alkapuri Glacier Trek",
  "Borasu Pass Trek", "Trishul Base Camp Trek", "Kartik Swami Trek",
  "Dokriani Glacier Trek", "Bhrigu Lake", "Beas Kund Trek",
  "Indrahar Pass Trek", "Pin Parvati Pass Trek", "Chandrakhani Pass Trek",
  "Buran Ghati Trek", "Kinnaur Kailash Yatra", "Deo Tibba Base Camp",
  "Bara Bhangal Trek", "Manimahesh Kailash Yatra", "Triund Trek",
  "Kareri Lake Trek", "Spiti Homestay Trek", "Churdhar Peak Trek",
  "Jalori Pass & Serolsar Lake Trek", "Kheerganga Trek", "Parang La Trek",
  "Kalihani Pass Trek", "Miyar Valley Trek", "Tosh Glacier Trek",
  "Jakhu Temple Trek", "Prashar Lake Trek", "Bhagsu Nag to Karthani Trek",
  "Boh Valley–Khabru Waterfall Trek", "Bonthu–Gaj Pass Trek",
  "Nohradhar–Churdhar Trek", "Deedag–Churdhar Trek",
  "Habban–Banalidhar–Churdhar Trek", "Bawa Pass Trek",
  "Bhangayini Mata Temple to Fort Trek", "Banethi–Jamta Nature Trail",
  "Lamkhaga Pass Trek (Chhitkul–Harshil)", "Vasuki Tal Trek (Gangotri–Nandanvan)",
  "Shrikhand Mahadev Yatra", "Yulla Kanda Trek", "Friendship Peak Trek",
  "Yunam Peak Trek", "Rudranath Yatra",
]

export function AuthModal({
  onClose,
  notice,
}: {
  onClose: () => void
  notice?: string | null
}) {
  const router = useRouter()
  const [tab, setTab] = useState<AuthTab>(notice ? "signin" : "join")
  const [step, setStep] = useState<AuthStep>(1)
  const [accountType, setAccountType] = useState<AccountType>("trekker")
  const [roleChosen, setRoleChosen] = useState(false)
  const [legalAccepted, setLegalAccepted] = useState(false)
  const [loading, setLoading] = useState(false)

  // Sign in fields
  const [signInEmail, setSignInEmail] = useState("")
  const [signInPassword, setSignInPassword] = useState("")
  const [showSignInPassword, setShowSignInPassword] = useState(false)

  // Forgot password state
  const [forgotOpen, setForgotOpen] = useState(false)
  const [forgotEmail, setForgotEmail] = useState("")
  const [forgotLoading, setForgotLoading] = useState(false)
  const [forgotMsg, setForgotMsg] = useState("")
  const [forgotStage, setForgotStage] = useState<"email" | "otp" | "newpass" | "done">("email")
  const [forgotOtp, setForgotOtp] = useState("")
  const [forgotNewPassword, setForgotNewPassword] = useState("")
  const [forgotConfirmPassword, setForgotConfirmPassword] = useState("")
  // OTP verification state
  const [otp, setOtp] = useState("")
  const [otpError, setOtpError] = useState("")
  const [verifyingOtp, setVerifyingOtp] = useState(false)

  // Step 1 fields
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  // Step 2 fields (guide only)
  const [experience, setExperience] = useState("")
  const [phone, setPhone] = useState("")
  const [address, setAddress] = useState("")
  const [certifications, setCertifications] = useState<string[]>([])
  const [knownTreks, setKnownTreks] = useState<string[]>([])

  // Step 3 fields (guide only)
  const [idProofFile, setIdProofFile] = useState<File | null>(null)
  const [certFile, setCertFile] = useState<File | null>(null)

  // Search filters for checkbox lists
  const [certSearch, setCertSearch] = useState("")
  const [trekSearch, setTrekSearch] = useState("")

  // Error state
  const [error, setError] = useState("")

  // Email verification state
  const [verificationSent, setVerificationSent] = useState(false)
  const [resending, setResending] = useState(false)
  const [resendMsg, setResendMsg] = useState("")

  // Legal dialog state
  const [showTerms, setShowTerms] = useState(false)

  const filteredCerts = useMemo(
    () =>
      CERTIFICATIONS.filter((c) =>
        c.label.toLowerCase().includes(certSearch.toLowerCase()),
      ),
    [certSearch],
  )

  const filteredTreks = useMemo(
    () =>
      KNOWN_TREKS.filter((t) =>
        t.toLowerCase().includes(trekSearch.toLowerCase()),
      ),
    [trekSearch],
  )

  function toggleCert(id: string) {
    setCertifications((prev) =>
      prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id],
    )
  }

  function toggleTrek(trekName: string) {
    setKnownTreks((prev) =>
      prev.includes(trekName)
        ? prev.filter((t) => t !== trekName)
        : [...prev, trekName],
    )
  }

  function validateStep1(): boolean {
    setError("")
    if (!name.trim()) {
      setError("Please enter your name.")
      return false
    }
    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError("Please enter a valid email address.")
      return false
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters.")
      return false
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match.")
      return false
    }
    if (!legalAccepted) {
      setError("Please accept the Terms & Conditions to continue.")
      return false
    }
    return true
  }

  function validateStep2(): boolean {
    setError("")
    if (!experience) {
      setError("Please select your years of experience.")
      return false
    }
    if (!phone.trim() || !isValidPhoneNumber(phone.trim())) {
      setError("Please enter a valid phone number (e.g., 9651561616 or +919651561616).")
      return false
    }
    if (!address.trim()) {
      setError("Please enter your base location.")
      return false
    }
    return true
  }

  function handleStep1Next() {
    if (accountType === "trekker") {
      if (!validateStep1()) return
      handleSubmit("trekker")
    } else {
      if (!validateStep1()) return
      setStep(2)
    }
  }

  function handleStep2Next() {
    if (!validateStep2()) return
    setStep(3)
  }

  function handleFinalSubmit() {
    handleSubmit("guide")
  }

  async function handleSubmit(type: AccountType) {
    setError("")
    setLoading(true)

    try {
      // Sign up via server API (creates an unconfirmed account and sends a
      // Brevo verification email). All signup data + guide documents are
      // handled server-side since there is no session before verification.
      const formData = new FormData()
      formData.append("email", email)
      formData.append("password", password)
      formData.append("name", name)
      formData.append("account_type", type)

      if (type === "guide") {
        formData.append("experience", experience)
        formData.append("address", address)
        if (phone) formData.append("phone", formatPhoneNumber(phone))
        if (certifications.length > 0) {
          formData.append("certifications", JSON.stringify(certifications))
        }
        if (knownTreks.length > 0) {
          formData.append("knownTreks", JSON.stringify(knownTreks))
        }
        if (idProofFile) formData.append("idProof", idProofFile)
        if (certFile) formData.append("cert", certFile)
      }

      const res = await fetch("/api/auth/signup", {
        method: "POST",
        body: formData,
      })

      const json = await res.json()

      if (!res.ok) {
        setError(json.error || "Sign up failed.")
        setLoading(false)
        return
      }

      // Account created but email must be verified before sign-in.
      setVerificationSent(true)
      setLoading(false)
    } catch (err) {
      console.error("Sign-up error:", err)
      setError("Something went wrong. Please try again.")
      setLoading(false)
    }
  }

  async function handleResend() {
    setResending(true)
    setResendMsg("")
    try {
      const res = await fetch("/api/auth/resend-verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, name, password }),
      })
      const json = await res.json()
      if (res.ok) {
        setResendMsg("A new verification code has been sent to your email.")
      } else {
        setResendMsg(json.error || "Could not resend.")
      }
    } catch {
      setResendMsg("Could not resend. Please try again.")
    }
    setResending(false)
  }

  async function handleForgot(e: React.FormEvent) {
    e.preventDefault()
    setForgotMsg("")
    if (!forgotEmail) return
    setForgotLoading(true)
    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: forgotEmail }),
      })
      const json = await res.json()
      if (res.ok && json?.sent) {
        setForgotStage("otp")
      } else if (!res.ok) {
        setForgotMsg(json.error || "Could not send the code.")
      } else {
        setForgotMsg("Could not send the code. Please try again.")
      }
    } catch {
      setForgotMsg("Something went wrong. Please try again.")
    }
    setForgotLoading(false)
  }

  async function handleVerifyOtp() {
    setVerifyingOtp(true)
    setOtpError("")
    try {
      const supabase = createClient()
      const { error } = await supabase.auth.verifyOtp({
        type: "signup",
        email,
        token: otp,
      })
      if (error) {
        setOtpError(error.message || "Invalid code. Please try again.")
        setVerifyingOtp(false)
        return
      }
      onClose()
    } catch {
      setOtpError("Something went wrong. Please try again.")
      setVerifyingOtp(false)
    }
  }

  async function handleForgotVerify() {
    setVerifyingOtp(true)
    setForgotMsg("")
    try {
      const supabase = createClient()
      const { error } = await supabase.auth.verifyOtp({
        type: "recovery",
        email: forgotEmail,
        token: forgotOtp,
      })
      if (error) {
        setForgotMsg(error.message || "Invalid code. Please try again.")
        setVerifyingOtp(false)
        return
      }
      setForgotStage("newpass")
      setVerifyingOtp(false)
    } catch {
      setForgotMsg("Something went wrong. Please try again.")
      setVerifyingOtp(false)
    }
  }

  async function handleSetNewPassword(e: React.FormEvent) {
    e.preventDefault()
    setForgotMsg("")
    if (forgotNewPassword.length < 8) {
      setForgotMsg("Password must be at least 8 characters.")
      return
    }
    if (forgotNewPassword !== forgotConfirmPassword) {
      setForgotMsg("Passwords do not match.")
      return
    }
    setForgotLoading(true)
    try {
      const supabase = createClient()
      const { error } = await supabase.auth.updateUser({ password: forgotNewPassword })
      setForgotLoading(false)
      if (error) {
        setForgotMsg(error.message)
        return
      }
      setForgotStage("done")
    } catch {
      setForgotLoading(false)
      setForgotMsg("Something went wrong. Please try again.")
    }
  }

  async function handleSignIn(e: React.FormEvent) {
    e.preventDefault()
    setError("")
    setLoading(true)

    try {
      const supabase = createClient()
      const { error } = await supabase.auth.signInWithPassword({
        email: signInEmail,
        password: signInPassword,
      })

      if (error) {
        if (/confirm|verify/i.test(error.message || "")) {
          setError("Please verify your email first. Check your inbox for the confirmation link.")
        } else {
          setError("Invalid email or password.")
        }
        setLoading(false)
        return
      }

      setLoading(false)
      router.refresh()
      onClose()
    } catch (err) {
      console.error("Sign-in error:", err)
      setError("Something went wrong. Please try again.")
      setLoading(false)
    }
  }

  const isGuide = accountType === "guide"
  const totalSteps = isGuide ? 3 : 1

  return (
    <>
      <Dialog open onOpenChange={(open) => !open && onClose()}>
<DialogContent className={`auth-modal-dialog border-border bg-card p-0 max-h-[88vh] overflow-y-auto rounded-2xl shadow-2xl w-[96vw] sm:w-[95vw] flex ${showTerms ? "sm:max-w-3xl" : "sm:max-w-xl"} transition-all`}>
            {/* ── SIGN UP / SIGN IN FORM ── */}
            <div className={`${showTerms ? "hidden sm:block sm:w-1/2" : "w-full"} w-full transition-all`}>
            <DialogHeader className="px-5 pt-6 sm:px-8 sm:pt-8">
              <DialogTitle className="flex flex-wrap items-center gap-2.5 text-lg text-foreground sm:text-xl">
                <Mountain className="size-5 text-primary sm:size-6" aria-hidden="true" />
                Welcome to Indian Trek Advisor
              </DialogTitle>
              <DialogDescription className="text-sm text-muted-foreground">
                One account for saving treks, reviews, and booking local guides.
              </DialogDescription>
            </DialogHeader>

          <Tabs value={tab} onValueChange={(v) => setTab(v as AuthTab)}>
            <div className="px-5 pt-4 sm:px-8 sm:pt-5">
              <TabsList className="w-full h-11">
                <TabsTrigger value="signin" className="flex-1 text-sm">
                  Sign In
                </TabsTrigger>
                <TabsTrigger value="join" className="flex-1 text-sm">
                  Join Free
                </TabsTrigger>
              </TabsList>
            </div>

            {/* ── SIGN IN TAB ── */}
            <TabsContent value="signin" className="px-5 pb-8 pt-4 sm:px-8">
              {notice && (
                <div className="mx-auto mb-4 max-w-md rounded-xl border border-primary/30 bg-primary/10 px-4 py-3 text-center">
                  <p className="text-sm font-medium text-primary">{notice}</p>
                </div>
              )}
              {forgotOpen ? (
                <div className="mx-auto max-w-md space-y-5 text-center">
                  {forgotStage === "email" && (
                    <>
                      <div>
                        <h2 className="text-lg font-bold text-foreground">Forgot password?</h2>
                        <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                          Enter the email you used to sign up and we&apos;ll send you a code
                          to reset your password.
                        </p>
                      </div>
                      <Input
                        type="email"
                        placeholder="you@example.com"
                        className="h-11"
                        value={forgotEmail}
                        onChange={(e) => setForgotEmail(e.target.value)}
                        required
                      />
                      {forgotMsg && <p className="text-sm text-destructive">{forgotMsg}</p>}
                      <Button
                        type="button"
                        className="w-full rounded-full h-11"
                        onClick={handleForgot}
                        disabled={forgotLoading}
                      >
                        {forgotLoading ? "Sending..." : "Send code"}
                      </Button>
                      <button
                        type="button"
                        onClick={() => {
                          setForgotOpen(false)
                          setForgotMsg("")
                          setForgotStage("email")
                        }}
                        className="text-sm font-medium text-primary underline hover:opacity-80"
                      >
                        Back to sign in
                      </button>
                    </>
                  )}
                  {forgotStage === "otp" && (
                    <>
                      <div>
                        <h2 className="text-lg font-bold text-foreground">Enter the code</h2>
                        <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                          We sent a code to{" "}
                          <strong className="text-foreground">{forgotEmail}</strong>.
                        </p>
                      </div>
                      <Input
                        type="text"
                        inputMode="numeric"
                        maxLength={10}
                        placeholder="Enter the code"
                        className="h-12 text-center text-lg tracking-[0.3em]"
                        value={forgotOtp}
                        onChange={(e) => setForgotOtp(e.target.value.replace(/\D/g, ""))}
                      />
                      {forgotMsg && <p className="text-sm text-destructive">{forgotMsg}</p>}
                      <Button
                        type="button"
                        className="w-full rounded-full h-11"
                        onClick={handleForgotVerify}
                        disabled={verifyingOtp || forgotOtp.length === 0}
                      >
                        {verifyingOtp ? "Verifying..." : "Verify code"}
                      </Button>
                      <button
                        type="button"
                        onClick={() => {
                          setForgotStage("email")
                          setForgotMsg("")
                        }}
                        className="text-sm font-medium text-primary underline hover:opacity-80"
                      >
                        Back
                      </button>
                    </>
                  )}
                  {forgotStage === "newpass" && (
                    <form
                      onSubmit={handleSetNewPassword}
                      className="space-y-4"
                    >
                      <div className="text-left">
                        <h2 className="text-lg font-bold text-foreground">Set a new password</h2>
                        <p className="mt-1.5 text-sm text-muted-foreground">
                          Choose a new password for your account.
                        </p>
                      </div>
                      <Input
                        type="password"
                        placeholder="New password"
                        className="h-11"
                        value={forgotNewPassword}
                        onChange={(e) => setForgotNewPassword(e.target.value)}
                        required
                      />
                      <Input
                        type="password"
                        placeholder="Confirm new password"
                        className="h-11"
                        value={forgotConfirmPassword}
                        onChange={(e) => setForgotConfirmPassword(e.target.value)}
                        required
                      />
                      {forgotMsg && <p className="text-sm text-destructive">{forgotMsg}</p>}
                      <Button
                        type="submit"
                        className="w-full rounded-full h-11"
                        disabled={forgotLoading}
                      >
                        {forgotLoading ? "Saving..." : "Reset password"}
                      </Button>
                    </form>
                  )}
                  {forgotStage === "done" && (
                    <>
                      <span className="mx-auto flex size-14 items-center justify-center rounded-full bg-primary/10">
                        <Check className="size-7 text-primary" aria-hidden="true" />
                      </span>
                      <h2 className="text-lg font-bold text-foreground">Password reset!</h2>
                      <p className="text-sm text-muted-foreground">
                        Your password has been updated. You can now sign in.
                      </p>
                      <Button
                        type="button"
                        className="w-full rounded-full h-11"
                        onClick={() => {
                          setForgotOpen(false)
                          setForgotStage("email")
                          setTab("signin")
                          setForgotNewPassword("")
                          setForgotConfirmPassword("")
                          setForgotOtp("")
                        }}
                      >
                        Go to sign in
                      </Button>
                    </>
                  )}
                </div>
              ) : (
              <form
                className="mx-auto max-w-md space-y-5"
                onSubmit={handleSignIn}
              >
                <div className="space-y-2">
                  <Label htmlFor="signin-email">Email Address</Label>
                  <Input
                    id="signin-email"
                    type="email"
                    placeholder="you@example.com"
                    className="h-11"
                    value={signInEmail}
                    onChange={(e) => setSignInEmail(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="signin-password">Password</Label>
                    <button
                      type="button"
                      onClick={() => setForgotOpen(true)}
                      className="text-sm font-medium text-primary underline hover:opacity-80"
                    >
                      Forgot password?
                    </button>
                  </div>
                  <div className="relative">
                    <Input
                      id="signin-password"
                      type={showSignInPassword ? "text" : "password"}
                      placeholder="Enter your password"
                      className="h-11 pr-10"
                      value={signInPassword}
                      onChange={(e) => setSignInPassword(e.target.value)}
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowSignInPassword(!showSignInPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      tabIndex={-1}
                    >
                      {showSignInPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                    </button>
                  </div>
                </div>
                {error && <p className="auth-error-msg">{error}</p>}
                <Button type="submit" className="w-full rounded-full h-11" disabled={loading}>
                  {loading ? "Signing in..." : "Sign In"}
                </Button>
                <p className="text-center text-sm text-muted-foreground">
                  Don&apos;t have an account?{" "}
                  <button
                    type="button"
                    onClick={() => setTab("join")}
                    className="text-primary font-medium underline hover:opacity-80"
                  >
                    Join Free
                  </button>
                </p>
              </form>
              )}
            </TabsContent>

            {/* ── JOIN FREE TAB ── */}
            <TabsContent value="join" className="pb-8 pt-4">
              {/* ── PHASE 0: VERIFY EMAIL (after signup) ── */}
              {verificationSent && (
                <div className="px-5 py-5 sm:px-8 sm:py-6">
                  <div className="mx-auto flex max-w-md flex-col items-center text-center">
                    <span className="flex size-14 items-center justify-center rounded-full bg-primary/10">
                      <MailCheck className="size-7 text-primary" aria-hidden="true" />
                    </span>
                    <h2 className="mt-4 text-lg font-bold text-foreground">Verify your email</h2>
                    <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                      We sent a <strong className="text-foreground">code</strong> to{" "}
                      <strong className="text-foreground">{email}</strong>. Enter it below to confirm
                      your email and activate your account.
                    </p>
                    <Input
                      type="text"
                      inputMode="numeric"
                      maxLength={10}
                      placeholder="Enter the code"
                      className="mt-5 h-12 text-center text-lg tracking-[0.3em]"
                      value={otp}
                      onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                    />
                    {otpError && <p className="mt-2 text-sm text-destructive">{otpError}</p>}
                    <Button
                      type="button"
                      className="mt-4 w-full rounded-full h-11"
                      onClick={handleVerifyOtp}
                      disabled={verifyingOtp || otp.length === 0}
                    >
                      {verifyingOtp ? "Verifying..." : "Verify"}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      className="mt-2 w-full rounded-full bg-transparent"
                      onClick={handleResend}
                      disabled={resending}
                    >
                      {resending ? "Sending..." : "Resend code"}
                    </Button>
                    {resendMsg && (
                      <p className="mt-3 text-sm text-primary">{resendMsg}</p>
                    )}
                    <button
                      type="button"
                      onClick={() => setTab("signin")}
                      className="mt-3 text-sm font-medium text-primary underline hover:opacity-80"
                    >
                      Already verified? Sign in
                    </button>
                  </div>
                </div>
              )}

              {/* ── PHASE 1: CHOOSE ROLE ── */}
              {!verificationSent && !roleChosen && (
                <div className="px-5 sm:px-8">
                  <p className="mb-5 text-center text-sm text-muted-foreground">
                    How would you like to use Indian Trek Advisor?
                  </p>
                  <div className="grid gap-3 sm:flex sm:gap-4">
                    {(
                      [
                        {
                          value: "trekker" as const,
                          label: "Trekker",
                          desc: "Browse treks, save favourites, write reviews, and book local guides.",
                          icon: Backpack,
                        },
                        {
                          value: "guide" as const,
                          label: "Local Guide",
                          desc: "List your services, get hired by trekkers, and grow your business.",
                          icon: Compass,
                        },
                      ] as const
                    ).map((opt) => (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => {
                          setAccountType(opt.value)
                          setRoleChosen(true)
                          setStep(1)
                          setError("")
                          setConfirmPassword("")
                        }}
                        className="group flex-1 rounded-xl border-2 border-border bg-card p-5 text-left transition-all hover:border-primary/40 hover:bg-primary/5 cursor-pointer sm:p-6"
                      >
                        <div className="mb-4 flex size-10 items-center justify-center rounded-xl bg-muted text-muted-foreground transition-colors group-hover:bg-primary/15 group-hover:text-primary sm:size-12">
                          <opt.icon className="size-5 sm:size-6" />
                        </div>
                        <div className="text-sm font-semibold text-foreground">
                          {opt.label}
                        </div>
                        <div className="mt-1 text-xs leading-relaxed text-muted-foreground">
                          {opt.desc}
                        </div>
                        <div className="mt-3 text-xs font-medium text-primary opacity-0 transition-opacity group-hover:opacity-100">
                          Get Started →
                        </div>
                      </button>
                    ))}
                  </div>
                  <p className="mt-5 text-center text-2xs text-muted-foreground">
                    Already have an account?{" "}
                    <button
                      type="button"
                      onClick={() => setTab("signin")}
                      className="text-primary font-medium underline hover:opacity-80"
                    >
                      Sign In
                    </button>
                  </p>
                </div>
              )}

              {/* ── PHASE 2A: TREKKER FORM ── */}
              {!verificationSent && roleChosen && !isGuide && (
                <div className="px-5 sm:px-8">
                  <button
                    type="button"
                    onClick={() => { setRoleChosen(false); setError(""); setLegalAccepted(false); setConfirmPassword("") }}
                    className="mb-4 flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <ArrowLeft className="size-3" /> Change role
                  </button>
                  <div className="mx-auto max-w-md space-y-4">
                    <div className="space-y-1.5">
                      <Label htmlFor="join-name" className="text-xs">Full Name *</Label>
                      <Input
                        id="join-name"
                        placeholder="Your full name"
                        className="h-11"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        required
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="join-email" className="text-xs">Email Address *</Label>
                      <Input
                        id="join-email"
                        type="email"
                        placeholder="you@example.com"
                        className="h-11"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="join-password" className="text-xs">Password *</Label>
                      <div className="relative">
                        <Input
                          id="join-password"
                          type={showPassword ? "text" : "password"}
                          placeholder="Min 6 characters"
                          className="h-11 pr-10"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          minLength={6}
                          required
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                          tabIndex={-1}
                        >
                          {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                        </button>
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="join-confirm-password" className="text-xs">Confirm Password *</Label>
                      <div className="relative">
                        <Input
                          id="join-confirm-password"
                          type={showConfirmPassword ? "text" : "password"}
                          placeholder="Re-enter your password"
                          className="h-11 pr-10"
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          minLength={6}
                          required
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                          tabIndex={-1}
                        >
                          {showConfirmPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                        </button>
                      </div>
                    </div>
                    {error && <p className="auth-error-msg mt-3">{error}</p>}
                    <div
                      className={`auth-legal-wrap mt-2 ${legalAccepted ? "checked" : ""}`}
                      onClick={() => setLegalAccepted(!legalAccepted)}
                    >
                      <label className="auth-legal-item">
                        <div className="auth-legal-cb" />
                        <span className="auth-legal-label">
                          I accept the{" "}
                          <button
                            type="button"
                            onClick={(e) => { e.stopPropagation(); setShowTerms(true) }}
                            className="inline text-primary underline hover:opacity-80"
                          >
                            Terms &amp; Conditions
                          </button>
                        </span>
                      </label>
                      <input type="checkbox" className="sr-only" checked={legalAccepted} onChange={(e) => setLegalAccepted(e.target.checked)} tabIndex={-1} />
                    </div>
                    <Button
                      type="button"
                      className="mt-4 w-full rounded-full h-11"
                      onClick={handleStep1Next}
                      disabled={loading}
                    >
                      {loading ? "Creating account..." : "Create Trekker Account"}
                    </Button>
                  </div>
                </div>
              )}

              {/* ── PHASE 2B: GUIDE FORM (step by step) ── */}
              {!verificationSent && roleChosen && isGuide && (
                <div className="px-5 sm:px-8">
                  <button
                    type="button"
                    onClick={() => { setRoleChosen(false); setError(""); setStep(1); setLegalAccepted(false); setConfirmPassword("") }}
                    className="mb-4 flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <ArrowLeft className="size-3" /> Change role
                  </button>

                  {/* Step indicator */}
                  <div className="mb-6">
                    <div className="auth-steps">
                      {(["Account", "Profile", "Documents"] as const).map(
                        (label, i) => {
                          const s = (i + 1) as AuthStep
                          const cls =
                            s < step ? "done" : s === step ? "active" : ""
                          return (
                            <Fragment key={s}>
                              {i > 0 && (
                                <div
                                  className={`auth-step-line ${s <= step ? "done" : ""}`}
                                />
                              )}
                              <div className="flex flex-col items-center">
                                <div className={`auth-step-dot ${cls}`}>
                                  {s < step ? (
                                    <Check className="size-3.5" />
                                  ) : (
                                    s
                                  )}
                                </div>
                                <span className="auth-step-label mt-1.5">
                                  {label}
                                </span>
                              </div>
                            </Fragment>
                          )
                        },
                      )}
                    </div>
                  </div>

                  {/* ── STEP 1: Account ── */}
                  {step === 1 && (
                    <div className="mx-auto max-w-sm space-y-3">
                      <div className="space-y-1.5">
                        <Label htmlFor="join-name" className="text-xs">Full Name *</Label>
                        <Input
                          id="join-name"
                          placeholder="Your full name"
                          className="h-10"
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          required
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor="join-email" className="text-xs">Email *</Label>
                        <Input
                          id="join-email"
                          type="email"
                          placeholder="you@example.com"
                          className="h-10"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          required
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor="join-password" className="text-xs">Password *</Label>
                        <div className="relative">
                          <Input
                            id="join-password"
                            type={showPassword ? "text" : "password"}
                            placeholder="Min 6 characters"
                            className="h-10 pr-10"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            minLength={6}
                            required
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                            tabIndex={-1}
                          >
                            {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                          </button>
                        </div>
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor="join-confirm-password" className="text-xs">Confirm Password *</Label>
                        <div className="relative">
                          <Input
                            id="join-confirm-password"
                            type={showConfirmPassword ? "text" : "password"}
                            placeholder="Re-enter your password"
                            className="h-10 pr-10"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            minLength={6}
                            required
                          />
                          <button
                            type="button"
                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                            tabIndex={-1}
                          >
                            {showConfirmPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                          </button>
                        </div>
                      </div>
                      {error && <p className="auth-error-msg mt-2">{error}</p>}
                      <div
                        className={`auth-legal-wrap mt-2 ${legalAccepted ? "checked" : ""}`}
                        onClick={() => setLegalAccepted(!legalAccepted)}
                      >
                        <label className="auth-legal-item">
                          <div className="auth-legal-cb" />
                          <span className="auth-legal-label">
                            I accept the{" "}
                            <button
                              type="button"
                              onClick={(e) => { e.stopPropagation(); setShowTerms(true) }}
                              className="inline text-primary underline hover:opacity-80"
                            >
                              Terms &amp; Conditions
                            </button>
                          </span>
                        </label>
                        <input type="checkbox" className="sr-only" checked={legalAccepted} onChange={(e) => setLegalAccepted(e.target.checked)} tabIndex={-1} />
                      </div>
                      <Button
                        type="button"
                        className="mt-3 w-full rounded-full h-10"
                        onClick={handleStep1Next}
                        disabled={loading}
                      >
                        Next Step →
                      </Button>
                      <p className="text-center text-2xs text-muted-foreground">
                        Already have an account?{" "}
                        <button type="button" onClick={() => setTab("signin")} className="text-primary font-medium underline hover:opacity-80">
                          Sign In
                        </button>
                      </p>
                    </div>
                  )}

                  {/* ── STEP 2: Profile + Certifications ── */}
                  {step === 2 && (
                    <div className="mx-auto max-w-sm space-y-3">
                      <div className="space-y-1.5">
                        <Label htmlFor="g-experience" className="text-xs">Years of Experience *</Label>
                        <select
                          id="g-experience"
                          value={experience}
                          onChange={(e) => setExperience(e.target.value)}
                          className="h-10 w-full rounded-md border border-border bg-card px-3 py-2 text-sm text-foreground outline-none transition-colors focus:border-primary"
                        >
                          <option value="">Select…</option>
                          <option>1–2 years</option>
                          <option>3–5 years</option>
                          <option>6–10 years</option>
                          <option>10+ years</option>
                        </select>
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor="g-phone" className="text-xs">Phone / WhatsApp *</Label>
                        <Input
                          id="g-phone"
                          type="tel"
                          placeholder="+91 98XXXXXXXX"
                          className="h-10"
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor="g-address" className="text-xs">Base Location *</Label>
                        <Input
                          id="g-address"
                          placeholder="e.g. Rishikesh, Uttarakhand"
                          className="h-10"
                          value={address}
                          onChange={(e) => setAddress(e.target.value)}
                        />
                      </div>
                      <div className="mt-2">
                        <p className="mb-2 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Certifications</p>
                        <input
                          type="text"
                          placeholder="Search certifications…"
                          value={certSearch}
                          onChange={(e) => setCertSearch(e.target.value)}
                          className="auth-cb-search h-9"
                        />
                        <div className="auth-cb-list-wrap max-h-40">
                          {filteredCerts.map((cert) => (
                            <label
                              key={cert.id}
                              className={`auth-cb-item ${certifications.includes(cert.id) ? "checked" : ""}`}
                              onClick={() => toggleCert(cert.id)}
                            >
                              <div className="auth-cb-box" />
                              <span className="auth-cb-label">{cert.label}</span>
                            </label>
                          ))}
                          {filteredCerts.length === 0 && (
                            <p className="px-3 py-2 text-xs text-muted-foreground">No matching certifications</p>
                          )}
                        </div>
                        {certifications.length > 0 && (
                          <p className="mt-1 text-xs text-primary">{certifications.length} selected</p>
                        )}
                      </div>
                      {error && <p className="auth-error-msg mt-2">{error}</p>}
                      <div className="flex gap-3 mt-3">
                        <button
                          type="button"
                          className="flex-1 rounded-full border border-border bg-muted h-10 text-sm font-medium text-foreground hover:bg-muted/80 transition-colors"
                          onClick={() => setStep(1)}
                        >
                          ← Back
                        </button>
                        <Button
                          type="button"
                          className="flex-1 rounded-full h-10"
                          onClick={handleStep2Next}
                        >
                          Next Step →
                        </Button>
                      </div>
                    </div>
                  )}

                  {/* ── STEP 3: Documents + Known Treks ── */}
                  {step === 3 && (
                    <div className="mx-auto max-w-sm space-y-3">
                      <div className="space-y-1.5">
                        <Label className="text-xs">ID Proof *</Label>
                        <div className={`auth-upload-area ${idProofFile ? "has-file" : ""}`}>
                          <input
                            type="file"
                            accept="image/*,.pdf"
                            onChange={(e) => setIdProofFile(e.target.files?.[0] ?? null)}
                          />
                          <div className="auth-upload-icon">{idProofFile ? "📄" : "📤"}</div>
                          <div className="auth-upload-label">{idProofFile ? idProofFile.name : "Aadhaar / PAN / Passport"}</div>
                          <div className="auth-upload-hint">JPG, PNG or PDF</div>
                        </div>
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs">Mountaineering Certificate</Label>
                        <div className={`auth-upload-area ${certFile ? "has-file" : ""}`}>
                          <input
                            type="file"
                            accept="image/*,.pdf"
                            onChange={(e) => setCertFile(e.target.files?.[0] ?? null)}
                          />
                          <div className="auth-upload-icon">{certFile ? "📄" : "📤"}</div>
                          <div className="auth-upload-label">{certFile ? certFile.name : "BMC / AMC / other cert"}</div>
                          <div className="auth-upload-hint">JPG, PNG or PDF</div>
                        </div>
                      </div>
                      <p className="text-[11px] text-muted-foreground italic">Optional during signup.</p>
                      <div className="mt-2">
                        <p className="mb-2 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Known Treks</p>
                        <input
                          type="text"
                          placeholder="Search treks…"
                          value={trekSearch}
                          onChange={(e) => setTrekSearch(e.target.value)}
                          className="auth-cb-search h-9"
                        />
                        <div className="auth-cb-list-wrap max-h-40">
                          {filteredTreks.map((trek) => (
                            <label
                              key={trek}
                              className={`auth-cb-item ${knownTreks.includes(trek) ? "checked" : ""}`}
                              onClick={() => toggleTrek(trek)}
                            >
                              <div className="auth-cb-box" />
                              <span className="auth-cb-label">{trek}</span>
                            </label>
                          ))}
                          {filteredTreks.length === 0 && (
                            <p className="px-3 py-2 text-xs text-muted-foreground">No matching treks</p>
                          )}
                        </div>
                        {knownTreks.length > 0 && (
                          <p className="mt-1 text-xs text-primary">{knownTreks.length} selected</p>
                        )}
                      </div>
                      {error && <p className="auth-error-msg mt-2">{error}</p>}
                      <div className="flex gap-3 mt-3">
                        <button
                          type="button"
                          className="flex-1 rounded-full border border-border bg-muted h-10 text-sm font-medium text-foreground hover:bg-muted/80 transition-colors"
                          onClick={() => setStep(2)}
                        >
                          ← Back
                        </button>
                        <Button
                          type="button"
                          className="flex-1 rounded-full h-10"
                          onClick={handleFinalSubmit}
                          disabled={loading}
                        >
                          {loading ? "Creating account..." : "Create Guide Account"}
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </TabsContent>
          </Tabs>
          </div>

          {/* ── MOBILE TERMS (replaces form on small screens) ── */}
          {showTerms && (
            <div className="sm:hidden w-full animate-slide-in-right">
              <div className="flex items-center justify-between border-b border-border px-4 py-3">
                <h3 className="flex items-center gap-2 text-sm font-semibold text-foreground">
                  <span className="text-lg">⚖️</span>
                  Terms &amp; Conditions
                </h3>
                <button
                  type="button"
                  onClick={() => setShowTerms(false)}
                  className="mr-8 rounded-full border border-border bg-muted px-3 py-1 text-xs font-medium text-foreground hover:bg-muted/80 transition-colors"
                >
                  ← Back
                </button>
              </div>
              <div className="space-y-4 px-4 py-4 text-sm leading-relaxed text-muted-foreground">
                <section>
                  <h4 className="mb-1 font-mono text-[11px] font-semibold uppercase tracking-wider text-primary">1. Nature of the Platform</h4>
                  <p>Indian Trek Advisor is an information and community listing service only. We are not a travel agency, tour operator, trekking company, or adventure sports organiser.</p>
                  <p className="mt-2">All guides and service providers listed are independent third parties.</p>
                </section>
                <section>
                  <h4 className="mb-1 font-mono text-[11px] font-semibold uppercase tracking-wider text-primary">2. Assumption of Risk</h4>
                  <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-xs leading-relaxed">
                    <strong className="text-destructive">⚠ CRITICAL:</strong> Trekking involves serious, inherent risks including death, altitude sickness, hypothermia, avalanche, rockfall, flash floods, and getting lost.
                  </div>
                </section>
                <section>
                  <h4 className="mb-1 font-mono text-[11px] font-semibold uppercase tracking-wider text-primary">3. Limitation of Liability</h4>
                  <p>To the maximum extent permitted by law, Indian Trek Advisor shall not be liable for any death, personal injury, property loss, or financial loss arising from use of this Platform.</p>
                </section>
                <section>
                  <h4 className="mb-1 font-mono text-[11px] font-semibold uppercase tracking-wider text-primary">4. Guide &amp; Operator Liability</h4>
                  <p>Guides are independent contractors. Verify credentials independently and obtain comprehensive travel insurance.</p>
                </section>
                <section>
                  <h4 className="mb-1 font-mono text-[11px] font-semibold uppercase tracking-wider text-primary">5. Trail &amp; Permit Information</h4>
                  <p>Trail data is for general guidance only. Verify all permit requirements before any trek.</p>
                </section>
                <section>
                  <h4 className="mb-1 font-mono text-[11px] font-semibold uppercase tracking-wider text-primary">6. Indemnification</h4>
                  <p>You agree to indemnify and hold harmless Indian Trek Advisor from any claims arising from your use of the Platform.</p>
                </section>
                <section>
                  <h4 className="mb-1 font-mono text-[11px] font-semibold uppercase tracking-wider text-primary">7. Guide Responsibilities</h4>
                  <p>Local Guides warrant that all information is accurate, certifications are valid, and adequate insurance is carried.</p>
                </section>
                <div className="rounded-lg border border-primary/20 bg-primary/5 p-3 text-xs leading-relaxed text-primary">
                  <strong>This platform is an information service only. Not a tour operator.</strong>
                </div>
              </div>
            </div>
          )}

          {/* ── DESKTOP SIDE PANEL: TERMS & CONDITIONS ── */}
          {showTerms && (
            <div className="hidden sm:block sm:w-1/2 border-l border-border animate-slide-in-right">
              <div className="flex items-center justify-between border-b border-border px-6 py-4">
                <h3 className="flex items-center gap-2 text-base font-semibold text-foreground">
                  <span className="text-lg">⚖️</span>
                  Terms &amp; Conditions
                </h3>
                <button
                  type="button"
                  onClick={() => setShowTerms(false)}
                  className="mr-10 rounded-full border border-border bg-muted px-3 py-1 text-xs font-medium text-foreground hover:bg-muted/80 transition-colors"
                >
                  ← Back
                </button>
              </div>
              <div className="space-y-5 px-6 py-5 text-sm leading-relaxed text-muted-foreground">
                <section>
                  <h4 className="mb-1.5 font-mono text-[11px] font-semibold uppercase tracking-wider text-primary">1. Nature of the Platform</h4>
                  <p><strong className="text-foreground">Indian Trek Advisor</strong> is an <strong className="text-foreground">information and community listing service only</strong>. We are not a travel agency, tour operator, trekking company, or adventure sports organiser.</p>
                  <p className="mt-2">All guides and service providers listed are <strong className="text-foreground">independent third parties</strong>.</p>
                </section>
                <section>
                  <h4 className="mb-1.5 font-mono text-[11px] font-semibold uppercase tracking-wider text-primary">2. Assumption of Risk</h4>
                  <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-xs leading-relaxed">
                    <strong className="text-destructive">⚠ CRITICAL:</strong> Trekking involves <strong className="text-foreground">serious, inherent risks</strong> including death, altitude sickness, hypothermia, avalanche, rockfall, flash floods, and getting lost.
                  </div>
                </section>
                <section>
                  <h4 className="mb-1.5 font-mono text-[11px] font-semibold uppercase tracking-wider text-primary">3. Limitation of Liability</h4>
                  <p>To the maximum extent permitted by law, Indian Trek Advisor shall not be liable for any death, personal injury, property loss, or financial loss arising from use of this Platform.</p>
                </section>
                <section>
                  <h4 className="mb-1.5 font-mono text-[11px] font-semibold uppercase tracking-wider text-primary">4. Guide &amp; Operator Liability</h4>
                  <p>Guides are <strong className="text-foreground">independent contractors</strong>. Verify credentials independently and obtain comprehensive travel insurance.</p>
                </section>
                <section>
                  <h4 className="mb-1.5 font-mono text-[11px] font-semibold uppercase tracking-wider text-primary">5. Trail &amp; Permit Information</h4>
                  <p>Trail data is for <strong className="text-foreground">general guidance only</strong>. Verify all permit requirements before any trek.</p>
                </section>
                <section>
                  <h4 className="mb-1.5 font-mono text-[11px] font-semibold uppercase tracking-wider text-primary">6. Indemnification</h4>
                  <p>You agree to <strong className="text-foreground">indemnify and hold harmless</strong> Indian Trek Advisor from any claims arising from your use of the Platform.</p>
                </section>
                <section>
                  <h4 className="mb-1.5 font-mono text-[11px] font-semibold uppercase tracking-wider text-primary">7. Guide Responsibilities</h4>
                  <p>Local Guides warrant that all information is accurate, certifications are valid, and adequate insurance is carried.</p>
                </section>
                <div className="rounded-lg border border-primary/20 bg-primary/5 p-3 text-xs leading-relaxed text-primary">
                  <strong>This platform is an information service only. Not a tour operator.</strong>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}