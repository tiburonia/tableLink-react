import styles from './StoreList.module.css'

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
      <div className={styles.emptyState}>
        <div className={styles.emptyIcon}>🏪</div>
        <h3>아직 단골 매장이 없습니다</h3>
        <p>매장을 방문하고 단골이 되어보세요!</p>
      </div>
    )
  }

  return (
    <div className={styles.storeList}>
      <h2 className={styles.sectionTitle}>단골 매장 목록</h2>
      {stores.map((store) => {
        const levelInfo = getLevelBadge(store.level)
        return (
          <div
            key={store.storeId}
            className={styles.storeCard}
            onClick={() => onStoreClick(store.storeId)}
          >
            <div className={styles.storeHeader}>
              <h3 className={styles.storeName}>{store.storeName}</h3>
              <div
                className={styles.levelBadge}
                style={{ backgroundColor: levelInfo.color }}
              >
                <span className={styles.levelIcon}>{levelInfo.icon}</span>
                <span className={styles.levelName}>{levelInfo.name}</span>
              </div>
            </div>

            <div className={styles.storeCategory}>{store.category}</div>

            <div className={styles.storeStats}>
              <div className={styles.statItem}>
                <span className={styles.statLabel}>포인트</span>
                <span className={styles.statValue}>{store.points}P</span>
              </div>
              <div className={styles.statItem}>
                <span className={styles.statLabel}>방문 횟수</span>
                <span className={styles.statValue}>{store.visitCount}회</span>
              </div>
              <div className={styles.statItem}>
                <span className={styles.statLabel}>최근 방문</span>
                <span className={styles.statValue}>{store.lastVisit}</span>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
