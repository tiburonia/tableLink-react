import styles from './SummarySection.module.css'

interface SummarySectionProps {
  summary: {
    totalPoints: number
    totalCoupons: number
    unwrittenReviews: number
    totalStores: number
  }
}

export const SummarySection = ({ summary }: SummarySectionProps) => {
  return (
    <div className={styles.summarySection}>
      <div className={styles.summaryCards}>
        <div className={styles.summaryCard}>
          <div className={styles.summaryIcon}>💰</div>
          <div className={styles.summaryContent}>
            <div className={styles.summaryLabel}>보유 포인트</div>
            <div className={styles.summaryValue}>{summary.totalPoints.toLocaleString()}P</div>
          </div>
        </div>

        <div className={styles.summaryCard}>
          <div className={styles.summaryIcon}>🎟️</div>
          <div className={styles.summaryContent}>
            <div className={styles.summaryLabel}>쿠폰</div>
            <div className={styles.summaryValue}>{summary.totalCoupons}개</div>
          </div>
        </div>

        <div className={styles.summaryCard}>
          <div className={styles.summaryIcon}>✍️</div>
          <div className={styles.summaryContent}>
            <div className={styles.summaryLabel}>미작성 리뷰</div>
            <div className={styles.summaryValue}>{summary.unwrittenReviews}개</div>
          </div>
        </div>

        <div className={styles.summaryCard}>
          <div className={styles.summaryIcon}>🏪</div>
          <div className={styles.summaryContent}>
            <div className={styles.summaryLabel}>단골 매장</div>
            <div className={styles.summaryValue}>{summary.totalStores}곳</div>
          </div>
        </div>
      </div>
    </div>
  )
}
