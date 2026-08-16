# Production Readiness Audit

Scope: whole project, everything except payment (explicitly excluded). Findings grouped by severity — what's actively broken/blocking vs. what's missing but not yet needed vs. future-proofing.

---

## 🟠 Missing — needed before real users show up, not yet built

### 1. No error monitoring
`@vercel/analytics` is wired up (page views only). There is no Sentry/error-tracking equivalent. If an API route throws in production, the only trace is Vercel's function logs — nobody gets notified. For a site processing real bookings, silent failures are expensive.

### 2. No automated tests, no CI
`find . -iname "*.test.*"` returns nothing. No `.github/workflows`, no `vercel.json` with build checks. `next.config.mjs` sets `typescript: { ignoreBuildErrors: true }` — meaning type errors don't even block a production build today. Combined with zero tests, there's no safety net catching regressions before they ship.

### 3. No password reset flow
Grepped for `resetPasswordForEmail` / `forgot-password` — nothing found. A user who forgets their password has no self-service recovery path.

### 4. Images are unoptimized
`next.config.mjs`: `images: { unoptimized: true }`. Fine for a Cloudinary-fronted image pipeline if Cloudinary is doing the optimization, but worth confirming that's actually true everywhere — several components (`img` tags added this session for guide photos, e.g. `guide-settings-tab.tsx`, `guides-tab.tsx`) use plain `<img>` rather than `next/image`, meaning no lazy-loading/responsive-sizing benefit even where Cloudinary isn't in the loop.

### 5. No OTP / email verification — signup is instant and unverified
Grepped the whole codebase for `otp`, `verifyOtp`, `signInWithOtp` — zero matches, this flow doesn't exist. `app/api/auth/signup/route.ts` calls `supabase.auth.admin.createUser({ ..., email_confirm: true })`, which creates the account **already confirmed** in one step. Anyone can sign up with an email address they don't own; nothing ever checks it's real.

### 6. `supabase-schema.sql` doesn't reliably reflect the live database — verify before trusting it
Discovered while building the guide rating system: `guides.rating` and `guides.total_ratings` are both defined in `supabase-schema.sql`, but **did not exist in the live database at all** (`column guides.rating does not exist`). The `ALTER TABLE` for these two columns was apparently never actually run, despite being in the checked-in schema file. This wasn't caught by typecheck or build — those only validate the app's own code, not whether the code's assumptions about the database match reality. Silent, until a live REST query against the real table was run.

**Implication:** this schema file cannot be treated as ground truth for what's actually in production. Any future work that assumes a column/table exists because it's in `supabase-schema.sql` should verify against the live database first (a REST `select=*` call, or the Supabase Table Editor) rather than trusting the file. There may be other undocumented drifts elsewhere that haven't been hit yet.

**Fix direction:** run a full schema diff between `supabase-schema.sql` + the two migration files against the actual live database, and reconcile any other gaps found. Consider adopting a real migration tool (Supabase CLI migrations, or similar) going forward so the schema file and the live DB can never drift again — right now nothing enforces that they match.

---

## 🟡 Hygiene — small, unrelated to launch-blocking, but real

- **`middleware.ts` deprecation warning**: Next.js 16 wants `proxy.ts` instead — currently just a build-time warning, but will eventually become a hard requirement.

---

## ⚪ Honestly-labeled unbuilt features (not bugs — just not built yet)

These already say "coming soon" correctly and consistently — listed here just so the full unbuilt-feature picture is in one place:

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
