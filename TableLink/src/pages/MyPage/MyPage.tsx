import './MyPage.css'
import { BottomNavigation } from '@/pages/Main/components/BottomNavigation'
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import type { MyPageData } from './types'
import { mypageService } from './services/mypageService'

interface MyPageProps {
  onLogout: () => void
  userInfo?: {
    userId: number
    name?: string
    username?: string
  }
}

export const MyPage = ({ onLogout, userInfo }: MyPageProps) => {
  const [data, setData] = useState<MyPageData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const navigate = useNavigate()

  useEffect(() => {
    loadMyPageData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userInfo])

  const loadMyPageData = async () => {
    if (!userInfo?.userId) {
      setError('사용자 정보가 없습니다')
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      const mypageData = await mypageService.loadMypageData(userInfo.userId)
      setData(mypageData)
      setError(null)
    } catch (err) {
      console.error('❌ 마이페이지 데이터 로드 실패:', err)
      setError('데이터를 불러올 수 없습니다')
    } finally {
      setLoading(false)
    }
  }

  const getLevelEmoji = (level: string) => {
    const emojis: Record<string, string> = {
      PLATINUM: '💎',
      GOLD: '👑',
      SILVER: '⭐',
      BRONZE: '🥉',
    }
    return emojis[level] || '🏅'
  }

  const getLevelGradient = (level: string) => {
    const gradients: Record<string, string> = {
      PLATINUM: 'linear-gradient(135deg, #e5e4e2 0%, #f8f9fa 100%)',
      GOLD: 'linear-gradient(135deg, #ffd700 0%, #fff5e7 100%)',
      SILVER: 'linear-gradient(135deg, #c0c0c0 0%, #f1f3f5 100%)',
      BRONZE: 'linear-gradient(135deg, #cd7f32 0%, #fff5eb 100%)',
    }
    return gradients[level] || 'linear-gradient(135deg, #f8f9fa 0%, #fff 100%)'
  }

  if (loading) {
    return (
      <div className="mobile-app">
        <div className="mobile-content">
          <div className="mypage-loading">
            <div className="loading-spinner"></div>
          </div>
        </div>
        <BottomNavigation />
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="mobile-app">
        <div className="mobile-content">
          <div className="mypage-error">
            <h2>🚫 마이페이지를 불러올 수 없습니다</h2>
            <p>{error || '잠시 후 다시 시도해주세요'}</p>
            <button onClick={loadMyPageData} className="retry-btn">
              다시 시도
            </button>
          </div>
        </div>
        <BottomNavigation />
      </div>
    )
  }

  const displayName = data.userInfo.name || data.userInfo.username || '고객'
  const regularSummary = data.regularSummary

  return (
    <div className="mobile-app">
      <div className="mobile-content">
        {/* 헤더 */}
        <header className="mypage-top-header">
          <span className="login-link" onClick={() => navigate('/setting')} style={{ cursor: 'pointer' }}>
            {displayName}&nbsp;&nbsp;
            <img
              width="17"
              height="17"
              src="https://img.icons8.com/external-others-inmotus-design/17/external-Right-basic-web-ui-elements-others-inmotus-design-4.png"
              alt="arrow"
            />
          </span>
        </header>

        <div id="mypageContainer" style={{ overflowY: 'auto' }}>
          {/* Hero Card - 등급/포인트 정보 */}
          <section
            className="mypage-hero-card"
            style={{ background: getLevelGradient(regularSummary.topLevel) }}
          >
            <div className="hero-content">
              <div className="hero-badge">
                <span className="hero-emoji">{getLevelEmoji(regularSummary.topLevel)}</span>
                <span className="hero-level">{regularSummary.topLevelName}</span>
              </div>
              <h2 className="hero-title">
                <span id="userName">{displayName}</span>님은 현재{' '}
                <strong id="levelName">{regularSummary.topLevelName}</strong> 등급이에요!
              </h2>
              <div className="hero-stats">
                <div className="hero-stat">
                  <span className="stat-icon">💰</span>
                  <span className="stat-text">
                    누적 포인트: <strong id="totalPoints">{regularSummary.totalPoints}P</strong>
                  </span>
                </div>
                <div className="hero-stat">
                  <span className="stat-icon">🎟️</span>
                  <span className="stat-text">
                    보유 쿠폰: <strong id="totalCoupons">{regularSummary.totalCoupons}장</strong>
                  </span>
                </div>
              </div>
              <div className="hero-actions">
                <button className="hero-btn outline" onClick={() => alert('포인트 내역 준비중')}>
                  포인트 내역
                </button>
                <button className="hero-btn filled" onClick={() => alert('쿠폰함 준비중')}>
                  쿠폰함
                </button>
              </div>
            </div>
          </section>

          {/* 주문 섹션 */}
          <section className="mypage-info-section">
            <h3 className="section-title-simple">주문</h3>
            <ul className="simple-menu-list">
              <li style={{ cursor: 'pointer' }} onClick={() => navigate('/orders')}>
                <span>주문 내역</span>
                <span className="arrow-icon">›</span>
              </li>
            </ul>
          </section>

          {/* 결제 섹션 */}
          <section className="mypage-info-section">
            <h3 className="section-title-simple">결제</h3>
            <ul className="simple-menu-list">
              <li onClick={() => alert('준비중입니다')}>
                <span>테이블링크 간편결제 관리</span>
                <span className="arrow-icon">›</span>
              </li>
              <li onClick={() => alert('준비중입니다')}>
                <span>테이블링크 페이 머니 관리</span>
                <span className="arrow-icon">›</span>
              </li>
            </ul>
          </section>

          {/* 이용 정보 섹션 */}
          <section className="mypage-info-section">
            <h3 className="section-title-simple">이용 정보</h3>
            <ul className="simple-menu-list">
              <li onClick={() => alert('내 리뷰 준비중')}>
                <span>내 리뷰</span>
                <span className="arrow-icon">›</span>
              </li>
              <li onClick={() => alert('단골가게 준비중')}>
                <span>내 단골가게</span>
                <span className="arrow-icon">›</span>
              </li>
              <li onClick={() => navigate('/orders')}>
                <span>이용 내역</span>
                <span className="arrow-icon">›</span>
              </li>
            </ul>
          </section>

          {/* 로그아웃 버튼 */}
          <section className="mypage-info-section">
            <ul className="simple-menu-list">
              <li onClick={onLogout} style={{ cursor: 'pointer' }}>
                <span style={{ color: '#ff3b30' }}>로그아웃</span>
                <span className="arrow-icon">›</span>
              </li>
            </ul>
          </section>
        </div>
      </div>
      <BottomNavigation />
    </div>
  )
}
