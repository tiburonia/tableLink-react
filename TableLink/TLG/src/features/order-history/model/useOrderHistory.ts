/**
 * useOrderHistory - 주문 내역 조회 Feature Hook
 * FSD: features/order-history/model
 * 
 * 유저 행동: "주문 내역 조회/재주문/리뷰 작성"
 */

import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'

// API 응답 형식에 맞는 OrderItem
interface OrderItem {
  menu_name: string
  quantity: number
  unit_price: number
  total_price: number
}

interface Order {
  id: number | string
  created_at: string           // 주문 생성일
  total_price: number          // 총 금액
  session_status: string       // 세션 상태 (OPEN, CLOSED 등)
  source: string               // 주문 출처 (TLL 등)
  table_number: number         // 테이블 번호
  store_id: number             // 매장 ID
  store_name: string           // 매장명
  store_category: string       // 매장 카테고리
  ticket_count: string         // 티켓 수
  order_items: OrderItem[]     // 주문 항목
  is_reviewed?: boolean        // 리뷰 작성 여부 (API 응답 필드)
  has_review?: boolean         // 리뷰 작성 여부 (호환성)
  // 리뷰 정보
  review_rating?: number       // 리뷰 별점
  review_content?: string      // 리뷰 내용
  review_created_at?: string   // 리뷰 작성일
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
      
      // is_reviewed를 has_review로 매핑
      const orders = (data.orders || []).map((order: Order) => ({
        ...order,
        has_review: order.is_reviewed ?? order.has_review ?? false
      }))
      
      return {
        orders,
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
    console.log('✍️ 리뷰 작성 페이지로 이동:', order.id)
    // 주문 정보를 state로 전달하여 리뷰 작성 페이지로 이동
    navigate('/review-write', { 
      state: { 
        order: {
          id: order.id,
          store_name: order.store_name,
          store_id: order.store_id,
          order_items: order.order_items,
          total_price: order.total_price,
          created_at: order.created_at,
        } 
      } 
    })
  }, [navigate])

  const getOrderItemsText = useCallback((order: Order) => {
    const items = order.order_items || []

    if (items.length === 0) return '메뉴 정보 없음'

    return items.length > 1
      ? `${items[0].menu_name} 외 ${items.length - 1}건`
      : items[0]?.menu_name || '메뉴 정보 없음'
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
