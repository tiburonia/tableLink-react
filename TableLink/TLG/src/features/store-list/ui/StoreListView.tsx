/**
 * StoreListView - 매장 목록 Feature UI
 * 
 * 검색, 필터, 매장 카드 리스트를 포함한 완전한 UI
 * - 초기 로딩 후 "더보기" 버튼
 * - 더보기 클릭 후 무한 스크롤 활성화
 */

import { useNavigate } from 'react-router-dom'
import type { StoreFilterState } from '../model/types'
import styles from './StoreListView.module.css'
import type { RefObject } from 'react'

interface Store {
  id: string
  name: string
  category?: string
  address?: string
  rating?: number
  distance?: number
}

interface StoreListViewProps {
  stores: Store[]
  searchQuery: string
  filters: StoreFilterState
  onSearchChange: (query: string) => void
  onFiltersChange: (filters: StoreFilterState) => void
  loading?: boolean
  error?: string | null
  // 페이지네이션 props
  hasNext?: boolean
  isLoadingMore?: boolean
  autoLoadEnabled?: boolean
  loadMoreRef?: RefObject<HTMLDivElement | null>
  onLoadMore?: () => void
}

export const StoreListView = ({
  stores,
  searchQuery,
  filters,
  onSearchChange,
  onFiltersChange,
  loading,
  error,
  hasNext = false,
  isLoadingMore = false,
  autoLoadEnabled = false,
  loadMoreRef,
  onLoadMore,
}: StoreListViewProps) => {
  const navigate = useNavigate()

  if (loading) {
    return (
      <div className={styles.loadingState}>
        <p>매장 정보를 불러오는 중...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className={styles.errorState}>
        <p>{error}</p>
      </div>
    )
  }

  return (
    <div className={styles.storeListView}>
      {/* 검색 바 */}
      <div className={styles.searchSection}>
        <div className={styles.searchBar}>
          <button className={styles.searchIcon}>🔍</button>
          <input
            type="text"
            placeholder="매장명, 카테고리 또는 위치 검색..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className={styles.searchInput}
          />
        </div>

        {/* 키워드 네비게이션 */}
        <div className={styles.keywordNav}>
          <button className={styles.keywordBtn}>🍗 치킨</button>
          <button className={styles.keywordBtn}>🍕 피자</button>
          <button className={styles.keywordBtn}>💳 민생지원금</button>
          <button className={styles.keywordBtn}>🔥 Top 100</button>
        </div>
      </div>

      {/* 필터 탭 */}
      <div className={styles.filterTabs}>
        <button
          className={`${styles.filterTab} ${filters.category === 'all' ? styles.active : ''}`}
          onClick={() => onFiltersChange({ ...filters, category: 'all' })}
        >
          전체
        </button>
        <button
          className={`${styles.filterTab} ${filters.category === 'restaurant' ? styles.active : ''}`}
          onClick={() => onFiltersChange({ ...filters, category: 'restaurant' })}
        >
          🍽️ 음식점
        </button>
        <button
          className={`${styles.filterTab} ${filters.category === 'cafe' ? styles.active : ''}`}
          onClick={() => onFiltersChange({ ...filters, category: 'cafe' })}
        >
          ☕ 카페
        </button>
      </div>

      {/* 매장 카드 리스트 */}
      <div className={styles.storesList}>
        {stores.length === 0 ? (
          <div className={styles.emptyState}>
            <p>검색 결과가 없습니다.</p>
          </div>
        ) : (
          stores.map((store) => (
            <div 
              key={store.id} 
              className={styles.storeCard}
              onClick={() => navigate(`/store/${store.id}`)}
            >
              <div className={styles.storeCardImage}>
                <div className={styles.storeImagePlaceholder}>📍</div>
              </div>
              <div className={styles.storeCardInfo}>
                <h3 className={styles.storeName}>{store.name}</h3>
                <div className={styles.storeRating}>⭐ {store.rating?.toFixed(1) || '-'}</div>
                <p className={styles.storeCategory}>{store.category || '미분류'}</p>
                <p className={styles.storeAddress}>{store.address || '주소 정보 없음'}</p>
                {store.distance && (
                  <p className={styles.storeDistance}>{store.distance.toFixed(1)}km</p>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* 더보기 버튼: autoLoadEnabled가 false이고 hasNext가 true일 때만 표시 */}
      {!autoLoadEnabled && hasNext && onLoadMore && (
        <div className={styles.loadMoreSection}>
          <button 
            className={styles.loadMoreBtn}
            onClick={onLoadMore}
            disabled={isLoadingMore}
          >
            {isLoadingMore ? (
              <>
                <span className={styles.spinner}></span>
                불러오는 중...
              </>
            ) : '더보기'}
          </button>
        </div>
      )}

      {/* 무한 스크롤 감지용 요소 */}
      {loadMoreRef && <div ref={loadMoreRef} className={styles.loadMoreTrigger} />}

      {/* 추가 로딩 인디케이터 */}
      {isLoadingMore && (
        <div className={styles.loadingMore}>
          <div className={styles.loadingSpinner}></div>
          <p>매장 정보를 더 불러오는 중...</p>
        </div>
      )}

      {/* 모든 데이터 로드 완료 메시지 */}
      {!hasNext && stores.length > 0 && (
        <div className={styles.endOfList}>
          <p>모든 매장을 불러왔습니다.</p>
        </div>
      )}
    </div>
  )
}
