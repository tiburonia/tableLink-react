import { StarRating } from './StarRating'
import './ReviewItem.css'

export interface ReviewData {
  id: number
  order_id: number
  store_id: number
  rating: number
  content: string
  images: string[] | null
  status: 'VISIBLE' | 'HIDDEN'
  created_at: string
  updated_at: string
  user_id: number
  // 추가 정보 (JOIN으로 가져올 수 있는 데이터)
  user_name?: string
  user_avatar?: string
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
    <div className="review-item">
      <div className="review-header">
        <div className="reviewer-info">
          <span className="reviewer-avatar">
            {review.user_avatar || review.user_name?.charAt(0) || '👤'}
          </span>
          <div>
            <div className="reviewer-name">{review.user_name || `사용자${review.user_id}`}</div>
            <div className="review-date">{formatDate(review.created_at)}</div>
          </div>
        </div>
        <div className="review-rating">
          <StarRating rating={review.rating} />
        </div>
      </div>
      <div className="review-content">{review.content}</div>
      
      {review.images && review.images.length > 0 && (
        <div className="review-images">
          {review.images.map((image, index) => (
            <img 
              key={index} 
              src={image} 
              alt={`리뷰 이미지 ${index + 1}`}
              className="review-image"
            />
          ))}
        </div>
      )}
    </div>
  )
}
