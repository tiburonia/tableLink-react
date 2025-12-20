export interface MenuItem {
  id: number
  store_id: number
  name: string
  description: string
  cook_station: string
  price: number
}

export interface Table {
  id: number
  store_id: number
  table_name: string
  capacity: number
  status: 'AVAILABLE' | 'OCCUPIED' | 'RESERVED'
}

export interface Review {
  id: number
  store_id: number
  user_id: number
  rating: number
  comment: string
  created_at: string
}

export interface Promotion {
  id: number
  store_id: number
  level: string
  min_orders: number
  min_spent: number
}

export interface Amenities {
  wifi: boolean
  parking: boolean
  pet_friendly: boolean
  power_outlet: boolean
  smoking_area: boolean
}

export interface TableStatusSummary {
  available: number
  occupied: number
  total: number
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

export interface FilterState {
  category: string
  sort: string
}

export type PageType = 'home' | 'map' | 'qr' | 'mypage'
