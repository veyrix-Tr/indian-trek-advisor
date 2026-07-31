"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Save, MapPin, Award, Mountain, Phone, BadgeCheck, ShieldAlert } from "lucide-react"
import { GuideRatesSection } from "./guide-rates-section"
import { GuidePayoutSection } from "./guide-payout-section"

interface GuideProfile {
  experience?: string
  phone?: string
  base_location?: string
  certifications?: string[]
  known_treks?: string[]
  profiles?: { name: string; email: string }
  verified?: boolean
  profile_photo_url?: string
}

export function GuideSettingsTab({ profile }: { profile: GuideProfile | null }) {
  const [form, setForm] = useState({
    experience: "",
    phone: "",
    base_location: "",
    certifications: [] as string[],
    known_treks: [] as string[],
  })
  const [certInput, setCertInput] = useState("")
  const [trekInput, setTrekInput] = useState("")
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)

  useEffect(() => {
    if (profile) {
      setForm({
        experience: profile.experience || "",
        phone: profile.phone || "",
        base_location: profile.base_location || "",
        certifications: profile.certifications || [],
        known_treks: profile.known_treks || [],
      })
    }
  }, [profile])

  async function handleSave() {
    setSaving(true)
    setSaveError(null)
    try {
      const res = await fetch("/api/guide/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      })
      if (res.ok) {
        setSaved(true)
        setTimeout(() => setSaved(false), 2000)
      } else {
        const data = await res.json()
        setSaveError(data.error || "Failed to save profile")
        setTimeout(() => setSaveError(null), 3000)
      }
    } catch (err) {
      setSaveError("Network error. Please try again.")
      setTimeout(() => setSaveError(null), 3000)
    }
    setSaving(false)
  }

  function addCert() {
    if (certInput.trim() && !form.certifications.includes(certInput.trim())) {
      setForm({ ...form, certifications: [...form.certifications, certInput.trim()] })
      setCertInput("")
    }
  }

  function removeCert(cert: string) {
    setForm({ ...form, certifications: form.certifications.filter((c) => c !== cert) })
  }

  function addTrek() {
    if (trekInput.trim() && !form.known_treks.includes(trekInput.trim())) {
      setForm({ ...form, known_treks: [...form.known_treks, trekInput.trim()] })
      setTrekInput("")
    }
  }

  function removeTrek(trek: string) {
    setForm({ ...form, known_treks: form.known_treks.filter((t) => t !== trek) })
  }

  const completenessFields = [
    form.experience,
    form.phone,
    form.base_location,
    form.certifications.length > 0,
    form.known_treks.length > 0,
  ]
  const completedCount = completenessFields.filter(Boolean).length
  const isVerified = Boolean(profile?.verified)
  const guideName = profile?.profiles?.name || "Guide"
  const guideInitial = guideName.charAt(0).toUpperCase()

  return (
    <div className="space-y-5">
      {/* Verification / Trust Header */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      >
        <Card className={`overflow-hidden border-border/60 bg-gradient-to-br backdrop-blur-xl ${isVerified ? "from-primary/8 via-card/60 to-card/60" : "from-status-pending/8 via-card/60 to-card/60"}`}>
          <CardContent className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-4">
              <div className="relative shrink-0">
                {profile?.profile_photo_url ? (
                  <img
                    src={profile.profile_photo_url}
                    alt={guideName}
                    className="size-14 rounded-full object-cover ring-2 ring-card"
                  />
                ) : (
                  <div className="flex size-14 items-center justify-center rounded-full bg-gradient-to-br from-amber-400 to-amber-600 text-lg font-bold text-white ring-2 ring-card">
                    {guideInitial}
                  </div>
                )}
                <span
                  className={`absolute -bottom-1 -right-1 flex size-5 items-center justify-center rounded-full ring-2 ring-card ${isVerified ? "bg-primary text-primary-foreground" : "bg-status-pending text-background"}`}
                >
                  {isVerified ? <BadgeCheck className="size-3" /> : <ShieldAlert className="size-3" />}
                </span>
              </div>
              <div>
                <p className="text-sm font-semibold">{guideName}</p>
                <p className={`mt-0.5 font-mono text-[10px] uppercase tracking-widest ${isVerified ? "text-primary" : "text-status-pending"}`}>
                  {isVerified ? "Verified Guide" : "Verification Pending"}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {isVerified
                    ? "Trekkers can find and book you."
                    : "Our team typically reviews new guides within 48 hours."}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 self-start sm:self-center">
              <div className="h-1.5 w-24 overflow-hidden rounded-full bg-muted/50">
                <div
                  className="h-full rounded-full bg-primary transition-all duration-500"
                  style={{ width: `${(completedCount / completenessFields.length) * 100}%` }}
                />
              </div>
              <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                {completedCount}/{completenessFields.length}
              </span>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.05, ease: [0.22, 1, 0.36, 1] }}
      >
      <Card className="border-border/60 bg-card/60 backdrop-blur-xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-sm font-semibold">
            <MapPin className="size-4 text-primary" />
            Guide Profile Settings
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          {/* Experience */}
          <div>
            <label className="mb-1.5 block font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
              Experience
            </label>
            <select
              value={form.experience}
              onChange={(e) => setForm({ ...form, experience: e.target.value })}
              className="w-full rounded-xl border border-border/60 bg-background/40 px-4 py-2.5 text-sm text-foreground outline-none transition-colors focus:border-primary/40"
            >
              <option value="">Select experience level</option>
              <option value="beginner">Beginner (0-2 years)</option>
              <option value="intermediate">Intermediate (2-5 years)</option>
              <option value="experienced">Experienced (5-10 years)</option>
              <option value="expert">Expert (10+ years)</option>
            </select>
          </div>

          {/* Phone */}
          <div>
            <label className="mb-1.5 block font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
              Phone Number
            </label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <input
                type="tel"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                placeholder="+91 98765 43210"
                className="w-full rounded-xl border border-border/60 bg-background/40 py-2.5 pl-10 pr-4 text-sm text-foreground outline-none transition-colors focus:border-primary/40"
              />
            </div>
          </div>

          {/* Base Location */}
          <div>
            <label className="mb-1.5 block font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
              Base Location
            </label>
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                value={form.base_location}
                onChange={(e) => setForm({ ...form, base_location: e.target.value })}
                placeholder="e.g., Sankri, Uttarakhand"
                className="w-full rounded-xl border border-border/60 bg-background/40 py-2.5 pl-10 pr-4 text-sm text-foreground outline-none transition-colors focus:border-primary/40"
              />
            </div>
          </div>

          {/* Certifications */}
          <div>
            <label className="mb-1.5 block font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
              Certifications
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={certInput}
                onChange={(e) => setCertInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addCert())}
                placeholder="Add certification..."
                className="flex-1 rounded-xl border border-border/60 bg-background/40 px-4 py-2.5 text-sm text-foreground outline-none transition-colors focus:border-primary/40"
              />
              <Button size="sm" variant="outline" onClick={addCert} className="gap-1">
                <Award className="size-3.5" />
                Add
              </Button>
            </div>
            {form.certifications.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1.5">
                {form.certifications.map((cert) => (
                  <Badge
                    key={cert}
                    variant="secondary"
                    className="cursor-pointer gap-1 bg-primary/10 text-primary hover:bg-primary/20"
                    onClick={() => removeCert(cert)}
                  >
                    {cert}
                    <span className="ml-0.5 text-[10px]">×</span>
                  </Badge>
                ))}
              </div>
            )}
          </div>

          {/* Known Treks */}
          <div>
            <label className="mb-1.5 block font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
              Known Treks
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={trekInput}
                onChange={(e) => setTrekInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addTrek())}
                placeholder="Add trek name..."
                className="flex-1 rounded-xl border border-border/60 bg-background/40 px-4 py-2.5 text-sm text-foreground outline-none transition-colors focus:border-primary/40"
              />
              <Button size="sm" variant="outline" onClick={addTrek} className="gap-1">
                <Mountain className="size-3.5" />
                Add
              </Button>
            </div>
            {form.known_treks.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1.5">
                {form.known_treks.map((trek) => (
                  <Badge
                    key={trek}
                    variant="secondary"
                    className="cursor-pointer gap-1 bg-blue-400/10 text-blue-400 hover:bg-blue-400/20"
                    onClick={() => removeTrek(trek)}
                  >
                    {trek}
                    <span className="ml-0.5 text-[10px]">×</span>
                  </Badge>
                ))}
              </div>
            )}
          </div>

          {/* Save Button */}
          <div className="flex items-center gap-3 pt-2">
            <Button
              onClick={handleSave}
              disabled={saving}
              className="gap-1.5"
            >
              <Save className="size-4" />
              {saving ? "Saving..." : saved ? "Saved!" : "Save Changes"}
            </Button>
            {saved && (
              <motion.span
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                className="font-mono text-xs text-primary"
              >
                Profile updated successfully
              </motion.span>
            )}
            {saveError && (
              <motion.span
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                className="font-mono text-xs text-destructive"
              >
                {saveError}
              </motion.span>
            )}
          </div>
        </CardContent>
      </Card>
      </motion.div>

      <GuideRatesSection />
      <GuidePayoutSection />
    </div>
  )
}
