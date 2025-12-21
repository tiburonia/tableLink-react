import { MenuList } from './MenuList'
import type { MenuItemData } from './MenuItem'

interface MenuTabProps {
  menu: MenuItemData[]
}

export const MenuTab = ({ menu }: MenuTabProps) => {
  
  return (
    <div className="menu-tab">
    
      <MenuList title="전체 메뉴" items={menu} />
    </div>
  )
}
