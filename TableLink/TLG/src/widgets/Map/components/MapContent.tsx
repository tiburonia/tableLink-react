/**
 * 네이버 지도 렌더링 컴포넌트
 * 순수하게 지도 div만 렌더링하고 초기화는 외부 hook에서 처리
 */

import type { RefObject } from 'react'

interface MapContentProps {
  mapRef: RefObject<HTMLDivElement | null>
}

export const MapContent = ({ mapRef }: MapContentProps) => {
  return (
    <div className="naver-map-container">
      <div ref={mapRef} className="naver-map"></div>
    </div>
  )
}
