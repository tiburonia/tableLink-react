/**
 * Toss Payment Service - 토스 페이먼츠 통합
 */

import { loadTossPayments } from '@tosspayments/payment-sdk'

let cachedClientKey: string | null = null

export interface TossPaymentData {
  orderId: string
  amount: number
  orderName: string
  customerName: string
  customerEmail?: string
  successUrl: string
  failUrl: string
}

export const tossPaymentService = {
  /**
   * 서버에서 클라이언트 키 가져오기
   */
  async fetchClientKey(): Promise<string> {
    if (cachedClientKey) {
      return cachedClientKey as string
    }

    try {
      const response = await fetch('/api/toss/client-key', {
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        }
      })

      if (!response.ok) {
        throw new Error('클라이언트 키 조회 실패')
      }

      const data = await response.json()
      cachedClientKey = data.clientKey
      console.log('🔑 토스 클라이언트 키 로드 완료')
      return cachedClientKey as string
    } catch (error) {
      console.error('❌ 클라이언트 키 조회 실패:', error)
      // 폴백으로 하드코딩된 테스트 키 사용
      cachedClientKey = 'test_ck_XZYkKL4MrjOZ7aZv4w0W80zJwlEW'
      return cachedClientKey as string
    }
  },
  /**
   * 토스 페이먼츠 위젯 초기화 및 결제 실행
   */
  async executePayment(paymentData: TossPaymentData) {
    try {
      console.log('💳 토스 페이먼츠 결제 시작:', paymentData)

      // 클라이언트 키 가져오기
      const clientKey = await this.fetchClientKey()

      // 토스 페이먼츠 SDK 로드
      const tossPayments = await loadTossPayments(clientKey)

      // 결제 요청
      await tossPayments.requestPayment('카드', {
        amount: paymentData.amount,
        orderId: paymentData.orderId,
        orderName: paymentData.orderName,
        customerName: paymentData.customerName,
        customerEmail: paymentData.customerEmail,
        successUrl: paymentData.successUrl,
        failUrl: paymentData.failUrl,
      })

      return { success: true }
    } catch (error) {
      console.error('❌ 토스 페이먼츠 결제 실패:', error)
      throw error
    }
  },

  /**
   * 결제 승인 처리
   */
  async confirmPayment(paymentKey: string, orderId: string, amount: number) {
    try {
      const response = await fetch('/api/toss/confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          paymentKey,
          orderId,
          amount,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || '결제 승인 실패')
      }

      return await response.json()
    } catch (error) {
      console.error('❌ 결제 승인 실패:', error)
      throw error
    }
  },

  /**
   * 클라이언트 키 가져오기 (외부 호출용)
   */
  async getClientKey() {
    return await this.fetchClientKey()
  },
}
