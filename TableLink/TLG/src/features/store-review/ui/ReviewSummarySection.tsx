import { StarRating } from './StarRating'
import styles from './ReviewSummarySection.module.css'

export const ReviewSummarySection = () => {
  return (
    <section className={styles.storeSection}>
      <div className={styles.reviewSummary}>
        <div className={styles.summaryScore}>
          <div className={styles.scoreLarge}>4.5</div>
          <div>
            <StarRating rating={5} />
          </div>
          <div className={styles.reviewCountText}>328개의 리뷰</div>
        </div>
        <div className={styles.scoreDistribution}>
          {[5, 4, 3, 2, 1].map(star => (
            <div key={star} className={styles.scoreBar}>
              <span className={styles.starLabel}>{star}★</span>
              <div className={styles.barContainer}>
                <div 
                  className={styles.barFill}
                  style={{ width: `${star === 5 ? 75 : star === 4 ? 20 : 5}%` }}
                ></div>
              </div>
              <span className={styles.barPercent}>{star === 5 ? 75 : star === 4 ? 20 : 5}%</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
