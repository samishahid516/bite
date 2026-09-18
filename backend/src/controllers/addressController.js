import { User } from '../models/User.js'
import { ApiError } from '../utils/ApiError.js'
import { asyncHandler } from '../utils/asyncHandler.js'
import { sendSuccess } from '../utils/apiResponse.js'

export const addAddress = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id)
  if (!user) throw ApiError.notFound('User not found')

  const { label, name, phone, address, city, area, landmark, latitude, longitude } = req.body

  // If this is the first address, set it as default
  const isDefault = user.addresses.length === 0

  user.addresses.push({
    label,
    name,
    phone,
    address,
    city,
    area,
    landmark: landmark || '',
    latitude: latitude || null,
    longitude: longitude || null,
    isDefault
  })

  await user.save()
  sendSuccess(res, {
    statusCode: 201,
    message: 'Address added successfully',
    data: { addresses: user.addresses }
  })
})

export const updateAddress = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id)
  if (!user) throw ApiError.notFound('User not found')

  const addressId = req.params.id
  const addressIndex = user.addresses.findIndex((a) => a._id.toString() === addressId)

  if (addressIndex === -1) throw ApiError.notFound('Address not found')

  const { label, name, phone, address, city, area, landmark, latitude, longitude } = req.body

  user.addresses[addressIndex] = {
    ...user.addresses[addressIndex],
    label: label !== undefined ? label : user.addresses[addressIndex].label,
    name: name !== undefined ? name : user.addresses[addressIndex].name,
    phone: phone !== undefined ? phone : user.addresses[addressIndex].phone,
    address: address !== undefined ? address : user.addresses[addressIndex].address,
    city: city !== undefined ? city : user.addresses[addressIndex].city,
    area: area !== undefined ? area : user.addresses[addressIndex].area,
    landmark: landmark !== undefined ? landmark : user.addresses[addressIndex].landmark,
    latitude: latitude !== undefined ? latitude : user.addresses[addressIndex].latitude,
    longitude: longitude !== undefined ? longitude : user.addresses[addressIndex].longitude,
    isDefault: user.addresses[addressIndex].isDefault
  }

  await user.save()
  sendSuccess(res, { message: 'Address updated successfully', data: { addresses: user.addresses } })
})

export const deleteAddress = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id)
  if (!user) throw ApiError.notFound('User not found')

  const addressId = req.params.id
  const addressIndex = user.addresses.findIndex((a) => a._id.toString() === addressId)

  if (addressIndex === -1) throw ApiError.notFound('Address not found')

  const deletedAddress = user.addresses[addressIndex]
  user.addresses.splice(addressIndex, 1)

  // If the deleted address was default and there are remaining addresses, set first as default
  if (deletedAddress.isDefault && user.addresses.length > 0) {
    user.addresses[0].isDefault = true
  }

  await user.save()
  sendSuccess(res, { message: 'Address deleted successfully', data: { addresses: user.addresses } })
})

export const setDefaultAddress = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id)
  if (!user) throw ApiError.notFound('User not found')

  const addressId = req.params.id
  const addressIndex = user.addresses.findIndex((a) => a._id.toString() === addressId)

  if (addressIndex === -1) throw ApiError.notFound('Address not found')

  // Remove default from all addresses
  user.addresses.forEach((addr) => {
    addr.isDefault = false
  })

  // Set the selected address as default
  user.addresses[addressIndex].isDefault = true

  await user.save()
  sendSuccess(res, { message: 'Default address set successfully', data: { addresses: user.addresses } })
})

export const getAddresses = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id)
  if (!user) throw ApiError.notFound('User not found')

  sendSuccess(res, { message: 'Addresses fetched', data: { addresses: user.addresses } })
})
