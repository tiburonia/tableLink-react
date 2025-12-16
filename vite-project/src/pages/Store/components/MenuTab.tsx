import { MenuList } from './MenuList'
import type { MenuItemData } from './MenuItem'

interface MenuTabProps {
  menu: MenuItemData[]
}

export const MenuTab = ({ menu }: MenuTabProps) => {
  const popularMenu = menu.filter(item => item.popular)
  
  return (
    <div className="menu-tab">
      {popularMenu.length > 0 && (
        <MenuList title="인기 메뉴" items={popularMenu} />
      )}
      <MenuList title="전체 메뉴" items={menu} />
    </div>
  )
}
