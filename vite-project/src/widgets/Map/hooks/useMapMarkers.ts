import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import type { Store, NaverMapInstance, NaverMarker, NaverInfoWindow } from '../types'
import { MAP_CONFIG } from '../constants'
import { createStoreInfoWindowContent } from '../components/StoreInfoWindow'

/**
 * 지도 마커 관리 훅
 */
export const useMapMarkers = (
  map: NaverMapInstance | null,
  stores: Store[],
  onStoreSelect?: (store: Store) => void
) => {
  const navigate = useNavigate()
  const [selectedStoreId, setSelectedStoreId] = useState<string | null>(null)

  // 마커 생성 및 관리
  useEffect(() => {
    if (!map || stores.length === 0) return

    console.log('🗺️ 마커 생성 시작:', stores.length, '개')

    const markers: NaverMarker[] = []
    const infoWindows = new Map<string, NaverInfoWindow>()

    stores.forEach((store) => {
      try {
        // 마커 생성
        const marker = new naver.maps.Marker({
          position: new naver.maps.LatLng(store.latitude, store.longitude),
          map: map,
          title: store.name,
          zIndex: 100,
        })

        // 정보창 생성
        const infoWindowContent = createStoreInfoWindowContent(store)

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
          infoWindows.forEach((iw) => {
            iw.close()
          })

          // 새 정보창 열기
          infoWindow.open(map, marker)

          // 선택 버튼 이벤트
          setTimeout(() => {
            const selectBtn = document.querySelector(
              `button[data-store-id="${store.id}"]`
            ) as HTMLButtonElement | null
            if (selectBtn) {
              selectBtn.addEventListener('click', () => {
                setSelectedStoreId(store.id)
                if (onStoreSelect) {
                  onStoreSelect(store)
                }
                navigate(`/rs/${store.id}`)
              })
            }
          }, 0)

          setSelectedStoreId(store.id)
        })

        markers.push(marker)
        infoWindows.set(store.id, infoWindow)
      } catch (error) {
        console.error(`❌ 마커 생성 실패 (${store.name}):`, error)
      }
    })

    console.log('✅ 마커 생성 완료:', markers.length, '개')

    // cleanup: 컴포넌트 언마운트 시 마커 제거
    return () => {
      markers.forEach((marker) => {
        marker.setMap(null)
      })
      infoWindows.forEach((infoWindow) => {
        infoWindow.close()
      })
    }
  }, [map, stores, onStoreSelect, navigate])

  // 선택된 매장 마커 하이라이트
  useEffect(() => {
    if (!map || !selectedStoreId) return

    const selectedStore = stores.find((s) => s.id === selectedStoreId)
    if (selectedStore) {
      const position = new naver.maps.LatLng(
        selectedStore.latitude,
        selectedStore.longitude
      )
      map.setCenter(position)
      map.setZoom(MAP_CONFIG.DETAIL_ZOOM)
    }
  }, [selectedStoreId, map, stores])

  return { selectedStoreId }
}
