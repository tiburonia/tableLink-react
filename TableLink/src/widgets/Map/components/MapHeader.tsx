/**
 * 지도 페이지 헤더 컴포넌트
 */

import styles from './MapHeader.module.css'

interface MapHeaderProps {
  onSearchClick: () => void
  onNotificationClick: () => void
}

export const MapHeader = ({ onSearchClick, onNotificationClick }: MapHeaderProps) => {
  return (
    <div className={styles.mapHeader}>
      <div className={styles.headerActions}>
        <button
          onClick={onSearchClick}
          className={styles.searchIconBtn}
          aria-label="검색"
        >
          🔍
        </button>
        <button
          onClick={onNotificationClick}
          className={styles.notificationIconBtn}
          aria-label="알림"
        >
          🔔
        </button>
      </div>
    </div>
  )
}
