"use client"

import { useState, useMemo, Fragment } from "react"
import { Backpack, Compass, Mountain, ArrowLeft, Check } from "lucide-react"
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
import { useOverlays } from "./overlay-provider"


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

export function AuthModal({ onClose }: { onClose: () => void }) {
  const { openComingSoon } = useOverlays()
  const [tab, setTab] = useState<AuthTab>("join")
  const [step, setStep] = useState<AuthStep>(1)
  const [accountType, setAccountType] = useState<AccountType>("trekker")
  const [roleChosen, setRoleChosen] = useState(false)
  const [legalAccepted, setLegalAccepted] = useState(false)

  // Step 1 fields
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")

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
    if (!phone.trim()) {
      setError("Please enter your phone number.")
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

  function handleSubmit(type: AccountType) {
    onClose()
    openComingSoon({
      title:
        type === "trekker" ? "Create Trekker Account" : "Create Guide Account",
      message:
        type === "trekker"
          ? "Trekker accounts are coming soon. You'll be able to save treks, write reviews, and book local guides directly."
          : "Guide accounts open soon. We'll verify your experience and certifications, then list your profile so trekkers can find and book you.",
    })
  }

  function handleSignIn(e: React.FormEvent) {
    e.preventDefault()
    onClose()
    openComingSoon({
      title: "Sign In",
      message:
        "Accounts are almost ready. Soon you'll sign in to save treks, write reviews, and message guides directly.",
    })
  }

  const isGuide = accountType === "guide"
  const totalSteps = isGuide ? 3 : 1

  return (
    <>
      <Dialog open onOpenChange={(open) => !open && onClose()}>
        <DialogContent className={`auth-modal-dialog border-border bg-card p-0 max-h-[90vh] overflow-y-auto rounded-2xl shadow-2xl w-[95vw] flex ${showTerms ? "sm:max-w-4xl" : "sm:max-w-xl"} transition-all`}>
          {/* ── LEFT: SIGN UP FORM ── */}
          <div className={`${showTerms ? "w-1/2" : "w-full"} transition-all`}>
            <DialogHeader className="px-8 pt-8 pb-0">
              <DialogTitle className="flex items-center gap-2.5 text-xl text-foreground">
                <Mountain className="size-6 text-primary" aria-hidden="true" />
                Welcome to TrekAdvisor
              </DialogTitle>
              <DialogDescription className="text-sm text-muted-foreground">
                One account for saving treks, reviews, and booking local guides.
              </DialogDescription>
            </DialogHeader>

          <Tabs value={tab} onValueChange={(v) => setTab(v as AuthTab)}>
            <div className="px-8 pt-5">
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
            <TabsContent value="signin" className="px-8 pb-8 pt-4">
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
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signin-password">Password</Label>
                  <Input
                    id="signin-password"
                    type="password"
                    placeholder="Enter your password"
                    className="h-11"
                    required
                  />
                </div>
                <Button type="submit" className="w-full rounded-full h-11">
                  Sign In
                </Button>
                <p className="text-center text-xs text-muted-foreground">
                  Don&apos;t have an account?{" "}
                  <button
                    type="button"
                    onClick={() => setTab("join")}
                    className="text-primary underline hover:opacity-80"
                  >
                    Join Free
                  </button>
                </p>
              </form>
            </TabsContent>

            {/* ── JOIN FREE TAB ── */}
            <TabsContent value="join" className="pb-8 pt-4">
              {/* ── PHASE 1: CHOOSE ROLE ── */}
              {!roleChosen && (
                <div className="px-8">
                  <p className="mb-5 text-center text-sm text-muted-foreground">
                    How would you like to use TrekAdvisor?
                  </p>
                  <div className="flex gap-4">
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
                        }}
                        className="group flex-1 rounded-xl border-2 border-border bg-card p-6 text-left transition-all hover:border-primary/40 hover:bg-primary/5 cursor-pointer"
                      >
                        <div className="mb-4 flex size-12 items-center justify-center rounded-xl bg-muted text-muted-foreground transition-colors group-hover:bg-primary/15 group-hover:text-primary">
                          <opt.icon className="size-6" />
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
              {roleChosen && !isGuide && (
                <div className="px-8">
                  <button
                    type="button"
                    onClick={() => { setRoleChosen(false); setError(""); setLegalAccepted(false) }}
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
                      <Input
                        id="join-password"
                        type="password"
                        placeholder="Min 6 characters"
                        className="h-11"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        minLength={6}
                        required
                      />
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
                    >
                      Create Trekker Account
                    </Button>
                  </div>
                </div>
              )}

              {/* ── PHASE 2B: GUIDE FORM (step by step) ── */}
              {roleChosen && isGuide && (
                <div className="px-8">
                  <button
                    type="button"
                    onClick={() => { setRoleChosen(false); setError(""); setStep(1); setLegalAccepted(false) }}
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
                        <Input
                          id="join-password"
                          type="password"
                          placeholder="Min 6 characters"
                          className="h-10"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          minLength={6}
                          required
                        />
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
                        >
                          Create Guide Account
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </TabsContent>
          </Tabs>
          </div>

          {/* ── RIGHT: TERMS & CONDITIONS PANEL ── */}
          {showTerms && (
            <div className="w-1/2 border-l border-border overflow-y-auto animate-slide-in-right">
              <div className="flex items-center justify-between border-b border-border px-6 py-4 sticky top-0 bg-card z-10">
                <h3 className="flex items-center gap-2 text-base font-semibold text-foreground">
                  <span className="text-lg">⚖️</span>
                  Terms &amp; Conditions
                </h3>
                <button
                  type="button"
                  onClick={() => setShowTerms(false)}
                  className="rounded-full border border-border bg-muted px-3 py-1 text-xs font-medium text-foreground hover:bg-muted/80 transition-colors"
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