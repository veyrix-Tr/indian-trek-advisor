import type { BookingActor } from "@/lib/booking-flow"

// Insert an audit row into booking_status_history. Best-effort: failures are
// logged, never block the booking action itself.
export async function recordBookingHistory(
  supabase: any,
  args: {
    bookingId: string
    fromStatus: string
    toStatus: string
    actorId?: string | null
    actorRole: BookingActor
    note?: string | null
  }
): Promise<{ ok: boolean; error?: string }> {
  const { error } = await supabase
    .from("booking_status_history")
    .insert({
      booking_id: args.bookingId,
      from_status: args.fromStatus,
      to_status: args.toStatus,
      actor_id: args.actorId ?? null,
      actor_role: args.actorRole,
      note: args.note ?? null,
    })

  if (error) {
    console.error("recordBookingHistory:", error.message)
    return { ok: false, error: error.message }
  }
  return { ok: true }
}

// Resolve the acting role (admin > guide > trekker) for an authenticated user.
export async function resolveActorRole(
  supabase: any,
  userId: string
): Promise<{ role: BookingActor; guideId: string | null }> {
  const { data: profile } = await supabase
    .from("profiles")
    .select("account_type")
    .eq("id", userId)
    .single()

  if (profile?.account_type === "admin") return { role: "admin", guideId: null }

  const { data: guide } = await supabase
    .from("guides")
    .select("id")
    .eq("user_id", userId)
    .single()

  if (guide) return { role: "guide", guideId: guide.id }

  return { role: "trekker", guideId: null }
}