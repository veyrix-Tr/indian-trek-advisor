"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { MapPin, Star } from "lucide-react"
import type { Trek } from "@/lib/data"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
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
  const [guides, setGuides] = useState<Guide[]>([])
  const [selectedDate, setSelectedDate] = useState("")
  const [loading, setLoading] = useState(false)
  const [selectedGuide, setSelectedGuide] = useState<Guide | null>(null)
  const [showBookingModal, setShowBookingModal] = useState(false)

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
      } else {
        const data = await response.json()
        alert(data.error || "Error creating booking. Please try again.")
      }
    } catch (error) {
      console.error("Error creating booking:", error)
      alert("Error creating booking. Please try again.")
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
