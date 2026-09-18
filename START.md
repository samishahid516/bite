# Quick Start Guide

## 1. Install MongoDB (if not running)

```bash
# Option A: Local install (download from mongodb.com)
mongod

# Option B: Docker
docker run -d --name restaurant-mongo -p 27017:27017 mongo:7
```

Verify connection: `mongodb://127.0.0.1:27017/restaurant_ordering`

## 2. Install dependencies

```bash
# Backend
cd backend && npm install

# Frontend (in a new terminal)
cd frontend && npm install
```

## 3. Seed the database (one-time)

```bash
cd backend
npm run seed
```

Expected output:
```
[seed] clearing collections...
[seed] creating users...
[seed] creating categories...
[seed] creating products...
[seed] creating branches...
[seed] creating delivery areas...
[seed] creating deals...
[seed] creating coupons...
[seed] creating banners...
[seed] ✓ database seeded successfully!
```

## 4. Start the backend

```bash
cd backend
npm run dev
```

Expected output:
```
[mongo] connected -> restaurant_ordering
[server] listening on http://localhost:5000 (development)
```

Test: Open `http://localhost:5000/api/health` in your browser or curl:
```bash
curl http://localhost:5000/api/health
```

## 5. Start the frontend (new terminal)

```bash
cd frontend
npm run dev
```

Expected output:
```
VITE v5.x.x ready in XXX ms

➜  Local:   http://localhost:5173/
```

## 6. Open the app

Visit **http://localhost:5173**

You should see:
- Navbar with "Zaiqa Bites" logo and cart icon
- Hero section "Delicious Food. Freshly Made. Delivered Fast."
- Featured products
- Branch listings

## 7. Test the complete flow

### Customer Workflow

1. **Register** → `/register`
   - Name: Test User
   - Email: testuser@example.com
   - Phone: 03001234567
   - Password: Password@123

2. **Or Login** → `/login`
   - Email: customer@example.com
   - Password: Customer@12345

3. **Browse Menu** → `/menu`
   - See all products (Margherita Pizza, Pepperoni Pizza, Burgers, Drinks)
   - Filter by category
   - Sort by popular, price, rating

4. **Add to Cart**
   - Click "Add" on any product
   - See cart count in navbar increase

5. **Go to Cart**
   - See items with prices
   - (Customization page coming in next iteration)

6. **Checkout** (when checkout route is live)
   - Select branch (Peshawar Main, Islamabad Centre, or Karachi Beach)
   - Verify delivery area (should show delivery fee)
   - Enter delivery address
   - Apply coupon code: `WELCOME50` (50% off, max Rs. 500 discount)
   - Select Cash on Delivery
   - Place order

7. **Order Confirmation**
   - See order number, items, total, delivery address
   - Track order status (PENDING → CONFIRMED → PREPARING → READY → OUT_FOR_DELIVERY → DELIVERED)

8. **Order History** → `/my-orders`
   - See all past orders
   - View details
   - Reorder or leave review

### Admin Workflow

1. **Login as Admin**
   - Email: admin@example.com
   - Password: Admin@12345

2. **Go to Admin Dashboard** → `/admin`
   - View today's orders, revenue, pending orders
   - See total products, active branches, active deals

3. **Manage Orders**
   - View all orders
   - Change status (PENDING → CONFIRMED → PREPARING → READY → OUT_FOR_DELIVERY → DELIVERED)
   - Cancel orders if needed

4. **Manage Products**
   - Create, edit, delete products
   - Upload images
   - Set prices, discounts, sizes, crusts, toppings

5. **Manage Branches, Delivery Areas, Deals, Coupons, Reviews**

## Demo Data

**Users:**
- Super Admin: superadmin@example.com / Admin@12345
- Admin: admin@example.com / Admin@12345
- Customer: customer@example.com / Customer@12345

**Branches:**
- Peshawar Main (Saddar)
- Islamabad Centre (F-7)
- Karachi Beach (Clifton)

**Products:**
- Margherita Pizza (Rs. 450 → Rs. 350 with discount)
- Pepperoni Pizza (Rs. 550 → Rs. 420)
- Classic Burger (Rs. 350 → Rs. 280)
- Cheese Burger (Rs. 420 → Rs. 330)
- Coca Cola (Rs. 100)

**Deals:**
- Family Deal: 2 Large Pizzas + Fries + Drink (Rs. 1600 → Rs. 1200)
- Student Deal: Medium Pizza + Burger + Drink (Rs. 800 → Rs. 599)

**Coupons:**
- `WELCOME50`: 50% off (max Rs. 500 discount)
- `SAVE100`: Rs. 100 off on orders above Rs. 1000
- `FREEDELIV`: Free delivery on orders above Rs. 1500

**Delivery Areas:**
- Peshawar: University Town, Hayatabad, Phase 3
- Islamabad: F-7/F-8, G-6/G-7
- Karachi: Clifton, Defence

## Troubleshooting

**Backend won't start:**
- Check MongoDB is running: `mongo` or Docker container
- Check `.env` has correct `MONGO_URI`
- Check port 5000 is not in use

**Frontend won't connect to backend:**
- Verify backend is running on port 5000
- Check browser console for CORS errors
- Verify `VITE_API_URL=http://localhost:5000/api` in `.env`

**Seeder fails:**
- Check MongoDB is empty (no existing `restaurant_ordering` database)
- Run `npm run seed` again after fixing issues

**Login doesn't work:**
- Make sure you seeded the database
- Use exact email/password from demo data

## Next Steps

1. **Complete the checkout flow** (currently stubbed)
2. **Add product customization modal** (sizes, crusts, toppings, extras with price updates)
3. **Build admin dashboard** with charts and analytics
4. **Add real-time notifications** via WebSockets for order status updates
5. **Implement image uploads** for product gallery
6. **Add payment gateway integration** (Stripe, Jazz Cash, Easypaisa)
7. **Deploy to production** (Vercel/Railway for frontend, Railway/Render for backend, MongoDB Atlas for DB)

## Support

See README.md for full documentation and API endpoints.
