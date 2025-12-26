import { useEffect, useState } from 'react'
import clsx from 'clsx'
import type { Promotion } from '../model'
import styles from './PromotionCard.module.css'

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
    <div className={clsx(styles.promotionCard, styles.modernBenefitsCard)}>
      <div className={styles.promotionHeader}>
        <div className={styles.promotionTitleSection}>
          <div className={styles.promotionIconWrapper}>
            <span className={styles.promotionMainIcon}>🎁</span>
          </div>
          <div className={styles.promotionTitleInfo}>
            <h3 className={styles.promotionTitle}>진행중인 혜택</h3>
            <div className={styles.promotionSubtitle}>특별 혜택을 확인하세요</div>
          </div>
        </div>
        <div className={styles.promotionStatusIndicator}>
          <span className={styles.liveDot}></span>
          <span className={styles.liveText}>LIVE</span>
        </div>
      </div>

      <div className={styles.promotionContent}>
        {loading ? (
          <div className={styles.benefitsLoadingSkeleton}>
            {[1, 2, 3].map((i) => (
              <div key={i} className={styles.skeletonBenefitItem}>
                <div className={styles.skeletonIconContainer}>
                  <div className={styles.skeletonIcon}></div>
                </div>
                <div className={styles.skeletonContent}>
                  <div className={styles.skeletonTitle}></div>
                  <div className={styles.skeletonDesc}></div>
                </div>
                <div className={styles.skeletonBadge}></div>
              </div>
            ))}
          </div>
        ) : (
          <div className={styles.benefitsList}>
            {promotions.map((promo) => (
              <div key={promo.id} className={styles.benefitItem}>
                <div className={styles.benefitIconContainer}>
                  <span className={styles.benefitIcon}>
                    {promo.type === 'FIRST_VISIT' ? '🎉' :
                     promo.type === 'LOYALTY' ? '⭐' : '✍️'}
                  </span>
                </div>
                <div className={styles.benefitContent}>
                  <h4 className={styles.benefitTitle}>{promo.title}</h4>
                  <p className={styles.benefitDesc}>{promo.description}</p>
                </div>
                {promo.discount_rate && (
                  <div className={styles.benefitBadge}>{promo.discount_rate}%</div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <div className={styles.promotionFooter}>
        <button 
          className={clsx(styles.promotionDetailBtn, styles.modernOutlineBtn)}
          onClick={handleShowAllPromotions}
        >
          <span className={styles.btnIcon}>📋</span>
          <span className={styles.btnText}>전체 혜택 보기</span>
          <span className={styles.btnArrow}>→</span>
        </button>
      </div>
    </div>
  )
}
