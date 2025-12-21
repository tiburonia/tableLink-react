import { authService } from '@/shared/api'
import './Header.css'

interface HeaderProps {
  onLogout?: () => void
}

export const Header = ({ onLogout }: HeaderProps) => {
  const user = authService.getUser()

  const handleLogout = () => {
    authService.logout()
    if (onLogout) {
      onLogout()
    }
  }

  return (
    <header className="header">
      <div className="header__content">
        <div className="header__brand">
          <h1 className="header__title">TableLink</h1>
        </div>
        <div className="header__user">
          <span className="header__email">{user.email}</span>
          <button className="header__logout" onClick={handleLogout}>
            로그아웃
          </button>
        </div>
      </div>
    </header>
  )
}
