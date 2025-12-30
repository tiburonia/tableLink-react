const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000'

interface Review {
  id: number
  order_id: number
  store_id: number
  user_id: number
  rating: number
  score: number
  content: string
  images: string[] | null
  status: 'VISIBLE' | 'HIDDEN'
  created_at: string
  updated_at: string
  user?: string
  user_name?: string
}

interface GetStoreReviewsResponse {
  success: boolean
  reviews: Review[]
  total: number
  message?: string
}

export const reviewService = {
  /**
   * 특정 매장의 모든 리뷰 조회
   */
  getStoreReviews: async (storeId: string): Promise<GetStoreReviewsResponse> => {
    try {
      const res = await fetch(`${API_BASE}/reviews/stores/${storeId}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      })
      
      if (!res.ok) {
        const error = await res.json().catch(() => ({ error: '리뷰 조회 실패' }))
        return { 
          success: false, 
          reviews: [], 
          total: 0, 
          message: error.error || '리뷰 조회 실패' 
        }
      }
      
      const data = await res.json()
      
      return {
        success: true,
        reviews: data.reviews || [],
        total: data.total || 0,
      }
    } catch (err) {
      console.error('reviewService.getStoreReviews error', err)
      return { 
        success: false, 
        reviews: [], 
        total: 0, 
        message: '서버 연결 실패' 
      }
    }
  },
}
