/**
 * MyPage Types
 */

export interface UserInfo {
  id: string
  userId: number
  username: string
  name?: string
  email?: string
  phone?: string
}

export interface Order {
  id: number
  storeId: number
  storeName: string
  totalAmount: number
  orderStatus: string
  createdAt: string
  items?: OrderItem[]
}

export interface OrderItem {
  id: number
  menuName: string
  quantity: number
  price: number
}

export interface Review {
  id: number
  storeId: number
  storeName: string
  rating: number
  content: string
  createdAt: string
}

export interface RegularSummary {
  topLevelName: string
  topLevel: 'PLATINUM' | 'GOLD' | 'SILVER' | 'BRONZE'
  totalPoints: number
  totalCoupons: number
}

export interface MyPageData {
  userInfo: UserInfo
  orders: Order[]
  reviews: Review[]
  regularSummary: RegularSummary
  stats: {
    totalOrders: number
    totalReviews: number
  }
}
