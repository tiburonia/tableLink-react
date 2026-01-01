import { NavLink, useLocation } from 'react-router-dom'
import styles from './Sidebar.module.css'

interface SidebarProps {
  collapsed: boolean
}

const menuItems = [
  { path: '/dashboard', icon: '📊', label: '대시보드' },
  { path: '/stores', icon: '🏪', label: '매장 관리' },
  { path: '/users', icon: '👥', label: '회원 관리' },
  { path: '/orders', icon: '📋', label: '주문 관리' },
  { path: '/reviews', icon: '⭐', label: '리뷰 관리' },
  { path: '/settings', icon: '⚙️', label: '설정' },
]

export function Sidebar({ collapsed }: SidebarProps) {
  const location = useLocation()

  return (
    <aside className={`${styles.sidebar} ${collapsed ? styles.collapsed : ''}`}>
      <div className={styles.logo}>
        {collapsed ? 'TLM' : 'TableLink Manager'}
      </div>
      
      <nav className={styles.nav}>
        {menuItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={`${styles.navItem} ${location.pathname === item.path ? styles.active : ''}`}
          >
            <span className={styles.icon}>{item.icon}</span>
            {!collapsed && <span className={styles.label}>{item.label}</span>}
          </NavLink>
        ))}
      </nav>

      <div className={styles.footer}>
        {!collapsed && (
          <div className={styles.version}>v1.0.0</div>
        )}
      </div>
    </aside>
  )
}
