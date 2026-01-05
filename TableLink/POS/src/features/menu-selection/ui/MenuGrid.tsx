import { MenuCard } from '@/entities/menu'
import type { MenuItem } from '@/entities/menu'
import styles from './MenuGrid.module.css'

interface MenuGridProps {
  items: MenuItem[]
  onItemClick: (item: MenuItem) => void
  columns?: number
}

export function MenuGrid({ items, onItemClick, columns = 4 }: MenuGridProps) {
  if (items.length === 0) {
    return (
      <div className={styles.empty}>
        <span className={styles.emptyIcon}>📋</span>
        <p>해당 카테고리에 메뉴가 없습니다</p>
      </div>
    )
  }

  return (
    <div
      className={styles.grid}
      style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}
    >
      {items.map((item) => (
        <MenuCard key={item.menu_id} item={item} onClick={onItemClick} />
      ))}
    </div>
  )
}
