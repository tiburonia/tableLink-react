import type { NaverMapInstance } from '../types'
import '../NaverMap.css'

interface MapControlsProps {
  map: NaverMapInstance | null
  storeCount: number
}

export const MapControls = ({ storeCount }: MapControlsProps) => {


  return (
    <div className="map-controls">
 
      <div className="store-count-badge">📍 {storeCount}개 매장</div>
    </div>
  )
}
