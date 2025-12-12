import './Sidebar.css'

interface SidebarItem {
  id: string
  label: string
  icon?: string
  onClick: () => void
  isActive?: boolean
}

interface SidebarProps {
  items: SidebarItem[]
}

export const Sidebar = ({ items }: SidebarProps) => {
  return (
    <aside className="sidebar">
      <nav className="sidebar__nav">
        {items.map((item) => (
          <button
            key={item.id}
            className={`sidebar__item ${item.isActive ? 'sidebar__item--active' : ''}`}
            onClick={item.onClick}
          >
            {item.icon && <span className="sidebar__icon">{item.icon}</span>}
            <span className="sidebar__label">{item.label}</span>
          </button>
        ))}
      </nav>
    </aside>
  )
}
