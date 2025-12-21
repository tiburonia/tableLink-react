/**
 * usePayPage - 결제 페이지 상태 및 로직 관리
 * 
 * FSD 원칙: 유저 행동 "결제 정보 확인/결제 방법 선택/결제하기"의 상태와 로직을 관리
 */

import { useState, useEffect, useCallback } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { payController } from './payController'
import { payService, type PaymentInfo } from './payService'

interface OrderState {
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
}

export function usePayPage() {
  const navigate = useNavigate()
  const location = useLocation()
  
  const [paymentInfo, setPaymentInfo] = useState<PaymentInfo | null>(null)
  const [selectedMethod, setSelectedMethod] = useState('kakaopay')
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState(false)

  // 결제 정보 로드
  const loadPaymentData = useCallback(async () => {
    try {
      setLoading(true)

      const orderData = location.state as OrderState | null

      if (!orderData) {
        const sessionData = payService.getPaymentSession()
        if (sessionData) {
          setPaymentInfo(sessionData)
        } else {
          alert('주문 정보를 찾을 수 없습니다.')
          navigate('/main')
        }
        return
      }

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
  }, [location.state, navigate])

  useEffect(() => {
    loadPaymentData()
  }, [loadPaymentData])

  // 결제 방법 선택
  const selectMethod = useCallback((methodId: string) => {
    setSelectedMethod(methodId)
  }, [])

  // 결제 진행
  const handlePayment = useCallback(async () => {
    if (!paymentInfo) return

    try {
      setProcessing(true)
      await payController.proceedPayment(selectedMethod, paymentInfo)
    } catch (error) {
      console.error('결제 실패:', error)
      setProcessing(false)
    }
  }, [paymentInfo, selectedMethod])

  // 뒤로 가기
  const goBack = useCallback(() => {
    navigate(-1)
  }, [navigate])

  // 사용 가능한 결제 방법
  const paymentMethods = payService.getAvailablePaymentMethods()

  // 포맷된 결제 정보
  const formattedInfo = paymentInfo ? payController.formatPaymentInfo(paymentInfo) : null

  return {
    // 상태
    paymentInfo,
    selectedMethod,
    loading,
    processing,
    paymentMethods,
    formattedInfo,
    // 액션
    selectMethod,
    handlePayment,
    goBack,
    formatAmount: payService.formatAmount,
  }
}
