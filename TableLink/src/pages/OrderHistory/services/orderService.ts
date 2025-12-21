/**
 * Order Service
 * 주문 비즈니스 로직 - 데이터 가공 및 처리
 */

import type { OrderHistoryData, Order } from '../types'

export const orderService = {
  /**
   * 주문 내역 로드 및 통계 계산
   */
  async loadOrderData(userId: number): Promise<OrderHistoryData> {
    try {
      console.log('📊 주문 데이터 로드 시작:', userId)

      if (!userId) {
        throw new Error('userId가 필요합니다')
      }

      const response = await fetch(`/api/users/${userId}/orders?limit=100`)

      if (!response.ok) {
        throw new Error('주문 내역 조회 실패')
      }

      const data = await response.json()
      const orders: Order[] = data.orders || []

      console.log('📦 주문 데이터:', orders)

      // 통계 계산
      const totalOrders = orders.length
      const now = new Date()

      const thisMonthOrders = orders.filter((order) => {
        const orderDate = new Date(order.order_date)
        return (
          orderDate.getMonth() === now.getMonth() &&
          orderDate.getFullYear() === now.getFullYear()
        )
      }).length

      const totalAmount = orders.reduce(
        (sum, order) => sum + (order.final_amount || order.total_amount || 0),
        0
      )

      return {
        orders,
        stats: {
          totalOrders,
          thisMonthOrders,
          totalAmount,
        },
      }
    } catch (error) {
      console.error('❌ loadOrderData 실패:', error)
      throw error
    }
  },
}
