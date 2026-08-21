// ─── Pricing Configuration ─────────────────────────────────
// All monetary values in INR. Change these constants to adjust pricing.
// Server-side only — clients never dictate the amounts.

/** Fixed guide fee per day (per group, not per person). */
export const GUIDE_FEE_PER_DAY = 1500

/** Trek assist base fee per day for 1 person. */
export const TREK_ASSIST_BASE = 3500

/** Trek assist additional fee per day per extra person (beyond 1). */
export const TREK_ASSIST_ADDITIONAL = 1000

/** Payment amount per person (deposit/approximate). */
export const PAYMENT_PER_PERSON = 500
