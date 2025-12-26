import { useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { MapContent } from '@/widgets/Map/components/MapContent'
import { MapSearchBar } from '@/widgets/Map/components/MapSearchBar'
import { MapControls } from '@/widgets/Map/components/MapControls'
import { StorePanel } from '@/widgets/Map/components/StorePanel'
import { BottomNavigation } from '@/widgets/Layout'
import { MAP_CONFIG, SEOUL_CITY_HALL } from '@/widgets/Map/constants'
import { useNaverMap } from '@/widgets/Map/hooks/useNaverMap'
import { useClusters } from '@/widgets/Map/hooks/useClusters'
import { useClusterMarkers } from '@/widgets/Map/hooks/useClusterMarkers'
import '@/widgets/Map/NaverMap.css'
import styles from './MapPage.module.css'

export const MapPage = () => {
  const navigate = useNavigate()
  const mapRef = useRef<HTMLDivElement>(null)

  // 지도 초기화
  const map = useNaverMap(mapRef, SEOUL_CITY_HALL.lat, SEOUL_CITY_HALL.lng, MAP_CONFIG.DEFAULT_ZOOM)
  
  // 클러스터 데이터 가져오기
  const { features, loading, error } = useClusters(map, { enabled: true })
  
  // 매장 선택 핸들러
  const handleStoreSelect = (storeId: number) => {
    navigate(`/rs/${storeId}`)
  }
  
  // 클러스터와 개별 매장 마커 렌더링
  useClusterMarkers(map, features, handleStoreSelect)

  // 개별 매장 데이터 추출 (StorePanel용)
  const individualStores = features
    .filter((f): f is import('@/widgets/Map/types').IndividualStore => f.kind === 'individual')
    .map(store => ({
      id: store.store_id.toString(),
      name: store.name,
      latitude: store.lat,
      longitude: store.lng,
      address: store.address,
      category: store.category,
      rating: store.ratingAverage,
      is_open: store.isOpen,
    }))

  const handleKeywordClick = (keyword: string) => {
    navigate(`/search?q=${encodeURIComponent(keyword)}`)
  }

  return (
    <div className="mobile-app">
      <div className="mobile-content">
        <div className={styles.mapPage}>
          <MapContent mapRef={mapRef} />
          
          <MapSearchBar 
            onSearchClick={() => navigate('/search')}
            onNotificationClick={() => navigate('/notifications')}
            onKeywordClick={handleKeywordClick}
          />
          
          <MapControls map={map} storeCount={features.length} />
          <StorePanel 
            stores={individualStores} 
            onStoreSelect={(store) => handleStoreSelect(parseInt(store.id))} 
          />
          {loading && (
            <div className={styles.mapLoading}>
              <div className={styles.loadingSpinner}></div>
            </div>
          )}
          
          {error && (
            <div className={styles.mapError}>
              <span className={styles.errorIcon}>⚠️</span>
              <span className={styles.errorMessage}>{error}</span>
            </div>
          )}
        </div>
      </div>
      <BottomNavigation />
    </div>
  )
}
