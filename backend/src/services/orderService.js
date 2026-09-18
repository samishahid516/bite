import { supabase } from '../config/db.js'
import { ApiError } from '../utils/ApiError.js'
import { rowToDoc } from '../utils/serialize.js'
import { isCurrentlyOpen } from './branchService.js'
import * as inventoryService from './inventoryService.js'

const TAX_RATE = 0.17 // 17% GST

export const ORDER_STATUS_VALUES = [
  'PENDING',
  'CONFIRMED',
  'PREPARING',
  'READY',
  'OUT_FOR_DELIVERY',
  'DELIVERED',
  'CANCELLED'
]

const ORDER_SELECT = '*, user:users(id, name, email, phone), branch:branches(id, name, city, area, phone), delivery_area:delivery_areas(id, name, delivery_fee)'

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
  const { data: branchRow, error: branchErr } = await supabase
    .from('branches')
    .select('*')
    .eq('id', branch)
    .maybeSingle()
  if (branchErr) throw ApiError.badRequest(branchErr.message)
  if (!branchRow) throw ApiError.notFound('Branch not found')
  const branchDoc = rowToDoc(branchRow)
  if (!branchDoc.isActive) throw ApiError.badRequest('This branch is not currently accepting orders')
  if (!isCurrentlyOpen(branchDoc)) throw ApiError.badRequest('This branch is closed at the moment')

  // Validate delivery area exists and belongs to branch
  const { data: areaRow, error: areaErr } = await supabase
    .from('delivery_areas')
    .select('*')
    .eq('id', deliveryArea)
    .maybeSingle()
  if (areaErr) throw ApiError.badRequest(areaErr.message)
  if (!areaRow) throw ApiError.notFound('Delivery area not found')
  const deliveryAreaDoc = rowToDoc(areaRow)
  if (deliveryAreaDoc.branchId !== branch) {
    throw ApiError.badRequest('Delivery area does not belong to this branch')
  }
  if (!deliveryAreaDoc.isActive) throw ApiError.badRequest('Delivery to this area is not available')

  // Validate items and calculate subtotal
  if (!items || items.length === 0) throw ApiError.badRequest('Order must contain at least one item')

  let subtotal = 0
  const processedItems = []

  for (const item of items) {
    let unitPrice = 0

    if (item.itemType === 'PRODUCT' && item.product) {
      const { data: productRow, error: productErr } = await supabase
        .from('products')
        .select('*')
        .eq('id', item.product)
        .maybeSingle()
      if (productErr) throw ApiError.badRequest(productErr.message)
      if (!productRow) throw ApiError.notFound(`Product not found: ${item.product}`)
      const productDoc = rowToDoc(productRow)
      if (!productDoc.isAvailable) throw ApiError.badRequest(`Product not available: ${productDoc.name}`)

      // Start with base price
      unitPrice =
        productDoc.discountPrice != null && productDoc.discountPrice < productDoc.basePrice
          ? productDoc.discountPrice
          : productDoc.basePrice

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
      const { data: dealRow, error: dealErr } = await supabase
        .from('deals')
        .select('*')
        .eq('id', item.deal)
        .maybeSingle()
      if (dealErr) throw ApiError.badRequest(dealErr.message)
      if (!dealRow) throw ApiError.notFound(`Deal not found: ${item.deal}`)
      const dealDoc = rowToDoc(dealRow)
      if (!dealDoc.isActive) throw ApiError.badRequest(`Deal not available: ${dealDoc.name}`)
      const now = new Date()
      if (new Date(dealDoc.startDate) > now || new Date(dealDoc.endDate) < now) {
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
    const { data: couponRow, error: couponErr } = await supabase
      .from('coupons')
      .select('*')
      .eq('code', couponCode.toUpperCase())
      .maybeSingle()
    if (couponErr) throw ApiError.badRequest(couponErr.message)
    if (!couponRow) throw ApiError.notFound('Coupon code not found')
    const coupon = rowToDoc(couponRow)
    if (!coupon.isActive) throw ApiError.badRequest('This coupon is no longer valid')
    if (new Date(coupon.expiryDate) < new Date()) throw ApiError.badRequest('This coupon has expired')
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
  const { data: orderRow, error: orderErr } = await supabase
    .from('orders')
    .insert({
      order_number: generateOrderNumber(),
      user_id: user ? user._id : null,
      branch_id: branch,
      items: processedItems,
      delivery_address: deliveryAddress,
      delivery_area_id: deliveryArea,
      subtotal,
      coupon_code: couponCode ? couponCode.toUpperCase() : null,
      coupon_discount: couponDiscount,
      delivery_fee: deliveryFee,
      tax,
      total,
      payment_method: paymentMethod,
      special_instructions: specialInstructions || '',
      status_history: [
        {
          status: 'PENDING',
          changedBy: null,
          note: 'Order created',
          timestamp: new Date().toISOString()
        }
      ]
    })
    .select(ORDER_SELECT)
    .single()
  if (orderErr) throw ApiError.badRequest(orderErr.message)

  // Increment coupon usedCount atomically
  if (couponCode) {
    const { data: couponRow } = await supabase
      .from('coupons')
      .select('used_count')
      .eq('code', couponCode.toUpperCase())
      .maybeSingle()
    if (couponRow) {
      await supabase
        .from('coupons')
        .update({ used_count: couponRow.used_count + 1 })
        .eq('code', couponCode.toUpperCase())
    }
  }

  return rowToDoc(orderRow)
}

export async function getOrder(userId, orderId) {
  const { data, error } = await supabase.from('orders').select(ORDER_SELECT).eq('id', orderId).maybeSingle()
  if (error) throw ApiError.badRequest(error.message)
  if (!data) throw ApiError.notFound('Order not found')

  const order = rowToDoc(data)

  // Guest orders (no associated account) can be viewed by anyone with the order ID.
  // Orders placed by a registered user can only be viewed by that same user.
  if (order.user && (!userId || order.user._id.toString() !== userId.toString())) {
    throw ApiError.forbidden('You do not have permission to view this order')
  }

  return order
}

export async function getCustomerOrders(userId, { page = 1, limit = 10 } = {}) {
  page = Number(page) || 1
  limit = Number(limit) || 10

  const { data, error, count } = await supabase
    .from('orders')
    .select('*, branch:branches(id, name, city), delivery_area:delivery_areas(id, name)', { count: 'exact' })
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .range((page - 1) * limit, (page - 1) * limit + limit - 1)
  if (error) throw ApiError.badRequest(error.message)

  const total = count || 0

  return {
    orders: rowToDoc(data),
    pagination: { page, limit, total, totalPages: Math.max(1, Math.ceil(total / limit)) }
  }
}

export async function listAllOrders(query, { page = 1, limit = 20 } = {}) {
  page = Number(page) || 1
  limit = Number(limit) || 20

  let q = supabase
    .from('orders')
    .select('*, user:users(id, name, email, phone), branch:branches(id, name, city), delivery_area:delivery_areas(id, name)', { count: 'exact' })

  if (query.status) {
    if (!ORDER_STATUS_VALUES.includes(query.status.toUpperCase())) {
      throw ApiError.badRequest('Invalid order status')
    }
    q = q.eq('order_status', query.status.toUpperCase())
  }

  if (query.branch) q = q.eq('branch_id', query.branch)
  if (query.user) q = q.eq('user_id', query.user)

  if (query.dateFrom) q = q.gte('created_at', new Date(query.dateFrom).toISOString())
  if (query.dateTo) {
    const dateTo = new Date(query.dateTo)
    dateTo.setHours(23, 59, 59, 999)
    q = q.lte('created_at', dateTo.toISOString())
  }

  const sortMap = {
    newest: { column: 'created_at', ascending: false },
    oldest: { column: 'created_at', ascending: true },
    total_high: { column: 'total', ascending: false },
    total_low: { column: 'total', ascending: true }
  }
  const sort = sortMap[query.sort] || { column: 'created_at', ascending: false }
  q = q.order(sort.column, { ascending: sort.ascending })
  q = q.range((page - 1) * limit, (page - 1) * limit + limit - 1)

  const { data, error, count } = await q
  if (error) throw ApiError.badRequest(error.message)

  const total = count || 0

  return {
    orders: rowToDoc(data),
    pagination: { page, limit, total, totalPages: Math.max(1, Math.ceil(total / limit)) }
  }
}

export async function updateOrderStatus(orderId, newStatus, changedBy, note = '') {
  const { data: orderRow, error: getErr } = await supabase
    .from('orders')
    .select('*')
    .eq('id', orderId)
    .maybeSingle()
  if (getErr) throw ApiError.badRequest(getErr.message)
  if (!orderRow) throw ApiError.notFound('Order not found')

  const currentStatus = orderRow.order_status
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
    throw ApiError.badRequest(`Cannot transition from ${currentStatus} to ${newStatus}`)
  }

  const statusHistory = [
    ...(orderRow.status_history || []),
    { status: newStatus, changedBy, note, timestamp: new Date().toISOString() }
  ]

  const { data: updated, error: updateErr } = await supabase
    .from('orders')
    .update({ order_status: newStatus, status_history: statusHistory })
    .eq('id', orderId)
    .select('*, user:users(id, name, email, phone), branch:branches(id, name, city), delivery_area:delivery_areas(id, name)')
    .single()
  if (updateErr) throw ApiError.badRequest(updateErr.message)

  // Deduct recipe ingredients from stock the moment an order is confirmed
  if (newStatus === 'CONFIRMED') {
    await inventoryService.deductForOrder(rowToDoc(updated))
  }

  return rowToDoc(updated)
}

export async function cancelOrder(orderId, cancelledBy = null) {
  const { data: orderRow, error: getErr } = await supabase
    .from('orders')
    .select('*')
    .eq('id', orderId)
    .maybeSingle()
  if (getErr) throw ApiError.badRequest(getErr.message)
  if (!orderRow) throw ApiError.notFound('Order not found')

  const currentStatus = orderRow.order_status

  // Customer can only cancel PENDING or CONFIRMED orders
  if (!cancelledBy) {
    if (!['PENDING', 'CONFIRMED'].includes(currentStatus)) {
      throw ApiError.badRequest('You can only cancel pending or confirmed orders')
    }
  }
  // Admin can cancel any order except DELIVERED or already CANCELLED
  else if (['DELIVERED', 'CANCELLED'].includes(currentStatus)) {
    throw ApiError.badRequest('This order cannot be cancelled')
  }

  const statusHistory = [
    ...(orderRow.status_history || []),
    { status: 'CANCELLED', changedBy: cancelledBy, note: 'Order cancelled', timestamp: new Date().toISOString() }
  ]

  const { data: updated, error: updateErr } = await supabase
    .from('orders')
    .update({ order_status: 'CANCELLED', status_history: statusHistory })
    .eq('id', orderId)
    .select('*, user:users(id, name, email, phone), branch:branches(id, name, city), delivery_area:delivery_areas(id, name)')
    .single()
  if (updateErr) throw ApiError.badRequest(updateErr.message)

  return rowToDoc(updated)
}

export async function getOrderStats(query = {}) {
  let q = supabase.from('orders').select('total, order_status, created_at')

  if (query.dateFrom) q = q.gte('created_at', new Date(query.dateFrom).toISOString())
  if (query.dateTo) {
    const dateTo = new Date(query.dateTo)
    dateTo.setHours(23, 59, 59, 999)
    q = q.lte('created_at', dateTo.toISOString())
  }

  const { data, error } = await q
  if (error) throw ApiError.badRequest(error.message)

  if (!data || data.length === 0) {
    return {
      totalOrders: 0,
      totalRevenue: 0,
      averageOrderValue: 0,
      deliveredOrders: 0,
      pendingOrders: 0,
      cancelledOrders: 0
    }
  }

  const totalOrders = data.length
  const totalRevenue = data.reduce((sum, o) => sum + Number(o.total), 0)
  const averageOrderValue = totalRevenue / totalOrders
  const deliveredOrders = data.filter((o) => o.order_status === 'DELIVERED').length
  const pendingOrders = data.filter((o) => o.order_status === 'PENDING').length
  const cancelledOrders = data.filter((o) => o.order_status === 'CANCELLED').length

  return { totalOrders, totalRevenue, averageOrderValue, deliveredOrders, pendingOrders, cancelledOrders }
}
