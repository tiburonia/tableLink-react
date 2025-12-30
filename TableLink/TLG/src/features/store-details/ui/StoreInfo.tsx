import clsx from 'clsx'
import type { RegionInfo } from '../model'
import styles from './StoreInfo.module.css'

interface StoreInfoProps {
  name: string
  rating: number
  reviewCount: number
  description?: string
  hasPromotion?: boolean
  isNew?: boolean
  category?: string | null
  region?: RegionInfo | null
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
    <div className={styles.storeInfoContainer}>
      <div className={styles.storeInfo}>
        {/* 이벤트 뱃지 영역 */}
        <div className={styles.storeBadgeSection}>
          <div className={styles.badgeLeft}>
            {hasPromotion && (
              <span className={styles.eventBadge}>🎁 첫 방문 할인</span>
            )}
            {isNew && (
              <span className={clsx(styles.eventBadge, styles.new)}>✨ 신규 오픈</span>
            )}
          </div>
          {onStoryClick && (
            <button className={styles.storeStoryBtn} onClick={onStoryClick}>
              <span className={styles.storyIcon}>📖</span>
              <span className={styles.storyText}>매장 스토리</span>
            </button>
          )}
        </div>

        {/* 카테고리 경로 */}
        {region && (
          <div className={styles.storeBreadcrumb}>
            <span className={styles.breadcrumbItem}>{region.sido || '서울'}</span>
            <span className={styles.breadcrumbSeparator}>›</span>
            <span className={styles.breadcrumbItem}>
              {region.sigungu || region.eupmyeondong || '강남구'}
            </span>
            <span className={styles.breadcrumbSeparator}>›</span>
            <span className={styles.breadcrumbItem}>{category || '한식'}</span>
          </div>
        )}

        {/* 매장명과 즐겨찾기 */}
        <div className={styles.storeNameRow}>
          <h1 className={styles.storeMainTitle}>{name}</h1>
          <button
            className={clsx(styles.favoriteBtnV2, isFavorite && styles.active)}
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
        <div className={styles.ratingEmphasisSection}>
          <div className={styles.ratingDisplay}>
            <span className={styles.starIcon}>⭐</span>
            <span className={styles.ratingScore}>{displayRating}</span>
            <span className={styles.ratingDivider}>/</span>
            <span className={styles.ratingMax}>5.0</span>
          </div>
          <button 
            className={styles.reviewCountLink} 
            onClick={onReviewClick}
          >
            리뷰 {reviewCount}개
            <span className={styles.chevronIcon}>›</span>
          </button>
        </div>

        {/* 한줄 소개 */}
       
         <section className={styles.storeSection}>
        <h3 className={styles.sectionTitle}>소개</h3>
        <p className={styles.descriptionText}>
          {description || '품질 좋은 재료와 정성으로 만드는 음식을 제공합니다. 편안한 분위기에서 맛있는 식사를 즐기실 수 있습니다.'}
        </p>
      </section>
      </div>
    </div>
  )
}
