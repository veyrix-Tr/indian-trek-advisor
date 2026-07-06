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
      <div className="flex min-h-screen items-center justify-center">
        <div className="size-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    )
  }

  return (
    <main className="mx-auto max-w-4xl px-4 pb-16 pt-20 sm:px-6">
      <div className="flex items-start gap-4 sm:gap-6">
        <button
          onClick={() => router.back()}
          className="mt-1 flex size-10 shrink-0 items-center justify-center rounded-xl border border-border bg-card text-foreground/60 shadow-sm transition-colors hover:bg-accent hover:text-foreground"
          aria-label="Go back"
        >
          <ArrowLeft className="size-4" />
        </button>

        <div className="min-w-0 flex-1 space-y-5">
          {/* ── PROFILE CARD ── */}
          <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
            <div className="h-24 bg-gradient-to-r from-primary/25 via-primary/10 to-transparent sm:h-28" />

            <div className="px-6 pb-6 sm:px-8">
              <div className="-mt-10 flex flex-col items-start gap-4 sm:-mt-12 sm:flex-row sm:items-end sm:justify-between">
                <div className="flex items-end gap-4">
                  <span className="flex size-20 shrink-0 items-center justify-center rounded-full border-4 border-card bg-gradient-to-br from-primary to-primary/60 text-2xl font-bold text-primary-foreground shadow-md sm:size-24 sm:text-3xl">
                    {(profile?.name || user?.email || "U").charAt(0).toUpperCase()}
                  </span>
                  <div className="min-w-0 pb-1">
                    <h1 className="truncate text-lg font-semibold text-foreground sm:text-xl">
                      {profile?.name || "User"}
                    </h1>
                    <div className="mt-1 flex items-center gap-2">
                      <span className="inline-flex items-center rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium capitalize text-primary">
                        {profile?.account_type}
                      </span>
                      {guide?.verified && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-xs font-medium text-emerald-400">
                          <ShieldCheck className="size-3" />
                          Verified
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Email */}
              <div className="mt-6 flex items-center gap-3 rounded-xl border border-border bg-muted/30 px-4 py-3.5">
                <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground/70">
                  <Mail className="size-4" />
                </span>
                <div className="min-w-0">
                  <p className="text-xs text-muted-foreground/60">Email</p>
                  <p className="truncate text-sm font-medium text-foreground/90">{profile?.email}</p>
                </div>
              </div>

              {/* Editable fields */}
              <div className="mt-6 space-y-4">
                <div className="space-y-1.5">
                  <label className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground/70">
                    <UserRound className="size-3.5" />
                    Name
                  </label>
                  <input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="flex h-11 w-full items-center rounded-lg border border-border bg-muted/20 px-3.5 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground/30 focus:border-primary/50 focus:bg-muted/40"
                    placeholder="Your name"
                  />
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <label className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground/70">
                      <Phone className="size-3.5" />
                      Phone
                    </label>
                    <input
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="flex h-11 w-full items-center rounded-lg border border-border bg-muted/20 px-3.5 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground/30 focus:border-primary/50 focus:bg-muted/40"
                      placeholder="+91 98765 43210"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground/70">
                      <MapPin className="size-3.5" />
                      City
                    </label>
                    <input
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      className="flex h-11 w-full items-center rounded-lg border border-border bg-muted/20 px-3.5 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground/30 focus:border-primary/50 focus:bg-muted/40"
                      placeholder="Mumbai"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground/70">
                    <Quote className="size-3.5" />
                    Bio
                  </label>
                  <textarea
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    rows={4}
                    className="flex w-full resize-none rounded-lg border border-border bg-muted/20 px-3.5 py-3 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground/30 focus:border-primary/50 focus:bg-muted/40"
                    placeholder="Tell us about yourself..."
                  />
                </div>

                {error && (
                  <p className="rounded-lg border border-red-400/20 bg-red-400/5 px-3.5 py-2.5 text-sm text-red-400">
                    {error}
                  </p>
                )}

                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-primary text-sm font-semibold text-primary-foreground shadow-sm transition-opacity hover:opacity-90 disabled:opacity-50"
                >
                  <Save className="size-3.5" />
                  {saving ? "Saving…" : saved ? "Saved!" : "Save Changes"}
                </button>
              </div>
            </div>
          </div>

          {/* ── GUIDE INFO CARD ── */}
          {guide && (
            <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
              <div className="flex items-center gap-2 border-b border-border px-6 py-4">
                <Briefcase className="size-4 text-primary" />
                <h2 className="text-sm font-semibold text-foreground">Guide Profile</h2>
              </div>
              <div className="divide-y divide-border px-6 py-4">
                {/* Experience */}
                <div className="flex items-start justify-between py-3">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Award className="size-4 shrink-0" />
                    Experience
                  </div>
                  <select
                    value={experience}
                    onChange={(e) => setExperience(e.target.value)}
                    onBlur={() => { if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current); saveGuideFields(false) }}
                    className="max-w-44 cursor-pointer rounded-lg border border-border bg-muted/50 px-3 py-1.5 text-sm text-foreground outline-none transition-colors focus:border-primary/50 focus:bg-muted/70"
                  >
                    <option value="" className="bg-card text-muted-foreground">Select…</option>
                    <option value="1-2 years" className="bg-card">1-2 years</option>
                    <option value="3-5 years" className="bg-card">3-5 years</option>
                    <option value="5-10 years" className="bg-card">5-10 years</option>
                    <option value="10+ years" className="bg-card">10+ years</option>
                  </select>
                </div>

                {/* Base Location */}
                <div className="flex items-start justify-between py-3">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <MapPin className="size-4 shrink-0" />
                    Base Location
                  </div>
                  <input
                    value={baseLocation}
                    onChange={(e) => setBaseLocation(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current); saveGuideFields(false) } }}
                    onBlur={() => { if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current); saveGuideFields(false) }}
                    className="max-w-44 rounded-lg border border-border bg-muted/20 px-3 py-1.5 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground/30 focus:border-primary/50 focus:bg-muted/40"
                    placeholder="Manali, Himachal"
                  />
                </div>

                {/* Certifications */}
                <div className="flex items-start justify-between py-3">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Award className="size-4 shrink-0" />
                    Certifications
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {guide.certifications?.length > 0 ? guide.certifications.map((c) => (
                      <span key={c} className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary capitalize">
                        {c}
                      </span>
                    )) : <span className="text-sm text-muted-foreground/50">—</span>}
                  </div>
                </div>

                {/* Known Treks */}
                <div className="flex items-start justify-between py-3">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <BookOpen className="size-4 shrink-0" />
                    Known Treks
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {guide.known_treks?.length > 0 ? guide.known_treks.map((t) => (
                      <span key={t} className="rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-xs font-medium text-emerald-400">
                        {t}
                      </span>
                    )) : <span className="text-sm text-muted-foreground/50">—</span>}
                  </div>
                </div>

                {/* Documents */}
                {(guide.id_proof_url || guide.cert_doc_url) && (
                  <div className="flex items-start justify-between py-3">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <FileText className="size-4 shrink-0" />
                      Documents
                    </div>
                    <div className="flex flex-col gap-1.5 text-right">
                      {guide.id_proof_url && (
                        <a
                          href={guide.id_proof_url.replace("/image/upload/", "/image/upload/f_auto/").replace("/raw/upload/", "/raw/upload/f_auto/")}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
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
                          className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
                        >
                          <ExternalLink className="size-3" />
                          Certificate
                        </a>
                      )}
                    </div>
                  </div>
                )}

                {/* Verification */}
                <div className="flex items-start justify-between py-3">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <BadgeCheck className="size-4 shrink-0" />
                    Status
                  </div>
                  <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ${guide.verified ? "bg-emerald-500/10 text-emerald-400" : "bg-amber-500/10 text-amber-400"}`}>
                    {guide.verified ? "Verified" : "Pending Verification"}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </main>
  )
}
