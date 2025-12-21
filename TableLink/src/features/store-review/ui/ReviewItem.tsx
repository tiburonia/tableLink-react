import { StarRating } from './StarRating'
import styles from './ReviewItem.module.css'

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

interface ReviewItemProps {
  review: ReviewData
}

export const ReviewItem = ({ review }: ReviewItemProps) => {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffTime = Math.abs(now.getTime() - date.getTime())
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    
    if (diffDays === 1) return '오늘'
    if (diffDays === 2) return '어제'
    if (diffDays <= 7) return `${diffDays}일 전`
    if (diffDays <= 30) return `${Math.floor(diffDays / 7)}주 전`
    if (diffDays <= 365) return `${Math.floor(diffDays / 30)}개월 전`
    return `${Math.floor(diffDays / 365)}년 전`
  }

  return (
    <div className={styles.reviewItem}>
      <div className={styles.reviewHeader}>
        <div className={styles.reviewerInfo}>
          <span className={styles.reviewerAvatar}>
            { review.user?.charAt(0) || '👤'}
          </span>
          <div>
            <div className={styles.reviewerName}>{review.user || `사용자${review.user_id}`}</div>
            <div className={styles.reviewDate}>{formatDate(review.created_at)}</div>
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
