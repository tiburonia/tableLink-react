/**
 * 주문 세션 API 클라이언트
 */

import type { OrderSessionResponse } from '../model'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || ''

export const orderSessionApi = {
  /**
   * 주문 진행 상황 조회
   */
  async getProcessingOrder(orderId: number): Promise<OrderSessionResponse> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/orders/processing/${orderId}`)

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      return await response.json()
    } catch (error) {
      console.error('❌ 주문 진행 상황 조회 실패:', error)
      throw error
    }
  },

  /**
   * 세션 종료
   */
  async endSession(orderId: number): Promise<{ success: boolean; message: string }> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/orders/${orderId}/end-session`, {
        method: 'POST',
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      return await response.json()
    } catch (error) {
      console.error('❌ 세션 종료 실패:', error)
      throw error
    }
  },
}
