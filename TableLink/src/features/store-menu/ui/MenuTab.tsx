import { MenuList } from './MenuList'
import type { MenuItemData } from '../model'
import styles from './MenuTab.module.css'

interface MenuTabProps {
  menu: MenuItemData[]
}

export const MenuTab = ({ menu }: MenuTabProps) => {
  
  return (
    <div className={styles.menuTab}>
    
      <MenuList title="전체 메뉴" items={menu} />
    </div>
  )
}
