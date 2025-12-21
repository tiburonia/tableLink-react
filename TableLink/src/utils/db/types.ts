/**
 * 사용자 타입
 */
export interface User {
  id: string
  email: string
  name: string
  phone?: string
  created_at: Date
  updated_at: Date
}

/**
 * 매장 타입
 */
export interface Store {
  id: string
  name: string
  address: string
  phone?: string
  latitude: number
  longitude: number
  category?: string
  rating?: number
  description?: string
  opening_hours?: string
  created_at: Date
  updated_at: Date
}

/**
 * 주문 타입
 */
export interface Order {
  id: string
  user_id: string
  store_id: string
  status: 'pending' | 'confirmed' | 'preparing' | 'ready' | 'completed' | 'cancelled'
  total_price: number
  items: OrderItem[]
  created_at: Date
  updated_at: Date
}

/**
 * 주문 항목 타입
 */
export interface OrderItem {
  id: string
  order_id: string
  product_id: string
  quantity: number
  price: number
  notes?: string
}

/**
 * 테이블 타입
 */
export interface Table {
  id: string
  store_id: string
  table_number: string
  capacity: number
  status: 'available' | 'occupied' | 'reserved'
  created_at: Date
  updated_at: Date
}

/**
 * 예약 타입
 */
export interface Reservation {
  id: string
  user_id: string
  store_id: string
  table_id: string
  reservation_time: Date
  party_size: number
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled'
  notes?: string
  created_at: Date
  updated_at: Date
}

/**
 * 메뉴 타입
 */
export interface Menu {
  id: string
  store_id: string
  name: string
  description?: string
  price: number
  category: string
  image_url?: string
  is_available: boolean
  created_at: Date
  updated_at: Date
}

/**
 * 리뷰 타입
 */
export interface Review {
  id: string
  user_id: string
  store_id: string
  rating: number
  comment?: string
  created_at: Date
  updated_at: Date
}
