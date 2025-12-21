/**
 * useRegularPage - 단골/즐겨찾기 페이지 상태 관리
 * 
 * FSD 원칙: 유저 행동 "단골매장 조회/즐겨찾기 관리/피드 확인"의 상태와 로직을 관리
 */

import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { regularService } from './regularService'

interface RegularSummary {
  totalPoints: number
  totalCoupons: number
  unwrittenReviews: number
  totalStores: number
}

interface RegularStore {
  storeId: number
  storeName: string
  level: string
  points: number
  visitCount: number
  lastVisit: string
  category: string
}

interface FavoriteStore {
  storeId: number
  storeName: string
  category: string
  rating: number
  distance: string
}

type TabType = 'regular' | 'favorite' | 'feed'

export function useRegularPage() {
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState<TabType>('regular')
  const [summary, setSummary] = useState<RegularSummary | null>(null)
  const [stores, setStores] = useState<RegularStore[]>([])
  const [favoriteStores, setFavoriteStores] = useState<FavoriteStore[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isSidePanelOpen, setIsSidePanelOpen] = useState(false)

  const loadData = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      const result = await regularService.getRegularStoresData()

      if (result.success) {
        setSummary(result.summary)
        setStores(result.stores)
        setFavoriteStores(result.favoriteStores)
      } else {
        setError(result.error || '데이터를 불러올 수 없습니다')
      }
    } catch (err) {
      setError('데이터를 불러오는 중 오류가 발생했습니다')
      console.error('Regular data load error:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadData()
  }, [loadData])

  const handleTabChange = useCallback((tab: TabType) => {
    setActiveTab(tab)
  }, [])

  const handleStoreClick = useCallback((storeId: number) => {
    navigate(`/rs/${storeId}`)
  }, [navigate])

  const handleRemoveFavorite = useCallback(async (storeId: number) => {
    if (confirm('즐겨찾기에서 삭제하시겠습니까?')) {
      setFavoriteStores((prev) => prev.filter((store) => store.storeId !== storeId))
    }
  }, [])

  const openSidePanel = useCallback(() => {
    setIsSidePanelOpen(true)
  }, [])

  const closeSidePanel = useCallback(() => {
    setIsSidePanelOpen(false)
  }, [])

  const getUserId = useCallback(() => {
    return parseInt(localStorage.getItem('userId') || '1')
  }, [])

  return {
    // 상태
    activeTab,
    summary,
    stores,
    favoriteStores,
    loading,
    error,
    isSidePanelOpen,
    // 액션
    handleTabChange,
    handleStoreClick,
    handleRemoveFavorite,
    openSidePanel,
    closeSidePanel,
    refetch: loadData,
    getUserId,
  }
}
