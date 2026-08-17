export type BookingStatus =
  | "pending"
  | "guide_approved"
  | "admin_approved"
  | "confirmed"
  | "completed"
  | "cancelled"

export type BookingActor = "trekker" | "guide" | "admin"

export const BOOKING_FLOW: BookingStatus[] = [
  "pending",
  "guide_approved",
  "admin_approved",
  "confirmed",
  "completed",
]

// Legal transitions keyed by (from → to). Cancellations are allowed from any
// active state and handled separately.
export const VALID_TRANSITIONS: Partial<Record<BookingStatus, BookingStatus[]>> = {
  pending: ["guide_approved", "cancelled"],
  guide_approved: ["admin_approved", "cancelled"],
  admin_approved: ["confirmed", "cancelled"],
  confirmed: ["completed", "cancelled"],
  completed: [],
  cancelled: [],
}

export const CANCELLABLE_STATUSES: BookingStatus[] = [
  "pending",
  "guide_approved",
  "admin_approved",
  "confirmed",
]

export function isTerminal(status: BookingStatus): boolean {
  return status === "completed" || status === "cancelled"
}

export function canTransition(from: BookingStatus, to: BookingStatus): boolean {
  if (to === "cancelled") return CANCELLABLE_STATUSES.includes(from)
  return VALID_TRANSITIONS[from]?.includes(to) ?? false
}