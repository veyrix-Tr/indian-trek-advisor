import {
  GUIDE_FEE_PER_DAY,
  TREK_ASSIST_BASE,
  TREK_ASSIST_ADDITIONAL,
  PAYMENT_PER_PERSON,
} from "./pricing-config"

// ─── Shared helpers ────────────────────────────────────────

/** Parse a trek.days string like "5–6" / "3" / "2-3 days" into a day count. */
export function parseTrekDays(days?: string): number {
  if (!days) return 1
  const matches = days.match(/\d+/g)
  if (!matches?.length) return 1
  return Math.max(...matches.map(Number))
}

export function inr(value: number): string {
  return `₹${(value || 0).toLocaleString("en-IN")}`
}

// ─── Legacy pricing (kept for backward compatibility) ──────

/** @deprecated Use computeBookingPricing instead. */
export function computeBookingAmount(
  baseRate: number,
  numTrekkers: number,
  trekDays: number
): number {
  const safeTrekkers = Math.max(1, Math.floor(numTrekkers || 1))
  const safeDays = Math.max(1, Math.floor(trekDays || 1))
  return Math.round(baseRate * safeTrekkers * safeDays)
}

// ─── New two-component pricing ─────────────────────────────

export interface BookingPricing {
  /** Number of days (validated). */
  trekDays: number
  /** Number of people in the group. */
  numPeople: number
  /** Whether guide is required. */
  guideRequired: boolean
  /** Whether trek assist is required. */
  trekAssistRequired: boolean
  /** Guide fee: ₹1,500/day × days. */
  guideFee: number
  /** Trek assist fee: ₹3,500/day base + ₹1,000/day per extra person × days. */
  trekAssistFee: number
  /** Grand total (guideFee + trekAssistFee). */
  totalAmount: number
  /** Deposit payment: numPeople × ₹500. */
  paymentAmount: number
}

/**
 * Server-side pricing computation. Clients never dictate the amount.
 *
 * Formula:
 *   Guide fee       = ₹1,500/day × trekDays
 *   Trek assist fee = (₹3,500 + ₹1,000 × max(0, numPeople − 1)) / day × trekDays
 *   Total           = guideFee + trekAssistFee  (0 if neither required)
 *   Payment         = numPeople × ₹500
 */
export function computeBookingPricing(params: {
  trekDays?: number
  numPeople?: number
  guideRequired?: boolean
  trekAssistRequired?: boolean
}): BookingPricing {
  const trekDays = Math.max(1, Math.floor(params.trekDays || 1))
  const numPeople = Math.max(1, Math.floor(params.numPeople || 1))
  const guideRequired = params.guideRequired ?? true
  const trekAssistRequired = params.trekAssistRequired ?? false

  const guideFee = guideRequired
    ? GUIDE_FEE_PER_DAY * trekDays
    : 0

  const trekAssistFee = trekAssistRequired
    ? (TREK_ASSIST_BASE + TREK_ASSIST_ADDITIONAL * Math.max(0, numPeople - 1)) * trekDays
    : 0

  const totalAmount = guideFee + trekAssistFee
  const paymentAmount = numPeople * PAYMENT_PER_PERSON

  return {
    trekDays,
    numPeople,
    guideRequired,
    trekAssistRequired,
    guideFee,
    trekAssistFee,
    totalAmount,
    paymentAmount,
  }
}