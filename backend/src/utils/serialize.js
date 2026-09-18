// Converts Supabase/Postgres rows (snake_case columns, `id` primary key) into
// the same shape the frontend already expects from the old Mongoose API
// (camelCase fields, `_id`). Keeping this translation isolated here means
// the frontend needs zero changes after the MongoDB -> Supabase migration.
// Nested jsonb columns (order items, delivery address, price options, etc.)
// are written by this backend in camelCase already, so they pass through
// untouched -- only top-level DB columns get converted.

function snakeToCamel(key) {
  return key.replace(/_([a-z0-9])/g, (_, char) => char.toUpperCase())
}

export function rowToDoc(row) {
  if (row == null) return row
  if (Array.isArray(row)) return row.map(rowToDoc)
  if (typeof row !== 'object') return row

  const out = {}
  for (const [key, value] of Object.entries(row)) {
    if (value !== null && typeof value === 'object' && !Array.isArray(value) && !(value instanceof Date)) {
      // A joined/populated relation (e.g. category: {...}) -- convert it too.
      out[snakeToCamel(key)] = rowToDoc(value)
    } else {
      out[snakeToCamel(key)] = value
    }
  }
  if (out.id) out._id = out.id
  return out
}
