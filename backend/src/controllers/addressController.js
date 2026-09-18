import { supabase } from '../config/db.js'
import { ApiError } from '../utils/ApiError.js'
import { asyncHandler } from '../utils/asyncHandler.js'
import { sendSuccess } from '../utils/apiResponse.js'
import { rowToDoc } from '../utils/serialize.js'

async function fetchAddresses(userId) {
  const { data, error } = await supabase
    .from('addresses')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: true })
  if (error) throw ApiError.badRequest(error.message)
  return rowToDoc(data)
}

export const addAddress = asyncHandler(async (req, res) => {
  const { label, name, phone, address, city, area, landmark, latitude, longitude } = req.body

  // If this is the first address, set it as default
  const { count, error: countErr } = await supabase
    .from('addresses')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', req.user._id)
  if (countErr) throw ApiError.badRequest(countErr.message)
  const isDefault = (count || 0) === 0

  const { error } = await supabase.from('addresses').insert({
    user_id: req.user._id,
    label,
    name,
    phone,
    address,
    city,
    area,
    landmark: landmark || '',
    latitude: latitude || null,
    longitude: longitude || null,
    is_default: isDefault
  })
  if (error) throw ApiError.badRequest(error.message)

  const addresses = await fetchAddresses(req.user._id)
  sendSuccess(res, {
    statusCode: 201,
    message: 'Address added successfully',
    data: { addresses }
  })
})

export const updateAddress = asyncHandler(async (req, res) => {
  const addressId = req.params.id

  const { data: existing, error: getErr } = await supabase
    .from('addresses')
    .select('*')
    .eq('id', addressId)
    .eq('user_id', req.user._id)
    .maybeSingle()
  if (getErr) throw ApiError.badRequest(getErr.message)
  if (!existing) throw ApiError.notFound('Address not found')

  const { label, name, phone, address, city, area, landmark, latitude, longitude } = req.body

  const row = {}
  if (label !== undefined) row.label = label
  if (name !== undefined) row.name = name
  if (phone !== undefined) row.phone = phone
  if (address !== undefined) row.address = address
  if (city !== undefined) row.city = city
  if (area !== undefined) row.area = area
  if (landmark !== undefined) row.landmark = landmark
  if (latitude !== undefined) row.latitude = latitude
  if (longitude !== undefined) row.longitude = longitude

  const { error } = await supabase.from('addresses').update(row).eq('id', addressId)
  if (error) throw ApiError.badRequest(error.message)

  const addresses = await fetchAddresses(req.user._id)
  sendSuccess(res, { message: 'Address updated successfully', data: { addresses } })
})

export const deleteAddress = asyncHandler(async (req, res) => {
  const addressId = req.params.id

  const { data: existing, error: getErr } = await supabase
    .from('addresses')
    .select('*')
    .eq('id', addressId)
    .eq('user_id', req.user._id)
    .maybeSingle()
  if (getErr) throw ApiError.badRequest(getErr.message)
  if (!existing) throw ApiError.notFound('Address not found')

  const { error } = await supabase.from('addresses').delete().eq('id', addressId)
  if (error) throw ApiError.badRequest(error.message)

  // If the deleted address was default and there are remaining addresses, set first as default
  if (existing.is_default) {
    const { data: remaining, error: remErr } = await supabase
      .from('addresses')
      .select('id')
      .eq('user_id', req.user._id)
      .order('created_at', { ascending: true })
      .limit(1)
    if (remErr) throw ApiError.badRequest(remErr.message)
    if (remaining && remaining.length > 0) {
      await supabase.from('addresses').update({ is_default: true }).eq('id', remaining[0].id)
    }
  }

  const addresses = await fetchAddresses(req.user._id)
  sendSuccess(res, { message: 'Address deleted successfully', data: { addresses } })
})

export const setDefaultAddress = asyncHandler(async (req, res) => {
  const addressId = req.params.id

  const { data: existing, error: getErr } = await supabase
    .from('addresses')
    .select('id')
    .eq('id', addressId)
    .eq('user_id', req.user._id)
    .maybeSingle()
  if (getErr) throw ApiError.badRequest(getErr.message)
  if (!existing) throw ApiError.notFound('Address not found')

  // Remove default from all addresses, then set the selected one as default
  const { error: clearErr } = await supabase
    .from('addresses')
    .update({ is_default: false })
    .eq('user_id', req.user._id)
  if (clearErr) throw ApiError.badRequest(clearErr.message)

  const { error: setErr } = await supabase.from('addresses').update({ is_default: true }).eq('id', addressId)
  if (setErr) throw ApiError.badRequest(setErr.message)

  const addresses = await fetchAddresses(req.user._id)
  sendSuccess(res, { message: 'Default address set successfully', data: { addresses } })
})

export const getAddresses = asyncHandler(async (req, res) => {
  const addresses = await fetchAddresses(req.user._id)
  sendSuccess(res, { message: 'Addresses fetched', data: { addresses } })
})
