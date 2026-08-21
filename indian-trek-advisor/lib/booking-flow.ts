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
// the trekker's booking fee) → confirmed (trekker paid) →
// completed. No admin approval step.
export const VALID_TRANSITIONS: Partial<Record<BookingStatus, BookingStatus[]>> = {
  pending: ["guide_approved", "cancelled"],
  guide_approved: ["confirmed", "cancelled"],
  confirmed: ["completed", "cancelled"],
  completed: [],
  cancelled: [],
}

// A trekker can cancel at any stage before completion. For confirmed bookings,
// cancellation triggers a refund request (must be > 7 days before trek date,
// handled on the frontend).
export const CANCELLABLE_STATUSES: BookingStatus[] = [
  "pending",
  "guide_approved",
  "confirmed",
]

export function isTerminal(status: BookingStatus): boolean {
  return status === "completed" || status === "cancelled"
}

export function canTransition(from: BookingStatus, to: BookingStatus): boolean {
  if (to === "cancelled") return CANCELLABLE_STATUSES.includes(from)
  return VALID_TRANSITIONS[from]?.includes(to) ?? false
}

// A request that hasn't been acted on within this window is considered "stale":
// the trekker may send a request to another guide, and the guide may accept a
// different request for the same span even though an older one is still open.
export const STALE_REQUEST_MS = 6 * 60 * 60 * 1000

export function isStaleRequest(createdAt: string | Date): boolean {
  return Date.now() - new Date(createdAt).getTime() >= STALE_REQUEST_MS
}
