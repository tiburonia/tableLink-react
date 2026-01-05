/**
 * ReviewWritePage - 리뷰 작성 페이지
 * 
 * FSD 원칙: 페이지는 조립만 한다
 * - Legacy_TLG의 reviewWriteView, reviewWriteController를 참고하여 구현
 */

import { useNavigate, useLocation } from 'react-router-dom'
import { useReviewWrite } from '@/features/review-write'
import styles from './ReviewWritePage.module.css'

interface OrderItem {
  menu_name: string
  quantity: number
  unit_price: number
  total_price: number
}

interface LocationState {
  order: {
    id: number | string
    store_name: string
    store_id: number
    order_items: OrderItem[]
    total_price: number
    created_at: string
  }
}

const RATING_TEXTS: Record<number, string> = {
  0: '별점을 선택해주세요',
  1: '별로예요 😞',
  2: '그저 그래요 😐',
  3: '보통이에요 🙂',
  4: '맛있어요 😋',
  5: '최고예요! 🤩',
}

export const ReviewWritePage = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const state = location.state as LocationState | null

  const order = state?.order

  const {
    rating,
    content,
    isSubmitting,
    error,
    setRating,
    setContent,
    submitReview,
    canSubmit,
  } = useReviewWrite()

  // 주문 정보가 없으면 에러 표시
  if (!order) {
    return (
      <div className="mobile-app">
        <div className="mobile-content">
          <div className={styles.container}>
            <header className={styles.header}>
              <button className={styles.backBtn} onClick={() => navigate('/orders')}>
                <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M15 18l-6-6 6-6" />
                </svg>
              </button>
              <div className={styles.headerInfo}>
                <h1>📝 리뷰 작성</h1>
              </div>
            </header>

            <div className={styles.errorState}>
              <div className={styles.errorIcon}>⚠️</div>
              <h3>리뷰 작성을 불러올 수 없어요</h3>
              <p>주문 정보가 없습니다. 주문 내역에서 다시 시도해주세요.</p>
              <button className={styles.primaryBtn} onClick={() => navigate('/orders')}>
                <span>🔙</span>
                주문 내역으로 돌아가기
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // 주문 정보 가공
  const storeName = order.store_name || '매장 정보 없음'
  const items = order.order_items || []
  const itemsText = items.length > 0
    ? items.map(item => `${item.menu_name} x${item.quantity}`).join(', ')
    : '메뉴 정보 없음'
  const totalPrice = order.total_price || 0
  const orderDate = order.created_at
    ? new Date(order.created_at).toLocaleDateString('ko-KR')
    : ''
  const storeId = order.store_id || 0

  const handleBack = () => {
    navigate('/orders')
  }

  const handleSubmit = async () => {
    const success = await submitReview({
      orderId: Number(order.id),
      storeId: storeId,
      rating,
      content,
    })

    if (success) {
      navigate('/orders', { state: { reviewSubmitted: true } })
    }
  }

  return (
    <div className="mobile-app">
      <div className="mobile-content">
        <div className={styles.container}>
          {/* 헤더 */}
          <header className={styles.header}>
            <button className={styles.backBtn} onClick={handleBack}>
              <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M15 18l-6-6 6-6" />
              </svg>
            </button>
            <div className={styles.headerInfo}>
              <h1>📝 리뷰 작성</h1>
              <p className={styles.headerSubtitle}>주문에 대한 솔직한 후기를 남겨주세요</p>
            </div>
          </header>

          <div className={styles.content}>
            {/* 주문 정보 카드 */}
            <div className={styles.orderInfoCard}>
              <div className={styles.orderInfoHeader}>
                <h3>📋 주문 정보</h3>
                <span className={styles.orderDate}>{orderDate}</span>
              </div>
              <div className={styles.orderDetails}>
                <div className={styles.storeName}>{storeName}</div>
                <div className={styles.orderItems}>{itemsText}</div>
                <div className={styles.orderAmount}>{totalPrice.toLocaleString()}원</div>
              </div>
            </div>

            {/* 리뷰 작성 폼 */}
            <div className={styles.reviewFormCard}>
              {/* 별점 선택 */}
              <div className={styles.ratingSection}>
                <h3 className={styles.formLabel}>⭐ 별점을 선택해주세요</h3>
                <div className={styles.starRating}>
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      className={`${styles.starBtn} ${star <= rating ? styles.starFilled : ''}`}
                      onClick={() => setRating(star)}
                      onMouseEnter={(e) => {
                        // 호버 효과: 해당 별까지 노란색으로 표시
                        const buttons = e.currentTarget.parentElement?.querySelectorAll('button')
                        buttons?.forEach((btn, idx) => {
                          if (idx < star) btn.classList.add(styles.starHover)
                        })
                      }}
                      onMouseLeave={(e) => {
                        const buttons = e.currentTarget.parentElement?.querySelectorAll('button')
                        buttons?.forEach((btn) => btn.classList.remove(styles.starHover))
                      }}
                    >
                      {star <= rating ? '★' : '☆'}
                    </button>
                  ))}
                </div>
                <div className={styles.ratingText}>{RATING_TEXTS[rating]}</div>
              </div>

              {/* 리뷰 내용 */}
              <div className={styles.contentSection}>
                <h3 className={styles.formLabel}>✍️ 리뷰 내용</h3>
                <textarea
                  className={styles.reviewTextarea}
                  placeholder={`음식은 어떠셨나요? 서비스는 만족스러우셨나요?\n\n최소 10자 이상 작성해주세요.`}
                  maxLength={500}
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                />
                <div className={styles.charCount}>
                  <span className={content.length < 10 ? styles.charCountWarning : ''}>
                    {content.length}
                  </span> / 500자
                  {content.length > 0 && content.length < 10 && (
                    <span className={styles.charCountHint}> (최소 10자)</span>
                  )}
                </div>
              </div>

              {/* 리뷰 작성 팁 */}
              <div className={styles.reviewTips}>
                <h4>💡 좋은 리뷰 작성 팁</h4>
                <ul>
                  <li>음식의 맛과 품질에 대한 구체적인 설명</li>
                  <li>서비스와 직원의 친절도</li>
                  <li>매장의 분위기와 청결도</li>
                  <li>가격 대비 만족도</li>
                </ul>
              </div>
            </div>

            {/* 에러 메시지 */}
            {error && (
              <div className={styles.errorMessage}>
                ⚠️ {error}
              </div>
            )}

            {/* 제출 버튼 */}
            <div className={styles.submitSection}>
              <button
                className={styles.submitBtn}
                disabled={!canSubmit || isSubmitting}
                onClick={handleSubmit}
              >
                {isSubmitting ? (
                  <>
                    <span className={styles.spinner}></span>
                    등록 중...
                  </>
                ) : (
                  <>
                    <span className={styles.btnIcon}>📝</span>
                    리뷰 등록하기
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
