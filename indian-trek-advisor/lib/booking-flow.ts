export type BookingStatus =
  | "pending"
  | "guide_approved"
  | "confirmed"
  | "completed"
  | "cancelled"

export type BookingActor = "trekker" | "guide" | "admin"

export const BOOKING_FLOW: BookingStatus[] = [
  "pending",
  "guide_approved",
  "confirmed",
  "completed",
]

// Legal transitions keyed by (from → to). Cancellations are handled separately
// via CANCELLABLE_STATUSES.
//
// Flow: pending (trekker requested) → guide_approved (guide accepted, awaiting
// the trekker's final verification) → confirmed (trekker verified) →
// completed. No admin approval step.
export const VALID_TRANSITIONS: Partial<Record<BookingStatus, BookingStatus[]>> = {
  pending: ["guide_approved", "cancelled"],
  guide_approved: ["confirmed", "cancelled"],
  confirmed: ["completed"],
  completed: [],
  cancelled: [],
}

// A trekker can cancel until their final verification (pending and
// guide_approved). After confirmation the booking is locked.
export const CANCELLABLE_STATUSES: BookingStatus[] = [
  "pending",
  "guide_approved",
]

export function isTerminal(status: BookingStatus): boolean {
  return status === "completed" || status === "cancelled"
}

export function canTransition(from: BookingStatus, to: BookingStatus): boolean {
  if (to === "cancelled") return CANCELLABLE_STATUSES.includes(from)
  return VALID_TRANSITIONS[from]?.includes(to) ?? false
}
