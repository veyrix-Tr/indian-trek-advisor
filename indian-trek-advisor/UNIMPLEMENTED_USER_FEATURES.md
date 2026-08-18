# Unimplemented / Incomplete Features

Remaining genuine gaps across the platform (user-facing features that are
stubbed, dead, or otherwise not real yet). No items here are nice-to-have
polish; each blocks a real part of the product.

## Payments
- **Payment is not real** — final verification (`app/api/bookings/[id]/user-verify`)
  confirms the booking and hard-locks the guide's dates, but no payment gateway is
  hooked in. The trekker's "Final Verification" is the confirmed/finalized step where
  a real payment flow will be bundled later.
- **Paid revenue is always ₹0** — admin booking stats (`/api/admin/bookings/stats`)
  reports `paidRevenue = 0` because there is no gateway. Revenue is only computed from
  confirmed/completed booking amounts, not from actual paid transactions.

## Guide payouts
- **Payouts are collected but never paid** — `guide_payout_details` stores bank/UPI
  info and a payout request can be marked, but there is no actual transfer/disbursal
  flow. Money received from trekkers has no way to reach the guide yet.
