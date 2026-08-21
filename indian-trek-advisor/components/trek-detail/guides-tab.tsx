"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { MapPin, Star, BadgeCheck, AlertCircle, CheckCircle2, Minus, Plus, Users, Clock } from "lucide-react"
import type { Trek } from "@/lib/data"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { parseTrekDays, computeBookingPricing, inr } from "@/lib/pricing"
import { createClient } from "@/utils/supabase/client"
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
  const [guideRequired, setGuideRequired] = useState(true)
  const [trekAssistRequired, setTrekAssistRequired] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [bookingError, setBookingError] = useState<string | null>(null)
  const [bookingSuccess, setBookingSuccess] = useState(false)
  const [myRequest, setMyRequest] = useState<{ guide_id: string; status: string } | null>(null)
  const [myRequestLoading, setMyRequestLoading] = useState(false)
  const [accountType, setAccountType] = useState<string | null>(null)
  const canBook = accountType === null || accountType === "trekker"

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) return
      supabase
        .from("profiles")
        .select("account_type")
        .eq("id", data.user.id)
        .single()
        .then(({ data: profile }) => setAccountType(profile?.account_type ?? null))
    })
  }, [])

  useEffect(() => {
    fetchGuides()
  }, [selectedDate])

  useEffect(() => {
    fetchMyRequest()
  }, [selectedDate])

  const fetchMyRequest = async () => {
    if (!selectedDate) {
      setMyRequest(null)
      return
    }
    setMyRequestLoading(true)
    try {
      const response = await fetch(`/api/bookings/trek/${trek.id}/guides/my-request?date=${selectedDate}`)
      if (response.ok) {
        const data = await response.json()
        setMyRequest(data.booking || null)
      } else {
        setMyRequest(null)
      }
    } catch {
      setMyRequest(null)
    }
    setMyRequestLoading(false)
  }

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
    if (!selectedDate) {
      setBookingError("Please select a trekking date first.")
      return
    }
    setSelectedGuide(guide)
    setNumTrekkers(1)
    setBookingError(null)
    setBookingSuccess(false)
    setShowBookingModal(true)
  }

  const submitBooking = async () => {
    if (!selectedGuide) return
    if (!selectedDate) {
      setBookingError("Please select a trekking date before confirming.")
      return
    }
    setSubmitting(true)
    setBookingError(null)

    const notes = (document.getElementById('booking-notes') as HTMLTextAreaElement)?.value || ''

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
          trek_days: parseTrekDays(String(trek.days)),
          guide_required: guideRequired,
          trek_assist_required: trekAssistRequired,
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

  const guidesToShow = guides.filter((g) => !selectedDate || !g.unavailable)

  return (
    <div className="max-w-3xl space-y-8">
      {/* Date Selection */}
      {canBook && (
        <div className="rounded-xl border border-border bg-card p-4 sm:p-6">
          <h3 className="mb-4 font-semibold">Select Trekking Date</h3>
          <Input
            type="date"
            value={selectedDate}
            min={new Date().toISOString().split("T")[0]}
            onChange={(e) => {
              setSelectedDate(e.target.value)
              setBookingError(null)
            }}
            className="max-w-xs"
          />
          {bookingError && !selectedGuide && (
            <p className="mt-2 flex items-center gap-1.5 text-xs text-destructive">
              <AlertCircle className="size-3.5 shrink-0" />
              {bookingError}
            </p>
          )}
        </div>
      )}

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
            {selectedDate ? `Available Guides — ${guidesToShow.length}` : "Guides for This Trek"}
          </h3>

          {!selectedDate && canBook && (
            <div className="flex items-start gap-2 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-700 dark:text-amber-400">
              <AlertCircle className="mt-0.5 size-4 shrink-0" />
              <p>
                Choose a <strong>date</strong> above to see which guides are available and to book. Without a date we can&apos;t check guide availability.
              </p>
            </div>
          )}

          {guidesToShow.map((guide) => {
            const myStatus = myRequest?.guide_id === guide.guide_id ? myRequest.status : null
            return (
              <GuideCard
                key={guide.id}
                guide={guide}
                onBook={canBook ? () => handleBookGuide(guide) : undefined}
                myStatus={myStatus}
              />
            )
          })}
        </div>
      ) : (
        <div className="rounded-xl border border-border bg-card p-8 text-center">
          <p className="text-muted-foreground">
            {selectedDate ? "No guides available for this date" : "Select a date to see available guides"}
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
        <DialogContent className="max-w-md border-border bg-card mx-4 sm:mx-auto">
          {selectedGuide && (
            <>
              <DialogHeader>
                <DialogTitle>{bookingSuccess ? "Request Sent" : "Send Request"}</DialogTitle>
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
                  {/* Guide + Date summary */}
                  <div className="mb-4 flex items-center gap-3 rounded-lg bg-background/40 p-3">
                    {selectedGuide.guides.profile_photo_url ? (
                      <img src={selectedGuide.guides.profile_photo_url} alt="" className="size-10 shrink-0 rounded-full object-cover" />
                    ) : (
                      <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-amber-400 to-amber-600 text-sm font-bold text-white">
                        {selectedGuide.guides.profiles.name?.charAt(0)}
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold">{selectedGuide.guides.profiles.name}</p>
                      <p className="text-xs text-muted-foreground">{selectedDate} · {trek.itinerary?.length || parseTrekDays(String(trek.days))} days</p>
                    </div>
                  </div>

                  {/* Trekkers + Trek Assist row */}
                  <div className="mb-3 flex flex-col gap-2 sm:flex-row">
                    <div className="flex flex-1 items-center justify-between rounded-lg border border-border bg-background/40 px-3 py-2.5">
                      <div className="flex items-center gap-1.5">
                        <Users className="size-4 text-primary" />
                        <span className="text-sm font-medium">Trekkers</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <button type="button" onClick={() => setNumTrekkers((n) => Math.max(1, n - 1))} disabled={numTrekkers <= 1} className="flex size-7 items-center justify-center rounded-md border border-border text-muted-foreground hover:bg-accent disabled:opacity-30"><Minus className="size-3.5" /></button>
                        <span className="w-6 text-center text-sm font-semibold">{numTrekkers}</span>
                        <button type="button" onClick={() => setNumTrekkers((n) => Math.min(20, n + 1))} disabled={numTrekkers >= 20} className="flex size-7 items-center justify-center rounded-md border border-border text-muted-foreground hover:bg-accent disabled:opacity-30"><Plus className="size-3.5" /></button>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setTrekAssistRequired((v) => !v)}
                      className={`flex flex-1 items-center justify-between rounded-lg border px-3 py-2.5 text-left transition-colors ${trekAssistRequired ? "border-primary/40 bg-primary/10" : "border-border bg-background/40 hover:bg-accent"}`}
                    >
                      <div className="flex items-center gap-2">
                        <div className={`flex size-4 items-center justify-center rounded-sm border ${trekAssistRequired ? "border-primary bg-primary" : "border-muted-foreground/40"}`}>
                          {trekAssistRequired && <CheckCircle2 className="size-3 text-white" />}
                        </div>
                        <span className="text-sm font-medium">Trek Assist</span>
                      </div>
                      <span className="text-xs text-muted-foreground">{inr(3500)}/d</span>
                    </button>
                  </div>

                  {/* Trek assist details */}
                  {trekAssistRequired && (
                    <div className="mb-3 rounded-lg border border-dashed border-primary/20 bg-primary/5 px-3 py-2 text-xs leading-relaxed text-muted-foreground">
                      <span className="font-medium text-foreground">Includes:</span> Porter, tent, sleeping bag, mattress, cooking gear, food
                      <br />
                      <span className="font-medium text-foreground">Excludes:</span> Trekking poles, gaiters, crampons, raincoats
                    </div>
                  )}

                  {/* Pricing */}
                  {(() => {
                    const pricing = computeBookingPricing({
                      trekDays: trek.itinerary?.length || parseTrekDays(String(trek.days)),
                      numPeople: numTrekkers,
                      guideRequired,
                      trekAssistRequired,
                    })
                    return (
                      <div className="mb-3 rounded-lg bg-muted/30 p-3 space-y-2">
                        <div className="flex justify-between text-sm text-muted-foreground">
                          <span>Guide fee ({pricing.billableDays} trekking days)</span>
                          <span className="font-mono">{inr(pricing.guideFee)}</span>
                        </div>
                        {trekAssistRequired && (
                          <div className="flex justify-between text-sm text-muted-foreground">
                            <span>Trek assist ({pricing.billableDays} trekking days)</span>
                            <span className="font-mono">{inr(pricing.trekAssistFee)}</span>
                          </div>
                        )}
                        <div className="flex justify-between border-t border-border pt-2">
                          <span className="text-sm font-medium">Total</span>
                          <span className="font-mono text-sm font-bold text-primary">{inr(pricing.totalAmount)}</span>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Booking fee: {inr(pricing.paymentAmount)} ({numTrekkers} × {inr(500)})
                        </p>
                      </div>
                    )
                  })()}

                  <Textarea
                    placeholder="Notes for the guide (optional)"
                    className="mb-3 text-sm"
                    id="booking-notes"
                    rows={2}
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
                      onClick={() => submitBooking()}
                      className="flex-1"
                      disabled={submitting}
                    >
                      {submitting ? "Sending..." : "Send Request"}
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
  myStatus,
}: {
  guide: Guide
  unavailable?: boolean
  onBook?: () => void
  myStatus?: string | null
}) {
  const initial = guide.guides.profiles.name?.charAt(0).toUpperCase() || "?"

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`rounded-xl border border-border bg-card p-4 sm:p-6 ${unavailable ? "opacity-50" : ""}`}
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
        <div className="flex flex-1 items-start gap-3">
          {guide.guides.profile_photo_url ? (
            <img
              src={guide.guides.profile_photo_url}
              alt={guide.guides.profiles.name}
              className="size-10 shrink-0 rounded-full object-cover sm:size-11"
            />
          ) : (
            <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-amber-400 to-amber-600 text-sm font-bold text-white sm:size-11">
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
        ) : myStatus === "pending" ? (
          <span className="flex shrink-0 items-center gap-1.5 self-start rounded-lg border border-status-pending/25 bg-status-pending/15 px-2 py-1.5 font-mono text-[9px] uppercase tracking-widest text-status-pending sm:px-3 sm:py-2 sm:text-[10px]">
            <Clock className="size-3" />
            Pending
          </span>
        ) : myStatus === "guide_approved" ? (
          <span className="flex shrink-0 items-center gap-1.5 self-start rounded-lg border border-primary/30 bg-primary/10 px-2 py-1.5 font-mono text-[9px] uppercase tracking-widest text-primary sm:px-3 sm:py-2 sm:text-[10px]">
            <CheckCircle2 className="size-3" />
            Accepted
          </span>
        ) : myStatus === "confirmed" ? (
          <span className="flex shrink-0 items-center gap-1.5 self-start rounded-lg border border-primary/25 bg-primary/5 px-2 py-1.5 font-mono text-[9px] uppercase tracking-widest text-primary sm:px-3 sm:py-2 sm:text-[10px]">
            <CheckCircle2 className="size-3" />
            Confirmed
          </span>
        ) : onBook ? (
          <Button onClick={onBook} className="shrink-0 w-full sm:w-auto">
            Book Guide
          </Button>
        ) : null}
      </div>
    </motion.div>
  )
}
