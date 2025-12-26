import { useState, useEffect } from 'react'
import type { Coupon, Discount } from '../model'
import styles from './PromotionSection.module.css'

interface PromotionSectionProps {
  storeId: number
}

export const PromotionSection = ({ storeId }: PromotionSectionProps) => {
  const [coupons, setCoupons] = useState<Coupon[]>([])
  const [discounts, setDiscounts] = useState<Discount[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // TODO: API 호출로 실제 프로모션 데이터 가져오기
    // 현재는 더미 데이터 사용
    const loadPromotions = async () => {
      try {
        await new Promise(resolve => setTimeout(resolve, 300))
        
        const dummyCoupons: Coupon[] = [
          {
            id: 'coupon_1',
            name: '신규 고객 웰컴 쿠폰',
            description: '첫 주문 시 사용 가능한 특별 할인',
            discountRate: '15%',
            minOrderAmount: '10,000원',
            maxDiscount: '5,000원',
            startDate: '2025-01-01',
            endDate: '2025-12-31'
          },
          {
            id: 'coupon_2',
            name: '점심 특가 쿠폰',
            description: '평일 점심시간 한정 쿠폰',
            discountRate: '3,000원',
            minOrderAmount: '15,000원',
            startDate: '2025-01-01',
            endDate: '2025-06-30'
          },
          {
            id: 'coupon_3',
            name: '재방문 감사 쿠폰',
            description: '두 번째 방문 고객 전용',
            discountRate: '10%',
            minOrderAmount: '20,000원',
            maxDiscount: '8,000원',
            startDate: '2025-01-01',
            endDate: '2025-12-31'
          }
        ]

        const dummyDiscounts: Discount[] = [
          {
            id: 'discount_1',
            name: '첫 주문 할인',
            description: '처음 방문하시는 고객님께 특별한 혜택을 드립니다',
            discountRate: '20%',
            tag: 'NEW',
            conditions: ['첫 주문에 한함', '모든 메뉴 적용'],
            startDate: '2025-01-01',
            endDate: '2025-12-31'
          },
          {
            id: 'discount_2',
            name: '3만원 이상 주문 할인',
            description: '3만원 이상 주문 시 자동 할인',
            discountRate: '5,000원',
            tag: 'HOT',
            conditions: ['30,000원 이상 주문', '배달/포장 모두 가능'],
            startDate: '2025-01-01',
            endDate: '2025-06-30'
          },
          {
            id: 'discount_3',
            name: '주말 특별 할인',
            description: '주말 방문 고객 한정 할인',
            discountRate: '12%',
            tag: 'WEEKEND',
            conditions: ['토·일요일 한정', '매장 방문 전용'],
            startDate: '2025-01-01',
            endDate: '2025-12-31'
          }
        ]

        setCoupons(dummyCoupons)
        setDiscounts(dummyDiscounts)
        setLoading(false)
      } catch (error) {
        console.error('프로모션 로딩 실패:', error)
        setLoading(false)
      }
    }

    loadPromotions()
  }, [storeId])

  const formatDate = (dateString: string): string => {
    if (!dateString) return ''
    const date = new Date(dateString)
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    return `${year}.${month}.${day}`
  }

  const handleCouponDownload = (couponId: string, event: React.MouseEvent) => {
    event.stopPropagation()
    console.log('🎫 쿠폰 다운로드:', couponId)
    
    // 성공 토스트 표시
    showCouponDownloadSuccess()
    
    // TODO: 쿠폰 발급 API 호출
  }

  const showCouponDownloadSuccess = () => {
    const toast = document.createElement('div')
    toast.className = 'coupon-success-toast'
    toast.innerHTML = `
      <span class="toast-icon">✓</span>
      <span class="toast-text">쿠폰이 발급되었습니다</span>
    `
    document.body.appendChild(toast)

    setTimeout(() => {
      toast.classList.add('show')
    }, 10)

    setTimeout(() => {
      toast.classList.remove('show')
      setTimeout(() => toast.remove(), 300)
    }, 2000)
  }

  const handleCouponClick = (couponId: string) => {
    console.log('🎫 쿠폰 상세 정보:', couponId)
    // TODO: 쿠폰 상세 모달 열기
  }

  const handleDiscountClick = (discountId: string) => {
    console.log('💰 할인 이벤트 상세 정보:', discountId)
    // TODO: 할인 이벤트 상세 모달 열기
  }

  if (loading) {
    return (
      <section className={styles.promotionSection}>
        <div className={styles.sectionHeader}>
          <h3 className={styles.sectionTitle}>
            <span className={styles.sectionIcon}>🎁</span>
            혜택 & 프로모션
          </h3>
        </div>
        <div className={styles.promotionLoading}>로딩 중...</div>
      </section>
    )
  }

  if (coupons.length === 0 && discounts.length === 0) {
    return null
  }

  return (
    <section className={styles.promotionSection}>
      <div className={styles.sectionHeader}>
        <h3 className={styles.sectionTitle}>
          <span className={styles.sectionIcon}>🎁</span>
          혜택 & 프로모션
        </h3>
      </div>

      {/* 발급 가능한 쿠폰 */}
      {coupons.length > 0 && (
        <div className={styles.promotionCategory}>
          <div className={styles.categoryHeader}>
            <span className={styles.categoryIcon}>🎫</span>
            <h4 className={styles.categoryTitle}>발급 가능한 쿠폰 ({coupons.length})</h4>
          </div>
          <div className={styles.couponsContainer}>
            {coupons.map((coupon) => (
              <div
                key={coupon.id}
                className={styles.couponCard}
                onClick={() => handleCouponClick(coupon.id)}
              >
                <div className={styles.couponVisual}>
                  <div className={styles.couponBadge}>{coupon.discountRate}</div>
                  <div className={styles.couponDeco}></div>
                </div>
                <div className={styles.couponInfo}>
                  <div className={styles.couponName}>{coupon.name}</div>
                  <div className={styles.couponDesc}>{coupon.description}</div>
                  <div className={styles.couponConditions}>
                    <span className={styles.conditionItem}>📌 {coupon.minOrderAmount} 이상</span>
                    {coupon.maxDiscount && (
                      <span className={styles.conditionItem}>🔖 최대 {coupon.maxDiscount}</span>
                    )}
                  </div>
                  <div className={styles.couponPeriod}>
                    {formatDate(coupon.startDate)} ~ {formatDate(coupon.endDate)}
                  </div>
                </div>
                <button
                  className={styles.couponDownloadBtn}
                  onClick={(e) => handleCouponDownload(coupon.id, e)}
                >
                  <span>받기</span>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 진행중인 할인 이벤트 */}
      {discounts.length > 0 && (
        <div className={styles.promotionCategory}>
          <div className={styles.categoryHeader}>
            <span className={styles.categoryIcon}>💰</span>
            <h4 className={styles.categoryTitle}>할인 이벤트 ({discounts.length})</h4>
          </div>
          <div className={styles.discountsContainer}>
            {discounts.map((discount) => (
              <div
                key={discount.id}
                className={styles.discountCard}
                onClick={() => handleDiscountClick(discount.id)}
              >
                <div className={styles.discountVisual}>
                  <div className={styles.discountBadge}>{discount.discountRate}</div>
                  <div className={styles.discountTag}>{discount.tag}</div>
                </div>
                <div className={styles.discountInfo}>
                  <div className={styles.discountName}>{discount.name}</div>
                  <div className={styles.discountDesc}>{discount.description}</div>
                  <div className={styles.discountConditions}>
                    {discount.conditions.map((cond, idx) => (
                      <span key={idx} className={styles.conditionBadge}>
                        • {cond}
                      </span>
                    ))}
                  </div>
                  <div className={styles.discountMeta}>
                    <span className={styles.metaItem}>
                      <svg
                        width="14"
                        height="14"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                      >
                        <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                        <line x1="16" y1="2" x2="16" y2="6"></line>
                        <line x1="8" y1="2" x2="8" y2="6"></line>
                        <line x1="3" y1="10" x2="21" y2="10"></line>
                      </svg>
                      {formatDate(discount.startDate)} ~ {formatDate(discount.endDate)}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  )
}
