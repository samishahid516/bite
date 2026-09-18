import { connectDB, disconnectDB } from '../config/db.js'
import { User } from '../models/User.js'
import { Category } from '../models/Category.js'
import { Product } from '../models/Product.js'
import { Branch } from '../models/Branch.js'
import { DeliveryArea } from '../models/DeliveryArea.js'
import { Deal } from '../models/Deal.js'
import { Coupon } from '../models/Coupon.js'
import { Banner } from '../models/Banner.js'
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

async function seed() {
  await connectDB()

  console.log('[seed] clearing collections...')
  await Promise.all([
    User.deleteMany({}),
    Category.deleteMany({}),
    Product.deleteMany({}),
    Branch.deleteMany({}),
    DeliveryArea.deleteMany({}),
    Deal.deleteMany({}),
    Coupon.deleteMany({}),
    Banner.deleteMany({})
  ])

  console.log('[seed] creating users...')
  await User.create({
    name: 'Super Admin',
    email: 'superadmin@example.com',
    phone: '03001234567',
    password: 'Admin@12345',
    role: 'SUPER_ADMIN'
  })

  await User.create({
    name: 'Admin',
    email: 'admin@example.com',
    phone: '03411150099',
    password: 'Admin@12345',
    role: 'ADMIN'
  })

  await User.create({
    name: 'Customer',
    email: 'customer@example.com',
    phone: '03201234567',
    password: 'Customer@12345',
    role: 'CUSTOMER'
  })

  console.log('[seed] creating categories...')
  const categoryInputs = [
    { name: 'Burgers', description: 'Crunchy zinger, beef & shami burgers', image: IMAGES.burgerCategory, sortOrder: 1 },
    { name: 'Shawarma', description: 'Loaded chicken & beef shawarma rolls', image: IMAGES.shawarmaCategory, sortOrder: 2 },
    { name: 'Fries', description: 'Crispy masala & loaded fries', image: IMAGES.friesCategory, sortOrder: 3 },
    { name: 'Drinks', description: 'Ice-cold beverages', image: IMAGES.drinksCategory, sortOrder: 4 },
    { name: 'Nashta', description: 'Traditional Pakistani breakfast items', image: IMAGES.nashtaCategory, sortOrder: 5 }
  ].map((cat) => ({ ...cat, slug: slugify(cat.name) }))

  const categories = await Category.insertMany(categoryInputs)
  const burgerCat = categories[0]
  const shawarmaCat = categories[1]
  const friesCat = categories[2]
  const drinksCat = categories[3]
  const nashtaCat = categories[4]

  console.log('[seed] creating products...')
  const products = await Product.insertMany(
    [
      {
        name: 'Zinger Burger',
        description: 'Crispy fried chicken fillet burger with fresh lettuce & mayo',
        category: burgerCat._id,
        images: [IMAGES.zingerBurger],
        basePrice: 330,
        isFeatured: true,
        isPopular: true,
        rating: 4.7,
        reviewCount: 58
      },
      {
        name: 'Beef Burger',
        description: 'Juicy grilled beef patty with signature sauce',
        category: burgerCat._id,
        images: [IMAGES.beefBurger],
        basePrice: 300,
        isFeatured: true,
        isPopular: true,
        rating: 4.5,
        reviewCount: 41
      },
      {
        name: 'Chicken Patty Burger',
        description: 'Golden fried chicken patty burger, a customer favorite',
        category: burgerCat._id,
        images: [IMAGES.chickenPattyBurger],
        basePrice: 250,
        isPopular: true,
        rating: 4.4,
        reviewCount: 36
      },
      {
        name: 'Egg Shami Cheese Burger',
        description: 'Shami kabab patty, fried egg & melted cheese',
        category: burgerCat._id,
        images: [IMAGES.eggBurger],
        basePrice: 190,
        rating: 4.3,
        reviewCount: 22
      },
      {
        name: 'Double Egg Shami Burger',
        description: 'Double shami kabab patty topped with fried egg',
        category: burgerCat._id,
        images: [IMAGES.doubleBurger],
        basePrice: 180,
        rating: 4.2,
        reviewCount: 19
      },
      {
        name: 'Egg Shami Burger',
        description: 'Classic shami kabab patty with fried egg',
        category: burgerCat._id,
        images: [IMAGES.eggBurger],
        basePrice: 130,
        rating: 4.1,
        reviewCount: 27
      },
      {
        name: 'Chicken Shawarma',
        description: 'Grilled chicken strips wrapped with garlic sauce & veggies',
        category: shawarmaCat._id,
        images: [IMAGES.shawarmaWrap],
        basePrice: 160,
        isFeatured: true,
        isPopular: true,
        rating: 4.6,
        reviewCount: 49
      },
      {
        name: 'Dunger Shawarma',
        description: 'Extra loaded jumbo shawarma roll with double filling',
        category: shawarmaCat._id,
        images: [IMAGES.shawarmaStack],
        basePrice: 350,
        isFeatured: true,
        rating: 4.8,
        reviewCount: 33
      },
      {
        name: 'Masala Fries',
        description: 'Crispy fries tossed in tangy masala spice mix',
        category: friesCat._id,
        images: [IMAGES.masalaFries],
        basePrice: 180,
        rating: 4.3,
        reviewCount: 24
      },
      {
        name: 'Loaded Fries',
        description: 'Fries loaded with cheese sauce & spices',
        category: friesCat._id,
        images: [IMAGES.loadedFries],
        basePrice: 100,
        sizes: [{ name: 'Regular', price: 0 }, { name: 'Large', price: 50 }],
        isPopular: true,
        rating: 4.5,
        reviewCount: 30
      },
      {
        name: 'Soft Drink 500ml',
        description: 'Ice-cold soft drink, 500ml bottle',
        category: drinksCat._id,
        images: [IMAGES.softDrink],
        basePrice: 100,
        rating: 4.4,
        reviewCount: 20
      },
      {
        name: 'Nan Chanay',
        description: 'Soft tandoori naan served with spicy chickpea curry',
        category: nashtaCat._id,
        images: [IMAGES.naan],
        basePrice: 150,
        isFeatured: true,
        isPopular: true,
        rating: 4.6,
        reviewCount: 28
      },
      {
        name: 'Kofta Chanay',
        description: 'Chickpea curry loaded with soft meatballs, a nashta favorite',
        category: nashtaCat._id,
        images: [IMAGES.chanaCurry],
        basePrice: 180,
        rating: 4.4,
        reviewCount: 17
      },
      {
        name: 'Anda Chanay',
        description: 'Boiled egg served over spicy chickpea curry',
        category: nashtaCat._id,
        images: [IMAGES.eggCurry],
        basePrice: 160,
        rating: 4.3,
        reviewCount: 15
      },
      {
        name: 'Halwa Puri',
        description: 'Fluffy fried puri with sweet semolina halwa and chana curry',
        category: nashtaCat._id,
        images: [IMAGES.halwaPuri],
        basePrice: 200,
        isFeatured: true,
        isPopular: true,
        rating: 4.7,
        reviewCount: 34
      },
      {
        name: 'Aloo Paratha',
        description: 'Flaky hand-rolled paratha stuffed with spiced potato',
        category: nashtaCat._id,
        images: [IMAGES.paratha],
        basePrice: 140,
        isPopular: true,
        rating: 4.5,
        reviewCount: 26
      },
      {
        name: 'Lassi',
        description: 'Chilled, creamy sweet yogurt lassi served in a clay pot',
        category: nashtaCat._id,
        images: [IMAGES.lassi],
        basePrice: 120,
        rating: 4.6,
        reviewCount: 21
      },
      {
        name: 'Doodh Patti Chai',
        description: 'Rich, milky Pakistani tea brewed with loose leaf and spices',
        category: nashtaCat._id,
        images: [IMAGES.chai],
        basePrice: 80,
        isPopular: true,
        rating: 4.5,
        reviewCount: 31
      }
    ].map((p) => ({ ...p, slug: slugify(p.name) }))
  )

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
  const branches = await Branch.insertMany([
    {
      name: 'Ahmed bite',
      city: 'Lahore',
      area: 'Main Bazaar',
      address: 'Street Food Cart, Main Bazaar',
      phone: '0341-1150099',
      latitude: 31.5497,
      longitude: 74.3436,
      openingTime: '17:00',
      closingTime: '02:00',
      isActive: true
    },
    {
      name: 'Ahmad bite - Model Town',
      city: 'Lahore',
      area: 'Model Town',
      address: 'Model Town Link Road',
      phone: '0341-1150099',
      latitude: 31.4805,
      longitude: 74.3247,
      openingTime: '17:00',
      closingTime: '02:00',
      isActive: true
    }
  ])

  console.log('[seed] creating delivery areas...')
  await DeliveryArea.insertMany([
    { branch: branches[0]._id, name: 'Main Bazaar', deliveryFee: 50, minimumOrder: 150, estimatedDeliveryTime: '20-30 mins' },
    { branch: branches[0]._id, name: 'Gulberg', deliveryFee: 100, minimumOrder: 200, estimatedDeliveryTime: '30-40 mins' },
    { branch: branches[0]._id, name: 'Johar Town', deliveryFee: 120, minimumOrder: 200, estimatedDeliveryTime: '35-45 mins' },
    { branch: branches[1]._id, name: 'Model Town', deliveryFee: 50, minimumOrder: 150, estimatedDeliveryTime: '20-30 mins' },
    { branch: branches[1]._id, name: 'Township', deliveryFee: 100, minimumOrder: 200, estimatedDeliveryTime: '30-40 mins' }
  ])

  console.log('[seed] creating deals...')
  await Deal.insertMany(
    [
      {
        name: 'Deal 1 - Family Feast',
        description: '2 Zinger Burgers, 2 Shawarma, 1 Egg Shami Burger, 2 Reg Cold Drinks + 2 Reg Fries',
        image: IMAGES.zingerBurger,
        products: [
          { product: zingerBurger._id, quantity: 2 },
          { product: chickenShawarma._id, quantity: 2 },
          { product: eggShamiBurger._id, quantity: 1 },
          { product: softDrink._id, quantity: 2 },
          { product: loadedFries._id, quantity: 2, size: 'Regular' }
        ],
        originalPrice: 1380,
        discountPrice: 1150,
        startDate: new Date(),
        endDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
        isActive: true
      },
      {
        name: 'Deal 2 - Combo Special',
        description: '2 Zinger Burgers, 2 Shawarma, 2 Reg Cold Drinks + 2 Reg Fries',
        image: IMAGES.shawarmaStack,
        products: [
          { product: zingerBurger._id, quantity: 2 },
          { product: chickenShawarma._id, quantity: 2 },
          { product: softDrink._id, quantity: 2 },
          { product: loadedFries._id, quantity: 2, size: 'Regular' }
        ],
        originalPrice: 1260,
        discountPrice: 1050,
        startDate: new Date(),
        endDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
        isActive: true
      },
      {
        name: 'Deal 3 - Budget Bite',
        description: '2 Zinger Burgers, 2 Chicken Patty Burgers, 2 Reg Cold Drinks + 1 Reg Fries',
        image: IMAGES.chickenPattyBurger,
        products: [
          { product: zingerBurger._id, quantity: 2 },
          { product: chickenPattyBurger._id, quantity: 2 },
          { product: softDrink._id, quantity: 2 },
          { product: loadedFries._id, quantity: 1, size: 'Regular' }
        ],
        originalPrice: 660,
        discountPrice: 550,
        startDate: new Date(),
        endDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
        isActive: true
      },
      {
        name: 'Deal 4 - Loaded Duo',
        description: '2 Zinger Burgers + Fries, 1 Shawarma, 1 Egg Shami Burger, 1 Soft Drink 500ml + 2 Reg Fries',
        image: IMAGES.doubleBurger,
        products: [
          { product: zingerBurger._id, quantity: 2 },
          { product: chickenShawarma._id, quantity: 1 },
          { product: eggShamiBurger._id, quantity: 1 },
          { product: softDrink._id, quantity: 1 },
          { product: loadedFries._id, quantity: 2, size: 'Regular' }
        ],
        originalPrice: 1200,
        discountPrice: 1000,
        startDate: new Date(),
        endDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
        isActive: true
      }
    ].map((d) => ({ ...d, slug: slugify(d.name) }))
  )

  console.log('[seed] creating coupons...')
  await Coupon.insertMany([
    { code: 'WELCOME50', description: '50% off on first order', discountType: 'PERCENTAGE', discountValue: 50, maxDiscount: 200, minOrder: 200, expiryDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), usageLimit: 100, isActive: true },
    { code: 'SAVE50', description: 'Rs. 50 off on orders above 500', discountType: 'FIXED', discountValue: 50, minOrder: 500, expiryDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000), usageLimit: 200, isActive: true },
    { code: 'FREEDELIV', description: 'Free delivery on orders above 800', discountType: 'PERCENTAGE', discountValue: 100, maxDiscount: 150, minOrder: 800, expiryDate: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000), isActive: true }
  ])

  console.log('[seed] creating banners...')
  await Banner.insertMany([
    { title: 'Ahmad bite', subtitle: 'Crispy, crunchy & loaded with flavor', image: IMAGES.beefBurger, buttonText: 'Order Now', buttonUrl: '/menu', sortOrder: 1, isActive: true },
    { title: 'Hot Deals Everyday', subtitle: 'Combo deals starting at Rs. 550', image: IMAGES.shawarmaWrap, buttonText: 'View Deals', buttonUrl: '/menu', sortOrder: 2, isActive: true }
  ])

  console.log('[seed] ✓ database seeded successfully!')
  await disconnectDB()
}

seed().catch((err) => {
  console.error('[seed] error:', err)
  process.exit(1)
})
