/**
 * Payment Service - 결제 관련 비즈니스 로직
 * FSD: features/payment/model
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
  id: string | number
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
    userPk?: number
    storeId: string
    tableNumber: number
    items: CartItem[]
    totalAmount: number
  }) {
    try {
      console.log('📋 서버에 결제 준비 요청:', data)

      // 사용자 정보 가져오기 (data.userPk 우선, 없으면 localStorage에서)
      const userInfo = this.getUserInfo()
      const userPK = data.userPk || userInfo?.id || null

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

      const requestBody = {
        storeId: data.storeId,
        tableNumber: data.tableNumber,
        userPK: userPK,
        orderData,
        amount: data.totalAmount
      }

      console.log('📤 서버 요청 데이터:', requestBody)

      // 서버 prepare API 호출
      const response = await fetch('/api/toss/prepare', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody)
      })

      console.log('📥 서버 응답 상태:', response.status, response.statusText)

      if (!response.ok) {
        const error = await response.json()
        console.error('❌ 서버 에러 응답:', error)
        throw new Error(error.error || '결제 준비 실패')
      }

      const result = await response.json()
      console.log('✅ 서버 결제 준비 완료:', result)

      if (!result.orderId) {
        throw new Error('서버에서 orderId를 받지 못했습니다')
      }

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
    userPk?: number
    storeId: string
    tableNumber: number
    items: CartItem[]
    totalAmount: number
  }) {
    try {
      // 1. 서버에 prepare 요청하여 orderId 받기
      const orderId = await this.preparePayment({
        userPk: data.userPk,
        storeId: data.storeId,
        tableNumber: data.tableNumber,
        items: data.items,
        totalAmount: data.totalAmount
      })

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
          userPk: data.userPk,
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
      // 세션에서 pendingOrder 가져오기
      const pendingOrderStr = sessionStorage.getItem('pendingOrder')
      const pendingOrder = pendingOrderStr ? JSON.parse(pendingOrderStr) : null
      const userPk = pendingOrder?.userPk || null

      console.log('📦 세션 pendingOrder:', pendingOrder)
      console.log('👤 userPk:', userPk)

      const response = await fetch('/api/toss/confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          paymentKey,
          orderId,
          amount,
          userPk,
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
