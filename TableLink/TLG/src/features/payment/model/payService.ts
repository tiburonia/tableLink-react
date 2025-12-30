/**
 * Pay Service - 결제 정보 준비 및 검증 로직
 * FSD: features/payment/model
 */

// 간소화된 장바구니 아이템 타입
export interface PayCartItem {
  id: string | number
  name: string
  price: number
  quantity: number
  image?: string
  store_id?: number
  description?: string
  cook_station?: string
}

export interface PaymentInfo {
  userPk?: number
  storeId: string
  storeName: string
  tableNumber: number
  items: PayCartItem[]
  totalAmount: number
  orderId: string
}

export interface PaymentMethod {
  id: string
  name: string
  icon: string
  available: boolean
}

export const payService = {
  /**
   * 결제 정보 준비
   */
  preparePaymentInfo(data: {
    userPk: number
    storeId: string
    storeName: string
    tableNumber: number
    items: PayCartItem[]
  }): PaymentInfo {
    try {
      // 주문 금액 계산
      const totalAmount = data.items.reduce(
        (sum, item) => sum + item.price * item.quantity,
        0
      )

      // 주문 ID 생성
      const orderId = `ORD${Date.now()}`

      return {
        userPk: data.userPk,
        storeId: data.storeId,
        storeName: data.storeName,
        tableNumber: data.tableNumber,
        items: data.items,
        totalAmount,
        orderId,
      }
    } catch (error) {
      console.error('❌ 결제 정보 준비 실패:', error)
      throw error
    }
  },

  /**
   * 결제 데이터 검증
   */
  validatePaymentData(paymentInfo: PaymentInfo): boolean {
    if (!paymentInfo.storeId) {
      alert('매장 정보가 올바르지 않습니다.')
      return false
    }

    if (!paymentInfo.tableNumber) {
      alert('테이블 정보가 올바르지 않습니다.')
      return false
    }

    if (!paymentInfo.items || paymentInfo.items.length === 0) {
      alert('주문 항목이 없습니다.')
      return false
    }

    if (paymentInfo.totalAmount <= 0) {
      alert('결제 금액이 올바르지 않습니다.')
      return false
    }

    return true
  },

  /**
   * 사용 가능한 결제 방법 목록
   */
  getAvailablePaymentMethods(): PaymentMethod[] {
    return [
      // 간편결제
      {
        id: 'card',
        name: '신용/체크카드',
        icon: '💳',
        available: true,
      },
      {
        id: 'transfer',
        name: '계좌이체',
        icon: '🏦',
        available: true,
      },
      {
        id: 'virtualaccount',
        name: '가상계좌',
        icon: '🏧',
        available: true,
      },
      
      // 간편결제 서비스
      {
        id: 'kakaopay',
        name: '카카오페이',
        icon: '💬',
        available: true,
      },
      
      
      // 기타
      {
        id: 'cash',
        name: '현장결제',
        icon: '💵',
        available: false, // 향후 지원 예정
      },
    ]
  },

  /**
   * 세션에 결제 정보 저장
   */
  savePaymentSession(paymentInfo: PaymentInfo) {
    try {
      sessionStorage.setItem('pendingPayment', JSON.stringify(paymentInfo))
    } catch (error) {
      console.error('❌ 결제 정보 세션 저장 실패:', error)
    }
  },

  /**
   * 세션에서 결제 정보 가져오기
   */
  getPaymentSession(): PaymentInfo | null {
    try {
      const data = sessionStorage.getItem('pendingPayment')
      if (data) {
        return JSON.parse(data)
      }
      return null
    } catch (error) {
      console.error('❌ 결제 정보 세션 조회 실패:', error)
      return null
    }
  },

  /**
   * 결제 세션 정리
   */
  clearPaymentSession() {
    try {
      sessionStorage.removeItem('pendingPayment')
    } catch (error) {
      console.error('❌ 결제 세션 정리 실패:', error)
    }
  },

  /**
   * 금액 포맷팅
   */
  formatAmount(amount: number): string {
    return amount.toLocaleString('ko-KR')
  },
}
