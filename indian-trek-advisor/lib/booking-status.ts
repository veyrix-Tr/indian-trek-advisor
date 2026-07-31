export type BookingStatus =
  | "pending"
  | "guide_approved"
  | "admin_approved"
  | "confirmed"
  | "completed"
  | "cancelled"

interface StatusConfig {
  label: string
  description: string
  colorClass: string
}

export const STATUS_CONFIG: Record<BookingStatus, StatusConfig> = {
  pending: {
    label: "Pending",
    description: "Awaiting your response",
    colorClass: "border-status-pending/25 bg-status-pending/15 text-status-pending",
  },
  guide_approved: {
    label: "Awaiting Admin",
    description: "Waiting on admin verification",
    colorClass: "border-status-guide-approved/25 bg-status-guide-approved/15 text-status-guide-approved",
  },
  admin_approved: {
    label: "Awaiting Payment",
    description: "Waiting on trekker to complete payment",
    colorClass: "border-status-admin-approved/25 bg-status-admin-approved/15 text-status-admin-approved",
  },
  confirmed: {
    label: "Confirmed",
    description: "Locked in and upcoming",
    colorClass: "border-status-confirmed/25 bg-status-confirmed/15 text-status-confirmed",
  },
  completed: {
    label: "Completed",
    description: "Trek finished",
    colorClass: "border-status-completed/25 bg-status-completed/15 text-status-completed",
  },
  cancelled: {
    label: "Cancelled",
    description: "Booking was cancelled",
    colorClass: "border-status-cancelled/25 bg-status-cancelled/15 text-status-cancelled",
  },
}

export function getStatusConfig(status: string): StatusConfig {
  return (
    STATUS_CONFIG[status as BookingStatus] ?? {
      label: status,
      description: "",
      colorClass: "border-border/40 bg-muted/40 text-muted-foreground",
    }
  )
}
