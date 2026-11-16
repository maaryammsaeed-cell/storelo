# PROJECT-MAP — Storelo

Ye file project ka **naksha** hai. Jab bhool jayein, ye khol lein — chat dhoondhne ki zaroorat nahi.

> **Padhne ka tareeqa:** poori file parhne ki zaroorat nahi. `Ctrl + F` se word dhoondein.

---

## 1. Aasan tareeqe se — client vs server

| Server | Client |
|---|---|
| Dukaan ka **andar ka hissa** | Dukaan ka **counter** |
| Godown, paisa, register | Customer, screen, button |
| Data aur kaam **chhupa** hota hai | Jo **dikhta** hai aur **chhua** ja sakta hai |

**Pehchanne ka tareeqa (3 second):**

1. File ki **pehli line** dekhein — `"use client"` likha hai = **CLIENT**
2. Kuch nahi likha = **SERVER**
3. `app/api/` ki har `route.js` = **hamesha server**

| | Server | Client |
|---|---|---|
| Kahan chalta hai | Server par | Browser me |
| DB/file seedha | Haan (`getSettings`, `readData`) | Nahi — `fetch` karna padta hai |
| `useState` / `onClick` | Nahi | Haan |
| Secret / password | Safe | Kabhi nahi |

> **Rule:** Click/typing/live update chahiye = **client**. Data/DB/secret chahiye = **server**.

---

## 2. Do storage — kaun kahan hai

| Storage | File | Kaam | Pehchan |
|---|---|---|---|
| **JSON file** | `lib/db.js` | products, orders, customers | `readData` / `writeData` |
| **MongoDB** | `lib/models/*.js` | settings, admins | `Model` + `connectDB` |

**5-second rule:** API route ki **pehli 4 line** dekhein —
`readData / writeData` = JSON file · `Model + connectDB` = MongoDB

| Data | Kahan | File |
|---|---|---|
| Products | JSON | `data/db/products.json` |
| Orders | JSON | `data/db/orders.json` |
| Customers | JSON | `data/db/customers.json` |
| Settings | MongoDB | `lib/models/Setting.js` |
| Admins | MongoDB | `lib/models/Admin.js` |

**Note:** `data/products.js` me `demoProducts` hai — wo sirf **backup** hai, jab `data/db/products.json` khali ho.

---

## 3. Files ki list

### Client (`"use client"`)

| File | Kyun client |
|---|---|
| `app/admin/settings/page.js` | form, typing, save |
| `app/admin/orders/page.js` | search, filter, pagination |
| `app/admin/orders/manage/page.js` | form |
| `app/admin/customers/page.js` | search, filter |
| `app/admin/customers/manage/page.js` | form |
| `app/admin/products/page.js` | grid/table toggle |
| `app/admin/products/manage/page.js` | form |
| `app/admin/inventory/page.js` | filter, tabs |
| `app/admin/inventory/manage/page.js` | form |
| `app/admin/notifications/page.js` | filter tabs |
| `components/LoginForm.jsx` | input, submit |
| `components/LogoutButton.jsx` | click |
| `components/AdminSidebar.jsx` | menu open/close |
| `components/ProductSection.jsx` | filter tabs |
| `components/admin/charts/*.jsx` (3) | charts, hover |
| `lib/useCurrency.js` | hook + `fetch` |

### Server (koi line nahi)

| File | Kaam |
|---|---|
| `app/page.js` | landing page — file + Mongo seedha |
| `app/layout.tsx` | poori site ka wrapper |
| `app/login/page.jsx` | `LoginForm` dikhata hai |
| `app/admin/layout.js` | **cookie check** + redirect guard |
| `app/admin/page.js` | dashboard |
| `app/api/**/route.js` (13) | DB ka kaam |
| `components/Landingnavbar.jsx` | sirf dikhata hai |
| `components/Landingherosec.jsx` | sirf dikhata hai |
| `components/LandingFooter.jsx` | sirf dikhata hai |
| `components/ServicesSection.jsx` | sirf dikhata hai |
| `components/ProductCard.jsx` | dikhata hai (parent client hai) |

> **Nuance:** koi component **client component ke andar** use ho to wo bhi client ban jata hai — chahe uski pehli line khali ho (`ProductCard` ki misaal).

---

## 4. Flow 1 — READ (price screen tak)

```
data/db/products.json
        │ readData
        ▼
app/page.js ──prop──> ProductSection ──> ProductCard ──> formatPrice ──> screen
```

| Step | File | Line | Kya hota hai |
|---|---|---|---|
| 1 | `data/db/products.json` | 5 | `"price": 75` |
| 2 | `app/page.js` | 20 | `readData("products")` |
| 3 | `app/page.js` | 37-39 | `<ProductSection products=... currency=... />` |
| 4 | `components/ProductSection.jsx` | 59 | `<ProductCard product currency />` |
| 5 | `components/ProductCard.jsx` | 56 | `formatPrice(product.price, currency)` |
| 6 | `lib/format.js` | 9-14 | `Intl.NumberFormat` → `"PKR 75.00"` |

**`lib/db.js`:** line 7 `readData` → line 8 file ka rasta → line 11 `fs.readFile` → line 12 `JSON.parse`

> **Read har request par hota hai.** Isi liye `app/page.js` me `export const instant = false` hai.

---

## 5. Flow 2 — WRITE (naya product save)

```
form ──POST──> api route ──readData → push → writeData──> data/db/products.json
```

| Step | File | Line | Kya hota hai |
|---|---|---|---|
| 1 | `app/admin/products/manage/page.js` | 122 | `handleSubmit` |
| 2 | wahi | 140-142 | `url` (naya = `/api/admin/products`) |
| 3 | wahi | 163 | `method: wasEditing ? "PATCH" : "POST"` |
| 4 | `app/api/admin/products/route.js` | 25 | `export async function POST` |
| 5 | wahi | 15-17 | login guard → `401` |
| 6 | wahi | 40 | `readData("products")` |
| 7 | wahi | 42-50 | `newProduct` bana |
| 8 | wahi | 52 | `products.push(newProduct)` |
| 9 | wahi | 53 | **`writeData` — ASAL SAVE** |

**`lib/db.js`:** line 20 `writeData` → line 23 `fs.writeFile`

### Variants (same pattern)

| Kaam | Method | Kya hota hai |
|---|---|---|
| Naya | POST | `push` → `writeData` |
| Edit | PATCH | dhundo → fields badlo → `writeData` |
| Delete | DELETE | `filter` → `writeData` |

Delete line: `app/admin/products/manage/page.js:198`

---

## 6. Flow 3 — AUTH (login → cookie → guard)

```
LoginForm ──POST──> login route ──token──> cookie ──> admin/layout.js guard ──> dashboard
```

| Step | File | Line | Kya hota hai |
|---|---|---|---|
| 1 | `components/LoginForm.jsx` | — | email + password bheje |
| 2 | `app/api/auth/login/route.js` | 7 | `export async function POST` |
| 3 | wahi | 20 | `Admin.findOne({ email })` |
| 4 | wahi | 31 | **`bcrypt.compare(password, hash)`** |
| 5 | wahi | 39 | `createToken({ sub, email, role })` |
| 6 | wahi | 46-47 | `cookies.set("admin_token", token, { httpOnly: true })` |
| 7 | `lib/auth.js` | 5-11 | JWT sign (`JWT_SECRET`) |
| 8 | `app/admin/layout.js` | 10-11 | `cookies()` → token |
| 9 | wahi | 12 | `verifyToken(token)` |
| 10 | wahi | **14** | **`if (!admin) redirect("/login")`** |

**`sub`** = *subject* = **kaun hai** (admin ki Mongo `_id`).
`app/admin/page.js:28` me `session` milta hai, phir `findById(session.sub)`.

### Guard do jagah hai

| Kahan | File | Line | Kya hota hai |
|---|---|---|---|
| **Page** | `app/admin/layout.js` | 14 | `redirect("/login")` |
| **API** | `app/api/admin/products/route.js` | 17 | `401 Unauthorized` (JSON) |

> **Rule:** Page = **redirect** (insaan ke liye). API = **401** (code ke liye).

---

## 7. Settings flow (MongoDB)

| Step | File | Line |
|---|---|---|
| Form save | `app/admin/settings/page.js` | 145-146 (`PATCH`) |
| DB connect | `app/api/settings/route.js` | 204 |
| Purana doc | wahi | 206 |
| Naya chadhao | wahi | 209 (`Object.assign`) |
| **ASAL SAVE** | wahi | 219 (`settings.save()`) |
| Storefront parhna | `app/page.js` | 47 (`getSettings()`) |
| Admin client parhna | `lib/useCurrency.js` | `fetch("/api/settings")` |

**Method:** POST = naya banao · PATCH = kuch badlo · PUT = poora replace · GET = parho · DELETE = mitayo.
**API route me jis naam ka function, usi method ki request.**

---

## 8. "Kaun karta hai?" — 5-second rule

> **"Agar ye line hata doon, to kaam ruk jayega?"**
> Jo line hatane se **kaam ya security toot jaye** — wohi asli jawab hai.

| Dikhane wala (caller) | Kaam karne wala (worker) |
|---|---|
| `ProductCard` | `formatPrice` |
| `POST(request)` | `bcrypt.compare` |
| `Admin.findOne` | `redirect("/login")` |
| `handleSubmit` | `writeData` |

**Aadat:** har jawab ke saath **file + line** likhein. Bina line ke jawab adhoora hai.

---

## 9. Currency (Step 5.5) — yaad rahe

| Cheez | File | Line |
|---|---|---|
| `formatPrice` | `lib/format.js` | 3 |
| `Intl.NumberFormat` | wahi | 9-14 |
| `formatPriceShort` (charts) | wahi | 22 |
| Storefront use | `components/ProductCard.jsx` | 56, 60 |
| Admin client hook | `lib/useCurrency.js` | — |
| Admin server read | `app/admin/page.js` | 80 |

**Decimal fix kyun:** `minimumFractionDigits: 2` — warna Node `"PKR 75.00"` likhta hai aur Chrome `"PKR 75"` → **hydration error**.

---

## 10. Aaj ke 4 rules (yaad rakhein)

```
1. Server = data + kaam      |  Client = screen + click
2. JSON file = readData/writeData  |  MongoDB = Model + save()
3. Page guard = redirect     |  API guard = 401
4. "Kaun karta hai?" → wo line jo hatane se kaam/security TOOT jaye
```

---

## 11. Pending kaam

| # | Kaam | File |
|---|---|---|
| 5.4 | Browser tab title settings se aaye | `app/layout.tsx` (static metadata) |

---

## 12. Commands

| Kaam | Command |
|---|---|
| Dev server | `npm run dev` |
| Lint | `npm run lint` |
| Build | `npm run build` |
| Admin login | `admin@storelo.com` / `Admin123` |

**Tip (VS Code):** `Ctrl + P` = file kholna · `Ctrl + F` = word dhoondna · `Ctrl + Shift + V` = Markdown preview
