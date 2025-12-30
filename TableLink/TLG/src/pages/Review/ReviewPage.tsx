import { useParams, useNavigate } from 'react-router-dom'
import { LoadingSpinner } from '@/shared/ui/LoadingSpinner'
import { ReviewHeader, ReviewList } from './ui'
import { useReviewData } from '@/features/review-write'
import styles from './ReviewPage.module.css'

export const ReviewPage = () => {
  const { storeId } = useParams<{ storeId: string }>()
  const navigate = useNavigate()
  const { reviews, loading, error, storeName } = useReviewData(storeId)

  const handleBack = () => {
    navigate(-1)
  }

  if (loading) {
    return (
      <div className="mobile-app">
        <div className={styles.reviewPage}>
          <ReviewHeader storeName="리뷰" onBack={handleBack} />
          <LoadingSpinner fullScreen text="리뷰를 불러오는 중..." />
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="mobile-app">
        <div className={styles.reviewPage}>
          <ReviewHeader storeName="리뷰" onBack={handleBack} />
          <div className={styles.errorContainer}>
            <p className={styles.errorMessage}>{error}</p>
            <button className={styles.retryButton} onClick={() => window.location.reload()}>
              다시 시도
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="mobile-app">
      <div className={styles.reviewPage}>
        <ReviewHeader storeName={storeName} onBack={handleBack} />
        <ReviewList reviews={reviews} />
      </div>
    </div>
  )
}
