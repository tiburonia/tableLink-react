import { useState, useEffect } from 'react'
import { reviewService } from '@/shared/api'
import type { ReviewData } from '@/features/store-review'

export const useReviewData = (storeId: string | undefined) => {
  const [reviews, setReviews] = useState<ReviewData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [storeName, setStoreName] = useState<string>('')

  useEffect(() => {
    const loadReviews = async () => {
      if (!storeId) {
        setError('매장 ID가 없습니다.')
        setLoading(false)
        return
      }

      setLoading(true)
      setError(null)

      try {
        const result = await reviewService.getStoreReviews(storeId)

        if (result.success) {
          setReviews(result.reviews as ReviewData[])
          const cachedStoreName = sessionStorage.getItem(`store_${storeId}_name`)
          setStoreName(cachedStoreName || '매장')
        } else {
          setError(result.message || '리뷰를 불러올 수 없습니다.')
        }
      } catch (err) {
        console.error('리뷰 로딩 실패:', err)
        setError('리뷰를 불러오는 중 오류가 발생했습니다.')
      } finally {
        setLoading(false)
      }
    }

    loadReviews()
  }, [storeId])

  return { reviews, loading, error, storeName }
}
