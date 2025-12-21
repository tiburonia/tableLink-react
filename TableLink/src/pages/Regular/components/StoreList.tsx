import './StoreList.css'

interface RegularStore {
  storeId: number
  storeName: string
  level: string
  points: number
  visitCount: number
  lastVisit: string
  category: string
}

interface StoreListProps {
  stores: RegularStore[]
  onStoreClick: (storeId: number) => void
}

const getLevelBadge = (level: string) => {
  const levels: Record<string, { icon: string; color: string; name: string }> = {
    PLATINUM: { icon: '💎', color: '#e5e4e2', name: 'Platinum' },
    GOLD: { icon: '🥇', color: '#ffd700', name: 'Gold' },
    SILVER: { icon: '🥈', color: '#c0c0c0', name: 'Silver' },
    BRONZE: { icon: '🥉', color: '#cd7f32', name: 'Bronze' },
  }
  return levels[level] || { icon: '🏅', color: '#64748b', name: 'Regular' }
}

export const StoreList = ({ stores, onStoreClick }: StoreListProps) => {
  if (stores.length === 0) {
    return (
      <div className="empty-state">
        <div className="empty-icon">🏪</div>
        <h3>아직 단골 매장이 없습니다</h3>
        <p>매장을 방문하고 단골이 되어보세요!</p>
      </div>
    )
  }

  return (
    <div className="store-list">
      <h2 className="section-title">단골 매장 목록</h2>
      {stores.map((store) => {
        const levelInfo = getLevelBadge(store.level)
        return (
          <div
            key={store.storeId}
            className="store-card"
            onClick={() => onStoreClick(store.storeId)}
          >
            <div className="store-header">
              <h3 className="store-name">{store.storeName}</h3>
              <div
                className="level-badge"
                style={{ backgroundColor: levelInfo.color }}
              >
                <span className="level-icon">{levelInfo.icon}</span>
                <span className="level-name">{levelInfo.name}</span>
              </div>
            </div>

            <div className="store-category">{store.category}</div>

            <div className="store-stats">
              <div className="stat-item">
                <span className="stat-label">포인트</span>
                <span className="stat-value">{store.points}P</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">방문 횟수</span>
                <span className="stat-value">{store.visitCount}회</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">최근 방문</span>
                <span className="stat-value">{store.lastVisit}</span>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
