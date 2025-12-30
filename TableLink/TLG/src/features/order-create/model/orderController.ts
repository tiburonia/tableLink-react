/**
 * Order Controller - 주문 화면 컨트롤러
 * FSD: features/order-create/model
 */

import { orderService, type CartItem, type MenuItem } from './orderService'

export class OrderController {
  private cartItems: CartItem[] = []
  private selectedCategory: string = 'all'

  /**
   * 장바구니에 메뉴 추가
   */
  addToCart(menu: MenuItem, onUpdate: (cart: CartItem[]) => void) {
    const existingItem = this.cartItems.find(item => item.id === menu.id)
    
    if (existingItem) {
      existingItem.quantity += 1
    } else {
      this.cartItems.push({ ...menu, quantity: 1 })
    }
    
    onUpdate([...this.cartItems])
  }

  /**
   * 장바구니 수량 업데이트
   */
  updateQuantity(menuId: number, change: number, onUpdate: (cart: CartItem[]) => void) {
    const item = this.cartItems.find(item => item.id === menuId)
    
    if (item) {
      item.quantity += change
      
      if (item.quantity <= 0) {
        this.removeFromCart(menuId, onUpdate)
      } else {
        onUpdate([...this.cartItems])
      }
    }
  }

  /**
   * 장바구니에서 제거
   */
  removeFromCart(menuId: number, onUpdate: (cart: CartItem[]) => void) {
    this.cartItems = this.cartItems.filter(item => item.id !== menuId)
    onUpdate([...this.cartItems])
  }

  /**
   * 장바구니 비우기
   */
  clearCart(onUpdate: (cart: CartItem[]) => void) {
    this.cartItems = []
    onUpdate([...this.cartItems])
  }

  /**
   * 장바구니 가져오기
   */
  getCart() {
    return [...this.cartItems]
  }

  /**
   * 카테고리 설정
   */
  setCategory(category: string) {
    this.selectedCategory = category
  }

  /**
   * 선택된 카테고리
   */
  getCategory() {
    return this.selectedCategory
  }

  /**
   * 총액 계산
   */
  calculateTotal() {
    return orderService.calculateTotal(this.cartItems)
  }

  /**
   * 주문 생성
   */
  async createOrder(storeId: number, tableNumber: number) {
    if (this.cartItems.length === 0) {
      return { success: false, error: '장바구니가 비어있습니다' }
    }

    return await orderService.createOrder(storeId, tableNumber, this.cartItems)
  }
}

export const orderController = new OrderController()
