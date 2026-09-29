// Haversine distance in miles between two lat/lng points.
export function distanceMiles(lat1: number, lng1: number, lat2: number, lng2: number) {
  const R = 3958.8
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLng = ((lng2 - lng1) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

// Best-effort parse of a leading number out of a free-text quantity field
// (donors type things like "20 loaves" or "3-4 boxes").
export function parseQuantityNumber(quantity: string): number | null {
  const match = quantity.match(/[\d.]+/)
  return match ? Number(match[0]) : null
}
