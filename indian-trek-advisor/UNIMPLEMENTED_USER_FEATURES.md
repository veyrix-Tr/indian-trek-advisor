# User Page — Unimplemented / Incomplete Features

Brief list of remaining gaps on the trekker (regular user) experience.

## Bookings
- **No real-time status updates** — bookings fetch once on mount; user must refresh to see status changes. No Supabase `channel()` subscription.
- **Payment is a fake flag** — `app/api/bookings/[id]/confirm-payment/route.ts` just sets `status='confirmed', payment_status='paid'`. No payment gateway. Trekker can type any amount and it "pays".


## Not implemented at all (mentioned in docs/plans)
- Real payment gateway (plan.md)
- Trekker-side real-time updates
- Admin audit log