import { ReviewItem, type ReviewData } from '@/features/store-review'
import styles from './ReviewList.module.css'

interface ReviewListProps {
  reviews: ReviewData[]
}

export const ReviewList = ({ reviews }: ReviewListProps) => {
  if (reviews.length === 0) {
    return (
      <div className={styles.noReviews}>
        <p>아직 작성된 리뷰가 없습니다.</p>
        <p className={styles.noReviewsSub}>첫 번째 리뷰를 작성해보세요!</p>
      </div>
    )
  }

  const averageRating = (
    reviews.reduce((sum, r) => sum + (r.score || 0), 0) / reviews.length
  ).toFixed(1)

  return (
    <div className={styles.reviewContent}>
      <div className={styles.reviewSummary}>
        <h2 className={styles.reviewCount}>전체 리뷰 {reviews.length}개</h2>
        <div className={styles.averageRating}>
          <span className={styles.ratingStar}>⭐</span>
          <span className={styles.ratingValue}>{averageRating}</span>
        </div>
      </div>

      <div className={styles.reviewList}>
        {reviews.map((review) => (
          <ReviewItem key={review.id} review={review} />
        ))}
      </div>
    </div>
  )
}
