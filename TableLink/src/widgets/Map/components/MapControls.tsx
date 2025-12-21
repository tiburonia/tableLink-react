import type { NaverMapInstance } from '../types'
import '../NaverMap.css'

interface MapControlsProps {
  map: NaverMapInstance | null
  storeCount: number
}

export const MapControls = ({ map, storeCount }: MapControlsProps) => {
  const handleZoomIn = () => {
    if (map) {
      map.setZoom(map.getZoom() + 1)
    }
  }

  const handleZoomOut = () => {
    if (map) {
      map.setZoom(Math.max(6, map.getZoom() - 1))
    }
  }

  return (
    <div className="map-controls">
      <button
        className="map-control-btn zoom-in"
        onClick={handleZoomIn}
        title="확대"
      >
        +
      </button>
      <button
        className="map-control-btn zoom-out"
        onClick={handleZoomOut}
        title="축소"
      >
        −
      </button>
      <div className="store-count-badge">📍 {storeCount}개 매장</div>
    </div>
  )
}
