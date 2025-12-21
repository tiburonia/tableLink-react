import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import type { 
  MapFeature, 
  Cluster, 
  IndividualStore,
  NaverMapInstance, 
  NaverMarker, 
  NaverInfoWindow 
} from '../types'
import { MAP_CONFIG } from '../constants'
import { createStoreInfoWindowContent } from '../components/StoreInfoWindow'

/**
 * 클러스터 마커 콘텐츠 생성\
 */
const createClusterMarkerContent = (count: number): HTMLElement => {
  const el = document.createElement('div')
  el.className = 'cluster-marker'
  el.innerHTML = `
    <div class="cluster-marker-inner">
      <span class="cluster-count">${count}</span>
    </div>
  `
  return el
}

/**
 * 클러스터와 개별 매장 마커 관리 훅
 */
export const useClusterMarkers = (
  map: NaverMapInstance | null,
  features: MapFeature[],
  onStoreSelect?: (storeId: number) => void
) => {
  const navigate = useNavigate()
  const [selectedStoreId, setSelectedStoreId] = useState<number | null>(null)
  const [markers, setMarkers] = useState<NaverMarker[]>([])
  const [infoWindows] = useState<Map<number, NaverInfoWindow>>(new Map())

  // 마커 생성 및 관리
  useEffect(() => {
    if (!map || features.length === 0) {
      // 기존 마커 제거
      markers.forEach(marker => marker.setMap(null))
      setMarkers([])
      return
    }

    console.log('🗺️ 클러스터 마커 생성 시작:', features.length, '개')

    // 기존 마커 제거
    markers.forEach(marker => marker.setMap(null))
    infoWindows.forEach(iw => iw.close())
    infoWindows.clear()

    const newMarkers: NaverMarker[] = []

    features.forEach((feature) => {
      try {
        if (feature.kind === 'cluster') {
          // 클러스터 마커
          const cluster = feature as Cluster
          const marker = new naver.maps.Marker({
            position: new naver.maps.LatLng(cluster.lat, cluster.lng),
            map: map,
            icon: {
              content: createClusterMarkerContent(cluster.count).outerHTML,
              anchor: new (naver.maps as any).Point(20, 20),
            },
            zIndex: 200,
          })

          // 클러스터 클릭 시 줌인
          naver.maps.Event.addListener(marker, 'click', () => {
            const currentZoom = map.getZoom()
            map.setCenter(new naver.maps.LatLng(cluster.lat, cluster.lng))
            map.setZoom(currentZoom + 2)
          })

          newMarkers.push(marker)
        } else {
          // 개별 매장 마커
          const store = feature as IndividualStore
          const marker = new naver.maps.Marker({
            position: new naver.maps.LatLng(store.lat, store.lng),
            map: map,
            title: store.name,
            zIndex: 100,
          })

          // 정보창 생성
          const storeData = {
            id: store.store_id.toString(),
            name: store.name,
            latitude: store.lat,
            longitude: store.lng,
            address: store.address,
            category: store.category,
            rating: store.ratingAverage,
            is_open: store.isOpen,
          }

          const infoWindowContent = createStoreInfoWindowContent(storeData)
          const infoWindow = new naver.maps.InfoWindow({
            content: infoWindowContent,
            backgroundColor: '#fff',
            borderColor: '#ddd',
            anchorSize: new naver.maps.Size(30, 40),
            anchorSkew: true,
            pixelOffset: new naver.maps.Size(0, -10),
          })

          // 마커 클릭 이벤트
          naver.maps.Event.addListener(marker, 'click', () => {
            // 기존 열린 정보창 닫기
            infoWindows.forEach((iw) => iw.close())

            // 새 정보창 열기
            infoWindow.open(map, marker)

            // 선택 버튼 이벤트
            setTimeout(() => {
              const selectBtn = document.querySelector(
                `button[data-store-id="${store.store_id}"]`
              ) as HTMLButtonElement | null
              if (selectBtn) {
                selectBtn.addEventListener('click', () => {
                  setSelectedStoreId(store.store_id)
                  if (onStoreSelect) {
                    onStoreSelect(store.store_id)
                  }
                  navigate(`/rs/${store.store_id}`)
                })
              }
            }, 0)

            setSelectedStoreId(store.store_id)
          })

          newMarkers.push(marker)
          infoWindows.set(store.store_id, infoWindow)
        }
      } catch (error) {
        console.error('❌ 마커 생성 실패:', error, feature)
      }
    })

    setMarkers(newMarkers)
    console.log('✅ 클러스터 마커 생성 완료:', newMarkers.length, '개')

    // cleanup
    return () => {
      newMarkers.forEach((marker) => marker.setMap(null))
      infoWindows.forEach((infoWindow) => infoWindow.close())
      infoWindows.clear()
    }
  }, [map, features]) // onStoreSelect, navigate는 의존성에서 제외

  // 선택된 매장 하이라이트 (지도 이동 제거 - API 중복 호출 방지)
  // 마커 클릭 시 이미 정보창이 열리므로, 추가 지도 이동은 불필요
  // useEffect(() => {
  //   if (!map || !selectedStoreId) return

  //   const selectedFeature = features.find(
  //     (f) => f.kind === 'individual' && (f as IndividualStore).store_id === selectedStoreId
  //   )

  //   if (selectedFeature && selectedFeature.kind === 'individual') {
  //     const store = selectedFeature as IndividualStore
  //     const position = new naver.maps.LatLng(store.lat, store.lng)
  //     map.setCenter(position)
  //     map.setZoom(MAP_CONFIG.DETAIL_ZOOM)
  //   }
  // }, [selectedStoreId, map, features])

  return { selectedStoreId, markers }
}
