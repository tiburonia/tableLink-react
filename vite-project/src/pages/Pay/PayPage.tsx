import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { payController } from './controllers/payController'
import { payService, type PaymentInfo } from './services/payService'
import './PayPage.css'

export const PayPage = () => {
  const navigate = useNavigate()
  const location = useLocation()
  
  const [paymentInfo, setPaymentInfo] = useState<PaymentInfo | null>(null)
  const [selectedMethod, setSelectedMethod] = useState('kakaopay')
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState(false)

  // 결제 정보 로드
  useEffect(() => {
    loadPaymentData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const loadPaymentData = async () => {
    try {
      setLoading(true)

      // location.state에서 주문 데이터 가져오기
      const orderData = location.state as {
        storeId: string
        userPk: number
        storeName: string
        tableNumber: number
        items: Array<{
          id: string
          name: string
          price: number
          quantity: number
          image?: string
        }>
      } | null

      if (!orderData) {
        // state가 없으면 세션에서 가져오기 시도
        const sessionData = payService.getPaymentSession()
        if (sessionData) {
          setPaymentInfo(sessionData)
        } else {
          alert('주문 정보를 찾을 수 없습니다.')
          navigate('/main')
        }
        return
      }

      // 결제 정보 로드
      const info = await payController.loadPaymentInfo({
        ...orderData,
        userPk: orderData.userPk
      })
      setPaymentInfo(info)
    } catch (error) {
      console.error('결제 정보 로드 실패:', error)
      alert('결제 정보를 불러오는데 실패했습니다.')
      navigate(-1)
    } finally {
      setLoading(false)
    }
  }

  const handlePayment = async () => {
    if (!paymentInfo) return

    try {
      setProcessing(true)
      await payController.proceedPayment(selectedMethod, paymentInfo)
    } catch (error) {
      console.error('결제 실패:', error)
      setProcessing(false)
    }
  }

  const paymentMethods = payService.getAvailablePaymentMethods()

  if (loading) {
    return (
      <div className="pay-page-loading">
        <div className="loading-spinner"></div>
        <p>결제 정보를 불러오는 중...</p>
      </div>
    )
  }

  if (!paymentInfo) {
    return null
  }

  const formattedInfo = payController.formatPaymentInfo(paymentInfo)

  return (

    <div className="mobile-app">
      <div className="mobile-content">
      {/* 헤더 */}
      <header className="pay-header">
        <button className="back-button" onClick={() => navigate(-1)}>
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
                  {payService.formatAmount(item.price * item.quantity)}원
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
                onClick={() => method.available && setSelectedMethod(method.id)}
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
