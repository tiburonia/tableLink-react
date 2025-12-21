export interface Store {
  id: string
  name: string
  latitude: number
  longitude: number
  address: string
  phone?: string
  category?: string
  rating?: number
  isOpen?: boolean
}
export interface Cluster {
  kind: 'cluster'
  lat: number
  lng: number
  count: number
  bounds?: {
    minLat: number
    maxLat: number
    minLng: number
    maxLng: number
  }
}

export interface IndividualStore {
  kind: 'individual'
  id: number
  store_id: number
  name: string
  category: string
  address: string
  ratingAverage: number
  reviewCount: number
  isOpen: boolean
  coord: {
    lat: number
    lng: number
  }
  lat: number
  lng: number
}

export type MapFeature = Cluster | IndividualStore

export interface ClusterResponse {
  success: boolean
  type: string
  data: MapFeature[]
  features: MapFeature[]
  meta: {
    level: number
    bbox: {
      xmin: number
      ymin: number
      xmax: number
      ymax: number
    }
    count: number
    timestamp: string
    message?: string
  }
}
export interface NaverMapProps {
  onStoreSelect?: (storeId: number) => void
  centerLat?: number
  centerLng?: number
  zoom?: number
}

// 네이버 맵 타입 정의
export type NaverMapInstance = naver.maps.Map
export type NaverMarker = naver.maps.Marker
export type NaverInfoWindow = naver.maps.InfoWindow
