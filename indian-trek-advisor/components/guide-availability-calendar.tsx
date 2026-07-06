"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ChevronLeft, ChevronRight, X, Check } from "lucide-react"

interface AvailabilityCalendarProps {
  onSave?: (availableDates: string[], unavailableDates: string[]) => void
}

export function GuideAvailabilityCalendar({ onSave }: AvailabilityCalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [availableDates, setAvailableDates] = useState<Set<string>>(new Set())
  const [unavailableDates, setUnavailableDates] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchAvailability()
  }, [])

  const fetchAvailability = async () => {
    try {
      const response = await fetch("/api/guide/availability")
      const data = await response.json()

      const available = new Set<string>()
      const unavailable = new Set<string>()

      data.availability?.forEach((avail: any) => {
        if (avail.status === 'available') {
          available.add(avail.date)
        } else if (avail.status === 'unavailable') {
          unavailable.add(avail.date)
        }
      })

      setAvailableDates(available)
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

  const toggleDate = (dateStr: string) => {
    const newAvailable = new Set(availableDates)
    const newUnavailable = new Set(unavailableDates)

    if (availableDates.has(dateStr)) {
      newAvailable.delete(dateStr)
    } else if (unavailableDates.has(dateStr)) {
      newUnavailable.delete(dateStr)
      newAvailable.add(dateStr)
    } else {
      newAvailable.add(dateStr)
    }

    setAvailableDates(newAvailable)
    setUnavailableDates(newUnavailable)
  }

  const markUnavailable = (dateStr: string) => {
    const newAvailable = new Set(availableDates)
    const newUnavailable = new Set(unavailableDates)

    newAvailable.delete(dateStr)
    newUnavailable.add(dateStr)

    setAvailableDates(newAvailable)
    setUnavailableDates(newUnavailable)
  }

  const handleSave = async () => {
    try {
      if (availableDates.size > 0) {
        await fetch("/api/guide/availability", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            dates: Array.from(availableDates),
            action: 'available'
          })
        })
      }

      if (unavailableDates.size > 0) {
        await fetch("/api/guide/availability", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            dates: Array.from(unavailableDates),
            action: 'unavailable'
          })
        })
      }

      if (onSave) {
        onSave(Array.from(availableDates), Array.from(unavailableDates))
      }

      alert("Availability updated successfully!")
    } catch (error) {
      console.error("Error saving availability:", error)
      alert("Error saving availability")
    }
  }

  const { daysInMonth, startDayOfWeek } = getDaysInMonth(currentDate)
  const days = []

  for (let i = 0; i < startDayOfWeek; i++) {
    days.push(<div key={`empty-${i}`} className="p-2" />)
  }

  for (let day = 1; day <= daysInMonth; day++) {
    const dateStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
    const isAvailable = availableDates.has(dateStr)
    const isUnavailable = unavailableDates.has(dateStr)
    const isPast = new Date(dateStr) < new Date(new Date().setHours(0, 0, 0, 0))

    days.push(
      <button
        key={day}
        onClick={() => !isPast && toggleDate(dateStr)}
        onContextMenu={(e) => {
          e.preventDefault()
          !isPast && markUnavailable(dateStr)
        }}
        disabled={isPast}
        className={`
          p-2 rounded-lg text-sm font-medium transition-all
          ${isPast ? 'text-muted-foreground cursor-not-allowed opacity-50' : 'cursor-pointer hover:bg-muted'}
          ${isAvailable ? 'bg-green-100 text-green-800 hover:bg-green-200' : ''}
          ${isUnavailable ? 'bg-red-100 text-red-800 hover:bg-red-200' : ''}
          ${!isAvailable && !isUnavailable && !isPast ? 'bg-muted/50' : ''}
        `}
        title={isUnavailable ? 'Right-click to mark available' : 'Click to toggle, right-click to mark unavailable'}
      >
        {day}
      </button>
    )
  }

  if (loading) {
    return <div className="text-center">Loading calendar...</div>
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Availability Calendar</CardTitle>
          <div className="flex items-center gap-2">
            <Button size="sm" variant="outline" onClick={() => setCurrentDate(new Date(currentDate.setMonth(currentDate.getMonth() - 1)))}>
              <ChevronLeft className="size-4" />
            </Button>
            <span className="font-medium">
              {currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
            </span>
            <Button size="sm" variant="outline" onClick={() => setCurrentDate(new Date(currentDate.setMonth(currentDate.getMonth() + 1)))}>
              <ChevronRight className="size-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-7 gap-1 mb-2">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
            <div key={day} className="text-center text-sm font-medium text-muted-foreground">
              {day}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-1">
          {days}
        </div>
        <div className="flex items-center gap-4 mt-4 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-green-100" />
            <span>Available</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-red-100" />
            <span>Unavailable</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-muted/50" />
            <span>Not set</span>
          </div>
        </div>
        <div className="mt-4 flex gap-2">
          <Button onClick={handleSave} className="flex-1">
            Save Availability
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
