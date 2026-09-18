# MongoDB → Supabase Migration

Date: 2026-09-18

The backend was fully migrated off MongoDB/Mongoose onto **Supabase** (hosted
Postgres). This replaces `FIXES_AND_SETUP_REPORT.md`'s MongoDB setup section for
everything database-related going forward.

## Why

The project originally used MongoDB Atlas for its database (see
`FIXES_AND_SETUP_REPORT.md`). That setup was fully working in production, but the
decision was made to move to Supabase specifically, so the entire data layer was
rewritten from a document store to a relational schema.

## What changed

### 1. Database engine
- **Before:** MongoDB Atlas, accessed via Mongoose ODM (`mongoose.connect`,
  schema models in `backend/src/models/`).
- **After:** Supabase-hosted Postgres, accessed via the `@supabase/supabase-js`
  REST client (`backend/src/config/db.js` exports a `supabase` client).
- The `backend/src/models/` directory (13 Mongoose schema files) was deleted —
  there's no ODM layer anymore; the schema lives in Postgres itself.

### 2. Schema
- `backend/supabase_schema.sql` (new file, ~300 lines) defines all 14 tables:
  `users`, `addresses`, `categories`, `branches`, `delivery_areas`,
  `inventory_items`, `products`, `user_favorites`, `deals`, `coupons`, `orders`,
  `payments`, `reviews`, `banners`, `notifications`.
- IDs are Postgres `uuid` (via `gen_random_uuid()`) instead of Mongo ObjectIds.
- Embedded Mongoose subdocuments (order line items, delivery address snapshot,
  product sizes/crusts/toppings/extras, deal product lists, order status history)
  are preserved as `jsonb` columns rather than being split into extra tables —
  same denormalized-snapshot design as the original schema, just stored as JSON
  inside Postgres instead of as embedded Mongo documents.
- Run once via the Supabase dashboard: **SQL Editor → New query → paste the
  whole file → Run.** Idempotent tables aren't re-created on a second run (it
  will error if run twice against a database that already has these tables,
  which is expected — it's a one-time setup script, not a migration tool).

### 3. Backend code
Every service, controller, and middleware file that touched the database was
rewritten:
- `backend/src/services/*.js` — all 12 service files converted from Mongoose
  queries (`Model.find()`, `.populate()`, etc.) to Supabase query builder calls
  (`supabase.from('table').select().eq()...`).
- `backend/src/controllers/{address,admin,user}Controller.js` and
  `backend/src/middleware/auth.js` — converted from importing Mongoose models
  to using the `supabase` client directly.
- `backend/src/utils/serialize.js` (new file) — `rowToDoc()` helper that
  converts Postgres's `snake_case` columns (e.g. `base_price`, `is_active`)
  into the `camelCase` shape (`basePrice`, `isActive`) the rest of the codebase
  and the frontend already expected, so no frontend changes were needed.
- `backend/src/utils/slugify.js` — `uniqueSlug()` now checks slug collisions
  against a Postgres table instead of a Mongoose model.
- `backend/src/seeders/index.js` — rewritten to insert demo data via Supabase
  instead of `Model.create()`.
- `backend/src/config/db.js` — exports the Supabase client instead of managing
  a Mongoose connection.
- `backend/src/config/env.js` — now requires `SUPABASE_URL` and
  `SUPABASE_SECRET_KEY` instead of `MONGO_URI`.
- `package.json` — added `@supabase/supabase-js`; Mongoose/MongoDB driver
  dependencies are no longer used by any code (left installed, harmless).

### 4. Bug found and fixed during the migration
Six Joi validation schemas (order, product, deal, review, and others) were still
validating ID fields as 24-character Mongo ObjectIds. Since Postgres uses UUIDs
(36 characters, different format), every request with a real ID would have
failed validation. Fixed across all 6 files — commit `c125734`.

### 5. Environment variables
`backend/.env` (local) and the Railway backend service's variables:

| Removed | Added |
|---|---|
| `MONGO_URI` | `SUPABASE_URL=https://lneurefrghzpqmwymosu.supabase.co` |
| | `SUPABASE_SECRET_KEY=sb_secret_...` (the **secret** key from Supabase → Settings → API → "Publishable and secret API keys" tab — not the `anon`/publishable key, and not the legacy `service_role` key) |

Everything else (`JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`, expiry settings,
`CLIENT_URL`, `NODE_ENV`, `PORT`) was unchanged.

## Verification performed

- Schema applied successfully to the Supabase project (verified via direct
  REST API queries against `users` and `orders`, not just the dashboard's
  success message).
- Seeder run against the live Supabase project — confirmed via API that
  `users`, `categories`, `products`, `branches`, `delivery_areas`, `deals`,
  `coupons`, and `banners` all contain the expected demo data.
- End-to-end local testing (by the session that did the code migration):
  login, profile, addresses, favorites, categories, products (with joined
  category data and computed `effectivePrice`), branches, deals, banners,
  coupon validation, full order creation (coupon discount + tax math,
  inventory deduction), order status lifecycle, and review creation on a
  delivered order.
- Production verification (Railway, after swapping env vars): health check,
  login, products, and categories all confirmed working against the live
  Supabase database, with CORS still correctly scoped to the deployed
  frontend and the frontend itself still serving correctly.

## Two notes for the future

- Two Supabase projects were created during this process
  (`jsuqrhnngmvuqyxvbake` and `lneurefrghzpqmwymosu`); only
  **`lneurefrghzpqmwymosu`** is in use. The other one has no data or schema
  applied to it and can be deleted from the Supabase dashboard if you don't
  need it.
- Supabase's Row Level Security (RLS) was not explicitly configured on these
  tables. The backend accesses Postgres using the **secret** key, which
  bypasses RLS entirely (equivalent to how the app always trusted its own
  server-side logic under MongoDB) — this is expected and fine as long as the
  secret key never reaches the frontend or a public repo. If direct
  client-side Supabase access is ever added later (bypassing this Express
  API), RLS policies would need to be written first.
