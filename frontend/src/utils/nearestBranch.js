import * as branchService from '../services/branchService'

// React -> navigator.geolocation -> lat/lng -> backend -> MongoDB branches -> nearest branch.
// Falls back to the first available branch if geolocation is denied/unsupported/slow,
// so branch auto-selection never blocks on the user's location permission.
export function getNearestBranch() {
  const fallback = () =>
    branchService
      .listBranches()
      .then((res) => res.data?.branches?.[0] || null)
      .catch(() => null)

  if (!navigator.geolocation) return fallback()

  return new Promise((resolve) => {
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        branchService
          .listBranches(pos.coords.latitude, pos.coords.longitude)
          .then((res) => resolve(res.data?.branches?.[0] || null))
          .catch(() => fallback().then(resolve))
      },
      () => fallback().then(resolve),
      { timeout: 5000, maximumAge: 5 * 60 * 1000 }
    )
  })
}
