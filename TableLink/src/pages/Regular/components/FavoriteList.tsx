import './FavoriteList.css'

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
      <div className="empty-state">
        <div className="empty-icon">⭐</div>
        <h3>즐겨찾기한 매장이 없습니다</h3>
        <p>자주 가는 매장을 즐겨찾기에 추가해보세요!</p>
      </div>
    )
  }

  return (
    <div className="favorite-list">
      <h2 className="section-title">즐겨찾기 매장</h2>
      {stores.map((store) => (
        <div key={store.storeId} className="favorite-card">
          <div
            className="favorite-content"
            onClick={() => onStoreClick(store.storeId)}
          >
            <div className="favorite-header">
              <h3 className="favorite-name">{store.storeName}</h3>
              <div className="favorite-rating">
                <span className="rating-star">⭐</span>
                <span className="rating-value">{store.rating.toFixed(1)}</span>
              </div>
            </div>

            <div className="favorite-info">
              <span className="favorite-category">{store.category}</span>
              <span className="favorite-distance">{store.distance}</span>
            </div>
          </div>

          <button
            className="favorite-remove-btn"
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
