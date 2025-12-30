import { ReviewSummarySection } from './ReviewSummarySection'
import { ReviewList } from './ReviewList'
import type { ReviewData } from '../model'
import styles from './ReviewTab.module.css'

interface ReviewTabProps {
  reviews: ReviewData[]
}

export const ReviewTab = ({ reviews }: ReviewTabProps) => {
  return (
    <div className={styles.reviewTab}>
      <ReviewSummarySection />
      <ReviewList reviews={reviews} />
    </div>
  )
}
