"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Calendar, ArrowRight, MapPin, Clock, User, Bell, CheckCircle, XCircle } from "lucide-react"
import { getStatusConfig } from "@/lib/booking-status"

interface Booking {
  id: string
  trek_id: string
  status: string
  booking_date: string
  notes?: string
  created_at?: string
  trekker?: { name: string; email: string }
  guides?: { trek_name: string; id: string }
}

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.06 } },
}

const item = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { duration: 0.35, ease: [0.22, 1, 0.36, 1] as const } },
}

function timeAgo(dateStr?: string) {
  if (!dateStr) return null
  const diffMs = Date.now() - new Date(dateStr).getTime()
  const hrs = Math.floor(diffMs / 3_600_000)
  if (hrs < 1) return "Just now"
  if (hrs < 24) return `${hrs}h ago`
  const days = Math.floor(hrs / 24)
  return `${days}d ago`
}

function ActionRequiredPanel({
  pending,
  onRefresh,
  onViewAllRequests,
}: {
  pending: Booking[]
  onRefresh?: () => void
  onViewAllRequests?: () => void
}) {
  const [loadingId, setLoadingId] = useState<string | null>(null)

  if (pending.length === 0) return null

  const visible = pending.slice(0, 3)
  const remaining = pending.length - visible.length

  async function handleAction(bookingId: string, action: "approve" | "reject") {
    setLoadingId(bookingId)
    try {
      const url =
        action === "approve"
          ? `/api/bookings/${bookingId}/approve-guide`
          : `/api/bookings/${bookingId}/cancel`
      const body = action === "reject" ? { reason: "Guide unavailable" } : {}
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })
      if (res.ok) onRefresh?.()
    } catch {
      // swallowed — the row simply stops loading and stays visible for retry
    }
    setLoadingId(null)
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
    >
      <Card className="overflow-hidden border-status-pending/30 bg-gradient-to-br from-status-pending/8 via-card/60 to-card/60 backdrop-blur-xl">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-sm font-semibold">
            <span className="relative flex size-4 items-center justify-center">
              <span className="absolute inline-flex size-full animate-ping rounded-full bg-status-pending/50" />
              <Bell className="relative size-4 text-status-pending" />
            </span>
            Action Required
            <Badge className="ml-1 border-status-pending/25 bg-status-pending/15 text-status-pending font-mono text-[10px]">
              {pending.length}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <AnimatePresence initial={false}>
            {visible.map((booking) => (
              <motion.div
                key={booking.id}
                layout
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: 24, scale: 0.97 }}
                transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                className="flex flex-col gap-3 rounded-xl border border-border/40 bg-background/50 px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="truncate text-sm font-medium">
                      {booking.trekker?.name || "Unknown Trekker"}
                    </p>
                    {timeAgo(booking.created_at) && (
                      <span className="shrink-0 font-mono text-[9px] uppercase tracking-wider text-muted-foreground">
                        {timeAgo(booking.created_at)}
                      </span>
                    )}
                  </div>
                  <div className="mt-0.5 flex flex-wrap items-center gap-2 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                    <Clock className="size-3" />
                    {booking.booking_date}
                    {booking.guides?.trek_name && <span>· {booking.guides.trek_name}</span>}
                  </div>
                </div>
                <div className="flex shrink-0 gap-1.5">
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
              </motion.div>
            ))}
          </AnimatePresence>
          {remaining > 0 && (
            <button
              onClick={onViewAllRequests}
              className="flex w-full items-center justify-center gap-1 rounded-lg border border-status-pending/25 py-2 font-mono text-[10px] uppercase tracking-widest text-status-pending transition-colors hover:bg-status-pending/10"
            >
              View all {pending.length} requests
              <ArrowRight className="size-3" />
            </button>
          )}
        </CardContent>
      </Card>
    </motion.div>
  )
}

export function GuideOverviewTab({
  bookings,
  guideName,
  rating,
  onRefresh,
  onViewAllRequests,
}: {
  bookings: Booking[]
  guideName: string
  rating: number
  onRefresh?: () => void
  onViewAllRequests?: () => void
}) {
  const pending = bookings.filter((b) => b.status === "pending")

  const upcoming = bookings
    .filter((b) => ["guide_approved", "admin_approved", "confirmed"].includes(b.status))
    .slice(0, 5)

  const recentCompleted = bookings
    .filter((b) => b.status === "completed")
    .slice(0, 5)

  return (
    <div className="space-y-6">
      {/* Welcome Card */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      >
        <Card className="overflow-hidden border-border/60 bg-gradient-to-br from-primary/5 via-card/60 to-card/60 backdrop-blur-xl">
          <CardContent className="p-6 sm:p-8">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="font-mono text-[10px] uppercase tracking-widest text-primary">
                  Welcome back
                </p>
                <h2 className="mt-1 text-2xl font-bold tracking-tight">
                  {guideName}
                </h2>
                <div className="mt-2 flex items-center gap-3">
                  {rating > 0 && (
                    <div className="flex items-center gap-1">
                      <span className="text-yellow-400">★</span>
                      <span className="font-mono text-sm font-bold">{rating.toFixed(1)}</span>
                      <span className="font-mono text-[10px] uppercase text-muted-foreground">rating</span>
                    </div>
                  )}
                  <div className="flex items-center gap-1 text-muted-foreground">
                    <MapPin className="size-3" />
                    <span className="font-mono text-xs">Guide</span>
                  </div>
                </div>
              </div>
              <div className="flex gap-2">
                <Link href="/treks">
                  <Button variant="outline" size="sm" className="gap-1.5 border-border/60">
                    Browse Treks
                    <ArrowRight className="size-3.5" />
                  </Button>
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      <ActionRequiredPanel pending={pending} onRefresh={onRefresh} onViewAllRequests={onViewAllRequests} />

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Upcoming Bookings */}
        <motion.div
          variants={container}
          initial="hidden"
          animate="show"
        >
          <Card className="border-border/60 bg-card/60 backdrop-blur-xl">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-sm font-semibold">
                <Calendar className="size-4 text-primary" />
                Upcoming Bookings
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {upcoming.length === 0 ? (
                <p className="py-6 text-center text-sm text-muted-foreground">
                  No upcoming bookings
                </p>
              ) : (
                upcoming.map((booking) => (
                  <motion.div
                    key={booking.id}
                    variants={item}
                    className="flex items-center justify-between rounded-xl border border-border/40 bg-background/40 px-4 py-3 transition-colors hover:bg-background/60"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">
                        {booking.trekker?.name || "Unknown Trekker"}
                      </p>
                      <div className="mt-0.5 flex items-center gap-2 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                        <Clock className="size-3" />
                        {booking.booking_date}
                      </div>
                    </div>
                    <Badge className={`ml-3 border text-[10px] font-mono uppercase tracking-wider transition-colors duration-200 ${getStatusConfig(booking.status).colorClass}`}>
                      {getStatusConfig(booking.status).label}
                    </Badge>
                  </motion.div>
                ))
              )}
              {upcoming.length > 0 && (
                <div className="pt-2">
                  <Link
                    href="/guide/dashboard"
                    className="flex items-center justify-center gap-1 rounded-lg border border-border/40 py-2 font-mono text-[10px] uppercase tracking-widest text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                  >
                    View All Bookings
                    <ArrowRight className="size-3" />
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Recent Completions */}
        <motion.div
          variants={container}
          initial="hidden"
          animate="show"
        >
          <Card className="border-border/60 bg-card/60 backdrop-blur-xl">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-sm font-semibold">
                <User className="size-4 text-green-400" />
                Recent Completions
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {recentCompleted.length === 0 ? (
                <p className="py-6 text-center text-sm text-muted-foreground">
                  No completed treks yet
                </p>
              ) : (
                recentCompleted.map((booking) => (
                  <motion.div
                    key={booking.id}
                    variants={item}
                    className="flex items-center justify-between rounded-xl border border-border/40 bg-background/40 px-4 py-3"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">
                        {booking.trekker?.name || "Unknown Trekker"}
                      </p>
                      <p className="mt-0.5 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                        {booking.booking_date}
                      </p>
                    </div>
                    <Badge className={`ml-3 border text-[10px] font-mono uppercase tracking-wider ${getStatusConfig("completed").colorClass}`}>
                      Completed
                    </Badge>
                  </motion.div>
                ))
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  )
}
