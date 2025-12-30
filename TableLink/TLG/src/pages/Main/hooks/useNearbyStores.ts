/**
 * useNearbyStores - 주변 매장 추천 Hook
 */

import { useState, useEffect, useCallback } from 'react'

const API_BASE = 'https://stunning-broccoli-7vwxrrpqr7vj29pj-5000.app.github.dev'

interface Store {
  id: string
  name: string
  category: string
  address: string
  rating: number
  reviewCount: number
  isOpen: boolean
  distance?: number // km
}

interface UseNearbyStoresReturn {
  stores: Store[]
  isLoading: boolean
  error: string | null
  refetch: () => void
}

export function useNearbyStores(
  lat: number,
  lng: number,
  radius: number = 2000 // 기본 2km
): UseNearbyStoresReturn {
  const [stores, setStores] = useState<Store[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchStores = useCallback(async () => {
    if (!lat || !lng) return

    setIsLoading(true)
    setError(null)

    try {
      const res = await fetch(
        `${API_BASE}/api/stores/recommend/nearby?lat=${lat}&lng=${lng}&radius=${radius}&limit=10`,
        {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
        }
      )

      if (!res.ok) {
        throw new Error('주변 매장을 불러오는데 실패했습니다.')
      }

      const data = await res.json()
      setStores(data.items || [])
    } catch (err) {
      console.error('useNearbyStores error:', err)
      setError(err instanceof Error ? err.message : '알 수 없는 오류')
      setStores([])
    } finally {
      setIsLoading(false)
    }
  }, [lat, lng, radius])

  useEffect(() => {
    fetchStores()
  }, [fetchStores])

  return {
    stores,
    isLoading,
    error,
    refetch: fetchStores,
  }
}
