"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Calendar, Clock, CheckCircle, XCircle, Star } from "lucide-react"

interface Booking {
  id: string
  trek_id: string
  status: string
  payment_status: string
  booking_date: string
  guides: {
    profiles: {
      name: string
      phone?: string
    }
    guides: {
      rating: number
    }
  }
}

export default function BookingsPage() {
  const [bookings, setBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState(true)

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

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800'
      case 'guide_approved': return 'bg-blue-100 text-blue-800'
      case 'admin_approved': return 'bg-purple-100 text-purple-800'
      case 'confirmed': return 'bg-green-100 text-green-800'
      case 'completed': return 'bg-gray-100 text-gray-800'
      case 'cancelled': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const handleConfirmPayment = async (bookingId: string) => {
    const amount = prompt("Enter payment amount:")
    if (!amount) return

    try {
      const response = await fetch(`/api/bookings/${bookingId}/confirm-payment`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: parseFloat(amount) })
      })

      if (response.ok) {
        fetchBookings()
        alert("Payment confirmed! Guide contact information will be shared.")
      }
    } catch (error) {
      console.error("Error confirming payment:", error)
    }
  }

  if (loading) {
    return <div className="p-8 text-center">Loading bookings...</div>
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">My Bookings</h1>

      {bookings.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center text-muted-foreground">
            No bookings yet. Start by exploring treks and booking a guide!
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {bookings.map((booking) => (
            <Card key={booking.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">Booking #{booking.id.slice(0, 8)}</CardTitle>
                  <Badge className={getStatusBadgeColor(booking.status)}>
                    {booking.status.replace('_', ' ')}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <p className="flex items-center gap-2">
                    <Calendar className="size-4" />
                    <span>Date: {booking.booking_date}</span>
                  </p>
                  <p className="flex items-center gap-2">
                    <Clock className="size-4" />
                    <span>Guide: {booking.guides?.profiles?.name}</span>
                  </p>
                  <div className="flex items-center gap-2">
                    <Star className="size-4 fill-yellow-400 text-yellow-400" />
                    <span>Rating: {booking.guides?.guides?.rating?.toFixed(1)}</span>
                  </div>
                </div>

                {booking.status === 'admin_approved' && (
                  <Button
                    onClick={() => handleConfirmPayment(booking.id)}
                    className="mt-4"
                  >
                    Confirm Payment
                  </Button>
                )}

                {booking.status === 'confirmed' && (
                  <div className="mt-4 p-3 bg-green-50 rounded-lg">
                    <p className="font-semibold text-green-800">Contact Information</p>
                    <p className="text-green-700">{booking.guides?.profiles?.phone}</p>
                  </div>
                )}

                {booking.status === 'completed' && (
                  <Button
                    variant="outline"
                    className="mt-4"
                    onClick={() => {
                      alert("Rating feature coming soon!")
                    }}
                  >
                    <Star className="size-4 mr-2" />
                    Rate Guide
                  </Button>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
