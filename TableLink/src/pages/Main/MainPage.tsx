/**
 * MainPage - 메인 페이지
 * 
 * FSD 원칙: 페이지는 조립만 한다
 * - useState ❌
 * - useEffect ❌
 * - API 호출 ❌
 */

import { useStoreList, StoreListView } from '@/features/store-list'
import { BottomNavigation } from '@/widgets/Layout'
import styles from './MainPage.module.css'

export const MainPage = () => {
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

  return (
    <div className={styles.mobileApp}>
      <div className={styles.mobileContent}>
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
