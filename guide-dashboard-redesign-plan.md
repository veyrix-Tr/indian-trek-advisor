# Guide Dashboard Redesign Plan

**Scope:** Complete redesign of the guide-facing dashboard (`/guide/dashboard`), the new guide-selection flow on trek pages, and the underlying booking data model that supports both. Planning only — no code changes made as part of this document.

**Audience:** Engineer implementing this directly from the spec below.

**Constraint (2026-07-31, founder directive):** The existing `/guide/dashboard` page layout/tab structure and design, and the trekker-facing guide-selection/booking flow (`components/trek-detail/guides-tab.tsx`) are **final and must not be restructured or visually redesigned** — real effort went into both. Scope is narrowed to: fixing concrete bugs (missing status color/label, broken hardcoded colors in the calendar), and additive backend/data-model work that doesn't change existing page layout or visual design. Sections below that proposed new tabs, page restructuring, or rebuilding the consumer booking flow are struck through and marked **out of scope**.

---

## 1. Current State Assessment

### Overall verdict

The existing implementation is **not visually broken** — it already uses a consistent dark "expedition" design system (oklch tokens, `Space Grotesk` + `JetBrains Mono`, glassy `bg-card/60 backdrop-blur-xl` cards, Framer Motion micro-interactions) across most components. The founder's "unprofessional" reaction is coming from three real sources, not from a from-scratch redesign need:

1. One component (`guide-availability-calendar.tsx`) completely breaks the dark design system with hardcoded light-mode Tailwind colors, making it look like a bolted-on prototype next to the rest of the dashboard.
2. The booking lifecycle has 6 states in the database but the guide-facing UI only understands 5 of them, so a real booking (`admin_approved`) renders with **no color, no label, no action** — it looks unfinished because it partially is.
3. There is no dedicated "Requests" surface, no notification/badge system, no profile-completeness or verification-status indicator anywhere in the guide's own dashboard, and stat cards/tabs give roughly equal visual weight to "3 pending requests that need action today" and "your rating," which is the actual UX complaint dressed up as a visual one.

### (a) Visual / design issues

- **`components/guide-availability-calendar.tsx:145-147, 191-199`** — uses `bg-green-100 text-green-800`, `bg-red-100 text-red-800`, and `bg-muted/50` swatches. These are Tailwind's default *light-mode* palette values, not the app's oklch tokens (`--primary`, `--destructive`, etc.) defined in `app/globals.css:55-93`. On the app's forced-dark background (`--background: oklch(0.17 ...)`), a `bg-green-100` cell renders as a pale mint square that clashes hard with every other panel on the page. This is the single most visible "looks unprofessional" bug in the current build — it's the only component in the entire guide dashboard that doesn't use the design system.
- **`components/guide-availability-calendar.tsx`** as a whole uses plain `<Card>`/`<Button>` with no motion, no gradient border, no `font-mono` uppercase micro-labels — visually it reads as an unstyled MVP component dropped into an otherwise-polished shell (compare to `guide-stats-cards.tsx`, which has hover-lift, staggered entrance animation, and colored icon chips).
- **Status colors are inconsistent and incomplete.** `guide-bookings-tab.tsx:25-31` and `guide-overview-tab.tsx:20-26` duplicate the same `STATUS_COLORS`/`STATUS_LABELS` maps (copy-pasted, not shared) and both are missing an entry for `admin_approved` — a real, reachable status per the schema (`supabase-schema.sql:56`). A booking in that state falls through to `STATUS_COLORS[booking.status] || ""`, rendering an unstyled `<Badge>` with the raw string `"admin_approved"` and no border/background color.
- **No verification/trust signal anywhere in the guide's own dashboard.** `guides.verified` exists in the schema (`supabase-schema.sql:41`) and is used by `app/api/admin/verify-guide/route.ts`, but nothing in `guide-overview-tab.tsx`, `guide-settings-tab.tsx`, or the dashboard header surfaces it to the guide. A guide has no way to see "you are not yet verified, here's why bookings aren't coming in."
- **No avatar/photo anywhere.** `guides.profile_photo_url` exists in the schema (`supabase-schema.sql:40`) but is never read by `app/api/guide/profile/route.ts`'s `select("*")` result being consumed, nor rendered in the dashboard header, settings tab, or trekker-facing `guides-tab.tsx`. Every "guide" avatar in the UI is a generated letter-in-circle (`guide-treks-tab.tsx:138`, `guide-reviews-tab.tsx:139`) — fine as a fallback, absent as a primary treatment.
- **Currency/number formatting is inconsistent**: earnings tab uses `toLocaleString("en-IN")` (`guide-earnings-tab.tsx:74`) correctly, but `guides-tab.tsx:142` (trekker-facing) renders `₹{guide.guide_trek_associations.base_rate}` with no formatting at all — a rate of 5000 shows as `₹5000`, not `₹5,000`.
- **Generic native `<select>` and `<input>`** in `guide-settings-tab.tsx:106-116, 124-133` — everywhere else in the app buttons/inputs go through the shadcn primitives in `components/ui/`, but Settings' experience dropdown and free-text tag inputs are raw HTML elements styled inline, which is visually close but not componentized (no `components/ui/select.tsx`-driven combobox despite that file existing in the repo).

### (b) UX / flow issues

- **No dedicated "requests needing action" view.** The founder likely means this when they say "unprofessional" — the entire booking lifecycle (`pending → guide_approved → admin_approved → confirmed → completed`, `supabase-schema.sql:56`) is flattened into one filterable list (`guide-bookings-tab.tsx:41-48`) where a guide has to actively click the "Pending" filter pill to see what needs their action. Compare to Uber/Ola driver apps and Airbnb's Host inbox, where new-request items surface as the *first* thing you see, often full-bleed, with a response-time expectation attached.
- **Only one lifecycle transition is guide-actionable, but the UI only shows two.** `guide-bookings-tab.tsx:208-243` renders Approve/Reject only for `status === "pending"` and Mark Complete only for `status === "confirmed"`. Bookings sitting in `guide_approved` (waiting on admin) or `admin_approved` (waiting on trekker payment) show no explanation to the guide of what they're waiting on or why — a plain badge with no next-step copy. A guide cannot tell "is this stuck, or is this normal."
- **No empty state differentiation.** Every tab's empty state is a single generic sentence (`"No bookings found"`, `"No reviews yet..."`) with no CTA. Per current SaaS/dashboard UX guidance (see Part 2 research), empty states should route the user toward the action that fills them — e.g. Overview's empty "Upcoming Bookings" should link to "complete your profile to appear in guide search" if the guide has 0 bookings ever, not just print a sentence.
- **No loading skeletons anywhere** except a single full-page spinner in `app/guide/dashboard/page.tsx:120-135`. Sub-tab data (bookings, reviews, profile) is fetched in parallel on mount but there's no per-tab skeleton — switching tabs while `loading` is still true is not really possible (whole page blocks), but a slow network still shows one spinner for everything rather than a shell that mirrors the eventual layout.
- **No inline availability-conflict feedback during booking creation.** `guides-tab.tsx:64-93` (trekker-facing) submits a booking and only finds out about a date conflict from a generic `alert(data.error)` — no calendar-level visual indication before submit that a guide is unavailable on the selected date, even though `/api/bookings/trek/[trekId]/guides?date=` already supports filtering by date (`app/api/bookings/trek/[trekId]/guides/route.ts:29-38`).
- **Two parallel, inconsistent "find a guide" entry points.** `components/trek-detail/guides-tab.tsx` is a fully wired, real guide-browsing + booking flow scoped to one trek. `components/overlays/guide-overlays.tsx`'s `FindGuide` component (route `/guide/find`) is a **separate, unrelated placeholder** that says "Guides Are Being Onboarded" / "Notify Me When Live" (`guide-overlays.tsx:873-915`) with fake search inputs that do nothing. A user who lands on `/guide/find` from the homepage overlay sees a "coming soon" wall for a feature that already works from the trek detail page. This is a real product inconsistency, not just visual polish, and should be resolved in this redesign's IA (see Section 3).
- **`window.alert()` used for both success and error feedback** in multiple places (`guide-settings-tab.tsx:57, 60`, `guide-availability-calendar.tsx:113, 116`, `guides-tab.tsx:87, 91`) — breaks the otherwise-polished motion/toast-free-but-inline-feedback pattern used elsewhere (e.g. `guide-bookings-tab.tsx`'s inline red error banner, `guide-settings-tab.tsx`'s inline "Saved!" text). Native browser alerts look explicitly unpolished and block the UI thread.
- **Availability calendar has no connection to bookings visually.** A date that's `booked` (has an active booking against it, per `guide_availability.status = 'booked'`, `supabase-schema.sql:69`) is never fetched or rendered distinctly by `guide-availability-calendar.tsx` — it only fetches and renders `available`/`unavailable`, so a guide can attempt to mark a genuinely booked date as available/unavailable with no warning, and can't see which of their bookings map to which calendar day.
- **Right-click-to-mark-unavailable (`guide-availability-calendar.tsx:137-139`) is undiscoverable**, especially since the dashboard is used on mobile guide devices where right-click / long-press context menus don't map the same way, and there's no visible affordance (button, hint icon) surfacing this interaction — only a `title` tooltip attribute, which doesn't render on touch devices at all.

### (c) Missing functionality vs. a real guide dashboard

- **No notifications / activity feed.** No badge count anywhere indicating "N new booking requests" outside of the count-in-a-pill on the Bookings tab's own filter row (`guide-bookings-tab.tsx:129-133`), which is invisible unless the guide is already on that tab. The top-level `TABS` array (`app/guide/dashboard/page.tsx:48-56`) has no badge/dot support at all.
- **No per-trek rate management UI.** `guide_trek_associations.base_rate` (`supabase-schema.sql:87-94`) is set once at guide-trek association time with no API route or UI exposed to the guide to view/edit their own rates per trek — `guide-settings-tab.tsx` only edits `experience/phone/base_location/certifications/known_treks`, none of which are `guide_trek_associations` rows.
- **No document/photo upload in the dashboard**, despite the schema having `id_proof_url`, `cert_doc_url`, `profile_photo_url` (`supabase-schema.sql:38-40`) — these are presumably populated once at signup and never revisited from the guide dashboard.
- **No payout/bank details section.** Bookings track `payment_status`/`payment_amount` but there's no concept anywhere of how the guide actually gets paid out (bank account, UPI ID, etc.) — earnings are tracked but the "how do I receive this money" question is entirely unanswered by the current data model or UI.
- **No response-time / acceptance-rate metric**, despite this being a marketplace-standard trust & quality signal (see Uber/Ola research in Part 2) that both builds guide accountability and could be shown to trekkers choosing between guides.
- **No calendar "block a date range" bulk action** — availability can only be toggled one day at a time by clicking individual cells (`guide-availability-calendar.tsx:57-72`); no "mark next 5 days unavailable" or recurring weekly pattern, which matters for a guide going on their own multi-day trek.
- **`GET /api/guide/earnings` referenced in `plan.md:112-114` was never implemented** — the earnings tab (`guide-earnings-tab.tsx`) instead recomputes everything client-side from the already-fetched `bookings` array. Functionally fine for now (no separate endpoint needed at current scale) but it means there's no server-side date-range filtering, export, or payout-cycle breakdown — all earnings math happens in the browser from a flat, unpaginated booking list.
- **No admin-approval visibility loop back to the guide dashboard.** The 5-step lifecycle (`pending → guide_approved → admin_approved → confirmed → completed`) requires action from three different actors (guide, admin, trekker) at different steps, but the guide dashboard gives no indication of *where in the admin/trekker part of the process* a booking currently sits, beyond a generic badge (see 1b above).

### (d) Data model gaps

The backend is **real and wired**, not mocked — confirmed by reading every route under `app/api/guide/`, `app/api/bookings/`, `app/api/admin/verify-guide`, and `app/api/trekker/rate-guide`, all of which hit actual Supabase tables via `supabase-schema.sql` / `supabase-migration-new-tables.sql`. This is good news: this redesign is a UI/UX problem layered on a working data model, not a rebuild.

Confirmed existing tables: `profiles`, `trekkers`, `guides`, `bookings`, `guide_availability`, `guide_ratings`, `guide_trek_associations`.

Gaps found relative to what a production guide dashboard needs:

- No `notifications` table — all "new request" signaling today is SMS-only (via Brevo, `lib/sms/brevo`), with no in-app persisted notification record, so the dashboard itself has no data source for a notification bell/badge.
- No `payout_details` (bank/UPI) table or columns on `guides`.
- No `guide_availability` linkage surfaced to bookings in the UI layer (the data exists — `booking_id` FK on `guide_availability`, `supabase-schema.sql:70` — but no route joins them for calendar display).
- No `response_time`/`acceptance_rate` tracked at all — would require either a computed view or new columns (e.g. `bookings.guide_responded_at`).
- `guide_trek_associations.base_rate` has no guide-facing CRUD API (`GET/POST/PUT /api/guide/rates` or similar) — only implicitly set (presumably by admin or at guide onboarding).
- `guides.available_dates date[]` column exists (`supabase-schema.sql:44`) but is fully redundant with the `guide_availability` table and is not read/written anywhere in the reviewed code — dead column, should be dropped in this redesign's migration rather than carried forward.

---

## 2. Design Principles

These are grounded in the current codebase's own conventions (Section 1) and the research in Part 2. Given the scope constraint above, principles 1, 3, 4, and 5 describe the *reasoning behind ideas that are now deferred* (Section 8) rather than active work — kept here for context, not as things being built now.

1. ~~The dashboard's job on open is "what needs me right now."~~ **Deferred** — would require an Overview-tab layout change (Section 8).
2. **Every reachable booking status must have a defined color, label, and guide-facing explanation.** No status may fall through to an unstyled badge. This is the one principle actively being implemented: it fixes the `admin_approved` gap (Section 1a) via one shared module (`lib/booking-status.ts`) consumed by the existing components, without changing their layout.
3. ~~Trust/verification signals visible above the fold.~~ **Deferred** — touches both the dashboard header and the consumer guide card (Section 8).
4. ~~Explanatory copy for every non-terminal status.~~ **Partially kept** — `lib/booking-status.ts` includes a `description` field so it's available to use, but wiring it into card layouts is deferred since it changes card content/height (Section 8).
5. ~~Design for the phone first.~~ **Not actioned** — no layout changes are in scope this round.
6. **Reuse the existing design system exactly — don't introduce a second visual language.** The oklch tokens, `font-mono uppercase tracking-widest` micro-label convention, `bg-card/60 backdrop-blur-xl` card treatment, and Framer Motion stagger/entrance patterns already used in `guide-stats-cards.tsx`, `guide-overview-tab.tsx`, etc. are good and should be the baseline every new/rebuilt component matches — most visibly, this means **rewriting `guide-availability-calendar.tsx` to use the same tokens**, not redesigning tokens that already work.

---

## 3. Information Architecture

**OUT OF SCOPE per founder directive.** The existing 7-tab structure of `/guide/dashboard` (Overview, Bookings, Treks, Availability, Earnings, Reviews, Settings) stays exactly as-is — no new tabs, no renaming, no reordering, no merging. The two open product questions below are noted for awareness only, not as work to do now:

- **`admin_approved` status gap** is fixed within the *existing* tabs (Section 4.1/5.3 below) — a guide still sees these bookings in the existing Bookings tab, just with a correct badge color/label instead of an unstyled one. No new "Requests" tab.
- **Two "find a guide" entry points exist** (`components/trek-detail/guides-tab.tsx`, real; `/guide/find`'s `FindGuide` placeholder, fake "coming soon"). This is a real product inconsistency worth the founder's awareness, but resolving it means touching the consumer booking page, which is explicitly out of scope right now. Flagged here for a future decision, not actioned in this plan.

---

## 4. Design System Additions

Baseline (from `app/globals.css:55-93`) — do not change these, extend them:

| Token | Value | Current usage |
|---|---|---|
| `--background` | `oklch(0.17 0.008 165)` | page bg |
| `--card` | `oklch(0.21 0.01 165)` | card bg |
| `--primary` | `oklch(0.78 0.095 165)` | brand mint-green |
| `--muted-foreground` | `oklch(0.68 0.012 150)` | secondary text |
| `--destructive` | `oklch(0.62 0.19 25)` | errors/reject |
| `--border` | `oklch(1 0 0 / 10%)` | hairlines |
| `--difficulty-easy/moderate/hard/expert` | greens→red ramp | trek difficulty only, currently |

### New additions needed

**1. A shared booking-status token set** (fixes Section 1a's biggest gap). Add to `app/globals.css` `:root`, following the existing oklch pattern and hue logic (green=good, amber=waiting-on-you, blue=waiting-on-others, red=stopped):

```css
--status-pending: oklch(0.78 0.14 80);       /* amber — action needed from guide */
--status-guide-approved: oklch(0.72 0.13 240); /* blue — waiting on admin */
--status-admin-approved: oklch(0.7 0.14 290);  /* violet — waiting on trekker payment (NEW, currently missing) */
--status-confirmed: oklch(0.78 0.095 165);    /* = --primary, reuse brand green — locked in, upcoming */
--status-completed: oklch(0.68 0.012 150);    /* = --muted-foreground tone — done, neutral */
--status-cancelled: oklch(0.62 0.19 25);      /* = --destructive, reuse */
```
Wire these into `@theme inline` as `--color-status-*` exactly like `--color-difficulty-*` is done today (`globals.css:41-44`), then build one `lib/booking-status.ts` exporting `STATUS_CONFIG: Record<BookingStatus, {label, colorClass, description, guideAction}>` consumed by every component that currently hand-rolls `STATUS_COLORS`/`STATUS_LABELS` (`guide-bookings-tab.tsx`, `guide-overview-tab.tsx`, and the new Requests tab). This both fixes the missing `admin_approved` entry and eliminates the copy-paste duplication.

**2. Verification/trust badge component.** New `<VerifiedBadge>` using `--primary` for verified (checkmark, filled) and `--muted-foreground` outline-only for unverified/pending — small (`size-3.5` icon + `text-[10px] font-mono uppercase`, matching the app's existing micro-label scale used throughout, e.g. `guide-overview-tab.tsx:75`).

**3. Notification/badge dot.** Small `size-2` filled circle in `--status-pending` (amber) for the Requests tab count, following the existing `<Badge>` pill pattern already used for filter counts (`guide-bookings-tab.tsx:129-133`) but promoted to sit directly on the tab trigger.

**4. Skeleton loading primitive.** No skeleton component exists in `components/ui/` today (only `card, badge, button, dialog, input, label, select, sheet, slider, tabs, textarea, back-button`). Add `components/ui/skeleton.tsx` (standard shadcn skeleton: `<div className="animate-pulse rounded-xl bg-muted/50" />`), sized per-context to mirror the real layout (stat-card skeletons, list-row skeletons) per Principle 5/Part 2 research.

**5. Fix the availability calendar palette.** Replace `bg-green-100/text-green-800` → `bg-[oklch(var(--status-confirmed)/0.15)] text-[oklch(var(--status-confirmed))]` (or simpler: reuse the same `bg-primary/15 text-primary border-primary/25` triplet pattern already used everywhere else, e.g. `guide-bookings-tab.tsx:29`). Replace `bg-red-100/text-red-800` → `bg-destructive/15 text-destructive border-destructive/25`. Replace `bg-muted/50` (already token-correct, keep it) for "not set."

**6. Typography** — no changes needed; `Space Grotesk` (headings/body) + `JetBrains Mono` (labels/numbers/badges) is well-established and should be followed exactly, including the `text-[10px] uppercase tracking-widest` micro-label convention for every new label added.

**7. Spacing/radius** — no changes; `--radius: 0.75rem` and its derived scale (`--radius-xl`, etc., `globals.css:45-51`) already give `rounded-xl`/`rounded-2xl` the correct visual weight used throughout — new components should default to `rounded-xl` for cards/rows and `rounded-full` for pills/badges, matching existing usage.

---

## 5. Screen-by-Screen Spec

### 5.1 Overview tab

**Layout (top to bottom):**
1. Header (unchanged structurally): welcome message + guide name + refresh button (`app/guide/dashboard/page.tsx:141-165`).
2. **NEW: Profile completeness / verification banner** — only shown if `!guide.verified` OR profile completeness < 100%. A single dismissible-per-session card: left side icon (verified = checkmark in primary, unverified = alert triangle in amber), right side "Complete your profile to start receiving bookings" / "Verification pending — usually reviewed within 48 hours" with a CTA button to Profile tab. Hidden entirely once verified + complete, so it never nags a fully-onboarded guide.
3. **NEW: Action Required panel** — full-width card, shown only if `pending.length > 0`. Lists up to 3 pending requests inline (trekker name, trek, date, Approve/Reject buttons right there — same actions as the Requests tab, so a guide never has to leave Overview to clear urgent items) with a "View all N requests" link if more than 3. This replaces relying on the user finding the Bookings-tab filter pill.
4. Stat cards row (`guide-stats-cards.tsx`) — keep as-is structurally, but reorder cards so `Pending` is first (already is) and add response-rate/acceptance-rate as a 7th card once that data exists (Section 6).
5. Two-column "Upcoming Bookings" / "Recent Completions" (existing `guide-overview-tab.tsx:108-206`) — keep, but exclude `pending` bookings from "Upcoming" now that they're covered by the Action Required panel above, so the same booking doesn't appear twice on one screen.

**States:**
- Loading: skeleton for banner + 6 stat-card skeletons + 2 list skeletons (5 rows each), not a single full-page spinner.
- Empty (zero bookings ever): Upcoming Bookings panel shows an onboarding-style empty state — icon, "No bookings yet," and a CTA "Make sure your profile is complete — trekkers can only find verified, complete profiles" linking to Profile.
- Error: inline red banner at top of content area (reuse the pattern already in `guide-bookings-tab.tsx:105-114`), not a toast, not a blank page.

### 5.2 Bookings tab — status fix only (no restructure)

Tab stays exactly where it is, same filter pills, same layout. The only change: both `guide-bookings-tab.tsx` and `guide-overview-tab.tsx` import `STATUS_CONFIG` from the new `lib/booking-status.ts` (Section 4.1) instead of their local, incomplete `STATUS_COLORS`/`STATUS_LABELS` maps. This adds the missing `admin_approved` entry so it renders with a real color/label instead of an unstyled badge. No new tab, no merged "By Trek" view, no dropped filter — purely swapping the data source behind the existing badge.

### 5.3 Availability Calendar — palette fix only (no layout rebuild)

**OUT OF SCOPE beyond the color fix.** The grid structure, right-click interaction, card styling, and layout of `guide-availability-calendar.tsx` stay as-is per the founder directive. The one change that ships: replace the hardcoded light-mode Tailwind classes that visually clash with the dark theme —
- `bg-green-100 text-green-800` → `bg-primary/15 text-primary border-primary/25` (matches the token pattern already used everywhere else, e.g. `guide-bookings-tab.tsx:29`)
- `bg-red-100 text-red-800` → `bg-destructive/15 text-destructive border-destructive/25`
- `bg-muted/50` stays as-is (already correct)

This is a find-and-replace of Tailwind classes on existing markup, not a rebuild — no new states, no bulk-block picker, no booked-date icon, no skeleton loader. Those ideas are noted below (Section 8, deferred) in case they're wanted later, but are not part of this plan's scope.

### 5.4 Earnings, Reviews, Settings tabs

No changes. These already use the design system correctly (Section 1a confirms this) and are not part of the founder's complaint. Any additions previously proposed here (payout card, rates-per-trek, verification header, date-range filter) are deferred — see Section 8.

### 5.5 Trekker-facing Guide Selection page & Booking flow

**OUT OF SCOPE — do not modify.** `components/trek-detail/guides-tab.tsx` and its booking modal keep their current design and structure entirely. No rebuild, no `Dialog` swap, no verified badge, no currency-formatting fix, no availability-grayout treatment. These were real, reasonable UX findings from Section 1, but the founder has asked that this page not be touched right now — noted in Section 8 for a later, separate decision.

---

## 6. Data Model Changes Needed

**Narrowed to zero required schema changes.** Both active fixes (Section 4.1 status tokens, Section 5.3 calendar palette) are frontend-only — they consume data that already exists (`bookings.status` including `admin_approved`, `guide_availability.status`). No migration is needed to ship this plan's actual scope.

The new tables/columns/routes proposed in the original research pass (`guide_payout_details`, `notifications`, `guide_responded_at`, rates CRUD routes) are all real gaps worth knowing about, but they only matter for the deferred UI ideas below — moved to Section 8 rather than scheduled here.

One standalone, low-risk cleanup that doesn't touch any page's design or layout, if you want it done opportunistically: `guides.available_dates date[]` (`supabase-schema.sql:44`) is dead — fully superseded by the `guide_availability` table and not read/written anywhere in the codebase. Safe to drop whenever, independent of everything else in this plan.

---

## 7. Implementation Phases

With the scope narrowed to bug fixes only, this is one phase, not seven:

### Phase 1 — Status color/label fix (the only active work)
1. Add `--status-*` tokens to `app/globals.css` `:root` + `@theme inline` (Section 4.1), including the missing `--status-admin-approved`.
2. Build `lib/booking-status.ts` exporting `STATUS_CONFIG: Record<BookingStatus, {label, colorClass, description}>`.
3. Update `guide-bookings-tab.tsx` and `guide-overview-tab.tsx` to import from `lib/booking-status.ts` instead of their local, duplicated `STATUS_COLORS`/`STATUS_LABELS` maps — same badge markup and position, just a correct color/label source. No layout change.
4. In `guide-availability-calendar.tsx`, swap `bg-green-100 text-green-800` → `bg-primary/15 text-primary border-primary/25` and `bg-red-100 text-red-800` → `bg-destructive/15 text-destructive border-destructive/25`. Same grid, same interactions, just correct colors on the existing dark theme.

**Effort:** small, 1-2 days. This resolves both concrete bugs found in Section 1 (the colorless `admin_approved` badge, and the light-mode-color clash in the calendar) without touching the layout, structure, or visual design of the dashboard page or the consumer booking page.

---

## 8. Deferred (not in scope now — reference only)

Everything below was part of the original research pass and is a legitimate finding, but is explicitly **not being built** per the founder's directive to leave the dashboard page and consumer booking page as they are. Keeping this list so it isn't lost — revisit if/when there's appetite to revisit those pages' design:

- Overview tab "Action Required" panel + verification/profile-completeness banner
- Dedicated "Requests" tab split out from Bookings
- Notification badge/bell system (`notifications` table + routes)
- Settings → Profile rename, verification header, Reviews folded in as sub-section
- Rates-per-trek CRUD (`guide_trek_associations.base_rate` editing UI + `GET/PUT /api/guide/rates`)
- Payout details section (`guide_payout_details` table + `GET/PUT /api/guide/payout`)
- Availability calendar: booked-date 4th state, bulk date-range blocking, skeleton loading, replacing `alert()` with inline feedback
- Earnings tab: payout-status card, date-range filter
- Response-time/acceptance-rate tracking (`bookings.guide_responded_at`)
- Trekker-facing Guide Selection page rebuild (verified badges, currency formatting, unavailable-grayout, restyled date picker)
- Booking Request flow rebuild as a `Dialog` with inline conflict-checking and a real success state
- Resolving the `/guide/find` placeholder vs. `guides-tab.tsx` duplication
- `components/ui/skeleton.tsx` primitive (only needed by deferred loading-state work)
