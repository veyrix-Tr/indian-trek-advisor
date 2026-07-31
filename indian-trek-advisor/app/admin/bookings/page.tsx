"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Calendar, User, CheckCircle, XCircle, MapPin, AlertCircle, CheckCircle2 } from "lucide-react"
import { getStatusConfig } from "@/lib/booking-status"

interface Booking {
  id: string
  trek_id: string
  status: string
  booking_date: string
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

export default function AdminBookingsPage() {
  const [bookings, setBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState(true)
  const [actingId, setActingId] = useState<string | null>(null)
  const [rejectDialogBooking, setRejectDialogBooking] = useState<Booking | null>(null)
  const [rejectReason, setRejectReason] = useState("")
  const [actionError, setActionError] = useState<string | null>(null)
  const [toast, setToast] = useState<string | null>(null)

  useEffect(() => {
    fetchBookings()
  }, [])

  const fetchBookings = async () => {
    try {
      const response = await fetch("/api/admin/bookings/pending")
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

  const handleApprove = async (bookingId: string) => {
    setActingId(bookingId)
    try {
      const response = await fetch(`/api/bookings/${bookingId}/approve-admin`, {
        method: "POST"
      })

      if (response.ok) {
        fetchBookings()
        showToast("Booking approved and sent to trekker for payment")
      }
    } catch (error) {
      console.error("Error approving booking:", error)
    }
    setActingId(null)
  }

  const handleReject = async () => {
    if (!rejectDialogBooking || !rejectReason.trim()) return
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

  const guideApproved = bookings.filter(b => b.status === 'guide_approved')
  const adminApproved = bookings.filter(b => b.status === 'admin_approved')

  return (
    <div className="min-h-screen pt-24 pb-12">
      <div className="mx-auto max-w-6xl px-4 md:px-6">
        <p className="font-mono text-[10px] uppercase tracking-widest text-primary">Booking Review</p>
        <h1 className="mt-1 mb-8 text-3xl font-bold tracking-tight">Admin Booking Review</h1>

        <Tabs defaultValue="guide-approved">
          <TabsList className="inline-flex h-auto w-auto gap-1 bg-transparent p-0">
            <TabsTrigger
              value="guide-approved"
              className="gap-1.5 rounded-xl border border-border/40 bg-background/40 px-4 py-2.5 font-mono text-[10px] uppercase tracking-widest text-muted-foreground transition-all data-[state=active]:border-primary/40 data-[state=active]:bg-primary/10 data-[state=active]:text-primary"
            >
              Guide Approved ({guideApproved.length})
            </TabsTrigger>
            <TabsTrigger
              value="admin-approved"
              className="gap-1.5 rounded-xl border border-border/40 bg-background/40 px-4 py-2.5 font-mono text-[10px] uppercase tracking-widest text-muted-foreground transition-all data-[state=active]:border-primary/40 data-[state=active]:bg-primary/10 data-[state=active]:text-primary"
            >
              Admin Approved ({adminApproved.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="guide-approved" className="space-y-4 mt-6">
            {guideApproved.length === 0 ? (
              <Card className="border-border/60 bg-card/60 backdrop-blur-xl">
                <CardContent className="p-10 text-center text-muted-foreground">
                  No pending guide approvals
                </CardContent>
              </Card>
            ) : (
              guideApproved.map((booking, i) => {
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
                          <div className="flex items-center gap-2">
                            <Calendar className="size-4 text-primary" />
                            <span><strong className="text-foreground">Date:</strong> {booking.booking_date}</span>
                          </div>
                          {booking.profiles.phone && (
                            <p><strong className="text-foreground">Trekker Phone:</strong> {booking.profiles.phone}</p>
                          )}
                          {booking.guides?.profiles?.phone && (
                            <p><strong className="text-foreground">Guide Phone:</strong> {booking.guides.profiles.phone}</p>
                          )}
                        </div>
                        <div className="flex gap-2 mt-4">
                          <Button
                            onClick={() => handleApprove(booking.id)}
                            disabled={actingId === booking.id}
                            className="gap-1.5"
                          >
                            <CheckCircle className="size-4" />
                            Approve
                          </Button>
                          <Button
                            variant="destructive"
                            disabled={actingId === booking.id}
                            onClick={() => setRejectDialogBooking(booking)}
                            className="gap-1.5"
                          >
                            <XCircle className="size-4" />
                            Reject
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                )
              })
            )}
          </TabsContent>

          <TabsContent value="admin-approved" className="space-y-4 mt-6">
            {adminApproved.length === 0 ? (
              <Card className="border-border/60 bg-card/60 backdrop-blur-xl">
                <CardContent className="p-10 text-center text-muted-foreground">
                  No pending admin approvals
                </CardContent>
              </Card>
            ) : (
              adminApproved.map((booking, i) => {
                const status = getStatusConfig(booking.status)
                return (
                  <motion.div
                    key={booking.id}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05, duration: 0.3 }}
                  >
                    <Card className="border-border/60 bg-card/60 backdrop-blur-xl">
                      <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-semibold">{booking.profiles.name} — {booking.trek_id}</p>
                            <p className="text-sm text-muted-foreground">{booking.booking_date}</p>
                          </div>
                          <Badge className={`border text-[10px] font-mono uppercase tracking-wider ${status.colorClass}`}>
                            {status.label}
                          </Badge>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                )
              })
            )}
          </TabsContent>
        </Tabs>
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
                disabled={Boolean(actingId) || !rejectReason.trim()}
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
