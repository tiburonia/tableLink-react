import { useNavigate, useParams } from 'react-router-dom'
import { ReviewItem, type ReviewData } from './ReviewItem'

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
    <section className="store-section">
      <h3 className="section-title">최근 리뷰</h3>
      <div className="review-list">
        {reviews.map((review) => (
          <ReviewItem key={review.id} review={review} />
        ))}
      </div>
      {reviews.length > 0 && (
        <button className="load-more-btn" onClick={handleViewAllReviews}>
          더 보기
        </button>
      )}
    </section>
  )
}
