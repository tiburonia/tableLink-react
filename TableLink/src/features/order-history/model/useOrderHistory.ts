/**
 * useOrderHistory - 주문 내역 조회 Feature Hook
 * FSD: features/order-history/model
 * 
 * 유저 행동: "주문 내역 조회/재주문/리뷰 작성"
 */

import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'

interface OrderItem {
  name: string
  price?: number
  qty?: number
  quantity?: number
}

interface OrderData {
  items?: OrderItem[]
  store?: string
  totalAmount?: number
}

interface Order {
  id: number | string
  order_date: string
  store_name?: string
  order_data?: OrderData
  total_amount?: number
  final_amount?: number
  hasReview?: boolean
  has_review?: boolean
  order_status?: string
}

interface OrderStats {
  totalOrders: number
  thisMonthOrders: number
  totalAmount: number
}

interface OrderHistoryData {
  orders: Order[]
  stats: OrderStats
}

interface UserInfo {
  userId: number
  name?: string
  username?: string
}

const orderHistoryService = {
  async loadOrderData(userId: number): Promise<OrderHistoryData> {
    try {
      const response = await fetch(`/api/orders/user/${userId}`)
      if (!response.ok) throw new Error('주문 내역 조회 실패')
      const data = await response.json()
      return {
        orders: data.orders || [],
        stats: data.stats || { totalOrders: 0, thisMonthOrders: 0, totalAmount: 0 }
      }
    } catch (error) {
      console.error('주문 내역 로드 실패:', error)
      return { 
        orders: [], 
        stats: { totalOrders: 0, thisMonthOrders: 0, totalAmount: 0 } 
      }
    }
  }
}

export function useOrderHistory(userInfo?: UserInfo) {
  const [data, setData] = useState<OrderHistoryData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const navigate = useNavigate()

  const loadOrderData = useCallback(async () => {
    if (!userInfo?.userId) {
      setError('사용자 정보가 없습니다')
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      const orderData = await orderHistoryService.loadOrderData(userInfo.userId)
      setData(orderData)
      setError(null)
    } catch (err) {
      console.error('❌ 주문 내역 로드 실패:', err)
      setError('주문 내역을 불러올 수 없습니다')
    } finally {
      setLoading(false)
    }
  }, [userInfo?.userId])

  useEffect(() => {
    loadOrderData()
  }, [loadOrderData])

  const handleBack = useCallback(() => {
    navigate('/mypage')
  }, [navigate])

  const handleReorder = useCallback((orderId: string | number) => {
    console.log('🔄 재주문 요청:', orderId)
    alert('재주문 기능은 준비중입니다.')
  }, [])

  const handleReviewWrite = useCallback((order: Order) => {
    console.log('✍️ 리뷰 작성:', order)
    alert('리뷰 작성 기능은 준비중입니다.')
  }, [])

  const getOrderItemsText = useCallback((order: Order) => {
    const orderData = order.order_data || {}
    const items = orderData.items || []

    if (items.length === 0) return '메뉴 정보 없음'

    return items.length > 1
      ? `${items[0].name} 외 ${items.length - 1}건`
      : items[0]?.name || '메뉴 정보 없음'
  }, [])

  const formatOrderDate = useCallback((dateStr: string) => {
    const orderDate = new Date(dateStr)
    return `${orderDate.getMonth() + 1}.${orderDate.getDate()}`
  }, [])

  const goToMap = useCallback(() => {
    navigate('/map')
  }, [navigate])

  return {
    // 상태
    data,
    loading,
    error,
    orders: data?.orders || [],
    // 액션
    handleBack,
    handleReorder,
    handleReviewWrite,
    refetch: loadOrderData,
    // 유틸
    getOrderItemsText,
    formatOrderDate,
    goToMap,
  }
}

export type { Order, OrderHistoryData, UserInfo }
