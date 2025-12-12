import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { NaverMap } from '@/widgets/Map'
import { DatabaseTest } from '@/components/DatabaseTest'
import './MainPage.css'

interface Store {
  id: string
  name: string
  latitude: number
  longitude: number
  address: string
  phone?: string
  category?: string
  rating?: number
}

interface FilterState {
  category: string
  sort: string
}

export const MainPage = () => {
  const navigate = useNavigate()
  const [currentPage, setCurrentPage] = useState<'home' | 'map' | 'qr' | 'mypage'>('home')
  const [selectedStore, setSelectedStore] = useState<Store | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [filters, setFilters] = useState<FilterState>({
    category: 'all',
    sort: 'distance',
  })

  // 샘플 매장 데이터
  const sampleStores: Store[] = [
    {
      id: '1',
      name: '서울 강남점',
      latitude: 37.497942,
      longitude: 127.027621,
      address: '서울시 강남구 테헤란로 123',
      phone: '02-1234-5678',
      category: '프리미엄 레스토랑',
      rating: 4.8,
    },
    {
      id: '2',
      name: '서울 강북점',
      latitude: 37.594098,
      longitude: 126.970905,
      address: '서울시 성북구 삼선교로 234',
      phone: '02-2345-6789',
      category: '캐주얼 다이닝',
      rating: 4.5,
    },
    {
      id: '3',
      name: '서울 명동점',
      latitude: 37.563,
      longitude: 126.986,
      address: '서울시 중구 명동 456',
      phone: '02-3456-7890',
      category: '패밀리 레스토랑',
      rating: 4.6,
    },
  ]

  const handleLogout = () => {
    navigate('/login')
  }

  const handleStoreSelect = (store: Store) => {
    setSelectedStore(store)
  }

  // 현재 페이지 렌더링
  const renderCurrentPage = () => {
    switch (currentPage) {
      case 'home':
        return <HomePage stores={sampleStores} searchQuery={searchQuery} setSearchQuery={setSearchQuery} filters={filters} setFilters={setFilters} />
      case 'map':
        return <MapPage stores={sampleStores} selectedStore={selectedStore} onStoreSelect={handleStoreSelect} />
      case 'qr':
        return <QRPage />
      case 'mypage':
        return <MyPage onLogout={handleLogout} />
      default:
        return null
    }
  }

  return (
    <div className="mobile-app">
      <div className="mobile-content">
        {renderCurrentPage()}
      </div>
      <BottomNavigation currentPage={currentPage} setCurrentPage={setCurrentPage} />
    </div>
  )
}

// 홈 페이지 컴포넌트
const HomePage = ({
  stores,
  searchQuery,
  setSearchQuery,
  filters,
  setFilters,
}: {
  stores: Store[]
  searchQuery: string
  setSearchQuery: (query: string) => void
  filters: FilterState
  setFilters: (filters: FilterState) => void
}) => {
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

// 지도 페이지 컴포넌트
const MapPage = ({
  stores,
  selectedStore,
  onStoreSelect,
}: {
  stores: Store[]
  selectedStore: Store | null
  onStoreSelect: (store: Store) => void
}) => {
  return (
    <div className="map-page">
      <div className="map-header">
        <h2>🗺️ 매장 지도</h2>
        {selectedStore && (
          <div className="selected-store-badge">
            <span className="badge-checkmark">✓</span>
            <div className="badge-info">
              <span className="badge-label">선택된 매장</span>
              <span className="badge-name">{selectedStore.name}</span>
            </div>
          </div>
        )}
      </div>
      <div className="map-container">
        <NaverMap stores={stores} onStoreSelect={onStoreSelect} centerLat={37.5665} centerLng={126.978} zoom={13} />
      </div>
    </div>
  )
}

// QR 페이지 컴포넌트
const QRPage = () => {
  return (
    <div className="qr-page">
      <div className="qr-content">
        <div className="qr-icon">📱</div>
        <h2>QR 코드 스캔</h2>
        <p>매장의 QR 코드를 스캔하여 주문을 시작하세요</p>
        <button className="qr-scan-btn">카메라 열기</button>
      </div>
    </div>
  )
}

// 마이페이지 컴포넌트
const MyPage = ({ onLogout }: { onLogout: () => void }) => {
  return (
    <div className="mypage">
      <div className="mypage-header">
        <div className="user-profile">
          <div className="profile-avatar">👤</div>
          <div className="profile-info">
            <h2>사용자</h2>
            <p>user@example.com</p>
          </div>
        </div>
      </div>

      <div className="mypage-sections">
        <div className="mypage-section">
          <h3>📋 주문 관리</h3>
          <button className="section-item">최근 주문</button>
          <button className="section-item">주문 내역</button>
        </div>

        <div className="mypage-section">
          <h3>❤️ 즐겨찾기</h3>
          <button className="section-item">저장된 매장</button>
          <button className="section-item">단골 매장</button>
        </div>

        <div className="mypage-section">
          <h3>⚙️ 설정</h3>
          <button className="section-item">개인정보</button>
          <button className="section-item">알림 설정</button>
          <button className="section-item">결제 방법</button>
        </div>

        <button className="logout-btn" onClick={onLogout}>
          로그아웃
        </button>
      </div>

      <div className="mypage-sections">
        <DatabaseTest />
      </div>
    </div>
  )
}

// 바텀 네비게이션 컴포넌트
const BottomNavigation = ({
  currentPage,
  setCurrentPage,
}: {
  currentPage: 'home' | 'map' | 'qr' | 'mypage'
  setCurrentPage: (page: 'home' | 'map' | 'qr' | 'mypage') => void
}) => {
  const navItems = [
    { id: 'home', label: '홈', icon: '🏠' },
    { id: 'qr', label: 'QR 주문', icon: '📱' },
    { id: 'map', label: '내주변', icon: '🗺️' },
    { id: 'mypage', label: '마이페이지', icon: '👤' },
  ]

  return (
    <nav className="bottom-nav">
      {navItems.map((item) => (
        <button
          key={item.id}
          className={`nav-item ${currentPage === item.id ? 'active' : ''}`}
          onClick={() => setCurrentPage(item.id as 'home' | 'map' | 'qr' | 'mypage')}
        >
          <span className="nav-icon">{item.icon}</span>
          <span className="nav-label">{item.label}</span>
        </button>
      ))}
    </nav>
  )
}
