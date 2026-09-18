import slugifyLib from 'slugify'
import { supabase } from '../config/db.js'

export function slugify(text) {
  return slugifyLib(text, { lower: true, strict: true })
}

// table: the Postgres table name (e.g. 'products', 'categories', 'deals').
export async function uniqueSlug(table, text, excludeId = null) {
  const base = slugify(text)
  let candidate = base
  let counter = 1

  while (true) {
    let query = supabase.from(table).select('id').eq('slug', candidate)
    if (excludeId) query = query.neq('id', excludeId)
    const { data, error } = await query.maybeSingle()
    if (error && error.code !== 'PGRST116') throw error
    if (!data) return candidate
    counter += 1
    candidate = `${base}-${counter}`
  }
}
