# Project Timeline

## Customer Authentication with OTP — Storelo

| | |
|---|---|
| **Project** | Storelo E-Commerce Platform |
| **Feature** | Customer Authentication System (Email OTP) |
| **Prepared by** | [Your Name] |
| **Submitted to** | [Instructor Name] |
| **Date** | 18 November 2026 |
| **Duration** | 2 working days |
| **Status** | Planned |

---

## 1. Project Overview

Storelo is a Next.js e-commerce application with an existing admin panel. Customers can currently place orders as guests (name, email, phone and address only), but they cannot log in, view their order history, or save their details for future orders.

This task adds a **passwordless customer authentication system** using a one-time password (OTP) sent to the customer's email address. After verification, the customer receives a secure session and can view their past orders and have their checkout details filled in automatically.

The design follows the authentication pattern already used by the admin panel (signed JWT stored in an HTTP-only cookie), but keeps customer sessions fully separated from admin sessions.

---

## 2. Objectives

1. Allow customers to log in securely without creating or remembering a password.
2. Verify identity through a short-lived, single-use OTP.
3. Protect customer accounts against brute-force, replay and OTP-spam attacks.
4. Give logged-in customers access to their order history.
5. Pre-fill customer details at checkout to reduce effort and abandoned orders.
6. Keep guest checkout available so sales are not blocked by mandatory registration.

---

## 3. Scope

### In Scope

| # | Item |
|---|---|
| 1 | Customer model extension for authentication fields |
| 2 | OTP storage model with automatic expiry |
| 3 | OTP generation, hashing, verification and rate limiting |
| 4 | Email delivery of OTP |
| 5 | Login, verification, session and logout API endpoints |
| 6 | Customer login page with two-step OTP flow |
| 7 | "My Orders" page for logged-in customers |
| 8 | Navigation links for login and account access |
| 9 | Checkout pre-fill for logged-in customers |
| 10 | Security testing and production deployment |

### Out of Scope (Phase 2)

| # | Item |
|---|---|
| 1 | SMS or WhatsApp OTP delivery |
| 2 | Password-based login |
| 3 | Profile editing and address book |
| 4 | Multiple saved addresses |
| 5 | Active session management across devices |
| 6 | Social login (Google / Facebook) |
| 7 | Email template design and branding |

---

## 4. Technology Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router, Route Handlers) |
| Database | MongoDB with Mongoose |
| Session | JWT signed with `jose`, stored in HTTP-only cookie |
| OTP security | `crypto.randomInt`, SHA-256 hashing, constant-time comparison |
| Email delivery | Transactional email provider (Resend or Brevo) |
| Styling | Tailwind CSS (existing project setup) |

---

## 5. Schedule

### Day 1 — Backend and Authentication Logic

| # | Activity | Deliverable |
|---|---|---|
| 1 | Extend customer schema with verification, login and session-version fields | Updated `lib/models/Customer.js` |
| 2 | Create OTP collection with automatic expiry index | `lib/models/Otp.js` |
| 3 | Build OTP service: generation, hashing, verification, attempt limits, resend cooldown and daily limits | `lib/otp.js` |
| 4 | Integrate transactional email provider with a development fallback | `lib/mailer.js` |
| 5 | Build customer session helpers (token creation, session lookup) with a separate signing secret | `lib/customerAuth.js` |
| 6 | Implement OTP send, OTP verify, current-customer and logout endpoints | `app/api/auth/customer/**` |
| 7 | Verify the complete backend flow using API requests | Working backend flow |

**Day 1 outcome:** A customer can request an OTP and log in successfully through the API, with all security limits active.

### Day 2 — User Interface, Integration and Testing

| # | Activity | Deliverable |
|---|---|---|
| 1 | Build the login page: identifier step, six-digit OTP input with auto-advance and paste support, resend timer, error and loading states | `app/account/login/page.jsx`, `components/OtpForm.jsx` |
| 2 | Build the "My Orders" page with session protection and redirect for guests | `app/my-orders/page.js` |
| 3 | Add login and account links to the storefront navigation | `components/Landingnavbar.jsx`, `components/LandingTabBar.jsx` |
| 4 | Pre-fill checkout details for logged-in customers and protect saved data from being overwritten | `app/checkout/page.js`, `app/api/checkout/route.js` |
| 5 | Execute the full acceptance test matrix | Test results record |
| 6 | Configure production environment variables and deploy | Live feature |

**Day 2 outcome:** The feature is live, tested and usable by real customers.

---

## 6. Milestones

| Milestone | Target |
|---|---|
| M1 — Database models and indexes complete | Day 1 |
| M2 — OTP engine and rate limiting working | Day 1 |
| M3 — Authentication API endpoints complete | Day 1 |
| M4 — Login and My Orders pages complete | Day 2 |
| M5 — Checkout integration and testing complete | Day 2 |
| M6 — Production deployment | Day 2 |

---

## 7. Acceptance Criteria

The feature will be considered complete when all of the following pass:

| # | Test Case | Expected Result |
|---|---|---|
| 1 | New email requests an OTP | OTP delivered, login successful |
| 2 | Wrong OTP entered five times | OTP invalidated, further attempts blocked |
| 3 | OTP used after its validity period | Request rejected |
| 4 | New OTP requested, old OTP used | Old OTP rejected |
| 5 | Resend requested before cooldown ends | Request blocked |
| 6 | Daily send limit exceeded | Request blocked |
| 7 | Guest opens My Orders page | Redirected to login |
| 8 | Session invalidated after logout | Old token rejected |
| 9 | Guest places an order, then logs in | Order appears in order history |
| 10 | Logged-in customer opens checkout | Details pre-filled correctly |
| 11 | Admin logs in after customer login | Admin session unaffected |
| 12 | Session cookie inspected in production | HTTP-only and secure flags present |

---

## 8. Risks and Mitigation

| # | Risk | Impact | Mitigation |
|---|---|---|---|
| 1 | Email provider account or sender verification not ready | Email delivery delayed | Provider account and API key arranged before Day 1 |
| 2 | OTP emails delivered to spam folder | Customers cannot log in | SPF and DKIM records configured for the sending domain |
| 3 | Duplicate or missing phone numbers in existing customer data | Account linking issues | Email used as the primary identifier for this phase |
| 4 | Customer and admin sessions interfering | Security issue | Separate cookie names, signing secrets and role claims |
| 5 | OTP abuse through repeated requests | Provider cost and spam | Server-side cooldown, per-identifier and daily limits |
| 6 | Limited testing time | Defects reaching production | Test matrix completed before deployment; order history can move to Day 3 if required |

---

## 9. Assumptions and Dependencies

1. MongoDB database access and existing environment variables remain available.
2. A transactional email provider account is available with a verified sender address.
3. Email remains the primary customer identifier for this phase.
4. Guest checkout continues to operate alongside customer login.
5. The existing admin authentication flow must remain unchanged and functional.

---

## 10. Final Deliverables

1. Updated customer and OTP data models.
2. OTP service with security controls and email delivery.
3. Customer authentication API endpoints.
4. Customer login page with two-step OTP verification.
5. My Orders page for authenticated customers.
6. Checkout pre-fill integration.
7. Completed acceptance test record.
8. Deployed and verified production feature.

---

## 11. Approval

| Role | Name | Signature | Date |
|---|---|---|---|
| Prepared by | | | |
| Reviewed by | | | |
| Approved by | | | |
