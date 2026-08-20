import { Cashfree } from "cashfree-pg"

const CASHFREE_APP_ID = process.env.CASHFREE_APP_ID || ""
const CASHFREE_SECRET_KEY = process.env.CASHFREE_SECRET_KEY || ""

// @ts-ignore - Cashfree SDK type issue with environment parameter
export const cashfree = new Cashfree(CASHFREE_APP_ID, CASHFREE_SECRET_KEY, {
  environment: process.env.CASHFREE_ENV === "production" ? "PRODUCTION" : "SANDBOX",
})

export function validateCashfreeConfig() {
  if (!CASHFREE_APP_ID || !CASHFREE_SECRET_KEY) {
    throw new Error("Cashfree credentials not configured. Set CASHFREE_APP_ID and CASHFREE_SECRET_KEY environment variables.")
  }
}
