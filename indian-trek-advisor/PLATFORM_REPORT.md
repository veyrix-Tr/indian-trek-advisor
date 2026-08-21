# Indian Trek Advisor — Platform Report

**Project:** Indian Trek Advisor (indiantrekadvisor.com)
**Type:** Full-stack web platform connecting solo & group trekkers with verified local trek guides across India
**Status:** Production-feature-complete (bookings + payments live; guide payouts pending)
**Built on:** Next.js 16 (React 19) · Supabase (Postgres, Auth, Realtime) · Cloudinary · Brevo (email/SMS) · Cashfree (payments) · Google Gemini (AI)
**Deployed at:** https://indian-trek-advisor.vercel.app (Vercel)

_Report is maintained alongside the codebase and reflects the latest committed/uncommitted changes._

---

## 1. Executive Summary

TrekAdvisor is a marketplace for Indian trekking that combines **editorial trek content** with a **live guide-booking engine**. It serves three distinct user types — trekkers, trek guides, and platform admins — on a single responsive web app. The full trekker → guide booking lifecycle is implemented end-to-end: request → guide approval → online payment → confirmation → completion → rating, with notifications, SMS, admin oversight, an audit trail, and a database-level anti-double-booking guarantee.

---

## 2. What It Does — User Roles

| Role | What they can do |
|------|------------------|
| **Trekker** | Browse 110 treks, use an AI assistant, search & filter, save treks, book a guide, pay online, track booking status, rate guides, get notified |
| **Guide** | Register with document verification, set availability calendar, set per-trek rates, accept/reject/completion bookings, manage payouts info, read reviews |
| **Admin** | Verify guides, view live stats & revenue, audit every booking change, review error logs, review all guide ratings, read bookings, complete/cancel bookings |

---

## 3. Public & Trekker Experience

### 3.1 Trek Content Library (110 treks, statically generated)
- Rich dataset per trek: difficulty (easy / moderate / hard / expert), duration, distance, elevation, best season, permits & fees, base camp, district, region, day-by-day itinerary, cover visuals.
- Curated **Kailash Yatra** and **Panch Kedar** trek collections.
- Dedicated editorial guides: **Solo Trekking** and **Group Trekking** pages.

### 3.2 Trek Browser & Search
- Full-text search across name/state/region/district/base camp.
- Filters: difficulty, state, minimum & maximum trip days; section filters for Kailash / Panch Kedar.
- URL-driven filters (shareable, back/forward compatible), auto-branded duplicate-name slugs.

### 3.3 Trek Detail Page — 7 Tabs
Overview · Itinerary · **Permits** · **Route Map** (custom-built elevation profile + altitude bar chart with hover tooltips, rendered from trek map data) · **Local Guides** (live bookable guides for the trek) · Photos · **Gear Rental**.

- **Responsive route map** — the elevation profile uses SVG `viewBox` scaling so it fits on narrow phone screens; panels enforce `min-w-0`/`max-w-full`, the tab wrapper clips horizontally, and the chart heights are tuned so wide profiles stay readable. No horizontal page scroll on mobile.
- **Already-requested UX** — on the Local Guides tab, if a trekker already has an active request for a trek + date, each guide card shows a clear status badge (**Request Pending** / **Guide Accepted — Verify** / **Confirmed**) instead of letting them re-book.

### 3.4 Gear Rental Directory
- 10 pre-seeded gear shops near trailheads, filterable by region and gear type (tents, sleeping bags, crampons, poles, etc.).
- *(Navbar entry replaced by "My Bookings"; the directory remains reachable elsewhere / as a placeholder.)*

### 3.5 Trail Guide AI — "Trex"
- Gemini-powered assistant in the header. Knows the whole platform and all treks; recommends treks/pages, answers itinerary/permits/gear questions, promotes booking guides. Chat history stored client-side, abusive/oversized input guarded.

### 3.6 Saved Treks, Reviews, Profile
- Save treks to a personal "Saved" list; review and rate guides after a completed trek; personal profile page.

---

## 4. Accounts & Authentication

- Single sign-in/up modal; register as **trekker** or **guide**.
- **OTP email verification** (Supabase-generated 6-digit codes via Brevo) with resend option before the account becomes active.
- **Forgot password** with OTP + password reset flow.
- **Phone validation** & formatting (E.164 `+91…`) required for guides.
- Guide signup collects experience, certifications, known treks, and uploads **ID proof + certificate documents** (stored securely on Cloudinary).
- Role-aware route gating both client-side and in every API.

---

## 5. The Complete Booking Flow

The booking lifecycle is managed by a strict state machine:

```
requested → guide accepted → paid & confirmed → completed
   (pending)   (guide_approved)     (confirmed)       (completed)
                     ↘  cancelled  ↙   (only before confirmation)
```

**Key rule:** a booking is **locked and non-cancellable once confirmed**. Confirmation requires the guide to have accepted *and* the trekker to have paid online.

### Step-by-step
1. **Request** — Trekker picks a trek + date + guide. Price is computed **server-side** (per-trek guide base rate × number of trekkers × trek days) — clients can never set the price. Guide + admins are notified; the guide gets an SMS.
2. **Guide accepts** — Guide approves from their dashboard. The date-span is soft-held. A booked/confirmed overlap hard-blocks acceptance; a stale (>6h) approved request doesn't hold the date hostage.
3. **Payment** — Trekker reaches a secure Cashfree checkout (cards, UPI, netbanking, etc.) directly from their bookings page.
4. **Confirm** — After successful payment, the trekker's "Final Verification" confirms the booking. This **hard-locks every date in the guide's span** and **auto-cancels** (a) the trekker's other same-day requests and (b) other trekkers' requests to that guide for overlapping dates. All affected users are notified.
5. **Complete** — The guide (or admin) marks the trek completed, which frees the guide's calendar and prompts the trekker to rate the guide.
6. **Cancel** — Possible before confirmation, by trekker/guide/admin; frees the calendar, notifies all parties.

### Anti-double-booking guarantee
A **database exclusion constraint** makes two overlapping *confirmed* bookings for one guide physically impossible. If two trekkers finalise at the exact same moment, Postgres lets only one succeed and the other receives a clean "guide already booked for that date" message — no race condition, no double-booked guide.

### Fairness rules
- One active request per trekker per date (across all guides); after 6h they may request elsewhere.
- A guide is blocked for the full multi-day duration of a booking, not just one day.

---

## 6. Payments (Cashfree)

- Online payments via **Cashfree Payment Gateway — SDK v6 (backend)** and **JS SDK v3 (frontend checkout)**: create order, hosted/embedded checkout, server-side verification, and clean redirect-back handling on the bookings page.
- The frontend `window.Cashfree` is called as a **factory function** (`Cashfree({ mode: "sandbox" | "production" })`) with **lowercase** mode values (mismatched/uppercase mode values were rejected by the SDK), then `.checkout(...)` runs on the returned instance.
- `create-order` returns the environment `mode` and **sanitises the customer's phone** (falls back to a valid placeholder when empty — Cashfree rejects orders with a missing `customer_phone`).
- Enablement string uses `nb` (netbanking abbreviation) so the gateway accepts the payment-method list.
- Payment methods enabled: **cards, UPI, netbanking, wallets**.
- **Sandbox / Production** modes via environment config (currently sandbox; deploys)
- Payment identity is tied to the booking; a booking's `payment_status` flips to `paid` **only** when the gateway confirms `PAID` — the booking cannot be confirmed otherwise.

---

## 7. Guide Experience

- **Dashboard** (Overview / Bookings / Treks / Earnings / Reviews / Availability / Settings, auto-refreshing).
- **Availability calendar** — one-click block/block-range of dates; already-booked and past dates are locked; saved to the server.
- **Rate management** — set a per-trek base rate.
- **Bookings feed** — filter by status; Accept / Reject / Mark Complete inline.
- **Document verification** — visible "Verified" badge once an admin approves.
- **Payouts info** — store UPI or bank-transfer details, validated. *(Note: actual money transfer / disbursal is not yet implemented — this is the one outstanding item.)*
- **Reviews** — aggregate star rating uses a confidence-weighted blend (like IMDb) so new guides start at a fair baseline that converges to genuine ratings as real reviews accumulate.

---

## 8. Admin Experience

- **Live Overview** — total users, guides, trekkers, verified guides, total bookings, completed treks, **revenue** (and paid revenue), latest pending verifications & recent users, polling every 5s.
- **Users** — search/filter all users, drill into profiles including guide documents and tourist history.
- **Guides** — search + inline **Verify / Revoke**, expandable details with ID & certificate documents.
- **Verifications** — queue of unverified guides with Approve / Reject (badge shows count).
- **Bookings** — read-only tick/filter board (All / Guide Accepted / Confirmed / Completed / Cancelled) with trekker & guide contact info, amounts, cancellation reasons, and a per-booking **status timeline**. Fully read-only for admins — **no admin-side actions on bookings**.
- **Reviews** — dedicated tab listing **every guide rating** across the platform (all `guide_ratings`) with live guide stats, search by text, and review cards; powered by a dedicated admin-secured API.
- **Audit Log** — chronological record of every booking status change, filterable by search, target status, and acting party (admin/guide/trekker).
- **Error Log** — server-side API error monitor with source filters and full stack traces; surfaces a "run migration" banner if the table is absent.
- Admin can also complete or cancel any booking.

---

## 9. Notifications & Communications

- **In-app notification bell** with live updates (Supabase Realtime) and polling fallback.
- Deterministic recipient routing: guides get booking requests; trekkers get acceptance/confirmation/cancellation/completion; **admins are copied on every major event**.
- **Brevo SMS** for time-sensitive events: new booking request to guide, cancellation to both sides, completion/rating prompt to trekker.
- **OTP emails** for account verification and password reset.
- Notification types: booking_request, booking_status_change, review_received, verification_update.

---

## 10. Responsive UI & Header

- **Role-aware header links** — trekkers see Kailash Yatra / Panch Kedar / **My Bookings**; guides see **My Dashboard**; admins see the **Admin Panel + Bookings**. Profile/Saved/Reviews/Bookings are only shown to trekkers.
- **Active-nav highlighting** — a nav item is highlighted correctly on nested pages: browsing `/treks/kedarkantha` keeps "Treks" active, and section links (Kailash/Panch Kedar) highlight independently.
- **Mobile header** — the theme toggle and profile button are hidden on small screens; instead a trailing AI icon (sparkles) sits in the navbar and the **hamburger (three-line) menu** holds the nav links plus a visually distinct **"My Account"** section (Profile / Saved Treks / My Bookings / My Reviews / Guide Dashboard / Admin Panel) and the theme + AI toggles. Icons are grouped with breathing room so they don't crowd the nav edge.
- **AI panel "Clear"** control is laid out in-flow (not absolutely positioned) so it never overlaps the header on narrow phones.
- Booking cards display the **trek name** (looked up from the trek id) instead of the raw numeric trek id.

---

## 11. Platform Engineering & Safety

- **Security:** role-checked API routes, server-side pricing (no client-trust), service-role DB client for privileged writes, RLS as a second layer, upload sanitisation, phone validation, auth checks across all booking/guide endpoints.
- **Reliability:** automation-friendly routing, error boundaries, centralized error logging, DB constraints over app-only checks (double-booking).
- **Auditability:** every booking transition is recorded with who did what, when.
- **SEO:** `robots.txt`, sitemap, per-trek metadata, static generation.
- **Theming:** full dark/light mode.

---

## 12. Technology Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 16, React 19, Tailwind CSS v4, shadcn/ui, Framer Motion, Three.js |
| Backend | Next.js API routes (Node runtime) |
| Database | Supabase Postgres (+ Realtime + Auth) |
| Files/Media | Cloudinary |
| Email & SMS | Brevo |
| Payments | Cashfree Payment Gateway (SDK v6) |
| AI | Google Gemini (Trex assistant) |
| Analytics | Vercel Analytics |
| Type-checking | TypeScript (strict build gating via CI) |

---

## 13. Outstanding Items

1. **Guide payouts (disbursal)** — payout details are collected but no actual money transfer is wired yet; guides would receive funds manually/offline for now.
2. Configure **production** Cashfree keys and set `CASHFREE_ENV=production` before going live with real money. (Sandbox keys work for testing on the deployed domain.)
3. **Realtime publication** — the `bookings_confirmed_no_overlap` exclusion constraint and `supabase_realtime` publication membership are applied via SQL; confirm they are present in the Supabase console / SQL editor for the deployed project.

Everything else — bookings, payments, verification, notifications, admin, audit — is implemented and type-checked.

---

*Report generated from the full codebase, including committed and uncommitted changes.*