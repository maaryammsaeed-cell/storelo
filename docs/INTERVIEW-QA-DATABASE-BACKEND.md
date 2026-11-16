# 🎤 Database + Backend — Complete Interview Answers

> **Ye document kya hai?**
> 50+ expected interview sawal, har ek ka **poora bolne layak jawab**. Sirf project ke nahi — **overall DB + backend** ke.
>
> **Kaise practice karein?**
> 1. Ek din mein **5 sawal** — pehle khud bolo, phir neeche jawab padho.
> 2. Jawab ka structure yaad rakho: **Definition → Why → Example → Trade-off**.
> 3. Har jawab ko **apne alfaz** mein 1 minute mein bol kar record karo.
> 4. Ratna nahi — **keywords** yaad karo, wording apni banao.
>
> **Scope:** Database (SQL + MongoDB) aur Backend (API, auth, security). JavaScript/React/Next.js/OOP ke liye alag volume chahiye — bolo to bana doon.

---

# 📚 Section A — Database Fundamentals

---

### Q1. DBMS kya hai aur file system se behtar kyun hai?

**Jawab:**
DBMS ek software hai jo data ko structured form mein store karta hai aur us par query, security, backup aur concurrency control deta hai. File system mein data simple files mein hota hai — do users ek sath likhein to corruption ka khatra hota hai, search ke liye poora file padhna padta hai, aur transactions nahi hoti.

DBMS ye sab deta hai: **indexing** (fast search), **ACID transactions**, **concurrent access control**, **permissions**, aur **backup/recovery**. Isliye real applications file system ke bajaye DBMS use karti hain.

**Trade-off:** DBMS setup aur manage karna file system se zyada complex hota hai — chhoti one-time scripts ke liye file system kaafi hai.

---

### Q2. SQL aur NoSQL mein kya farq hai? Kab kya choose karein?

**Jawab:**
SQL **relational** hai — fixed schema, tables, rows, aur JOINs. Strong consistency aur transactions deta hai. NoSQL (document) **flexible schema** deta hai — data JSON jaisi documents mein hota hai, aur horizontal scaling aasan hoti hai.

Choose aise karo:
- **SQL** — banking, accounting, ERP, jahan relations aur strict transactions zaroori hain.
- **NoSQL** — product catalog, CMS, logs, real-time feeds, jahan schema badalta rehta hai aur fast iteration chahiye.
- **Hybrid** — PostgreSQL with JSONB, ya SQL + Redis cache.

**Trade-off:** NoSQL mein flexible schema ka matlab hai validation **application** par shift ho jati hai — ghalat data DB mein ja sakta hai. SQL mein DB khud enforce karta hai.

---

### Q3. Primary key, foreign key, candidate key aur composite key kya hote hain?

**Jawab:**
- **Primary key** — row ki unique identity. Duplicate nahi ho sakti, NULL nahi ho sakti.
- **Foreign key** — doosri table ki primary key ka reference. Isse relation banta hai aur orphan data rukta hai.
- **Candidate key** — wo columns jo unique ban sakte hain; inmein se ek primary key chuni jati hai.
- **Composite key** — do ya zyada columns mil kar unique identity banate hain (jaise `(orderId, productId)`).

**Example:** `orders.customer_id` foreign key hai jo `customers.id` ko point karta hai. Ek customer ke bohot orders ho sakte hain, magar har order ka ek hi customer.

**Trade-off:** Foreign keys consistency dete hain, magar insert/update par extra check aur (kabhi) locking ka cost aata hai.

---

### Q4. Normalization kya hai? 1NF, 2NF, 3NF samjhao.

**Jawab:**
Normalization data ko is tarah todna hai ke **duplicate na rahe** aur har cheez apni sahi jagah ho.

- **1NF** — har column mein atomic value (ek cell mein list nahi).
- **2NF** — 1NF + har non-key column **poori primary key** par depend kare (composite key ka hissa par nahi).
- **3NF** — 2NF + koi **transitive dependency** na ho (non-key column kisi doosre non-key column par depend na kare).

**Example:** Ek `orders` table mein customer ka naam, phone, address sab repeat ho raha hai. Ise `customers` aur `orders` mein todo — customer ki info ek jagah, order mein sirf `customer_id`.

**Trade-off:** Zyada normalization = kam duplicate + safe updates, magar zyada JOINs = read slow.

---

### Q5. Denormalization kab karte hain aur kyun?

**Jawab:**
Denormalization jaan boojh kar data duplicate karna hai taake **read fast** ho. Jab data read-heavy ho, JOINs mehnge hon, ya historical record preserve karna ho — tab karte hain.

**Example:** Order ke andar product ka `title` aur `price` copy kar dena. Agar baad mein product ka price badle, purana order nahi badalna chahiye — wo invoice hai.

**Trade-off:** Read fast ho jata hai, magar update do jagah karna padta hai aur drift ka risk hota hai (jaise `ordersCount` galat ho jana). Isliye transaction ya background job se sync rakhte hain.

---

### Q6. INNER JOIN, LEFT JOIN, RIGHT JOIN aur FULL JOIN mein farq?

**Jawab:**
- **INNER JOIN** — sirf wo rows jinke dono tables mein match hain.
- **LEFT JOIN** — left table ki **saari** rows + matching right rows; match na mile to NULL.
- **RIGHT JOIN** — ulta: right ki saari rows.
- **FULL JOIN** — dono taraf ki saari rows, jahan match na ho wahan NULL.

**Example:** `customers LEFT JOIN orders` — wo customers bhi aayenge jinhone koi order nahi kiya (order columns NULL). `INNER JOIN` se sirf wo customers aate jo order kar chuke hain.

**Trade-off:** JOINs relation ka fayda dete hain, magar bade tables par slow ho sakte hain — isliye join columns par index zaroori hai.

---

### Q7. WHERE aur HAVING mein kya farq hai?

**Jawab:**
`WHERE` **rows** par filter lagata hai — grouping se **pehle**. `HAVING` **groups** par filter lagata hai — grouping ke **baad**, aur ismein aggregate functions (`SUM`, `COUNT`, `AVG`) use ho sakte hain.

**Example:**
```sql
SELECT category, SUM(price) AS total
FROM products
WHERE status = 'active'        -- rows filter
GROUP BY category
HAVING SUM(price) > 10000;     -- groups filter
```

**Ghalti:** `WHERE SUM(price) > 10000` likhna — ye chalega nahi, kyunki aggregate tab tak bana hi nahi.

---

### Q8. DELETE, TRUNCATE aur DROP mein farq?

**Jawab:**
- **DELETE** — specific rows hatata hai (`WHERE` ke sath). Rollback ho sakta hai, slow, triggers chalte hain.
- **TRUNCATE** — saari rows hata deta hai, magar table structure rehta hai. Fast, usually rollback nahi hota.
- **DROP** — poora table (structure + data) hata deta hai.

**Example:** `DELETE FROM orders WHERE status = 'cancelled'` vs `TRUNCATE TABLE logs` vs `DROP TABLE temp_data`.

**Trade-off:** DELETE safe hai magar slow; TRUNCATE fast hai magar `WHERE` support nahi karta.

---

### Q9. ACID kya hai? Example ke sath samjhao.

**Jawab:**
ACID transaction ke 4 guarantees hain:

- **Atomicity** — sab changes honge ya koi nahi. Bank transfer mein debit aur credit dono, ya kuch bhi nahi.
- **Consistency** — transaction ke baad data valid state mein rahe (constraints toot na jayein).
- **Isolation** — do transactions ek doosre ka kaam kharab na karein.
- **Durability** — commit hone ke baad data crash ke baad bhi mehfooz rahe.

**Example:** Order place karna = order row + stock kam + payment row. Agar payment fail ho, order aur stock bhi rollback hone chahiye.

**Trade-off:** Transaction safety deta hai, magar locking aur overhead se throughput kam ho sakta hai.

---

### Q10. Isolation levels kya hain?

**Jawab:**
Isolation levels batate hain ke concurrent transactions ek doosre ko kitna dekhne dete hain:

| Level | Rokta hai |
|---|---|
| Read Uncommitted | Kuch nahi (dirty read possible) |
| Read Committed | Dirty read |
| Repeatable Read | Dirty + non-repeatable read |
| Serializable | Sab kuch (sab se strict, sab se slow) |

**Dirty read** = uncommitted data padhna. **Non-repeatable read** = same row dobara padho to value badal jaye. **Phantom read** = same query dobara chalao to nayi rows aa jayein.

**Trade-off:** Strict isolation = correct data magar slow/concurrency kam.

---

### Q11. Index kya hai, kaise kaam karta hai, aur nuksan kya hai?

**Jawab:**
Index ek **B-Tree** structure hai jo column ki values ko sorted rakhta hai, taake DB seedha jump kar sake — poora table scan na kare. Isse lookup `O(n)` se `O(log n)` ho jata hai.

**Kahan faida:** `WHERE`, `JOIN`, `ORDER BY` aur `UNIQUE` checks par.

**Nuksan:** Har `INSERT`/`UPDATE`/`DELETE` par index bhi update hota hai — **writes slow** hote hain. Storage aur RAM bhi lagti hai. Aur jis query mein index ka leftmost field na ho, us index ka faida nahi hota.

**Rule:** Sirf wahi index lagao jo actual queries use karti hain.

---

### Q12. Composite index kya hai? Leftmost rule samjhao.

**Jawab:**
Composite index do ya zyada columns par banta hai — jaise `{ customerId: 1, createdAt: -1 }`. Ye un queries ke liye fast hai jo **customerId** se shuru ho kar created date par sort karein.

**Leftmost rule:** Index ka use tab hota hai jab query index ke **pehle field** ko use kare. `{ a, b }` index:
- `a` ✅ use hoga
- `a + b` ✅ use hoga
- sirf `b` ❌ use nahi hoga

**Example:** Customer ki order history — `customerId + createdAt` perfect hai. Sirf `createdAt` se query karo to ye index kaam nahi aayega, alag index chahiye.

---

### Q13. Clustered aur non-clustered index mein farq?

**Jawab:**
- **Clustered index** — actual rows usi order mein store hoti hain (ek hi ho sakta hai). Table ka data khud index hai.
- **Non-clustered index** — alag structure hota hai jismein key + row ka pointer hota hai. Ek table par kai ho sakte hain.

**MongoDB mein:** `_id` ka index default hai aur data usi ke qareeb hota hai. Baaki indexes non-clustered jaisa kaam karte hain.

**Trade-off:** Clustered range reads bohot fast karta hai, magar ek hi possible hai; non-clustered flexible hai magar extra lookup lagta hai.

---

### Q14. Query slow hai — kaise pata karein aur theek karein?

**Jawab:**
Pehle **query plan** dekho:
- SQL: `EXPLAIN ANALYZE <query>`
- MongoDB: `.explain("executionStats")`

Plan batata hai: **collection/table scan** ho raha hai ya **index** use hua, kitne documents scan hue, aur kitna time laga.

**Fix ke tareeqe:**
1. Missing index add karo (WHERE/JOIN/ORDER BY wale fields par).
2. `SELECT *` hatao — sirf zaroori columns.
3. Indexed column par function/`LIKE '%x'` mat lagao — index bypass ho jata hai.
4. Pagination lagao, poora data mat lao.
5. N+1 queries fix karo (JOIN/populate/aggregation).
6. Bar bar aane wala result cache karo.

**Trade-off:** Har index write cost barhata hai — sirf plan dekh kar index add karo, andaze se nahi.

---

### Q15. N+1 query problem kya hai?

**Jawab:**
Jab tum ek list laate ho (1 query), phir har item ke liye alag query chalate ho (N queries) — total **N+1** queries.

**Example:**
```js
const orders = await Order.find();          // 1
for (const o of orders) {
  o.customer = await Customer.findById(o.customerId); // N
}
```

**Fix:**
- SQL: `JOIN` ya `WHERE id IN (...)` se ek query.
- Mongo: `populate()` (2 queries), `$lookup` (aggregation), ya `$in` se batch.
- GraphQL: DataLoader (batching).

**Trade-off:** Populate aasan hai magar 2 queries karta hai; `$lookup` ek query mein karta hai magar complex ho sakta hai.

---

### Q16. Transaction SQL mein kaise likhte hain?

**Jawab:**
```sql
BEGIN;
UPDATE accounts SET balance = balance - 1000 WHERE id = 1;
UPDATE accounts SET balance = balance + 1000 WHERE id = 2;
COMMIT;   -- ya error par ROLLBACK;
```

`BEGIN` transaction shuru karta hai, `COMMIT` permanently save karta hai, `ROLLBACK` sab undo kar deta hai. `SAVEPOINT` se beech ka hissa bhi rollback kar sakte hain.

**Kab use karo:** Jab kai rows/documents ek sath change hon aur sab-or-nothing chahiye — paisa transfer, order + stock + payment.

**Trade-off:** Transaction ke doran locks rehte hain — lambi transaction doosron ko block kar sakti hai.

---

# 📚 Section B — Indexes, Concurrency & Performance

---

### Q17. Race condition kya hai? Stock wala example samjhao.

**Jawab:**
Race condition tab hoti hai jab do requests ek sath same data padhein aur dono apna change likh dein — ek ka change doosre ko overwrite kar deta hai.

**Example:** Stock = 1. User A aur B dono ne 1 item order kiya. Dono ne "stock 1 hai" padha, dono ne order banaya → stock −1 ho gaya (oversell).

**Hal:**
```js
// Atomic — check aur decrement ek hi operation
await Product.findOneAndUpdate(
  { _id, stock: { $gte: qty } },
  { $inc: { stock: -qty } },
  { new: true }
);
```
Agar `null` mila to stock khatam — doosre user ko out-of-stock.

**Ya:** `SELECT ... FOR UPDATE` (SQL lock) ya transaction.

**Trade-off:** Atomic single-document update sab se fast hai; multi-document ke liye transaction chahiye.

---

### Q18. Optimistic aur pessimistic locking mein farq?

**Jawab:**
- **Pessimistic** — pehle lock lo, phir kaam karo (`SELECT FOR UPDATE`). Doosra wait karega. Safe magar slow, deadlock ka risk.
- **Optimistic** — lock nahi, bas `version` field check karo. Update ke waqt `WHERE version = 5`; agar 0 rows affect hui to kisi aur ne change kar diya — retry karo.

**Example:** Document editing app — optimistic behtar (conflict kam). Banking transaction — pessimistic behtar (conflict zyada, safety zaroori).

**Trade-off:** Optimistic fast hai magar conflicts par retry chahiye; pessimistic safe hai magar concurrency kam.

---

### Q19. Deadlock kya hai aur kaise bachte hain?

**Jawab:**
Deadlock tab hota hai jab do transactions ek doosre ka lock chahiye — A ne X lock kiya aur Y chahiye, B ne Y lock kiya aur X chahiye. Dono hamesha wait karte rehte hain.

**Bachne ke tareeqe:**
1. Hamesha resources ek hi order mein lock karo (A→B, sab ke liye).
2. Transactions chhoti rakho.
3. Timeout lagao.
4. Deadlock detect hone par retry logic.

**Trade-off:** Order enforce karna design constraint lagata hai, magar deadlock se bachata hai.

---

### Q20. Caching kab use karte hain aur invalidation kaise karte hain?

**Jawab:**
Caching tab jab same data bar bar chahiye aur compute/DB read mehnga ho — product list, settings, popular items. Redis ya in-memory cache use hota hai.

**Pattern (cache-aside):**
1. Cache dekho — mila to return.
2. Na mile to DB se lao.
3. Cache mein set karo (TTL ke sath).

**Invalidation:** Data update hone par cache delete/update karo; ya TTL se expire hone do. "Sab se mushkil cheez" yahi hai — stale cache se user ko purana data dikh sakta hai.

**Trade-off:** Speed vs freshness. Critical data (balance) cache nahi karte.

---

### Q21. Pagination ke tareeqe kaun se hain?

**Jawab:**
- **Offset pagination** — `LIMIT 10 OFFSET 20`. Simple, magar bade offset par slow (DB ko utni rows skip karni padti hain) aur data shift hone par duplicates/skip ho sakte hain.
- **Cursor pagination** — `WHERE id > lastId ORDER BY id LIMIT 10`. Fast, stable, infinite scroll ke liye best; page number par jump nahi kar sakte.

**Interview line:** *"Chhote data par offset theek hai; bade ya badalte data par cursor better hai kyunki wo index par chalta hai aur duplicates nahi deta."*

---

# 📚 Section C — MongoDB & Mongoose

---

### Q22. Document database relational se kaise alag hai?

**Jawab:**
Relational mein data tables/rows mein hota hai aur relations foreign keys se bante hain. Document DB mein data JSON jaisi **documents** mein hota hai jo ek collection mein rehti hain — related data ek hi document ke andar nested ho sakta hai.

**Mapping:** table → collection, row → document, column → field.

**Faida:** Ek document mein poora object ek sath aata hai (fast read), schema flexible hota hai.
**Nuksan:** Cross-document JOINs mehnge hain, aur validation app par shift ho jati hai.

---

### Q23. ObjectId kya hai? Iska structure samjhao.

**Jawab:**
ObjectId 12-byte ka unique identifier hai:
- **4 bytes** — creation timestamp (seconds)
- **5 bytes** — random value (machine/process)
- **3 bytes** — counter (same second mein unique)

Isliye ObjectId **tqreeban time-ordered** hota hai — isse `_id` par sort karna creation order ke qareeb hota hai.

**Important:** ObjectId **business id nahi** hai — invoice number, order number alag rakho. ObjectId internal/technical identity hai.

**Trade-off:** Globally unique aur bina central counter ke banta hai, magar human-readable nahi.

---

### Q24. Embed aur reference mein kab kya choose karein?

**Jawab:**
- **Embed** karo jab data **bounded** ho, hamesha parent ke sath padha jaye, aur uske bina matlab na ho. Example: order ke items, customer ka address.
- **Reference** karo jab data **independent lifecycle** rakhta ho, **bohot zyada** barh sakta ho, ya kai jagah share hota ho. Example: order → customer, product → category.

**Rule:**
> "Ek ke bina doosre ka matlab nahi + bounded → embed. Independent + unbounded → reference."

**Trade-off:** Embed = ek query mein sab, magar document size limit (16MB) aur duplication. Reference = clean + reusable, magar extra query/populate.

---

### Q25. N:M relationship MongoDB mein kaise banate hain?

**Jawab:**
Do tareeqe hain:

1. **Array of references (embedded)** — jaise order ke andar `items: [{ productId, quantity }]`. Ek order mein bohot products, ek product bohot orders mein.
2. **Join collection** — alag `order_items` collection jismein `orderId` + `productId` + extra fields. Ye SQL ke join table jaisa hai.

**Kab kya:** Items bounded (5–10) aur hamesha order ke sath chahiye → embed. Items unbounded ya un par independent reporting chahiye → join collection.

**Trade-off:** Embed fast hai magar array barhne par document bhaari; join collection flexible hai magar extra query.

---

### Q26. E-commerce ka database schema kaise design karoge?

**Jawab:**
Main collections ye rakhta/rakhti hoon:

- **users** — `_id`, name, email (unique), passwordHash, role
- **products** — `_id`, title, price, stock, categoryId, images, status, deletedAt
- **categories** — `_id`, name, slug (unique), parentId
- **carts** — `_id`, userId, `items[{ productId, qty }]`
- **orders** — `_id`, userId, `items[{ productId, title, price, qty }]` (snapshot), total, status, paymentStatus, createdAt
- **payments** — `_id`, orderId, provider, amount, status, events[]
- **reviews** — `_id`, productId, userId, rating, comment

**Design decisions:**
- Order items **embed** + snapshot (invoice immutable).
- Order → user **reference** + snapshot address.
- `categoryId` **reference** taake naam badalne par ek jagah change ho.
- Indexes: `products(categoryId, status)`, `orders(userId, createdAt)`, `orders.checkoutKey` unique, `users.email` unique.

**Trade-off:** Har decision read pattern par depend karta hai — pehle queries socho, phir schema.

---

### Q27. populate() kya karta hai aur iska nuksan kya hai?

**Jawab:**
`populate()` reference (`ObjectId`) ko expand karke doosre collection ka data laata hai. Jaise `Order.find().populate("customerId")` — order ke sath customer ka object aa jayega.

**Nuksan:**
1. **Extra query** chalti hai (N+1 ka risk) — 100 orders ke liye 101 queries.
2. Bara data aata hai (sirf zaroori fields ke liye `select` lagao).
3. Deep populate performance kharab karta hai.

**Behtar:** `$lookup` (aggregation) se ek query, ya `select()` se limited fields.

**Trade-off:** populate code simple rakhta hai, magar scale par slow ho sakta hai.

---

### Q28. .lean() kya karta hai aur kab use karte hain?

**Jawab:**
`.lean()` Mongoose ko kehta hai ke poora **Mongoose document** na banao — seedha **plain JavaScript object** do. Isse memory aur CPU bachta hai, queries tez hoti hain.

**Kab:** Read-only queries — API responses, lists, dashboards. Jab document ko save/update nahi karna.

**Catch:** Lean object par **virtuals, getters, `toJSON` transform aur methods nahi chalte**. Isliye `_id` ko `id` mein manually convert karna padta hai.

**Trade-off:** Speed vs convenience — write karna ho to lean use na karo.

---

### Q29. updateOne, replaceOne aur $set mein farq?

**Jawab:**
- **`updateOne({ filter }, { $set: {...} })`** — sirf diye gaye fields update karta hai; baaki fields waise hi rehte hain. ✅ Safe.
- **`replaceOne()`** — poora document replace karta hai; jo fields nahi diye wo **delete** ho jate hain (sirf `_id` rehta hai). ⚠️ Dangerous.
- **`$set`** — nested field update ke liye: `{ $set: { "address.city": "Lahore" } }`.

**Trade-off:** `$set` partial update safe hai; `replaceOne` tab jab poora object intentionally replace karna ho.

---

### Q30. $inc kyun atomic hai aur kahan use karte hain?

**Jawab:**
`$inc` ek **single-document atomic operator** hai — MongoDB read + add + write ek hi operation mein karta hai, document-level lock ke sath. Do requests ek sath aayein to bhi dono ke increments lose nahi hote.

**Kahan:** Counter (`seq`), stock decrement, views/likes count, wallet balance.

**Example:**
```js
Counter.findOneAndUpdate({ _id: "order" }, { $inc: { seq: 1 } }, { new: true });
```

**Trade-off:** Single document par atomic hai — multi-document ke liye transaction chahiye.

---

### Q31. upsert kya hai?

**Jawab:**
Upsert = **update + insert** ka mix. Agar filter se document mil jaye to update karo; na mile to naya insert karo.

```js
Model.updateOne({ email }, { $set: {...} }, { upsert: true });
```

**Kahan:** Migration scripts (idempotent), settings save, "get or create" patterns.

**Trade-off:** Race condition par duplicate key error aa sakta hai — unique index + retry chahiye.

---

### Q32. Indexes ki types batao (unique, sparse, compound, text, TTL).

**Jawab:**
- **Single field** — ek field par; simple lookup.
- **Compound** — kai fields; leftmost rule.
- **Unique** — duplicate value insert nahi ho sakti (email, checkoutKey).
- **Sparse** — sirf un documents par index jahan field **maujood** ho (optional unique fields ke liye).
- **Text** — full-text search (title/description); ek collection par ek.
- **TTL** — document ko set time ke baad automatically delete karta hai (OTP, sessions).

**Trade-off:** Har index write cost + storage barhata hai — sirf zaroori indexes.

---

### Q33. Aggregation pipeline kya hai? Example do.

**Jawab:**
Aggregation ek **pipeline** hai jismein documents stages se guzarte hain:

`$match` (filter) → `$group` (calculate) → `$sort` → `$limit` → `$lookup` (join) → `$project` (fields choose).

**Example — category wise total sales:**
```js
Order.aggregate([
  { $match: { paymentStatus: "Paid" } },
  { $unwind: "$items" },
  { $group: { _id: "$items.category", total: { $sum: "$items.lineTotal" } } },
  { $sort: { total: -1 } },
  { $limit: 5 }
]);
```

**Faida:** Calculation DB ke andar hota hai — data app mein laane ki zaroorat nahi.
**Trade-off:** Complex pipelines debug karna mushkil hota hai; indexes `$match`/`$sort` par kaam aate hain.

---

### Q34. MongoDB mein transactions kaise kaam karti hain?

**Jawab:**
MongoDB mein multi-document transaction **session** ke through hoti hai:
```js
const session = await mongoose.startSession();
await session.withTransaction(async () => {
  await Order.create([order], { session });
  await Product.updateOne({ _id }, { $inc: { stock: -qty } }, { session });
});
```

**Shart:** **Replica set** chahiye (Atlas free tier bhi replica set hai). Standalone par transaction error deti hai.

**Kab:** Order + stock + payment ek sath. Warna single-document atomic operations (`$inc`, `findOneAndUpdate`) kaafi hote hain.

**Trade-off:** Transaction safe hai magar slow aur locking ka cost hai — jitni chhoti ho utni behtar.

---

### Q35. Connection pooling kya hai? Next.js mein kya dhyan rakhna?

**Jawab:**
Connection pool **reusable connections** ka group hai — har request par naya TCP connection kholna mehnga hota hai. Pool se connection le kar kaam karo aur wapas chhod do.

**Next.js/serverless mein:** Function dobara chalne par module reload ho sakta hai; is liye connection ko **global** cache karte hain:
```js
global.mongoose ||= { conn: null, promise: null };
```

**Dhyan:** Har request par `mongoose.connect()` na karo — pool khatam ho jayega. `maxPoolSize` environment ke hisaab se set karo.

**Trade-off:** Zyada pool = zyada concurrency, magar DB par zyada load aur memory.

---

### Q36. Soft delete kya hai aur kyun use karte hain?

**Jawab:**
Soft delete mein document **hataya nahi jata** — `deletedAt` field set kar di jati hai, aur queries mein `deletedAt: null` filter lag jata hai.

**Kyun:** Order/product ka reference kahin aur ho sakta hai; permanently delete karne se purana data tootega. Restore bhi possible ho jata hai.

**Catch:** Har query mein filter ya default scope chahiye; unique index ke sath `deletedAt` include karna pad sakta hai; data barhta rehta hai (archival/TTL).

**Trade-off:** Data safety vs storage aur query complexity.

---

### Q37. Auto-increment / order number kaise banate hain MongoDB mein?

**Jawab:**
MongoDB mein native auto-increment nahi hota, kyunki `_id` ObjectId hai. Human-friendly sequence ke liye **counters collection**:
```js
const c = await Counter.findOneAndUpdate(
  { _id: "order" },
  { $inc: { seq: 1 } },
  { new: true, upsert: true }
);
const orderNumber = `ORD-${c.seq}`;
```

`$inc` atomic hai — do concurrent requests ko alag numbers milte hain.

**Kyun `_id` nahi:** ObjectId padhne layak nahi, sequential nahi, aur internal id public karna security risk hai.

**Trade-off:** Counter ek single document par hota hai (hotspot); sharding mein per-shard counters ya random prefix use karte hain.

---

### Q38. Idempotency key kya hai?

**Jawab:**
Idempotency key ek unique client-generated value hoti hai jo request ke sath jati hai. Agar same request dobara aa jaye (double click, retry, refresh), server **naya kaam nahi karta** — pehla result wapas deta hai.

**Example:** Checkout par `checkoutKey`; payment API par `idempotency-key` header.

**Implementation:** `checkoutKey` par unique index; doosra insert duplicate key error dega, jise pakad kar existing order return kar dete hain.

**Kyun zaroori:** Double order, double payment charge, double stock deduction se bachata hai.

**Trade-off:** Key generate aur store karni padti hai; galat key management se requests block ho sakti hain.

---

### Q39. Mongoose validation kya deta hai? Kya DB bhi validate karta hai?

**Jawab:**
Mongoose validation **application level** par hoti hai: `required`, `min`, `max`, `enum`, `match` (regex), `validate` (custom function), `unique` (index level).

**Important:** MongoDB khud schema enforce nahi karta — koi bhi script direct insert kar sakta hai. DB-level validation ke liye `$jsonSchema` validator lag sakta hai.

**Best practice:** API boundary par validate karo (zod/joi ya Mongoose), aur DB par bhi `$jsonSchema` optional rakho.

**Trade-off:** App validation flexible hai magar bypass ho sakti hai; DB validation strong hai magar change karna mushkil.

---

### Q40. `mongoose.models.X || mongoose.model(...)` kyun likhte hain?

**Jawab:**
Next.js dev mode mein hot reload par modules dobara compile hote hain. Agar model dobara register ho jaye to Mongoose `OverwriteModelError` deta hai.

Isliye pattern: agar model pehle se registered hai to **wahi return karo**, warna naya banao.
```js
export default mongoose.models.Product || mongoose.model("Product", schema);
```

**Trade-off:** Koi nuksan nahi — ye standard Next.js pattern hai. Production mein bhi harmless hai.

---

### Q41. `_id` aur `id` mein kya farq hai? UI ko kaun sa chahiye?

**Jawab:**
MongoDB har document ko `_id` deta hai — ek **ObjectId object**. Frontend frameworks aur APIs ke liye `id` **string** aasan hoti hai.

Agar `_id` object client ko jaye to errors aate hain ("Objects are not valid as a React child", "Only plain objects can be passed"). Isliye `toJSON` transform se:
```js
ret.id = String(ret._id);
delete ret._id;
```

**Trade-off:** Mapping thori extra code hai, magar UI aur API clean rehte hain. `.lean()` par ye transform nahi chalta — manually map karna padta hai.

---

# 📚 Section D — Backend / API

---

### Q42. REST API kya hai? Principles batao.

**Jawab:**
REST ek architectural style hai jismein **resources** URLs se represent hote hain aur **HTTP methods** se operations hote hain.

**Principles:**
1. **Stateless** — har request mein poori info ho; server session yaad na rakhe.
2. **Resource-based URLs** — `/products/123`, na ke `/getProduct?id=123`.
3. **HTTP methods ka matlab** — GET (read), POST (create), PUT (replace), PATCH (partial update), DELETE (remove).
4. **Status codes** — success/error sahi code se batao.
5. **Representation** — JSON response.

**Trade-off:** REST simple aur cacheable hai, magar over-fetching/under-fetching ho sakti hai (GraphQL iska hal hai).

---

### Q43. PUT, PATCH aur POST mein farq?

**Jawab:**
- **POST** — naya resource banata hai (`POST /orders`). Idempotent nahi — do baar bhejo to do orders.
- **PUT** — poora resource replace karta hai (`PUT /users/1`). Idempotent — same request dobara bhejo to same result.
- **PATCH** — partial update (`PATCH /users/1` sirf email). Idempotent ho sakta hai.

**Interview line:** *"PUT poora object expect karta hai; PATCH sirf diye gaye fields badalta hai. Isliye partial update ke liye PATCH behtar hai."*

---

### Q44. Important HTTP status codes batao.

**Jawab:**
- **2xx** — 200 OK, 201 Created, 204 No Content
- **3xx** — 301/302 redirect
- **4xx** — 400 Bad Request (validation), 401 Unauthorized (login nahi), 403 Forbidden (permission nahi), 404 Not Found, 409 Conflict (duplicate), 422 Unprocessable Entity (semantic error), 429 Too Many Requests
- **5xx** — 500 Internal Server Error, 502 Bad Gateway, 503 Service Unavailable

**401 vs 403:** 401 = "tum kaun ho?" (auth missing/invalid). 403 = "tum ho, magar allowed nahi" (authorization).

---

### Q45. Middleware kya hai? Request lifecycle samjhao.

**Jawab:**
Middleware ek function hai jo request aur response ke **beech** chalta hai. Har middleware `next()` call karke agla step chalata hai, ya response bhej kar chain rok deta hai.

**Order:** logging → body parsing → auth → validation → route handler → error handler.

**Example (Express):**
```js
app.use(authMiddleware);      // token verify
app.use(validate(schema));    // input check
app.get("/orders", handler);
app.use(errorHandler);        // sab errors yahan
```

**Trade-off:** Middleware code reusable banata hai, magar order galat ho to security bypass ho sakti hai (auth ko validation se pehle rakho).

---

### Q46. Authentication aur authorization mein farq?

**Jawab:**
- **Authentication** = "tum kaun ho?" — login, token verify.
- **Authorization** = "tum kya kar sakte ho?" — role/permission check.

**Example:** Admin login karta hai (authentication ✅), magar agar wo sirf `admin` role ka hai to `superadmin` ka user delete nahi kar sakta (authorization ❌).

**Status codes:** 401 authentication fail, 403 authorization fail.

**Trade-off:** Role-based access simple hai, magar granular permissions (RBAC/ABAC) zyada flexible hain — complexity ke sath.

---

### Q47. JWT kya hai? Flow samjhao.

**Jawab:**
JWT (JSON Web Token) 3 parts ka token hai: **header.payload.signature**. Payload mein claims hote hain (`userId`, `role`, `exp`), aur signature server ke secret se verify hoti hai.

**Flow:**
1. Login → server token banata hai.
2. Client token store karta hai (httpOnly cookie behtar).
3. Har request mein token bheja jata hai (`Authorization: Bearer ...` ya cookie).
4. Server signature verify karta hai → user identify karta hai.

**Faida:** Stateless — server session store nahi karta, scale aasan.
**Nuksan:** Token revoke karna mushkil (expiry tak valid), aur localStorage mein XSS risk hota hai.

**Trade-off:** Stateless speed deta hai, magar logout/revocation ke liye short expiry + refresh token chahiye.

---

### Q48. Session aur JWT mein kya behtar hai?

**Jawab:**
- **Session** — server par store hota hai, client ke paas sirf session id. Logout instant, revoke aasan. Magar server state aur shared store (Redis) chahiye.
- **JWT** — self-contained, stateless. Scale aasan, microservices mein accha. Magar revoke mushkil aur token size bara.

**Choose:** Simple monolith + instant logout chahiye → session. Stateless API + mobile apps → JWT.

**Trade-off:** Session control deta hai, JWT scale deta hai.

---

### Q49. Password hashing aur encryption mein farq?

**Jawab:**
- **Hashing** one-way hai — hash se original password wapas nahi nikal sakte. **bcrypt** salt + cost factor ke sath use hota hai. Compare karte waqt `bcrypt.compare()` use karo.
- **Encryption** two-way hai — key se decrypt ho sakta hai. Sensitive data (card number, PII) ke liye.

**Rule:** Password hamesha **hash** karo, kabhi encrypt ya plain store na karo. Salt se rainbow table attacks rukte hain; cost factor (10–12) brute force slow karta hai.

**Trade-off:** Zyada cost factor = zyada secure magar login slow.

---

### Q50. CORS kya hai aur kaise handle karte hain?

**Jawab:**
CORS (Cross-Origin Resource Sharing) browser ki security policy hai. Browser block karta hai jab page (`example.com`) kisi doosre origin (`api.other.com`) se request kare — jab tak server allow na kare.

Server `Access-Control-Allow-Origin`, `-Methods`, `-Headers` headers bhejta hai. Non-simple requests ke liye browser pehle **OPTIONS preflight** bhejta hai.

**Important:** CORS browser ke liye hai — server-to-server calls par lagu nahi hota. Ye authentication ka replacement nahi hai.

**Trade-off:** `*` allow karna aasan magar unsafe; specific origins list behtar hai.

---

### Q51. Rate limiting kyun aur kaise karte hain?

**Jawab:**
Rate limiting ek user/IP ko time window mein limited requests deta hai — brute force, scraping aur abuse se bachata hai.

**Algorithms:** fixed window, sliding window, token bucket.

**Implementation:** Redis mein counter (`INCR` + `EXPIRE`), ya middleware (express-rate-limit). Limit cross ho to **429 Too Many Requests**.

**Example:** Login par 5 attempts/minute; API par 100 requests/minute per user.

**Trade-off:** Security barhti hai, magar legitimate heavy users block ho sakte hain — tiered limits behtar hain.

---

### Q52. SQL injection aur NoSQL injection kaise rokte hain?

**Jawab:**
**SQL injection:** User input query string mein daal dena — `' OR 1=1 --`. Hal: **parameterized queries / prepared statements**; ORM use karo; input validate karo; DB user ko least privilege do.

**NoSQL injection:** Mongo mein object bhej kar operator inject karna:
```js
// ghalat — user ne { "$ne": null } bheja
User.findOne({ email: req.body.email, password: req.body.password });
```
`$ne` se login bypass ho sakta hai. Hal: input ka **type** check karo (string hona chahiye), sanitize karo (`express-mongo-sanitize`), aur password ko hash compare karo.

**Trade-off:** Validation thori extra code hai, magar iske bina poora auth bypass ho sakta hai.

---

### Q53. XSS aur CSRF kya hain? Kaise bachte hain?

**Jawab:**
- **XSS** — attacker ke script ko page mein chala dena (comments, input). Hal: output escape karo, React by default escape karta hai, `dangerouslySetInnerHTML` se bacho, CSP header, httpOnly cookies.
- **CSRF** — doosri site se user ke cookies ke sath request bhejna. Hal: `SameSite=Lax/Strict` cookies, CSRF token, `Origin` check, state-changing operations POST se.

**Trade-off:** httpOnly + SameSite + CSRF token teeno lagane se sahi protection hoti hai, magar har API call mein token handle karna padta hai.

---

### Q54. Webhook kya hai? Payment webhook kaise handle karte hain?

**Jawab:**
Webhook ek **reverse API call** hai — third party (Stripe/JazzCash) tumhare endpoint par event bhejta hai jab kuch hota hai (payment succeeded/failed).

**Handle karne ke steps:**
1. **Signature verify** karo (secret se) — warna koi fake request bhej sakta hai.
2. **Idempotency** — event id save karo, duplicate event dobara process na ho.
3. **Fast 2xx** return karo; heavy kaam queue/background mein karo.
4. Retry ke liye ready raho (gateway dobara bhej sakta hai).

**Trade-off:** Webhook real-time updates deta hai, magar endpoint public hota hai — security aur idempotency zaroori.

---

### Q55. Error handling ka best tareeqa kya hai backend mein?

**Jawab:**
1. **Central error handler** — har route mein try/catch repeat na karo; ek jagah handle karo.
2. **Custom error class** — `AppError(status, message, code)`.
3. **Client ko safe message** — stack trace kabhi na bhejo.
4. **Log server par** — request id ke sath, monitoring (Sentry) mein.
5. **Correct status code** — validation 400, auth 401, permission 403, not found 404, conflict 409.

**Trade-off:** Detailed errors debugging aasan karte hain, magar client ko leak karne se security risk hota hai.

---

### Q56. Deployment se pehle kya checklist hota hai?

**Jawab:**
1. **Env vars** — secrets code mein nahi, production ke alag.
2. **Database** — production cluster, backups on, indexes bane hue.
3. **Migrations** — deploy se pehle chalao, idempotent hon.
4. **Auth** — admin seed, default passwords nahi.
5. **CORS/HTTPS** — sirf allowed origins, TLS on.
6. **Rate limiting + logging + monitoring**.
7. **Smoke test** — login, core flow, payment sandbox.
8. **Rollback plan** — pichla version deploy karne ka tareeqa.

**Trade-off:** Checklist slow lagti hai, magar production outage se bachati hai.

---

# 🎯 Aakhri 10 lines (interview se pehle)

1. **Schema** = structure; **Model** = query karne ka object.
2. **Embed** = bounded + sath; **Reference** = independent + bara.
3. **Snapshot** = us waqt ka data (invoice immutable).
4. **Index** = read tez, write mehnga; compound mein leftmost rule.
5. **`$inc` / `findOneAndUpdate`** = atomic, race-safe.
6. **Transaction** = multi-document, replica set chahiye.
7. **N+1** = loop mein query; fix populate/`$lookup`.
8. **`checkoutKey`** = idempotency, double order rokta hai.
9. **JWT** = stateless token; **bcrypt** = one-way hash.
10. **Har jawab mein trade-off** bolo — wahi interviewer dhoondta hai.

---

## 📝 Practice tracker

| Din | Sawal | Bola? (✅/❌) | Kamzori |
|---|---|---|---|
| 1 | Q1–Q5 | | |
| 2 | Q6–Q10 | | |
| 3 | Q11–Q16 | | |
| 4 | Q17–Q21 | | |
| 5 | Q22–Q26 | | |
| 6 | Q27–Q31 | | |
| 7 | Q32–Q36 | | |
| 8 | Q37–Q41 | | |
| 9 | Q42–Q46 | | |
| 10 | Q47–Q51 | | |
| 11 | Q52–Q56 | | |
| 12 | Sab weak sawal dobara | | |
