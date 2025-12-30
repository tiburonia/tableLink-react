/**
 * StoreCard - 매장 카드 컴포넌트
 */

import type { Store } from '@/entities/store'
import styles from './StoreCard.module.css'

interface StoreCardProps {
  store: Store
  onClick?: () => void
}

export const StoreCard = ({ store, onClick }: StoreCardProps) => {
  return (
    <div className={styles.card} onClick={onClick}>
      <div className={styles.info}>
        <h3 className={styles.name}>{store.name}</h3>
        <p className={styles.category}>{store.category || '기타'}</p>
        <div className={styles.meta}>
          {store.rating && (
            <span className={styles.rating}>⭐ {store.rating.toFixed(1)}</span>
          )}
          {store.distance !== undefined && (
            <span className={styles.distance}>
              {store.distance < 1 
                ? `${(store.distance * 1000).toFixed(0)}m` 
                : `${store.distance.toFixed(1)}km`}
            </span>
          )}
        </div>
      </div>
      <div className={styles.status}>
        <span className={store.is_open ? styles.open : styles.closed}>
          {store.is_open ? '영업중' : '영업종료'}
        </span>
      </div>
    </div>
  )
}
