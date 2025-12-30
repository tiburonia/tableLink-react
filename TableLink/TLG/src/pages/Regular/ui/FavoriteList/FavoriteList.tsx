import styles from './FavoriteList.module.css'

interface FavoriteStore {
  storeId: number
  storeName: string
  category: string
  rating: number
  distance: string
}

interface FavoriteListProps {
  stores: FavoriteStore[]
  onStoreClick: (storeId: number) => void
  onRemove: (storeId: number) => void
}

export const FavoriteList = ({ stores, onStoreClick, onRemove }: FavoriteListProps) => {
  if (stores.length === 0) {
    return (
      <div className={styles.emptyState}>
        <div className={styles.emptyIcon}>⭐</div>
        <h3>즐겨찾기한 매장이 없습니다</h3>
        <p>자주 가는 매장을 즐겨찾기에 추가해보세요!</p>
      </div>
    )
  }

  return (
    <div className={styles.favoriteList}>
      <h2 className={styles.sectionTitle}>즐겨찾기 매장</h2>
      {stores.map((store) => (
        <div key={store.storeId} className={styles.favoriteCard}>
          <div
            className={styles.favoriteContent}
            onClick={() => onStoreClick(store.storeId)}
          >
            <div className={styles.favoriteHeader}>
              <h3 className={styles.favoriteName}>{store.storeName}</h3>
              <div className={styles.favoriteRating}>
                <span className={styles.ratingStar}>⭐</span>
                <span className={styles.ratingValue}>{store.rating.toFixed(1)}</span>
              </div>
            </div>

            <div className={styles.favoriteInfo}>
              <span className={styles.favoriteCategory}>{store.category}</span>
              <span className={styles.favoriteDistance}>{store.distance}</span>
            </div>
          </div>

          <button
            className={styles.favoriteRemoveBtn}
            onClick={(e) => {
              e.stopPropagation()
              onRemove(store.storeId)
            }}
            aria-label="즐겨찾기 제거"
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>
      ))}
    </div>
  )
}
