# Payments + Stock Plan (Scenario 41–48)

## 3 Register

| Register | File | Kya rakhta hai |
|---|---|---|
| Orders | `data/db/orders.json` | Customer ka order |
| Payments | `data/db/payments.json` | Paisa aaya / ruka / fail / refund |
| Stock | `data/db/products.json` | Kitna maal baqa hai |

## Stock ke 4 states

| State | Matlab |
|---|---|
| `held` | Stock side par rakha hai (payment ka intezar) |
| `committed` | Paisa aa gaya, stock pakka |
| `released` | Payment fail/cancel/timeout — stock wapas |
| `restocked` | Refund ke baad item wapas aaya |

## Flow

```
Order banao (Pending Payment)
        │
        ▼
Stock hold karo  →  stockState = "held"
        │
        ▼
Payment banao
        │
        ▼
Gateway ka jawab
        │
   ┌────┼──────────┬───────────┬───────────┐
   ▼    ▼          ▼           ▼           ▼
Success Fail    Pending     Cancel     Timeout
   │      │        │           │           │
commit  release  hold hi    release     release
```

## Test Table (stock = 10, order quantity = 2)

| # | Scenario | Action | Stock hona chahiye |
|---|---|---|---|
| 41 | Payment successful | success event | 8 |
| 42 | Payment fails | fail event | 10 |
| 43 | Payment pending | pending event | 8 (expiry tak) |
| 44 | Payment cancelled | cancel event | 10 |
| 45 | Payment times out | expiry + sweeper | 10 |
| 46 | Refund (bina return) | refund | 8 |
| 46b | Refund + return | refund + restock | 10 |
| 47 | Paid, order fail | order save fail | 8 (na 6, na 10) |
| 48 | Duplicate callback | same event 2 baar | 8 (na 6) |

## Rules

1. Stock sirf `lib/stock.js` se badle.
2. Success par stock dobara kam nahi — sirf `commitStock`.
3. Har payment message ka id check karo (duplicate rokne ke liye).
4. Order pehle banao, payment baad mein.
5. Refund khud stock wapas nahi karta — return hua ho tabhi `restockOrder`.
6. `withDbLock` ke andar read → change → write.
