import slugifyLib from 'slugify'

export function slugify(text) {
  return slugifyLib(text, { lower: true, strict: true })
}

export async function uniqueSlug(Model, text, excludeId = null) {
  const base = slugify(text)
  let candidate = base
  let counter = 1

  while (true) {
    const query = { slug: candidate }
    if (excludeId) query._id = { $ne: excludeId }
    const existing = await Model.findOne(query)
    if (!existing) return candidate
    counter += 1
    candidate = `${base}-${counter}`
  }
}
