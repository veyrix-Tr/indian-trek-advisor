# User Page — Unimplemented / Incomplete Features

Brief list of gaps on the trekker (regular user) experience.

## Bookings
- **No real-time status updates** — bookings fetch once on mount; user must refresh to see status changes. No Supabase `channel()` subscription.
- **Payment is a fake flag** — `app/api/bookings/[id]/confirm-payment/route.ts` just sets `status='confirmed', payment_status='paid'`. No payment gateway. Trekker can type any amount and it "pays".

## Profile
- **No avatar / photo upload** — `app/profile/page.tsx` always renders an initial-letter avatar; no upload control.
- **No email / password change** — profile edits only name/phone/city/bio. No `updateUser` / `resetPasswordForEmail`.

## Reviews
- **No content moderation** — free-text reviews stored with no profanity/abuse filtering.

## Auth / Misc
- **No password reset flow** — zero `resetPasswordForEmail` / forgot-password code.
- **Unused code** — `auth-modal.tsx:76` destructures `openComingSoon` but never uses it.
- **Multi-language support** — none.

## Not implemented at all (mentioned in docs/plans)
- Real payment gateway (plan.md)
- Trekker-side real-time updates
- Admin audit log

## Already working (for reference)
- Saved Treks (`app/saved/page.tsx`) — complete
- AI Trail Guide — complete
- Trek data + detail pages — complete
- Guide booking flow + rating submission — complete
- Gear Rental — sample directory shown with a "Coming Soon" banner for listings (implemented later)
- **My Bookings** — page is reachable now via the header profile dropdown ("My Bookings")
- **Trekker notifications** — bell in the header, with booking-status alerts at each stage (`/api/notifications*`)
- **Per-trekker review history** — `/reviews` page shows the trekker's own submitted reviews
- **Trail Photos tab** — now a clean "Coming Soon" state (no placeholder tiles / fake upload button)
- **Email verification** — accounts are created unconfirmed; a Brevo verification email is sent on signup (`lib/email/brevo.ts`, resend via `/api/auth/resend-verification`)

### Highest-impact fixes first
1. Add password reset flow
