type TabType = 'info' | 'menu' | 'review'

interface TabNavigationProps {
  activeTab: TabType
  onTabChange: (tab: TabType) => void
}

export const TabNavigation = ({ activeTab, onTabChange }: TabNavigationProps) => {
  return (
    <div className="tab-navigation">
      <button 
        className={`tab-btn ${activeTab === 'info' ? 'active' : ''}`}
        onClick={() => onTabChange('info')}
      >
        홈
      </button>
      <button className="tab-btn">
        단골혜택
      </button>
      <button 
        className={`tab-btn ${activeTab === 'menu' ? 'active' : ''}`}
        onClick={() => onTabChange('menu')}
      >
        메뉴
      </button>
      <button 
        className={`tab-btn ${activeTab === 'review' ? 'active' : ''}`}
        onClick={() => onTabChange('review')}
      >
        리뷰
      </button>
      <button className="tab-btn">
        매장정보
      </button>
    </div>
  )
}
