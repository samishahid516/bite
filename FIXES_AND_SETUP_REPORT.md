# Fixes & Setup Report

Date: 2026-09-18

This replaces the older `BACKEND_FIX_GUIDE.md` and `START.md`, which claimed the *only*
problem was "MongoDB not running." That was true for that one symptom, but a full
read-through of the backend and frontend code found three additional real bugs, which
are fixed below. The old docs are left in place for now but are superseded by this file.

## 1. MongoDB connection — switched to your own Atlas cluster

- `backend/.env` previously pointed at a MongoDB Atlas cluster with someone else's
  live credentials hardcoded in the connection string.
- It now points at **your own** Atlas cluster (`cluster0.bg5l5zk.mongodb.net`, database
  `bite`), using the connection string you provided with your database user's password
  filled in.
- JWT signing secrets were also regenerated (random 32-byte hex values) instead of reusing
  the ones that shipped in the old `.env`.
- `backend/.env` is git-ignored (confirmed in `backend/.gitignore`), so none of this is
  committed to version control.
- Verified: `npm run dev` logs `[mongo] connected -> bite`, and `npm run seed` populated
  the database successfully (users, categories, products, branches, delivery areas,
  deals, coupons, banners).

## 2. Bugs found and fixed

### Bug A — Product reviews endpoint returned a double-nested, broken shape
**File:** `backend/src/controllers/productController.js`

`reviewService.listApprovedReviewsForProduct()` returns `{ reviews, pagination }`, but
the controller assigned that whole object to a variable called `reviews` and then wrapped
it again: `{ reviews: { reviews, pagination } }`. Any client expecting `data.reviews` to be
an array (as the naming implies) would get an object instead and crash on `.map()` the
moment a product-detail page called `GET /api/products/:id/reviews`.

**Fix:** destructure the service result properly and return `data.reviews` (array) and
`data.pagination` (object) separately.

### Bug B — Expired access tokens silently broke every API call after 15 minutes
**File:** `frontend/src/services/apiClient.js`

The access token expires after 15 minutes (`JWT_ACCESS_EXPIRES_IN=15m`). The only place a
refresh was attempted was once on page load. Any request made after 15 minutes into a
session (adding to cart, checking out, an admin action) failed with "Invalid or expired
token" and stayed broken until the user manually reloaded the page.

**Fix:** the axios response interceptor now catches a `401`, calls `POST /auth/refresh`
once (de-duplicated so concurrent requests share one refresh call), stores the new
access token, and retries the original request. If the refresh itself fails, the stale
token is cleared instead of retrying forever.

### Bug C — Logging out didn't actually invalidate the session
**Files:** `backend/src/services/authService.js`, `backend/src/controllers/authController.js`

The frontend calls `POST /auth/logout`, which only cleared the browser cookie — it never
invalidated the refresh token server-side (`user.refreshTokenVersion` was never bumped).
A separate, correct implementation existed at `POST /users/logout` but nothing in the
frontend called it, so refresh tokens stayed valid indefinitely after "logout."

**Fix:** `POST /auth/logout` now reads the refresh-token cookie, looks up the user, and
increments `refreshTokenVersion` (invalidating all outstanding refresh tokens for that
user) before clearing the cookie.

## 3. Things that were checked and are *not* broken

To avoid re-litigating settled ground, these were specifically verified and found correct:
route ordering (e.g. `/search` before `/:id`), Joi validation schemas against controller
usage across auth/order/product/coupon/inventory/address/favorite/deliveryArea, coupon and
order-total math, inventory deduction logic, CORS/port/env consistency between frontend and
backend, `vercel.json` rewrites, all `package.json` scripts, and `backend/src/seeders/index.js`
(runs cleanly against an empty database). The previously-reported "banner routes stub" no
longer exists — banner CRUD is fully implemented.

## 4. Known gaps (not fixed, flagged for awareness)

- **No automated tests exist.** `jest`, `supertest`, and `mongodb-memory-server` are
  installed as dev dependencies but there are zero test files (`npm test` reports "No
  tests found"). Testing today is manual/API-level only.
- `backend/src/controllers/addressController.js` (`updateAddress`) replaces a Mongoose
  subdocument with a plain object spread instead of `Object.assign`. It works in practice
  but is a fragile pattern — flagged for a future cleanup, not fixed here since it isn't
  currently causing incorrect behavior.

## 5. Local verification performed

- `backend`: `npm run dev` → connects to Mongo, listens on `:5000`.
- `backend`: `npm run seed` → seeds all demo collections successfully.
- `backend`: `npm test` → no test files present (see gap above).
- `frontend`: `npm run dev` → serves on `:5173`, loads.
- `frontend`: `npm run build` → production build succeeds with no errors.
- Manually exercised via `curl` against the running backend:
  - `GET /api/health` → 200
  - `POST /api/auth/login` (seeded customer) → 200, returns access token
  - `POST /api/auth/logout` → 200, now bumps `refreshTokenVersion`
  - `GET /api/products`, `/api/categories`, `/api/branches` → 200 with real seeded data
  - `GET /api/products/:id/reviews` → now returns `{ reviews: [], pagination: {...} }`
    instead of the previous double-nested shape

## Demo credentials (seeded data, for local testing only)

| Role | Email | Password |
|---|---|---|
| Super Admin | superadmin@example.com | Admin@12345 |
| Admin | admin@example.com | Admin@12345 |
| Customer | customer@example.com | Customer@12345 |

## Running it yourself

```bash
# Backend
cd backend
npm install
npm run seed     # one-time, populates demo data
npm run dev       # http://localhost:5000

# Frontend (separate terminal)
cd frontend
npm install
npm run dev       # http://localhost:5173
```

`backend/.env` already contains your MongoDB Atlas connection string and JWT secrets —
no MongoDB installation needed locally.

## Deployment

Not done yet — deploying commits your project to real cloud infrastructure (hosting,
DNS, possibly billing), so it needs your explicit go-ahead and a couple of decisions
first (see the follow-up message).
