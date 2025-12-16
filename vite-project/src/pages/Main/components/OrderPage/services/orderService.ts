/**
 * Order Service - 주문 관련 비즈니스 로직
 */

import { storeService } from '@/shared/api'

export interface MenuItem {
  id: string
  name: string
  price: number
  category?: string
  description?: string
  image?: string
}

export interface CartItem extends MenuItem {
  quantity: number
}

export const orderService = {
  /**
   * 매장 정보 조회
   */
  async getStoreInfo(storeId: string) {
    try {
      const result = await storeService.getStoreById(storeId)
      if (result.success && result.store) {
        return result.store
      }
      return null
    } catch (error) {
      console.error('❌ 매장 정보 조회 실패:', error)
      return null
    }
  },

  /**
   * 메뉴 목록 조회
   */
  async getMenuList(storeId: string): Promise<MenuItem[]> {
    try {
      // 실제 API 호출
      const response = await fetch(`/api/stores/${storeId}/menu`)
      if (response.ok) {
        const data = await response.json()
        return data.menu || []
      }
      
      // 임시 더미 데이터
      return this.getDummyMenu()
    } catch (error) {
      console.error('❌ 메뉴 조회 실패:', error)
      return this.getDummyMenu()
    }
  },

  /**
   * 더미 메뉴 데이터
   */
  getDummyMenu(): MenuItem[] {
    return [
      {
        id: '1',
        name: '김치찌개',
        price: 8000,
        category: '찌개류',
        description: '얼큰한 김치찌개',
      },
      {
        id: '2',
        name: '된장찌개',
        price: 7000,
        category: '찌개류',
        description: '구수한 된장찌개',
      },
      {
        id: '3',
        name: '제육볶음',
        price: 9000,
        category: '볶음류',
        description: '매콤한 제육볶음',
      },
      {
        id: '4',
        name: '비빔밥',
        price: 8500,
        category: '밥류',
        description: '건강한 비빔밥',
      },
      {
        id: '5',
        name: '된장국',
        price: 3000,
        category: '국류',
        description: '시원한 된장국',
      },
    ]
  },

  /**
   * 장바구니 계산
   */
  calculateTotal(cartItems: CartItem[]) {
    const subtotal = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0)
    const tax = Math.floor(subtotal * 0.1)
    const total = subtotal + tax

    return { subtotal, tax, total }
  },

  /**
   * 주문 생성
   */
  async createOrder(storeId: string, tableNumber: number, cartItems: CartItem[]) {
    try {
      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          storeId,
          tableNumber,
          items: cartItems.map(item => ({
            menuId: item.id,
            name: item.name,
            price: item.price,
            quantity: item.quantity,
          })),
        }),
      })

      if (response.ok) {
        const data = await response.json()
        return { success: true, orderId: data.orderId }
      }

      return { success: false, error: '주문 생성 실패' }
    } catch (error) {
      console.error('❌ 주문 생성 실패:', error)
      return { success: false, error: '주문 생성 중 오류 발생' }
    }
  },
}
