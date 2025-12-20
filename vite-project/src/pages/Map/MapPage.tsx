import { NaverMap } from '@/widgets/Map'
import { BottomNavigation } from '@/pages/Main/components/BottomNavigation'
import { MAP_CONFIG, SEOUL_CITY_HALL } from '@/widgets/Map/constants'
import './MapPage.css'

export const MapPage = () => {



  return (
    <div className="mobile-app">
      <div className="mobile-content">
        <div className="map-page">
          <div className="map-container">
            <NaverMap 
              centerLat={SEOUL_CITY_HALL.lat} 
              centerLng={SEOUL_CITY_HALL.lng} 
              zoom={MAP_CONFIG.DEFAULT_ZOOM} 
            />
          </div>
        </div>
      </div>
      <BottomNavigation />
    </div>
  )
}
