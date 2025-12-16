export interface Store {
  id: string
  name: string
  latitude: number
  longitude: number
  address: string
  phone?: string
  category?: string
  rating?: number
}

export interface NaverMapProps {
  stores?: Store[]
  onStoreSelect?: (store: Store) => void
  centerLat?: number
  centerLng?: number
  zoom?: number
}

// 네이버 맵 타입 정의
export type NaverMapInstance = naver.maps.Map
export type NaverMarker = naver.maps.Marker
export type NaverInfoWindow = naver.maps.InfoWindow
