/**
 * useStoreView - 매장 상세 보기 Feature Hook
 * 
 * FSD 원칙: 유저 행동 "매장 상세 보기/탭 전환/사진 보기"의 상태와 로직을 관리
 */

import { useState, useEffect, useCallback } from 'react'
import { useSearchParams } from 'react-router-dom'
import { storeService } from '@/shared/api'
import type { Store } from '@/entities/store'
import type { TabType } from './types'

export function useStoreView(storeId: string | undefined) {
  // 매장 데이터 상태
  const [store, setStore] = useState<Store | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isFavorite, setIsFavorite] = useState(false)

  // 탭 상태
  const [searchParams, setSearchParams] = useSearchParams()
  const defaultTab = (searchParams.get('tab') as TabType) || 'main'
  const [activeTab, setActiveTab] = useState<TabType>(defaultTab)

  // 사진 모달 상태
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null)

  // 매장 데이터 로드
  const loadStore = useCallback(async () => {
    if (!storeId) {
      setError('매장 ID가 없습니다.')
      setLoading(false)
      return
    }

    setLoading(true)
    setError(null)

    try {
      const user = localStorage.getItem('user')
      const userPk = user ? JSON.parse(user).user_pk : 0
      
      const result = await storeService.getStoreById(storeId, userPk)

      if (result.success && result.store) {
        setStore(result.store as Store)
        setIsFavorite((result.store as Store).isFavorite || false)
      } else {
        setError(result.message || '매장 정보를 불러올 수 없습니다.')
      }
    } catch (err) {
      setError('매장 정보를 불러오는 중 오류가 발생했습니다.')
    } finally {
      setLoading(false)
    }
  }, [storeId])

  // 초기 로드
  useEffect(() => {
    loadStore()
  }, [loadStore])

  // URL 동기화
  useEffect(() => {
    const tab = searchParams.get('tab') as TabType
    if (tab && ['main', 'menu', 'review', 'regular', 'info'].includes(tab)) {
      setActiveTab(tab)
    }
  }, [searchParams])

  // 탭 전환
  const switchTab = useCallback((tab: TabType) => {
    setActiveTab(tab)
    if (tab === 'main') {
      setSearchParams({})
    } else {
      setSearchParams({ tab })
    }
  }, [setSearchParams])

  // 즐겨찾기 토글
  const toggleFavorite = useCallback(async () => {
    if (!store) return

    const user = localStorage.getItem('user')
    if (!user) {
      alert('로그인이 필요합니다.')
      return
    }

    try {
      setIsFavorite(!isFavorite)
      setStore({
        ...store,
        favoriteCount: isFavorite 
          ? (store.favoriteCount || 0) - 1 
          : (store.favoriteCount || 0) + 1
      })
    } catch (err) {
      alert('즐겨찾기 처리 중 오류가 발생했습니다.')
    }
  }, [store, isFavorite])

  // 사진 선택
  const selectPhoto = useCallback((url: string | null) => {
    setSelectedPhoto(url)
  }, [])

  return {
    // 매장 데이터
    store,
    loading,
    error,
    isFavorite,
    // 탭 상태
    activeTab,
    // 사진 모달
    selectedPhoto,
    // 액션
    switchTab,
    toggleFavorite,
    selectPhoto,
    refetch: loadStore,
  }
}
