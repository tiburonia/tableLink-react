import { useNavigate } from 'react-router-dom'
import { NaverMap } from '@/widgets/Map'
import { BottomNavigation } from '@/widgets/Layout'
import { MAP_CONFIG, SEOUL_CITY_HALL } from '@/widgets/Map/constants'
import styles from './MapPage.module.css'

export const MapPage = () => {
  const navigate = useNavigate()

  return (
    <div className="mobile-app">
      <div className="mobile-content">
        <div className={styles.mapPage}>
          <div className={styles.mapPageHeader}>
            <h1 className={styles.mapTitle}>지도</h1>
            <button
              onClick={() => navigate('/notifications')}
              className={styles.notificationIconBtn}
              aria-label="알림"
            >
              🔔
            </button>
          </div>
          <div className={styles.mapContainer}>
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
