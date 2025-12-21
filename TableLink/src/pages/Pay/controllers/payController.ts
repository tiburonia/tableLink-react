/**
 * Pay Controller - 결제 페이지 UI 제어 로직
 */

import { payService, type PaymentInfo } from '../services/payService'
import { paymentController } from '@/pages/Payment/controllers/paymentController'

export const payController = {
  /**
   * 결제 정보 로드 및 검증
   */
  async loadPaymentInfo(data: {
    userPk: number
    storeId: string
    storeName: string
    tableNumber: number
    items: Array<{
      id: string
      name: string
      price: number
      quantity: number
      image?: string
    }>
  }): Promise<PaymentInfo> {
    try {
      console.log('📋 결제 정보 로드:', data)

      // 결제 정보 준비
      const paymentInfo = payService.preparePaymentInfo(data)

      // 검증
      if (!payService.validatePaymentData(paymentInfo)) {
        throw new Error('결제 정보가 올바르지 않습니다.')
      }

      // 세션에 저장
      payService.savePaymentSession(paymentInfo)

      return paymentInfo
    } catch (error) {
      console.error('❌ 결제 정보 로드 실패:', error)
      throw error
    }
  },

  /**
   * 결제 진행
   */
  async proceedPayment(paymentMethod: string, paymentInfo: PaymentInfo) {
    try {
      console.log('💳 결제 진행:', { paymentMethod, paymentInfo })

      // 결제 수단별 처리
      if (paymentMethod === 'cash') {
        alert('현장결제는 아직 준비 중입니다.')
        return
      }

      // 모든 온라인 결제는 토스페이먼츠를 통해 처리
      await this.processTossPayment(paymentInfo, paymentMethod)
    } catch (error) {
      console.error('❌ 결제 진행 실패:', error)
      alert('결제 진행 중 오류가 발생했습니다.')
      throw error
    }
  },

  /**
   * 토스페이먼츠 결제 처리
   */
  async processTossPayment(paymentInfo: PaymentInfo, paymentMethod: string) {
    try {
      // 결제 수단별 토스페이먼츠 결제 타입 매핑
      const paymentMethodMap: { [key: string]: string } = {
        // 기본 결제 수단
        'card': '카드',
        'transfer': '계좌이체',
        'virtualaccount': '가상계좌',
        // 간편결제
        'kakaopay': '카카오페이'
        
        
      }

      const tossMethod = paymentMethodMap[paymentMethod] || '카드'
      console.log('💳 선택된 결제 수단:', tossMethod)

      // 주문 데이터 준비
      const orderData = {
        userPk: paymentInfo.userPk,
        storeId: paymentInfo.storeId,
        tableNumber: paymentInfo.tableNumber,
        cartItems: paymentInfo.items,
        totalAmount: paymentInfo.totalAmount,
        paymentMethod: tossMethod,
      }

      // paymentController를 사용하여 토스페이먼츠 SDK 실행
      await paymentController.initializePayment(orderData)
    } catch (error) {
      console.error('❌ 토스페이먼츠 결제 실패:', error)
      throw error
    }
  },

  /**
   * 결제 정보 포맷팅
   */
  formatPaymentInfo(paymentInfo: PaymentInfo) {
    return {
      ...paymentInfo,
      formattedAmount: payService.formatAmount(paymentInfo.totalAmount),
      orderName: `${paymentInfo.items[0]?.name} 외 ${paymentInfo.items.length - 1}건`,
    }
  },
}
