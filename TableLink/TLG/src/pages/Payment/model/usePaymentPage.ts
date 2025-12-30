/**
 * usePaymentPage - 결제 결과 페이지 상태 관리
 * 
 * FSD 원칙: 유저 행동 "결제 결과 확인/페이지 이동"의 상태와 로직을 관리
 */

import { useState, useEffect, useCallback } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { paymentController } from '@/features/payment/model/paymentController'

type PaymentStatus = 'loading' | 'success' | 'failed'

export function usePaymentPage() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const [status, setStatus] = useState<PaymentStatus>('loading')
  const [message, setMessage] = useState('')

  const handlePayment = useCallback(async () => {
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
  }, [searchParams, navigate])

  useEffect(() => {
    handlePayment()
  }, [handlePayment])

  return {
    status,
    message,
  }
}
