/**
 * User Entity - 사용자 도메인 타입 정의
 */

export interface User {
  id: string
  userId: number
  username: string
  email: string
  phone?: string
  nickname?: string
  profileImage?: string
  role: 'customer' | 'owner' | 'admin'
  isActive: boolean
  createdAt: string
  updatedAt?: string
}

export interface UserProfile extends User {
  totalOrders: number
  totalReviews: number
  favoriteStores: number
  points: number
}

export interface UserSettings {
  userId: number
  emailNotifications: boolean
  pushNotifications: boolean
  smsNotifications: boolean
  language: 'ko' | 'en'
  theme: 'light' | 'dark' | 'auto'
}
