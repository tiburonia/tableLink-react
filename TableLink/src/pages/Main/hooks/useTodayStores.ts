/**
 * useTodayStores - 오늘의 가게 추천 데이터 조회 훅
 * 
 * 요일 기반으로 id % t === 0 인 매장들을 랜덤 조회
 * t: 월=1, 화=2, ... 일=7
 */

import { useState, useEffect, useCallback } from 'react'

interface TodayStore {
  id: string
  name: string
  category: string
  address: string
  rating: number
  reviewCount: number
  isOpen: boolean
}

interface UseTodayStoresResult {
  stores: TodayStore[]
  dayOfWeek: string
  t: number
  isLoading: boolean
  error: string | null
  refetch: () => void
}

export const useTodayStores = (limit: number = 5): UseTodayStoresResult => {
  const [stores, setStores] = useState<TodayStore[]>([])
  const [dayOfWeek, setDayOfWeek] = useState<string>('')
  const [t, setT] = useState<number>(0)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchTodayStores = useCallback(async () => {
    setIsLoading(true)
    setError(null)

    try {
      // 최소 400ms 로딩 시간 보장 (UX 개선)
      const [response] = await Promise.all([
        fetch(`/api/stores/recommend/today?limit=${limit}`),
        new Promise(resolve => setTimeout(resolve, 400))
      ])

      if (!response.ok) {
        throw new Error('오늘의 가게를 불러오는데 실패했습니다.')
      }

      const data = await response.json()

      if (data.success) {
        setStores(data.items)
        setDayOfWeek(data.dayOfWeek)
        setT(data.t)
      } else {
        throw new Error(data.error || '알 수 없는 오류')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '오류가 발생했습니다.')
    } finally {
      setIsLoading(false)
    }
  }, [limit])

  useEffect(() => {
    fetchTodayStores()
  }, [fetchTodayStores])

  return {
    stores,
    dayOfWeek,
    t,
    isLoading,
    error,
    refetch: fetchTodayStores
  }
}
