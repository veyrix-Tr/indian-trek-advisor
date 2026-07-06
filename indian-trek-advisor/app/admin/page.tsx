"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/utils/supabase/client"
import { toast } from "sonner"
import {
  Users, ShieldCheck, UserRound, MapPin, Award, BookOpen,
  FileText, BadgeCheck, Search, ChevronDown, ChevronUp,
  ExternalLink, Loader2, Mountain, TrendingUp, Clock,
  CheckCircle2, XCircle, Phone, Mail, Calendar, Star, X,
  BarChart3, Activity, UserX, UserCheck, Eye, ArrowLeft,
} from "lucide-react"

interface Profile {
  id: string
  name: string
  email: string
  account_type: string
  city: string | null
  phone: string | null
  bio: string | null
  created_at: string
}

interface Guide {
  id: string
  user_id: string
  experience: string | null
  phone: string | null
  base_location: string | null
  certifications: string[]
  known_treks: string[]
  id_proof_url: string | null
  cert_doc_url: string | null
  verified: boolean
  created_at: string
  profiles?: Profile
}

interface Trekker {
  id: string
  user_id: string
  saved_treks: string[]
  review_count: number
  profiles?: Profile
}

type Tab = "overview" | "users" | "guides" | "verifications"

export default function AdminPage() {
  const router = useRouter()
  const supabase = createClient()
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<Tab>("overview")

  const [allProfiles, setAllProfiles] = useState<Profile[]>([])
  const [allGuides, setAllGuides] = useState<Guide[]>([])
  const [allTrekkers, setAllTrekkers] = useState<Trekker[]>([])

  const [searchQuery, setSearchQuery] = useState("")
  const [expandedGuide, setExpandedGuide] = useState<string | null>(null)
  const [verifying, setVerifying] = useState<string | null>(null)
  const [selectedUser, setSelectedUser] = useState<Profile | null>(null)

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.replace("/"); return }

      const { data: profile } = await supabase.from("profiles").select("account_type").eq("id", user.id).single()
      if (profile?.account_type !== "admin") { router.replace("/"); return }

      const [profilesRes, guidesRes, trekkersRes] = await Promise.all([
        supabase.from("profiles").select("*").order("created_at", { ascending: false }),
        supabase.from("guides").select("*").order("created_at", { ascending: false }),
        supabase.from("trekkers").select("*"),
      ])

      setAllProfiles(profilesRes.data || [])
      setAllGuides(guidesRes.data || [])
      setAllTrekkers(trekkersRes.data || [])
      setLoading(false)
    }
    load()

    const interval = setInterval(async () => {
      const [profilesRes, guidesRes, trekkersRes] = await Promise.all([
        supabase.from("profiles").select("*").order("created_at", { ascending: false }),
        supabase.from("guides").select("*").order("created_at", { ascending: false }),
        supabase.from("trekkers").select("*"),
      ])
      setAllProfiles(profilesRes.data || [])
      setAllGuides(guidesRes.data || [])
      setAllTrekkers(trekkersRes.data || [])
    }, 5000)

    return () => clearInterval(interval)
  }, [supabase, router])

  async function handleVerifyGuide(userId: string, verified: boolean) {
    setVerifying(userId)
    await fetch("/api/admin/verify-guide", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, verified }),
    })
    setAllGuides((prev) =>
      prev.map((g) => (g.user_id === userId ? { ...g, verified } : g))
    )
    toast.success(verified ? "Guide verified" : "Verification revoked")
    setVerifying(null)
  }

  function getGuideProfile(userId: string) {
    return allProfiles.find((p) => p.id === userId)
  }

  const filteredProfiles = allProfiles.filter((p) => {
    if (p.account_type === "admin") return false
    const q = searchQuery.toLowerCase()
    return (
      p.name?.toLowerCase().includes(q) ||
      p.email?.toLowerCase().includes(q) ||
      p.city?.toLowerCase().includes(q) ||
      p.phone?.includes(q) ||
      p.account_type?.toLowerCase().includes(q)
    )
  })

  const filteredGuides = allGuides.filter((g) => {
    const profile = getGuideProfile(g.user_id)
    const q = searchQuery.toLowerCase()
    return (
      profile?.name?.toLowerCase().includes(q) ||
      profile?.email?.toLowerCase().includes(q) ||
      g.base_location?.toLowerCase().includes(q) ||
      g.experience?.toLowerCase().includes(q) ||
      g.certifications?.some((c) => c.toLowerCase().includes(q)) ||
      g.known_treks?.some((t) => t.toLowerCase().includes(q))
    )
  })

  const pendingGuides = allGuides.filter((g) => !g.verified)

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="size-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground/50">Loading admin dashboard…</p>
        </div>
      </div>
    )
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      <div className="mx-auto max-w-7xl px-4 pb-16 pt-24 sm:px-6">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push("/")}
              className="flex size-10 items-center justify-center rounded-xl border border-border bg-card text-foreground/60 shadow-sm transition-colors hover:bg-accent hover:text-foreground"
            >
              <ArrowLeft className="size-4" />
            </button>
            <div className="flex items-center gap-3">
              <span className="flex size-11 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 shadow-lg shadow-amber-500/20">
                <Mountain className="size-6 text-black" />
              </span>
              <div>
                <h1 className="text-2xl font-bold text-foreground">Admin Dashboard</h1>
                <p className="text-sm text-muted-foreground/70">Indian Trek Advisor N/A Management Console</p>
              </div>
            </div>
          </div>
          <div className="hidden items-center gap-2 sm:flex">
            <span className="rounded-full bg-amber-500/10 px-3 py-1 text-xs font-medium text-amber-400">
              {allProfiles.filter((p) => p.account_type !== "admin").length} Users
            </span>
            <span className="rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-400">
              {allGuides.length} Guides
            </span>
            <span className="rounded-full bg-blue-500/10 px-3 py-1 text-xs font-medium text-blue-400">
              {allTrekkers.length} Trekkers
            </span>
          </div>
        </div>

        {/* Tabs */}
        <div className="mb-6 flex gap-1 rounded-2xl border border-border bg-card p-1.5 shadow-sm">
          {([
            { id: "overview" as Tab, label: "Overview", icon: BarChart3 },
            { id: "users" as Tab, label: "All Users", icon: Users },
            { id: "guides" as Tab, label: "All Guides", icon: ShieldCheck },
            { id: "verifications" as Tab, label: "Verifications", icon: BadgeCheck, badge: pendingGuides.length },
          ]).map((t) => (
            <button
              key={t.id}
              onClick={() => { setTab(t.id); setSearchQuery("") }}
              className={`flex items-center gap-2 rounded-xl px-5 py-3 text-sm font-medium transition-all duration-200 ${
                tab === t.id
                  ? "bg-primary text-primary-foreground shadow-md shadow-primary/20"
                  : "text-muted-foreground hover:bg-accent hover:text-foreground"
              }`}
            >
              <t.icon className="size-4" />
              {t.label}
              {t.badge ? (
                <span className={`flex size-5 items-center justify-center rounded-full text-[10px] font-bold ${
                  tab === "verifications" ? "bg-white/20 text-white" : "bg-amber-500 text-black"
                }`}>
                  {t.badge}
                </span>
              ) : null}
            </button>
          ))}
        </div>

        {/* ═══ OVERVIEW TAB ═══ */}
        {tab === "overview" && (
          <div className="space-y-6">
            {/* Stats Grid */}
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              {[
                { label: "Total Users", value: allProfiles.filter((p) => p.account_type !== "admin").length, icon: Users, color: "from-blue-400 to-blue-600", bg: "bg-blue-500/10" },
                { label: "Guides", value: allGuides.length, icon: ShieldCheck, color: "from-amber-400 to-orange-500", bg: "bg-amber-500/10" },
                { label: "Trekkers", value: allTrekkers.length, icon: UserRound, color: "from-emerald-400 to-emerald-600", bg: "bg-emerald-500/10" },
                { label: "Verified", value: allGuides.filter((g) => g.verified).length, icon: UserCheck, color: "from-green-400 to-green-600", bg: "bg-green-500/10" },
              ].map((stat, i) => (
                <div key={stat.label} className="group relative overflow-hidden rounded-2xl border border-border bg-card p-5 transition-all duration-300 hover:shadow-lg hover:shadow-primary/5 hover:border-primary/20">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-medium text-muted-foreground/70">{stat.label}</p>
                      <p className="mt-1.5 text-3xl font-bold text-foreground">{stat.value}</p>
                    </div>
                    <span className={`flex size-12 items-center justify-center rounded-2xl bg-gradient-to-br ${stat.color} shadow-lg transition-transform duration-300 group-hover:scale-110`}>
                      <stat.icon className="size-6 text-white" />
                    </span>
                  </div>
                  <div className={`absolute inset-x-0 bottom-0 h-1 ${stat.bg}`} />
                </div>
              ))}
            </div>

            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              {/* Pending Verifications */}
              <div className="rounded-2xl border border-border bg-card p-5">
                <div className="mb-4 flex items-center justify-between">
                  <h3 className="flex items-center gap-2 text-sm font-semibold text-foreground">
                    <Clock className="size-4 text-amber-400" />
                    Pending Verifications
                  </h3>
                  {pendingGuides.length > 0 && (
                    <button
                      onClick={() => setTab("verifications")}
                      className="text-xs font-medium text-primary hover:underline"
                    >
                      View All →
                    </button>
                  )}
                </div>
                {pendingGuides.length === 0 ? (
                  <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border/60 py-8">
                    <BadgeCheck className="mb-2 size-8 text-emerald-500/50" />
                    <p className="text-sm text-muted-foreground/50">All guides verified</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {pendingGuides.slice(0, 4).map((g) => {
                      const profile = getGuideProfile(g.user_id)
                      return (
                        <div key={g.user_id} className="flex items-center justify-between rounded-xl border border-border/50 px-3 py-2.5 transition-colors hover:bg-muted/20">
                          <div className="flex items-center gap-3 min-w-0">
                            <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-amber-400 to-amber-600 text-xs font-bold text-white">
                              {profile?.name?.charAt(0)?.toUpperCase() || "U"}
                            </span>
                            <div className="min-w-0">
                              <p className="truncate text-sm font-medium text-foreground">{profile?.name || "Unknown"}</p>
                              <p className="truncate text-xs text-muted-foreground/50">{g.base_location || "No location"}</p>
                            </div>
                          </div>
                          <button
                            onClick={() => setTab("verifications")}
                            className="shrink-0 rounded-lg bg-primary/10 px-3 py-1.5 text-xs font-medium text-primary transition-colors hover:bg-primary/20"
                          >
                            Review
                          </button>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>

              {/* Recent Users */}
              <div className="rounded-2xl border border-border bg-card p-5">
                <div className="mb-4 flex items-center justify-between">
                  <h3 className="flex items-center gap-2 text-sm font-semibold text-foreground">
                    <Activity className="size-4 text-blue-400" />
                    Recent Users
                  </h3>
                  <button
                    onClick={() => setTab("users")}
                    className="text-xs font-medium text-primary hover:underline"
                  >
                    View All →
                  </button>
                </div>
                <div className="space-y-2">
                  {allProfiles.filter((p) => p.account_type !== "admin").slice(0, 4).map((p) => (
                    <button
                      key={p.id}
                      onClick={() => setSelectedUser(p)}
                      className="flex w-full items-center justify-between rounded-xl border border-border/50 px-3 py-2.5 text-left transition-colors hover:bg-muted/20"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-amber-400 to-amber-600 text-xs font-bold text-white">
                          {p.name?.charAt(0)?.toUpperCase() || "U"}
                        </span>
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium text-foreground">{p.name || "Unknown"}</p>
                          <p className="truncate text-xs text-muted-foreground/50">
                            {new Date(p.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                          </p>
                        </div>
                      </div>
                      <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium ${
                        p.account_type === "guide"
                          ? "bg-amber-500/10 text-amber-400"
                          : "bg-blue-500/10 text-blue-400"
                      }`}>
                        {p.account_type}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ═══ USERS TAB ═══ */}
        {tab === "users" && (
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground/50" />
                <input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by name, email, city, phone, type…"
                  className="h-11 w-full rounded-xl border border-border bg-card pl-11 pr-4 text-sm text-foreground outline-none placeholder:text-muted-foreground/30 focus:border-primary/50 focus:ring-2 focus:ring-primary/20"
                />
              </div>
              <span className="shrink-0 rounded-full bg-muted/50 px-3 py-1.5 text-xs font-medium text-muted-foreground">
                {filteredProfiles.length} users
              </span>
            </div>

            <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
              <div className="grid grid-cols-12 gap-4 border-b border-border bg-muted/30 px-5 py-3 text-xs font-medium text-muted-foreground/70">
                <div className="col-span-4">User</div>
                <div className="col-span-2">Type</div>
                <div className="col-span-2">City</div>
                <div className="col-span-2">Phone</div>
                <div className="col-span-2">Joined</div>
              </div>
              <div className="divide-y divide-border">
                {filteredProfiles.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => setSelectedUser(p)}
                    className="grid w-full grid-cols-12 items-center gap-4 px-5 py-3.5 text-left transition-colors hover:bg-muted/20"
                  >
                    <div className="col-span-4 flex items-center gap-3 min-w-0">
                      <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-amber-400 to-amber-600 text-xs font-bold text-white">
                        {p.name?.charAt(0)?.toUpperCase() || "U"}
                      </span>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-foreground">{p.name || "Unknown"}</p>
                        <p className="truncate text-xs text-muted-foreground/50">{p.email}</p>
                      </div>
                    </div>
                    <div className="col-span-2">
                      <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                        p.account_type === "guide"
                          ? "bg-amber-500/10 text-amber-400"
                          : "bg-blue-500/10 text-blue-400"
                      }`}>
                        {p.account_type}
                      </span>
                    </div>
                    <div className="col-span-2 text-sm text-muted-foreground/70">{p.city || "N/A"}</div>
                    <div className="col-span-2 text-sm text-muted-foreground/70">{p.phone || "N/A"}</div>
                    <div className="col-span-2 text-xs text-muted-foreground/50">
                      {new Date(p.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                    </div>
                  </button>
                ))}
                {filteredProfiles.length === 0 && (
                  <div className="px-5 py-12 text-center">
                    <UserX className="mx-auto mb-2 size-8 text-muted-foreground/30" />
                    <p className="text-sm text-muted-foreground/50">No users found</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ═══ GUIDES TAB ═══ */}
        {tab === "guides" && (
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground/50" />
                <input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search guides by name, location, experience, certification…"
                  className="h-11 w-full rounded-xl border border-border bg-card pl-11 pr-4 text-sm text-foreground outline-none placeholder:text-muted-foreground/30 focus:border-primary/50 focus:ring-2 focus:ring-primary/20"
                />
              </div>
              <span className="shrink-0 rounded-full bg-muted/50 px-3 py-1.5 text-xs font-medium text-muted-foreground">
                {filteredGuides.length} guides
              </span>
            </div>

            <div className="space-y-3">
              {filteredGuides.map((g) => {
                const profile = getGuideProfile(g.user_id)
                const isExpanded = expandedGuide === g.user_id

                return (
                  <div key={g.user_id} className={`overflow-hidden rounded-2xl border bg-card transition-all duration-200 ${
                    isExpanded ? "border-primary/30 shadow-lg shadow-primary/5" : "border-border hover:border-border/80 hover:shadow-md"
                  }`}>
                    {/* Guide Row */}
                    <div
                      role="button"
                      tabIndex={0}
                      onClick={() => setExpandedGuide(isExpanded ? null : g.user_id)}
                      onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setExpandedGuide(isExpanded ? null : g.user_id) } }}
                      className="flex w-full cursor-pointer items-center gap-4 px-5 py-4 text-left"
                    >
                      <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-amber-400 to-amber-600 text-sm font-bold text-white shadow-md shadow-amber-500/20">
                        {profile?.name?.charAt(0)?.toUpperCase() || "G"}
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <p className="truncate text-sm font-semibold text-foreground">{profile?.name || "Unknown"}</p>
                          {g.verified ? (
                            <span className="inline-flex items-center gap-0.5 rounded-full bg-emerald-500/10 px-1.5 py-0.5 text-[10px] font-medium text-emerald-400">
                              <BadgeCheck className="size-3" /> Verified
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-0.5 rounded-full bg-amber-500/10 px-1.5 py-0.5 text-[10px] font-medium text-amber-400">
                              <Clock className="size-3" /> Pending
                            </span>
                          )}
                        </div>
                        <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-muted-foreground/50">
                          <span className="flex items-center gap-1"><Mail className="size-3" />{profile?.email}</span>
                          {g.base_location && <span className="flex items-center gap-1"><MapPin className="size-3" />{g.base_location}</span>}
                          {g.experience && <span className="flex items-center gap-1"><Award className="size-3" />{g.experience}</span>}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {!g.verified && (
                          <button
                            onClick={(e) => { e.stopPropagation(); handleVerifyGuide(g.user_id, true) }}
                            disabled={verifying === g.user_id}
                            className="flex items-center gap-1.5 rounded-lg bg-emerald-500/10 px-3.5 py-2 text-xs font-medium text-emerald-400 transition-colors hover:bg-emerald-500/20 disabled:opacity-50"
                          >
                            {verifying === g.user_id ? <Loader2 className="size-3.5 animate-spin" /> : <CheckCircle2 className="size-3.5" />}
                            Verify
                          </button>
                        )}
                        {g.verified && (
                          <button
                            onClick={(e) => { e.stopPropagation(); handleVerifyGuide(g.user_id, false) }}
                            disabled={verifying === g.user_id}
                            className="flex items-center gap-1.5 rounded-lg bg-red-500/10 px-3.5 py-2 text-xs font-medium text-red-400 transition-colors hover:bg-red-500/20 disabled:opacity-50"
                          >
                            {verifying === g.user_id ? <Loader2 className="size-3.5 animate-spin" /> : <XCircle className="size-3.5" />}
                            Revoke
                          </button>
                        )}
                        <ChevronDown className={`size-4 text-muted-foreground/50 transition-transform duration-200 ${isExpanded ? "rotate-180" : ""}`} />
                      </div>
                    </div>

                    {/* Expanded Details */}
                    {isExpanded && (
                      <div className="border-t border-border bg-gradient-to-b from-muted/20 to-transparent px-5 py-5">
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                          {/* Contact Card */}
                          <div className="rounded-xl border border-border/50 bg-card/50 p-4">
                            <h4 className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground/70">
                              <Phone className="size-3.5" />
                              Contact
                            </h4>
                            <div className="space-y-2">
                              <p className="flex items-center gap-2.5 text-sm text-foreground">
                                <Mail className="size-3.5 text-muted-foreground/50" />
                                {profile?.email || "N/A"}
                              </p>
                              <p className="flex items-center gap-2.5 text-sm text-foreground">
                                <Phone className="size-3.5 text-muted-foreground/50" />
                                {g.phone || profile?.phone || "N/A"}
                              </p>
                              <p className="flex items-center gap-2.5 text-sm text-foreground">
                                <MapPin className="size-3.5 text-muted-foreground/50" />
                                {profile?.city || "N/A"}
                              </p>
                            </div>
                          </div>

                          {/* Guide Info Card */}
                          <div className="rounded-xl border border-border/50 bg-card/50 p-4">
                            <h4 className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground/70">
                              <Award className="size-3.5" />
                              Guide Info
                            </h4>
                            <div className="space-y-2">
                              <p className="flex items-center gap-2.5 text-sm text-foreground">
                                <Award className="size-3.5 text-muted-foreground/50" />
                                {g.experience || "N/A"}
                              </p>
                              <p className="flex items-center gap-2.5 text-sm text-foreground">
                                <MapPin className="size-3.5 text-muted-foreground/50" />
                                {g.base_location || "N/A"}
                              </p>
                              <div className="flex flex-wrap gap-1 pt-1">
                                {g.certifications?.map((c) => (
                                  <span key={c} className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary">{c}</span>
                                ))}
                                {(!g.certifications || g.certifications.length === 0) && (
                                  <span className="text-xs text-muted-foreground/50">N/A</span>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Known Treks Card */}
                          <div className="rounded-xl border border-border/50 bg-card/50 p-4">
                            <h4 className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground/70">
                              <Mountain className="size-3.5" />
                              Known Treks
                            </h4>
                            <div className="flex flex-wrap gap-1">
                              {g.known_treks?.map((t) => (
                                <span key={t} className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-medium text-emerald-400">{t}</span>
                              ))}
                              {(!g.known_treks || g.known_treks.length === 0) && (
                                <span className="text-xs text-muted-foreground/50">N/A</span>
                              )}
                            </div>
                          </div>

                          {/* Documents Card */}
                          <div className="rounded-xl border border-border/50 bg-card/50 p-4 sm:col-span-2 lg:col-span-3">
                            <h4 className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground/70">
                              <FileText className="size-3.5" />
                              Documents
                            </h4>
                            <div className="flex gap-4">
                              {g.id_proof_url && (
                                <a
                                  href={g.id_proof_url.replace("/image/upload/", "/image/upload/f_auto/").replace("/raw/upload/", "/raw/upload/f_auto/")}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="flex items-center gap-2 rounded-lg border border-primary/20 bg-primary/5 px-4 py-2.5 text-sm font-medium text-primary transition-colors hover:bg-primary/10"
                                >
                                  <FileText className="size-4" />
                                  ID Proof
                                  <ExternalLink className="size-3" />
                                </a>
                              )}
                              {g.cert_doc_url && (
                                <a
                                  href={g.cert_doc_url.replace("/image/upload/", "/image/upload/f_auto/").replace("/raw/upload/", "/raw/upload/f_auto/")}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="flex items-center gap-2 rounded-lg border border-primary/20 bg-primary/5 px-4 py-2.5 text-sm font-medium text-primary transition-colors hover:bg-primary/10"
                                >
                                  <FileText className="size-4" />
                                  Certificate
                                  <ExternalLink className="size-3" />
                                </a>
                              )}
                              {!g.id_proof_url && !g.cert_doc_url && (
                                <p className="text-sm text-muted-foreground/50">No documents uploaded</p>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
              {filteredGuides.length === 0 && (
                <div className="rounded-2xl border border-border bg-card px-5 py-12 text-center">
                  <ShieldCheck className="mx-auto mb-2 size-8 text-muted-foreground/30" />
                  <p className="text-sm text-muted-foreground/50">No guides found</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ═══ VERIFICATIONS TAB ═══ */}
        {tab === "verifications" && (
          <div className="space-y-4">
            <div className="rounded-2xl border border-border bg-card p-6">
              <div className="mb-5">
                <h3 className="text-lg font-semibold text-foreground">Pending Verifications</h3>
                <p className="mt-1 text-sm text-muted-foreground/50">Review guide documents and approve their accounts.</p>
              </div>

              {pendingGuides.length === 0 ? (
                <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border/60 py-16">
                  <span className="mb-3 flex size-14 items-center justify-center rounded-full bg-emerald-500/10">
                    <BadgeCheck className="size-8 text-emerald-500/60" />
                  </span>
                  <p className="text-base font-medium text-foreground">All caught up!</p>
                  <p className="mt-1 text-sm text-muted-foreground/50">All guides are verified.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {pendingGuides.map((g) => {
                    const profile = getGuideProfile(g.user_id)
                    return (
                      <div key={g.user_id} className="rounded-2xl border border-border/60 p-5 transition-all hover:border-primary/20 hover:shadow-md hover:shadow-primary/5">
                        <div className="flex items-start gap-4">
                          <span className="flex size-12 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-amber-400 to-amber-600 text-base font-bold text-white shadow-lg shadow-amber-500/20">
                            {profile?.name?.charAt(0)?.toUpperCase() || "G"}
                          </span>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                              <p className="text-base font-semibold text-foreground">{profile?.name || "Unknown"}</p>
                              <span className="rounded-full bg-amber-500/10 px-2 py-0.5 text-[10px] font-medium text-amber-400">Pending Review</span>
                            </div>
                            <p className="mt-0.5 text-sm text-muted-foreground/50">{profile?.email}</p>

                            <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                              {/* Guide Details */}
                              <div className="rounded-xl bg-muted/30 p-4">
                                <h4 className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground/70">
                                  <UserRound className="size-3.5" />
                                  Guide Details
                                </h4>
                                <div className="space-y-2">
                                  <p className="text-sm text-foreground">
                                    <span className="text-muted-foreground/50">Experience: </span>
                                    {g.experience || "N/A"}
                                  </p>
                                  <p className="text-sm text-foreground">
                                    <span className="text-muted-foreground/50">Location: </span>
                                    {g.base_location || "N/A"}
                                  </p>
                                  <p className="text-sm text-foreground">
                                    <span className="text-muted-foreground/50">Phone: </span>
                                    {g.phone || profile?.phone || "N/A"}
                                  </p>
                                  {g.certifications?.length > 0 && (
                                    <div className="flex flex-wrap gap-1 pt-1">
                                      {g.certifications.map((c) => (
                                        <span key={c} className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary">{c}</span>
                                      ))}
                                    </div>
                                  )}
                                  {g.known_treks?.length > 0 && (
                                    <div className="flex flex-wrap gap-1 pt-1">
                                      {g.known_treks.map((t) => (
                                        <span key={t} className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-medium text-emerald-400">{t}</span>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              </div>

                              {/* Documents */}
                              <div className="rounded-xl bg-muted/30 p-4">
                                <h4 className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground/70">
                                  <FileText className="size-3.5" />
                                  Uploaded Documents
                                </h4>
                                <div className="space-y-2">
                                  {g.id_proof_url && (
                                    <a
                                      href={g.id_proof_url.replace("/image/upload/", "/image/upload/f_auto/").replace("/raw/upload/", "/raw/upload/f_auto/")}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="flex items-center gap-2 rounded-lg border border-primary/20 bg-primary/5 px-3 py-2 text-sm font-medium text-primary transition-colors hover:bg-primary/10"
                                    >
                                      <Eye className="size-4" />
                                      View ID Proof
                                      <ExternalLink className="size-3 ml-auto" />
                                    </a>
                                  )}
                                  {g.cert_doc_url && (
                                    <a
                                      href={g.cert_doc_url.replace("/image/upload/", "/image/upload/f_auto/").replace("/raw/upload/", "/raw/upload/f_auto/")}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="flex items-center gap-2 rounded-lg border border-primary/20 bg-primary/5 px-3 py-2 text-sm font-medium text-primary transition-colors hover:bg-primary/10"
                                    >
                                      <Eye className="size-4" />
                                      View Certificate
                                      <ExternalLink className="size-3 ml-auto" />
                                    </a>
                                  )}
                                  {!g.id_proof_url && !g.cert_doc_url && (
                                    <div className="flex flex-col items-center rounded-lg border border-dashed border-border/60 py-4">
                                      <FileText className="mb-1 size-6 text-muted-foreground/30" />
                                      <p className="text-xs text-muted-foreground/50">No documents uploaded</p>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Action Buttons */}
                          <div className="flex shrink-0 flex-col gap-2">
                            <button
                              onClick={() => handleVerifyGuide(g.user_id, true)}
                              disabled={verifying === g.user_id}
                              className="flex items-center gap-1.5 rounded-xl bg-emerald-500 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-emerald-500/20 transition-all hover:bg-emerald-600 hover:shadow-emerald-500/30 disabled:opacity-50"
                            >
                              {verifying === g.user_id ? <Loader2 className="size-4 animate-spin" /> : <CheckCircle2 className="size-4" />}
                              Approve
                            </button>
                            <button
                              onClick={() => handleVerifyGuide(g.user_id, false)}
                              disabled={verifying === g.user_id}
                              className="flex items-center gap-1.5 rounded-xl border border-red-500/30 bg-red-500/10 px-5 py-2.5 text-sm font-semibold text-red-400 transition-all hover:bg-red-500/20 disabled:opacity-50"
                            >
                              <XCircle className="size-4" />
                              Reject
                            </button>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ═══ USER DETAIL MODAL ═══ */}
        {selectedUser && (() => {
          const selectedGuide = allGuides.find((g) => g.user_id === selectedUser.id)
          const selectedTrekker = allTrekkers.find((t) => t.user_id === selectedUser.id)
          const isGuideUser = selectedUser.account_type === "guide"

          return (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setSelectedUser(null)} />
              <div className="relative w-full max-w-3xl overflow-hidden rounded-2xl border border-border bg-card shadow-2xl">
                <button
                  onClick={() => setSelectedUser(null)}
                  className="absolute right-3 top-3 z-10 flex size-11 items-center justify-center rounded-full border-2 border-white/20 bg-red-500 text-white shadow-xl shadow-red-500/30 transition-all duration-200 hover:bg-red-600 hover:shadow-red-500/40 hover:rotate-90 active:scale-90"
                >
                  <X className="size-5" strokeWidth={3} />
                </button>
                {/* Header */}
                <div className="relative bg-gradient-to-br from-primary/20 via-primary/10 to-transparent px-6 py-6">
                  <svg className="absolute inset-0 h-full w-full opacity-[0.1]" viewBox="0 0 400 100" preserveAspectRatio="none">
                    <path d="M0 80 L60 40 L110 65 L170 20 L230 55 L290 15 L340 45 L400 25" fill="none" stroke="currentColor" strokeWidth="2" className="text-primary" />
                  </svg>
                  <div className="relative flex items-center gap-4">
                    <span className="flex size-16 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 text-2xl font-bold text-white shadow-lg shadow-amber-500/20">
                      {selectedUser.name?.charAt(0)?.toUpperCase() || "U"}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <h2 className="truncate text-xl font-bold text-foreground">{selectedUser.name || "Unknown"}</h2>
                        {isGuideUser && selectedGuide?.verified && (
                          <span className="inline-flex items-center gap-0.5 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-medium text-emerald-400">
                            <BadgeCheck className="size-3" /> Verified
                          </span>
                        )}
                        {isGuideUser && selectedGuide && !selectedGuide.verified && (
                          <span className="inline-flex items-center gap-0.5 rounded-full bg-amber-500/10 px-2 py-0.5 text-[10px] font-medium text-amber-400">
                            <Clock className="size-3" /> Pending
                          </span>
                        )}
                      </div>
                      <p className="mt-0.5 text-sm text-muted-foreground/70">{selectedUser.email}</p>
                      <div className="mt-1.5 flex items-center gap-2">
                        <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-medium ${
                          isGuideUser
                            ? "border-amber-500/25 bg-amber-500/10 text-amber-400"
                            : "border-blue-500/25 bg-blue-500/10 text-blue-400"
                        }`}>
                          {isGuideUser ? <ShieldCheck className="size-3" /> : <UserRound className="size-3" />}
                          {selectedUser.account_type}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Body */}
                <div className="max-h-[75vh] overflow-y-auto px-6 py-5">
                  {/* Contact Info */}
                  <div className="mb-5">
                    <h3 className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground/70">
                      <Phone className="size-3.5" />
                      Contact Information
                    </h3>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="rounded-xl border border-border/50 bg-muted/20 px-3.5 py-2.5">
                        <p className="text-[10px] text-muted-foreground/50">Phone</p>
                        <p className="mt-0.5 text-sm font-medium text-foreground">{selectedUser.phone || selectedGuide?.phone || "N/A"}</p>
                      </div>
                      <div className="rounded-xl border border-border/50 bg-muted/20 px-3.5 py-2.5">
                        <p className="text-[10px] text-muted-foreground/50">City</p>
                        <p className="mt-0.5 text-sm font-medium text-foreground">{selectedUser.city || "N/A"}</p>
                      </div>
                      <div className="col-span-2 rounded-xl border border-border/50 bg-muted/20 px-3.5 py-2.5">
                        <p className="text-[10px] text-muted-foreground/50">Bio</p>
                        <p className="mt-0.5 text-sm font-medium text-foreground">{selectedUser.bio || "N/A"}</p>
                      </div>
                      <div className="col-span-2 rounded-xl border border-border/50 bg-muted/20 px-3.5 py-2.5">
                        <p className="text-[10px] text-muted-foreground/50">Joined</p>
                        <p className="mt-0.5 text-sm font-medium text-foreground">
                          {new Date(selectedUser.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Guide-specific info */}
                  {isGuideUser && selectedGuide && (
                    <>
                      <div className="mb-5">
                        <h3 className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground/70">
                          <ShieldCheck className="size-3.5" />
                          Guide Details
                        </h3>
                        <div className="grid grid-cols-2 gap-2">
                          <div className="rounded-xl border border-border/50 bg-muted/20 px-3.5 py-2.5">
                            <p className="text-[10px] text-muted-foreground/50">Experience</p>
                            <p className="mt-0.5 text-sm font-medium text-foreground">{selectedGuide.experience || "N/A"}</p>
                          </div>
                          <div className="rounded-xl border border-border/50 bg-muted/20 px-3.5 py-2.5">
                            <p className="text-[10px] text-muted-foreground/50">Base Location</p>
                            <p className="mt-0.5 text-sm font-medium text-foreground">{selectedGuide.base_location || "N/A"}</p>
                          </div>
                        </div>
                      </div>

                      {(selectedGuide.certifications?.length > 0 || selectedGuide.known_treks?.length > 0) && (
                        <div className="mb-5 flex gap-4">
                          {selectedGuide.certifications?.length > 0 && (
                            <div className="flex-1">
                              <h3 className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground/70">
                                <Award className="size-3.5" />
                                Certifications
                              </h3>
                              <div className="flex flex-wrap gap-1.5">
                                {selectedGuide.certifications.map((c) => (
                                  <span key={c} className="rounded-full border border-primary/20 bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary">{c}</span>
                                ))}
                              </div>
                            </div>
                          )}
                          {selectedGuide.known_treks?.length > 0 && (
                            <div className="flex-1">
                              <h3 className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground/70">
                                <Mountain className="size-3.5" />
                                Known Treks
                              </h3>
                              <div className="flex flex-wrap gap-1.5">
                                {selectedGuide.known_treks.map((t) => (
                                  <span key={t} className="rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2.5 py-1 text-xs font-medium text-emerald-400">{t}</span>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      )}

                      {(selectedGuide.id_proof_url || selectedGuide.cert_doc_url) && (
                        <div className="mb-5">
                          <h3 className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground/70">
                            <FileText className="size-3.5" />
                            Documents
                          </h3>
                          <div className="flex gap-2">
                            {selectedGuide.id_proof_url && (
                              <a
                                href={selectedGuide.id_proof_url.replace("/image/upload/", "/image/upload/f_auto/").replace("/raw/upload/", "/raw/upload/f_auto/")}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-1.5 rounded-lg border border-primary/20 bg-primary/5 px-3 py-2 text-xs font-medium text-primary transition-colors hover:bg-primary/10"
                              >
                                <Eye className="size-3.5" />
                                ID Proof
                                <ExternalLink className="size-3" />
                              </a>
                            )}
                            {selectedGuide.cert_doc_url && (
                              <a
                                href={selectedGuide.cert_doc_url.replace("/image/upload/", "/image/upload/f_auto/").replace("/raw/upload/", "/raw/upload/f_auto/")}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-1.5 rounded-lg border border-primary/20 bg-primary/5 px-3 py-2 text-xs font-medium text-primary transition-colors hover:bg-primary/10"
                              >
                                <Eye className="size-3.5" />
                                Certificate
                                <ExternalLink className="size-3" />
                              </a>
                            )}
                          </div>
                        </div>
                      )}
                    </>
                  )}

                  {/* Trekker-specific info */}
                  {!isGuideUser && selectedTrekker && (
                    <div className="mb-5">
                      <h3 className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground/70">
                        <UserRound className="size-3.5" />
                        Trekker Activity
                      </h3>
                      <div className="grid grid-cols-2 gap-2">
                        <div className="rounded-xl border border-border/50 bg-muted/20 px-3.5 py-2.5">
                          <p className="text-[10px] text-muted-foreground/50">Saved Treks</p>
                          <p className="mt-0.5 text-sm font-medium text-foreground">{selectedTrekker.saved_treks?.length || 0}</p>
                        </div>
                        <div className="rounded-xl border border-border/50 bg-muted/20 px-3.5 py-2.5">
                          <p className="text-[10px] text-muted-foreground/50">Reviews</p>
                          <p className="mt-0.5 text-sm font-medium text-foreground">{selectedTrekker.review_count || 0}</p>
                        </div>
                      </div>
                      {selectedTrekker.saved_treks?.length > 0 && (
                        <div className="mt-3">
                          <p className="mb-1.5 text-[10px] text-muted-foreground/50">Saved Treks</p>
                          <div className="flex flex-wrap gap-1.5">
                            {selectedTrekker.saved_treks.map((t) => (
                              <span key={t} className="rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2.5 py-1 text-xs font-medium text-emerald-400">{t}</span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )
        })()}
      </div>
    </main>
  )
}
