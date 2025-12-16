import { NavLink } from 'react-router-dom'
import './BottomNavigation.css'

export const BottomNavigation = () => {
  const navItems = [
    { id: '/main', label: '홈', icon: '🏠' },
    { id: '/main/qr', label: 'QR 주문', icon: '📱' },
    { id: '/main/map', label: '내주변', icon: '🗺️' },
    { id: '/main/mypage', label: '마이페이지', icon: '👤' },
  ]

  return (
    <nav className="bottom-nav">
      {navItems.map((item) => (
        <NavLink
          key={item.id}
          to={item.id}
          className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
          end
        >
          <span className="nav-icon">{item.icon}</span>
          <span className="nav-label">{item.label}</span>
        </NavLink>
      ))}
    </nav>
  )
}
