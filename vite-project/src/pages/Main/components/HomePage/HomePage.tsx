import type { Store, FilterState } from '../../types'
import './HomePage.css'

interface HomePageProps {
  stores: Store[]
  searchQuery: string
  setSearchQuery: (query: string) => void
  filters: FilterState
  setFilters: (filters: FilterState) => void
}

export const HomePage = ({
  stores,
  searchQuery,
  setSearchQuery,
  filters,
  setFilters,
}: HomePageProps) => {
  return (
    <div className="home-page">
      {/* 상단 검색 섹션 */}
      <div className="search-section">
        <div className="status-bar">
          <span className="time">9:41</span>
          <div className="status-icons">
            <span>📶</span>
            <span>🔋</span>
          </div>
        </div>

        <div className="search-bar">
          <button className="search-icon">🔍</button>
          <input
            type="text"
            placeholder="매장명, 카테고리 또는 위치 검색..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="search-input"
          />
        </div>

        {/* 키워드 네비게이션 */}
        <div className="keyword-nav">
          <button className="keyword-btn">🍗 치킨</button>
          <button className="keyword-btn">🍕 피자</button>
          <button className="keyword-btn">💳 민생지원금</button>
          <button className="keyword-btn">🔥 Top 100</button>
        </div>
      </div>

      {/* 광고 배너 */}
      <div className="banner-section">
        <div className="banner">
          <div className="banner-placeholder">
            <span>N</span>
          </div>
          <p className="banner-text">네이버 지도 Open API 인증이 필요합니다</p>
        </div>
      </div>

      {/* 필터 탭 */}
      <div className="filter-tabs">
        <button
          className={`filter-tab ${filters.category === 'all' ? 'active' : ''}`}
          onClick={() => setFilters({ ...filters, category: 'all' })}
        >
          전체
        </button>
        <button
          className={`filter-tab ${filters.category === 'restaurant' ? 'active' : ''}`}
          onClick={() => setFilters({ ...filters, category: 'restaurant' })}
        >
          🍽️ 카테고리
        </button>
        <button
          className={`filter-tab ${filters.category === 'status' ? 'active' : ''}`}
          onClick={() => setFilters({ ...filters, category: 'status' })}
        >
          🟢 운영 상태
        </button>
      </div>

      {/* 매장 카드 리스트 */}
      <div className="stores-section">
        {stores.map((store) => (
          <div key={store.id} className="store-card">
            <div className="store-card-image">
              <div className="store-image-placeholder">📍</div>
            </div>
            <div className="store-card-info">
              <h3 className="store-name">{store.name}</h3>
              <div className="store-rating">⭐ {store.rating}</div>
              <p className="store-category">{store.category}</p>
              <p className="store-address">{store.address}</p>
              <button className="store-select-btn">선택하기</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
