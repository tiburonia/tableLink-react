export interface Store {
  id: string
  name: string
  phone?: string
  description?: string
  price?: number
  is_open?: boolean
  category?: string
  rating?: number
  address?: string
  hours?: string
  image?: string
  latitude?: number
  longitude?: number
  reviewCount?: number
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
