"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Calendar, Star, Phone, IndianRupee, AlertCircle, CheckCircle2 } from "lucide-react"
import { RatingModal } from "@/components/rating-modal"
import { getStatusConfig } from "@/lib/booking-status"

interface Booking {
  id: string
  trek_id: string
  status: string
  payment_status: string
  booking_date: string
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
  const [paymentAmount, setPaymentAmount] = useState("")
  const [cancelDialogBooking, setCancelDialogBooking] = useState<Booking | null>(null)
  const [cancelReason, setCancelReason] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [actionError, setActionError] = useState<string | null>(null)
  const [toast, setToast] = useState<string | null>(null)

  useEffect(() => {
    fetchBookings()
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
    if (!paymentDialogBooking || !paymentAmount) return
    setSubmitting(true)
    setActionError(null)
    try {
      const response = await fetch(`/api/bookings/${paymentDialogBooking.id}/confirm-payment`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: parseFloat(paymentAmount) })
      })

      if (response.ok) {
        fetchBookings()
        setPaymentDialogBooking(null)
        setPaymentAmount("")
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
    if (!cancelDialogBooking || !cancelReason.trim()) return
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
                        <p className="flex items-center gap-2 text-muted-foreground">
                          <Star className="size-4 fill-yellow-400 text-yellow-400" />
                          <span>{booking.guides?.profiles?.name} · {booking.guides?.rating?.toFixed(1)}</span>
                        </p>
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
            setPaymentAmount("")
            setActionError(null)
          }
        }}
      >
        <DialogContent className="max-w-sm border-border bg-card">
          <DialogHeader>
            <DialogTitle>Confirm Payment</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="relative">
              <IndianRupee className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="number"
                min={1}
                value={paymentAmount}
                onChange={(e) => setPaymentAmount(e.target.value)}
                placeholder="Enter payment amount"
                className="pl-9"
              />
            </div>
            {actionError && (
              <p className="flex items-center gap-1.5 text-xs text-destructive">
                <AlertCircle className="size-3.5 shrink-0" />
                {actionError}
              </p>
            )}
            <Button
              onClick={handleConfirmPayment}
              disabled={submitting || !paymentAmount}
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
              placeholder="Reason for cancellation..."
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
                disabled={submitting || !cancelReason.trim()}
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
