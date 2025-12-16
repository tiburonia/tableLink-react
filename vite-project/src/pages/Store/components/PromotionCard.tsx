import { useEffect, useState } from 'react'
import './PromotionCard.css'

interface Promotion {
  id: number
  title: string
  description: string
  discount_rate?: number
  type: string
  is_active: boolean
}

interface PromotionCardProps {
  storeId: number
}

export const PromotionCard = ({ storeId }: PromotionCardProps) => {
  const [promotions, setPromotions] = useState<Promotion[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadPromotions = async () => {
      try {
        // TODO: API 호출로 실제 프로모션 데이터 가져오기
        // const result = await storeService.getPromotions(storeId)
        
        // 임시 데이터
        setTimeout(() => {
          setPromotions([
            {
              id: 1,
              title: '첫 방문 10% 할인',
              description: '처음 오시는 고객님께 드리는 특별 혜택',
              discount_rate: 10,
              type: 'FIRST_VISIT',
              is_active: true
            },
            {
              id: 2,
              title: '단골 5% 적립',
              description: '방문할 때마다 포인트가 쌓입니다',
              discount_rate: 5,
              type: 'LOYALTY',
              is_active: true
            },
            {
              id: 3,
              title: '리뷰 작성 혜택',
              description: '리뷰 작성 시 다음 방문 시 사용 가능한 쿠폰',
              type: 'REVIEW',
              is_active: true
            }
          ])
          setLoading(false)
        }, 500)
      } catch (error) {
        console.error('프로모션 로딩 실패:', error)
        setLoading(false)
      }
    }

    loadPromotions()
  }, [storeId])

  const handleShowAllPromotions = () => {
    // TODO: 전체 프로모션 페이지로 이동
    console.log('전체 혜택 보기')
  }

  return (
    <div className="promotion-card modern-benefits-card">
      <div className="promotion-header">
        <div className="promotion-title-section">
          <div className="promotion-icon-wrapper">
            <span className="promotion-main-icon">🎁</span>
          </div>
          <div className="promotion-title-info">
            <h3 className="promotion-title">진행중인 혜택</h3>
            <div className="promotion-subtitle">특별 혜택을 확인하세요</div>
          </div>
        </div>
        <div className="promotion-status-indicator">
          <span className="live-dot"></span>
          <span className="live-text">LIVE</span>
        </div>
      </div>

      <div className="promotion-content">
        {loading ? (
          <div className="benefits-loading-skeleton">
            {[1, 2, 3].map((i) => (
              <div key={i} className="skeleton-benefit-item">
                <div className="skeleton-icon-container">
                  <div className="skeleton-icon"></div>
                </div>
                <div className="skeleton-content">
                  <div className="skeleton-title"></div>
                  <div className="skeleton-desc"></div>
                </div>
                <div className="skeleton-badge"></div>
              </div>
            ))}
          </div>
        ) : (
          <div className="benefits-list">
            {promotions.map((promo) => (
              <div key={promo.id} className="benefit-item">
                <div className="benefit-icon-container">
                  <span className="benefit-icon">
                    {promo.type === 'FIRST_VISIT' ? '🎉' :
                     promo.type === 'LOYALTY' ? '⭐' : '✍️'}
                  </span>
                </div>
                <div className="benefit-content">
                  <h4 className="benefit-title">{promo.title}</h4>
                  <p className="benefit-desc">{promo.description}</p>
                </div>
                {promo.discount_rate && (
                  <div className="benefit-badge">{promo.discount_rate}%</div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="promotion-footer">
        <button 
          className="promotion-detail-btn modern-outline-btn"
          onClick={handleShowAllPromotions}
        >
          <span className="btn-icon">📋</span>
          <span className="btn-text">전체 혜택 보기</span>
          <span className="btn-arrow">→</span>
        </button>
      </div>
    </div>
  )
}
