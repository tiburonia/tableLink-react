import type { MenuItemData } from '../model'
import styles from './MenuItem.module.css'

interface MenuItemProps {
  item: MenuItemData
}

export const MenuItem = ({ item }: MenuItemProps) => {
  return (
    <div className={styles.menuItem}>
      <div className={styles.menuIcon}>{item.image}</div>
      <div className={styles.menuInfo}>
        <div className={styles.menuName}>
          {item.name}
        </div>
        <div className={styles.menuDescription}>{item.description}</div>
        <div className={styles.menuPrice}>{item.price.toLocaleString()}원</div>
      </div>
    </div>
  )
}
