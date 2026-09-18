import bcrypt from 'bcrypt'
import { connectDB, disconnectDB, supabase } from '../config/db.js'
import { slugify } from '../utils/slugify.js'

// Real, verified stock photos (Pexels / Pixabay / Unsplash) used as dummy product images
const IMAGES = {
  zingerBurger: 'https://images.pexels.com/photos/11354334/pexels-photo-11354334.jpeg?w=800',
  beefBurger: 'https://cdn.pixabay.com/photo/2016/03/05/19/02/hamburger-1238246_1280.jpg',
  chickenPattyBurger: 'https://images.pexels.com/photos/1639557/pexels-photo-1639557.jpeg?w=800',
  eggBurger: 'https://images.pexels.com/photos/2293537/pexels-photo-2293537.jpeg?w=800',
  doubleBurger: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=800',
  shawarmaWrap: 'https://images.pexels.com/photos/28897047/pexels-photo-28897047.jpeg?w=800',
  shawarmaStack: 'https://images.pexels.com/photos/6416559/pexels-photo-6416559.jpeg?w=800',
  masalaFries: 'https://images.pexels.com/photos/11485199/pexels-photo-11485199.jpeg?w=800',
  loadedFries: 'https://images.pexels.com/photos/983296/pexels-photo-983296.jpeg?w=800',
  softDrink: 'https://images.pexels.com/photos/8880742/pexels-photo-8880742.jpeg?w=800',
  burgerCategory: 'https://cdn.pixabay.com/photo/2016/03/05/19/02/hamburger-1238246_1280.jpg',
  shawarmaCategory: 'https://images.pexels.com/photos/6416559/pexels-photo-6416559.jpeg?w=800',
  friesCategory: 'https://images.pexels.com/photos/11485199/pexels-photo-11485199.jpeg?w=800',
  drinksCategory: 'https://images.pexels.com/photos/8880742/pexels-photo-8880742.jpeg?w=800',
  naan: 'https://images.pexels.com/photos/20446413/pexels-photo-20446413.jpeg?w=800',
  chanaCurry: 'https://images.pexels.com/photos/9287035/pexels-photo-9287035.jpeg?w=800',
  eggCurry: 'https://images.pexels.com/photos/35267285/pexels-photo-35267285.jpeg?w=800',
  halwaPuri: 'https://images.pexels.com/photos/36388454/pexels-photo-36388454.jpeg?w=800',
  nashtaCategory: 'https://images.pexels.com/photos/37336727/pexels-photo-37336727.jpeg?w=800',
  paratha: 'https://images.pexels.com/photos/35079296/pexels-photo-35079296.jpeg?w=800',
  lassi: 'https://images.pexels.com/photos/6808666/pexels-photo-6808666.jpeg?w=800',
  chai: 'https://images.pexels.com/photos/16942969/pexels-photo-16942969.jpeg?w=800'
}

// PostgREST bulk inserts derive columns from the union of keys across all rows
// in the batch, then send an explicit NULL for any row missing a key --
// it does NOT fall back to that column's DB default per-row. So every row in
// a batch must explicitly repeat array/jsonb defaults, or later rows in the
// same insert() call violate their NOT NULL constraint.
const ARRAY_DEFAULTS = {
  images: [],
  sizes: [],
  crusts: [],
  toppings: [],
  extras: [],
  ingredients: [],
  recipe: [],
  products: [],
  status_history: [],
  is_featured: false,
  is_popular: false,
  is_available: true,
  is_active: true,
  rating: 0,
  review_count: 0,
  used_count: 0,
  sort_order: 0,
  coupon_discount: 0
}

async function insert(table, rows) {
  const allKeys = new Set(rows.flatMap((row) => Object.keys(row)))
  const withDefaults = rows.map((row) => {
    const filled = { ...row }
    for (const key of allKeys) {
      if (!(key in filled) && key in ARRAY_DEFAULTS) {
        filled[key] = ARRAY_DEFAULTS[key]
      }
    }
    return filled
  })

  const { data, error } = await supabase.from(table).insert(withDefaults).select('*')
  if (error) throw new Error(`[seed] failed inserting into ${table}: ${error.message}`)
  return data
}

async function clearAll() {
  // Delete in FK-safe (child-first) order.
  const tables = [
    'reviews',
    'notifications',
    'payments',
    'orders',
    'user_favorites',
    'addresses',
    'deals',
    'delivery_areas',
    'products',
    'branches',
    'coupons',
    'banners',
    'categories',
    'inventory_items',
    'users'
  ]
  for (const table of tables) {
    const filterColumn = table === 'user_favorites' ? 'user_id' : 'id'
    const { error } = await supabase.from(table).delete().neq(filterColumn, '00000000-0000-0000-0000-000000000000')
    if (error) throw new Error(`[seed] failed clearing ${table}: ${error.message}`)
  }
}

async function seed() {
  await connectDB()

  console.log('[seed] clearing tables...')
  await clearAll()

  console.log('[seed] creating users...')
  const hashedAdmin = await bcrypt.hash('Admin@12345', 12)
  const hashedCustomer = await bcrypt.hash('Customer@12345', 12)

  await insert('users', [
    { name: 'Super Admin', email: 'superadmin@example.com', phone: '03001234567', password: hashedAdmin, role: 'SUPER_ADMIN' },
    { name: 'Admin', email: 'admin@example.com', phone: '03411150099', password: hashedAdmin, role: 'ADMIN' },
    { name: 'Customer', email: 'customer@example.com', phone: '03201234567', password: hashedCustomer, role: 'CUSTOMER' }
  ])

  console.log('[seed] creating categories...')
  const categoryInputs = [
    { name: 'Burgers', description: 'Crunchy zinger, beef & shami burgers', image: IMAGES.burgerCategory, sort_order: 1 },
    { name: 'Shawarma', description: 'Loaded chicken & beef shawarma rolls', image: IMAGES.shawarmaCategory, sort_order: 2 },
    { name: 'Fries', description: 'Crispy masala & loaded fries', image: IMAGES.friesCategory, sort_order: 3 },
    { name: 'Drinks', description: 'Ice-cold beverages', image: IMAGES.drinksCategory, sort_order: 4 },
    { name: 'Nashta', description: 'Traditional Pakistani breakfast items', image: IMAGES.nashtaCategory, sort_order: 5 }
  ].map((cat) => ({ ...cat, slug: slugify(cat.name) }))

  const categories = await insert('categories', categoryInputs)
  const burgerCat = categories[0]
  const shawarmaCat = categories[1]
  const friesCat = categories[2]
  const drinksCat = categories[3]
  const nashtaCat = categories[4]

  console.log('[seed] creating products...')
  const productInputs = [
    {
      name: 'Zinger Burger',
      description: 'Crispy fried chicken fillet burger with fresh lettuce & mayo',
      category_id: burgerCat.id,
      images: [IMAGES.zingerBurger],
      base_price: 330,
      is_featured: true,
      is_popular: true,
      rating: 4.7,
      review_count: 58
    },
    {
      name: 'Beef Burger',
      description: 'Juicy grilled beef patty with signature sauce',
      category_id: burgerCat.id,
      images: [IMAGES.beefBurger],
      base_price: 300,
      is_featured: true,
      is_popular: true,
      rating: 4.5,
      review_count: 41
    },
    {
      name: 'Chicken Patty Burger',
      description: 'Golden fried chicken patty burger, a customer favorite',
      category_id: burgerCat.id,
      images: [IMAGES.chickenPattyBurger],
      base_price: 250,
      is_popular: true,
      rating: 4.4,
      review_count: 36
    },
    {
      name: 'Egg Shami Cheese Burger',
      description: 'Shami kabab patty, fried egg & melted cheese',
      category_id: burgerCat.id,
      images: [IMAGES.eggBurger],
      base_price: 190,
      rating: 4.3,
      review_count: 22
    },
    {
      name: 'Double Egg Shami Burger',
      description: 'Double shami kabab patty topped with fried egg',
      category_id: burgerCat.id,
      images: [IMAGES.doubleBurger],
      base_price: 180,
      rating: 4.2,
      review_count: 19
    },
    {
      name: 'Egg Shami Burger',
      description: 'Classic shami kabab patty with fried egg',
      category_id: burgerCat.id,
      images: [IMAGES.eggBurger],
      base_price: 130,
      rating: 4.1,
      review_count: 27
    },
    {
      name: 'Chicken Shawarma',
      description: 'Grilled chicken strips wrapped with garlic sauce & veggies',
      category_id: shawarmaCat.id,
      images: [IMAGES.shawarmaWrap],
      base_price: 160,
      is_featured: true,
      is_popular: true,
      rating: 4.6,
      review_count: 49
    },
    {
      name: 'Dunger Shawarma',
      description: 'Extra loaded jumbo shawarma roll with double filling',
      category_id: shawarmaCat.id,
      images: [IMAGES.shawarmaStack],
      base_price: 350,
      is_featured: true,
      rating: 4.8,
      review_count: 33
    },
    {
      name: 'Masala Fries',
      description: 'Crispy fries tossed in tangy masala spice mix',
      category_id: friesCat.id,
      images: [IMAGES.masalaFries],
      base_price: 180,
      rating: 4.3,
      review_count: 24
    },
    {
      name: 'Loaded Fries',
      description: 'Fries loaded with cheese sauce & spices',
      category_id: friesCat.id,
      images: [IMAGES.loadedFries],
      base_price: 100,
      sizes: [{ name: 'Regular', price: 0 }, { name: 'Large', price: 50 }],
      is_popular: true,
      rating: 4.5,
      review_count: 30
    },
    {
      name: 'Soft Drink 500ml',
      description: 'Ice-cold soft drink, 500ml bottle',
      category_id: drinksCat.id,
      images: [IMAGES.softDrink],
      base_price: 100,
      rating: 4.4,
      review_count: 20
    },
    {
      name: 'Nan Chanay',
      description: 'Soft tandoori naan served with spicy chickpea curry',
      category_id: nashtaCat.id,
      images: [IMAGES.naan],
      base_price: 150,
      is_featured: true,
      is_popular: true,
      rating: 4.6,
      review_count: 28
    },
    {
      name: 'Kofta Chanay',
      description: 'Chickpea curry loaded with soft meatballs, a nashta favorite',
      category_id: nashtaCat.id,
      images: [IMAGES.chanaCurry],
      base_price: 180,
      rating: 4.4,
      review_count: 17
    },
    {
      name: 'Anda Chanay',
      description: 'Boiled egg served over spicy chickpea curry',
      category_id: nashtaCat.id,
      images: [IMAGES.eggCurry],
      base_price: 160,
      rating: 4.3,
      review_count: 15
    },
    {
      name: 'Halwa Puri',
      description: 'Fluffy fried puri with sweet semolina halwa and chana curry',
      category_id: nashtaCat.id,
      images: [IMAGES.halwaPuri],
      base_price: 200,
      is_featured: true,
      is_popular: true,
      rating: 4.7,
      review_count: 34
    },
    {
      name: 'Aloo Paratha',
      description: 'Flaky hand-rolled paratha stuffed with spiced potato',
      category_id: nashtaCat.id,
      images: [IMAGES.paratha],
      base_price: 140,
      is_popular: true,
      rating: 4.5,
      review_count: 26
    },
    {
      name: 'Lassi',
      description: 'Chilled, creamy sweet yogurt lassi served in a clay pot',
      category_id: nashtaCat.id,
      images: [IMAGES.lassi],
      base_price: 120,
      rating: 4.6,
      review_count: 21
    },
    {
      name: 'Doodh Patti Chai',
      description: 'Rich, milky Pakistani tea brewed with loose leaf and spices',
      category_id: nashtaCat.id,
      images: [IMAGES.chai],
      base_price: 80,
      is_popular: true,
      rating: 4.5,
      review_count: 31
    }
  ].map((p) => ({ ...p, slug: slugify(p.name) }))

  const products = await insert('products', productInputs)

  const [
    zingerBurger,
    ,
    chickenPattyBurger,
    ,
    ,
    eggShamiBurger,
    chickenShawarma,
    ,
    ,
    loadedFries,
    softDrink
  ] = products

  console.log('[seed] creating branches...')
  const branches = await insert('branches', [
    {
      name: 'Ahmed bite',
      city: 'Lahore',
      area: 'Main Bazaar',
      address: 'Street Food Cart, Main Bazaar',
      phone: '0341-1150099',
      latitude: 31.5497,
      longitude: 74.3436,
      opening_time: '17:00',
      closing_time: '02:00',
      is_active: true
    },
    {
      name: 'Ahmad bite - Model Town',
      city: 'Lahore',
      area: 'Model Town',
      address: 'Model Town Link Road',
      phone: '0341-1150099',
      latitude: 31.4805,
      longitude: 74.3247,
      opening_time: '17:00',
      closing_time: '02:00',
      is_active: true
    }
  ])

  console.log('[seed] creating delivery areas...')
  await insert('delivery_areas', [
    { branch_id: branches[0].id, name: 'Main Bazaar', delivery_fee: 50, minimum_order: 150, estimated_delivery_time: '20-30 mins' },
    { branch_id: branches[0].id, name: 'Gulberg', delivery_fee: 100, minimum_order: 200, estimated_delivery_time: '30-40 mins' },
    { branch_id: branches[0].id, name: 'Johar Town', delivery_fee: 120, minimum_order: 200, estimated_delivery_time: '35-45 mins' },
    { branch_id: branches[1].id, name: 'Model Town', delivery_fee: 50, minimum_order: 150, estimated_delivery_time: '20-30 mins' },
    { branch_id: branches[1].id, name: 'Township', delivery_fee: 100, minimum_order: 200, estimated_delivery_time: '30-40 mins' }
  ])

  console.log('[seed] creating deals...')
  await insert(
    'deals',
    [
      {
        name: 'Deal 1 - Family Feast',
        description: '2 Zinger Burgers, 2 Shawarma, 1 Egg Shami Burger, 2 Reg Cold Drinks + 2 Reg Fries',
        image: IMAGES.zingerBurger,
        products: [
          { product: zingerBurger.id, quantity: 2 },
          { product: chickenShawarma.id, quantity: 2 },
          { product: eggShamiBurger.id, quantity: 1 },
          { product: softDrink.id, quantity: 2 },
          { product: loadedFries.id, quantity: 2, size: 'Regular' }
        ],
        original_price: 1380,
        discount_price: 1150,
        start_date: new Date().toISOString(),
        end_date: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(),
        is_active: true
      },
      {
        name: 'Deal 2 - Combo Special',
        description: '2 Zinger Burgers, 2 Shawarma, 2 Reg Cold Drinks + 2 Reg Fries',
        image: IMAGES.shawarmaStack,
        products: [
          { product: zingerBurger.id, quantity: 2 },
          { product: chickenShawarma.id, quantity: 2 },
          { product: softDrink.id, quantity: 2 },
          { product: loadedFries.id, quantity: 2, size: 'Regular' }
        ],
        original_price: 1260,
        discount_price: 1050,
        start_date: new Date().toISOString(),
        end_date: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(),
        is_active: true
      },
      {
        name: 'Deal 3 - Budget Bite',
        description: '2 Zinger Burgers, 2 Chicken Patty Burgers, 2 Reg Cold Drinks + 1 Reg Fries',
        image: IMAGES.chickenPattyBurger,
        products: [
          { product: zingerBurger.id, quantity: 2 },
          { product: chickenPattyBurger.id, quantity: 2 },
          { product: softDrink.id, quantity: 2 },
          { product: loadedFries.id, quantity: 1, size: 'Regular' }
        ],
        original_price: 660,
        discount_price: 550,
        start_date: new Date().toISOString(),
        end_date: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(),
        is_active: true
      },
      {
        name: 'Deal 4 - Loaded Duo',
        description: '2 Zinger Burgers + Fries, 1 Shawarma, 1 Egg Shami Burger, 1 Soft Drink 500ml + 2 Reg Fries',
        image: IMAGES.doubleBurger,
        products: [
          { product: zingerBurger.id, quantity: 2 },
          { product: chickenShawarma.id, quantity: 1 },
          { product: eggShamiBurger.id, quantity: 1 },
          { product: softDrink.id, quantity: 1 },
          { product: loadedFries.id, quantity: 2, size: 'Regular' }
        ],
        original_price: 1200,
        discount_price: 1000,
        start_date: new Date().toISOString(),
        end_date: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(),
        is_active: true
      }
    ].map((d) => ({ ...d, slug: slugify(d.name) }))
  )

  console.log('[seed] creating coupons...')
  await insert('coupons', [
    { code: 'WELCOME50', description: '50% off on first order', discount_type: 'PERCENTAGE', discount_value: 50, max_discount: 200, min_order: 200, expiry_date: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(), usage_limit: 100, is_active: true },
    { code: 'SAVE50', description: 'Rs. 50 off on orders above 500', discount_type: 'FIXED', discount_value: 50, min_order: 500, expiry_date: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString(), usage_limit: 200, is_active: true },
    { code: 'FREEDELIV', description: 'Free delivery on orders above 800', discount_type: 'PERCENTAGE', discount_value: 100, max_discount: 150, min_order: 800, expiry_date: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000).toISOString(), is_active: true }
  ])

  console.log('[seed] creating banners...')
  await insert('banners', [
    { title: 'Ahmad bite', subtitle: 'Crispy, crunchy & loaded with flavor', image: IMAGES.beefBurger, button_text: 'Order Now', button_url: '/menu', sort_order: 1, is_active: true },
    { title: 'Hot Deals Everyday', subtitle: 'Combo deals starting at Rs. 550', image: IMAGES.shawarmaWrap, button_text: 'View Deals', button_url: '/menu', sort_order: 2, is_active: true }
  ])

  console.log('[seed] ✓ database seeded successfully!')
  await disconnectDB()
}

seed().catch((err) => {
  console.error('[seed] error:', err)
  process.exit(1)
})
