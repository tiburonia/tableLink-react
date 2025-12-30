import styles from './RegularHeader.module.css'

interface RegularHeaderProps {
  activeTab: 'regular' | 'favorite' | 'feed'
  onTabChange: (tab: 'regular' | 'favorite' | 'feed') => void
  onMenuClick: () => void
}

export const RegularHeader = ({ activeTab, onTabChange, onMenuClick }: RegularHeaderProps) => {
  return (
    <header className={styles.regularHeader}>
      <div className={styles.headerContent}>
        <button className={styles.hamburgerBtn} onClick={onMenuClick} aria-label="메뉴">
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <line x1="3" y1="12" x2="21" y2="12" />
            <line x1="3" y1="6" x2="21" y2="6" />
            <line x1="3" y1="18" x2="21" y2="18" />
          </svg>
        </button>
        <h1 className={styles.pageTitle}>단골 매장</h1>
        <div className={styles.headerSpacer} />
      </div>

      <div className={styles.tabNavigation}>
        <button
          className={`${styles.tabNavBtn} ${activeTab === 'regular' ? styles.active : ''}`}
          onClick={() => onTabChange('regular')}
        >
          내 단골 매장
        </button>
        <button
          className={`${styles.tabNavBtn} ${activeTab === 'favorite' ? styles.active : ''}`}
          onClick={() => onTabChange('favorite')}
        >
          즐겨찾기
        </button>
        <button
          className={`${styles.tabNavBtn} ${activeTab === 'feed' ? styles.active : ''}`}
          onClick={() => onTabChange('feed')}
        >
          단골 소식
        </button>
      </div>
    </header>
  )
}
