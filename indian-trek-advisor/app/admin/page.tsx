"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/utils/supabase/client"
import { toast } from "sonner"
import {
  Loader2,
} from "lucide-react"
import { AuditLog } from "@/components/admin/audit-log"
import { ErrorLog } from "@/components/admin/error-log"
import { inr } from "@/lib/pricing"

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

type Tab = "overview" | "users" | "guides" | "verifications" | "audit" | "errors"

const TABS: { id: Tab; label: string }[] = [
  { id: "overview", label: "Overview" },
  { id: "users", label: "Users" },
  { id: "guides", label: "Guides" },
  { id: "verifications", label: "Verifications" },
  { id: "audit", label: "Audit Log" },
  { id: "errors", label: "Error Log" },
]

export default function AdminPage() {
  const router = useRouter()
  const supabase = createClient()
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<Tab>("overview")

  const [allProfiles, setAllProfiles] = useState<Profile[]>([])
  const [allGuides, setAllGuides] = useState<Guide[]>([])
  const [allTrekkers, setAllTrekkers] = useState<Trekker[]>([])

  const [bookingStats, setBookingStats] = useState({
    total: 0,
    statusCount: {} as Record<string, number>,
    revenue: 0,
    paidRevenue: 0,
  })

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

      fetchBookingStats()
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

  async function fetchBookingStats() {
    try {
      const res = await fetch("/api/admin/bookings/stats")
      const data = await res.json()
      if (res.ok) {
        setBookingStats({
          total: data.total || 0,
          statusCount: data.statusCount || {},
          revenue: data.revenue || 0,
          paidRevenue: data.paidRevenue || 0,
        })
      }
    } catch {
      // leave as is
    }
  }

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

  const getGuideProfile = (userId: string) => allProfiles.find((p) => p.id === userId)

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
        <div className="flex flex-col items-center gap-3 text-muted-foreground">
          <Loader2 className="size-6 animate-spin" />
          <p className="text-sm">Loading…</p>
        </div>
      </div>
    )
  }

  return (
    <main className="min-h-screen bg-background pt-15">
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between border-b border-border pb-5">
          <div>
            <button
              onClick={() => router.push("/")}
              className="mb-3 inline-flex items-center gap-1.5 rounded-md border border-border px-3 py-1.5 text-sm font-medium text-foreground transition-colors hover:bg-accent"
            >
              ← Back to site
            </button>
            <h1 className="text-xl font-semibold text-foreground">Admin</h1>
            <p className="text-sm text-muted-foreground">Platform overview, users, guides and bookings.</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="mb-8 flex flex-wrap gap-x-1 gap-y-2 border-b border-border">
          {TABS.map((t) => {
            const active = tab === t.id
            const badge =
              t.id === "verifications" ? pendingGuides.length
              : t.id === "errors" ? 0
              : null
            const hasPending = t.id === "verifications" && pendingGuides.length > 0
            return (
              <button
                key={t.id}
                onClick={() => {
                  setTab(t.id)
                  setSearchQuery("")
                }}
                className={`-mb-px flex items-center gap-2 border-b-2 px-4 py-2.5 text-sm transition-colors ${
                  active
                    ? "border-foreground text-foreground"
                    : hasPending
                      ? "border-red-500 text-red-500"
                      : "border-transparent text-muted-foreground hover:text-foreground"
                }`}
              >
                {t.label}
                {typeof badge === "number" && badge > 0 && (
                  <span className="flex size-[18px] items-center justify-center rounded-full bg-red-500 text-[10px] font-medium text-background">
                    {badge}
                  </span>
                )}
              </button>
            )
          })}
        </div>

        {/* ═══ OVERVIEW ═══ */}
        {tab === "overview" && (
          <div className="space-y-8">
            <section>
              <h2 className="mb-3 text-sm font-medium text-muted-foreground">Accounts</h2>
              <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
                <StatCard label="Total Users" value={allProfiles.filter((p) => p.account_type !== "admin").length} />
                <StatCard label="Guides" value={allGuides.length} />
                <StatCard label="Trekkers" value={allTrekkers.length} />
                <StatCard label="Verified Guides" value={allGuides.filter((g) => g.verified).length} />
              </div>
            </section>

            <section>
              <h2 className="mb-3 text-sm font-medium text-muted-foreground">Bookings</h2>
              <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
                <StatCard label="Total Bookings" value={bookingStats.total} />
                <StatCard label="Successful Treks" value={bookingStats.statusCount.completed || 0} />
                <StatCard label="Revenue" value={inr(bookingStats.revenue)} />
              </div>
            </section>

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              <Panel
                title="Pending Verifications"
                action={pendingGuides.length > 0 ? {
                  label: "View all",
                  onClick: () => setTab("verifications"),
                } : undefined}
              >
                {pendingGuides.length === 0 ? (
                  <div className="py-10 text-center text-sm text-muted-foreground/60">
                    All guides verified.
                  </div>
                ) : (
                  <ul className="divide-y divide-border">
                    {pendingGuides.slice(0, 5).map((g) => {
                      const profile = getGuideProfile(g.user_id)
                      return (
                        <li key={g.user_id} className="flex items-center justify-between gap-3 py-3">
                          <div className="flex items-center gap-3 min-w-0">
                            <InitialAvatar name={profile?.name} />
                            <div className="min-w-0">
                              <p className="truncate text-sm font-medium text-foreground">{profile?.name || "Unknown"}</p>
                              <p className="truncate text-xs text-muted-foreground">{g.base_location || "No location"}</p>
                            </div>
                          </div>
                          <button
                            onClick={() => setTab("verifications")}
                            className="shrink-0 text-sm text-primary hover:underline"
                          >
                            Review
                          </button>
                        </li>
                      )
                    })}
                  </ul>
                )}
              </Panel>

              <Panel
                title="Recent Users"
                action={{ label: "View all", onClick: () => setTab("users") }}
              >
                <ul className="divide-y divide-border">
                  {allProfiles.filter((p) => p.account_type !== "admin").slice(0, 5).map((p) => (
                    <li key={p.id}>
                      <button
                        onClick={() => setSelectedUser(p)}
                        className="flex w-full items-center justify-between gap-3 py-3 text-left transition-colors hover:bg-muted/30 rounded-md px-2 -mx-2"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <InitialAvatar name={p.name} />
                          <div className="min-w-0">
                            <p className="truncate text-sm font-medium text-foreground">{p.name || "Unknown"}</p>
                            <p className="truncate text-xs text-muted-foreground">
                              {new Date(p.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                            </p>
                          </div>
                        </div>
                        <span className="shrink-0 text-xs text-muted-foreground capitalize">{p.account_type}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              </Panel>
            </div>
          </div>
        )}

        {/* ═══ USERS ═══ */}
        {tab === "users" && (
          <div className="space-y-4">
            <SearchBox value={searchQuery} onChange={setSearchQuery} placeholder="Search by name, email, city, phone, type…" count={filteredProfiles.length} label="users" />
            <div className="overflow-x-auto rounded-lg border border-border bg-card">
              <div className="min-w-[800px]">
                <div className="grid grid-cols-12 gap-4 border-b border-border bg-muted/40 px-4 py-2.5 text-xs font-medium text-muted-foreground">
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
                      className="grid w-full grid-cols-12 items-center gap-4 px-4 py-3 text-left transition-colors hover:bg-muted/30"
                    >
                      <div className="col-span-4 flex items-center gap-3 min-w-0">
                        <InitialAvatar name={p.name} />
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium text-foreground">{p.name || "Unknown"}</p>
                          <p className="truncate text-xs text-muted-foreground">{p.email}</p>
                        </div>
                      </div>
                      <div className="col-span-2 text-sm capitalize text-foreground">{p.account_type}</div>
                      <div className="col-span-2 text-sm text-muted-foreground">{p.city || "—"}</div>
                      <div className="col-span-2 text-sm text-muted-foreground">{p.phone || "—"}</div>
                      <div className="col-span-2 text-xs text-muted-foreground">
                        {new Date(p.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                      </div>
                    </button>
                  ))}
                  {filteredProfiles.length === 0 && (
                    <div className="px-4 py-12 text-center text-sm text-muted-foreground/60">No users found.</div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ═══ GUIDES ═══ */}
        {tab === "guides" && (
          <div className="space-y-4">
            <SearchBox value={searchQuery} onChange={setSearchQuery} placeholder="Search by name, location, experience, certification…" count={filteredGuides.length} label="guides" />
            <div className="space-y-3">
              {filteredGuides.map((g) => {
                const profile = getGuideProfile(g.user_id)
                const isExpanded = expandedGuide === g.user_id
                return (
                  <div key={g.user_id} className={`overflow-hidden rounded-lg border bg-card transition-colors ${
                    isExpanded ? "border-foreground/30" : "border-border"
                  }`}>
                    <button
                      onClick={() => setExpandedGuide(isExpanded ? null : g.user_id)}
                      className="flex w-full items-center gap-4 px-4 py-3.5 text-left"
                    >
                      <InitialAvatar name={profile?.name} />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2.5">
                          <p className="truncate text-sm font-medium text-foreground">{profile?.name || "Unknown"}</p>
                          <span className={`shrink-0 text-xs ${g.verified ? "text-emerald-600" : "text-amber-600"}`}>
                            ● {g.verified ? "Verified" : "Pending"}
                          </span>
                        </div>
                        <div className="mt-0.5 truncate text-xs text-muted-foreground">
                          {profile?.email}{g.base_location ? ` · ${g.base_location}` : ""}
                        </div>
                      </div>
                      <div className="flex shrink-0 items-center gap-2">
                        {g.verified ? (
                          <button
                            onClick={(e) => { e.stopPropagation(); handleVerifyGuide(g.user_id, false) }}
                            disabled={verifying === g.user_id}
                            className="rounded-md border border-border px-3 py-1.5 text-xs text-muted-foreground transition-colors hover:bg-accent hover:text-foreground disabled:opacity-50"
                          >
                            {verifying === g.user_id ? <Loader2 className="size-3.5 animate-spin" /> : "Revoke"}
                          </button>
                        ) : (
                          <button
                            onClick={(e) => { e.stopPropagation(); handleVerifyGuide(g.user_id, true) }}
                            disabled={verifying === g.user_id}
                            className="rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-50"
                          >
                            {verifying === g.user_id ? <Loader2 className="size-3.5 animate-spin" /> : "Verify"}
                          </button>
                        )}
                        <span className="text-muted-foreground/60 text-xs">{isExpanded ? "▼" : "▶"}</span>
                      </div>
                    </button>

                    {isExpanded && (
                      <div className="border-t border-border px-4 py-4 overflow-x-auto">
                        <div className="min-w-[600px] grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2 lg:grid-cols-3">
                          <div>
                            <h4 className="mb-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">Contact</h4>
                            <dl className="space-y-1 text-sm text-foreground">
                              <Row k="Email" v={profile?.email || "—"} />
                              <Row k="Phone" v={g.phone || profile?.phone || "—"} />
                              <Row k="City" v={profile?.city || "—"} />
                            </dl>
                          </div>
                          <div>
                            <h4 className="mb-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">Details</h4>
                            <dl className="space-y-1 text-sm text-foreground">
                              <Row k="Experience" v={g.experience || "—"} />
                              <Row k="Location" v={g.base_location || "—"} />
                              <TagRow label="Certifications" items={g.certifications} />
                            </dl>
                          </div>
                          <div>
                            <h4 className="mb-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">Known Treks</h4>
                            <TagRow label="Treks" items={g.known_treks} />
                          </div>
                        </div>

                        <div className="mt-4 border-t border-border pt-4">
                          <h4 className="mb-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">Documents</h4>
                          <div className="flex flex-wrap gap-2">
                            <DocLink href={g.id_proof_url} label="ID Proof" />
                            <DocLink href={g.cert_doc_url} label="Certificate" />
                            {!g.id_proof_url && !g.cert_doc_url && (
                              <span className="text-sm text-muted-foreground">No documents uploaded.</span>
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
              {filteredGuides.length === 0 && (
                <div className="rounded-lg border border-border bg-card px-4 py-12 text-center text-sm text-muted-foreground/60">No guides found.</div>
              )}
            </div>
          </div>
        )}

        {/* ═══ VERIFICATIONS ═══ */}
        {tab === "verifications" && (
          <div className="rounded-lg border border-border bg-card">
            <div className="border-b border-border px-5 py-4">
              <h3 className="text-base font-medium text-foreground">Pending Verifications</h3>
              <p className="mt-0.5 text-sm text-muted-foreground">Review guide documents and approve their accounts.</p>
            </div>
            {pendingGuides.length === 0 ? (
              <div className="px-5 py-16 text-center text-sm text-muted-foreground/60">All guides are verified.</div>
            ) : (
              <ul className="divide-y divide-border">
                {pendingGuides.map((g) => {
                  const profile = getGuideProfile(g.user_id)
                  return (
                    <li key={g.user_id} className="px-5 py-5">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex items-center gap-3">
                          <InitialAvatar name={profile?.name} />
                          <div>
                            <p className="text-sm font-medium text-foreground">{profile?.name || "Unknown"}</p>
                            <p className="text-xs text-muted-foreground">{profile?.email}</p>
                          </div>
                        </div>
                        <div className="flex shrink-0 gap-2">
                          <button
                            onClick={() => handleVerifyGuide(g.user_id, false)}
                            disabled={verifying === g.user_id}
                            className="rounded-md border border-border px-4 py-2 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-foreground disabled:opacity-50"
                          >
                            Reject
                          </button>
                          <button
                            onClick={() => handleVerifyGuide(g.user_id, true)}
                            disabled={verifying === g.user_id}
                            className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-50"
                          >
                            {verifying === g.user_id ? <Loader2 className="size-4 animate-spin" /> : "Approve"}
                          </button>
                        </div>
                      </div>

                      <div className="mt-4 grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2 overflow-x-auto">
                        <div className="min-w-[300px]">
                          <dl className="space-y-1 text-sm text-foreground">
                            <Row k="Experience" v={g.experience || "—"} />
                            <Row k="Location" v={g.base_location || "—"} />
                            <Row k="Phone" v={g.phone || profile?.phone || "—"} />
                            <TagRow label="Certifications" items={g.certifications} />
                            <TagRow label="Known Treks" items={g.known_treks} />
                          </dl>
                        </div>
                        <div className="min-w-[300px]">
                          <h4 className="mb-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">Documents</h4>
                          <div className="flex flex-wrap gap-2">
                            <DocLink href={g.id_proof_url} label="ID Proof" />
                            <DocLink href={g.cert_doc_url} label="Certificate" />
                            {!g.id_proof_url && !g.cert_doc_url && (
                              <span className="text-sm text-muted-foreground">None uploaded.</span>
                            )}
                          </div>
                        </div>
                      </div>
                    </li>
                  )
                })}
              </ul>
            )}
          </div>
        )}

        {/* ═══ AUDIT ═══ */}
        {tab === "audit" && (
          <div className="space-y-4">
            <div>
              <h3 className="text-base font-medium text-foreground">Audit Log</h3>
              <p className="mt-0.5 text-sm text-muted-foreground">Chronological record of booking status changes.</p>
            </div>
            <AuditLog />
          </div>
        )}

        {/* ═══ ERRORS ═══ */}
        {tab === "errors" && (
          <div className="space-y-4">
            <div>
              <h3 className="text-base font-medium text-foreground">Error Log</h3>
              <p className="mt-0.5 text-sm text-muted-foreground">Server-side failures from API routes.</p>
            </div>
            <ErrorLog />
          </div>
        )}

        {/* ═══ USER DETAIL MODAL ═══ */}
        {selectedUser && (() => {
          const selectedGuide = allGuides.find((g) => g.user_id === selectedUser.id)
          const selectedTrekker = allTrekkers.find((t) => t.user_id === selectedUser.id)
          const isGuideUser = selectedUser.account_type === "guide"

          return (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <div className="fixed inset-0 bg-black/50" onClick={() => setSelectedUser(null)} />
              <div className="relative w-full max-w-2xl overflow-hidden rounded-lg border border-border bg-card shadow-xl">
                <button
                  onClick={() => setSelectedUser(null)}
                  className="absolute right-4 top-4 z-10 text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  ✕
                </button>

                <div className="flex items-center gap-4 border-b border-border px-6 py-5">
                  <InitialAvatar name={selectedUser.name} large />
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <h2 className="truncate text-lg font-semibold text-foreground">{selectedUser.name || "Unknown"}</h2>
                      {isGuideUser && (
                        <span className={`text-xs ${selectedGuide?.verified ? "text-emerald-600" : "text-amber-600"}`}>
                          ● {selectedGuide?.verified ? "Verified" : "Pending"}
                        </span>
                      )}
                    </div>
                    <p className="truncate text-sm text-muted-foreground">{selectedUser.email}</p>
                    <p className="mt-1 text-xs capitalize text-muted-foreground">{selectedUser.account_type}</p>
                  </div>
                </div>

                <div className="max-h-[70vh] overflow-y-auto px-6 py-5">
                  <h3 className="mb-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">Contact</h3>
                  <div className="mb-6 grid grid-cols-2 gap-3">
                    <Field label="Phone" value={selectedUser.phone || selectedGuide?.phone || "—"} />
                    <Field label="City" value={selectedUser.city || "—"} />
                    <Field label="Bio" value={selectedUser.bio || "—"} span />
                    <Field label="Joined" value={new Date(selectedUser.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })} span />
                  </div>

                  {isGuideUser && selectedGuide && (
                    <>
                      <h3 className="mb-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">Guide Details</h3>
                      <div className="grid grid-cols-2 gap-3">
                        <Field label="Experience" value={selectedGuide.experience || "—"} />
                        <Field label="Base Location" value={selectedGuide.base_location || "—"} />
                      </div>
                      <div className="mt-4 flex flex-wrap gap-4">
                        {selectedGuide.certifications?.length > 0 && (
                          <div>
                            <h4 className="mb-1.5 text-xs font-medium uppercase tracking-wider text-muted-foreground">Certifications</h4>
                            <div className="flex flex-wrap gap-1.5"><Tags items={selectedGuide.certifications} /></div>
                          </div>
                        )}
                        {selectedGuide.known_treks?.length > 0 && (
                          <div>
                            <h4 className="mb-1.5 text-xs font-medium uppercase tracking-wider text-muted-foreground">Known Treks</h4>
                            <div className="flex flex-wrap gap-1.5"><Tags items={selectedGuide.known_treks} /></div>
                          </div>
                        )}
                      </div>
                      {(selectedGuide.id_proof_url || selectedGuide.cert_doc_url) && (
                        <div className="mt-4">
                          <h4 className="mb-1.5 text-xs font-medium uppercase tracking-wider text-muted-foreground">Documents</h4>
                          <div className="flex gap-2">
                            <DocLink small href={selectedGuide.id_proof_url} label="ID Proof" />
                            <DocLink small href={selectedGuide.cert_doc_url} label="Certificate" />
                          </div>
                        </div>
                      )}
                    </>
                  )}

                  {!isGuideUser && selectedTrekker && (
                    <div>
                      <h3 className="mb-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">Trekker Activity</h3>
                      <div className="grid grid-cols-2 gap-3">
                        <Field label="Saved Treks" value={selectedTrekker.saved_treks?.length || 0} />
                        <Field label="Reviews" value={selectedTrekker.review_count || 0} />
                      </div>
                      {selectedTrekker.saved_treks?.length > 0 && (
                        <div className="mt-3 flex flex-wrap gap-1.5"><Tags items={selectedTrekker.saved_treks} /></div>
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

/* ─── small presentational helpers ─── */

function StatCard({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="rounded-lg border border-border bg-card p-5">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 text-2xl font-semibold text-foreground">{value}</p>
    </div>
  )
}

function Panel({
  title,
  action,
  children,
}: {
  title: string
  action?: { label: string; onClick: () => void }
  children: React.ReactNode
}) {
  return (
    <div className="rounded-lg border border-border bg-card">
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <h3 className="text-sm font-medium text-foreground">{title}</h3>
        {action && (
          <button onClick={action.onClick} className="text-sm text-primary hover:underline">{action.label}</button>
        )}
      </div>
      <div className="px-4">{children}</div>
    </div>
  )
}

function InitialAvatar({ name, large }: { name?: string; large?: boolean }) {
  return (
    <span className={`flex shrink-0 items-center justify-center rounded-full border border-border bg-muted text-foreground ${large ? "size-12 text-base" : "size-9 text-sm"}`}>
      {name?.charAt(0)?.toUpperCase() || "?"}
    </span>
  )
}

function SearchBox({
  value,
  onChange,
  placeholder,
  count,
  label,
}: {
  value: string
  onChange: (v: string) => void
  placeholder: string
  count: number
  label: string
}) {
  return (
    <div className="flex items-center gap-3">
      <div className="relative flex-1">
        <input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="h-10 w-full rounded-md border border-border bg-card px-3 text-sm text-foreground outline-none placeholder:text-muted-foreground/50 focus:border-foreground/40"
        />
      </div>
      <span className="shrink-0 text-xs text-muted-foreground">{count} {label}</span>
    </div>
  )
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex items-baseline gap-2">
      <dt className="w-28 shrink-0 text-xs text-muted-foreground">{k}</dt>
      <dd className="text-sm text-foreground">{v}</dd>
    </div>
  )
}

function TagRow({ label, items }: { label: string; items?: string[] }) {
  if (!items || items.length === 0) return null
  return (
    <div className="flex items-start gap-2">
      <dt className="w-28 shrink-0 text-xs text-muted-foreground">{label}</dt>
      <dd className="flex flex-wrap gap-1.5"><Tags items={items} /></dd>
    </div>
  )
}

function Tags({ items }: { items: string[] }) {
  return (
    <>
      {items.map((t) => (
        <span key={t} className="rounded border border-border px-2 py-0.5 text-xs text-foreground">{t}</span>
      ))}
    </>
  )
}

function Field({ label, value, span }: { label: string; value: string | number; span?: boolean }) {
  return (
    <div className={`rounded-md border border-border bg-muted/20 px-3.5 py-2.5 ${span ? "col-span-2" : ""}`}>
      <p className="text-[10px] text-muted-foreground">{label}</p>
      <p className="mt-0.5 text-sm font-medium text-foreground">{value}</p>
    </div>
  )
}

function DocLink({ href, label, small }: { href?: string | null; label: string; small?: boolean }) {
  if (!href) return null
  const h = href.replace("/image/upload/", "/image/upload/f_auto/").replace("/raw/upload/", "/raw/upload/f_auto/")
  return (
    <a
      href={h}
      target="_blank"
      rel="noopener noreferrer"
      className={`inline-flex items-center rounded-md border border-border px-3 py-2 text-sm text-foreground transition-colors hover:bg-accent ${small ? "text-xs py-1.5" : ""}`}
    >
      {label}
    </a>
  )
}