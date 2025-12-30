/**
 * BottomNavigation - 하단 네비게이션 위젯
 * 
 * FSD 원칙: widgets = 여러 페이지에서 사용되는 큰 UI 덩어리
 */

import { NavLink } from 'react-router-dom'
import styles from './BottomNavigation.module.css'

export const BottomNavigation = () => {
  const navItems = [
    { id: '/main', label: '홈', icon: '🏠' },
    { id: '/qr', label: 'QR 주문', icon: '📱' },
    { id: '/map', label: '내주변', icon: '🗺️' },
    { id: '/rp', label: '단골', icon: '❤️' },
    { id: '/mypage', label: '마이페이지', icon: '👤' },
  ]

  return (
    <nav className={styles.bottomNav}>
      {navItems.map((item) => (
        <NavLink
          key={item.id}
          to={item.id}
          className={({ isActive }) => `${styles.navItem} ${isActive ? styles.active : ''}`}
          end
        >
          <span className={styles.navIcon}>{item.icon}</span>
          <span className={styles.navLabel}>{item.label}</span>
        </NavLink>
      ))}
    </nav>
  )
}
