import { useRef } from 'react'
import type { NaverMapProps } from './types'
import './NaverMap.css'
import { SEOUL_CITY_HALL, MAP_CONFIG } from './constants'
import { useNaverMap } from './hooks/useNaverMap'
import { useStoreFiltering } from './hooks/useStoreFiltering'
import { useMapMarkers } from './hooks/useMapMarkers'
import { MapControls } from './components/MapControls'
import { StorePanel } from './components/StorePanel'

export const NaverMap = ({
  stores = [],
  onStoreSelect,
  centerLat = SEOUL_CITY_HALL.lat,
  centerLng = SEOUL_CITY_HALL.lng,
  zoom = MAP_CONFIG.DEFAULT_ZOOM,
}: NaverMapProps) => {
  const mapRef = useRef<HTMLDivElement>(null)

  // 커스텀 훅 사용
  const map = useNaverMap(mapRef, centerLat, centerLng, zoom)
  const filteredStores = useStoreFiltering(stores)
  useMapMarkers(map, filteredStores, onStoreSelect)

  return (
    <div className="naver-map-container">
      <div ref={mapRef} className="naver-map"></div>
      <MapControls map={map} storeCount={filteredStores.length} />
      <StorePanel stores={filteredStores} onStoreSelect={onStoreSelect} />
    </div>
  )
}
