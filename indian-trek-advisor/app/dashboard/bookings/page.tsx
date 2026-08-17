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
import { Calendar, Star, Phone, IndianRupee, AlertCircle, CheckCircle2, Users, Clock, XCircle } from "lucide-react"
import { RatingModal } from "@/components/rating-modal"
import { getStatusConfig } from "@/lib/booking-status"
import { createClient } from "@/utils/supabase/client"
import { StatusTimeline } from "@/components/booking/status-timeline"
import { inr } from "@/lib/pricing"

interface Booking {
  id: string
  trek_id: string
  status: string
  payment_status: string
  booking_date: string
  num_trekkers?: number
  trek_days?: number
  base_rate?: number
  total_amount?: number
  notes?: string
  rejection_reason?: string
  cancelled_by_role?: string
  guides: {
    rating: number
    profiles: {
      name: string
      phone?: string
    }
  }
}

export default function BookingsPage() {
  const [bookings, setBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState(true)
  const [ratingModalOpen, setRatingModalOpen] = useState(false)
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null)

  const [paymentDialogBooking, setPaymentDialogBooking] = useState<Booking | null>(null)
  const [cancelDialogBooking, setCancelDialogBooking] = useState<Booking | null>(null)
  const [cancelReason, setCancelReason] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [actionError, setActionError] = useState<string | null>(null)
  const [toast, setToast] = useState<string | null>(null)

  useEffect(() => {
    fetchBookings()
  }, [])

  useEffect(() => {
    ;(async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("account_type")
          .eq("id", user.id)
          .single()
        if (profile?.account_type === "guide") {
          window.location.replace("/guide/dashboard")
        }
      }
    })()
  }, [])

  const fetchBookings = async () => {
    try {
      const response = await fetch("/api/trekker/bookings")
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

  const handleConfirmPayment = async () => {
    if (!paymentDialogBooking) return
    setSubmitting(true)
    setActionError(null)
    try {
      const response = await fetch(`/api/bookings/${paymentDialogBooking.id}/confirm-payment`, {
        method: "POST",
        headers: { "Content-Type": "application/json" }
      })

      if (response.ok) {
        fetchBookings()
        setPaymentDialogBooking(null)
        showToast("Payment confirmed! Guide contact information is now visible.")
      } else {
        const data = await response.json()
        setActionError(data.error || "Error confirming payment")
      }
    } catch (error) {
      setActionError("Network error. Please try again.")
    }
    setSubmitting(false)
  }

  const handleRateGuide = (booking: Booking) => {
    setSelectedBooking(booking)
    setRatingModalOpen(true)
  }

  const submitRating = async (rating: number, review: string) => {
    if (!selectedBooking) return

    try {
      const response = await fetch("/api/trekker/rate-guide", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          booking_id: selectedBooking.id,
          rating,
          review
        })
      })

      if (response.ok) {
        fetchBookings()
        showToast("Rating submitted successfully!")
      }
    } catch (error) {
      console.error("Error submitting rating:", error)
    }
  }

  const handleCancelBooking = async () => {
    if (!cancelDialogBooking) return
    setSubmitting(true)
    setActionError(null)
    try {
      const response = await fetch(`/api/bookings/${cancelDialogBooking.id}/cancel`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: cancelReason })
      })

      if (response.ok) {
        fetchBookings()
        setCancelDialogBooking(null)
        setCancelReason("")
        showToast("Booking cancelled")
      } else {
        const data = await response.json()
        setActionError(data.error || "Error cancelling booking")
      }
    } catch (error) {
      setActionError("Network error. Please try again.")
    }
    setSubmitting(false)
  }

  if (loading) {
    return (
      <div className="min-h-screen pt-24 pb-12">
        <div className="mx-auto max-w-4xl space-y-4 px-4 md:px-6">
          {[1, 2].map((i) => (
            <div key={i} className="h-32 animate-pulse rounded-xl border border-border/60 bg-card/40" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen pt-24 pb-12">
      <div className="mx-auto max-w-4xl px-4 md:px-6">
        <p className="font-mono text-[10px] uppercase tracking-widest text-primary">Your Treks</p>
        <h1 className="mt-1 mb-8 text-3xl font-bold tracking-tight">My Bookings</h1>

        {bookings.length === 0 ? (
          <Card className="border-border/60 bg-card/60 backdrop-blur-xl">
            <CardContent className="p-10 text-center text-muted-foreground">
              No bookings yet. Start by exploring treks and booking a guide!
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
                  transition={{ delay: i * 0.05, duration: 0.3 }}
                >
                  <Card className="border-border/60 bg-card/60 backdrop-blur-xl">
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-lg">{booking.trek_id}</CardTitle>
                        <Badge className={`border text-[10px] font-mono uppercase tracking-wider ${status.colorClass}`}>
                          {status.label}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2 text-sm">
                        <p className="flex items-center gap-2 text-muted-foreground">
                          <Calendar className="size-4 text-primary" />
                          <span>{booking.booking_date}</span>
                        </p>
                        <div className="flex flex-wrap items-center gap-4 text-muted-foreground">
                          <p className="flex items-center gap-2">
                            <Star className="size-4 fill-yellow-400 text-yellow-400" />
                            <span>{booking.guides?.profiles?.name} · {booking.guides?.rating?.toFixed(1)}</span>
                          </p>
                          {booking.num_trekkers ? (
                            <p className="flex items-center gap-2">
                              <Users className="size-4 text-muted-foreground/70" />
                              <span>{booking.num_trekkers} trekker{booking.num_trekkers > 1 ? "s" : ""}</span>
                            </p>
                          ) : null}
                        </div>
                        {(booking.num_trekkers || booking.base_rate || booking.total_amount) && (
                          <p className="flex items-center gap-2 font-medium text-foreground">
                            <IndianRupee className="size-4 text-primary" />
                            <span>
                              {booking.base_rate ? `${inr(booking.base_rate)}/day` : ""}
                              {booking.num_trekkers && booking.num_trekkers > 1 && booking.base_rate ? ` × ${booking.num_trekkers}` : ""}
                              {booking.trek_days ? ` × ${booking.trek_days} day${booking.trek_days > 1 ? "s" : ""}` : ""}
                              {booking.total_amount ? ` = ${inr(booking.total_amount)}` : ""}
                            </span>
                          </p>
                        )}
                        {booking.status === 'admin_approved' && booking.total_amount ? (
                          <p className="flex items-center gap-2 text-sm font-semibold text-primary">
                            <IndianRupee className="size-4" />
                            Amount due: {inr(booking.total_amount)}
                          </p>
                        ) : null}
                        {booking.notes && (
                          <p className="text-xs italic text-muted-foreground">&ldquo;{booking.notes}&rdquo;</p>
                        )}
                        {booking.status === 'cancelled' && booking.rejection_reason && (
                          <p className="flex items-start gap-2 rounded-lg border border-destructive/20 bg-destructive/5 px-3 py-2 text-xs text-destructive">
                            <XCircle className="mt-0.5 size-3.5 shrink-0" />
                            <span>Cancelled by {booking.cancelled_by_role}: {booking.rejection_reason}</span>
                          </p>
                        )}
                        {status.description && (
                          <p className="text-xs text-muted-foreground">{status.description}</p>
                        )}
                      </div>

                      {booking.status === 'admin_approved' && (
                        <Button
                          onClick={() => setPaymentDialogBooking(booking)}
                          className="mt-4"
                        >
                          Confirm Payment
                        </Button>
                      )}

                      {booking.status === 'confirmed' && (
                        <div className="mt-4 flex items-center gap-2 rounded-xl border border-primary/25 bg-primary/5 px-4 py-3">
                          <Phone className="size-4 shrink-0 text-primary" />
                          <div>
                            <p className="font-mono text-[10px] uppercase tracking-widest text-primary">Guide Contact</p>
                            <p className="text-sm text-foreground">{booking.guides?.profiles?.phone || "Not provided"}</p>
                          </div>
                        </div>
                      )}

                      {booking.status === 'completed' && (
                        <Button
                          variant="outline"
                          className="mt-4 gap-1.5 border-border/60"
                          onClick={() => handleRateGuide(booking)}
                        >
                          <Star className="size-4" />
                          Rate Guide
                        </Button>
                      )}

                      {booking.status !== 'completed' && booking.status !== 'cancelled' && (
                        <Button
                          variant="destructive"
                          size="sm"
                          className="mt-4"
                          onClick={() => setCancelDialogBooking(booking)}
                        >
                          Cancel Booking
                        </Button>
                      )}

                      <StatusTimeline bookingId={booking.id} bookingDate={booking.booking_date} />
                    </CardContent>
                  </Card>
                </motion.div>
              )
            })}
          </div>
        )}
      </div>

      {selectedBooking && (
        <RatingModal
          isOpen={ratingModalOpen}
          onClose={() => setRatingModalOpen(false)}
          onSubmit={submitRating}
          guideName={selectedBooking.guides?.profiles?.name || 'Guide'}
        />
      )}

      {/* Payment Dialog */}
      <Dialog
        open={Boolean(paymentDialogBooking)}
        onOpenChange={(open) => {
          if (!open) {
            setPaymentDialogBooking(null)
            setActionError(null)
          }
        }}
      >
        <DialogContent className="max-w-sm border-border bg-card">
          <DialogHeader>
            <DialogTitle>Confirm Payment</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            {paymentDialogBooking?.total_amount ? (
              <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 text-center">
                <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                  Total Due
                </p>
                <p className="mt-1 text-2xl font-bold text-primary">
                  {inr(paymentDialogBooking.total_amount)}
                </p>
                {paymentDialogBooking.base_rate ? (
                  <p className="mt-1 text-xs text-muted-foreground">
                    {inr(paymentDialogBooking.base_rate)}/day × {(paymentDialogBooking.trek_days ?? 1)} day
                    {(paymentDialogBooking.trek_days ?? 1) > 1 ? "s" : ""} × {(paymentDialogBooking.num_trekkers ?? 1)} trekker
                    {(paymentDialogBooking.num_trekkers ?? 1) > 1 ? "s" : ""}
                  </p>
                ) : null}
              </div>
            ) : null}
            {actionError && (
              <p className="flex items-center gap-1.5 text-xs text-destructive">
                <AlertCircle className="size-3.5 shrink-0" />
                {actionError}
              </p>
            )}
            <Button
              onClick={handleConfirmPayment}
              disabled={submitting}
              className="w-full"
            >
              {submitting ? "Confirming..." : "Confirm Payment"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Cancel Dialog */}
      <Dialog
        open={Boolean(cancelDialogBooking)}
        onOpenChange={(open) => {
          if (!open) {
            setCancelDialogBooking(null)
            setCancelReason("")
            setActionError(null)
          }
        }}
      >
        <DialogContent className="max-w-sm border-border bg-card">
          <DialogHeader>
            <DialogTitle>Cancel Booking</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <Textarea
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              placeholder="Reason for cancellation (optional)..."
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
                onClick={() => setCancelDialogBooking(null)}
                disabled={submitting}
              >
                Keep Booking
              </Button>
              <Button
                variant="destructive"
                className="flex-1"
                onClick={handleCancelBooking}
                disabled={submitting}
              >
                {submitting ? "Cancelling..." : "Cancel Booking"}
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
