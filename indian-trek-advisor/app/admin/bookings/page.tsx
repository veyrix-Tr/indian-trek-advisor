"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Calendar, User, CheckCircle, XCircle, MapPin } from "lucide-react"

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

  const handleApprove = async (bookingId: string) => {
    try {
      const response = await fetch(`/api/bookings/${bookingId}/approve-admin`, {
        method: "POST"
      })

      if (response.ok) {
        fetchBookings()
        alert("Booking approved and sent to trekker for payment")
      }
    } catch (error) {
      console.error("Error approving booking:", error)
    }
  }

  const handleReject = async (bookingId: string) => {
    const reason = prompt("Enter rejection reason:")
    if (!reason) return

    try {
      const response = await fetch(`/api/bookings/${bookingId}/cancel`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason })
      })

      if (response.ok) {
        fetchBookings()
        alert("Booking rejected")
      }
    } catch (error) {
      console.error("Error rejecting booking:", error)
    }
  }

  if (loading) {
    return <div className="p-8 text-center">Loading bookings...</div>
  }

  const guideApproved = bookings.filter(b => b.status === 'guide_approved')
  const adminApproved = bookings.filter(b => b.status === 'admin_approved')

  return (
    <div className="max-w-6xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Admin Booking Review</h1>

      <Tabs defaultValue="guide-approved">
        <TabsList>
          <TabsTrigger value="guide-approved">
            Guide Approved ({guideApproved.length})
          </TabsTrigger>
          <TabsTrigger value="admin-approved">
            Admin Approved ({adminApproved.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="guide-approved" className="space-y-4 mt-4">
          {guideApproved.length === 0 ? (
            <p className="text-muted-foreground">No pending guide approvals</p>
          ) : (
            guideApproved.map((booking) => (
              <Card key={booking.id}>
                <CardHeader>
                  <CardTitle className="text-lg">Booking #{booking.id.slice(0, 8)}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <User className="size-4" />
                      <span><strong>Trekker:</strong> {booking.profiles.name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <User className="size-4" />
                      <span><strong>Guide:</strong> {booking.guides?.profiles?.name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin className="size-4" />
                      <span><strong>Trek:</strong> {booking.trek_id}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="size-4" />
                      <span><strong>Date:</strong> {booking.booking_date}</span>
                    </div>
                    {booking.profiles.phone && (
                      <p><strong>Trekker Phone:</strong> {booking.profiles.phone}</p>
                    )}
                    {booking.guides?.profiles?.phone && (
                      <p><strong>Guide Phone:</strong> {booking.guides.profiles.phone}</p>
                    )}
                  </div>
                  <div className="flex gap-2 mt-4">
                    <Button onClick={() => handleApprove(booking.id)}>
                      <CheckCircle className="size-4 mr-2" />
                      Approve
                    </Button>
                    <Button variant="destructive" onClick={() => handleReject(booking.id)}>
                      <XCircle className="size-4 mr-2" />
                      Reject
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        <TabsContent value="admin-approved" className="space-y-4 mt-4">
          {adminApproved.length === 0 ? (
            <p className="text-muted-foreground">No pending admin approvals</p>
          ) : (
            adminApproved.map((booking) => (
              <Card key={booking.id}>
                <CardContent className="p-6">
                  <p className="font-semibold">{booking.profiles.name} - {booking.trek_id}</p>
                  <p className="text-sm text-muted-foreground">{booking.booking_date}</p>
                  <Badge className="mt-2">Waiting for payment</Badge>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
