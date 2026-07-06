"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/utils/supabase/client"
import { ArrowLeft, Save, Mail, MapPin, Phone, Quote, UserRound,
  Briefcase, BadgeCheck, Award, FileText, BookOpen, ShieldCheck,
  ExternalLink, Loader2 } from "lucide-react"
import { toast } from "sonner"
import type { User } from "@supabase/supabase-js"

interface Profile {
  id: string
  name: string
  email: string
  account_type: string
  city: string | null
  phone: string | null
  bio: string | null
}

interface Guide {
  experience: string | null
  base_location: string | null
  certifications: string[]
  known_treks: string[]
  id_proof_url: string | null
  cert_doc_url: string | null
  verified: boolean
}

export default function ProfilePage() {
  const router = useRouter()
  const supabase = createClient()
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [guide, setGuide] = useState<Guide | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState("")

  const [name, setName] = useState("")
  const [phone, setPhone] = useState("")
  const [city, setCity] = useState("")
  const [bio, setBio] = useState("")
  const [experience, setExperience] = useState("")
  const [baseLocation, setBaseLocation] = useState("")

  // Auto-save guide fields silently on debounce
  const autoSaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  async function saveGuideFields(silent = true) {
    if (!guide || !user) return
    await supabase.from("guides").update({
      experience,
      base_location: baseLocation,
    }).eq("user_id", user.id)
    if (!silent) toast.success("Guide profile saved", { duration: 2000 })
  }

  useEffect(() => {
    if (!guide || !user) return
    if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current)
    autoSaveTimer.current = setTimeout(() => saveGuideFields(true), 1000)
    return () => { if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current) }
  }, [experience, baseLocation, guide, user, supabase])

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.replace("/"); return }
      setUser(user)

      const { data: profileData } = await supabase.from("profiles").select("*").eq("id", user.id).single()
      if (profileData) {
        setProfile(profileData)
        setName(profileData.name || "")

        let guidePhone: string | null = null

        if (profileData.account_type === "guide") {
          const { data: guideData } = await supabase.from("guides").select("*").eq("user_id", user.id).single()
          if (guideData) {
            setGuide(guideData)
            guidePhone = guideData.phone
            setExperience(guideData.experience || "")
            setBaseLocation(guideData.base_location || "")
          }
        }

        setPhone(profileData.phone || guidePhone || "")
        setCity(profileData.city || "")
        setBio(profileData.bio || "")
      }

      setLoading(false)
    }
    load()

    const interval = setInterval(async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data: profileData } = await supabase.from("profiles").select("*").eq("id", user.id).single()
      if (profileData) {
        setProfile(profileData)
        if (profileData.account_type === "guide") {
          const { data: guideData } = await supabase.from("guides").select("*").eq("user_id", user.id).single()
          if (guideData) setGuide(guideData)
        }
      }
    }, 5000)

    return () => clearInterval(interval)
  }, [supabase, router])

  async function handleSave() {
    setSaving(true)
    setSaved(false)
    setError("")

    const { error: err } = await supabase
      .from("profiles")
      .update({ name, phone, city, bio, updated_at: new Date().toISOString() })
      .eq("id", user!.id)

    if (!err && guide) {
      await supabase.from("guides").update({ phone, experience, base_location: baseLocation }).eq("user_id", user!.id)
    }

    if (err) {
      setError(err.message)
    } else {
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    }
    setSaving(false)
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="size-6 animate-spin text-primary" />
      </div>
    )
  }

  const accountType = profile?.account_type || ""
  const isGuide = !!guide

  return (
    <main className="min-h-screen bg-background">
      {/* Ambient top glow, echoes the landing page hero */}
      <div className="pointer-events-none fixed inset-x-0 top-0 h-72 bg-gradient-to-b from-primary/10 via-primary/[0.03] to-transparent" />

      <div className="relative mx-auto max-w-4xl px-4 pb-20 pt-24 sm:px-6 sm:pt-20">
        {/* Top bar */}
        <div className="mb-8 flex items-center justify-between">
          <button
            onClick={() => router.back()}
            className="group inline-flex items-center gap-2 text-sm font-medium text-foreground/70 transition-colors hover:text-foreground"
          >
            <span className="flex size-8 items-center justify-center rounded-full border border-border bg-muted/40 transition-colors group-hover:border-primary/40 group-hover:bg-primary/10">
              <ArrowLeft className="size-4" />
            </span>
            Back
          </button>

          <span className="font-mono text-[20px] uppercase tracking-[0.2em] text-muted-foreground/50">
            My Profile
          </span>
        </div>

        <div className="space-y-6">
          {/* ── IDENTITY HEADER ── */}
          <section className="overflow-hidden rounded-2xl border border-border/60 bg-card">
            {/* Trail-map style banner strip */}
            <div className="relative h-28 overflow-hidden bg-gradient-to-br from-primary/20 via-primary/5 to-transparent sm:h-32">
              <svg
                className="absolute inset-0 h-full w-full opacity-[0.15]"
                viewBox="0 0 400 100"
                preserveAspectRatio="none"
              >
                <path
                  d="M0 80 L60 40 L110 65 L170 20 L230 55 L290 15 L340 45 L400 25"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  className="text-primary"
                />
              </svg>
            </div>

            <div className="px-6 pb-7 sm:px-8">
              <div className="-mt-11 flex flex-col items-start gap-5 sm:-mt-12 sm:flex-row sm:items-end">
                <span className="flex size-[88px] shrink-0 items-center justify-center rounded-2xl border-4 border-card bg-gradient-to-br from-primary to-primary/70 text-3xl font-bold text-primary-foreground shadow-lg">
                  {(profile?.name || user?.email || "U").charAt(0).toUpperCase()}
                </span>

                <div className="min-w-0 flex-1 pb-1">
                  <div className="flex flex-wrap items-center gap-2.5">
                    <h1 className="truncate text-xl font-semibold text-foreground">
                      {profile?.name || "User"}
                    </h1>
                    {isGuide && guide?.verified && (
                      <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/25 bg-emerald-500/10 px-2.5 py-0.5 text-[11px] font-medium text-emerald-400">
                        <ShieldCheck className="size-3" />
                        Verified
                      </span>
                    )}
                  </div>
                  <div className="mt-1.5 flex items-center gap-2 font-mono text-[11px] uppercase tracking-wider text-muted-foreground/60">
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-border/60 bg-muted/30 px-2.5 py-1">
                      {accountType === "guide" ? (
                        <Briefcase className="size-3" />
                      ) : (
                        <UserRound className="size-3" />
                      )}
                      {accountType || "Trekker"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Email */}
              <div className="mt-6 flex items-center gap-3 rounded-xl border border-border/50 bg-muted/20 px-4 py-3">
                <Mail className="size-4 shrink-0 text-muted-foreground/50" />
                <div className="min-w-0">
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/80">
                    Email
                  </p>
                  <p className="truncate text-sm text-foreground/85">{profile?.email}</p>
                </div>
              </div>

              {/* Editable fields */}
              <div className="mt-6 space-y-4">
                <div className="space-y-1.5">
                  <label className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground/80">
                    <UserRound className="size-3" />
                    Name
                  </label>
                  <input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="flex h-11 w-full items-center rounded-lg border border-border bg-muted/30 px-3.5 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground/50 focus:border-primary/50 focus:bg-muted/40"
                    placeholder="Your name"
                  />
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <label className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground/80">
                      <Phone className="size-3" />
                      Phone
                    </label>
                    <input
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="flex h-11 w-full items-center rounded-lg border border-border bg-muted/30 px-3.5 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground/50 focus:border-primary/50 focus:bg-muted/40"
                      placeholder="12345 67890"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground/80">
                      <MapPin className="size-3" />
                      City
                    </label>
                    <input
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      className="flex h-11 w-full items-center rounded-lg border border-border bg-muted/30 px-3.5 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground/50 focus:border-primary/50 focus:bg-muted/40"
                      placeholder="Mumbai"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground/80">
                    <Quote className="size-3" />
                    Bio
                  </label>
                  <textarea
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    rows={4}
                    className="flex w-full resize-none rounded-lg border border-border bg-muted/30 px-3.5 py-3 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground/50 focus:border-primary/50 focus:bg-muted/40"
                    placeholder="Tell us about yourself..."
                  />
                </div>

                {error && (
                  <p className="rounded-lg border border-red-500/25 bg-red-500/5 px-3.5 py-2.5 text-sm text-red-400">
                    {error}
                  </p>
                )}

                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-primary text-sm font-semibold text-primary-foreground shadow-sm shadow-primary/20 transition-all hover:opacity-90 hover:shadow-primary/30 disabled:opacity-50"
                >
                  {saving ? (
                    <Loader2 className="size-3.5 animate-spin" />
                  ) : (
                    <Save className="size-3.5" />
                  )}
                  {saving ? "Saving…" : saved ? "Saved!" : "Save Changes"}
                </button>
              </div>
            </div>
          </section>

          {/* ── GUIDE PROFILE CARD ── */}
          {guide && (
            <section className="overflow-hidden rounded-2xl border border-border/60 bg-card">
              <div className="flex items-center justify-between border-b border-border/60 px-6 py-4 sm:px-8">
                <div className="flex items-center gap-2">
                  <span className="flex size-7 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <Briefcase className="size-3.5" />
                  </span>
                  <h2 className="text-sm font-semibold text-foreground">Guide Profile</h2>
                </div>
                <span
                  className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-medium ${
                    guide.verified
                      ? "border border-emerald-500/25 bg-emerald-500/10 text-emerald-400"
                      : "border border-amber-500/25 bg-amber-500/10 text-amber-400"
                  }`}
                >
                  <BadgeCheck className="size-3" />
                  {guide.verified ? "Verified" : "Pending Verification"}
                </span>
              </div>

              <div className="divide-y divide-border/50 px-6 sm:px-8">
                {/* Experience */}
                <div className="flex flex-wrap items-center justify-between gap-3 py-4">
                  <div className="flex items-center gap-2.5 text-sm font-medium text-foreground/80">
                    <Award className="size-4 shrink-0 text-primary/70" />
                    Experience
                  </div>
                  <select
                    value={experience}
                    onChange={(e) => setExperience(e.target.value)}
                    onBlur={() => { if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current); saveGuideFields(false) }}
                    className="max-w-44 cursor-pointer rounded-lg border border-border bg-muted/30 px-3 py-1.5 text-sm text-foreground outline-none transition-colors focus:border-primary/50 focus:bg-muted/40"
                  >
                    <option value="" className="bg-card text-muted-foreground">Select…</option>
                    <option value="1-2 years" className="bg-card">1-2 years</option>
                    <option value="3-5 years" className="bg-card">3-5 years</option>
                    <option value="5-10 years" className="bg-card">5-10 years</option>
                    <option value="10+ years" className="bg-card">10+ years</option>
                  </select>
                </div>

                {/* Base Location */}
                <div className="flex flex-wrap items-center justify-between gap-3 py-4">
                  <div className="flex items-center gap-2.5 text-sm font-medium text-foreground/80">
                    <MapPin className="size-4 shrink-0 text-primary/70" />
                    Base Location
                  </div>
                  <input
                    value={baseLocation}
                    onChange={(e) => setBaseLocation(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current); saveGuideFields(false) } }}
                    onBlur={() => { if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current); saveGuideFields(false) }}
                    className="max-w-44 rounded-lg border border-border bg-muted/30 px-3 py-1.5 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground/50 focus:border-primary/50 focus:bg-muted/40"
                    placeholder="Manali, Himachal"
                  />
                </div>

                {/* Certifications */}
                <div className="flex flex-wrap items-start justify-between gap-3 py-4">
                  <div className="flex items-center gap-2.5 pt-0.5 text-sm font-medium text-foreground/80">
                    <Award className="size-4 shrink-0 text-primary/70" />
                    Certifications
                  </div>
                  <div className="flex max-w-xs flex-wrap justify-end gap-1.5">
                    {guide.certifications?.length > 0 ? guide.certifications.map((c) => (
                      <span key={c} className="rounded-full border border-primary/20 bg-primary/10 px-2.5 py-0.5 text-xs font-medium capitalize text-primary">
                        {c}
                      </span>
                    )) : <span className="text-sm text-muted-foreground/40">N/A</span>}
                  </div>
                </div>

                {/* Known Treks */}
                <div className="flex flex-wrap items-start justify-between gap-3 py-4">
                  <div className="flex items-center gap-2.5 pt-0.5 text-sm font-medium text-foreground/80">
                    <BookOpen className="size-4 shrink-0 text-primary/70" />
                    Known Treks
                  </div>
                  <div className="flex max-w-xs flex-wrap justify-end gap-1.5">
                    {guide.known_treks?.length > 0 ? guide.known_treks.map((t) => (
                      <span key={t} className="rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2.5 py-0.5 text-xs font-medium text-emerald-400">
                        {t}
                      </span>
                    )) : <span className="text-sm text-muted-foreground/40">N/A</span>}
                  </div>
                </div>

                {/* Documents */}
                {(guide.id_proof_url || guide.cert_doc_url) && (
                  <div className="flex flex-wrap items-center justify-between gap-3 py-4">
                    <div className="flex items-center gap-2.5 text-sm font-medium text-foreground/80">
                      <FileText className="size-4 shrink-0 text-primary/70" />
                      Documents
                    </div>
                    <div className="flex flex-col items-end gap-1.5">
                      {guide.id_proof_url && (
                        <a
                          href={guide.id_proof_url.replace("/image/upload/", "/image/upload/f_auto/").replace("/raw/upload/", "/raw/upload/f_auto/")}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-sm text-primary transition-opacity hover:opacity-80"
                        >
                          <ExternalLink className="size-3" />
                          ID Proof
                        </a>
                      )}
                      {guide.cert_doc_url && (
                        <a
                          href={guide.cert_doc_url.replace("/image/upload/", "/image/upload/f_auto/").replace("/raw/upload/", "/raw/upload/f_auto/")}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-sm text-primary transition-opacity hover:opacity-80"
                        >
                          <ExternalLink className="size-3" />
                          Certificate
                        </a>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </section>
          )}
        </div>
      </div>
    </main>
  )
}