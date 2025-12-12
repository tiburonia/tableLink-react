import { useNavigate } from 'react-router-dom'
import { Button } from '@/shared/ui'
import './HomePage.css'

export const HomePage = () => {
  const navigate = useNavigate()

  return (
    <div className="home-page">
      <div className="home-page__container">
        <h1 className="home-page__title">TableLink 대시보드</h1>
        <p className="home-page__subtitle">음식점 주문 관리 시스템에 오신 것을 환영합니다</p>

        <div className="home-page__actions">
          <Button onClick={() => navigate('/login')}>로그아웃</Button>
        </div>
      </div>
    </div>
  )
}
