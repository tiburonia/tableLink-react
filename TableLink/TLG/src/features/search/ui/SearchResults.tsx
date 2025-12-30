/**
 * 검색 결과 컴포넌트
 */

import type { SearchStore } from '../model'
import styles from './SearchResults.module.css'

interface SearchResultsProps {
  results: SearchStore[]
  loading: boolean
  error: string | null
  onStoreClick: (storeId: number) => void
  onRetry: () => void
}

export const SearchResults = ({ results, loading, error, onStoreClick, onRetry }: SearchResultsProps) => {
  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.loadingSpinner}></div>
        <p className={styles.loadingText}>검색 중...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className={styles.errorContainer}>
        <div className={styles.errorIcon}>⚠️</div>
        <p className={styles.errorMessage}>{error}</p>
        <button onClick={onRetry} className={styles.retryBtn}>
          다시 시도
        </button>
      </div>
    )
  }

  if (results.length === 0) {
    return (
      <div className={styles.emptyContainer}>
        <div className={styles.emptyIcon}>🔍</div>
        <p className={styles.emptyMessage}>검색 결과가 없습니다</p>
      </div>
    )
  }

  return (
    <div className={styles.resultsContainer}>
      <div className={styles.resultsHeader}>
        <p className={styles.resultsCount}>
          <strong>{results.length}개</strong>의 매장을 찾았습니다
        </p>
      </div>

      <div className={styles.resultsList}>
        {results.map((store) => (
          <div key={store.id} className={styles.storeCard} onClick={() => onStoreClick(store.id)}>
            <div className={styles.storeInfo}>
              <div className={styles.storeHeader}>
                <h3 className={styles.storeName}>{store.name}</h3>
                <span className={`${styles.statusBadge} ${store.isOpen ? styles.statusOpen : styles.statusClosed}`}>
                  {store.isOpen ? '영업중' : '영업종료'}
                </span>
              </div>

              <p className={styles.category}>{store.category}</p>
              <p className={styles.address}>{store.address}</p>

              <div className={styles.ratingContainer}>
                <span className={styles.rating}>
                  ⭐ {store.ratingAverage.toFixed(1)}
                </span>
                <span className={styles.reviewCount}>리뷰 {store.reviewCount}개</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
