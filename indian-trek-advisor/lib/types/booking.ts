export type BookingStatus =
  | "pending"
  | "guide_approved"
  | "confirmed"
  | "completed"
  | "cancelled"

export type PaymentStatus = 'pending' | 'paid'
export type AvailabilityStatus = 'available' | 'booked' | 'unavailable'

export interface Booking {
  id: string
  trek_id: string
  trekker_id: string
  guide_id: string
  booking_date: string
  status: BookingStatus
  payment_status: PaymentStatus
  payment_amount?: number
  created_at: string
  updated_at: string
  trek_completion_date?: string
}

export interface GuideAvailability {
  id: string
  guide_id: string
  date: string
  status: AvailabilityStatus
  booking_id?: string
}

export interface GuideRating {
  id: string
  guide_id: string
  trekker_id: string
  booking_id: string
  rating: number
  review?: string
  created_at: string
}

export interface GuideTrekAssociation {
  id: string
  guide_id: string
  trek_id: string
  base_rate: number
  created_at: string
}

export interface CreateBookingRequest {
  trek_id: string
  guide_id: string
  booking_date: string
  notes?: string
}
