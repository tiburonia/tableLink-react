import { StarRating } from './StarRating'

export const ReviewSummarySection = () => {
  return (
    <section className="store-section">
      <div className="review-summary">
        <div className="summary-score">
          <div className="score-large">4.5</div>
          <div>
            <StarRating rating={5} />
          </div>
          <div className="review-count-text">328개의 리뷰</div>
        </div>
        <div className="score-distribution">
          {[5, 4, 3, 2, 1].map(star => (
            <div key={star} className="score-bar">
              <span className="star-label">{star}★</span>
              <div className="bar-container">
                <div 
                  className="bar-fill" 
                  style={{ width: `${star === 5 ? 75 : star === 4 ? 20 : 5}%` }}
                ></div>
              </div>
              <span className="bar-percent">{star === 5 ? 75 : star === 4 ? 20 : 5}%</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
