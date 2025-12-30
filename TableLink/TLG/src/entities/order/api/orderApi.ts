/**
 * Order Entity API
 * 주문 관련 API 호출 함수들
 */

import type { Order, OrderSummary } from '../model'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'

export const orderApi = {
  /**
   * 주문 생성
   */
  async createOrder(orderData: {
    storeId: number
    tableNumber?: number
    items: Array<{ menuId: number; quantity: number; options?: any[] }>
    notes?: string
  }): Promise<Order> {
    const response = await fetch(`${API_BASE_URL}/orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(orderData),
    })
    if (!response.ok) throw new Error('Failed to create order')
    return response.json()
  },

  /**
   * 주문 상세 조회
   */
  async getOrderById(orderId: number): Promise<Order> {
    const response = await fetch(`${API_BASE_URL}/orders/${orderId}`, {
      credentials: 'include',
    })
    if (!response.ok) throw new Error('Failed to fetch order')
    return response.json()
  },

  /**
   * 사용자 주문 목록 조회
   */
  async getUserOrders(params?: { 
    status?: string
    limit?: number 
  }): Promise<OrderSummary[]> {
    const queryString = new URLSearchParams(params as Record<string, string>).toString()
    const response = await fetch(`${API_BASE_URL}/orders${queryString ? `?${queryString}` : ''}`, {
      credentials: 'include',
    })
    if (!response.ok) throw new Error('Failed to fetch orders')
    return response.json()
  },

  /**
   * 주문 취소
   */
  async cancelOrder(orderId: number): Promise<Order> {
    const response = await fetch(`${API_BASE_URL}/orders/${orderId}/cancel`, {
      method: 'POST',
      credentials: 'include',
    })
    if (!response.ok) throw new Error('Failed to cancel order')
    return response.json()
  },

  /**
   * 주문 상태 업데이트 (매장용)
   */
  async updateOrderStatus(orderId: number, status: string): Promise<Order> {
    const response = await fetch(`${API_BASE_URL}/orders/${orderId}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ status }),
    })
    if (!response.ok) throw new Error('Failed to update order status')
    return response.json()
  },
}
