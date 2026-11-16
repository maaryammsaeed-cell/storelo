# 📘 Database + Backend Master Guide

> **Ye document kis ke liye hai?** Storelo project ko JSON → MongoDB par shift karte waqt, aur usi kaam ko interview ki tayyari mein badalne ke liye.
>
> **Kaise use karein?**
> 1. Section 1 (formula) yaad karo — har jawab isi shape mein do.
> 2. Section 7 (cheat sheet) roz kholo jab code likho.
> 3. Section 14 (Q&A) se roz 5 sawal bol kar jawab do.
> 4. Section 15 (revision sheet) interview se 1 din pehle parho.

---

## 1. Har jawab ka formula — D-W-E-T

Har technical sawal ka jawab 4 hisson mein do:

| Letter | Kya | Misal (Index) |
|---|---|---|
| **D** — Definition | 1 line | "Index ek data structure hai jo query fast karta hai." |
| **W** — Why | Kyun zaroori | "Bina index har document scan hota hai — slow." |
| **E** — Example | Apne project se | "Orders par `customerId + createdAt` index lagaya." |
| **T** — Trade-off | Nuksan bhi | "Har write par index update hota hai, is liye sirf zaroori indexes." |

**Rule:** Definition ratne se interview nahi hota — **T (trade-off)** soch dikhata hai.

**Nahi aata to:**
> "Maine ise production mein use nahi kiya, magar concept ye hai ke ... — karna hota to main X approach leti."

---

## 2. Database Fundamentals (12 concepts)

| Concept | 1-line answer | Trade-off / Note |
|---|---|---|
| **DBMS** | Data ko organize, secure aur query karne ka system | File system mein concurrency, backup, security nahi |
| **SQL (Relational)** | Fixed schema, tables, rows, JOINs | Strong consistency, transactions — bank/ERP |
| **NoSQL (Document)** | Flexible schema, JSON-like documents | Fast iteration, horizontal scale — catalog/logs |
| **Primary Key** | Row ki unique identity | Duplicate nahi ho sakti, NULL nahi |
| **Foreign Key** | Doosri table ki key ka reference | Relation banata hai, orphan data rokta hai |
| **Candidate / Composite Key** | Unique banne wale options / 2+ columns ka key | |
| **Normalization (1NF–3NF)** | Data ko duplicate na hone dena | Write fast + safe, magar JOINs zyada |
| **Denormalization** | Jaan boojh kar duplicate rakhna | Read fast, magar update 2 jagah |
| **ACID** | Atomicity, Consistency, Isolation, Durability | Transaction ka bharosa |
| **Transaction** | Kai changes = ek unit (sab ya kuch nahi) | Rollback possible |
| **Index** | Lookup fast karne ka structure (B-Tree) | Read tez, write mehnga |
| **Query plan (EXPLAIN)** | DB kaise query chala raha hai | Index use ho raha hai ya nahi |

---

## 3. SQL Essentials (MongoDB use karo to bhi lazmi)

| Topic | Kya yaad karna |
|---|---|
| `SELECT` / `WHERE` / `ORDER BY` / `LIMIT` | Basic filtering |
| **INNER JOIN** | Sirf matching rows dono taraf se |
| **LEFT JOIN** | Left ki saari rows + matching right (na mile to NULL) |
| `GROUP BY` + `HAVING` | Group ke baad filter (`WHERE` group se pehle) |
| Subquery | Andar wali query ka nateeja bahar use karo |
| `DISTINCT`, `UNION` vs `UNION ALL` | Duplicate hatao / jodo |
| `DELETE` vs `TRUNCATE` vs `DROP` | Rows / saari rows + reset / poora table |
| Normalization 1NF→3NF | Atomic values → poora PK par depend → koi transitive dependency nahi |
| Constraints | `NOT NULL`, `UNIQUE`, `CHECK`, `DEFAULT` |

**Practice query:** "Top 5 categories by total sales" = JOIN + GROUP BY + ORDER BY + LIMIT.

---

## 4. MongoDB + Mongoose (20 concepts)

| Concept | Simple matlab |
|---|---|
| **Document** | Ek JSON jaisa record (SQL ki row) |
| **Collection** | Documents ka group (SQL ki table) |
| **`_id` / ObjectId** | 12-byte unique id: timestamp + machine + counter |
| **Mongoose** | JS library (ODM) — schema, validation, queries |
| **Schema** | Structure ka plan (fields, types, rules) |
| **Model** | Schema se bana object — isi se query karte hain |
| **Validation** | `required`, `min`, `max`, `enum`, custom validator |
| **`timestamps: true`** | `createdAt` / `updatedAt` khud bane |
| **Embed** | Document ke andar document (bounded, sath padha jaye) |
| **Reference** | Doosre document ki `_id` (independent, bara data) |
| **`populate()`** | Reference ko expand karke data lao (extra query = N+1 risk) |
| **`.lean()`** | Plain JS object (fast), magar virtuals/transform nahi chalte |
| **Aggregation** | Pipeline: `$match → $group → $sort → $limit → $lookup → $project` |
| **`$set` / `$inc` / `$push`** | Field set / number barhao / array mein add |
| **`updateOne` vs `replaceOne`** | Field update vs poora document replace (`$set` zaroori) |
| **Transaction** | Multiple documents ek sath — **replica set chahiye** |
| **Unique index** | Duplicate value DB level par ruk jaye |
| **Sparse index** | Sirf jahan value maujood ho wahan unique check |
| **Text index** | Full-text search (ek collection par ek) |
| **TTL index** | Document expiry (optional) |

**CRUD methods:** `find`, `findOne`, `findById`, `create`, `insertMany`, `updateOne`, `findOneAndUpdate`, `deleteOne`.

---

## 5. SQL vs NoSQL — kab kya?

| Situation | Choose |
|---|---|
| Bank, accounting, payroll — strict relations | **SQL** |
| Product catalog, logs, CMS, real-time feed | **NoSQL** |
| Reports + JOINs bohot | **SQL** |
| Rapid iteration, flexible fields | **NoSQL** |
| Both chahiye | PostgreSQL (JSONB) — hybrid |

**Project ka jawab:** *"Product data flexible tha (colors[], sizes[], optional fields), relations simple the, is liye MongoDB chuna. Payment/order ke liye transaction use kiya."*

---

## 6. Schema Design — Embed vs Reference

| Data | Kaise | Kyun |
|---|---|---|
| Order ke items | **Embed** | Order ke bina matlab nahi, bounded (5–10) |
| Order ka customer | **Embed (snapshot)** | Invoice ka historical record |
| Cart ke items | **Embed** | Bounded, sath padhe jate hain |
| Customer ka name/address | **Embed** | Bounded, ek hi jagah |
| Settings ke hero/footer | **Embed** | Ek hi document |
| Payment ke events | **Embed** | Audit trail, sath chahiye |
| Order → Customer | **Reference** | Customer ka independent lifecycle |
| Order → Payment | **Reference** | Alag entity, gateway se sync |
| Order ↔ Product | **Reference + snapshot** | Product bohot orders mein |

**Rule of thumb:**
> Ek ke bina doosre ka matlab nahi + bounded → **embed**.
> Independent life + unbounded → **reference**.

### Storelo ka final schema (8 collections)

| Collection | Kaam | Relations |
|---|---|---|
| `admins` | Admin login | standalone |
| `settings` | Store config (singleton) | embedded hero/footer/services |
| `products` | Catalog | 1:N cart items, order items |
| `carts` | Guest cart (cookie id) | embedded items + reservation |
| `customers` | Buyers | 1:N orders |
| `orders` | Invoices | 1:1 payment, N:M products |
| `payments` | Payment records | 1:1 order, embedded events |
| `counters` | Sequence (order number) | standalone |

**Embedded (alag collection nahi):** `order.items`, `order.customer`, `cart.items`, `cart.reservation`, `customer.name`, `customer.address`, `settings.hero/footer/services`, `payment.events`.

### Snapshot kyun? (interview favourite)

```text
1 Jan  → Order #1001, address: "House 12, Lahore"
15 Mar → Customer address badal kar "House 99, Karachi"
```
Agar order mein sirf `customerId` ho → purana invoice bhi naya address dikhayega ❌.
Isliye **`customerId` (link) + `customer` (snapshot)** dono rakhe.

- **Reference** = "kaun hai" (live)
- **Snapshot** = "us waqt kya tha" (immutable)

Same logic: `order.items[].productId` + `title`/`price` copy.

---

## 7. Code Padhne ki Cheat Sheet (Mongoose)

| Code | Simple matlab |
|---|---|
| `new mongoose.Schema({...}, options)` | Table ka plan banao |
| `type: String / Number / Boolean / Date` | Column ka type |
| `type: [String]` | Array of strings |
| `required: true` | Khali nahi chhod sakte |
| `default: 0` / `default: () => ({})` | Value na ho to ye rakho |
| `min` / `max` | Hadd |
| `enum: [...]` | Sirf ye values allowed |
| `trim: true` / `lowercase: true` | Space hatao / chhota karo |
| `Schema.Types.ObjectId` + `ref: "Product"` | Doosre collection ka reference (FK) |
| `{ _id: false }` | Sub-document ko apni id na do |
| `schema.index({ a: 1, b: -1 })` | Compound index (1 asc, -1 desc) |
| `{ unique: true }` | Duplicate na bane |
| `{ sparse: true }` | Sirf value wale par unique |
| `timestamps: true` | `createdAt`/`updatedAt` |
| `mongoose.models.X \|\| mongoose.model("X", s)` | Hot-reload par dobara register na ho |
| `.lean()` | Plain object (fast) |
| `.populate("customerId")` | Reference expand karo |
| `.select("title price")` | Sirf ye fields lao (projection) |

**Padhne ka tareeqa:** `import` → `schema` object (fields) → `index()` lines → `export` guard. Bas.

**`id` vs `_id`:** Mongo `_id` (object) deta hai; UI `id` (string) padhti hai. Isliye `base.js` mein transform:
```js
ret.id = String(ret._id); delete ret._id;
```
Bina iske `product.id = undefined` → cart/URL toot jate hain.

---

## 8. M1 → M5: Kya karna hai + kya seekhna hai

### M1 — Models + Indexes (Day 1)

**Files:** `lib/models/base.js`, `Counter.js`, `Product.js` (update), `Admin.js` (update), `Customer.js`, `Cart.js`, `Payment.js`, `Order.js`

| Kaam | Seekhne wali baat |
|---|---|
| `base.js` shared options | `timestamps`, `versionKey`, `_id → id` |
| Har model schema | validation, types, defaults |
| Embedded sub-schemas | `_id: false`, embed vs reference |
| Enums code se | `product.status`, `order.status`, `paymentMethod`, `stockState` |
| `schema.index(...)` | compound, unique, sparse, text |
| `legacyId` | migration mapping |
| Verification route | models + indexes check |

**Enums (actual values):**
- `products.status`: `active`, `inactive`, `discontinued`, `preorder`, `sale`
- `customers.status`: `Active`, `VIP`, `Inactive`
- `orders.status`: `Pending Payment`, `Processing`, `Shipped`, `Delivered`, `Cancelled`
- `orders.paymentStatus`: `Pending`, `Paid`, `Failed`, `Cancelled`, `Expired`, `Refunded`
- `orders.stockState`: `held`, `committed`, `released`, `restocked`
- `payments.status`: `pending`, `paid`, `needs_refund`, `failed`, `cancelled`, `expired`
- `payment events`: `payment.pending`, `payment.succeeded`, `payment.failed`, `payment.cancelled`, `payment.expired`

**Definition of done:** `/api/dev/models` par saare models + plural collections + indexes dikhein.

---

### M2 — Migration (Day 2)

**File:** `scripts/migrate.js` (⚠️ `app/` ke bahar)

| Step | Detail |
|---|---|
| 1. Order | settings → admins → products → customers → orders → payments → carts |
| 2. Idempotent | `updateOne({ legacyId }, { $setOnInsert }, { upsert: true })` |
| 3. Id map | `data/id-map.json` — old id → new ObjectId |
| 4. Fix references | `items[].productId`, `customerId`, `paymentId` naye ObjectId se replace |
| 5. Report | inserted / skipped / failed counts |
| 6. Dry run | `--dry` flag |

**Verify (ye "verified" ka matlab):**
- [ ] Har collection ka count match
- [ ] 5 random orders manually check
- [ ] `totalAmount === sum(items.lineTotal)`
- [ ] Koi orphan nahi (har `customerId` customers mein maujood)
- [ ] Har `items[].productId` products mein maujood
- [ ] `legacyId` sab par set

**Seekhne wali baat:** idempotency, backup, rollback, data validation.

---

### M3 — Data layer / API (Day 3–4)

**Files:** `lib/repo/*.js` (naya), `app/api/**` (20 routes)

| Kaam | Detail |
|---|---|
| Repository layer | `listProducts()`, `getCart()`, `createOrder()` — `readData` hatana |
| `withDbLock` → atomic ops | Stock: `findOneAndUpdate({ stock: { $gte: qty } }, { $inc: { stock: -qty } })` |
| Checkout = transaction | Order + stock + payment + customer ek sath |
| `checkoutKey` duplicate | `E11000` pakad kar existing order return |
| Counter | `$inc: { seq: 1 }` atomic |
| Cart cookie | `String(cart._id)` |
| Serialization | ObjectId/Date ko string/DTO mein badalna |

**Seekhne wali baat:** CRUD, `$inc`, `$set`, populate, N+1, transactions, race conditions.

> ⚠️ **Transaction ke liye replica set chahiye** — local standalone par nahi chalti. Atlas free tier use karo.

---

### M4 — UI + Admin (Day 5)

| Kaam | Detail |
|---|---|
| `id` mapping | UI ko `id` string mile |
| `.lean()` + DTO | ObjectId client ko na jaye |
| Admin CRUD | products (soft delete/restore), orders, customers, inventory, settings |
| Pagination | `skip/limit` ya cursor |
| Demo data replace | `data/products.js`, `lib/demo-api.js` (optional) |

**Errors jo aayengi:** "Only plain objects can be passed to Client Components", "Objects are not valid as a React child", hydration mismatch.

---

### M5 — Deploy + Cleanup (Day 6)

- [ ] Atlas production cluster (dev se alag)
- [ ] Vercel env: `MONGODB_URI`
- [ ] Atlas network access (Vercel IPs)
- [ ] Migration production par chalana (deploy se pehle)
- [ ] Admin seed (bcrypt hash)
- [ ] Smoke test: login → product → cart → checkout → admin order
- [ ] JSON layer cleanup (`lib/db.js`, `data/db/*.json`) — sirf tab jab koi import na bache
- [ ] `PROJECT-MAP.md` + ERD update

---

## 9. Migration Playbook (M2 ka nichor)

| Cheez | Kyun |
|---|---|
| **`legacyId`** | Purana string id ↔ naya ObjectId map |
| **Idempotent script** | Dobara chale to duplicate na bane |
| **`upsert`** | Insert ya update — ek hi call |
| **Id map file** | References update karne ke liye |
| **Backup** | Rollback ke liye |
| **Dry run** | Pehle count dekho, phir likho |
| **Verify queries** | Counts, totals, orphans |
| **Order of migration** | Dependencies pehle (products → orders) |

---

## 10. Concurrency — race condition ka jawab

**Masla:**
```text
User A: stock 1 dekha → order
User B: stock 1 dekha → order
Dono save → stock -1 ❌ (oversell)
```

**Ghalat:** read → check → write (beech mein doosra aa sakta hai).

**Sahi — atomic:**
```js
Product.findOneAndUpdate(
  { _id, stock: { $gte: qty } },
  { $inc: { stock: -qty } },
  { new: true }
);
// null mila = stock khatam
```

**Aur:** `checkoutKey` unique index, `$inc` counter, transaction (order + payment + stock).

**Interview line:** *"Race condition atomic single-document operation se rokti hain; multi-document ke liye transaction chahiye."*

---

## 11. Security (chhoti list, bade marks)

| Concept | Matlab |
|---|---|
| **Authentication** | Kaun ho (login) |
| **Authorization** | Kya kar sakte ho (role/permission) |
| **Hashing** (bcrypt) | One-way — password wapas nahi nikal sakte |
| **Encryption** | Two-way — key se decrypt ho sakta |
| **JWT** | Signed token — header/cookie mein, verify hota hai |
| **httpOnly cookie** | JS access nahi kar sakta (XSS se behtar) vs localStorage |
| **XSS** | Script inject karna → sanitize output |
| **NoSQL injection** | `{ email: { $ne: null } }` → input type validation/sanitize |
| **CSRF** | Doosri site se request → SameSite cookie + token |
| **CORS** | Kaunsi origin API call kar sakti hai |
| **Secrets** | `.env` mein, repo mein nahi |
| **Least privilege** | DB user ko sirf zaroori permission |

---

## 12. Performance

| Cheez | Kya |
|---|---|
| **Index** | Read tez, write mehnga |
| **Compound index** | Leftmost field se match zaroori |
| **Projection** | `.select()` — sirf zaroori fields |
| **N+1** | Loop mein query → `populate`/aggregation se ek sath |
| **Pagination** | `skip/limit` (chhota data) vs cursor `_id > last` (bara) |
| **`.lean()`** | Read-only mein fast |
| **Connection pool** | `global.mongoose` cache (serverless) |
| **Aggregation** | Server par calculate, app mein nahi |

**Index ka nuksan:** har insert/update par index update, storage, RAM, aur galat index planner confuse karta hai.

---

## 13. Common Errors (jo tumhe aayengi)

| Error | Wajah | Fix |
|---|---|---|
| `OverwriteModelError` | Model dobara register | `mongoose.models.X \|\| mongoose.model(...)` |
| `E11000 duplicate key` | Unique index violation | Duplicate handle karo (idempotency) |
| `Only plain objects can be passed to Client Components` | ObjectId/Date client ko gaya | DTO mapping / string |
| `Objects are not valid as a React child` | `_id` object render | `String(_id)` |
| `undefined` id / broken cart | `_id` → `id` mapping nahi | `base.js` transform |
| `MongooseServerSelectionError` | DB connect nahi / IP allowlist | URI + network access |
| Validation error | Enum/required mismatch | Enum data se match karo |
| `Transaction numbers are only allowed on a replica set` | Standalone MongoDB | Atlas / replica set |
| Hydration mismatch | Date/format server-client alag | Server par format |

---

## 14. Interview Q&A Bank (40 sawal)

### Fundamentals (1–13)

1. **DBMS kya hai?** Data store + query + security + concurrency manage karne wala system.
2. **SQL vs NoSQL?** SQL = fixed schema + relations + strong transactions. NoSQL = flexible schema + horizontal scale.
3. **Primary vs foreign key?** PK = unique identity. FK = doosri table ka reference.
4. **Normalization kya?** Duplicate hata kar data ko ek jagah rakhna (1NF atomic, 2NF poora PK, 3NF no transitive).
5. **Denormalization kab?** Read-heavy reports/invoices — speed ke liye duplicate, magar update 2 jagah.
6. **INNER vs LEFT JOIN?** INNER = sirf match. LEFT = left ki saari rows + match (na ho to NULL).
7. **WHERE vs HAVING?** WHERE rows par (group se pehle), HAVING groups par (baad mein).
8. **DELETE vs TRUNCATE vs DROP?** Rows / saari rows reset / poora table.
9. **ACID?** Atomicity, Consistency, Isolation, Durability.
10. **Transaction kab?** Jab kai changes ek sath hon (order + stock + payment).
11. **Index kya, nuksan?** Lookup fast (B-Tree); write slow + storage.
12. **Composite index order kyun?** Leftmost field se match hota hai.
13. **Query slow, kaise pata?** `EXPLAIN` / `.explain("executionStats")` — index use ho raha?

### MongoDB / Mongoose (14–40)

14. **Document vs row?** Document = JSON-like record; row = SQL table ka record.
15. **ObjectId kya?** 12-byte id: timestamp + machine + counter.
16. **Embed vs reference?** Bounded + sath padha jaye = embed. Independent + bara = reference.
17. **N:M kaise?** Array of refs (embedded) ya alag join collection.
18. **populate kya?** Reference expand; extra query → N+1 ka risk.
19. **N+1 kya?** Loop mein query — 1 + N queries. Fix: populate/aggregation.
20. **lean kya?** Plain object, fast; virtuals/transform nahi chalte.
21. **Aggregation stages?** `$match`, `$group`, `$sort`, `$limit`, `$lookup`, `$project`, `$unwind`.
22. **`updateOne` vs `replaceOne`?** Field-level update vs poora document replace.
23. **`$inc` kyun?** Atomic increment — race condition safe.
24. **upsert?** Na mile to insert, mile to update.
25. **unique vs sparse?** Duplicate rokta hai / sirf value wale par unique.
26. **Text index?** Full-text search; ek collection par ek.
27. **Mongo mein transaction?** Multi-document atomicity; replica set chahiye.
28. **Connection pooling?** Connection reuse; Next.js mein global cache.
29. **`mongoose.models.X ||` kyun?** Hot-reload par OverwriteModelError se bachne ke liye.
30. **timestamps?** `createdAt`/`updatedAt` auto.
31. **Validation?** `required`, `min`, `max`, `enum`, custom validator — app level.
32. **Pagination?** `skip/limit` simple; cursor (`_id > last`) bara data.
33. **Soft delete?** `deletedAt` set karna, row hatana nahi (orders ka reference safe).
34. **Auto-increment kaise?** `counters` collection + `$inc` atomic.
35. **Idempotency key?** Same request dobara aaye to duplicate na bane (`checkoutKey` unique).
36. **E-commerce schema design?** users, products, orders (items embedded), payments, carts, categories.
37. **Stock race condition?** Conditional atomic `findOneAndUpdate` with `$inc`.
38. **NoSQL injection?** Input object/operator inject karna → type validation/sanitize.
39. **Password kaise?** bcrypt hash, plain kabhi nahi.
40. **Migration kaise?** Backup → script → `legacyId` + upsert → id map → verify → deploy.

---

## 15. 1-Page Revision Sheet (interview se pehle)

- **Schema** = structure ka plan; **Model** = query karne ka object.
- **`_id`** Mongo ka object; UI ko **`id`** string chahiye (transform).
- **Embed** = bounded + sath; **Reference** = independent + bara.
- **Snapshot** = us waqt ka data (invoice badalna nahi chahiye).
- **Index** = read tez, write mehnga; compound mein leftmost rule.
- **`$inc`** atomic — race condition ka ilaj.
- **Transaction** = multiple docs; replica set chahiye.
- **`checkoutKey`** = double order rokta hai (idempotency).
- **`legacyId`** = purana id ↔ naya ObjectId.
- **`counters`** = human order number, atomic `$inc`.
- **Soft delete** = `deletedAt`, row nahi hatti.
- **`.lean()`** = fast read, magar transform nahi.
- **N+1** = loop mein query; fix `populate`/aggregation.
- **Trade-off** har jawab mein bolo — yahi interviewer dhoondta hai.

---

## 16. Practice Plan (roz 1.5 ghanta)

| Time | Kaam |
|---|---|
| 30 min | Project milestone (M1–M5) — code likho |
| 30 min | Purane concepts (1-3-7 rule: 1 din, 3 din, 7 din baad) |
| 20 min | 5 sawal **bol kar** jawab + record |
| 10 min | Question bank update (D-W-E-T) |

**Har concept ka 3-line jawab banao:**
> Definition (1 line) + Kyun (1 line) + Mera project ka example (1 line) + Trade-off (1 line).

**Project story (yaad karo, har interview mein kaam aayegi):**
1. Kya tha — Next.js store, data JSON files mein
2. Masla — concurrency + queries + reliability
3. Kya kiya — MongoDB + Mongoose, schema, indexes, `legacyId` migration
4. Verify — counts, totals, relations, orphans
5. Seekha — idempotent migration, backup, unique index, atomic ops
