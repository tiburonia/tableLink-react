import './MyPage.css'
import { BottomNavigation } from '@/pages/Main/components/BottomNavigation'
interface MyPageProps {
  onLogout: () => void
}

export const MyPage = ({ onLogout }: MyPageProps) => {
  return (
    <div className="mobile-app">
      <div className="mobile-content">
      <div className="mypage-header">
        <div className="user-profile">
          <div className="profile-avatar">👤</div>
          <div className="profile-info">
            <h2>사용자</h2>
            <p>user@example.com</p>
          </div>
        </div>
      </div>

      <div className="mypage-sections">
        <div className="mypage-section">
          <h3>📋 주문 관리</h3>
          <button className="section-item">최근 주문</button>
          <button className="section-item">주문 내역</button>
        </div>

        <div className="mypage-section">
          <h3>❤️ 즐겨찾기</h3>
          <button className="section-item">저장된 매장</button>
          <button className="section-item">단골 매장</button>
        </div>

        <div className="mypage-section">
          <h3>⚙️ 설정</h3>
          <button className="section-item">개인정보</button>
          <button className="section-item">알림 설정</button>
          <button className="section-item">결제 방법</button>
        </div>

        <button className="logout-btn" onClick={onLogout}>
          로그아웃
        </button>
      </div>

      
    </div>
    <BottomNavigation />
    </div>
  )
}
