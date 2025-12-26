/**
 * Store Review Types
 * FSD: features/store-review/model
 */

export interface ReviewData {
  id: number
  order_id: number
  store_id: number
  score: number
  rating?: number  // score와 동일, 하위 호환성용
  content: string
  images: string[] | null
  status: 'VISIBLE' | 'HIDDEN'
  created_at: string
  updated_at: string
  user_id: number
  // 추가 정보 (JOIN으로 가져올 수 있는 데이터)
  user_name?: string
  user_avatar?: string | null
  user?: string
}

export interface ReviewSummary {
  averageRating: number
  totalCount: number
  distribution: {
    [key: number]: number  // 1~5 별점별 개수
  }
}
