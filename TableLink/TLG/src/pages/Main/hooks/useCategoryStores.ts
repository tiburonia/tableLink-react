/**
 * useCategoryStores - 카테고리별 매장 추천 Hook
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
}

interface UseCategoryStoresReturn {
  stores: Store[]
  isLoading: boolean
  error: string | null
  refetch: () => void
}

export function useCategoryStores(category: string): UseCategoryStoresReturn {
  const [stores, setStores] = useState<Store[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchStores = useCallback(async () => {
    if (!category) return

    setIsLoading(true)
    setError(null)

    try {
      const res = await fetch(
        `${API_BASE}/api/stores/recommend/category?category=${encodeURIComponent(category)}&limit=10`,
        {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
        }
      )

      if (!res.ok) {
        throw new Error('카테고리 매장을 불러오는데 실패했습니다.')
      }

      const data = await res.json()
      setStores(data.items || [])
    } catch (err) {
      console.error('useCategoryStores error:', err)
      setError(err instanceof Error ? err.message : '알 수 없는 오류')
      setStores([])
    } finally {
      setIsLoading(false)
    }
  }, [category])

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
