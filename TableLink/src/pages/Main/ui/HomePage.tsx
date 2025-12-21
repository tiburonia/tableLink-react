import { useNavigate } from 'react-router-dom'
import type { Store } from '@/entities/store'
import type { StoreFilterState } from '@/features/store-list'
import styles from './HomePage.module.css'

interface HomePageProps {
  stores: Store[]
  searchQuery: string
  setSearchQuery: (query: string) => void
  filters: StoreFilterState
  setFilters: (filters: StoreFilterState) => void
}

export const HomePage = ({
  stores,
  searchQuery,
  setSearchQuery,
  filters,
  setFilters,
}: HomePageProps) => {
  const navigate = useNavigate()

  return (
    <div className={styles.homePage}>
      {/* 상단 검색 섹션 */}
      <div className={styles.searchSection}>
        <div className={styles.statusBar}>
          <span className={styles.time}>9:41</span>
          <div className={styles.statusIcons}>
            <button
              onClick={() => navigate('/notifications')}
              className={styles.notificationIconBtn}
              aria-label="알림"
            >
              🔔
            </button>
            <span>📶</span>
            <span>🔋</span>
          </div>
        </div>

        <div className={styles.searchBar}>
          <button className={styles.searchIcon}>🔍</button>
          <input
            type="text"
            placeholder="매장명, 카테고리 또는 위치 검색..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
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

      {/* 광고 배너 */}
      <div className={styles.bannerSection}>
        <div className={styles.banner}>
          <div className={styles.bannerPlaceholder}>
            <span>N</span>
          </div>
          <p className={styles.bannerText}>네이버 지도 Open API 인증이 필요합니다</p>
        </div>
      </div>

      {/* 필터 탭 */}
      <div className={styles.filterTabs}>
        <button
          className={`${styles.filterTab} ${filters.category === 'all' ? styles.active : ''}`}
          onClick={() => setFilters({ ...filters, category: 'all' })}
        >
          전체
        </button>
        <button
          className={`${styles.filterTab} ${filters.category === 'restaurant' ? styles.active : ''}`}
          onClick={() => setFilters({ ...filters, category: 'restaurant' })}
        >
          🍽️ 카테고리
        </button>
        <button
          className={`${styles.filterTab} ${filters.category === 'status' ? styles.active : ''}`}
          onClick={() => setFilters({ ...filters, category: 'status' })}
        >
          🟢 운영 상태
        </button>
      </div>

      {/* 매장 카드 리스트 */}
      <div className={styles.storesSection}>
        {stores.map((store) => (
          <div key={store.id} className={styles.storeCard}>
            <div className={styles.storeCardImage}>
              <div className={styles.storeImagePlaceholder}>📍</div>
            </div>
            <div className={styles.storeCardInfo}>
              <h3 className={styles.storeName}>{store.name}</h3>
              <div className={styles.storeRating}>⭐ {store.rating}</div>
              <p className={styles.storeCategory}>{store.category}</p>
              <p className={styles.storeAddress}>{store.address}</p>
              <button className={styles.storeSelectBtn}>선택하기</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
