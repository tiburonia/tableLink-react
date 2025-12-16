import { NaverMap } from '@/widgets/Map'
import type { Store } from '../../types'
import './MapPage.css'

interface MapPageProps {
  stores: Store[]
  selectedStore: Store | null
  onStoreSelect: (store: Store) => void
}

export const MapPage = ({ stores, selectedStore, onStoreSelect }: MapPageProps) => {
  return (
    <div className="map-page">
      <div className="map-container">
        <NaverMap 
          stores={stores} 
          onStoreSelect={onStoreSelect} 
          centerLat={37.5665} 
          centerLng={126.978} 
          zoom={13} 
        />
      </div>
    </div>
  )
}
