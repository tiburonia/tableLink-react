import { useState, useEffect } from 'react'
import { Routes, Route, useNavigate } from 'react-router-dom'
import { HomePage } from './components/HomePage'
import { MapPage } from './components/MapPage'
import { QRPage } from './components/QRPage'
import { OrderPage } from './components/OrderPage'
import { PayPage } from './components/PayPage'
import { PaymentPage } from './components/PaymentPage'
import { MyPage } from './components/MyPage'
import { BottomNavigation } from './components/BottomNavigation'
import { storeService } from '@/shared/api'
import type { Store, FilterState } from './types'
import './MainPage.css'

export const MainPage = () => {
  const navigate = useNavigate()
  const [selectedStore, setSelectedStore] = useState<Store | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [filters, setFilters] = useState<FilterState>({
    category: 'all',
    sort: 'distance',
  })
  const [stores, setStores] = useState<Store[]>([])
  const [loading, setLoading] = useState(true)

  // 서울시청 좌표
  const SEOUL_CITY_HALL = { lat: 37.5665, lng: 126.978 }
  const SEARCH_RADIUS_KM = 20

  // 두 좌표 간의 거리 계산 (Haversine 공식)
  const calculateDistance = (lat1: number, lng1: number, lat2: number, lng2: number): number => {
    const R = 6371 // 지구 반경 (km)
    const dLat = (lat2 - lat1) * Math.PI / 180
    const dLng = (lng2 - lng1) * Math.PI / 180
    const a = 
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLng / 2) * Math.sin(dLng / 2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
    return R * c
  }

  // 매장 데이터 로드 (서울시청 주변 20km만)
  useEffect(() => {
    const loadStores = async () => {
      setLoading(true)
      console.log('🔄 매장 데이터 로드 시작...')
      
      const result = await storeService.getAllStores()
      console.log('📦 API 응답:', result)
      
      if (result.success) {
        console.log(`✅ 전체 매장 수: ${result.stores.length}개`)
        
        // 서울시청 기준 20km 반경 내 매장만 필터링
        const filteredStores = result.stores.filter((store: Store) => {
          // latitude와 longitude가 있는지 확인
          if (!store.latitude || !store.longitude) {
            console.warn(`⚠️ 좌표 없음: ${store.name}`)
            return false
          }
          
          const distance = calculateDistance(
            SEOUL_CITY_HALL.lat,
            SEOUL_CITY_HALL.lng,
            store.latitude,
            store.longitude
          )
          return distance <= SEARCH_RADIUS_KM
        })
        
        setStores(filteredStores)
        console.log(`📍 서울시청 기준 ${SEARCH_RADIUS_KM}km 반경 내 매장: ${filteredStores.length}개`)
      } else {
        console.error('❌ 매장 데이터 로드 실패:', result.message)
      }
      
      setLoading(false)
    }

    loadStores()
  }, [])

  const handleLogout = () => {
    localStorage.clear()
  
    navigate('/login')
  }

  const handleStoreSelect = (store: Store) => {
    setSelectedStore(store)
  }

  if (loading) {
    return (
      <div className="mobile-app">
        <div className="mobile-content" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <p>매장 정보를 불러오는 중...</p>
        </div>
        <BottomNavigation />
      </div>
    )
  }

  return (
    <div className="mobile-app">
      <div className="mobile-content">
        <Routes>
          <Route
            index
            element={
              <HomePage
                stores={stores}
                searchQuery={searchQuery}
                setSearchQuery={setSearchQuery}
                filters={filters}
                setFilters={setFilters}
              />
            }
          />
          <Route
            path="map"
            element={<MapPage stores={stores} selectedStore={selectedStore} onStoreSelect={handleStoreSelect} />}
          />
          <Route path="qr" element={<QRPage />} />
          <Route path="p/:storeId" element={<OrderPage />} />
          <Route path="pay" element={<PayPage />} />
          <Route path="payment/*" element={<PaymentPage />} />
          <Route path="mypage" element={<MyPage onLogout={handleLogout} />} />
        </Routes>
      </div>
      <BottomNavigation />
    </div>
  )
}
