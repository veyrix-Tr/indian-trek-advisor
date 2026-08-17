// Parse a trek.days string like "5–6" / "3" / "2-3 days" into a day count.
// Returns the maximum day count from the range so pricing is not under-quoted.
export function parseTrekDays(days?: string): number {
  if (!days) return 1
  const matches = days.match(/\d+/g)
  if (!matches?.length) return 1
  return Math.max(...matches.map(Number))
}

// Total booking price = guide base rate (per day) × trek duration × group size.
// Computed server-side; clients never dictate the amount.
export function computeBookingAmount(
  baseRate: number,
  numTrekkers: number,
  trekDays: number
): number {
  const safeTrekkers = Math.max(1, Math.floor(numTrekkers || 1))
  const safeDays = Math.max(1, Math.floor(trekDays || 1))
  return Math.round(baseRate * safeTrekkers * safeDays)
}

export function inr(value: number): string {
  return `₹${(value || 0).toLocaleString("en-IN")}`
}