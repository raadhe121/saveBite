'use server'

import { requireRole } from '@/lib/session'
import { DIETARY_TAGS, type DietaryTag, type FoodCategory } from '@/lib/types'

const FOOD_CATEGORIES: FoodCategory[] = [
  'bakery',
  'produce',
  'dairy',
  'cooked_meals',
  'packaged',
  'beverages',
  'other',
]

export interface FoodScanResult {
  title: string
  category: FoodCategory
  quantity: number
  unit: string
  dietary_tags: DietaryTag[]
}

export async function scanFoodPhoto(formData: FormData): Promise<FoodScanResult> {
  await requireRole(['donor', 'admin'])

  const apiKey = process.env.GROQ_API_KEY
  if (!apiKey) {
    throw new Error('AI scanning is not configured on this server')
  }

  const photo = formData.get('photo') as File | null
  if (!photo || photo.size === 0) {
    throw new Error('No photo provided')
  }
  if (photo.size > 8 * 1024 * 1024) {
    throw new Error('Photo is too large to scan (max 8MB)')
  }

  const bytes = Buffer.from(await photo.arrayBuffer())
  const dataUrl = `data:${photo.type || 'image/jpeg'};base64,${bytes.toString('base64')}`

  const prompt = `You are looking at a photo of surplus food being donated. Identify what it is and respond with ONLY a JSON object (no markdown, no prose) matching this shape:
{
  "title": string (short, e.g. "20 veg sandwiches"),
  "category": one of ${JSON.stringify(FOOD_CATEGORIES)},
  "quantity": integer estimate of how many items/servings are visible,
  "unit": one of ["items", "servings", "kg", "lbs", "boxes"],
  "dietary_tags": array, zero or more of ${JSON.stringify(DIETARY_TAGS)}
}
Only include a dietary tag if you are reasonably confident from what's visible. If unsure about a field, make your best reasonable estimate rather than omitting it.`

  const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'qwen/qwen3.8-27b',
      messages: [
        {
          role: 'user',
          content: [
            { type: 'text', text: prompt },
            { type: 'image_url', image_url: { url: dataUrl } },
          ],
        },
      ],
      temperature: 0.2,
      response_format: { type: 'json_object' },
    }),
  })

  if (!response.ok) {
    const body = await response.text().catch(() => '')
    throw new Error(`AI scan failed (${response.status}): ${body.slice(0, 300)}`)
  }

  const data = await response.json()
  const raw = data?.choices?.[0]?.message?.content
  if (typeof raw !== 'string') {
    throw new Error('AI scan returned no result')
  }

  let parsed: unknown
  try {
    parsed = JSON.parse(raw)
  } catch {
    throw new Error('AI scan returned an unreadable result')
  }

  if (typeof parsed !== 'object' || parsed === null) {
    throw new Error('AI scan returned an unreadable result')
  }
  const p = parsed as Record<string, unknown>

  const category = FOOD_CATEGORIES.includes(p.category as FoodCategory)
    ? (p.category as FoodCategory)
    : 'other'

  const quantityNum = Math.max(1, Math.round(Number(p.quantity) || 1))

  const unit = typeof p.unit === 'string' && p.unit.trim() ? p.unit : 'items'

  const dietaryTags = Array.isArray(p.dietary_tags)
    ? (p.dietary_tags.filter((t) => DIETARY_TAGS.includes(t as DietaryTag)) as DietaryTag[])
    : []

  return {
    title: typeof p.title === 'string' && p.title.trim() ? p.title.trim() : 'Food donation',
    category,
    quantity: quantityNum,
    unit,
    dietary_tags: dietaryTags,
  }
}
