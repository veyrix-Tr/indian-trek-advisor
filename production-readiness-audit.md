# Production Readiness Audit

Scope: whole project, everything except payment (explicitly excluded). Findings grouped by severity — what's actively broken/blocking vs. what's missing but real.

---

## 🔵 Real next pieces (not speculative)

- **Real payment integration** (explicitly excluded from this audit, but the obvious next major piece — `user-verify` flips the booking to `confirmed` and `payment_status` to `paid` with no real gateway).
- **Guide payout execution** — `guide_payout_details` stores bank/UPI info, but nothing actually pays guides; it's stored for future manual/automated payout processing.