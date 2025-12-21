/**
 * Store Entity - 매장 도메인 타입 정의
 */

// 기본 편의시설 타입
export interface Amenities {
  wifi: boolean
  parking: boolean
  pet_friendly: boolean
  power_outlet: boolean
  smoking_area: boolean
}

// 테이블 상태 요약
export interface TableStatusSummary {
  available: number
  occupied: number
  total: number
}

// 메뉴 아이템
export interface MenuItem {
  id: number
  store_id: number
  name: string
  description: string
  cook_station: string
  price: number
}

// 테이블 정보
export interface Table {
  id: number
  store_id: number
  table_name: string
  capacity: number
  status: 'AVAILABLE' | 'OCCUPIED' | 'RESERVED'
}

// 리뷰 정보
export interface Review {
  id: number
  order_id: number
  store_id: number
  score: number
  content: string
  images: string[] | null
  status: 'VISIBLE' | 'HIDDEN'
  created_at: string
  updated_at: string
  user_id: number
  user_name?: string
  user: string
}

// 프로모션 정보
export interface Promotion {
  id: number
  store_id: number
  level: string
  min_orders: number
  min_spent: number
}

export interface Store {
  id: string
  name: string
  is_open: boolean
  store_tel_number?: number
  rating_average?: number
  review_count?: number
  sido?: string
  sigungu?: string
  eupmyeondong?: string
  full_address?: string
  lng?: number
  lat?: number
  menu?: MenuItem[]
  tables?: Table[]
  reviews?: Review[]
  promotions?: Promotion[]
  amenities?: Amenities
  menuCount?: number
  tableCount?: number
  reviewCount?: number
  promotionCount?: number
  tableStatusSummary?: TableStatusSummary
  distance?: number
  
  // 레거시 필드 (하위 호환성)
  phone?: string
  description?: string
  price?: number
  category?: string
  rating?: number
  address?: string
  hours?: string
  image?: string
  latitude?: number
  longitude?: number
  favoriteCount?: number
  isFavorite?: boolean
  region?: {
    sido?: string
    sigungu?: string
    eupmyeondong?: string
  }
}

export interface BusinessHours {
  day: string
  open: string
  close: string
  isHoliday?: boolean
}

export interface StoreMenu {
  id: number
  storeId: number
  name: string
  description?: string
  price: number
  category?: string
  image?: string
  isAvailable?: boolean
}

export interface StorePromotion {
  id: number
  storeId: number
  title: string
  description: string
  discountRate?: number
  startDate: string
  endDate: string
  isActive: boolean
}

export interface StoreStats {
  storeId: number
  totalReviews: number
  averageRating: number
  totalOrders: number
  regularCustomers: number
}
