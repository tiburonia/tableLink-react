/**
 * Payment Controller - 결제 컨트롤러
 * FSD: features/payment/model
 */

import { paymentService, type CartItem } from './paymentService'
import { tossPaymentService } from './tossPaymentService'

export class PaymentController {
  /**
   * 결제 초기화
   */
  async initializePayment(orderData: {
    userPk?: number
    storeId: string
    tableNumber: number
    cartItems: CartItem[]
    totalAmount: number
    paymentMethod?: string
  }) {
    try {
      console.log('💳 결제 초기화:', orderData)

      // 결제 데이터 준비
      const paymentData = await paymentService.prepareTossPayment({
        userPk: orderData.userPk,
        storeId: orderData.storeId,
        tableNumber: orderData.tableNumber,
        items: orderData.cartItems,
        totalAmount: orderData.totalAmount,
      })

      // 토스 페이먼츠 결제 실행 (선택된 결제 수단으로)
      await tossPaymentService.executePayment(paymentData, orderData.paymentMethod)

      return { success: true }
    } catch (error) {
      console.error('❌ 결제 초기화 실패:', error)
      throw error
    }
  }

  /**
   * 결제 승인 처리
   */
  async confirmPayment(paymentKey: string, orderId: string, amount: number) {
    try {
      console.log('✅ 결제 승인 처리:', { paymentKey, orderId, amount })

      // 결제 승인 API 호출
      const result = await paymentService.confirmPayment(paymentKey, orderId, amount)

      return result
    } catch (error) {
      console.error('❌ 결제 승인 실패:', error)
      throw error
    }
  }
}

export const paymentController = new PaymentController()
