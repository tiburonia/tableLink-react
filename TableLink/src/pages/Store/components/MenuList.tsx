import { MenuItem, type MenuItemData } from './MenuItem'

interface MenuListProps {
  title: string
  items: MenuItemData[]
}

export const MenuList = ({ title, items }: MenuListProps) => {
  return (
    <section className="store-section">
      <h3 className="section-title">{title}</h3>
      <div className="menu-list">
        {items.map((item) => (
          <MenuItem key={item.id} item={item} />
        ))}
      </div>
    </section>
  )
}
