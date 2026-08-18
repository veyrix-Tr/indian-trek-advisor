"use client"

import { useEffect, useState } from "react"
import {
  Search, Loader2, History, ArrowRight, RefreshCw,
  ShieldCheck, UserRound, User, Filter, Calendar, Mountain,
} from "lucide-react"

interface AuditEntry {
  id: string
  booking_id: string
  from_status: string
  to_status: string
  actor_role: string
  note?: string | null
  created_at: string
  actor?: { name?: string; email?: string } | null
  booking?: {
    trek_id?: string
    booking_date?: string
    trek_days?: number
    status?: string
  } | null
}

const ROLE_ICON = {
  admin: ShieldCheck,
  guide: UserRound,
  trekker: User,
}

const STATUS_LABEL: Record<string, string> = {
  none: "Requested",
  pending: "Pending",
  guide_approved: "Guide Accepted",
  confirmed: "Confirmed",
  completed: "Completed",
  cancelled: "Cancelled",
}

function statusColorClass(status: string): string {
  switch (status) {
    case "confirmed":
    case "completed":
      return "border-emerald-500/30 bg-emerald-500/10 text-emerald-400"
    case "cancelled":
      return "border-red-500/30 bg-red-500/10 text-red-400"
    case "guide_approved":
      return "border-primary/30 bg-primary/10 text-primary"
    default:
      return "border-border/50 bg-muted/40 text-muted-foreground"
  }
}

export function AuditLog() {
  const [entries, setEntries] = useState<AuditEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [toFilter, setToFilter] = useState("")
  const [actorFilter, setActorFilter] = useState("")
  const [refreshing, setRefreshing] = useState(false)

  async function load() {
    const params = new URLSearchParams()
    if (search.trim()) params.set("search", search.trim())
    if (toFilter) params.set("to", toFilter)
    if (actorFilter) params.set("actor", actorFilter)
    try {
      const res = await fetch(`/api/admin/audit?${params.toString()}`)
      const data = await res.json()
      setEntries(data.history || [])
    } catch {
      setEntries([])
    }
    setLoading(false)
  }

  useEffect(() => {
    const t = setTimeout(load, 300)
    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, toFilter, actorFilter])

  async function handleRefresh() {
    setRefreshing(true)
    await load()
    setRefreshing(false)
  }

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground/50" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by actor, note, trek, date, status…"
            className="h-11 w-full rounded-xl border border-border bg-card pl-11 pr-4 text-sm text-foreground outline-none placeholder:text-muted-foreground/30 focus:border-primary/50 focus:ring-2 focus:ring-primary/20"
          />
        </div>

        <div className="flex items-center gap-2">
          <Filter className="size-4 text-muted-foreground/50" />
          <select
            value={toFilter}
            onChange={(e) => setToFilter(e.target.value)}
            className="h-11 rounded-xl border border-border bg-card px-3 text-sm text-foreground outline-none focus:border-primary/50"
          >
            <option value="">All statuses</option>
            {Object.entries(STATUS_LABEL).map(([k, v]) => (
              <option key={k} value={k}>{v}</option>
            ))}
          </select>
          <select
            value={actorFilter}
            onChange={(e) => setActorFilter(e.target.value)}
            className="h-11 rounded-xl border border-border bg-card px-3 text-sm text-foreground outline-none focus:border-primary/50"
          >
            <option value="">All actors</option>
            <option value="admin">Admin</option>
            <option value="guide">Guide</option>
            <option value="trekker">Trekker</option>
          </select>
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="flex h-11 w-11 items-center justify-center rounded-xl border border-border bg-card text-muted-foreground transition-colors hover:bg-accent hover:text-foreground disabled:opacity-50"
          >
            <RefreshCw className={`size-4 ${refreshing ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-border bg-card py-16">
          <Loader2 className="mb-3 size-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground/50">Loading audit log…</p>
        </div>
      ) : entries.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border/60 bg-card py-16">
          <History className="mb-3 size-10 text-muted-foreground/30" />
          <p className="text-base font-medium text-foreground">No audit entries</p>
          <p className="mt-1 text-sm text-muted-foreground/50">Booking status changes will appear here.</p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {entries.map((e) => {
            const RoleIcon = ROLE_ICON[e.actor_role as keyof typeof ROLE_ICON] || User
            return (
              <div
                key={e.id}
                className="flex items-start gap-3.5 rounded-2xl border border-border bg-card p-4 transition-all hover:border-border/80 hover:shadow-sm"
              >
                <span className={`mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-xl ${
                  e.actor_role === "admin"
                    ? "bg-red-500/10 text-red-400"
                    : e.actor_role === "guide"
                    ? "bg-amber-500/10 text-amber-400"
                    : "bg-blue-500/10 text-blue-400"
                }`}>
                  <RoleIcon className="size-4" />
                </span>

                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-sm font-semibold text-foreground">
                      {e.actor?.name || capitalize(e.actor_role)}
                    </p>
                    <span className="rounded-full bg-muted/50 px-2 py-0.5 text-[10px] font-medium uppercase text-muted-foreground">
                      {e.actor_role}
                    </span>
                    <span className="text-xs text-muted-foreground/50">
                      {formatTime(e.created_at)}
                    </span>
                  </div>

                  <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                    <StatusPill status={e.from_status} />
                    <ArrowRight className="size-3.5 text-muted-foreground/40" />
                    <StatusPill status={e.to_status} />
                    {e.note && (
                      <span className="text-xs italic text-muted-foreground/80">&ldquo;{e.note}&rdquo;</span>
                    )}
                  </div>

                  {(e.booking?.trek_id || e.booking?.booking_date) && (
                    <div className="mt-1.5 flex flex-wrap items-center gap-3 text-[11px] text-muted-foreground/60">
                      {e.booking.trek_id && (
                        <span className="flex items-center gap-1">
                          <Mountain className="size-3" />
                          Trek #{e.booking.trek_id}
                        </span>
                      )}
                      {e.booking.booking_date && (
                        <span className="flex items-center gap-1">
                          <Calendar className="size-3" />
                          {e.booking.booking_date}
                        </span>
                      )}
                      {e.booking.trek_days && (
                        <span>{e.booking.trek_days} day{e.booking.trek_days > 1 ? "s" : ""}</span>
                      )}
                      <span className="rounded bg-muted/40 px-1.5 py-0.5">Booking · {e.booking_id.slice(0, 8)}</span>
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

function StatusPill({ status }: { status: string }) {
  return (
    <span className={`inline-flex rounded-full border px-2 py-0.5 text-[10px] font-medium ${statusColorClass(status)}`}>
      {STATUS_LABEL[status] || status}
    </span>
  )
}

function capitalize(s: string) {
  return s ? s.charAt(0).toUpperCase() + s.slice(1) : s
}

function formatTime(iso: string) {
  try {
    return new Date(iso).toLocaleString("en-IN", {
      day: "numeric", month: "short", hour: "numeric", minute: "2-digit",
    })
  } catch {
    return iso
  }
}