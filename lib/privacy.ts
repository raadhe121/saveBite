// §6 Safety & Privacy: the exact street address (and anything that could
// pinpoint it — precise map pin, turn-by-turn directions, pickup
// instructions) is only shown to the donor and whoever has actually claimed
// the listing. Everyone else sees just the general area.
export function coarseLocation(address: string) {
  const parts = address
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
  if (parts.length <= 1) return 'General area shown after you claim'
  return parts.slice(1).join(', ')
}
