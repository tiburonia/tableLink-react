import styles from './RegularHeader.module.css'

interface RegularHeaderProps {
  activeTab: 'regular' | 'favorite' | 'feed'
  onTabChange: (tab: 'regular' | 'favorite' | 'feed') => void
  onMenuClick: () => void
}

export const RegularHeader = ({ activeTab, onTabChange, onMenuClick }: RegularHeaderProps) => {
  return (
    <header className="regular-header">
      <div className="header-content">
        <button className="hamburger-btn" onClick={onMenuClick} aria-label="메뉴">
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
        <h1 className="page-title">단골 매장</h1>
        <div className="header-spacer" />
      </div>

      <div className="tab-navigation">
        <button
          className={`tab-nav-btn ${activeTab === 'regular' ? 'active' : ''}`}
          onClick={() => onTabChange('regular')}
        >
          내 단골 매장
        </button>
        <button
          className={`tab-nav-btn ${activeTab === 'favorite' ? 'active' : ''}`}
          onClick={() => onTabChange('favorite')}
        >
          즐겨찾기
        </button>
        <button
          className={`tab-nav-btn ${activeTab === 'feed' ? 'active' : ''}`}
          onClick={() => onTabChange('feed')}
        >
          단골 소식
        </button>
      </div>
    </header>
  )
}
