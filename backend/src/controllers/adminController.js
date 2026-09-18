import { Order } from '../models/Order.js'
import { Product } from '../models/Product.js'
import { User } from '../models/User.js'
import { Deal } from '../models/Deal.js'
import { Coupon } from '../models/Coupon.js'
import { Branch } from '../models/Branch.js'
import { DeliveryArea } from '../models/DeliveryArea.js'
import { Review } from '../models/Review.js'
import * as orderService from '../services/orderService.js'
import { asyncHandler } from '../utils/asyncHandler.js'
import { sendSuccess } from '../utils/apiResponse.js'

export const getDashboardStats = asyncHandler(async (req, res) => {
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const tomorrow = new Date(today)
  tomorrow.setDate(tomorrow.getDate() + 1)

  // Today's stats
  const todayOrders = await Order.countDocuments({
    createdAt: { $gte: today, $lt: tomorrow }
  })

  const todayOrdersData = await Order.aggregate([
    {
      $match: { createdAt: { $gte: today, $lt: tomorrow } }
    },
    {
      $group: {
        _id: null,
        totalRevenue: { $sum: '$total' }
      }
    }
  ])

  const todayRevenue = todayOrdersData.length > 0 ? todayOrdersData[0].totalRevenue : 0

  // Pending orders (all time)
  const pendingOrders = await Order.countDocuments({
    orderStatus: { $in: ['PENDING', 'CONFIRMED', 'PREPARING', 'READY', 'OUT_FOR_DELIVERY'] }
  })

  // Overall stats
  const totalProducts = await Product.countDocuments()
  const activeDeals = await Deal.countDocuments({ isActive: true })
  const activeCoupons = await Coupon.countDocuments({ isActive: true })
  const totalCustomers = await User.countDocuments({ role: 'CUSTOMER' })
  const totalBranches = await Branch.countDocuments()
  const totalDeliveryAreas = await DeliveryArea.countDocuments()
  const pendingReviews = await Review.countDocuments({ isApproved: false })

  // Overall revenue stats
  const overallStats = await Order.aggregate([
    {
      $group: {
        _id: null,
        totalOrders: { $sum: 1 },
        totalRevenue: { $sum: '$total' },
        averageOrderValue: { $avg: '$total' }
      }
    }
  ])

  const totalOrders = overallStats.length > 0 ? overallStats[0].totalOrders : 0
  const totalRevenue = overallStats.length > 0 ? overallStats[0].totalRevenue : 0
  const averageOrderValue = overallStats.length > 0 ? overallStats[0].averageOrderValue : 0

  sendSuccess(res, {
    message: 'Dashboard stats fetched',
    data: {
      today: { todayOrders, todayRevenue },
      overall: {
        totalOrders,
        totalRevenue,
        averageOrderValue,
        pendingOrders,
        totalProducts,
        totalCustomers,
        totalBranches,
        totalDeliveryAreas,
        activeDeals,
        activeCoupons,
        pendingReviews
      }
    }
  })
})

export const getSalesReport = asyncHandler(async (req, res) => {
  const { dateFrom, dateTo, groupBy = 'daily' } = req.query

  const matchStage = {}
  if (dateFrom || dateTo) {
    matchStage.createdAt = {}
    if (dateFrom) matchStage.createdAt.$gte = new Date(dateFrom)
    if (dateTo) {
      const dateTo_obj = new Date(dateTo)
      dateTo_obj.setHours(23, 59, 59, 999)
      matchStage.createdAt.$lte = dateTo_obj
    }
  }

  let groupStage
  if (groupBy === 'weekly') {
    groupStage = {
      $group: {
        _id: {
          week: { $week: '$createdAt' },
          year: { $year: '$createdAt' }
        },
        totalOrders: { $sum: 1 },
        totalRevenue: { $sum: '$total' },
        averageOrderValue: { $avg: '$total' }
      }
    }
  } else if (groupBy === 'monthly') {
    groupStage = {
      $group: {
        _id: {
          month: { $month: '$createdAt' },
          year: { $year: '$createdAt' }
        },
        totalOrders: { $sum: 1 },
        totalRevenue: { $sum: '$total' },
        averageOrderValue: { $avg: '$total' }
      }
    }
  } else {
    // daily
    groupStage = {
      $group: {
        _id: {
          date: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }
        },
        totalOrders: { $sum: 1 },
        totalRevenue: { $sum: '$total' },
        averageOrderValue: { $avg: '$total' }
      }
    }
  }

  const pipeline = [{ $match: matchStage }, groupStage, { $sort: { _id: 1 } }]

  const report = await Order.aggregate(pipeline)

  sendSuccess(res, { message: 'Sales report fetched', data: { report, groupBy } })
})

export const getTopProducts = asyncHandler(async (req, res) => {
  const limit = Math.min(parseInt(req.query.limit) || 20, 100)

  const topProducts = await Order.aggregate([
    { $unwind: '$items' },
    {
      $group: {
        _id: '$items.product',
        totalSold: { $sum: '$items.quantity' },
        totalRevenue: { $sum: '$items.totalPrice' },
        averagePrice: { $avg: '$items.unitPrice' }
      }
    },
    { $sort: { totalSold: -1 } },
    { $limit: limit },
    {
      $lookup: {
        from: 'products',
        localField: '_id',
        foreignField: '_id',
        as: 'product'
      }
    },
    { $unwind: '$product' }
  ])

  sendSuccess(res, { message: 'Top products fetched', data: { products: topProducts } })
})

export const getCustomers = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1
  const limit = Math.min(parseInt(req.query.limit) || 20, 100)
  const search = req.query.search || ''

  const filter = { role: 'CUSTOMER' }
  if (search) {
    filter.$or = [
      { name: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } },
      { phone: { $regex: search, $options: 'i' } }
    ]
  }

  const [customers, total] = await Promise.all([
    User.find(filter)
      .select('name email phone isActive createdAt')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit),
    User.countDocuments(filter)
  ])

  sendSuccess(res, {
    message: 'Customers fetched',
    data: {
      customers,
      pagination: { page, limit, total, totalPages: Math.max(1, Math.ceil(total / limit)) }
    }
  })
})

export const listAllProducts = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1
  const limit = Math.min(parseInt(req.query.limit) || 20, 100)

  const [products, total] = await Promise.all([
    Product.find()
      .populate('category', 'name')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit),
    Product.countDocuments()
  ])

  sendSuccess(res, {
    message: 'Products fetched',
    data: {
      products,
      pagination: { page, limit, total, totalPages: Math.max(1, Math.ceil(total / limit)) }
    }
  })
})

export const listAllCategories = asyncHandler(async (req, res) => {
  const { Category } = await import('../models/Category.js')

  const page = parseInt(req.query.page) || 1
  const limit = Math.min(parseInt(req.query.limit) || 20, 100)

  const [categories, total] = await Promise.all([
    Category.find()
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit),
    Category.countDocuments()
  ])

  sendSuccess(res, {
    message: 'Categories fetched',
    data: {
      categories,
      pagination: { page, limit, total, totalPages: Math.max(1, Math.ceil(total / limit)) }
    }
  })
})

export const listAllBranches = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1
  const limit = Math.min(parseInt(req.query.limit) || 20, 100)

  const [branches, total] = await Promise.all([
    Branch.find()
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit),
    Branch.countDocuments()
  ])

  sendSuccess(res, {
    message: 'Branches fetched',
    data: {
      branches,
      pagination: { page, limit, total, totalPages: Math.max(1, Math.ceil(total / limit)) }
    }
  })
})

export const listAllDeliveryAreas = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1
  const limit = Math.min(parseInt(req.query.limit) || 20, 100)

  const [deliveryAreas, total] = await Promise.all([
    DeliveryArea.find()
      .populate('branch', 'name city')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit),
    DeliveryArea.countDocuments()
  ])

  sendSuccess(res, {
    message: 'Delivery areas fetched',
    data: {
      deliveryAreas,
      pagination: { page, limit, total, totalPages: Math.max(1, Math.ceil(total / limit)) }
    }
  })
})

export const listAllDeals = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1
  const limit = Math.min(parseInt(req.query.limit) || 20, 100)

  const [deals, total] = await Promise.all([
    Deal.find()
      .populate('products', 'name')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit),
    Deal.countDocuments()
  ])

  sendSuccess(res, {
    message: 'Deals fetched',
    data: {
      deals,
      pagination: { page, limit, total, totalPages: Math.max(1, Math.ceil(total / limit)) }
    }
  })
})

export const listAllCoupons = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1
  const limit = Math.min(parseInt(req.query.limit) || 20, 100)

  const [coupons, total] = await Promise.all([
    Coupon.find()
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit),
    Coupon.countDocuments()
  ])

  sendSuccess(res, {
    message: 'Coupons fetched',
    data: {
      coupons,
      pagination: { page, limit, total, totalPages: Math.max(1, Math.ceil(total / limit)) }
    }
  })
})
