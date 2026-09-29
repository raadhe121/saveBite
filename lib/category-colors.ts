import type { FoodCategory } from './types'

export const CATEGORY_COLORS: Record<FoodCategory, string> = {
  bakery: '#d97706',
  produce: '#16a34a',
  dairy: '#3b82f6',
  cooked_meals: '#dc2626',
  packaged: '#9333ea',
  beverages: '#0891b2',
  other: '#6b7280',
}

export const CATEGORY_LABELS: Record<FoodCategory, string> = {
  bakery: 'Bakery',
  produce: 'Produce',
  dairy: 'Dairy',
  cooked_meals: 'Cooked meals',
  packaged: 'Packaged',
  beverages: 'Beverages',
  other: 'Other',
}
