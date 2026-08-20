import { Cashfree, CFEnvironment } from "cashfree-pg"

const CASHFREE_APP_ID = process.env.CASHFREE_APP_ID || ""
const CASHFREE_SECRET_KEY = process.env.CASHFREE_SECRET_KEY || ""

const isProduction = process.env.CASHFREE_ENV === "production"

// cashfree-pg v6 constructor signature is
//   new Cashfree(XEnvironment, XClientId, XClientSecret, ...)
// XEnvironment must be a CFEnvironment enum (SANDBOX=1 / PRODUCTION=2).
export const cashfree = new Cashfree(
  isProduction ? CFEnvironment.PRODUCTION : CFEnvironment.SANDBOX,
  CASHFREE_APP_ID,
  CASHFREE_SECRET_KEY,
)

export function validateCashfreeConfig() {
  if (!CASHFREE_APP_ID || !CASHFREE_SECRET_KEY) {
    throw new Error(
      "Cashfree credentials not configured. Set CASHFREE_APP_ID and CASHFREE_SECRET_KEY environment variables.",
    )
  }
}