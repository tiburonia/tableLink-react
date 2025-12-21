import { useNavigate } from 'react-router-dom'
import { NaverMap } from '@/widgets/Map'
import { BottomNavigation } from '@/pages/Main/components/BottomNavigation'
import { MAP_CONFIG, SEOUL_CITY_HALL } from '@/widgets/Map/constants'
import './MapPage.css'

export const MapPage = () => {
  const navigate = useNavigate()

  return (
    <div className="mobile-app">
      <div className="mobile-content">
        <div className="map-page">
          <div className="map-page-header">
            <h1 className="map-title">지도</h1>
            <button
              onClick={() => navigate('/notifications')}
              className="notification-icon-btn"
              aria-label="알림"
            >
              🔔
            </button>
          </div>
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
