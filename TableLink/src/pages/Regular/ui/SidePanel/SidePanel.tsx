import { useNavigate } from 'react-router-dom'
import styles from './SidePanel.module.css'

interface SidePanelProps {
  isOpen: boolean
  onClose: () => void
}

export const SidePanel = ({ isOpen, onClose }: SidePanelProps) => {
  const navigate = useNavigate()

  const handleNavigate = (path: string) => {
    navigate(path)
    onClose()
  }

  const handleLogout = () => {
    if (confirm('로그아웃 하시겠습니까?')) {
      localStorage.clear()
      window.location.href = '/login'
    }
  }

  // 로컬 스토리지에서 사용자 정보 가져오기
  const userStr = localStorage.getItem('user')
  const user = userStr ? JSON.parse(userStr) : null

  return (
    <>
      {/* 오버레이 */}
      <div
        className={`${styles.sidePanelOverlay} ${isOpen ? styles.active : ''}`}
        onClick={onClose}
      />

      {/* 사이드 패널 */}
      <div className={`${styles.sidePanel} ${isOpen ? styles.active : ''}`}>
        <div className={styles.sidePanelHeader}>
          <div className={styles.sidePanelProfile}>
            <div className={styles.sidePanelAvatar}>
              <img
                src="/TableLink.png"
                alt="프로필"
                onError={(e) => {
                  e.currentTarget.style.display = 'none'
                }}
              />
            </div>
            <div className={styles.sidePanelUserInfo}>
              <h3 className={styles.sidePanelUsername}>{user?.username || '게스트'}</h3>
              <p className={styles.sidePanelEmail}>{user?.name || ''}</p>
            </div>
          </div>
          <button className={styles.sidePanelCloseBtn} onClick={onClose}>
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <nav className={styles.sidePanelNav}>
          <button
            className={styles.sidePanelMenuItem}
            onClick={() => handleNavigate('/mypage')}
          >
            <div className={styles.sidePanelMenuIcon}>
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
            </div>
            <span className={styles.sidePanelMenuText}>내 프로필</span>
            <svg
              className={styles.sidePanelMenuArrow}
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M9 18l6-6-6-6" />
            </svg>
          </button>

          <button
            className={styles.sidePanelMenuItem}
            onClick={() => handleNavigate('/main')}
          >
            <div className={styles.sidePanelMenuIcon}>
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" />
                <line x1="4" y1="22" x2="4" y2="15" />
              </svg>
            </div>
            <span className={styles.sidePanelMenuText}>매장 찾기</span>
            <svg
              className={styles.sidePanelMenuArrow}
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M9 18l6-6-6-6" />
            </svg>
          </button>

          <button className={styles.sidePanelMenuItem} onClick={onClose}>
            <div className={styles.sidePanelMenuIcon}>
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                <path d="M16 3.13a4 4 0 0 1 0 7.75" />
              </svg>
            </div>
            <span className={styles.sidePanelMenuText}>단골 매장</span>
            <svg
              className={styles.sidePanelMenuArrow}
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M9 18l6-6-6-6" />
            </svg>
          </button>

          <button
            className={styles.sidePanelMenuItem}
            onClick={() => alert('쿠폰함 기능은 준비 중입니다')}
          >
            <div className={styles.sidePanelMenuIcon}>
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" />
                <line x1="7" y1="7" x2="7.01" y2="7" />
              </svg>
            </div>
            <span className={styles.sidePanelMenuText}>쿠폰함</span>
            <svg
              className={styles.sidePanelMenuArrow}
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M9 18l6-6-6-6" />
            </svg>
          </button>

          <div className={styles.sidePanelDivider} />

          <button
            className={styles.sidePanelMenuItem}
            onClick={() => alert('설정 기능은 준비 중입니다')}
          >
            <div className={styles.sidePanelMenuIcon}>
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <circle cx="12" cy="12" r="3" />
                <path d="M12 1v6m0 6v6m-8.66-8.66l5.2 3M15.46 8.34l5.2-3m-5.2 10.32l5.2 3M9.66 15.66l-5.2 3" />
              </svg>
            </div>
            <span className={styles.sidePanelMenuText}>설정</span>
            <svg
              className={styles.sidePanelMenuArrow}
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M9 18l6-6-6-6" />
            </svg>
          </button>

          <button
            className={styles.sidePanelMenuItem}
            onClick={() => handleNavigate('/notifications')}
          >
            <div className={styles.sidePanelMenuIcon}>
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                <path d="M13.73 21a2 2 0 0 1-3.46 0" />
              </svg>
            </div>
            <span className={styles.sidePanelMenuText}>알림</span>
            <svg
              className={styles.sidePanelMenuArrow}
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M9 18l6-6-6-6" />
            </svg>
          </button>

          <div className={styles.sidePanelDivider} />

          <button
            className={styles.sidePanelMenuItem}
            onClick={() => alert('고객센터 기능은 준비 중입니다')}
          >
            <div className={styles.sidePanelMenuIcon}>
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <circle cx="12" cy="12" r="10" />
                <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
                <line x1="12" y1="17" x2="12.01" y2="17" />
              </svg>
            </div>
            <span className={styles.sidePanelMenuText}>고객센터</span>
            <svg
              className={styles.sidePanelMenuArrow}
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M9 18l6-6-6-6" />
            </svg>
          </button>

          <button
            className={`${styles.sidePanelMenuItem} ${styles.sidePanelMenuItemDanger}`}
            onClick={handleLogout}
          >
            <div className={styles.sidePanelMenuIcon}>
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                <polyline points="16 17 21 12 16 7" />
                <line x1="21" y1="12" x2="9" y2="12" />
              </svg>
            </div>
            <span className={styles.sidePanelMenuText}>로그아웃</span>
          </button>
        </nav>

        <div className={styles.sidePanelFooter}>
          <p className={styles.sidePanelVersion}>TableLink v1.0.0</p>
        </div>
      </div>
    </>
  )
}
