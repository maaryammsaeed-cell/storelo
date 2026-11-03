# Storelo — Fashion Store & Admin Dashboard

A full-stack fashion storefront with a complete admin panel, built with **Next.js 16 (App Router)**.

Everything on the storefront — store name, currency, hero and footer text — is controlled from the admin **Settings** page. No code changes needed.

---

## Features

### Storefront
- Landing page: hero, services, product grid, footer
- Product filtering by category
- Prices formatted in the currency selected by the admin (e.g. `AED 75.00`, `PKR 75.00`)
- Fully responsive (mobile, tablet, desktop)

### Admin panel
- **Authentication** — JWT stored in an `httpOnly` cookie, passwords hashed with bcrypt
- **Dashboard** — revenue, orders, customers, top products + charts (Recharts)
- **Products** — create, edit, delete, image upload
- **Orders** — search, filter by status, pagination, status update
- **Customers** — search, filter, add / edit
- **Inventory** — stock overview and low-stock alerts
- **Notifications** — filterable activity feed
- **Settings** — store name, currency, hero & footer text (live on the storefront)

---

## Tech stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router, Server Components) |
| UI | React 19, Tailwind CSS v4 |
| Database | MongoDB + Mongoose (settings, admins) |
| Data store | JSON files (`data/db/*.json`) for products, orders, customers |
| Auth | JWT (`jose`) + bcryptjs, `httpOnly` cookie |
| Charts | Recharts |

> **Why two data stores?** Settings and admin accounts live in MongoDB. Products, orders and customers are kept as JSON files — simple, portable, and easy to inspect.

---

## Getting started

### 1. Install dependencies

```bash
npm install
```

### 2. Create `.env.local`

```env
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=any_long_random_string
```

> `.env.local` is git-ignored — secrets are never committed.

### 3. Create an admin account

```bash
node scripts/create-admin.mjs
```

The script prints the email and password it created. Use them to log in at `/login`.

### 4. Run the development server

```bash
npm run dev
```

Open **http://localhost:3000** for the storefront and **http://localhost:3000/admin** for the dashboard.

---

## Project structure

```
app/
├── page.js                 # storefront (server component)
├── login/                  # login page
├── admin/                  # dashboard (protected by app/admin/layout.js)
│   ├── products/ orders/ customers/
│   ├── inventory/ notifications/ settings/
└── api/                    # route handlers (server)
    ├── auth/login/         # JWT login
    ├── settings/           # GET / PATCH store settings
    └── admin/              # products, orders, customers, upload

components/                 # UI (server + client)
lib/
├── db.js                   # JSON file storage (readData / writeData)
├── models/                 # Mongoose models
├── auth.js                 # createToken / verifyToken
├── settings.js             # settings helpers
├── format.js               # currency formatting
└── useCurrency.js          # client hook

data/db/                    # products.json, orders.json, customers.json
scripts/create-admin.mjs    # seed an admin account
```

---

## Architecture notes

- **Server components** read MongoDB / JSON files directly.
- **Client components** (`"use client"`) fetch data through API routes.
- **Page guard:** `app/admin/layout.js` verifies the cookie and redirects to `/login`.
- **API guard:** every `/api/admin/*` route returns `401` when the token is invalid.
- **Currency** goes through a single helper (`lib/format.js`), so one setting updates the whole app.

---

## Available scripts

| Command | Description |
|---|---|
| `npm run dev` | Start the dev server on port 3000 |
| `npm run build` | Production build |
| `npm start` | Run the production build |
| `npm run lint` | Run ESLint |

---

## Author

**Maaryam Saeed** — [GitHub](https://github.com/maaryammsaeed-cell)

Built as part of a full-stack development internship.
