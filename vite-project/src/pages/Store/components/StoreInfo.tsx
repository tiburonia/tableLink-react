import './StoreInfo.css'

interface StoreInfoProps {
  name: string
  rating: number
  reviewCount: number
  description?: string
  hasPromotion?: boolean
  isNew?: boolean
  category?: string | null
  region?: {
    sido?: string
    sigungu?: string
    eupmyeondong?: string
  } | null
  isFavorite: boolean
  onFavoriteClick: () => void
  onStoryClick?: () => void
  onReviewClick?: () => void
}

export const StoreInfo = ({
  name,
  rating,
  reviewCount,
  description,
  hasPromotion = false,
  isNew = false,
  category,
  region,
  isFavorite,
  onFavoriteClick,
  onStoryClick,
  onReviewClick
}: StoreInfoProps) => {
  const displayRating = rating.toFixed(1)

  return (
    <div className="store-info-container">
      <div className="store-info">
        {/* 이벤트 뱃지 영역 */}
        <div className="store-badge-section">
          <div className="badge-left">
            {hasPromotion && (
              <span className="event-badge">🎁 첫 방문 할인</span>
            )}
            {isNew && (
              <span className="event-badge new">✨ 신규 오픈</span>
            )}
          </div>
          {onStoryClick && (
            <button className="store-story-btn" onClick={onStoryClick}>
              <span className="story-icon">📖</span>
              <span className="story-text">매장 스토리</span>
            </button>
          )}
        </div>

        {/* 카테고리 경로 */}
        {region && (
          <div className="store-breadcrumb">
            <span className="breadcrumb-item">{region.sido || '서울'}</span>
            <span className="breadcrumb-separator">›</span>
            <span className="breadcrumb-item">
              {region.sigungu || region.eupmyeondong || '강남구'}
            </span>
            <span className="breadcrumb-separator">›</span>
            <span className="breadcrumb-item">{category || '한식'}</span>
          </div>
        )}

        {/* 매장명과 즐겨찾기 */}
        <div className="store-name-row">
          <h1 className="store-main-title">{name}</h1>
          <button
            className={`favorite-btn-v2 ${isFavorite ? 'active' : ''}`}
            onClick={onFavoriteClick}
            aria-label="즐겨찾기"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill={isFavorite ? 'currentColor' : 'none'}>
              <path
                d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"
                stroke="currentColor"
                strokeWidth="2"
              />
            </svg>
          </button>
        </div>

        {/* 별점 및 리뷰 강조 영역 */}
        <div className="rating-emphasis-section">
          <div className="rating-display">
            <span className="star-icon">⭐</span>
            <span className="rating-score">{displayRating}</span>
            <span className="rating-divider">/</span>
            <span className="rating-max">5.0</span>
          </div>
          <button 
            className="review-count-link" 
            onClick={onReviewClick}
          >
            리뷰 {reviewCount}개
            <span className="chevron-icon">›</span>
          </button>
        </div>

        {/* 한줄 소개 */}
       
         <section className="store-section">
        <h3 className="section-title">소개</h3>
        <p className="description-text">
          {description || '품질 좋은 재료와 정성으로 만드는 음식을 제공합니다. 편안한 분위기에서 맛있는 식사를 즐기실 수 있습니다.'}
        </p>
      </section>
      </div>
    </div>
  )
}
