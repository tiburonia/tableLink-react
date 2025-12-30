/**
 * OrderHistory - 주문 내역 페이지
 * 
 * FSD 원칙: 페이지는 조립만 한다
 * - useState ❌
 * - useEffect ❌
 * - API 호출 ❌
 */

import { useOrderHistory } from '@/features/order-history'

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
      <div className="order-history-container">
        <header className="order-header">
          <button className="header-back-btn" onClick={handleBack}>
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
          <div className="header-info">
            <h1>📦 주문 내역</h1>
            <p>나의 모든 주문을 확인하세요</p>
          </div>
        </header>
        <div className="order-content">
          <div className="loading-state">주문 내역을 불러오는 중...</div>
        </div>
      </div>
    )
  }

  if (error || orders.length === 0 && !loading) {
    return (
      <div className="order-history-container">
        <header className="order-header">
          <button className="header-back-btn" onClick={handleBack}>
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
          <div className="header-info">
            <h1>📦 주문 내역</h1>
          </div>
        </header>
        <div className="empty-state" style={{ paddingTop: '100px' }}>
          <div className="empty-icon">⚠️</div>
          <h3>주문 내역을 불러올 수 없어요</h3>
          <p>{error || '잠시 후 다시 시도해주세요'}</p>
          <button className="primary-btn" onClick={refetch}>
            <span>🔄</span>
            다시 시도
          </button>
        </div>
      </div>
    )
  }

  if (orders.length === 0) {
    return (
      <div className="order-history-container">
        <header className="order-header">
          <button className="header-back-btn" onClick={handleBack}>
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
          <div className="header-info">
            <h1>📦 주문 내역</h1>
            <p>나의 모든 주문을 확인하세요</p>
          </div>
        </header>
        <div className="empty-state">
          <div className="empty-icon">🍽️</div>
          <h3>아직 주문 내역이 없어요</h3>
          <p>첫 주문을 해보세요!</p>
          <button className="primary-btn" onClick={goToMap}>
            <span>🗺️</span>
            매장 찾기
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="order-history-container">
      <header className="order-header">
        <button className="header-back-btn" onClick={handleBack}>
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
        <div className="header-info">
          <h1>📦 주문 내역</h1>
          <p>나의 모든 주문을 확인하세요</p>
        </div>
      </header>

      <div className="order-content">
        <div className="order-section">
          <div className="section-header">
            <h2>주문 목록</h2>
            <span className="order-badge">{orders.length}건</span>
          </div>
          <div className="order-list">
            {orders.map((order) => {
              const itemsText = getOrderItemsText(order)
              const storeName = order.store_name || order.order_data?.store || '매장 정보 없음'
              const dateStr = formatOrderDate(order.order_date)
              const finalAmount = order.final_amount || order.total_amount || 0

              return (
                <div key={order.id} className="naver-order-card" data-order-id={order.id}>
                  {/* 1. 상태 영역 (상단) */}
                  <div className="order-status-header">
                    <span className="order-status-badge" style={{ color: '#10b981' }}>
                      ✅ 완료
                    </span>
                    <button className="close-btn" aria-label="닫기">
                      ×
                    </button>
                  </div>

                  {/* 2. 날짜 + 결제수단 정보 영역 */}
                  <div className="order-date-section">
                    <span className="order-date">{dateStr}. 결제</span>
                  </div>

                  {/* 3. 상품 요약 영역 (메인 콘텐츠) */}
                  <div className="order-main-section">
                    <div className="order-thumbnail">
                   
                    </div>
                    <div className="order-info">
                      <h3 className="order-title">{itemsText}</h3>
                      <p className="order-price">{finalAmount.toLocaleString()}원</p>
                      <a
                        href="#"
                        className="order-detail-link"
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
                  <div className="order-store-section">
                    <a
                      href="#"
                      className="store-inquiry-link"
                      onClick={(e) => e.preventDefault()}
                    >
                      {storeName} 문의 &gt;
                    </a>
                  </div>

                  {/* 5. 버튼 영역 (하단 CTA) */}
                  <div className="order-actions-footer">
                    {order.hasReview ? (
                      <span className="review-completed-badge">✅ 리뷰작성완료</span>
                    ) : (
                      <button
                        className="naver-review-btn"
                        onClick={() => handleReviewWrite(order)}
                      >
                        리뷰 작성
                      </button>
                    )}
                    <button
                      className="action-btn-outline"
                      onClick={() => handleReorder(order.id)}
                    >
                      재주문
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
