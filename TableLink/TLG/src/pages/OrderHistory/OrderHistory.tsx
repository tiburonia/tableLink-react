/**
 * OrderHistory - 주문 내역 페이지
 * 
 * FSD 원칙: 페이지는 조립만 한다
 * - useState ❌
 * - useEffect ❌
 * - API 호출 ❌
 */

import { useOrderHistory } from '@/features/order-history'
import styles from './OrderHistory.module.css'

interface OrderHistoryProps {
  userInfo?: {
    userId: number
    name?: string
    username?: string
  }
}

export const OrderHistory = ({ userInfo }: OrderHistoryProps) => {
  // Hook에서 모든 상태와 로직을 가져옴
  const {
    loading,
    error,
    orders,
    handleBack,
    handleReorder,
    handleReviewWrite,
    refetch,
    getOrderItemsText,
    formatOrderDate,
    goToMap,
  } = useOrderHistory(userInfo)

  if (loading) {
    return (
      <div className="mobile-app">
        <div className="mobile-content">
          <div className={styles.container}>
            <header className={styles.header}>
              <button className={styles.backBtn} onClick={handleBack}>
                <svg
                  viewBox="0 0 24 24"
                  width="24"
                  height="24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M15 18l-6-6 6-6" />
                </svg>
              </button>
              <div className={styles.headerInfo}>
                <h1>📦 주문 내역</h1>
                <p>나의 모든 주문을 확인하세요</p>
              </div>
            </header>
            <div className={styles.content}>
              <div className={styles.loadingState}>주문 내역을 불러오는 중...</div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (error || orders.length === 0 && !loading) {
    return (
      <div className="mobile-app">
        <div className="mobile-content">
          <div className={styles.container}>
            <header className={styles.header}>
              <button className={styles.backBtn} onClick={handleBack}>
                <svg
                  viewBox="0 0 24 24"
                  width="24"
                  height="24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M15 18l-6-6 6-6" />
                </svg>
              </button>
              <div className={styles.headerInfo}>
                <h1>📦 주문 내역</h1>
              </div>
            </header>
            <div className={styles.emptyState} style={{ paddingTop: '100px' }}>
              <div className={styles.emptyIcon}>⚠️</div>
              <h3>주문 내역을 불러올 수 없어요</h3>
              <p>{error || '잠시 후 다시 시도해주세요'}</p>
              <button className={styles.primaryBtn} onClick={refetch}>
                <span>🔄</span>
                다시 시도
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (orders.length === 0) {
    return (
      <div className="mobile-app">
        <div className="mobile-content">
          <div className={styles.container}>
            <header className={styles.header}>
              <button className={styles.backBtn} onClick={handleBack}>
                <svg
                  viewBox="0 0 24 24"
                  width="24"
                  height="24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M15 18l-6-6 6-6" />
                </svg>
              </button>
              <div className={styles.headerInfo}>
                <h1>📦 주문 내역</h1>
                <p>나의 모든 주문을 확인하세요</p>
              </div>
            </header>
            <div className={styles.emptyState}>
              <div className={styles.emptyIcon}>🍽️</div>
              <h3>아직 주문 내역이 없어요</h3>
              <p>첫 주문을 해보세요!</p>
              <button className={styles.primaryBtn} onClick={goToMap}>
                <span>🗺️</span>
                매장 찾기
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="mobile-app">
      <div className="mobile-content">
        <div className={styles.container}>
          <header className={styles.header}>
            <button className={styles.backBtn} onClick={handleBack}>
              <svg
                viewBox="0 0 24 24"
                width="24"
                height="24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M15 18l-6-6 6-6" />
              </svg>
            </button>
            <div className={styles.headerInfo}>
              <h1>📦 주문 내역</h1>
              <p>나의 모든 주문을 확인하세요</p>
            </div>
          </header>

          <div className={styles.content}>
            <div className={styles.section}>
              <div className={styles.sectionHeader}>
                <h2>주문 목록</h2>
                <span className={styles.orderBadge}>{orders.length}건</span>
              </div>
              <div className={styles.orderList}>
                {orders.map((order) => {
                  const itemsText = getOrderItemsText(order)
                  const storeName = order.store_name || '매장 정보 없음'
                  const dateStr = formatOrderDate(order.created_at)
                  const totalPrice = order.total_price || 0

                  return (
                    <div key={order.id} className={styles.orderWrapper}>
                      <div className={styles.orderCard} data-order-id={order.id}>
                        {/* 1. 상태 영역 (상단) */}
                        <div className={styles.statusHeader}>
                          <span className={styles.statusBadge} style={{ color: '#10b981' }}>
                            ✅ 완료
                          </span>
                          <button className={styles.closeBtn} aria-label="닫기">
                            ×
                          </button>
                        </div>
                        {/* 2. 날짜 + 결제수단 정보 영역 */}
                        <div className={styles.dateSection}>
                          <span className={styles.orderDate}>{dateStr}. 결제</span>
                        </div>
                        {/* 3. 상품 요약 영역 (메인 콘텐츠) */}
                        <div className={styles.mainSection}>
                          <div className={styles.thumbnail}>
                          </div>
                          <div className={styles.orderInfo}>
                            <h3 className={styles.orderTitle}>{itemsText}</h3>
                            <p className={styles.orderPrice}>{totalPrice.toLocaleString()}원</p>
                            <a
                              href="#"
                              className={styles.detailLink}
                              onClick={(e) => {
                                e.preventDefault()
                                alert('주문 상세 페이지는 준비중입니다.')
                              }}
                            >
                              주문상세 &gt;
                            </a>
                          </div>
                        </div>

                        {/* 4. 매장명 및 문의 영역 */}
                        <div className={styles.storeSection}>
                          <a
                            href="#"
                            className={styles.storeLink}
                            onClick={(e) => e.preventDefault()}
                          >
                            {storeName} 문의 &gt;
                          </a>
                        </div>

                        {/* 5. 버튼 영역 (하단 CTA) */}
                        <div className={styles.actionsFooter}>
                          {order.has_review ? (
                            <span className={styles.reviewCompleted}>✅ 리뷰작성완료</span>
                          ) : (
                            <button
                              className={styles.reviewBtn}
                              onClick={() => handleReviewWrite(order)}
                            >
                              리뷰 작성
                            </button>
                          )}
                          <button
                            className={styles.outlineBtn}
                            onClick={() => handleReorder(order.id)}
                          >
                            재주문
                          </button>
                        </div>
                      </div>

                      {/* 6. 리뷰 내용 영역 (리뷰 작성된 경우만) - orderCard와 형제 요소 */}
                      {order.has_review && order.review_content && (
                        <div className={styles.reviewSection}>
                          <div className={styles.reviewHeader}>
                            <span className={styles.reviewStars}>
                              {'★'.repeat(order.review_rating || 0)}
                              {'☆'.repeat(5 - (order.review_rating || 0))}
                            </span>
                            <span className={styles.reviewDate}>
                              {order.review_created_at 
                                ? new Date(order.review_created_at).toLocaleDateString('ko-KR')
                                : ''}
                            </span>
                          </div>
                          <p className={styles.reviewContent}>{order.review_content}</p>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
