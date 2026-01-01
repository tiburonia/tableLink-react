import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import * as authApi from '@/shared/api/authApi'
import styles from './AddStorePage.module.css'

export function AddStorePage() {
  const navigate = useNavigate()
  const [isLoggingOut, setIsLoggingOut] = useState(false)
  const member = authApi.getMember()

  const handleLogout = () => {
    setIsLoggingOut(true)
    authApi.logout()
    window.location.reload()
  }

  const handleAddStore = () => {
    // 매장 등록 페이지로 이동
    navigate('/register-store')
  }

  return (
    <div className="mobile-app">
      <div className="mobile-content">
        <div className={styles.page}>
          {/* 헤더 */}
          <div className={styles.header}>
            <button 
              className={styles.logoutBtn} 
              onClick={handleLogout}
              disabled={isLoggingOut}
            >
              {isLoggingOut ? '로그아웃 중...' : '로그아웃'}
            </button>
          </div>

          {/* 메인 콘텐츠 */}
          <div className={styles.content}>
            {/* 아이콘 */}
            <div className={styles.icon}>🏪</div>

            {/* 환영 메시지 */}
            <h1 className={styles.title}>환영합니다!</h1>
            <p className={styles.subtitle}>
              {member?.name ? `${member.name}님, ` : ''}TableLink Merchant에 오신 것을 환영합니다
            </p>

            {/* 사용자 정보 */}
            <div className={styles.userInfo}>
              <div className={styles.infoItem}>
                <span className={styles.infoLabel}>이메일</span>
                <span className={styles.infoValue}>{member?.email || '-'}</span>
              </div>
              {member?.name && (
                <div className={styles.infoItem}>
                  <span className={styles.infoLabel}>이름</span>
                  <span className={styles.infoValue}>{member.name}</span>
                </div>
              )}
            </div>

            {/* 매장 추가 안내 */}
            <div className={styles.guideBox}>
              <div className={styles.guideIcon}>📋</div>
              <h2 className={styles.guideTitle}>다음 단계</h2>
              <p className={styles.guideText}>매장을 추가하세요!</p>
              <p className={styles.guideSubtext}>
                매장 정보를 등록하여 TableLink 서비스를 시작할 수 있습니다.
              </p>
            </div>

            {/* 매장 추가 버튼 */}
            <button className={styles.addStoreBtn} onClick={handleAddStore}>
              <span>➕</span>
              매장 추가하기
            </button>
          </div>

          {/* 푸터 */}
          <div className={styles.footer}>
            <p>© 2025 TableLink. All rights reserved.</p>
          </div>
        </div>
      </div>
    </div>
  )
}
