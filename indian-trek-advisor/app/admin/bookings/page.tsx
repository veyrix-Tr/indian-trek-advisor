"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Calendar, User, CheckCircle, XCircle, MapPin, AlertCircle, CheckCircle2, Users, IndianRupee } from "lucide-react"
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
  { value: "completed", label: "Completed" },
  { value: "cancelled", label: "Cancelled" },
]

export default function AdminBookingsPage() {
  const [bookings, setBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState("all")
  const [actingId, setActingId] = useState<string | null>(null)
  const [rejectDialogBooking, setRejectDialogBooking] = useState<Booking | null>(null)
  const [rejectReason, setRejectReason] = useState("")
  const [actionError, setActionError] = useState<string | null>(null)
  const [toast, setToast] = useState<string | null>(null)

  useEffect(() => {
    fetchBookings()
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

  function showToast(message: string) {
    setToast(message)
    setTimeout(() => setToast(null), 3000)
  }

  const handleComplete = async (bookingId: string) => {
    setActingId(bookingId)
    try {
      const response = await fetch(`/api/bookings/${bookingId}/complete`, {
        method: "POST"
      })
      if (response.ok) {
        fetchBookings()
        showToast("Booking marked complete")
      } else {
        const data = await response.json()
        showToast(data.error || "Error completing booking")
      }
    } catch (error) {
      console.error("Error completing booking:", error)
    }
    setActingId(null)
  }

  const handleReject = async () => {
    if (!rejectDialogBooking) return
    setActingId(rejectDialogBooking.id)
    setActionError(null)
    try {
      const response = await fetch(`/api/bookings/${rejectDialogBooking.id}/cancel`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: rejectReason })
      })

      if (response.ok) {
        fetchBookings()
        setRejectDialogBooking(null)
        setRejectReason("")
        showToast("Booking rejected")
      } else {
        const data = await response.json()
        setActionError(data.error || "Error rejecting booking")
      }
    } catch (error) {
      setActionError("Network error. Please try again.")
    }
    setActingId(null)
  }

  if (loading) {
    return (
      <div className="min-h-screen pt-24 pb-12">
        <div className="mx-auto max-w-6xl space-y-4 px-4 md:px-6">
          {[1, 2].map((i) => (
            <div key={i} className="h-32 animate-pulse rounded-xl border border-border/60 bg-card/40" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen pt-24 pb-12">
      <div className="mx-auto max-w-6xl px-4 md:px-6">
        <p className="font-mono text-[10px] uppercase tracking-widest text-primary">Booking Management</p>
        <h1 className="mt-1 mb-8 text-3xl font-bold tracking-tight">All Bookings</h1>

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

        {bookings.length === 0 ? (
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
              const canComplete = booking.status === 'confirmed'
              const canReject = booking.status === 'guide_approved' || booking.status === 'pending'
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
                      <div className="mt-4 flex flex-wrap gap-2">
                        {canComplete && (
                          <Button
                            onClick={() => handleComplete(booking.id)}
                            disabled={actingId === booking.id}
                            variant="outline"
                            className="gap-1.5 border-primary/30 text-primary hover:bg-primary/10"
                          >
                            <CheckCircle className="size-4" />
                            Mark Complete
                          </Button>
                        )}
                        {canReject && (
                          <Button
                            variant="destructive"
                            disabled={actingId === booking.id}
                            onClick={() => setRejectDialogBooking(booking)}
                            className="gap-1.5"
                          >
                            <XCircle className="size-4" />
                            Reject
                          </Button>
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

      {/* Reject Dialog */}
      <Dialog
        open={Boolean(rejectDialogBooking)}
        onOpenChange={(open) => {
          if (!open) {
            setRejectDialogBooking(null)
            setRejectReason("")
            setActionError(null)
          }
        }}
      >
        <DialogContent className="max-w-sm border-border bg-card">
          <DialogHeader>
            <DialogTitle>Reject Booking</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <Textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="Reason for rejection..."
              rows={3}
            />
            {actionError && (
              <p className="flex items-center gap-1.5 text-xs text-destructive">
                <AlertCircle className="size-3.5 shrink-0" />
                {actionError}
              </p>
            )}
            <div className="flex gap-2">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setRejectDialogBooking(null)}
                disabled={Boolean(actingId)}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                className="flex-1"
                onClick={handleReject}
                disabled={Boolean(actingId)}
              >
                {actingId ? "Rejecting..." : "Reject Booking"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="fixed bottom-6 left-1/2 z-50 flex -translate-x-1/2 items-center gap-2 rounded-xl border border-primary/25 bg-card px-4 py-3 text-sm shadow-xl"
          >
            <CheckCircle2 className="size-4 text-primary" />
            {toast}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}