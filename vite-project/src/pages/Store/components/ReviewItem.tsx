import { StarRating } from './StarRating'

export interface ReviewData {
  id: string
  author: string
  rating: number
  date: string
  content: string
  avatar: string
}

interface ReviewItemProps {
  review: ReviewData
}

export const ReviewItem = ({ review }: ReviewItemProps) => {
  return (
    <div className="review-item">
      <div className="review-header">
        <div className="reviewer-info">
          <span className="reviewer-avatar">{review.avatar}</span>
          <div>
            <div className="reviewer-name">{review.author}</div>
            <div className="review-date">{review.date}</div>
          </div>
        </div>
        <div className="review-rating">
          <StarRating rating={review.rating} />
        </div>
      </div>
      <div className="review-content">{review.content}</div>
    </div>
  )
}
