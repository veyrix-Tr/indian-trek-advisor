"use client"

import { useState, useEffect, useMemo } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ChevronLeft, ChevronRight, MapPin, CalendarRange, CheckCircle2, AlertCircle } from "lucide-react"

interface Booking {
  id: string
  status: string
  booking_date: string
  trekker?: { name: string; email: string }
  guides?: { trek_name: string; id: string }
}

interface AvailabilityCalendarProps {
  bookings?: Booking[]
  onSave?: (unavailableDates: string[]) => void
}

const ACTIVE_STATUSES = ["confirmed"]

function todayStart() {
  return new Date(new Date().setHours(0, 0, 0, 0))
}

export function GuideAvailabilityCalendar({ bookings = [], onSave }: AvailabilityCalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [unavailableDates, setUnavailableDates] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null)
  const [showBlockRange, setShowBlockRange] = useState(false)
  const [rangeStart, setRangeStart] = useState("")
  const [rangeEnd, setRangeEnd] = useState("")

  useEffect(() => {
    fetchAvailability()
  }, [])

  const bookedByDate = useMemo(() => {
    const map = new Map<string, Booking>()
    bookings
      .filter((b) => ACTIVE_STATUSES.includes(b.status))
      .forEach((b) => map.set(b.booking_date, b))
    return map
  }, [bookings])

  const fetchAvailability = async () => {
    try {
      const response = await fetch("/api/guide/availability")
      const data = await response.json()

      // Unmarked dates are available by default, so only the explicitly
      // "unavailable" rows matter.
      const unavailable = new Set<string>()
      data.availability?.forEach((avail: any) => {
        if (avail.status === 'unavailable') {
          unavailable.add(avail.date)
        }
      })

      setUnavailableDates(unavailable)
    } catch (error) {
      console.error("Error fetching availability:", error)
    }
    setLoading(false)
  }

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear()
    const month = date.getMonth()
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const daysInMonth = lastDay.getDate()
    const startDayOfWeek = firstDay.getDay()

    return { daysInMonth, startDayOfWeek }
  }

  // One-click toggle: unmarked dates are available by default, so guides only
  // block the days they're absent. A single click marks a date unavailable;
  // clicking it again makes it available again. No multi-state cycling.
  const toggleDate = (dateStr: string) => {
    const newUnavailable = new Set(unavailableDates)
    if (unavailableDates.has(dateStr)) {
      newUnavailable.delete(dateStr)
    } else {
      newUnavailable.add(dateStr)
    }
    setUnavailableDates(newUnavailable)
  }

  const blockRange = () => {
    if (!rangeStart || !rangeEnd) return
    const start = new Date(rangeStart)
    const end = new Date(rangeEnd)
    if (start > end) return

    const newUnavailable = new Set(unavailableDates)
    const cursor = new Date(start)

    while (cursor <= end) {
      const dateStr = `${cursor.getFullYear()}-${String(cursor.getMonth() + 1).padStart(2, '0')}-${String(cursor.getDate()).padStart(2, '0')}`
      if (cursor >= todayStart() && !bookedByDate.has(dateStr)) {
        newUnavailable.add(dateStr)
      }
      cursor.setDate(cursor.getDate() + 1)
    }

    setUnavailableDates(newUnavailable)
    setShowBlockRange(false)
    setRangeStart("")
    setRangeEnd("")
  }

  const handleSave = async () => {
    setSaving(true)
    setFeedback(null)
    try {
      const res = await fetch("/api/guide/availability", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          dates: Array.from(unavailableDates),
          action: 'unavailable'
        })
      })

      if (!res.ok) {
        setFeedback({ type: "error", message: "Failed to save. Please try again." })
      } else {
        if (onSave) {
          onSave(Array.from(unavailableDates))
        }
        setFeedback({ type: "success", message: "Availability updated" })
      }
    } catch (error) {
      console.error("Error saving availability:", error)
      setFeedback({ type: "error", message: "Failed to save. Please try again." })
    }
    setSaving(false)
    setTimeout(() => setFeedback(null), 2500)
  }

  const { daysInMonth, startDayOfWeek } = getDaysInMonth(currentDate)
  const days = []

  for (let i = 0; i < startDayOfWeek; i++) {
    days.push(<div key={`empty-${i}`} className="p-2" />)
  }

  for (let day = 1; day <= daysInMonth; day++) {
    const dateStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
    const isUnavailable = unavailableDates.has(dateStr)
    const booking = bookedByDate.get(dateStr)
    const isBooked = Boolean(booking)
    const isPast = new Date(dateStr) < todayStart()

    days.push(
      <button
        key={day}
        type="button"
        onClick={() => !isPast && !isBooked && toggleDate(dateStr)}
        disabled={isPast || isBooked}
        title={
          isBooked
            ? `Booked — ${booking?.trekker?.name || "Trekker"}${booking?.guides?.trek_name ? `, ${booking.guides.trek_name}` : ""}`
            : isUnavailable
              ? "Unavailable — tap to make available"
              : "Available — tap to block"
        }
        className={`
          relative p-2 rounded-lg text-sm font-medium border transition-colors duration-150
          ${isPast && !isBooked ? 'text-muted-foreground border-transparent cursor-not-allowed opacity-40' : ''}
          ${!isPast && !isBooked ? 'cursor-pointer hover:bg-muted' : ''}
          ${isBooked ? `bg-status-confirmed/15 text-status-confirmed border-status-confirmed/25 cursor-help ${isPast ? 'opacity-60' : ''}` : ''}
          ${isUnavailable && !isBooked ? 'bg-destructive/15 text-destructive border-destructive/25 hover:bg-destructive/25' : ''}
          ${!isUnavailable && !isBooked && !isPast ? 'bg-muted/50 border-transparent' : ''}
        `}
      >
        {day}
        {isBooked && (
          <MapPin className="absolute -top-1 -right-1 size-3 text-status-confirmed" />
        )}
      </button>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
    >
      <Card className="border-border/60 bg-card/60 backdrop-blur-xl">
        <CardHeader>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <CardTitle className="flex items-center gap-2 text-sm font-semibold">
              <CalendarRange className="size-4 text-primary" />
              Availability Calendar
            </CardTitle>
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                className="border-border/60"
                onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1))}
              >
                <ChevronLeft className="size-4" />
              </Button>
              <span className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
                {currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
              </span>
              <Button
                size="sm"
                variant="outline"
                className="border-border/60"
                onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1))}
              >
                <ChevronRight className="size-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="grid grid-cols-7 gap-1">
              {Array.from({ length: 35 }).map((_, i) => (
                <div key={i} className="aspect-square animate-pulse rounded-lg bg-muted/40" />
              ))}
            </div>
          ) : (
            <>
              <div className="grid grid-cols-7 gap-1 mb-2">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                  <div key={day} className="text-center font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                    {day}
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-7 gap-1">
                {days}
              </div>

              <div className="flex flex-wrap items-center gap-4 mt-4 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                <div className="flex items-center gap-2">
                  <div className="size-3.5 rounded border border-destructive/25 bg-destructive/15" />
                  <span>Unavailable (tap date)</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="size-3.5 rounded border border-status-confirmed/25 bg-status-confirmed/15" />
                  <span>Booked</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="size-3.5 rounded bg-muted/50" />
                  <span>Available (tap to block)</span>
                </div>
              </div>

              <AnimatePresence>
                {showBlockRange && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="mt-4 flex flex-wrap items-end gap-2 rounded-xl border border-border/40 bg-background/40 p-3">
                      <div className="flex-1 min-w-[120px]">
                        <label className="mb-1 block font-mono text-[9px] uppercase tracking-widest text-muted-foreground">From</label>
                        <input
                          type="date"
                          value={rangeStart}
                          onChange={(e) => setRangeStart(e.target.value)}
                          className="w-full rounded-lg border border-border/60 bg-background/60 px-3 py-1.5 text-sm text-foreground outline-none focus:border-primary/40"
                        />
                      </div>
                      <div className="flex-1 min-w-[120px]">
                        <label className="mb-1 block font-mono text-[9px] uppercase tracking-widest text-muted-foreground">To</label>
                        <input
                          type="date"
                          value={rangeEnd}
                          onChange={(e) => setRangeEnd(e.target.value)}
                          className="w-full rounded-lg border border-border/60 bg-background/60 px-3 py-1.5 text-sm text-foreground outline-none focus:border-primary/40"
                        />
                      </div>
                      <Button size="sm" onClick={blockRange} disabled={!rangeStart || !rangeEnd}>
                        Mark Unavailable
                      </Button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="mt-4 flex flex-wrap items-center gap-2">
                <Button onClick={handleSave} disabled={saving} className="flex-1 min-w-[140px]">
                  {saving ? "Saving..." : "Save Availability"}
                </Button>
                <Button
                  variant="outline"
                  className="border-border/60"
                  onClick={() => setShowBlockRange((v) => !v)}
                >
                  <CalendarRange className="size-3.5" />
                  Block a Range
                </Button>
                <AnimatePresence>
                  {feedback && (
                    <motion.span
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0 }}
                      className={`flex items-center gap-1 font-mono text-xs ${feedback.type === "success" ? "text-primary" : "text-destructive"}`}
                    >
                      {feedback.type === "success" ? <CheckCircle2 className="size-3.5" /> : <AlertCircle className="size-3.5" />}
                      {feedback.message}
                    </motion.span>
                  )}
                </AnimatePresence>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </motion.div>
  )
}
