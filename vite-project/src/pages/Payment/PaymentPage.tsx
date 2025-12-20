import { useEffect, useState } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { paymentController } from './controllers/paymentController'
import './PaymentPage.css'

export const PaymentPage = () => {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const [status, setStatus] = useState<'loading' | 'success' | 'failed'>('loading')
  const [message, setMessage] = useState('')

  useEffect(() => {
    const handlePayment = async () => {
      const paymentKey = searchParams.get('paymentKey')
      const orderId = searchParams.get('orderId')
      const amount = searchParams.get('amount')

      // 성공 처리
      if (paymentKey && orderId && amount) {
        try {
          await paymentController.confirmPayment(
            paymentKey,
            orderId,
            parseInt(amount)
          )
          setStatus('success')
          setMessage('결제가 완료되었습니다!')
          
          setTimeout(() => {
            navigate('/main')
          }, 2000)
        } catch {
          setStatus('failed')
          setMessage('결제 승인에 실패했습니다.')
        }
        return
      }

      // 실패 처리
      const code = searchParams.get('code')
      const failMessage = searchParams.get('message')
      
      if (code && failMessage) {
        setStatus('failed')
        setMessage(failMessage)
        
        setTimeout(() => {
          navigate(-1)
        }, 3000)
      }
    }

    handlePayment()
  }, [searchParams, navigate])

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
