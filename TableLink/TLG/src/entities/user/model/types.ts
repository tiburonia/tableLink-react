/**
 * User Entity - 사용자 도메인 타입 정의
 * API 응답 필드에 맞춤 (user_id, user_pk, uuid)
 */

export interface User {
  user_id: string      // 로그인 아이디 (users.user_id)
  user_pk: number      // DB PK (users.id)
  uuid: string         // UUID (users.uuid)
  name: string
  phone?: string
  email?: string
  address?: string
  birth?: string
  gender?: string
  role?: 'customer' | 'owner' | 'admin'
  isActive?: boolean
  createdAt?: string
  updatedAt?: string
  // JWT 토큰 (로그인 시 포함)
  accessToken?: string
  refreshToken?: string
}

export interface UserProfile extends User {
  totalOrders: number
  totalReviews: number
  favoriteStores: number
  points: number
}

export interface UserSettings {
  user_pk: number
  emailNotifications: boolean
  pushNotifications: boolean
  smsNotifications: boolean
  language: 'ko' | 'en'
  theme: 'light' | 'dark' | 'auto'
}
