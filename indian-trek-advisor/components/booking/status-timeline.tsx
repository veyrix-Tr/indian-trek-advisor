"use client"

import { useEffect, useState } from "react"
import { motion } from "framer-motion"
import { History, Check, X, Clock, Loader2 } from "lucide-react"

export interface StatusHistoryItem {
  id: string
  from_status: string
  to_status: string
  actor_role?: string
  note?: string
  created_at: string
  actor?: { name?: string } | null
}

const STEP_LABEL: Record<string, string> = {
  none: "Requested",
  pending: "Requested",
  guide_approved: "Guide confirmed",
  confirmed: "Confirmed",
  completed: "Completed",
  cancelled: "Cancelled",
}

const ROLE_LABEL: Record<string, string> = {
  trekker: "Trekker",
  guide: "Guide",
  admin: "Admin",
}

export function StatusTimeline({
  bookingId,
  bookingDate,
}: {
  bookingId: string
  bookingDate: string
}) {
  const [history, setHistory] = useState<StatusHistoryItem[] | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const res = await fetch(`/api/bookings/${bookingId}/history`)
        const data = await res.json()
        if (!cancelled) setHistory(data.history || [])
      } catch {
        if (!cancelled) setError("Could not load history")
      }
    })()
    return () => {
      cancelled = true
    }
  }, [bookingId])

  if (error) return null
  if (!history) {
    return (
      <div className="flex items-center gap-2 py-2 text-xs text-muted-foreground">
        <Loader2 className="size-3 animate-spin" />
        Loading timeline...
      </div>
    )
  }
  if (history.length === 0) return null

  const createdAt = new Date(history[0]?.created_at ?? bookingDate).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  })

  return (
    <div className="mt-4 rounded-xl border border-border/60 bg-background/40 p-4">
      <p className="mb-3 flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
        <History className="size-3" />
        Booking Timeline
      </p>
      <ol className="space-y-0">
        {history.map((item, i) => {
          const cancelled = item.to_status === "cancelled"
          const available = item.to_status !== "cancelled"
          const last = i === history.length - 1
          return (
            <motion.li
              key={item.id}
              initial={{ opacity: 0, x: -6 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.04 }}
              className="relative flex gap-3 pb-4 last:pb-0"
            >
              {i < history.length - 1 && (
                <span className="absolute left-[7px] top-5 h-full w-px bg-border" />
              )}
              <span
                className={`mt-0.5 flex size-4 shrink-0 items-center justify-center rounded-full border ${
                  cancelled
                    ? "border-destructive/40 bg-destructive/10"
                    : last
                    ? "border-primary/40 bg-primary/10"
                    : "border-border/60 bg-muted/40"
                }`}
              >
                {cancelled ? (
                  <X className="size-2.5 text-destructive" />
                ) : available ? (
                  <Check className="size-2.5 text-primary" />
                ) : null}
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-xs font-medium text-foreground">
                    {STEP_LABEL[item.to_status] ?? item.to_status}
                  </p>
                  <span className="shrink-0 text-[10px] text-muted-foreground">
                    {new Date(item.created_at).toLocaleString("en-IN", {
                      day: "numeric",
                      month: "short",
                      hour: "numeric",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
                <p className="text-[10px] text-muted-foreground">
                  {item.actor_role && ROLE_LABEL[item.actor_role]
                    ? `${ROLE_LABEL[item.actor_role]}${item.actor?.name ? ` · ${item.actor.name}` : ""}`
                    : item.actor?.name || "System"}
                </p>
                {item.note && (
                  <p className="mt-0.5 text-[11px] italic text-muted-foreground">
                    &ldquo;{item.note}&rdquo;
                  </p>
                )}
              </div>
            </motion.li>
          )
        })}
      </ol>
      <div className="mt-3 flex items-center gap-1.5 text-[10px] text-muted-foreground">
        <Clock className="size-3" />
        Request placed {createdAt}
      </div>
    </div>
  )
}