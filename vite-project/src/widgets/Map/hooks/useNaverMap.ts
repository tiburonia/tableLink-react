import { useEffect, useState } from 'react'
import type { RefObject } from 'react'
import type { NaverMapInstance } from '../types'
import { MAP_CONFIG } from '../constants'

/**
 * 네이버 지도 초기화 훅
 */
export const useNaverMap = (
  mapRef: RefObject<HTMLDivElement | null>,
  centerLat: number,
  centerLng: number,
  zoom: number = MAP_CONFIG.DEFAULT_ZOOM
) => {
  const [map, setMap] = useState<NaverMapInstance | null>(null)

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
        maxZoom: MAP_CONFIG.MAX_ZOOM,
        minZoom: MAP_CONFIG.MIN_ZOOM,
      }

      const newMap = new naver.maps.Map(mapRef.current, mapOptions)
      setMap(newMap)
      console.log('✅ 지도 초기화 완료')
    } catch (error) {
      console.error('❌ 지도 초기화 실패:', error)
    }
  }, [mapRef, centerLat, centerLng, zoom])

  return map
}
