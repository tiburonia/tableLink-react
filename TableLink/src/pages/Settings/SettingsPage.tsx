import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import './SettingsPage.css'

interface SettingsPageProps {
  onLogout: () => void
  userInfo?: {
    userId: number
    name?: string
    username?: string
    email?: string
    phone?: string
    emailVerified?: boolean
  }
}

export const SettingsPage = ({ onLogout, userInfo }: SettingsPageProps) => {
  const navigate = useNavigate()
  const [snsConnections] = useState({
    kakao: false,
    naver: false,
    apple: userInfo?.email?.includes('appleid.com') || false,
  })

  const displayName = userInfo?.name || userInfo?.username || '사용자'
  const email = userInfo?.email || ''
  const phone = userInfo?.phone || ''
  const isEmailVerified = email.includes('appleid.com') || userInfo?.emailVerified

  const handleBack = () => {
    navigate('/mypage')
  }

  const handleSNSConnect = (snsType: string) => {
    const messages: Record<string, string> = {
      kakao: '카카오톡 연동 기능은 준비중입니다.',
      naver: '네이버 연동 기능은 준비중입니다.',
      apple: '애플 연동 기능은 준비중입니다.',
    }
    alert(messages[snsType] || 'SNS 연동 준비중입니다.')
  }

  const handleEditField = (field: string) => {
    const messages: Record<string, string> = {
      nickname: '닉네임 수정 기능은 준비중입니다.',
      email: '이메일 수정 기능은 준비중입니다.',
      phone: '휴대폰번호 수정 기능은 준비중입니다.',
      password: '비밀번호 변경 기능은 준비중입니다.',
    }
    alert(messages[field] || '수정 기능 준비중입니다.')
  }

  const handleWithdraw = () => {
    if (
      confirm(
        '정말로 회원탈퇴를 하시겠습니까?\n탈퇴 시 모든 데이터가 삭제되며 복구할 수 없습니다.'
      )
    ) {
      alert('회원탈퇴 기능은 준비중입니다.')
    }
  }

  const handleLogout = () => {
    if (confirm('로그아웃 하시겠습니까?')) {
      onLogout()
      navigate('/login')
    }
  }

  return (
    <div className="mobile-app">
      <div className="mobile-content">
        <div className="account-settings-wrapper">
          {/* 헤더 */}
          <header className="settings-header">
            <button className="header-back-btn" onClick={handleBack} aria-label="뒤로가기">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <path
                  d="M15 18L9 12L15 6"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
            <h1 className="header-title">내정보 관리</h1>
            <div className="header-spacer"></div>
          </header>

          {/* 스크롤 컨텐츠 */}
          <div className="account-settings-content">
            {/* SNS 연동 섹션 */}
            <section className="settings-section">
              <div className="section-header-settings">
                <h2 className="section-title-settings">SNS 연동</h2>
                <p className="section-subtitle-settings">연동된 계정으로 로그인할 수 있어요</p>
              </div>
              <div className="sns-buttons-container">
                <button
                  className={`sns-button kakao ${snsConnections.kakao ? 'connected' : ''}`}
                  onClick={() => handleSNSConnect('kakao')}
                >
                  <div className="sns-icon kakao-icon">
                    <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
                      <circle cx="16" cy="16" r="16" fill="#FEE500" />
                      <path
                        d="M16 8C11.029 8 7 11.134 7 15C7 17.395 8.604 19.484 11 20.71V24L14.29 22.35C14.85 22.45 15.42 22.5 16 22.5C20.971 22.5 25 19.366 25 15.5C25 11.634 20.971 8 16 8Z"
                        fill="#3C1E1E"
                      />
                    </svg>
                  </div>
                  <span>카카오톡</span>
                </button>

                <button
                  className={`sns-button naver ${snsConnections.naver ? 'connected' : ''}`}
                  onClick={() => handleSNSConnect('naver')}
                >
                  <div className="sns-icon naver-icon">
                    <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
                      <circle cx="16" cy="16" r="16" fill="#03C75A" />
                      <path
                        d="M18.5 16L13.5 9H9V23H13.5V16L18.5 23H23V9H18.5V16Z"
                        fill="white"
                      />
                    </svg>
                  </div>
                  <span>네이버</span>
                </button>

                <button
                  className={`sns-button apple ${snsConnections.apple ? 'connected' : ''}`}
                  onClick={() => handleSNSConnect('apple')}
                >
                  <div className="sns-icon apple-icon">
                    <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
                      <circle cx="16" cy="16" r="16" fill="#000000" />
                      <path
                        d="M21.3 16.9c0-2.4 2-3.6 2.1-3.6-1.2-1.7-3-1.9-3.6-1.9-1.5-.2-3 .9-3.8.9-.8 0-2-.9-3.3-.8-1.7 0-3.3 1-4.1 2.5-1.8 3.1-.5 7.6 1.3 10.1.9 1.2 1.9 2.6 3.3 2.5 1.3-.1 1.8-.8 3.4-.8 1.6 0 2 .8 3.3.8 1.4 0 2.3-1.2 3.2-2.4 1-1.4 1.4-2.8 1.4-2.8s-2.6-1-2.6-3.9zm-2.4-7.1c.7-.9 1.2-2.1 1.1-3.3-1 0-2.3.7-3 1.6-.6.7-1.2 2-1 3.1 1.1.1 2.2-.5 2.9-1.4z"
                        fill="white"
                      />
                    </svg>
                  </div>
                  <span>애플</span>
                </button>
              </div>
            </section>

            {/* 계정 정보 섹션 */}
            <section className="settings-section">
              <div className="section-header-settings">
                <h2 className="section-title-settings">계정 정보</h2>
              </div>
              <div className="account-info-list">
                {/* 닉네임 */}
                <div className="info-row" onClick={() => handleEditField('nickname')}>
                  <span className="info-label">닉네임</span>
                  <div className="info-value-container">
                    <span className="info-value">{displayName}</span>
                    <svg className="arrow-icon" width="20" height="20" viewBox="0 0 20 20" fill="none">
                      <path
                        d="M7 15L12 10L7 5"
                        stroke="#86868b"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </div>
                </div>

                {/* 이메일 */}
                <div className="info-row" onClick={() => handleEditField('email')}>
                  <span className="info-label">이메일</span>
                  <div className="info-value-container">
                    <span className="info-value">{email || '등록된 이메일 없음'}</span>
                    {isEmailVerified && <span className="verified-badge">인증 완료</span>}
                    <svg className="arrow-icon" width="20" height="20" viewBox="0 0 20 20" fill="none">
                      <path
                        d="M7 15L12 10L7 5"
                        stroke="#86868b"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </div>
                </div>

                {/* 휴대폰번호 */}
                <div className="info-row" onClick={() => handleEditField('phone')}>
                  <span className="info-label">휴대폰번호</span>
                  <div className="info-value-container">
                    <span className="info-value">{phone || '등록된 번호 없음'}</span>
                    <svg className="arrow-icon" width="20" height="20" viewBox="0 0 20 20" fill="none">
                      <path
                        d="M7 15L12 10L7 5"
                        stroke="#86868b"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </div>
                </div>

                {/* 비밀번호 */}
                <div className="info-row" onClick={() => handleEditField('password')}>
                  <span className="info-label">비밀번호</span>
                  <div className="info-value-container">
                    <span className="info-value password-text">새로운 비밀번호로 변경 가능</span>
                    <svg className="arrow-icon" width="20" height="20" viewBox="0 0 20 20" fill="none">
                      <path
                        d="M7 15L12 10L7 5"
                        stroke="#86868b"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </div>
                </div>
              </div>
            </section>

            {/* 하단 버튼 영역 */}
            <div className="footer-buttons">
              <button className="text-button" onClick={handleWithdraw}>
                회원탈퇴
              </button>
              <button className="text-button" onClick={handleLogout}>
                로그아웃
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
