"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { MapPin, Star, BadgeCheck, AlertCircle, CheckCircle2, CalendarX, Minus, Plus, Users } from "lucide-react"
import type { Trek } from "@/lib/data"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { parseTrekDays, computeBookingAmount, inr } from "@/lib/pricing"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

// Shape returned by GET /api/bookings/trek/[trekId]/guides: rows of
// guide_trek_associations with a nested `guides` (embedded via Supabase's
// `guides(*, profiles(*))` select) — `id`/`guide_id`/`base_rate` are the
// association's own columns, NOT nested. `guide_id` is the real guides.id
// and must be what's sent as bookings.guide_id on submit.
interface Guide {
  id: string
  guide_id: string
  base_rate: number
  guides: {
    id: string
    experience?: string
    rating: number
    total_ratings: number
    base_location?: string
    known_treks: string[]
    verified?: boolean
    profile_photo_url?: string
    profiles: {
      name: string
      email: string
      phone?: string
      bio?: string
    }
  }
  unavailable?: boolean
}

export function GuidesTab({ trek }: { trek: Trek }) {
  const [guides, setGuides] = useState<Guide[]>([])
  const [selectedDate, setSelectedDate] = useState("")
  const [loading, setLoading] = useState(false)
  const [selectedGuide, setSelectedGuide] = useState<Guide | null>(null)
  const [showBookingModal, setShowBookingModal] = useState(false)
  const [numTrekkers, setNumTrekkers] = useState(1)
  const [submitting, setSubmitting] = useState(false)
  const [bookingError, setBookingError] = useState<string | null>(null)
  const [bookingSuccess, setBookingSuccess] = useState(false)

  useEffect(() => {
    fetchGuides()
  }, [selectedDate])

  const fetchGuides = async () => {
    setLoading(true)
    try {
      const url = selectedDate
        ? `/api/bookings/trek/${trek.id}/guides?date=${selectedDate}`
        : `/api/bookings/trek/${trek.id}/guides`
      const response = await fetch(url)
      const data = await response.json()
      setGuides(data.guides || [])
    } catch (error) {
      console.error("Error fetching guides:", error)
    }
    setLoading(false)
  }

  const handleBookGuide = (guide: Guide) => {
    setSelectedGuide(guide)
    setNumTrekkers(1)
    setBookingError(null)
    setBookingSuccess(false)
    setShowBookingModal(true)
  }

  const submitBooking = async (notes: string) => {
    if (!selectedGuide || !selectedDate) return
    setSubmitting(true)
    setBookingError(null)

    try {
      const response = await fetch("/api/bookings/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          trek_id: trek.id,
          guide_id: selectedGuide.guide_id,
          booking_date: selectedDate,
          notes,
          num_trekkers: numTrekkers,
        })
      })

      if (response.ok) {
        setBookingSuccess(true)
        fetchGuides()
      } else {
        const data = await response.json()
        setBookingError(data.error || "Error creating booking. Please try again.")
      }
    } catch (error) {
      console.error("Error creating booking:", error)
      setBookingError("Network error. Please try again.")
    }
    setSubmitting(false)
  }

  const availableGuides = guides.filter((g) => !g.unavailable)
  const unavailableGuides = guides.filter((g) => g.unavailable)

  return (
    <div className="max-w-3xl space-y-8">
      {/* Date Selection */}
      <div className="rounded-xl border border-border bg-card p-6">
        <h3 className="mb-4 font-semibold">Select Trekking Date</h3>
        <Input
          type="date"
          value={selectedDate}
          onChange={(e) => setSelectedDate(e.target.value)}
          className="max-w-xs"
        />
      </div>

      {/* Guides List */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2].map((i) => (
            <div key={i} className="animate-pulse rounded-xl border border-border bg-card p-6">
              <div className="h-4 w-1/3 rounded bg-muted/50" />
              <div className="mt-3 h-3 w-1/4 rounded bg-muted/40" />
              <div className="mt-2 h-3 w-1/5 rounded bg-muted/40" />
            </div>
          ))}
        </div>
      ) : guides.length > 0 ? (
        <div className="space-y-4">
          <h3 className="font-semibold">
            {selectedDate ? `Available Guides — ${availableGuides.length}` : "Guides for This Trek"}
          </h3>
          {availableGuides.map((guide) => (
            <GuideCard key={guide.id} guide={guide} onBook={() => handleBookGuide(guide)} />
          ))}

          {unavailableGuides.length > 0 && (
            <div className="space-y-3 pt-2">
              <p className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                <CalendarX className="size-3" />
                Unavailable on this date
              </p>
              {unavailableGuides.map((guide) => (
                <GuideCard key={guide.id} guide={guide} unavailable />
              ))}
            </div>
          )}
        </div>
      ) : (
        <div className="rounded-xl border border-border bg-card p-8 text-center">
          <p className="text-muted-foreground">
            {selectedDate ? "No guides associated with this trek yet" : "Select a date to see available guides"}
          </p>
        </div>
      )}

      {/* Booking Dialog */}
      <Dialog
        open={showBookingModal}
        onOpenChange={(open) => {
          setShowBookingModal(open)
          if (!open) setSelectedGuide(null)
        }}
      >
        <DialogContent className="max-w-md border-border bg-card">
          {selectedGuide && (
            <>
              <DialogHeader>
                <DialogTitle>{bookingSuccess ? "Request Sent" : "Confirm Booking"}</DialogTitle>
              </DialogHeader>

              {bookingSuccess ? (
                <div className="flex flex-col items-center gap-3 py-4 text-center">
                  <div className="flex size-12 items-center justify-center rounded-full bg-primary/10">
                    <CheckCircle2 className="size-6 text-primary" />
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Your request has been sent to <strong className="text-foreground">{selectedGuide.guides.profiles.name}</strong>.
                    They typically respond within 48 hours — you&apos;ll be notified once they accept.
                  </p>
                  <Button
                    className="mt-2 w-full"
                    onClick={() => {
                      setShowBookingModal(false)
                      setSelectedGuide(null)
                    }}
                  >
                    Done
                  </Button>
                </div>
              ) : (
                <>
                  <div className="space-y-3 mb-4">
                    <p><strong>Guide:</strong> {selectedGuide.guides.profiles.name}</p>
                    <p><strong>Date:</strong> {selectedDate}</p>
                    <p><strong>Rate:</strong> {inr(selectedGuide.base_rate)}/day</p>
                    <p className="text-xs text-muted-foreground">{selectedGuide.guides.known_treks?.length ? `${selectedGuide.guides.known_treks.length} treks` : ""} · {parseTrekDays(String(trek.days))} days</p>
                  </div>

                  <div className="mb-4 flex items-center justify-between rounded-xl border border-border bg-background/40 p-3">
                    <div className="flex items-center gap-2">
                      <Users className="size-4 text-primary" />
                      <span className="text-sm font-medium">Trekkers</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="icon-sm"
                        onClick={() => setNumTrekkers((n) => Math.max(1, n - 1))}
                        disabled={numTrekkers <= 1}
                        aria-label="Decrease trekkers"
                      >
                        <Minus className="size-3.5" />
                      </Button>
                      <span className="w-8 text-center text-sm font-semibold">{numTrekkers}</span>
                      <Button
                        type="button"
                        variant="outline"
                        size="icon-sm"
                        onClick={() => setNumTrekkers((n) => Math.min(20, n + 1))}
                        disabled={numTrekkers >= 20}
                        aria-label="Increase trekkers"
                      >
                        <Plus className="size-3.5" />
                      </Button>
                    </div>
                  </div>

                  <div className="mb-4 space-y-1 rounded-xl border border-primary/20 bg-primary/5 p-3">
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>{inr(selectedGuide.base_rate)}/day × {numTrekkers} × {parseTrekDays(String(trek.days))} days</span>
                      <span className="font-mono">{inr(computeBookingAmount(selectedGuide.base_rate, numTrekkers, parseTrekDays(String(trek.days))))}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Estimated total</span>
                      <span className="text-lg font-bold text-primary">
                        {inr(computeBookingAmount(selectedGuide.base_rate, numTrekkers, parseTrekDays(String(trek.days))))}
                      </span>
                    </div>
                    <p className="text-[10px] text-muted-foreground">Final amount confirmed by the guide &amp; admin.</p>
                  </div>

                  <Textarea
                    placeholder="Add any notes for the guide..."
                    className="mb-3"
                    id="booking-notes"
                  />
                  {bookingError && (
                    <motion.p
                      initial={{ opacity: 0, y: -6 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="mb-3 flex items-center gap-1.5 text-xs text-destructive"
                    >
                      <AlertCircle className="size-3.5 shrink-0" />
                      {bookingError}
                    </motion.p>
                  )}
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      onClick={() => setShowBookingModal(false)}
                      className="flex-1"
                      disabled={submitting}
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={() => {
                        const notes = (document.getElementById('booking-notes') as HTMLTextAreaElement)?.value || ''
                        submitBooking(notes)
                      }}
                      className="flex-1"
                      disabled={submitting}
                    >
                      {submitting ? "Sending..." : "Confirm Booking"}
                    </Button>
                  </div>
                </>
              )}
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

function GuideCard({
  guide,
  unavailable = false,
  onBook,
}: {
  guide: Guide
  unavailable?: boolean
  onBook?: () => void
}) {
  const initial = guide.guides.profiles.name?.charAt(0).toUpperCase() || "?"

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`rounded-xl border border-border bg-card p-6 ${unavailable ? "opacity-50" : ""}`}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex flex-1 items-start gap-3">
          {guide.guides.profile_photo_url ? (
            <img
              src={guide.guides.profile_photo_url}
              alt={guide.guides.profiles.name}
              className="size-11 shrink-0 rounded-full object-cover"
            />
          ) : (
            <div className="flex size-11 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-amber-400 to-amber-600 text-sm font-bold text-white">
              {initial}
            </div>
          )}
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h4 className="font-semibold">{guide.guides.profiles.name}</h4>
              {guide.guides.verified && (
                <span className="flex items-center gap-0.5 rounded-full bg-primary/10 px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-wider text-primary">
                  <BadgeCheck className="size-3" />
                  Verified
                </span>
              )}
              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                <Star className="size-4 fill-yellow-400 text-yellow-400" />
                <span>{(guide.guides.rating ?? 0).toFixed(1)}</span>
                <span>({guide.guides.total_ratings ?? 0})</span>
              </div>
            </div>
            {guide.guides.experience && (
              <p className="mt-1 text-sm text-muted-foreground">
                Experience: {guide.guides.experience}
              </p>
            )}
            {guide.guides.base_location && (
              <p className="flex items-center gap-1 mt-1 text-sm text-muted-foreground">
                <MapPin className="size-3" />
                {guide.guides.base_location}
              </p>
            )}
            <p className="mt-2 font-semibold">
              ₹{guide.base_rate.toLocaleString("en-IN")}/day
            </p>
          </div>
        </div>
        {unavailable ? (
          <span className="shrink-0 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
            Unavailable
          </span>
        ) : (
          <Button onClick={onBook} className="shrink-0">
            Book Guide
          </Button>
        )}
      </div>
    </motion.div>
  )
}
