/**
 * PaymentPage - 결제 결과 페이지
 * 
 * FSD 원칙: 페이지는 조립만 한다
 * - useState ❌
 * - useEffect ❌
 * - API 호출 ❌
 */

import { usePaymentPage } from '@/features/payment'
import styles from './PaymentPage.module.css'

export const PaymentPage = () => {
  // Hook에서 모든 상태와 로직을 가져옴
  const { status, message } = usePaymentPage()

  return (
    <div className="payment-page">
      <div className="payment-result">
        {status === 'loading' && (
          <>
            <div className="loading-spinner" />
            <h2>결제 처리 중...</h2>
            <p>잠시만 기다려주세요</p>
          </>
        )}
        
        {status === 'success' && (
          <>
            <div className="success-icon">✅</div>
            <h2>결제 완료</h2>
            <p>{message}</p>
          </>
        )}
        
        {status === 'failed' && (
          <>
            <div className="error-icon">❌</div>
            <h2>결제 실패</h2>
            <p>{message}</p>
          </>
        )}
      </div>
    </div>
  )
}
