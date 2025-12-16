/**
 * Payment Service - 결제 관련 비즈니스 로직
 */

export interface PaymentData {
  orderId: string
  amount: number
  orderName: string
  customerName: string
  customerEmail?: string
  successUrl: string
  failUrl: string
}

export interface CartItem {
  id: string
  name: string
  price: number
  quantity: number
  image?: string
}

export const paymentService = {
  /**
   * 서버에 결제 준비 요청 (TLL 방식)
   */
  async preparePayment(data: {
    storeId: string
    tableNumber: number
    items: CartItem[]
    totalAmount: number
  }) {
    try {
      console.log('📋 서버에 결제 준비 요청:', data)

      // 사용자 정보 가져오기
      const userInfo = this.getUserInfo()

      // 주문 데이터 구성
      const orderData = {
        storeName: data.items[0]?.name || '매장',
        items: data.items.map(item => ({
          menuId: item.id,
          name: item.name,
          price: item.price,
          quantity: item.quantity,
          cook_station: 'KITCHEN'
        }))
      }

      // 서버 prepare API 호출
      const response = await fetch('/api/toss/prepare', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          storeId: data.storeId,
          tableNumber: data.tableNumber,
          userPK: userInfo?.id || null,
          orderData,
          amount: data.totalAmount
        })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || '결제 준비 실패')
      }

      const result = await response.json()
      console.log('✅ 서버 결제 준비 완료:', result)

      return result.orderId
    } catch (error) {
      console.error('❌ 결제 준비 실패:', error)
      throw error
    }
  },

  /**
   * 토스 페이먼츠 결제 데이터 구성
   */
  async prepareTossPayment(data: {
    storeId: string
    tableNumber: number
    items: CartItem[]
    totalAmount: number
  }) {
    try {
      // 1. 서버에 prepare 요청하여 orderId 받기
      const orderId = await this.preparePayment(data)

      // 2. 주문명 생성
      const orderName = data.items.length > 0
        ? `${data.items[0].name} 외 ${data.items.length - 1}건`
        : '주문'

      // 3. 사용자 정보 가져오기
      const userInfo = this.getUserInfo()

      const paymentData: PaymentData = {
        orderId,
        amount: data.totalAmount,
        orderName,
        customerName: userInfo?.name || '고객',
        customerEmail: userInfo?.email,
        successUrl: `${window.location.origin}/payment/success`,
        failUrl: `${window.location.origin}/payment/fail`,
      }

      // 4. 세션에 임시 저장 (백업용)
      sessionStorage.setItem(
        'pendingOrder',
        JSON.stringify({
          orderId,
          storeId: data.storeId,
          tableNumber: data.tableNumber,
          items: data.items,
          totalAmount: data.totalAmount,
        })
      )

      return paymentData
    } catch (error) {
      console.error('❌ 결제 준비 실패:', error)
      throw error
    }
  },

  /**
   * 결제 승인
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

      const result = await response.json()
      
      // 세션 정리
      sessionStorage.removeItem('pendingOrder')
      
      return result
    } catch (error) {
      console.error('❌ 결제 승인 실패:', error)
      throw error
    }
  },

  /**
   * 사용자 정보 가져오기
   */
  getUserInfo() {
    try {
      const userInfoStr = localStorage.getItem('userInfo')
      if (userInfoStr) {
        return JSON.parse(userInfoStr)
      }
      return null
    } catch (error) {
      console.error('사용자 정보 조회 실패:', error)
      return null
    }
  },

  /**
   * 주문 생성
   */
  async createOrder(orderData: {
    storeId: string
    tableNumber: number
    items: CartItem[]
    paymentMethod: string
    tossOrderId?: string
  }) {
    try {
      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderData),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || '주문 생성 실패')
      }

      return await response.json()
    } catch (error) {
      console.error('❌ 주문 생성 실패:', error)
      throw error
    }
  },
}
