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
  async executePayment(paymentData: TossPaymentData, paymentMethod?: string) {
    try {
      console.log('💳 토스 페이먼츠 결제 시작:', paymentData)
      console.log('💳 원본 결제 수단:', paymentMethod)

      // 필수 데이터 검증
      if (!paymentData.orderId || !paymentData.amount || !paymentData.orderName) {
        throw new Error('필수 결제 정보가 누락되었습니다')
      }

      if (paymentData.amount <= 0) {
        throw new Error('결제 금액이 올바르지 않습니다')
      }

      // 클라이언트 키 가져오기
      const clientKey = await this.fetchClientKey()

      // 토스 페이먼츠 SDK 로드
      const tossPayments = await loadTossPayments(clientKey)

      // 결제 수단 매핑 (한글 → 토스 결제 수단 코드)
      const paymentMethodMap: { [key: string]: string } = {
        // 기본 결제 수단
        '카드': '카드',
        '계좌이체': '계좌이체',
        '가상계좌': '가상계좌',
        '휴대폰': '휴대폰',
        // 간편결제
        '카카오페이': '카카오페이',
        '토스페이': '토스페이',
        '네이버페이': '네이버페이',
        '페이코': '페이코',
        'SSG페이': 'SSG페이',
        '엘페이': '엘페이',
        // 상품권
        '문화상품권': '문화상품권',
        '도서문화상품권': '도서문화상품권',
        '게임문화상품권': '게임문화상품권',
      }

      const method = paymentMethodMap[paymentMethod || ''] || '카드'
      console.log('📱 선택된 결제 수단:', method, '(원본:', paymentMethod, ')')

      // 결제 요청 데이터 준비
      const requestData = {
        amount: paymentData.amount,
        orderId: paymentData.orderId,
        orderName: paymentData.orderName,
        customerName: paymentData.customerName,
        successUrl: paymentData.successUrl,
        failUrl: paymentData.failUrl,
      }

      console.log('📤 결제 요청 데이터:', requestData)

      // 결제 요청
      await tossPayments.requestPayment(method, requestData)

      return { success: true }
    } catch (error) {
      console.error('❌ 토스 페이먼츠 결제 실패:', error)
      console.error('에러 상세:', {
        message: error instanceof Error ? error.message : '알 수 없는 오류',
        paymentData,
        paymentMethod
      })
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
