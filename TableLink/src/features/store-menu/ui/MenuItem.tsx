export interface MenuItemData {
  id: number
  name: string
  price: number
  description: string
  cookStation?: string
  image?: string
}

interface MenuItemProps {
  item: MenuItemData
}

export const MenuItem = ({ item }: MenuItemProps) => {
  return (
    <div className="menu-item">
      <div className="menu-icon">{item.image}</div>
      <div className="menu-info">
        <div className="menu-name">
          {item.name}
        </div>
        <div className="menu-description">{item.description}</div>
        <div className="menu-price">{item.price.toLocaleString()}원</div>
      </div>
    </div>
  )
}
