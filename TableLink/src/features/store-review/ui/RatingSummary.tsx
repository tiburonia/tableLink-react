import { StarRating } from './StarRating'
import styles from './RatingSummary.module.css'

interface RatingSummaryProps {
  rating: number
  reviewCount?: number
  favoriteCount?: number
}

export const RatingSummary = ({ rating, reviewCount = 0, favoriteCount = 0 }: RatingSummaryProps) => {
  return (
    <div className={styles.ratingSummary}>
      <div className={styles.ratingScore}>
        <div className={styles.scoreBig}>{rating.toFixed(1)}</div>
        <div className={styles.ratingStars}>
          <StarRating rating={Math.round(rating)} />
        </div>
        <div className={styles.ratingCount}>
          리뷰 {reviewCount}개 · 찜 {favoriteCount}
        </div>
      </div>
      <div className={styles.ratingActions}>
        <button className={styles.iconBtn}>
          <span className={styles.icon}>📞</span>
          <span className={styles.label}>전화</span>
        </button>
        <button className={styles.iconBtn}>
          <span className={styles.icon}>📍</span>
          <span className={styles.label}>길찾기</span>
        </button>
        <button className={styles.iconBtn}>
          <span className={styles.icon}>📤</span>
          <span className={styles.label}>공유</span>
        </button>
      </div>
    </div>
  )
}
