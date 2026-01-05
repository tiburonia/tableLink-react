import { NavLink, useLocation } from 'react-router-dom'
import styles from './Sidebar.module.css'

interface SidebarProps {
  collapsed: boolean
  onToggle?: () => void
}

const menuGroups = [
  {
    title: '메인',
    items: [
      { path: '/dashboard', icon: '📊', label: '대시보드' },
      { path: '/stores', icon: '🏪', label: '매장 관리' },
    ]
  },
  {
    title: '운영',
    items: [
      { path: '/users', icon: '👥', label: '회원 관리' },
      { path: '/orders', icon: '📋', label: '주문 관리' },
      { path: '/reviews', icon: '⭐', label: '리뷰 관리' },
    ]
  },
  {
    title: '시스템',
    items: [
      { path: '/settings', icon: '⚙️', label: '설정' },
    ]
  }
]

export function Sidebar({ collapsed, onToggle }: SidebarProps) {
  const location = useLocation()

  return (
    <aside className={`${styles.sidebar} ${collapsed ? styles.collapsed : ''}`}>
      {/* 로고 영역 */}
      <div className={styles.logoWrapper}>
        <div className={styles.logo}>
          {collapsed ? (
            <span className={styles.logoIcon}>🍽️</span>
          ) : (
            <>
              <span className={styles.logoIcon}>🍽️</span>
              <span className={styles.logoText}>TableLink</span>
            </>
          )}
        </div>
      </div>
      
      {/* 네비게이션 메뉴 */}
      <nav className={styles.nav}>
        {menuGroups.map((group, groupIndex) => (
          <div key={groupIndex} className={styles.menuGroup}>
            {!collapsed && (
              <div className={styles.groupTitle}>{group.title}</div>
            )}
            <div className={styles.groupItems}>
              {group.items.map((item) => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  className={`${styles.navItem} ${location.pathname === item.path ? styles.active : ''}`}
                  title={collapsed ? item.label : undefined}
                >
                  <span className={styles.icon}>{item.icon}</span>
                  {!collapsed && <span className={styles.label}>{item.label}</span>}
                  {!collapsed && location.pathname === item.path && (
                    <span className={styles.activeIndicator}></span>
                  )}
                </NavLink>
              ))}
            </div>
          </div>
        ))}
      </nav>

      {/* 하단 영역 */}
      <div className={styles.footer}>
        {/* 축소 버튼 */}
        <button className={styles.collapseBtn} onClick={onToggle}>
          <span className={styles.icon}>{collapsed ? '→' : '←'}</span>
          {!collapsed && <span className={styles.label}>축소</span>}
        </button>
        
        {!collapsed && (
          <div className={styles.version}>
            <div className={styles.versionText}>v1.0.0</div>
            <div className={styles.copyright}>© 2026 TableLink</div>
          </div>
        )}
      </div>
    </aside>
  )
}
