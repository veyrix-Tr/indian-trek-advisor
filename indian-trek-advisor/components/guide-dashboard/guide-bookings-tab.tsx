"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { CheckCircle, XCircle, Clock, User, Calendar, FileText, AlertCircle } from "lucide-react"
import { STATUS_CONFIG, getStatusConfig } from "@/lib/booking-status"

interface Booking {
  id: string
  trek_id: string
  status: string
  booking_date: string
  notes?: string
  trekker?: { name: string; email: string }
  guides?: { trek_name: string; id: string }
}

interface GuideBookingsTabProps {
  bookings: Booking[]
  onRefresh?: () => void
  filterHint?: { filter: string; nonce: number }
}

const FILTERS = [
  { value: "all", label: "All" },
  { value: "pending", label: STATUS_CONFIG.pending.label },
  { value: "guide_approved", label: STATUS_CONFIG.guide_approved.label },
  { value: "admin_approved", label: STATUS_CONFIG.admin_approved.label },
  { value: "confirmed", label: STATUS_CONFIG.confirmed.label },
  { value: "completed", label: STATUS_CONFIG.completed.label },
  { value: "cancelled", label: STATUS_CONFIG.cancelled.label },
]

export function GuideBookingsTab({ bookings, onRefresh, filterHint }: GuideBookingsTabProps) {
  const [filter, setFilter] = useState(filterHint?.filter || "all")
  const [loadingId, setLoadingId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (filterHint) setFilter(filterHint.filter)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterHint?.nonce])

  const filtered = filter === "all"
    ? bookings
    : bookings.filter((b) => b.status === filter)

  const counts = {
    all: bookings.length,
    pending: bookings.filter((b) => b.status === "pending").length,
    guide_approved: bookings.filter((b) => b.status === "guide_approved").length,
    admin_approved: bookings.filter((b) => b.status === "admin_approved").length,
    confirmed: bookings.filter((b) => b.status === "confirmed").length,
    completed: bookings.filter((b) => b.status === "completed").length,
    cancelled: bookings.filter((b) => b.status === "cancelled").length,
  }

  async function handleAction(bookingId: string, action: "approve" | "reject" | "complete") {
    setLoadingId(bookingId)
    setError(null)
    try {
      let url = ""
      let body: Record<string, string> = {}

      if (action === "approve") {
        url = `/api/bookings/${bookingId}/approve-guide`
      } else if (action === "reject") {
        url = `/api/bookings/${bookingId}/cancel`
        body = { reason: "Guide unavailable" }
      } else if (action === "complete") {
        url = `/api/bookings/${bookingId}/complete`
      }

      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })

      if (res.ok) {
        onRefresh?.()
      } else {
        const data = await res.json()
        setError(data.error || "Action failed")
      }
    } catch (err) {
      setError("Network error. Please try again.")
    }
    setLoadingId(null)
  }

  return (
    <div className="space-y-4">
      {/* Error Display */}
      {error && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-2 rounded-lg border border-red-400/30 bg-red-400/10 px-4 py-3 text-sm text-red-400"
        >
          <AlertCircle className="size-4" />
          {error}
        </motion.div>
 )}

      {/* Filter Pills */}
      <div className="flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <button
            key={f.value}
            onClick={() => setFilter(f.value)}
            className={`rounded-full border px-3 py-1.5 font-mono text-[10px] uppercase tracking-widest transition-all duration-200 ${
              filter === f.value
                ? "border-primary/40 bg-primary/10 text-primary"
                : "border-border/40 bg-background/40 text-muted-foreground hover:bg-accent hover:text-foreground"
            }`}
          >
            {f.label}
            {counts[f.value as keyof typeof counts] > 0 && (
              <span className="ml-1.5 inline-flex size-4 items-center justify-center rounded-full bg-primary/20 text-[9px] font-bold">
                {counts[f.value as keyof typeof counts]}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Bookings List */}
      <AnimatePresence mode="wait">
        <motion.div
          key={filter}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.2 }}
          className="space-y-3"
        >
          {filtered.length === 0 ? (
            <Card className="border-border/60 bg-card/60 backdrop-blur-xl">
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Clock className="mb-3 size-8 text-muted-foreground/50" />
                <p className="text-sm text-muted-foreground">No bookings found</p>
              </CardContent>
            </Card>
          ) : (
            filtered.map((booking) => (
              <motion.div
                key={booking.id}
                layout
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
              >
                <Card className="border-border/60 bg-card/60 backdrop-blur-xl transition-all duration-200 hover:border-border/80 hover:shadow-lg">
                  <CardContent className="p-5">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center gap-3">
                          <div className="flex size-9 items-center justify-center rounded-xl bg-primary/10">
                            <User className="size-4 text-primary" />
                          </div>
                          <div>
                            <p className="font-semibold">
                              {booking.trekker?.name || "Unknown Trekker"}
                            </p>
                            <p className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                              {booking.trekker?.email}
                            </p>
                          </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-3 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Calendar className="size-3" />
                            {booking.booking_date}
                          </span>
                          {booking.guides?.trek_name && (
                            <span className="flex items-center gap-1">
                              <FileText className="size-3" />
                              {booking.guides.trek_name}
                            </span>
                          )}
                        </div>

                        {booking.notes && (
                          <p className="mt-1 rounded-lg bg-background/40 px-3 py-2 text-xs text-muted-foreground italic">
                            &ldquo;{booking.notes}&rdquo;
                          </p>
                        )}
                      </div>

                      <div className="flex flex-col items-end gap-1.5">
                        <div className="flex items-center gap-3">
                        <Badge className={`border text-[10px] font-mono uppercase tracking-wider transition-colors duration-200 ${getStatusConfig(booking.status).colorClass}`}>
                          {getStatusConfig(booking.status).label}
                        </Badge>

                        {booking.status === "pending" && (
                          <div className="flex gap-1.5">
                            <Button
                              size="sm"
                              disabled={loadingId === booking.id}
                              onClick={() => handleAction(booking.id, "approve")}
                              className="gap-1 bg-green-600 text-white hover:bg-green-700"
                            >
                              <CheckCircle className="size-3.5" />
                              Approve
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              disabled={loadingId === booking.id}
                              onClick={() => handleAction(booking.id, "reject")}
                              className="gap-1"
                            >
                              <XCircle className="size-3.5" />
                              Reject
                            </Button>
                          </div>
                        )}

                        {booking.status === "confirmed" && (
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={loadingId === booking.id}
                            onClick={() => handleAction(booking.id, "complete")}
                            className="gap-1 border-primary/30 text-primary hover:bg-primary/10"
                          >
                            <CheckCircle className="size-3.5" />
                            Mark Complete
                          </Button>
                        )}
                        </div>

                        {["guide_approved", "admin_approved"].includes(booking.status) && (
                          <p className="max-w-[220px] text-right text-[10px] text-muted-foreground">
                            {getStatusConfig(booking.status).description}
                          </p>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  )
}
