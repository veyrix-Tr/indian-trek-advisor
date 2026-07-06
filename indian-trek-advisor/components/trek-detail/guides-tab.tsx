"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { BadgeCheck, Languages, MapPin, Phone, UserPlus, Users, Calendar, Star } from "lucide-react"
import type { Trek } from "@/lib/data"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useOverlays } from "@/components/overlays/overlay-provider"

interface Guide {
  id: string
  profiles: {
    name: string
    email: string
    phone?: string
    bio?: string
  }
  guides: {
    experience?: string
    rating: number
    total_ratings: number
    base_location?: string
    known_treks: string[]
  }
  guide_trek_associations: {
    base_rate: number
  }
}

export function GuidesTab({ trek }: { trek: Trek }) {
  const { openComingSoon } = useOverlays()
  const [showForm, setShowForm] = useState(false)
  const [guides, setGuides] = useState<Guide[]>([])
  const [selectedDate, setSelectedDate] = useState("")
  const [loading, setLoading] = useState(false)
  const [selectedGuide, setSelectedGuide] = useState<Guide | null>(null)
  const [showBookingModal, setShowBookingModal] = useState(false)
  const region = trek.region ?? trek.state

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
    setShowBookingModal(true)
  }

  const submitBooking = async (notes: string) => {
    if (!selectedGuide || !selectedDate) return

    try {
      const response = await fetch("/api/bookings/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          trek_id: trek.id,
          guide_id: selectedGuide.id,
          booking_date: selectedDate,
          notes
        })
      })

      if (response.ok) {
        setShowBookingModal(false)
        openComingSoon({
          title: "Booking Request Sent",
          message: "Your booking request has been sent to the guide. They will review and approve it shortly."
        })
      }
    } catch (error) {
      console.error("Error creating booking:", error)
    }
  }

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
        <div className="text-center text-muted-foreground">Loading guides...</div>
      ) : guides.length > 0 ? (
        <div className="space-y-4">
          <h3 className="font-semibold">Available Guides</h3>
          {guides.map((guide) => (
            <motion.div
              key={guide.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-xl border border-border bg-card p-6"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h4 className="font-semibold">{guide.profiles.name}</h4>
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <Star className="size-4 fill-yellow-400 text-yellow-400" />
                      <span>{guide.guides.rating.toFixed(1)}</span>
                      <span>({guide.guides.total_ratings})</span>
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
                  <p className="mt-2 font-semibold">₹{guide.guide_trek_associations.base_rate}/day</p>
                </div>
                <Button onClick={() => handleBookGuide(guide)}>
                  Book Guide
                </Button>
              </div>
            </motion.div>
          ))}
        </div>
      ) : (
        <div className="rounded-xl border border-border bg-card p-8 text-center">
          <p className="text-muted-foreground">
            {selectedDate ? "No guides available on this date" : "Select a date to see available guides"}
          </p>
        </div>
      )}

      {/* Guide Registration Form */}
      {showForm && (
        <motion.form
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          className="overflow-hidden rounded-xl border border-border bg-card"
          onSubmit={(e) => {
            e.preventDefault()
            openComingSoon({
              title: "Guide Registration",
              message:
                "Guide registration opens soon. We'll verify your ID, certifications, and trail experience, then list your profile — free for independent guides.",
            })
          }}
        >
          <div className="space-y-5 p-6">
            <div>
              <h3 className="flex items-center gap-2 font-mono text-xs uppercase tracking-widest text-primary">
                <UserPlus className="size-3.5" aria-hidden="true" />
                Register as a Local Guide
              </h3>
              <p className="mt-2 text-sm text-muted-foreground">
                List yourself for {trek.name} and other trails in {region}.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="guide-name">Full Name</Label>
                <Input id="guide-name" name="name" placeholder="e.g. Rajesh Rana" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="guide-phone">Phone / WhatsApp</Label>
                <Input
                  id="guide-phone"
                  name="phone"
                  type="tel"
                  placeholder="+91 XXXXX XXXXX"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="guide-village">Village / Town</Label>
                <Input id="guide-village" name="village" placeholder={trek.baseCamp ?? "Base village"} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="guide-experience">Years of Experience</Label>
                <Input
                  id="guide-experience"
                  name="experience"
                  type="number"
                  min="0"
                  max="60"
                  placeholder="e.g. 8"
                />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="guide-languages">Languages Spoken</Label>
                <Input
                  id="guide-languages"
                  name="languages"
                  placeholder="e.g. Hindi, English, Garhwali"
                />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="guide-bio">About You & Your Trails</Label>
                <Textarea
                  id="guide-bio"
                  name="bio"
                  rows={4}
                  placeholder="Certifications, treks you lead, group sizes you handle..."
                />
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between gap-3 border-t border-border bg-secondary/40 px-6 py-4">
            <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <MapPin className="size-3.5" aria-hidden="true" />
              Free listing for independent guides
            </p>
            <Button type="submit" className="rounded-full">
              Submit for Verification
            </Button>
          </div>
        </motion.form>
      )}

      {/* Booking Modal */}
      {showBookingModal && selectedGuide && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="rounded-xl border border-border bg-card p-6 max-w-md w-full mx-4"
          >
            <h3 className="text-lg font-semibold mb-4">Confirm Booking</h3>
            <div className="space-y-3 mb-4">
              <p><strong>Guide:</strong> {selectedGuide.profiles.name}</p>
              <p><strong>Date:</strong> {selectedDate}</p>
              <p><strong>Rate:</strong> ₹{selectedGuide.guide_trek_associations.base_rate}/day</p>
            </div>
            <Textarea
              placeholder="Add any notes for the guide..."
              className="mb-4"
              id="booking-notes"
            />
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setShowBookingModal(false)} className="flex-1">
                Cancel
              </Button>
              <Button
                onClick={() => {
                  const notes = (document.getElementById('booking-notes') as HTMLTextAreaElement)?.value || ''
                  submitBooking(notes)
                }}
                className="flex-1"
              >
                Confirm Booking
              </Button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  )
}
