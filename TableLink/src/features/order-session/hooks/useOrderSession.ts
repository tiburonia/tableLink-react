/**
 * 주문 세션 데이터 관리 훅
 */

import { useState, useEffect, useCallback } from 'react'
import { orderSessionApi } from '../api'
import type { OrderSessionData } from '../model'

const REFRESH_INTERVAL = 30000 // 30초

export const useOrderSession = (orderId: number) => {
  const [data, setData] = useState<OrderSessionData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadData = useCallback(async () => {
    try {
      setError(null)
      const response = await orderSessionApi.getProcessingOrder(orderId)
      
      if (response.success && response.order) {
        setData(response.order)
      } else {
        throw new Error(response.message || '데이터를 불러올 수 없습니다')
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '주문 정보를 불러오는 중 오류가 발생했습니다'
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }, [orderId])

  const endSession = useCallback(async () => {
    try {
      const response = await orderSessionApi.endSession(orderId)
      if (response.success) {
        // 세션 상태 업데이트
        if (data) {
          setData({ ...data, session_status: 'CLOSED' })
        }
        return true
      }
      return false
    } catch (err) {
      console.error('세션 종료 실패:', err)
      return false
    }
  }, [orderId, data])

  // 초기 로드
  useEffect(() => {
    loadData()
  }, [loadData])

  // 실시간 업데이트 (30초마다)
  useEffect(() => {
    if (!data || data.session_status === 'CLOSED') return

    const interval = setInterval(() => {
      loadData()
    }, REFRESH_INTERVAL)

    return () => clearInterval(interval)
  }, [data, loadData])

  return {
    data,
    loading,
    error,
    refresh: loadData,
    endSession,
  }
}
