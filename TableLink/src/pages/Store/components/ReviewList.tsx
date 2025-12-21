import { ReviewItem, type ReviewData } from './ReviewItem'

interface ReviewListProps {
  reviews: ReviewData[]
}

export const ReviewList = ({ reviews }: ReviewListProps) => {
  return (
    <section className="store-section">
      <h3 className="section-title">최근 리뷰</h3>
      <div className="review-list">
        {reviews.map((review) => (
          <ReviewItem key={review.id} review={review} />
        ))}
      </div>
      <button className="load-more-btn">더 보기</button>
    </section>
  )
}
