/**
 * MainPage - 메인 페이지
 * 
 * FSD 원칙: 페이지는 조립만 한다
 * - useState ❌
 * - useEffect ❌
 * - API 호출 ❌
 */

import { useNavigate } from 'react-router-dom'
import { useStoreList, StoreListView } from '@/features/store-list'
import { BottomNavigation } from '@/widgets/Layout'
import styles from './MainPage.module.css'

export const MainPage = () => {
  const navigate = useNavigate()
  
  // Feature Hook에서 모든 상태와 로직을 가져옴
  const {
    stores,
    loading,
    error,
    searchQuery,
    filters,
    setSearchQuery,
    setFilters,
  } = useStoreList()

  const handleNotificationClick = () => {
    navigate('/notifications')
  }

  return (
    <div className="mobile-app">
      <div className="mobile-content">
        {/* 헤더 */}
        <header className={styles.header}>
          <div className={styles.logo}>
            <span className={styles.logoIcon}>🍽️</span>
            <h1 className={styles.logoText}>TableLink</h1>
          </div>
          <div className={styles.headerActions}>
            <button 
              className={styles.notificationBtn}
              onClick={handleNotificationClick}
              aria-label="알림"
            >
              <span className={styles.notificationIcon}>🔔</span>
              {/* 읽지 않은 알림이 있을 때 배지 표시 */}
              {/* <span className={styles.notificationBadge}>3</span> */}
            </button>
          </div>
        </header>

        <StoreListView
          stores={stores}
          searchQuery={searchQuery}
          filters={filters}
          onSearchChange={setSearchQuery}
          onFiltersChange={setFilters}
          loading={loading}
          error={error}
        />
      </div>
      <BottomNavigation />
    </div>
  )
}
