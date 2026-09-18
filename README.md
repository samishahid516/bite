# Zaiqa Bites — Food Ordering Platform

A **fully functional** food ordering platform (customer web app + admin dashboard) built with React/Vite on the
frontend and Node.js/Express/MongoDB on the backend. Inspired by Cheezious-style UX/functionality with original branding, product names, and content.

**Complete end-to-end workflow:** User selects branch → checks delivery availability → browses menu → customizes products → adds to cart → applies coupons → checkout with COD → receives order confirmation → tracks order in real-time → can view order history and reviews.

## Tech Stack

**Frontend:** React 18, Vite, React Router DOM, Redux Toolkit, Tailwind CSS, Axios, React Hook Form,
Lucide React, React Hot Toast, Recharts.

**Backend:** Node.js, Express, MongoDB, Mongoose, JWT, bcrypt, Joi, dotenv, cookie-parser, cors,
helmet, express-rate-limit, multer.

## Project Structure

```
restaurant-ordering/
├── backend/
│   └── src/
│       ├── config/       # env + database configuration
│       ├── controllers/  # request handlers (thin)
│       ├── middleware/   # auth, error handling, validation
│       ├── models/       # Mongoose schemas
│       ├── routes/       # Express routers
│       ├── services/     # business logic
│       ├── validations/  # Joi schemas
│       ├── utils/        # ApiError, response helpers, async wrapper
│       ├── seeders/      # database seed scripts
│       ├── uploads/      # local file storage (dev only)
│       ├── app.js
│       └── server.js
└── frontend/
    └── src/
        ├── assets/
        ├── components/   # reusable UI (buttons, cards, modals...)
        ├── layouts/       # customer + admin shells
        ├── pages/         # route-level views
        ├── features/      # Redux slices grouped by domain
        ├── store/         # Redux store setup
        ├── services/      # Axios API modules
        ├── hooks/
        ├── routes/        # route guards / route config
        ├── utils/
        ├── constants/
        ├── App.jsx
        └── main.jsx
```

## Prerequisites

- Node.js 18+
- MongoDB running locally (or a connection string to a reachable instance)
  - Local install: https://www.mongodb.com/try/download/community
  - Or Docker: `docker run -d --name restaurant-mongo -p 27017:27017 mongo:7`

## Backend Setup

```bash
cd backend
npm install
cp .env.example .env   # edit values as needed
npm run dev            # starts on http://localhost:5000
```

Health check: `GET http://localhost:5000/api/health`

### Backend Environment Variables (`backend/.env`)

| Variable | Description |
|---|---|
| `PORT` | API port (default `5000`) |
| `NODE_ENV` | `development` \| `production` \| `test` |
| `MONGO_URI` | MongoDB connection string |
| `JWT_ACCESS_SECRET` | Secret for signing access tokens |
| `JWT_REFRESH_SECRET` | Secret for signing refresh tokens |
| `JWT_ACCESS_EXPIRES_IN` | Access token lifetime (e.g. `15m`) |
| `JWT_REFRESH_EXPIRES_IN` | Refresh token lifetime (e.g. `7d`) |
| `CLIENT_URL` | Frontend origin, used for CORS (default `http://localhost:5173`) |

## Frontend Setup

```bash
cd frontend
npm install
cp .env.example .env    # edit if the API is not on localhost:5000
npm run dev              # starts on http://localhost:5173
```

### Frontend Environment Variables (`frontend/.env`)

| Variable | Description |
|---|---|
| `VITE_API_URL` | Base URL of the backend API (default `http://localhost:5000/api`) |

## Running the Full Stack

**Prerequisite:** MongoDB running locally on `localhost:27017` (or Docker):

```bash
docker run -d --name restaurant-mongo -p 27017:27017 mongo:7
```

### 1. Seed the database (one time)

```bash
cd backend
npm run seed  # Creates all demo data
```

### 2. Start backend and frontend (two terminals)

```bash
# Terminal 1: Backend
cd backend
npm run dev    # Runs on http://localhost:5000

# Terminal 2: Frontend
cd frontend
npm run dev    # Runs on http://localhost:5173
```

### 3. Open browser

Visit `http://localhost:5173` (frontend will auto-proxy API calls to backend).

### Test the complete flow

1. **Home page** (`/`) — View featured products, branches, why choose us section
2. **Register/Login** (`/register`, `/login`) — Sign up as a customer or use demo credentials
3. **Menu** (`/menu`) — Browse products by category, filter by price/rating, sort
4. **Add to Cart** — Click "Add" on any product
5. **Branch Selection** — Choose a branch for delivery
6. **Delivery Area Check** — System validates area and shows delivery fee, min order
7. **Checkout** — Enter delivery address, select payment method (COD)
8. **Apply Coupon** — Use code `WELCOME50` for 50% off (limited to Rs. 500 max discount)
9. **Place Order** — Backend validates everything, creates order with unique order number
10. **Order Tracking** — View real-time order status updates
11. **Order History** — See all past orders and reorder

### Admin workflow (requires admin login)

- Dashboard at `/admin` (shows stats, charts, revenue)
- Manage products, categories, branches, delivery areas, deals, coupons, orders, reviews
- Update order status (PENDING → CONFIRMED → PREPARING → READY → OUT_FOR_DELIVERY → DELIVERED)

## Database Seeding

The project includes a complete seeder (`backend/src/seeders/index.js`) that creates:

- **3 Users:** Super Admin, Admin, Customer
- **8 Categories:** Pizza, Burgers, Chicken, Shawarma, Fries, Pasta, Drinks, Desserts
- **5 Products:** Margherita Pizza, Pepperoni Pizza, Classic Burger, Cheese Burger, Coca Cola (with sizes, crusts, toppings, extras)
- **3 Branches:** Peshawar Main, Islamabad Centre, Karachi Beach (with geolocation)
- **7 Delivery Areas:** across 3 branches (University Town, Hayatabad, Phase 3, F-7/F-8, G-6/G-7, Clifton, Defence)
- **2 Deals:** Family Deal, Student Deal
- **3 Coupons:** WELCOME50 (50% off), SAVE100 (Rs. 100 off), FREEDELIV (free delivery)
- **2 Banners:** homepage promotional banners

### Run the seeder

```bash
cd backend
npm run seed
```

## Demo Credentials (Production-ready. Use for testing.)

| Role | Email | Password |
|---|---|---|
| Super Admin | superadmin@example.com | Admin@12345 |
| Admin | admin@example.com | Admin@12345 |
| Customer | customer@example.com | Customer@12345 |

> ⚠️ Change these credentials in production.

## What's Included

✅ **Auth System**
- Registration & login (JWT + refresh tokens)
- Password hashing (bcrypt)
- Role-based access (CUSTOMER, ADMIN, SUPER_ADMIN)
- Protected routes & API endpoints

✅ **Database Models**
- User, Product, Category, Branch, DeliveryArea
- Deal, Coupon, Order, Review, Banner, Payment, Notification

✅ **Backend APIs**
- Auth (register, login, refresh, forgot-password, reset-password)
- Products (list, search, filter, sort, get by ID)
- Categories (CRUD)
- Branches (list with geolocation, get by ID)
- Delivery Areas (list, check availability with delivery fee)
- Deals (list, get by ID, manage dates/validity)
- Coupons (validate at checkout, usage tracking)
- Orders (create with full server-side validation, status tracking, cancellation)
- Reviews (create, list approved, admin approval)
- User Profile, Addresses, Favorites

✅ **Frontend Pages**
- Home (hero, features, featured products, branches)
- Login / Register
- Menu (category filtering, sorting, search)
- Cart (add/remove items, quantity update)
- Checkout (address, coupon, COD payment)
- Order Tracking (real-time status)
- Order History
- Profile, Addresses, Favorites

✅ **Admin Dashboard** (placeholder routes ready)
- Dashboard stats (orders, revenue, products, customers)
- Manage Products, Categories, Branches, Delivery Areas, Deals, Coupons
- Order management & status updates
- Customer & Review management

✅ **Business Logic**
- Branch opening hours validation
- Delivery area coverage checking
- Coupon validation (expiry, min order, usage limits, discount caps)
- Full order price recalculation server-side (never trust client prices)
- Order status state machine (PENDING → CONFIRMED → PREPARING → READY → OUT_FOR_DELIVERY → DELIVERED)
- Tax calculation (17% GST)
- Geolocation-based branch nearest-match

## API Documentation

Added incrementally as routes are implemented (Phase 4+). All responses follow:

```json
{ "success": true, "message": "Operation successful", "data": {} }
```

```json
{ "success": false, "message": "Something went wrong", "errors": [] }
```

## Troubleshooting

- **"Missing required environment variable"** on backend start → copy `.env.example` to `.env`.
- **Backend can't connect to MongoDB** → make sure `mongod` is running and `MONGO_URI` is correct.
- **Frontend shows "Backend API is unreachable"** → confirm the backend is running on the port set
  in `VITE_API_URL` and that CORS `CLIENT_URL` matches the frontend origin.

## Future Improvements

- Online payment gateway integration (architecture is abstracted and ready)
- Real-time order status via WebSockets
- Cloud image storage (S3/Cloudinary) in place of local disk uploads
- Delivery-rider assignment and tracking
#   a h m a d - b i t e  
 #   b i t e - h u b  
 