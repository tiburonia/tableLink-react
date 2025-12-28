/**
 * 지도 페이지 검색바 컴포넌트
 * - 위치 선택 기능 포함
 */

import { useState } from 'react'
import styles from './MapSearchBar.module.css'
import { LocationSearch, type Location } from './LocationSearch'

interface MapSearchBarProps {
  onSearchClick: () => void
  onNotificationClick: () => void
  onKeywordClick?: (keyword: string) => void
  onLocationSelect?: (location: Location) => void
  currentLocation?: Location | null
}

const keywords = [
  { icon: '🍗', text: '치킨' },
  { icon: '🍕', text: '피자' },
  { icon: '💳', text: '민생지원금' },
  { icon: '🔥', text: 'Top 100' },
  { icon: '🍜', text: '분식' },
  { icon: '☕', text: '카페' },
  { icon: '🍚', text: '한식' },
  { icon: '💝', text: '데이트' },
  { icon: '🌞', text: '점심추천' },
]

export const MapSearchBar = ({ 
  onSearchClick, 
  onNotificationClick,
  onKeywordClick,
  onLocationSelect,
  currentLocation,
}: MapSearchBarProps) => {
  const [isLocationSearchOpen, setIsLocationSearchOpen] = useState(false)

  const handleLocationSelect = (location: Location) => {
    onLocationSelect?.(location)
    setIsLocationSearchOpen(false)
  }

  // 위치 표시 텍스트
  const locationDisplayText = currentLocation?.name || currentLocation?.address || '위치 선택'
  const isLocationSelected = !!currentLocation

  return (
    <>
      <div className={styles.searchBar}>
        {/* 위치 선택 UI */}
        <button 
          className={styles.locationSelector}
          onClick={() => setIsLocationSearchOpen(true)}
        >
          <span className={styles.locationPin}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path 
                d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" 
                fill="currentColor"
              />
              <circle cx="12" cy="9" r="2" fill="white"/>
            </svg>
          </span>
          <span className={`${styles.locationText} ${isLocationSelected ? styles.locationSelected : ''}`}>
            {locationDisplayText}
          </span>
          <span className={styles.locationArrow}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
              <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </span>
        </button>

        <div className={styles.searchContainer} onClick={onSearchClick}>
          <div className={styles.searchIcon}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <circle cx="11" cy="11" r="8" stroke="currentColor" strokeWidth="2" />
              <path d="M21 21L16.65 16.65" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </div>
          <input 
            className={styles.searchInput} 
            type="text" 
            placeholder="매장명, 카테고리 또는 위치 검색..."
            readOnly
          />
          <button 
            className={styles.notificationBtn}
            onClick={(e) => {
              e.stopPropagation()
              onNotificationClick()
            }}
          >
            🔔
          </button>
        </div>

        <nav className={styles.keywordNav}>
          {keywords.map((keyword) => (
            <button
              key={keyword.text}
              className={styles.keywordBtn}
              onClick={() => onKeywordClick?.(keyword.text)}
            >
              <span className={styles.keywordIcon}>{keyword.icon}</span>
              <span className={styles.keywordText}>{keyword.text}</span>
            </button>
          ))}
        </nav>
      </div>

      {/* 위치 검색 모달 */}
      <LocationSearch
        isOpen={isLocationSearchOpen}
        onClose={() => setIsLocationSearchOpen(false)}
        onSelectLocation={handleLocationSelect}
        currentLocation={currentLocation}
      />
    </>
  )
}
