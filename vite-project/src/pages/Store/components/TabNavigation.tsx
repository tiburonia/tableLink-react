type TabType = 'main' | 'menu' | 'review' |'regular' | 'info'

interface TabNavigationProps {
  activeTab: TabType
  onTabChange: (tab: TabType) => void
}

export const TabNavigation = ({ activeTab, onTabChange }: TabNavigationProps) => {
  return (
    <div className="tab-navigation">
      <button 
        className={`tab-btn ${activeTab === 'main' ? 'active' : ''}`}
        onClick={() => onTabChange('main')}
      >
        <span className="tab-icon">🏠</span>
        <span className="tab-label">홈</span>
      </button>
      <button 
        className={`tab-btn ${activeTab === 'regular' ? 'active' : ''}`}
        onClick={() => onTabChange('regular')}
      >
        <span className="tab-icon">👑</span>
        <span className="tab-label">단골혜택</span>
      </button>
      <button 
        className={`tab-btn ${activeTab === 'menu' ? 'active' : ''}`}
        onClick={() => onTabChange('menu')}
      >
        <span className="tab-icon">🍽️</span>
        <span className="tab-label">메뉴</span>
      </button>
      <button 
        className={`tab-btn ${activeTab === 'review' ? 'active' : ''}`}
        onClick={() => onTabChange('review')}
      >
        <span className="tab-icon">💬</span>
        <span className="tab-label">리뷰</span>
      </button>
      <button 
        className={`tab-btn ${activeTab === 'info' ? 'active' : ''}`}
        onClick={() => onTabChange('info')}
      >
        <span className="tab-icon">ℹ️</span>
        <span className="tab-label">매장정보</span>
      </button>
    </div>
  )
}
