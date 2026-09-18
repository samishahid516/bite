import { Order, ORDER_STATUS_VALUES } from '../models/Order.js'
import { Product } from '../models/Product.js'
import { Deal } from '../models/Deal.js'
import { Branch } from '../models/Branch.js'
import { DeliveryArea } from '../models/DeliveryArea.js'
import { Coupon } from '../models/Coupon.js'
import { ApiError } from '../utils/ApiError.js'
import * as inventoryService from './inventoryService.js'

const TAX_RATE = 0.17 // 17% GST

function generateOrderNumber() {
  const timestamp = Date.now().toString().slice(-8)
  const random = Math.random().toString(36).substring(2, 8).toUpperCase()
  return `ORD-${timestamp}${random}`
}

export async function createOrder(user, orderData) {
  const {
    branch,
    deliveryArea,
    items,
    deliveryAddress,
    couponCode,
    paymentMethod,
    specialInstructions
  } = orderData

  // Validate branch exists and is currently open
  const branchDoc = await Branch.findById(branch)
  if (!branchDoc) throw ApiError.notFound('Branch not found')
  if (!branchDoc.isActive) throw ApiError.badRequest('This branch is not currently accepting orders')
  if (!branchDoc.isCurrentlyOpen()) throw ApiError.badRequest('This branch is closed at the moment')

  // Validate delivery area exists and belongs to branch
  const deliveryAreaDoc = await DeliveryArea.findById(deliveryArea)
  if (!deliveryAreaDoc) throw ApiError.notFound('Delivery area not found')
  if (deliveryAreaDoc.branch.toString() !== branch) {
    throw ApiError.badRequest('Delivery area does not belong to this branch')
  }
  if (!deliveryAreaDoc.isActive) throw ApiError.badRequest('Delivery to this area is not available')

  // Validate items and calculate subtotal
  if (!items || items.length === 0) throw ApiError.badRequest('Order must contain at least one item')

  let subtotal = 0
  const processedItems = []

  for (const item of items) {
    let productDoc = null
    let unitPrice = 0

    if (item.itemType === 'PRODUCT' && item.product) {
      productDoc = await Product.findById(item.product)
      if (!productDoc) throw ApiError.notFound(`Product not found: ${item.product}`)
      if (!productDoc.isAvailable) throw ApiError.badRequest(`Product not available: ${productDoc.name}`)

      // Start with base price
      unitPrice = productDoc.effectivePrice

      // Add price adjustments for size, crust, toppings, extras if selected
      if (item.size) {
        const sizeOpt = productDoc.sizes.find((s) => s.name === item.size)
        if (sizeOpt) unitPrice += sizeOpt.price
      }
      if (item.crust) {
        const crustOpt = productDoc.crusts.find((c) => c.name === item.crust)
        if (crustOpt) unitPrice += crustOpt.price
      }
      if (item.toppings && item.toppings.length > 0) {
        for (const topping of item.toppings) {
          const toppingOpt = productDoc.toppings.find((t) => t.name === topping)
          if (toppingOpt) unitPrice += toppingOpt.price
        }
      }
      if (item.extras && item.extras.length > 0) {
        for (const extra of item.extras) {
          const extraOpt = productDoc.extras.find((e) => e.name === extra)
          if (extraOpt) unitPrice += extraOpt.price
        }
      }
    } else if (item.itemType === 'DEAL' && item.deal) {
      const dealDoc = await Deal.findById(item.deal)
      if (!dealDoc) throw ApiError.notFound(`Deal not found: ${item.deal}`)
      if (!dealDoc.isActive) throw ApiError.badRequest(`Deal not available: ${dealDoc.name}`)
      const now = new Date()
      if (dealDoc.startDate > now || dealDoc.endDate < now) {
        throw ApiError.badRequest(`Deal is not currently active: ${dealDoc.name}`)
      }
      unitPrice = dealDoc.discountPrice
    }

    const itemTotal = unitPrice * item.quantity
    subtotal += itemTotal

    processedItems.push({
      itemType: item.itemType,
      product: item.product || null,
      deal: item.deal || null,
      name: item.name,
      image: item.image || null,
      size: item.size || null,
      crust: item.crust || null,
      toppings: item.toppings || [],
      extras: item.extras || [],
      specialInstructions: item.specialInstructions || '',
      quantity: item.quantity,
      unitPrice,
      totalPrice: itemTotal
    })
  }

  // Validate minimum order for delivery area
  if (subtotal < deliveryAreaDoc.minimumOrder) {
    throw ApiError.badRequest(`Minimum order for this area is ${deliveryAreaDoc.minimumOrder}`)
  }

  // Validate and apply coupon
  let couponDiscount = 0
  if (couponCode) {
    const coupon = await Coupon.findOne({ code: couponCode.toUpperCase() })
    if (!coupon) throw ApiError.notFound('Coupon code not found')
    if (!coupon.isActive) throw ApiError.badRequest('This coupon is no longer valid')
    if (coupon.expiryDate < new Date()) throw ApiError.badRequest('This coupon has expired')
    if (coupon.usageLimit && coupon.usedCount >= coupon.usageLimit) {
      throw ApiError.badRequest('This coupon has reached its usage limit')
    }
    if (subtotal < coupon.minOrder) {
      throw ApiError.badRequest(`Coupon requires minimum order of ${coupon.minOrder}`)
    }

    if (coupon.discountType === 'PERCENTAGE') {
      couponDiscount = (subtotal * coupon.discountValue) / 100
      if (coupon.maxDiscount) couponDiscount = Math.min(couponDiscount, coupon.maxDiscount)
    } else if (coupon.discountType === 'FIXED') {
      couponDiscount = coupon.discountValue
    }
  }

  // Calculate tax on subtotal
  const tax = subtotal * TAX_RATE

  // Calculate final total
  const deliveryFee = deliveryAreaDoc.deliveryFee
  const total = subtotal - couponDiscount + deliveryFee + tax

  // Create order
  const order = await Order.create({
    orderNumber: generateOrderNumber(),
    user: user ? user._id : null,
    branch,
    items: processedItems,
    deliveryAddress,
    deliveryArea,
    subtotal,
    couponCode: couponCode ? couponCode.toUpperCase() : null,
    couponDiscount,
    deliveryFee,
    tax,
    total,
    paymentMethod,
    specialInstructions: specialInstructions || '',
    statusHistory: [
      {
        status: 'PENDING',
        changedBy: null,
        note: 'Order created',
        timestamp: new Date()
      }
    ]
  })

  // Increment coupon usedCount atomically
  if (couponCode) {
    await Coupon.findOneAndUpdate({ code: couponCode.toUpperCase() }, { $inc: { usedCount: 1 } })
  }

  return order.populate([
    { path: 'user', select: 'name email phone' },
    { path: 'branch', select: 'name city area phone' },
    { path: 'deliveryArea', select: 'name deliveryFee' }
  ])
}

export async function getOrder(userId, orderId) {
  const order = await Order.findById(orderId)
    .populate('user', 'name email phone')
    .populate('branch', 'name city area phone')
    .populate('deliveryArea', 'name deliveryFee')
    .populate('items.product', 'name image')

  if (!order) throw ApiError.notFound('Order not found')

  // Guest orders (no associated account) can be viewed by anyone with the order ID.
  // Orders placed by a registered user can only be viewed by that same user.
  if (order.user && (!userId || order.user._id.toString() !== userId.toString())) {
    throw ApiError.forbidden('You do not have permission to view this order')
  }

  return order
}

export async function getCustomerOrders(userId, { page = 1, limit = 10 } = {}) {
  const [orders, total] = await Promise.all([
    Order.find({ user: userId })
      .populate('branch', 'name city')
      .populate('deliveryArea', 'name')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit),
    Order.countDocuments({ user: userId })
  ])

  return {
    orders,
    pagination: { page, limit, total, totalPages: Math.max(1, Math.ceil(total / limit)) }
  }
}

export async function listAllOrders(query, { page = 1, limit = 20 } = {}) {
  const filter = {}

  if (query.status) {
    if (!ORDER_STATUS_VALUES.includes(query.status.toUpperCase())) {
      throw ApiError.badRequest('Invalid order status')
    }
    filter.orderStatus = query.status.toUpperCase()
  }

  if (query.branch) filter.branch = query.branch
  if (query.user) filter.user = query.user

  if (query.dateFrom || query.dateTo) {
    filter.createdAt = {}
    if (query.dateFrom) filter.createdAt.$gte = new Date(query.dateFrom)
    if (query.dateTo) {
      const dateTo = new Date(query.dateTo)
      dateTo.setHours(23, 59, 59, 999)
      filter.createdAt.$lte = dateTo
    }
  }

  const sortMap = {
    newest: { createdAt: -1 },
    oldest: { createdAt: 1 },
    total_high: { total: -1 },
    total_low: { total: 1 }
  }
  const sort = sortMap[query.sort] || { createdAt: -1 }

  const [orders, total] = await Promise.all([
    Order.find(filter)
      .populate('user', 'name email phone')
      .populate('branch', 'name city')
      .populate('deliveryArea', 'name')
      .sort(sort)
      .skip((page - 1) * limit)
      .limit(limit),
    Order.countDocuments(filter)
  ])

  return {
    orders,
    pagination: { page, limit, total, totalPages: Math.max(1, Math.ceil(total / limit)) }
  }
}

export async function updateOrderStatus(orderId, newStatus, changedBy, note = '') {
  const order = await Order.findById(orderId)
  if (!order) throw ApiError.notFound('Order not found')

  const currentStatus = order.orderStatus
  newStatus = newStatus.toUpperCase()

  if (!ORDER_STATUS_VALUES.includes(newStatus)) {
    throw ApiError.badRequest('Invalid order status')
  }

  // Validate state transitions
  const validTransitions = {
    PENDING: ['CONFIRMED', 'CANCELLED'],
    CONFIRMED: ['PREPARING', 'CANCELLED'],
    PREPARING: ['READY'],
    READY: ['OUT_FOR_DELIVERY'],
    OUT_FOR_DELIVERY: ['DELIVERED'],
    DELIVERED: [],
    CANCELLED: []
  }

  if (!validTransitions[currentStatus] || !validTransitions[currentStatus].includes(newStatus)) {
    throw ApiError.badRequest(
      `Cannot transition from ${currentStatus} to ${newStatus}`
    )
  }

  order.orderStatus = newStatus
  order.statusHistory.push({
    status: newStatus,
    changedBy,
    note,
    timestamp: new Date()
  })

  await order.save()

  // Deduct recipe ingredients from stock the moment an order is confirmed
  if (newStatus === 'CONFIRMED') {
    await inventoryService.deductForOrder(order)
  }

  return order
    .populate('user', 'name email phone')
    .populate('branch', 'name city')
    .populate('deliveryArea', 'name')
}

export async function cancelOrder(orderId, cancelledBy = null) {
  const order = await Order.findById(orderId)
  if (!order) throw ApiError.notFound('Order not found')

  const currentStatus = order.orderStatus

  // Customer can only cancel PENDING or CONFIRMED orders
  if (!cancelledBy) {
    if (!['PENDING', 'CONFIRMED'].includes(currentStatus)) {
      throw ApiError.badRequest('You can only cancel pending or confirmed orders')
    }
  }
  // Admin can cancel any order except DELIVERED or already CANCELLED
  else if (!['DELIVERED', 'CANCELLED'].includes(currentStatus)) {
    // Admin cancellation is allowed
  } else {
    throw ApiError.badRequest('This order cannot be cancelled')
  }

  order.orderStatus = 'CANCELLED'
  order.statusHistory.push({
    status: 'CANCELLED',
    changedBy: cancelledBy,
    note: 'Order cancelled',
    timestamp: new Date()
  })

  await order.save()
  return order
    .populate('user', 'name email phone')
    .populate('branch', 'name city')
    .populate('deliveryArea', 'name')
}

export async function getOrderStats(query = {}) {
  const pipeline = []

  // Add date filtering if provided
  if (query.dateFrom || query.dateTo) {
    const match = {}
    if (query.dateFrom) match.createdAt = { $gte: new Date(query.dateFrom) }
    if (query.dateTo) {
      const dateTo = new Date(query.dateTo)
      dateTo.setHours(23, 59, 59, 999)
      if (match.createdAt) {
        match.createdAt.$lte = dateTo
      } else {
        match.createdAt = { $lte: dateTo }
      }
    }
    if (Object.keys(match).length > 0) pipeline.push({ $match: match })
  }

  // Group and aggregate
  pipeline.push({
    $group: {
      _id: null,
      totalOrders: { $sum: 1 },
      totalRevenue: { $sum: '$total' },
      averageOrderValue: { $avg: '$total' },
      deliveredOrders: {
        $sum: { $cond: [{ $eq: ['$orderStatus', 'DELIVERED'] }, 1, 0] }
      },
      pendingOrders: {
        $sum: { $cond: [{ $eq: ['$orderStatus', 'PENDING'] }, 1, 0] }
      },
      cancelledOrders: {
        $sum: { $cond: [{ $eq: ['$orderStatus', 'CANCELLED'] }, 1, 0] }
      }
    }
  })

  const result = await Order.aggregate(pipeline)
  return result[0] || {
    totalOrders: 0,
    totalRevenue: 0,
    averageOrderValue: 0,
    deliveredOrders: 0,
    pendingOrders: 0,
    cancelledOrders: 0
  }
}
