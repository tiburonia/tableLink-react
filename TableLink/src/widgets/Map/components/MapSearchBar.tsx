/**
 * 지도 페이지 검색바 컴포넌트
 */

import styles from './MapSearchBar.module.css'

interface MapSearchBarProps {
  onSearchClick: () => void
  onNotificationClick: () => void
  onKeywordClick?: (keyword: string) => void
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
  onKeywordClick 
}: MapSearchBarProps) => {
  return (
    <div className={styles.searchBar}>
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
  )
}
