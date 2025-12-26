import styles from './TabNavigation.module.css'

type TabType = 'main' | 'menu' | 'review' |'regular' | 'info'

interface TabNavigationProps {
  activeTab: TabType
  onTabChange: (tab: TabType) => void
}

export const TabNavigation = ({ activeTab, onTabChange }: TabNavigationProps) => {
  return (
    <div className={styles.tabNavigation}>
      <button 
        className={`${styles.tabBtn} ${activeTab === 'main' ? styles.active : ''}`}
        onClick={() => onTabChange('main')}
      >
        <span className={styles.tabIcon}>🏠</span>
        <span className={styles.tabLabel}>홈</span>
      </button>
      <button 
        className={`${styles.tabBtn} ${activeTab === 'regular' ? styles.active : ''}`}
        onClick={() => onTabChange('regular')}
      >
        <span className={styles.tabIcon}>👑</span>
        <span className={styles.tabLabel}>단골혜택</span>
      </button>
      <button 
        className={`${styles.tabBtn} ${activeTab === 'menu' ? styles.active : ''}`}
        onClick={() => onTabChange('menu')}
      >
        <span className={styles.tabIcon}>🍽️</span>
        <span className={styles.tabLabel}>메뉴</span>
      </button>
      <button 
        className={`${styles.tabBtn} ${activeTab === 'review' ? styles.active : ''}`}
        onClick={() => onTabChange('review')}
      >
        <span className={styles.tabIcon}>💬</span>
        <span className={styles.tabLabel}>리뷰</span>
      </button>
      <button 
        className={`${styles.tabBtn} ${activeTab === 'info' ? styles.active : ''}`}
        onClick={() => onTabChange('info')}
      >
        <span className={styles.tabIcon}>ℹ️</span>
        <span className={styles.tabLabel}>매장정보</span>
      </button>
    </div>
  )
}
