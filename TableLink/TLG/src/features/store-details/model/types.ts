/**
 * Store Details Types
 * FSD: features/store-details/model
 */

export interface RegionInfo {
  sido?: string
  sigungu?: string
  eupmyeondong?: string
}

export interface StoreBasicDetails {
  name: string
  rating: number
  reviewCount: number
  description?: string
  hasPromotion?: boolean
  isNew?: boolean
  category?: string | null
  region?: RegionInfo | null
}
