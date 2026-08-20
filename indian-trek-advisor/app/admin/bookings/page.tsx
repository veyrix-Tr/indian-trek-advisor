"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Calendar, User, MapPin, CheckCircle2, Users, IndianRupee, XCircle,
  Loader2, ShieldAlert,
} from "lucide-react"
import { getStatusConfig } from "@/lib/booking-status"
import { StatusTimeline } from "@/components/booking/status-timeline"
import { inr } from "@/lib/pricing"

interface Booking {
  id: string
  trek_id: string
  status: string
  booking_date: string
  num_trekkers?: number
  total_amount?: number
  base_rate?: number
  notes?: string
  rejection_reason?: string
  cancelled_by_role?: string
  profiles: {
    name: string
    email: string
    phone?: string
  }
  guides: {
    profiles: {
      name: string
      phone?: string
    }
  }
}

const FILTERS = [
  { value: "all", label: "All" },
  { value: "guide_approved", label: "Guide Accepted" },
  { value: "confirmed", label: "Confirmed" },
  { value: "completed", label: "Successful Trek" },
  { value: "cancelled", label: "Cancelled" },
]

export default function AdminBookingsPage() {
  const router = useRouter()
  const [bookings, setBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState("all")

  useEffect(() => {
    (async () => {
      const supabase = (await import("@/utils/supabase/client")).createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.replace("/")
        return
      }
      const { data: profile } = await supabase
        .from("profiles")
        .select("account_type")
        .eq("id", user.id)
        .single()
      if (profile?.account_type !== "admin") {
        router.replace(profile?.account_type === "guide" ? "/guide/dashboard" : "/")
      }
    })()
  }, [router])

  useEffect(() => {
    fetchBookings()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter])

  const fetchBookings = async () => {
    try {
      const response = await fetch(`/api/admin/bookings/pending?status=${filter}`)
      const data = await response.json()
      setBookings(data.bookings || [])
    } catch (error) {
      console.error("Error fetching bookings:", error)
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen pt-24 pb-12">
      <div className="mx-auto max-w-6xl px-4 md:px-6">
        <p className="font-mono text-[10px] uppercase tracking-widest text-primary">Booking Oversight</p>
        <h1 className="mt-1 mb-2 text-3xl font-bold tracking-tight">All Bookings</h1>
        <p className="mb-8 flex max-w-2xl items-start gap-2 text-sm text-muted-foreground/70">
          <ShieldAlert className="mt-0.5 size-4 shrink-0 text-muted-foreground/50" />
          Read-only view. The booking flow runs entirely between the trekker and
          guide; admin is not a participant.
        </p>

        {/* Filters */}
        <div className="mb-6 flex flex-wrap gap-2">
          {FILTERS.map((f) => (
            <button
              key={f.value}
              onClick={() => setFilter(f.value)}
              className={`rounded-full border px-3 py-1.5 font-mono text-[10px] uppercase tracking-widest transition-all ${
                filter === f.value
                  ? "border-primary/40 bg-primary/10 text-primary"
                  : "border-border/40 bg-background/40 text-muted-foreground hover:bg-accent hover:text-foreground"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-16 text-muted-foreground/50">
            <Loader2 className="mb-3 size-7 animate-spin text-primary" />
            <p className="text-sm">Loading bookings…</p>
          </div>
        ) : bookings.length === 0 ? (
          <Card className="border-border/60 bg-card/60 backdrop-blur-xl">
            <CardContent className="flex flex-col items-center justify-center p-12 text-center text-muted-foreground">
              <CheckCircle2 className="mb-3 size-8 text-muted-foreground/40" />
              No bookings in this view
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {bookings.map((booking, i) => {
              const status = getStatusConfig(booking.status)
              return (
                <motion.div
                  key={booking.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.04, duration: 0.3 }}
                >
                  <Card className="border-border/60 bg-card/60 backdrop-blur-xl">
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-lg">Booking #{booking.id.slice(0, 8)}</CardTitle>
                        <Badge className={`border text-[10px] font-mono uppercase tracking-wider ${status.colorClass}`}>
                          {status.label}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2 text-sm text-muted-foreground">
                        <div className="flex items-center gap-2">
                          <User className="size-4 text-primary" />
                          <span><strong className="text-foreground">Trekker:</strong> {booking.profiles.name}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <User className="size-4 text-primary" />
                          <span><strong className="text-foreground">Guide:</strong> {booking.guides?.profiles?.name}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <MapPin className="size-4 text-primary" />
                          <span><strong className="text-foreground">Trek:</strong> {booking.trek_id}</span>
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="flex items-center gap-2">
                            <Calendar className="size-4 text-primary" />
                            <span><strong className="text-foreground">Date:</strong> {booking.booking_date}</span>
                          </span>
                          {booking.num_trekkers ? (
                            <span className="flex items-center gap-1.5">
                              <Users className="size-4 text-primary" />
                              {booking.num_trekkers} trekker{booking.num_trekkers > 1 ? "s" : ""}
                            </span>
                          ) : null}
                          {booking.total_amount ? (
                            <span className="flex items-center gap-1.5 font-semibold text-foreground">
                              <IndianRupee className="size-4 text-primary" />
                              {inr(booking.total_amount)}
                            </span>
                          ) : null}
                        </div>
                        {booking.profiles.phone && (
                          <p><strong className="text-foreground">Trekker Phone:</strong> {booking.profiles.phone}</p>
                        )}
                        {booking.guides?.profiles?.phone && (
                          <p><strong className="text-foreground">Guide Phone:</strong> {booking.guides.profiles.phone}</p>
                        )}
                        {booking.status === 'cancelled' && booking.rejection_reason && (
                          <p className="flex items-start gap-2 rounded-lg border border-destructive/20 bg-destructive/5 px-3 py-2 text-xs text-destructive">
                            <XCircle className="mt-0.5 size-3.5 shrink-0" />
                            <span>Cancelled by {booking.cancelled_by_role || "a party"}: {booking.rejection_reason}</span>
                          </p>
                        )}
                        {booking.notes && (
                          <p className="text-xs italic">&ldquo;{booking.notes}&rdquo;</p>
                        )}
                      </div>
                      <div className="mt-3 border-t border-border/50 pt-3">
                        <StatusTimeline bookingId={booking.id} bookingDate={booking.booking_date} />
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}