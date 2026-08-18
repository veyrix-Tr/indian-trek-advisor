// A booking occupies the guide for `trek_days` consecutive dates starting on
// `booking_date`. Returns those ISO dates (YYYY-MM-DD).
export function bookingDateSpan(bookingDate: string, trekDays?: number | null): string[] {
  const days = Math.max(1, Math.floor(Number(trekDays) || 1))
  const start = new Date(bookingDate + "T00:00:00")
  if (isNaN(start.getTime())) return [bookingDate]

  const dates: string[] = []
  for (let i = 0; i < days; i++) {
    const d = new Date(start)
    d.setDate(start.getDate() + i)
    const iso = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`
    dates.push(iso)
  }
  return dates
}

// Does a date fall within any confirmed booking's span for this guide?
export async function guideBookedDates(
  supabase: any,
  guideId: string
): Promise<string[]> {
  const { data: bookings } = await supabase
    .from("bookings")
    .select("booking_date, trek_days")
    .eq("guide_id", guideId)
    .eq("status", "confirmed")

  const dates = new Set<string>()
  for (const b of bookings ?? []) {
    for (const d of bookingDateSpan(b.booking_date, b.trek_days)) {
      dates.add(d)
    }
  }
  return Array.from(dates)
}
