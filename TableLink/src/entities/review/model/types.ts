/**
 * Review Entity - 리뷰 도메인 타입 정의
 */

export interface Review {
  id: number
  userId: number
  storeId: number
  orderId?: number
  rating: number
  content: string
  images?: string[]
  userName?: string
  userProfileImage?: string
  storeName?: string
  createdAt: string
  updatedAt?: string
  likes?: number
  isLiked?: boolean
}

export interface ReviewStats {
  storeId: number
  totalReviews: number
  averageRating: number
  ratingDistribution: {
    5: number
    4: number
    3: number
    2: number
    1: number
  }
}

export interface ReviewSummary {
  id: number
  rating: number
  content: string
  userName: string
  createdAt: string
}
