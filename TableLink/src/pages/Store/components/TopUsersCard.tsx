import { useEffect, useState } from 'react'
import './TopUsersCard.css'

interface TopUser {
  id: number
  name: string
  level: string
  visit_count: number
  total_spent: number
  avatar?: string
}

interface TopUsersCardProps {
  storeId: number
}

export const TopUsersCard = ({ storeId }: TopUsersCardProps) => {
  const [topUsers, setTopUsers] = useState<TopUser[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadTopUsers = async () => {
      try {
        // TODO: API 호출로 실제 단골 고객 데이터 가져오기
        // const result = await storeService.getTopUsers(storeId)
        
        // 임시 데이터
        setTimeout(() => {
          setTopUsers([
            {
              id: 1,
              name: '김단골',
              level: 'VIP',
              visit_count: 42,
              total_spent: 850000
            },
            {
              id: 2,
              name: '이고객',
              level: 'GOLD',
              visit_count: 28,
              total_spent: 520000
            },
            {
              id: 3,
              name: '박충성',
              level: 'SILVER',
              visit_count: 15,
              total_spent: 320000
            }
          ])
          setLoading(false)
        }, 600)
      } catch (error) {
        console.error('단골 고객 로딩 실패:', error)
        setLoading(false)
      }
    }

    loadTopUsers()
  }, [storeId])

  const handleShowAllUsers = () => {
    // TODO: 전체 랭킹 페이지로 이동
    console.log('전체 랭킹 보기')
  }

  const getRankEmoji = (index: number) => {
    switch (index) {
      case 0: return '🥇'
      case 1: return '🥈'
      case 2: return '🥉'
      default: return '👤'
    }
  }

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'VIP': return '#ffd700'
      case 'GOLD': return '#ffa500'
      case 'SILVER': return '#c0c0c0'
      default: return '#cd7f32'
    }
  }

  return (
    <div className="top-users-card premium-top-users-card">
      <div className="card-gradient-bg"></div>
      
      <div className="top-users-header">
        <div className="top-users-title-section">
          <div className="top-users-icon-wrapper">
            <span className="top-users-main-icon">👑</span>
          </div>
          <div className="top-users-title-info">
            <h3 className="top-users-title">단골 고객</h3>
            <div className="top-users-subtitle">최고의 고객들을 만나보세요</div>
          </div>
        </div>
        <div className="top-users-status-indicator">
          <span className="vip-dot"></span>
          <span className="vip-text">VIP</span>
        </div>
      </div>

      <div className="top-users-content">
        {loading ? (
          <div className="top-users-loading-skeleton">
            {[1, 2, 3].map((i) => (
              <div key={i} className="skeleton-user-item">
                <div className="skeleton-rank"></div>
                <div className="skeleton-user-avatar"></div>
                <div className="skeleton-user-info">
                  <div className="skeleton-user-name"></div>
                  <div className="skeleton-user-level"></div>
                </div>
                <div className="skeleton-user-stats">
                  <div className="skeleton-stat"></div>
                  <div className="skeleton-stat"></div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="top-users-list">
            {topUsers.map((user, index) => (
              <div key={user.id} className="top-user-item">
                <div className="user-rank">
                  <span className="rank-emoji">{getRankEmoji(index)}</span>
                  <span className="rank-number">#{index + 1}</span>
                </div>
                <div className="user-avatar">
                  {user.avatar ? (
                    <img src={user.avatar} alt={user.name} />
                  ) : (
                    <div className="avatar-placeholder">
                      {user.name.charAt(0)}
                    </div>
                  )}
                </div>
                <div className="user-info">
                  <div className="user-name">{user.name}</div>
                  <div 
                    className="user-level"
                    style={{ color: getLevelColor(user.level) }}
                  >
                    {user.level}
                  </div>
                </div>
                <div className="user-stats">
                  <div className="stat-item">
                    <span className="stat-label">방문</span>
                    <span className="stat-value">{user.visit_count}회</span>
                  </div>
                  <div className="stat-item">
                    <span className="stat-label">결제</span>
                    <span className="stat-value">
                      {(user.total_spent / 10000).toFixed(0)}만원
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="top-users-footer">
        <button 
          className="top-users-detail-btn modern-outline-btn"
          onClick={handleShowAllUsers}
        >
          <span className="btn-icon">🏆</span>
          <span className="btn-text">전체 랭킹 보기</span>
          <span className="btn-arrow">→</span>
        </button>
      </div>
    </div>
  )
}
