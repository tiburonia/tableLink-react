import { StarRating } from './StarRating'
import type { ReviewData } from '../model'
import { formatRelativeDate, getUserAvatarText } from '../model'
import styles from './ReviewItem.module.css'

interface ReviewItemProps {
  review: ReviewData
}

export const ReviewItem = ({ review }: ReviewItemProps) => {
  return (
    <div className={styles.reviewItem}>
      <div className={styles.reviewHeader}>
        <div className={styles.reviewerInfo}>
          <span className={styles.reviewerAvatar}>
            {getUserAvatarText(review.user)}
          </span>
          <div>
            <div className={styles.reviewerName}>{review.user || `사용자${review.user_id}`}</div>
            <div className={styles.reviewDate}>{formatRelativeDate(review.created_at)}</div>
          </div>
        </div>
        <div className={styles.reviewRating}>
          <StarRating rating={review.score} />
        </div>
      </div>
      <div className={styles.reviewContent}>{review.content}</div>
      
      {review.images && review.images.length > 0 && (
        <div className={styles.reviewImages}>
          {review.images.map((image, index) => (
            <img 
              key={index} 
              src={image} 
              alt={`리뷰 이미지 ${index + 1}`}
              className={styles.reviewImage}
            />
          ))}
        </div>
      )}
    </div>
  )
}
