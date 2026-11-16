# Requirements → Phases (Scenario 41–48)

**Scope:** Sirf ye 8 scenarios. Koi extra feature nahi.

**Jawab:** Kul **5 phases**. Phase 5 ke baad saari 8 requirements complete.

---

## Summary

| Phase | Naam | Scenarios | Complete | Andaza |
|---|---|---|---|---|
| 1 | Foundation | — | 0/8 | 1–2 din |
| 2 | Payment Core | 41, 42, 44, 48 | 4/8 | 2–3 din |
| 3 | Pending + Timeout | 43, 45 | 6/8 | 1–2 din |
| 4 | Refund | 46 | 7/8 | 1 din |
| 5 | Reconciliation + Final Test | 47 + sab | 8/8 | 2 din |

> Beginner ke liye total andaza: **7–10 din** (roz 2–3 ghante).

---

## Phase 1 — Foundation (0/8)

**Maqsad:** Payment aur stock ka basic dhancha. Is phase ke baad user ko kuch naya nazar nahi aayega.

### Kaam
1. `docs/payments-plan.md` — naqsha
2. Order mein fields: `paymentStatus`, `stockState`, `paymentId`, `reservationExpiresAt`
3. `data/db/payments.json` — payment register
4. `lib/stock.js` — 4 functions: hold / commit / release / restock

### Test
Stock 10 → hold(2) = 8 → commit = 8 → release = 10.

### Khatam hone ki nishani
New order mein naye fields save hon.

---

## Phase 2 — Payment Core (4/8)

**Maqsad:** Asli payment lifecycle. Yahan 4 scenarios cover honge.

### Scenarios
| # | Scenario | Kya hoga |
|---|---|---|
| 41 | Payment successful | Stock commit, order Processing |
| 42 | Payment fails | Stock release, order Cancelled |
| 44 | Payment cancelled | Stock release, order Cancelled |
| 48 | Duplicate callback | Doosra message ignore |

### Kaam
1. `lib/payments.js` — `createPaymentIntent`, `applyPaymentEvent`
2. Checkout order-first: Order → Hold → Payment
3. Routes: `payments/create`, `payments/webhook`, `payments/[id]`, `payments/mock`
4. Webhook signature check
5. Mock: success / fail / cancel / duplicate

### Test
Har scenario ke baad `products.json` + `orders.json` + `payments.json` check karo.

---

## Phase 3 — Pending + Timeout (6/8)

**Maqsad:** Ruke hue payment ko sambhalna aur timeout par stock wapas karna.

### Scenarios
| # | Scenario | Kya hoga |
|---|---|---|
| 43 | Payment pending | Stock 30 minute tak hold |
| 45 | Payment timeout | Expiry par stock release |

### Kaam
1. `reservationExpiresAt` set karo (30 min)
2. `releaseExpiredPayments()` function
3. Sweeper ko checkout / status route mein chalao
4. Pending screen + status message

### Test
`expiresAt` past karo → stock wapas aaye.

---

## Phase 4 — Refund (7/8)

**Maqsad:** Paisa wapas karna, aur stock ka alag faisla.

### Scenario
| # | Scenario | Kya hoga |
|---|---|---|
| 46 | Customer receives refund | Refund process; stock tabhi restock jab item wapas aaya ho |

### Kaam
1. `app/api/admin/orders/[id]/refund/route.js` (admin guard)
2. Body: `{ restock: true | false }`
3. `restockedAt` se double restock rokna
4. Admin UI mein refund button

### Test
Refund bina return = stock same. Refund + return = stock wapas. Double refund = double restock nahi.

---

## Phase 5 — Reconciliation + Final Test (8/8)

**Maqsad:** Sab se mushkil case (47) aur poora system test.

### Scenario
| # | Scenario | Kya hoga |
|---|---|---|
| 47 | Paid but order creation fails | Payment aur order reconcile; stock na kho, na duplicate |

### Kaam
1. Order pehle save karo, phir payment start
2. Order save fail → payment start hi na ho
3. Orphan payment queue: paisa aaya par order nahi → retry/reconcile
4. "Late success" case: stock release ke baad success aaye to dobara hold, warna `needs_refund`
5. Duplicate + concurrent callback test
6. Admin statuses, colors, logs
7. **Saare 8 scenarios ka final test**

### Test
Scenario 47 ko jaan bujh kar fail karke dekho: stock ek hi baar hile.

---

## Coverage Matrix

| # | Scenario | P1 | P2 | P3 | P4 | P5 |
|---|---|---|---|---|---|---|
| 41 | Successful | — | ✅ | | | ✅ |
| 42 | Fails | — | ✅ | | | ✅ |
| 43 | Pending | — | | ✅ | | ✅ |
| 44 | Cancelled | — | ✅ | | | ✅ |
| 45 | Timeout | — | | ✅ | | ✅ |
| 46 | Refund | — | | | ✅ | ✅ |
| 47 | Paid, order fail | — | | | | ✅ |
| 48 | Duplicate callback | — | ✅ | | | ✅ |

---

## Rules

1. Har phase ke baad **test** karo. Pass na ho to agla phase mat shuru karo.
2. Stock sirf `lib/stock.js` se badle.
3. UI sab se aakhir mein (Phase 5).
4. Har test ke baad 3 files check karo: `products.json`, `orders.json`, `payments.json`.
5. Phase 5 se pehle "complete" ka matlab nahi ke saari requirements poori hain — 47 aur final testing baqi hai.
