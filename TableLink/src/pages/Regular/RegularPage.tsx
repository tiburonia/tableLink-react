

import { useRegularPage } from '@/features/regular-benefits'
import { RegularHeader } from './ui/RegularHeader'
import { SummarySection } from './ui/SummarySection'
import { StoreList } from './ui/StoreList'
import { FavoriteList } from './ui/FavoriteList'
import { SidePanel } from './ui/SidePanel'
import { FeedSection } from '@/features/feed'
import { BottomNavigation } from '@/widgets/Layout'
import styles from './RegularPage.module.css'

export const RegularPage = () => {
  // Hook에서 모든 상태와 로직을 가져옴
  const {
    activeTab,
    summary,
    stores,
    favoriteStores,
    loading,
    error,
    isSidePanelOpen,
    handleTabChange,
    handleStoreClick,
    handleRemoveFavorite,
    openSidePanel,
    closeSidePanel,
    refetch,
    getUserId,
  } = useRegularPage()

  if (loading) {
    return (
        <div className="mobile-app">
        <div className="mobile-content">
      <div className={styles.regularPageLoading}>
        <div className={styles.loadingSpinner}></div>
        <p>로딩 중...</p>
      </div>
      </div>
      <BottomNavigation />
      </div>)
  }

  if (error) {
    return (
    <div className="mobile-app">
    <div className="mobile-content">
      <div className={styles.regularPageError}>
        <h2>오류가 발생했습니다</h2>
        <p>{error}</p>
        <button onClick={refetch} className={styles.retryButton}>
          다시 시도
        </button>
      </div>
      </div>
      <BottomNavigation />
      </div>
    )
  }

  return (
    <div className="mobile-app">
      <div className="mobile-content">
        <RegularHeader
          activeTab={activeTab}
          onTabChange={handleTabChange}
          onMenuClick={openSidePanel}
        />

        <div className={styles.regularContent}>
          {activeTab === 'feed' ? (
            <FeedSection userId={getUserId()} />
          ) : (
            <>
              {summary && <SummarySection summary={summary} />}

              {activeTab === 'regular' ? (
                <StoreList stores={stores} onStoreClick={handleStoreClick} />
              ) : (
                <FavoriteList
                  stores={favoriteStores}
                  onStoreClick={handleStoreClick}
                  onRemove={handleRemoveFavorite}
                />
              )}
            </>
          )}
        </div>
      </div>

      <SidePanel isOpen={isSidePanelOpen} onClose={closeSidePanel} />

      <BottomNavigation />
    </div>
  )
}
