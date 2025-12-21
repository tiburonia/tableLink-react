import { useRef } from 'react'
import type { NaverMapProps } from './types'
import './NaverMap.css'
import { SEOUL_CITY_HALL, MAP_CONFIG } from './constants'
import { useNaverMap } from './hooks/useNaverMap'
import { useClusters } from './hooks/useClusters'
import { useClusterMarkers } from './hooks/useClusterMarkers'
import { MapControls } from './components/MapControls'
import { StorePanel } from './components/StorePanel'

export const NaverMap = ({
  onStoreSelect,
  centerLat = SEOUL_CITY_HALL.lat,
  centerLng = SEOUL_CITY_HALL.lng,
  zoom = MAP_CONFIG.DEFAULT_ZOOM,
}: NaverMapProps) => {
  const mapRef = useRef<HTMLDivElement>(null)

  // 지도 초기화
  const map = useNaverMap(mapRef, centerLat, centerLng, zoom)
  
  // 클러스터 데이터 가져오기
  const { features, loading, error } = useClusters(map, { enabled: true })
  
  // 클러스터와 개별 매장 마커 렌더링
  useClusterMarkers(map, features, onStoreSelect)

  // 개별 매장 데이터 추출 (StorePanel용)
  const individualStores = features
    .filter(f => f.kind === 'individual')
    .map(f => {
      const store = f as any
      return {
        id: store.store_id.toString(),
        name: store.name,
        latitude: store.lat,
        longitude: store.lng,
        address: store.address,
        category: store.category,
        rating: store.ratingAverage,
        is_open: store.isOpen,
      }
    })

  return (
    <div className="naver-map-container">
      <div ref={mapRef} className="naver-map"></div>
      <MapControls map={map} storeCount={features.length} />
      <StorePanel 
        stores={individualStores} 
        onStoreSelect={(store) => onStoreSelect?.(parseInt(store.id))} 
      />
      {loading && (
        <div className="map-loading">
          <div className="loading-spinner"></div>
        </div>
      )}
      {error && (
        <div className="map-error">
          <span className="error-icon">⚠️</span>
          <span className="error-message">{error}</span>
        </div>
      )}
    </div>
  )
}
