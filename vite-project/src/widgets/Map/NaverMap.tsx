import { useEffect, useRef, useState } from 'react'
import './NaverMap.css'

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

export interface NaverMapProps {
  stores?: Store[]
  onStoreSelect?: (store: Store) => void
  centerLat?: number
  centerLng?: number
  zoom?: number
}

export const NaverMap = ({
  stores = [],
  onStoreSelect,
  centerLat = 37.5665,
  centerLng = 126.978,
  zoom = 16,
}: NaverMapProps) => {
  const mapRef = useRef<HTMLDivElement>(null)
  const [map, setMap] = useState<any>(null)
  const [markers, setMarkers] = useState<any[]>([])
  const [infoWindows, setInfoWindows] = useState<Map<string, any>>(new Map())
  const [selectedStoreId, setSelectedStoreId] = useState<string | null>(null)

  // 지도 초기화
  useEffect(() => {
    if (!mapRef.current) return

    // 네이버맵 API 로드 확인
    if (typeof naver === 'undefined' || !naver.maps) {
      console.error('❌ 네이버맵 API가 로드되지 않았습니다.')
      return
    }

    try {
      const mapOptions: naver.maps.MapOptions = {
        center: new naver.maps.LatLng(centerLat, centerLng),
        zoom: zoom,
        maxZoom: 18,
        minZoom: 6,
      }

      const newMap = new naver.maps.Map(mapRef.current, mapOptions)
      setMap(newMap)

      // 줌 변경 이벤트
      naver.maps.Event.addListener(newMap, 'zoom_changed', () => {
        console.log(`🔄 줌 레벨: ${newMap.getZoom()}`)
      })

      // 드래그 완료 이벤트
      naver.maps.Event.addListener(newMap, 'dragend', () => {
        const center = newMap.getCenter()
        console.log(`📍 지도 중심: ${center.lat()}, ${center.lng()}`)
      })
    } catch (error) {
      console.error('❌ 지도 초기화 실패:', error)
    }
  }, [centerLat, centerLng, zoom])

  // 매장 마커 표시
  useEffect(() => {
    if (!map) return

    // 기존 마커 제거
    markers.forEach((marker) => {
      marker.setMap(null)
    })

    // 기존 정보창 제거
    infoWindows.forEach((infoWindow) => {
      infoWindow.close()
    })

    const newMarkers: any[] = []
    const newInfoWindows = new Map<string, any>()

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
        const infoWindowContent = `
          <div class="store-info-window">
            <div class="store-info-header">
              <h3 class="store-info-name">${store.name}</h3>
              ${store.rating ? `<span class="store-rating">⭐ ${store.rating}</span>` : ''}
            </div>
            <div class="store-info-content">
              ${store.category ? `<p class="store-category">📂 ${store.category}</p>` : ''}
              <p class="store-address">📍 ${store.address}</p>
              ${store.phone ? `<p class="store-phone">📞 ${store.phone}</p>` : ''}
            </div>
            <button class="store-select-btn" data-store-id="${store.id}">
              선택하기
            </button>
          </div>
        `

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
              })
            }
          }, 0)

          setSelectedStoreId(store.id)
        })

        newMarkers.push(marker)
        newInfoWindows.set(store.id, infoWindow)
      } catch (error) {
        console.error(`❌ 마커 생성 실패 (${store.name}):`, error)
      }
    })

    setMarkers(newMarkers)
    setInfoWindows(newInfoWindows)
  }, [map, stores, onStoreSelect])

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
      map.setZoom(17)
    }
  }, [selectedStoreId, map, stores])

  return (
    <div className="naver-map-container">
      <div ref={mapRef} className="naver-map"></div>
      <div className="map-controls">
        <button
          className="map-control-btn zoom-in"
          onClick={() => {
            if (map) {
              map.setZoom(map.getZoom() + 1)
            }
          }}
          title="확대"
        >
          +
        </button>
        <button
          className="map-control-btn zoom-out"
          onClick={() => {
            if (map) {
              map.setZoom(Math.max(6, map.getZoom() - 1))
            }
          }}
          title="축소"
        >
          −
        </button>
      </div>
    </div>
  )
}
