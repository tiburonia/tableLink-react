import { ReviewSummarySection } from './ReviewSummarySection'
import { ReviewList } from './ReviewList'
import type { ReviewData } from './ReviewItem'

interface ReviewTabProps {
  reviews: ReviewData[]
}

export const ReviewTab = ({ reviews }: ReviewTabProps) => {
  return (
    <div className="review-tab">
      <ReviewSummarySection />
      <ReviewList reviews={reviews} />
    </div>
  )
}
