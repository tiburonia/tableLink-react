import { MenuItem } from './MenuItem'
import type { MenuItemData } from '../model'
import styles from './MenuList.module.css'

interface MenuListProps {
  title: string
  items: MenuItemData[]
}

export const MenuList = ({ title, items }: MenuListProps) => {
  return (
    <section className={styles.storeSection}>
      <h3 className={styles.sectionTitle}>{title}</h3>
      <div className={styles.menuList}>
        {items.map((item) => (
          <MenuItem key={item.id} item={item} />
        ))}
      </div>
    </section>
  )
}
