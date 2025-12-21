/**
 * Order Service - 주문 관련 비즈니스 로직
 * FSD: features/order-create/model
 */

export interface MenuItem {
  id: number
  store_id: number
  name: string
  description: string
  cook_station: string
  price: number
  image?: string
}

export interface CartItem extends MenuItem {
  quantity: number
}

export interface StoreInfo {
  id: number
  name: string
}

export const orderService = {
  /**
   * 매장 정보 및 메뉴 조회
   */
  async getStoreAndMenu(storeId: number) {
    try {
      const response = await fetch(`/api/stores/${storeId}/menu/tll`)
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      const data = await response.json()
      
      if (data.success && data.store && data.menu) {
        return {
          success: true,
          store: data.store as StoreInfo,
          menu: data.menu as MenuItem[]
        }
      }
      
      // 데이터가 없을 경우 더미 데이터 반환
      return {
        success: false,
        store: { id: storeId, name: '매장' },
        menu: this.getDummyMenu(storeId)
      }
    } catch (error) {
      console.error('❌ 매장 정보 및 메뉴 조회 실패:', error)
      return {
        success: false,
        store: { id: storeId, name: '매장' },
        menu: this.getDummyMenu(storeId)
      }
    }
  },

  /**
   * 매장 정보만 조회
   */
  async getStoreInfo(storeId: number): Promise<StoreInfo | null> {
    try {
      const response = await fetch(`/api/stores/${storeId}/menu/tll`)
      if (response.ok) {
        const data = await response.json()
        if (data.success && data.store) {
          return data.store
        }
      }
      return null
    } catch (error) {
      console.error('❌ 매장 정보 조회 실패:', error)
      return null
    }
  },

  /**
   * 메뉴 목록만 조회
   */
  async getMenuList(storeId: number): Promise<MenuItem[]> {
    try {
      const response = await fetch(`/api/stores/${storeId}/menu/tll`)
      if (response.ok) {
        const data = await response.json()
        if (data.success && data.menu) {
          return data.menu
        }
      }
      
      return this.getDummyMenu(storeId)
    } catch (error) {
      console.error('❌ 메뉴 조회 실패:', error)
      return this.getDummyMenu(storeId)
    }
  },

  /**
   * 더미 메뉴 데이터
   */
  getDummyMenu(storeId: number): MenuItem[] {
    return [
      {
        id: 1,
        store_id: storeId,
        name: '김치찌개',
        description: '얼큰한 김치찌개',
        cook_station: 'KITCHEN',
        price: 8000,
      },
      {
        id: 2,
        store_id: storeId,
        name: '된장찌개',
        description: '구수한 된장찌개',
        cook_station: 'KITCHEN',
        price: 7000,
      },
      {
        id: 3,
        store_id: storeId,
        name: '제육볶음',
        description: '매콤한 제육볶음',
        cook_station: 'KITCHEN',
        price: 9000,
      },
      {
        id: 4,
        store_id: storeId,
        name: '비빔밥',
        description: '건강한 비빔밥',
        cook_station: 'KITCHEN',
        price: 8500,
      },
      {
        id: 5,
        store_id: storeId,
        name: '된장국',
        description: '시원한 된장국',
        cook_station: 'KITCHEN',
        price: 3000,
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
  async createOrder(storeId: number, tableNumber: number, cartItems: CartItem[]) {
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

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      return { success: true, orderId: data.orderId }
    } catch (error) {
      console.error('❌ 주문 생성 실패:', error)
      return { success: false, error: error instanceof Error ? error.message : '주문 생성 중 오류 발생' }
    }
  },
}
