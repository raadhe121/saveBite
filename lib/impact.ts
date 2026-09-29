// Rough MVP conversion factors for turning a listing's free-text quantity
// into pounds / meals / CO2e avoided. Not scientifically precise — just
// enough to give donors and receivers a sense of their impact.
export const LBS_PER_UNIT: Record<string, number> = {
  kg: 2.20462,
  lbs: 1,
  boxes: 10,
  servings: 0.5,
  items: 0.4,
}

export function toPounds(quantity: number | null, unit: string, fallback = 5) {
  if (quantity == null) return fallback
  const factor = LBS_PER_UNIT[unit] ?? 0.5
  return quantity * factor
}

export function poundsToMeals(pounds: number) {
  return pounds / 0.5
}

// ~2.5kg CO2e avoided per kg of food rescued (widely cited food-waste estimate).
export function poundsToCo2Kg(pounds: number) {
  return pounds * 1.134
}

export interface ImpactRow {
  quantity_total: number | null
  quantity_claimed: number | null
  unit: string
  category: string
  picked_up_at: string | null
}

function weekLabel(date: Date) {
  const start = new Date(date)
  start.setDate(start.getDate() - start.getDay())
  return start.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
}

export function summarizeImpact(rows: ImpactRow[]) {
  let pounds = 0
  const byWeek = new Map<string, number>()
  const byCategory = new Map<string, number>()

  for (const r of rows) {
    const qty = r.quantity_claimed ?? r.quantity_total
    const lbs = toPounds(qty, r.unit)
    pounds += lbs

    if (r.picked_up_at) {
      const key = weekLabel(new Date(r.picked_up_at))
      byWeek.set(key, (byWeek.get(key) ?? 0) + lbs)
    }
    byCategory.set(r.category, (byCategory.get(r.category) ?? 0) + lbs)
  }

  return {
    pounds,
    meals: poundsToMeals(pounds),
    co2Kg: poundsToCo2Kg(pounds),
    byWeek,
    byCategory,
  }
}

// Last `n` week-start labels in order, so a chart shows zero-filled weeks
// instead of skipping ones with no activity.
export function weeklySeries(byWeek: Map<string, number>, n = 8) {
  const now = new Date()
  const start = new Date(now)
  start.setDate(start.getDate() - start.getDay())

  const series: { label: string; value: number }[] = []
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(start)
    d.setDate(d.getDate() - i * 7)
    const label = d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
    series.push({ label, value: Math.round((byWeek.get(label) ?? 0) * 10) / 10 })
  }
  return series
}

export function topCategories(byCategory: Map<string, number>, n = 5) {
  return [...byCategory.entries()]
    .map(([label, value]) => ({ label: label.replace('_', ' '), value: Math.round(value * 10) / 10 }))
    .sort((a, b) => b.value - a.value)
    .slice(0, n)
}
