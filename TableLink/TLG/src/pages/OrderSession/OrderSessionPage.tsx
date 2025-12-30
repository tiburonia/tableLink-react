/**
 * 주문 세션 페이지
 */

import { useParams, useNavigate } from 'react-router-dom'
import {
  useOrderSession,
  SessionHeader,
  OrderSummary,
  TicketsGrid,
  PaymentsList,
} from '@/features/order-session'
import { BottomNavigation } from '@/widgets/Layout'
import styles from './OrderSessionPage.module.css'

export const OrderSessionPage = () => {
  const { orderId } = useParams<{ orderId: string }>()
  const navigate = useNavigate()
  const { data, loading, error, refresh, endSession } = useOrderSession(Number(orderId))

  const handleBack = () => {
    navigate(-1)
  }

  const handleEndSession = async () => {
    if (!window.confirm('🔚 식사를 종료하시겠습니까?\n세션을 종료하면 더 이상 이 화면에 접근할 수 없습니다.')) {
      return
    }

    const success = await endSession()
    if (success) {
      alert('✅ 식사가 종료되었습니다')
    } else {
      alert('❌ 세션 종료에 실패했습니다')
    }
  }

  const handleAddOrder = () => {
    if (data) {
      navigate(`/p/${data.storeId}?table=${data.tableNumber}`)
    }
  }

  if (loading) {
    return (
      <div className="mobile-app">
        <div className="mobile-content">
          <div className={styles.sessionPage}>
            <div className={styles.loadingContainer}>
              <div className={styles.loadingSpinner}></div>
              <p className={styles.loadingText}>주문 정보를 불러오는 중...</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="mobile-app">
        <div className="mobile-content">
          <div className={styles.sessionPage}>
            <div className={styles.errorContainer}>
              <div className={styles.errorIcon}>❌</div>
              <p className={styles.errorMessage}>{error}</p>
              <button onClick={refresh} className={styles.retryBtn}>
                다시 시도
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!data) {
    return null
  }

  // 세션 종료 상태
  if (data.session_status === 'CLOSED') {
    return (
      <div className="mobile-app">
        <div className="mobile-content">
          <div className={styles.sessionPage}>
            <SessionHeader
              storeName={data.storeName}
              tableNumber={data.tableNumber}
              createdAt={data.createdAt}
              onBack={handleBack}
              onEndSession={() => {}}
            />

            <div className={styles.sessionEnded}>
              <div className={styles.endedIcon}>🎉</div>
              <h2 className={styles.endedTitle}>식사를 완료하셨습니다!</h2>
              <p className={styles.endedText}>즐거운 시간이 되셨길 바랍니다.</p>

              <div className={styles.endedActions}>
                <button onClick={() => navigate('/mypage')} className={styles.primaryBtn}>
                  마이페이지로
                </button>
                <button onClick={() => navigate('/map')} className={styles.secondaryBtn}>
                  다른 매장 찾기
                </button>
              </div>
            </div>
          </div>
        </div>
        <BottomNavigation />
      </div>
    )
  }

  // POS와 TLL 주문 분리
  const tllTickets = data.tickets.filter((ticket) => ticket.source === 'TLL')
  const posTickets = data.tickets.filter((ticket) => ticket.source === 'POS')

  return (
    <div className="mobile-app">
      <div className="mobile-content">
        <div className={styles.sessionPage}>
          <SessionHeader
            storeName={data.storeName}
            tableNumber={data.tableNumber}
            createdAt={data.createdAt}
            onBack={handleBack}
            onEndSession={handleEndSession}
          />

          <div className={styles.content}>
            <OrderSummary
              status={data.session_status}
              totalOrders={data.totalOrders}
              totalAmount={data.totalAmount}
              createdAt={data.createdAt}
            />

            <TicketsGrid tickets={tllTickets} type="TLL" title="온라인 주문 (TLL)" />

            {posTickets.length > 0 && (
              <TicketsGrid tickets={posTickets} type="POS" title="매장 주문 (POS)" />
            )}

            <PaymentsList payments={data.payments} totalAmount={data.totalAmount} />

            <div className={styles.addOrderSection}>
              <button onClick={handleAddOrder} className={styles.addOrderBtn}>
                ➕ 추가 주문하기
              </button>
            </div>
          </div>
        </div>
      </div>
      <BottomNavigation />
    </div>
  )
}
