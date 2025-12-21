import './SummarySection.css'

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
    <div className="summary-section">
      <div className="summary-cards">
        <div className="summary-card">
          <div className="summary-icon">💰</div>
          <div className="summary-content">
            <div className="summary-label">보유 포인트</div>
            <div className="summary-value">{summary.totalPoints.toLocaleString()}P</div>
          </div>
        </div>

        <div className="summary-card">
          <div className="summary-icon">🎟️</div>
          <div className="summary-content">
            <div className="summary-label">쿠폰</div>
            <div className="summary-value">{summary.totalCoupons}개</div>
          </div>
        </div>

        <div className="summary-card">
          <div className="summary-icon">✍️</div>
          <div className="summary-content">
            <div className="summary-label">미작성 리뷰</div>
            <div className="summary-value">{summary.unwrittenReviews}개</div>
          </div>
        </div>

        <div className="summary-card">
          <div className="summary-icon">🏪</div>
          <div className="summary-content">
            <div className="summary-label">단골 매장</div>
            <div className="summary-value">{summary.totalStores}곳</div>
          </div>
        </div>
      </div>
    </div>
  )
}
