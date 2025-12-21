/**
 * PayPage - 결제 페이지
 * 
 * FSD 원칙: 페이지는 조립만 한다
 * - useState ❌
 * - useEffect ❌
 * - API 호출 ❌
 */

import { usePayPage } from '@/features/payment'
import styles from './PayPage.module.css'

export const PayPage = () => {
  // Feature Hook에서 모든 상태와 로직을 가져옴
  const {
    paymentInfo,
    selectedMethod,
    loading,
    processing,
    paymentMethods,
    formattedInfo,
    selectMethod,
    handlePayment,
    goBack,
    formatAmount,
  } = usePayPage()

  if (loading) {
    return (
      <div className="pay-page-loading">
        <div className="loading-spinner"></div>
        <p>결제 정보를 불러오는 중...</p>
      </div>
    )
  }

  if (!paymentInfo || !formattedInfo) {
    return null
  }

  return (

    <div className="mobile-app">
      <div className="mobile-content">
      {/* 헤더 */}
      <header className="pay-header">
        <button className="back-button" onClick={goBack}>
          ← 뒤로
        </button>
        <h1 className="pay-title">결제하기</h1>
        <div className="header-spacer"></div>
      </header>

      <div className="pay-content">
        {/* 매장 정보 */}
        <section className="pay-section">
          <h2 className="section-title">📍 매장 정보</h2>
          <div className="info-card">
            <div className="info-row">
              <span className="info-label">매장명</span>
              <span className="info-value">{paymentInfo.storeName}</span>
            </div>
            <div className="info-row">
              <span className="info-label">테이블</span>
              <span className="info-value">{paymentInfo.tableNumber}번</span>
            </div>
          </div>
        </section>

        {/* 주문 내역 */}
        <section className="pay-section">
          <h2 className="section-title">🛒 주문 내역</h2>
          <div className="order-items">
            {paymentInfo.items.map((item) => (
              <div key={item.id} className="order-item">
                <div className="item-info">
                  <span className="item-name">{item.name}</span>
                  <span className="item-quantity">x{item.quantity}</span>
                </div>
                <span className="item-price">
                  {formatAmount(item.price * item.quantity)}원
                </span>
              </div>
            ))}
          </div>
        </section>

        {/* 결제 금액 */}
        <section className="pay-section">
          <h2 className="section-title">💰 결제 금액</h2>
          <div className="amount-card">
            <div className="amount-row">
              <span className="amount-label">주문 금액</span>
              <span className="amount-value">{formattedInfo.formattedAmount}원</span>
            </div>
            <div className="amount-divider"></div>
            <div className="amount-row total">
              <span className="amount-label">총 결제 금액</span>
              <span className="amount-value total-amount">
                {formattedInfo.formattedAmount}원
              </span>
            </div>
          </div>
        </section>

        {/* 결제 방법 */}
        <section className="pay-section">
          <h2 className="section-title">💳 결제 방법</h2>
          <div className="payment-methods">
            {paymentMethods.map((method) => (
              <button
                key={method.id}
                className={`payment-method ${
                  selectedMethod === method.id ? 'selected' : ''
                } ${!method.available ? 'disabled' : ''}`}
                onClick={() => method.available && selectMethod(method.id)}
                disabled={!method.available}
              >
                <span className="method-icon">{method.icon}</span>
                <span className="method-name">{method.name}</span>
                {!method.available && (
                  <span className="method-badge">준비중</span>
                )}
              </button>
            ))}
          </div>
        </section>
      </div>

      {/* 결제 버튼 */}
      <footer className="pay-footer">
        <button
          className="pay-button"
          onClick={handlePayment}
          disabled={processing || !selectedMethod}
        >
          {processing ? (
            <>
              <span className="button-spinner"></span>
              결제 진행 중...
            </>
          ) : (
            <>
              {formattedInfo.formattedAmount}원 결제하기
            </>
          )}
        </button>
      </footer>
    </div>
    </div>
  )
}
