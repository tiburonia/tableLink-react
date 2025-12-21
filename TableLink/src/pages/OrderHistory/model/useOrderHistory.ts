/**
 * useOrderHistory - 주문 내역 페이지 상태 관리
 * 
 * FSD 원칙: 유저 행동 "주문 내역 조회/재주문/리뷰 작성"의 상태와 로직을 관리
 */

import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import type { OrderHistoryData, Order } from '../types'
import { orderService } from './orderService'

interface UserInfo {
  userId: number
  name?: string
  username?: string
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
      const orderData = await orderService.loadOrderData(userInfo.userId)
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
