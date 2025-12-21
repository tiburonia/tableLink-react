import { StarRating } from './StarRating'

interface RatingSummaryProps {
  rating: number
  reviewCount?: number
  favoriteCount?: number
}

export const RatingSummary = ({ rating, reviewCount = 0, favoriteCount = 0 }: RatingSummaryProps) => {
  return (
    <div className="rating-summary">
      <div className="rating-score">
        <div className="score-big">{rating.toFixed(1)}</div>
        <div className="rating-stars">
          <StarRating rating={Math.round(rating)} />
        </div>
        <div className="rating-count">
          리뷰 {reviewCount}개 · 찜 {favoriteCount}
        </div>
      </div>
      <div className="rating-actions">
        <button className="icon-btn">
          <span className="icon">📞</span>
          <span className="label">전화</span>
        </button>
        <button className="icon-btn">
          <span className="icon">📍</span>
          <span className="label">길찾기</span>
        </button>
        <button className="icon-btn">
          <span className="icon">📤</span>
          <span className="label">공유</span>
        </button>
      </div>
    </div>
  )
}
