import { useNavigate, useParams } from 'react-router-dom'
import { ReviewItem } from './ReviewItem'
import type { ReviewData } from '../model'
import styles from './ReviewList.module.css'

interface ReviewListProps {
  reviews: ReviewData[]
}

export const ReviewList = ({ reviews }: ReviewListProps) => {
  const navigate = useNavigate()
  const { storeId } = useParams<{ storeId: string }>()

  const handleViewAllReviews = () => {
    if (storeId) {
      navigate(`/rs/${storeId}/rv`)
    }
  }
  return (
    <section className={styles.storeSection}>
      <h3 className={styles.sectionTitle}>최근 리뷰</h3>
      <div className={styles.reviewList}>
        {reviews.map((review) => (
          <ReviewItem key={review.id} review={review} />
        ))}
      </div>
      {reviews.length > 0 && (
        <button className={styles.loadMoreBtn} onClick={handleViewAllReviews}>
          더 보기
        </button>
      )}
    </section>
  )
}
