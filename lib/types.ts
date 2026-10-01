export type UserRole = 'donor' | 'receiver' | 'volunteer' | 'admin'
export type ListingStatus = 'available' | 'claimed' | 'picked_up' | 'expired' | 'cancelled'

// Display label per the §3.5 status lifecycle table — 'picked_up' reads as
// "Completed" to end users while the DB/enum value stays unchanged.
export const LISTING_STATUS_LABEL: Record<ListingStatus, string> = {
  available: 'Available',
  claimed: 'Claimed',
  picked_up: 'Completed',
  expired: 'Expired',
  cancelled: 'Cancelled',
}
export type FoodCategory =
  | 'bakery'
  | 'produce'
  | 'dairy'
  | 'cooked_meals'
  | 'packaged'
  | 'beverages'
  | 'other'
export type VerificationStatus = 'unverified' | 'pending' | 'verified' | 'rejected'
export type DietaryTag = 'vegetarian' | 'vegan' | 'halal' | 'gluten_free' | 'contains_nuts'

export const DIETARY_TAGS: DietaryTag[] = [
  'vegetarian',
  'vegan',
  'halal',
  'gluten_free',
  'contains_nuts',
]

export interface Profile {
  id: string
  role: UserRole
  org_name: string | null
  full_name: string | null
  phone: string | null
  address: string | null
  lat: number | null
  lng: number | null
  photo_url: string | null
  business_type: string | null
  operating_hours: string | null
  verification_status: VerificationStatus
  banned_at: string | null
  notify_radius_miles: number
  notify_new_listings: boolean
  notify_claims: boolean
  created_at: string
}

export interface Listing {
  id: string
  donor_id: string
  title: string
  description: string | null
  category: FoodCategory
  quantity: string
  quantity_total: number | null
  quantity_claimed: number | null
  unit: string
  dietary_tags: DietaryTag[]
  photo_url: string | null
  lat: number
  lng: number
  address: string
  available_from: string
  pickup_start: string | null
  pickup_end: string | null
  special_instructions: string | null
  expires_at: string
  status: ListingStatus
  claimed_by: string | null
  claimed_at: string | null
  picked_up_at: string | null
  created_at: string
  profiles?: Pick<Profile, 'org_name' | 'full_name'> | null
}

export interface Message {
  id: string
  listing_id: string
  sender_id: string
  body: string
  created_at: string
}

export type ClaimStatus = 'pending' | 'completed'

export interface Claim {
  id: string
  listing_id: string
  receiver_id: string
  volunteer_id: string | null
  quantity_claimed: number | null
  pickup_code: string | null
  status: ClaimStatus
  picked_up_at: string | null
  created_at: string
}
