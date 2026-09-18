# Deployment Guide — Backend on Railway, Frontend on Vercel

The old root `vercel.json` (now renamed to `vercel.json.deprecated`) used a
`"services"` key that isn't a real Vercel schema, and it tried to run the Express
backend as a Vercel serverless function even though `backend/src/server.js` calls
`app.listen()` directly — that combination would have failed to deploy. This guide
splits the two apps onto the hosts each is actually built for:

- **Backend** (Express + Mongoose, long-running process) → **Railway**
- **Frontend** (static Vite build) → **Vercel**

Both CLIs need an interactive browser login tied to your own account, so these steps
are for you to run yourself (I can guide you through any error output, but I can't log
into your Railway/Vercel accounts for you).

## 1. Deploy the backend to Railway

1. Install the CLI and log in:
   ```bash
   npm i -g @railway/cli
   railway login
   ```
2. From the `backend/` folder, create a new Railway project and deploy:
   ```bash
   cd backend
   railway init
   railway up
   ```
3. In the Railway dashboard, open the new service → **Variables**, and add exactly
   these (values from your local `backend/.env`):
   - `PORT` → `5000` (Railway also sets its own `PORT`; the app already reads
     `process.env.PORT`, so this is just a fallback)
   - `NODE_ENV` → `production`
   - `MONGO_URI` → your Atlas connection string (same one in `backend/.env`)
   - `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET` → same values as local `.env`
   - `JWT_ACCESS_EXPIRES_IN` → `15m`
   - `JWT_REFRESH_EXPIRES_IN` → `7d`
   - `CLIENT_URL` → leave as `http://localhost:5173` for now; you'll update this to
     your real Vercel URL in step 3 below.
4. In **Settings**, confirm the start command is `npm start` (already correct in
   `backend/package.json`) and note the generated public URL, e.g.
   `https://your-backend.up.railway.app`.
5. In MongoDB Atlas → **Network Access**, allow Railway's outbound IPs, or (simplest
   for now) allow `0.0.0.0/0`.
6. Verify: `curl https://your-backend.up.railway.app/api/health` should return
   `{"success":true,...}`.

## 2. Deploy the frontend to Vercel

1. Install the CLI and log in:
   ```bash
   npm i -g vercel
   vercel login
   ```
2. From the `frontend/` folder:
   ```bash
   cd frontend
   vercel
   ```
   Accept the defaults (framework: Vite). `frontend/vercel.json` (already added) makes
   client-side routing work by rewriting all paths to `index.html`.
3. In the Vercel project dashboard → **Settings → Environment Variables**, add:
   - `VITE_API_URL` → `https://your-backend.up.railway.app/api` (the Railway URL from
     step 1, with `/api` appended)
4. Redeploy so the env var takes effect:
   ```bash
   vercel --prod
   ```
5. Note the production URL, e.g. `https://your-frontend.vercel.app`.

## 3. Close the loop: update backend CORS

Go back to Railway → your backend service → **Variables**, and set:
- `CLIENT_URL` → `https://your-frontend.vercel.app` (your real Vercel URL from step 2)

Redeploy the backend service so `cors({ origin: env.clientUrl })` in
`backend/src/app.js` allows requests from the deployed frontend. Without this step,
the deployed frontend's API calls will fail with a CORS error even though the backend
itself is reachable.

## 4. Seed the production database (optional, one-time)

If you want the same demo data (users, products, branches, etc.) in your production
database, run the seeder once against the same `MONGO_URI` you gave Railway:

```bash
cd backend
MONGO_URI="<your Atlas URI>" npm run seed
```

Run this from your own machine (or `railway run npm run seed`) — running it more than
once wipes and recreates the collections, so don't run it against a database that
already has real customer data.

## 5. Verify end-to-end

- Open the Vercel URL in a browser.
- Log in with a seeded account (see `FIXES_AND_SETUP_REPORT.md` for demo credentials).
- Confirm the menu loads products, and a login/logout round-trip works without CORS
  errors in the browser console.
