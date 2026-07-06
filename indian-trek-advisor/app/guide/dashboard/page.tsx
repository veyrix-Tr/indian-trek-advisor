"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Calendar, DollarSign, Star, CheckCircle, XCircle, Clock } from "lucide-react"
import { GuideAvailabilityCalendar } from "@/components/guide-availability-calendar"

interface Booking {
  id: string
  trek_id: string
  status: string
  booking_date: string
  trekker: {
    name: string
    email: string
  }
}

export default function GuideDashboardPage() {
  const [bookings, setBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState(true)
  const [guideRating, setGuideRating] = useState(0)

  useEffect(() => {
    fetchBookings()
    fetchGuideProfile()
  }, [])

  const fetchBookings = async () => {
    try {
      const response = await fetch("/api/guide/bookings")
      const data = await response.json()
      setBookings(data.bookings || [])
    } catch (error) {
      console.error("Error fetching bookings:", error)
    }
    setLoading(false)
  }

  const fetchGuideProfile = async () => {
    try {
      const response = await fetch("/api/guide/profile")
      const data = await response.json()
      if (data.guide?.rating) {
        setGuideRating(data.guide.rating)
      }
    } catch (error) {
      console.error("Error fetching guide profile:", error)
    }
  }

  const handleApprove = async (bookingId: string) => {
    try {
      const response = await fetch(`/api/bookings/${bookingId}/approve-guide`, {
        method: "POST"
      })

      if (response.ok) {
        fetchBookings()
        alert("Booking approved and sent to admin for verification")
      } else {
        const data = await response.json()
        alert(data.error || "Error approving booking")
      }
    } catch (error) {
      console.error("Error approving booking:", error)
    }
  }

  const handleReject = async (bookingId: string) => {
    try {
      const response = await fetch(`/api/bookings/${bookingId}/cancel`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: "Guide unavailable" })
      })

      if (response.ok) {
        fetchBookings()
        alert("Booking rejected")
      } else {
        const data = await response.json()
        alert(data.error || "Error rejecting booking")
      }
    } catch (error) {
      console.error("Error rejecting booking:", error)
    }
  }

  const handleComplete = async (bookingId: string) => {
    if (!confirm("Mark this booking as completed? The trekker will be asked to rate you.")) return

    try {
      const response = await fetch(`/api/bookings/${bookingId}/complete`, {
        method: "POST"
      })

      if (response.ok) {
        fetchBookings()
        alert("Booking marked as completed")
      } else {
        const data = await response.json()
        alert(data.error || "Error completing booking")
      }
    } catch (error) {
      console.error("Error completing booking:", error)
    }
  }

  if (loading) {
    return <div className="p-8 text-center">Loading dashboard...</div>
  }

  const pendingBookings = bookings.filter(b => b.status === 'pending')
  const guideApprovedBookings = bookings.filter(b => b.status === 'guide_approved')
  const confirmedBookings = bookings.filter(b => b.status === 'confirmed')
  const completedBookings = bookings.filter(b => b.status === 'completed')

  return (
    <div className="max-w-6xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Guide Dashboard</h1>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2">
              <Calendar className="size-5 text-primary" />
              <div>
                <p className="text-2xl font-bold">{pendingBookings.length}</p>
                <p className="text-sm text-muted-foreground">Pending Requests</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2">
              <CheckCircle className="size-5 text-green-600" />
              <div>
                <p className="text-2xl font-bold">{confirmedBookings.length}</p>
                <p className="text-sm text-muted-foreground">Confirmed Bookings</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2">
              <Star className="size-5 text-yellow-500" />
              <div>
                <p className="text-2xl font-bold">{guideRating.toFixed(1)}</p>
                <p className="text-sm text-muted-foreground">Average Rating</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Bookings */}
      <Tabs defaultValue="pending">
        <TabsList>
          <TabsTrigger value="pending">Pending ({pendingBookings.length})</TabsTrigger>
          <TabsTrigger value="guide-approved">Awaiting Admin ({guideApprovedBookings.length})</TabsTrigger>
          <TabsTrigger value="confirmed">Confirmed ({confirmedBookings.length})</TabsTrigger>
          <TabsTrigger value="completed">Completed ({completedBookings.length})</TabsTrigger>
          <TabsTrigger value="availability">Availability</TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="space-y-4 mt-4">
          {pendingBookings.length === 0 ? (
            <p className="text-muted-foreground">No pending bookings</p>
          ) : (
            pendingBookings.map((booking) => (
              <Card key={booking.id}>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold">{booking.trekker?.name || 'Unknown Trekker'}</p>
                      <p className="text-sm text-muted-foreground">{booking.booking_date}</p>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" onClick={() => handleApprove(booking.id)}>
                        <CheckCircle className="size-4 mr-1" />
                        Approve
                      </Button>
                      <Button size="sm" variant="destructive" onClick={() => handleReject(booking.id)}>
                        <XCircle className="size-4 mr-1" />
                        Reject
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        <TabsContent value="guide-approved" className="space-y-4 mt-4">
          {guideApprovedBookings.length === 0 ? (
            <p className="text-muted-foreground">No bookings awaiting admin approval</p>
          ) : (
            guideApprovedBookings.map((booking) => (
              <Card key={booking.id}>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold">{booking.trekker?.name || 'Unknown Trekker'}</p>
                      <p className="text-sm text-muted-foreground">{booking.booking_date}</p>
                    </div>
                    <Badge className="bg-blue-100 text-blue-800">
                      <Clock className="size-3 mr-1" />
                      Awaiting Admin
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        <TabsContent value="confirmed" className="space-y-4 mt-4">
          {confirmedBookings.map((booking) => (
            <Card key={booking.id}>
              <CardContent className="p-6">
                <p className="font-semibold">{booking.trekker?.name || 'Unknown Trekker'}</p>
                <p className="text-sm text-muted-foreground">{booking.booking_date}</p>
                <Button
                  size="sm"
                  variant="outline"
                  className="mt-2"
                  onClick={() => handleComplete(booking.id)}
                >
                  Mark Complete
                </Button>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="completed" className="space-y-4 mt-4">
          {completedBookings.map((booking) => (
            <Card key={booking.id}>
              <CardContent className="p-6">
                <p className="font-semibold">{booking.trekker?.name || 'Unknown Trekker'}</p>
                <p className="text-sm text-muted-foreground">{booking.booking_date}</p>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="availability" className="mt-4">
          <GuideAvailabilityCalendar />
        </TabsContent>
      </Tabs>
    </div>
  )
}
