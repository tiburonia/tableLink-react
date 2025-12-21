import {  useNavigate } from 'react-router-dom'
import type { Store } from '../types'

interface StoreCardProps {
  store: Store
  onClick: () => void
}

export const StoreCard = ({ store, onClick }: StoreCardProps) => {
  const handleCallClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (store.phone) {
      window.location.href = `tel:${store.phone}`
    }
  }

  const navigate = useNavigate()
 

  // 카테고리 아이콘 매핑
  const getCategoryIcon = (category?: string) => {
    const icons: Record<string, string> = {
      '한식': '🍚',
      '중식': '🥟',
      '일식': '🍱',
      '양식': '🍝',
      '카페': '☕',
      '치킨': '🍗',
      '기타': '🍽️'
    }
    return icons[category || '기타'] || '🍽️'
  }

  const hasAddress = store.address && store.address !== '주소정보 없음'
  const hasRating = store.rating && store.rating >= 0

  return (
    <div className="store-card" onClick={onClick}>
      {/* 매장 헤더 */}
      <div className="store-card-header">
        <div className="store-card-title">
          <div className="store-card-name">{store.name}</div>
          <div className="store-card-meta">
            <div className="store-card-category">
              <span className="category-icon">{getCategoryIcon(store.category)}</span>
              <span className="category-text">{store.category || '기타'}</span>
            </div>
            {store.isOpen !== undefined && (
              <span className={`store-status ${store.isOpen ? 'open' : 'closed'}`}>
                {store.isOpen ? '영업 중' : '영업 종료'}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* 평점 */}
      {hasRating && (
        <div className="store-card-rating">
          <span className="rating-star">⭐</span>
          <span className="rating-value">{store.rating?.toFixed(1)}</span>
        </div>
      )}

      {/* 주소 */}
      {hasAddress && (
        <div className="store-card-address">
          <span className="address-icon">📍</span>
          <span className="address-text">{store.address}</span>
        </div>
      )}

      {/* 액션 버튼 */}
      <div className="store-card-actions">
        {store.phone ? (
          <button className="card-action-btn secondary" onClick={handleCallClick}>
            <span className="btn-icon">📞</span>
            <span className="btn-text">전화</span>
          </button>
        ) : (
          <button className="card-action-btn secondary disabled" disabled>
            <span className="btn-icon">📞</span>
            <span className="btn-text">전화번호 없음</span>
          </button>
        )}
        <button className="card-action-btn primary" onClick={() => navigate(`/rs/${store.id}`)}>
          <span className="btn-icon">🏪</span>
          <span className="btn-text">매장 보기</span>
        </button>
      </div>
    </div>
  )
}
