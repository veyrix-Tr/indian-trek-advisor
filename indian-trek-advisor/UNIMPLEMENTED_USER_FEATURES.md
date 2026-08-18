# Unimplemented / Incomplete Features

Remaining gaps across the platform.

## Payments
- **Payment is not real** — final verification (`app/api/bookings/[id]/user-verify`) confirms the booking and hard-locks the guide's dates, but no actual payment gateway is hooked in yet. The trekker's "Final Verification" is the confirmed/finalized step where a real payment flow will be bundled later.