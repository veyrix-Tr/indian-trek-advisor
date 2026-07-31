# Production Readiness Audit

Scope: whole project, everything except payment (explicitly excluded). Findings grouped by severity — what's actively broken/blocking vs. what's missing but not yet needed vs. future-proofing.

---

## ✅ Resolved since this audit was written

- **Guide review/rating system** — built end-to-end: a guide with zero real reviews now shows exactly 4.1 (not the old raw-average-of-nothing behavior), real reviews blend in via a weighted average (same technique IMDB uses) so the displayed score is pulled toward the true average as real reviews accumulate rather than snapping straight to a small sample's raw mean, the Reviews tab's fetch was actually broken (never selected `guide_ratings` at all) and is now fixed, and a live schema-drift bug (`guides.rating`/`total_ratings` documented but not present in production) was found and migrated. Individual reviews shown anywhere (name, text) are always real — only the aggregate number is blended.

---

## 🔴 Blocking — breaks the product or exposes real risk right now

### 1. Every page except `/` requires login
`middleware.ts:5` — `publicRoutes = ["/", "/api"]`. Confirmed live: `curl /treks` and `curl /treks/kedarkantha` both 307-redirect to `/?auth=required` for an unauthenticated visitor.

**Impact:**
- `/treks` and every trek detail page already have SEO `metadata` (title/description, "Browse 110 trekking trails...") written for them — completely wasted, since Googlebot gets redirected instead of the actual page.
- No visitor can browse a single trek before creating an account. For a discovery-driven content site, this kills organic traffic and top-of-funnel conversion before it can start.

**Fix direction:** expand `publicRoutes` to include `/treks`, `/gear`, `/guide/find`, `/guide/solo`, `/guide/group`, and any other browse/marketing pages. Keep auth required only for `/dashboard`, `/guide/dashboard`, `/admin`, `/profile`, and write actions.

### 2. `/api/upload` has no authentication
`app/api/upload/route.ts` — accepts a `userId` string directly from the form body with no session check. Anyone can POST a file and have it land in Cloudinary under any folder/user path they choose. Real abuse vector: storage-cost abuse, spam, or uploading content under someone else's identity.

**Fix direction:** require `supabase.auth.getUser()` and use the authenticated user's own ID, not a client-supplied one.

### 3. The main "Book a Guide" button on every trek page opens a fake "coming soon" dialog
`components/trek-detail/trek-detail.tsx:194-201` — the large primary CTA in the hero of every trek detail page (`<Users /> Book a Guide`) calls `openComingSoon({ message: "Booking a local guide... is coming soon" })`. This is **wrong** — real, working guide booking exists one tab over (the "Local Guides" tab on the same page, rebuilt this session with live guide listings, availability, and a real booking `Dialog`). This button is the single most prominent CTA on every trek page, and it actively lies to the user about a feature that already works, steering them away from it.

**Fix direction:** change the button to switch to the "Local Guides" tab (same pattern already used for other in-page tab switches) instead of opening the fake dialog.

### 4. The AI chatbot tells users guide booking doesn't exist yet
`app/api/ai/route.ts` system prompt — explicitly instructs the AI (Trex) to describe `/guide/find` as "onboarding, coming soon," lists "Guide booking directly on trek pages," "User accounts," and "Guide registration for local guides" under `COMING SOON`, and tells it to proactively say "Guide booking is coming soon — for now you can browse trails and plan your trip." **All of these already exist and work** — user accounts, guide booking, guide registration, and a real `/guide/find` trek-picker were all built this session. Every conversation with the AI is currently suppressing awareness of the platform's core functionality.

**Fix direction:** rewrite the system prompt's feature list to reflect what's actually live, and remove the "coming soon" framing for guide booking / accounts / `/guide/find` entirely.

---

## 🟠 Missing — needed before real users show up, not yet built

### 5. No error monitoring
`@vercel/analytics` is wired up (page views only). There is no Sentry/error-tracking equivalent. If an API route throws in production, the only trace is Vercel's function logs — nobody gets notified. For a site processing real bookings, silent failures are expensive.

### 6. No automated tests, no CI
`find . -iname "*.test.*"` returns nothing. No `.github/workflows`, no `vercel.json` with build checks. `next.config.mjs` sets `typescript: { ignoreBuildErrors: true }` — meaning type errors don't even block a production build today. Combined with zero tests, there's no safety net catching regressions before they ship.

### 7. No password reset flow
Grepped for `resetPasswordForEmail` / `forgot-password` — nothing found. A user who forgets their password has no self-service recovery path.

### 8. No `robots.txt` or `sitemap.xml`
Given trek pages already carry real SEO metadata, there's no sitemap for search engines to discover all 110+ trek pages, and no `robots.txt` to guide crawler behavior. Directly related to finding #1 — fixing the auth-gate without adding a sitemap only gets you half the SEO value.

### 9. No error boundaries
No `error.tsx`, `global-error.tsx`, or `not-found.tsx` found under `app/`. An unhandled render error anywhere currently shows Next.js's default error screen rather than something on-brand, and there's no custom 404.

### 10. Two lockfiles committed
Both `package-lock.json` and `pnpm-lock.yaml` are tracked in git. Depending on which one a deploy environment picks up, dependency versions could silently drift between local dev and production. Pick one package manager and remove the other lockfile.

### 11. `.env.example` is incomplete
Missing `SUPABASE_SERVICE_ROLE_KEY` and `BREVO_API_KEY` — both required by the code (`.env` has them, `.env.example` doesn't). Anyone setting up the project fresh from the example file would hit silent failures with no clue why.

### 12. Images are unoptimized
`next.config.mjs`: `images: { unoptimized: true }`. Fine for a Cloudinary-fronted image pipeline if Cloudinary is doing the optimization, but worth confirming that's actually true everywhere — several components (`img` tags added this session for guide photos, e.g. `guide-settings-tab.tsx`, `guides-tab.tsx`) use plain `<img>` rather than `next/image`, meaning no lazy-loading/responsive-sizing benefit even where Cloudinary isn't in the loop.

### 13. No OTP / email verification — signup is instant and unverified
Grepped the whole codebase for `otp`, `verifyOtp`, `signInWithOtp` — zero matches, this flow doesn't exist. `app/api/auth/signup/route.ts` calls `supabase.auth.admin.createUser({ ..., email_confirm: true })`, which creates the account **already confirmed** in one step. Anyone can sign up with an email address they don't own; nothing ever checks it's real.

### 14. SMS phone numbers aren't format-validated, and sends fail silently
`lib/sms/brevo.ts` — no phone number normalization anywhere in the app (signup, settings, profile all accept free-text). Brevo's SMS API generally expects E.164 format (`+91XXXXXXXXXX`); a number typed without the country code (the natural way most Indian users would type it) will likely be rejected. On top of that, every call site (`approve-guide`, `cancel`, `complete`, `confirm-payment`, `create`) fires the SMS and never checks the return value — if Brevo rejects it, the booking action still succeeds and nobody is ever told the notification didn't go out.

### 17. `supabase-schema.sql` doesn't reliably reflect the live database — verify before trusting it
Discovered while building the guide rating system: `guides.rating` and `guides.total_ratings` are both defined in `supabase-schema.sql`, but **did not exist in the live database at all** (`column guides.rating does not exist`). The `ALTER TABLE` for these two columns was apparently never actually run, despite being in the checked-in schema file. This wasn't caught by typecheck or build — those only validate the app's own code, not whether the code's assumptions about the database match reality. Silent, until a live REST query against the real table was run.

**Implication:** this schema file cannot be treated as ground truth for what's actually in production. Any future work that assumes a column/table exists because it's in `supabase-schema.sql` should verify against the live database first (a REST `select=*` call, or the Supabase Table Editor) rather than trusting the file. There may be other undocumented drifts elsewhere that haven't been hit yet.

**Fix direction:** run a full schema diff between `supabase-schema.sql` + the two migration files against the actual live database, and reconcile any other gaps found. Consider adopting a real migration tool (Supabase CLI migrations, or similar) going forward so the schema file and the live DB can never drift again — right now nothing enforces that they match.

---

## 🟡 Hygiene — small, unrelated to launch-blocking, but real

- **Stray committed file**: `--full-page` (106KB, odd filename, tracked in git) — looks like an accidental shell redirect artifact, not source code.
- **`middleware.ts` deprecation warning**: Next.js 16 wants `proxy.ts` instead — currently just a build-time warning, but will eventually become a hard requirement.

---

## 🟣 Schema exists, UI doesn't — half-built features

### 15. Trekker wishlist ("save a trek") has no UI at all
`trekkers.saved_treks` is a real column, initialized to `[]` at signup, and displayed as a count in the admin panel — but grepped the whole app and **nothing ever writes to it**. There's no save/bookmark button anywhere on a trek page for a trekker to actually use this. The column is fully dead from the user's perspective.

### 16. Trekker `review_count` never increments
Same story — initialized to `0` at signup, read by the admin panel, but `/api/trekker/rate-guide` (which fires when a trekker rates a guide) only updates the guide's rating — it never touches the trekker's own `review_count`. Permanently stuck at 0 for every trekker. **Still open** — separate from the guide-side rating system (below), which is now fully built and live.

---

## ⚪ Honestly-labeled unbuilt features (not bugs — just not built yet)

These already say "coming soon" correctly and consistently, unlike #3/#4 above — listed here just so the full unbuilt-feature picture is in one place:

- **Community photo uploads** (`components/trek-detail/photos-tab.tsx`) — trek photos are static files dropped into `/public/treks/`; there's no upload pipeline.
- **Gear shop listing submissions** (`components/gear/gear-listing-form.tsx`) — the gear directory itself is real (static data), but a shop owner can't actually submit their own listing.

---

## 🔵 Not needed yet, but will be — noting so it's not forgotten

- **Real payment integration** (explicitly excluded from this audit per your request, but it's the obvious next major piece — `confirm-payment` just flips a DB flag today).
- **Trekker-side real-time updates** — the guide dashboard now has a notification bell; trekkers have none. `/dashboard/bookings` requires a manual refresh to see status changes.
- **Guide payout execution** — `guide_payout_details` stores bank/UPI info, but nothing actually pays guides; it's just stored for future manual/automated payout processing.
- **Analytics beyond page views** — no funnel tracking (browse → book → pay → complete), which you'll want once there's real traffic to optimize conversion.
- **Content moderation** for guide reviews/bios (free-text fields, no profanity/abuse filtering).
- **Multi-language support** — none currently, worth considering given the target audience.
- **Admin audit log** — admin actions (verify guide, approve/reject bookings) aren't logged anywhere; if a dispute arises there's no record of who did what when.
