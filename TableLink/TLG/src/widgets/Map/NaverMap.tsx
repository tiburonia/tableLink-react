/**
 * @deprecated
 * 이 컴포넌트는 레거시입니다. 새로운 구현은 MapPage를 사용하세요.
 * 
 * NaverMap - 네이버 지도 렌더링 컴포넌트
 * 순수한 지도 렌더링만 담당합니다. 비즈니스 로직은 페이지 레벨에서 처리하세요.
 */

import { useRef } from 'react'
import type { NaverMapProps } from './types'
import './NaverMap.css'
import { SEOUL_CITY_HALL, MAP_CONFIG } from './constants'
import { useNaverMap } from './hooks/useNaverMap'

export const NaverMap = ({
  centerLat = SEOUL_CITY_HALL.lat,
  centerLng = SEOUL_CITY_HALL.lng,
  zoom = MAP_CONFIG.DEFAULT_ZOOM,
  children,
}: NaverMapProps) => {
  const mapRef = useRef<HTMLDivElement>(null)

  // 지도 초기화만 담당
  useNaverMap(mapRef, centerLat, centerLng, zoom)

  return (
    <div className="naver-map-container">
      <div ref={mapRef} className="naver-map"></div>
      {children}
    </div>
  )
}
