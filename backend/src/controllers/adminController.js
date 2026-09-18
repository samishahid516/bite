import { supabase } from '../config/db.js'
import { ApiError } from '../utils/ApiError.js'
import { asyncHandler } from '../utils/asyncHandler.js'
import { sendSuccess } from '../utils/apiResponse.js'
import { rowToDoc } from '../utils/serialize.js'

export const getDashboardStats = asyncHandler(async (req, res) => {
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const tomorrow = new Date(today)
  tomorrow.setDate(tomorrow.getDate() + 1)

  // Today's stats
  const { data: todayOrdersData, error: todayErr } = await supabase
    .from('orders')
    .select('total', { count: 'exact' })
    .gte('created_at', today.toISOString())
    .lt('created_at', tomorrow.toISOString())
  if (todayErr) throw ApiError.badRequest(todayErr.message)

  const todayOrders = todayOrdersData.length
  const todayRevenue = todayOrdersData.reduce((sum, o) => sum + Number(o.total), 0)

  // Pending orders (all time)
  const { count: pendingOrders, error: pendingErr } = await supabase
    .from('orders')
    .select('id', { count: 'exact', head: true })
    .in('order_status', ['PENDING', 'CONFIRMED', 'PREPARING', 'READY', 'OUT_FOR_DELIVERY'])
  if (pendingErr) throw ApiError.badRequest(pendingErr.message)

  // Overall stats
  const [
    { count: totalProducts },
    { count: activeDeals },
    { count: activeCoupons },
    { count: totalCustomers },
    { count: totalBranches },
    { count: totalDeliveryAreas },
    { count: pendingReviews }
  ] = await Promise.all([
    supabase.from('products').select('id', { count: 'exact', head: true }),
    supabase.from('deals').select('id', { count: 'exact', head: true }).eq('is_active', true),
    supabase.from('coupons').select('id', { count: 'exact', head: true }).eq('is_active', true),
    supabase.from('users').select('id', { count: 'exact', head: true }).eq('role', 'CUSTOMER'),
    supabase.from('branches').select('id', { count: 'exact', head: true }),
    supabase.from('delivery_areas').select('id', { count: 'exact', head: true }),
    supabase.from('reviews').select('id', { count: 'exact', head: true }).eq('is_approved', false)
  ])

  // Overall revenue stats
  const { data: allOrders, error: allErr } = await supabase.from('orders').select('total')
  if (allErr) throw ApiError.badRequest(allErr.message)

  const totalOrders = allOrders.length
  const totalRevenue = allOrders.reduce((sum, o) => sum + Number(o.total), 0)
  const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0

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

  let query = supabase.from('orders').select('total, created_at')
  if (dateFrom) query = query.gte('created_at', new Date(dateFrom).toISOString())
  if (dateTo) {
    const dateToObj = new Date(dateTo)
    dateToObj.setHours(23, 59, 59, 999)
    query = query.lte('created_at', dateToObj.toISOString())
  }

  const { data, error } = await query
  if (error) throw ApiError.badRequest(error.message)

  const groups = new Map()
  for (const order of data) {
    const date = new Date(order.created_at)
    let key
    if (groupBy === 'weekly') {
      const firstJan = new Date(date.getFullYear(), 0, 1)
      const week = Math.ceil(((date - firstJan) / 86400000 + firstJan.getDay() + 1) / 7)
      key = JSON.stringify({ week, year: date.getFullYear() })
    } else if (groupBy === 'monthly') {
      key = JSON.stringify({ month: date.getMonth() + 1, year: date.getFullYear() })
    } else {
      key = JSON.stringify({ date: date.toISOString().slice(0, 10) })
    }

    if (!groups.has(key)) groups.set(key, { _id: JSON.parse(key), totalOrders: 0, totalRevenue: 0 })
    const g = groups.get(key)
    g.totalOrders += 1
    g.totalRevenue += Number(order.total)
  }

  const report = Array.from(groups.values())
    .map((g) => ({ ...g, averageOrderValue: g.totalRevenue / g.totalOrders }))
    .sort((a, b) => JSON.stringify(a._id).localeCompare(JSON.stringify(b._id)))

  sendSuccess(res, { message: 'Sales report fetched', data: { report, groupBy } })
})

export const getTopProducts = asyncHandler(async (req, res) => {
  const limit = Math.min(parseInt(req.query.limit) || 20, 100)

  const { data: orders, error } = await supabase.from('orders').select('items')
  if (error) throw ApiError.badRequest(error.message)

  const stats = new Map()
  for (const order of orders) {
    for (const item of order.items || []) {
      if (!item.product) continue
      const key = item.product
      if (!stats.has(key)) stats.set(key, { totalSold: 0, totalRevenue: 0, priceSum: 0, priceCount: 0 })
      const s = stats.get(key)
      s.totalSold += item.quantity
      s.totalRevenue += item.totalPrice
      s.priceSum += item.unitPrice
      s.priceCount += 1
    }
  }

  const sorted = Array.from(stats.entries())
    .sort((a, b) => b[1].totalSold - a[1].totalSold)
    .slice(0, limit)

  const productIds = sorted.map(([id]) => id)
  let productMap = new Map()
  if (productIds.length > 0) {
    const { data: products, error: prodErr } = await supabase.from('products').select('*').in('id', productIds)
    if (prodErr) throw ApiError.badRequest(prodErr.message)
    productMap = new Map(products.map((p) => [p.id, rowToDoc(p)]))
  }

  const topProducts = sorted
    .filter(([id]) => productMap.has(id))
    .map(([id, s]) => ({
      _id: id,
      totalSold: s.totalSold,
      totalRevenue: s.totalRevenue,
      averagePrice: s.priceSum / s.priceCount,
      product: productMap.get(id)
    }))

  sendSuccess(res, { message: 'Top products fetched', data: { products: topProducts } })
})

export const getCustomers = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1
  const limit = Math.min(parseInt(req.query.limit) || 20, 100)
  const search = (req.query.search || '').trim()

  let query = supabase
    .from('users')
    .select('name, email, phone, is_active, created_at, id', { count: 'exact' })
    .eq('role', 'CUSTOMER')

  if (search) {
    query = query.or(`name.ilike.%${search}%,email.ilike.%${search}%,phone.ilike.%${search}%`)
  }

  query = query
    .order('created_at', { ascending: false })
    .range((page - 1) * limit, (page - 1) * limit + limit - 1)

  const { data, error, count } = await query
  if (error) throw ApiError.badRequest(error.message)

  const total = count || 0

  sendSuccess(res, {
    message: 'Customers fetched',
    data: {
      customers: rowToDoc(data),
      pagination: { page, limit, total, totalPages: Math.max(1, Math.ceil(total / limit)) }
    }
  })
})

export const listAllProducts = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1
  const limit = Math.min(parseInt(req.query.limit) || 20, 100)

  const { data, error, count } = await supabase
    .from('products')
    .select('*, category:categories(id, name)', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range((page - 1) * limit, (page - 1) * limit + limit - 1)
  if (error) throw ApiError.badRequest(error.message)

  const total = count || 0

  sendSuccess(res, {
    message: 'Products fetched',
    data: {
      products: rowToDoc(data),
      pagination: { page, limit, total, totalPages: Math.max(1, Math.ceil(total / limit)) }
    }
  })
})

export const listAllCategories = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1
  const limit = Math.min(parseInt(req.query.limit) || 20, 100)

  const { data, error, count } = await supabase
    .from('categories')
    .select('*', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range((page - 1) * limit, (page - 1) * limit + limit - 1)
  if (error) throw ApiError.badRequest(error.message)

  const total = count || 0

  sendSuccess(res, {
    message: 'Categories fetched',
    data: {
      categories: rowToDoc(data),
      pagination: { page, limit, total, totalPages: Math.max(1, Math.ceil(total / limit)) }
    }
  })
})

export const listAllBranches = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1
  const limit = Math.min(parseInt(req.query.limit) || 20, 100)

  const { data, error, count } = await supabase
    .from('branches')
    .select('*', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range((page - 1) * limit, (page - 1) * limit + limit - 1)
  if (error) throw ApiError.badRequest(error.message)

  const total = count || 0

  sendSuccess(res, {
    message: 'Branches fetched',
    data: {
      branches: rowToDoc(data),
      pagination: { page, limit, total, totalPages: Math.max(1, Math.ceil(total / limit)) }
    }
  })
})

export const listAllDeliveryAreas = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1
  const limit = Math.min(parseInt(req.query.limit) || 20, 100)

  const { data, error, count } = await supabase
    .from('delivery_areas')
    .select('*, branch:branches(id, name, city)', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range((page - 1) * limit, (page - 1) * limit + limit - 1)
  if (error) throw ApiError.badRequest(error.message)

  const total = count || 0

  sendSuccess(res, {
    message: 'Delivery areas fetched',
    data: {
      deliveryAreas: rowToDoc(data),
      pagination: { page, limit, total, totalPages: Math.max(1, Math.ceil(total / limit)) }
    }
  })
})

export const listAllDeals = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1
  const limit = Math.min(parseInt(req.query.limit) || 20, 100)

  const { data, error, count } = await supabase
    .from('deals')
    .select('*', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range((page - 1) * limit, (page - 1) * limit + limit - 1)
  if (error) throw ApiError.badRequest(error.message)

  const total = count || 0

  sendSuccess(res, {
    message: 'Deals fetched',
    data: {
      deals: rowToDoc(data),
      pagination: { page, limit, total, totalPages: Math.max(1, Math.ceil(total / limit)) }
    }
  })
})

export const listAllCoupons = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1
  const limit = Math.min(parseInt(req.query.limit) || 20, 100)

  const { data, error, count } = await supabase
    .from('coupons')
    .select('*', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range((page - 1) * limit, (page - 1) * limit + limit - 1)
  if (error) throw ApiError.badRequest(error.message)

  const total = count || 0

  sendSuccess(res, {
    message: 'Coupons fetched',
    data: {
      coupons: rowToDoc(data),
      pagination: { page, limit, total, totalPages: Math.max(1, Math.ceil(total / limit)) }
    }
  })
})
