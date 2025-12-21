/**
 * StoreList Widget - 매장 목록 위젯
 * 
 * FSD 원칙: 여러 feature를 조합한 UI 덩어리
 * - store-list feature의 데이터 표시
 * - store-info feature의 카드 컴포넌트 사용
 */

import { useStoreList } from '@/features/store-list'
import { StoreCard } from './StoreCard'
import styles from './StoreListWidget.module.css'

interface StoreListWidgetProps {
  onStoreClick?: (storeId: string) => void
}

export const StoreListWidget = ({ onStoreClick }: StoreListWidgetProps) => {
  const { stores, loading, error } = useStoreList()

  if (loading) {
    return (
      <div className={styles.loading}>
        <div className={styles.spinner}></div>
        <p>매장을 불러오는 중...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className={styles.error}>
        <p>{error}</p>
      </div>
    )
  }

  if (stores.length === 0) {
    return (
      <div className={styles.empty}>
        <p>주변에 매장이 없습니다</p>
      </div>
    )
  }

  return (
    <div className={styles.storeList}>
      {stores.map((store) => (
        <StoreCard
          key={store.id}
          store={store}
          onClick={() => onStoreClick?.(store.id)}
        />
      ))}
    </div>
  )
}
