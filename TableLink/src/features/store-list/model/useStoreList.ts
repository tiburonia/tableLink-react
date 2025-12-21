/**
 * useStoreList - 매장 목록 조회 및 필터링 Feature Hook
 * 
 * FSD 원칙: 유저 행동 "매장 목록 보기/검색/필터링"의 상태와 로직을 관리
 */

import { useState, useEffect, useMemo, useCallback } from 'react'
import { storeService } from '@/shared/api'
import type { Store } from '@/entities/store'
import type { StoreFilterState } from './types'

// 서울시청 좌표
const SEOUL_CITY_HALL = { lat: 37.5665, lng: 126.978 }
const SEARCH_RADIUS_KM = 20

// 두 좌표 간의 거리 계산 (Haversine 공식)
const calculateDistance = (
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number => {
  const R = 6371 // 지구 반경 (km)
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLng = ((lng2 - lng1) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}

export function useStoreList() {
  // 상태
  const [stores, setStores] = useState<Store[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [filters, setFilters] = useState<StoreFilterState>({
    category: 'all',
    sort: 'distance',
  })

  // 매장 데이터 로드
  const loadStores = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const result = await storeService.getAllStores()

      if (result.success) {
        // 서울시청 기준 20km 반경 내 매장만 필터링
        const filteredStores = (result.stores as Store[])
          .filter((store) => {
            if (!store.latitude || !store.longitude) return false
            const distance = calculateDistance(
              SEOUL_CITY_HALL.lat,
              SEOUL_CITY_HALL.lng,
              store.latitude,
              store.longitude
            )
            return distance <= SEARCH_RADIUS_KM
          })
          .map((store) => ({
            ...store,
            distance: calculateDistance(
              SEOUL_CITY_HALL.lat,
              SEOUL_CITY_HALL.lng,
              store.latitude!,
              store.longitude!
            ),
          }))

        setStores(filteredStores)
      } else {
        setError(result.message || '매장 데이터를 불러올 수 없습니다.')
      }
    } catch (err) {
      setError('매장 데이터를 불러오는 중 오류가 발생했습니다.')
    } finally {
      setLoading(false)
    }
  }, [])

  // 초기 로드
  useEffect(() => {
    loadStores()
  }, [loadStores])

  // 필터링된 매장 목록
  const filteredStores = useMemo(() => {
    let result = [...stores]

    // 검색어 필터링
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      result = result.filter(
        (store) =>
          store.name.toLowerCase().includes(query) ||
          store.category?.toLowerCase().includes(query) ||
          store.address?.toLowerCase().includes(query)
      )
    }

    // 카테고리 필터링
    if (filters.category && filters.category !== 'all') {
      result = result.filter((store) => store.category === filters.category)
    }

    // 정렬
    if (filters.sort === 'distance' && result[0]?.distance !== undefined) {
      result.sort((a, b) => (a.distance || 0) - (b.distance || 0))
    } else if (filters.sort === 'rating') {
      result.sort((a, b) => (b.rating || 0) - (a.rating || 0))
    } else if (filters.sort === 'review') {
      result.sort((a, b) => (b.review_count || 0) - (a.review_count || 0))
    }

    return result
  }, [stores, searchQuery, filters])

  return {
    // 상태
    stores: filteredStores,
    allStores: stores,
    loading,
    error,
    searchQuery,
    filters,
    // 액션
    setSearchQuery,
    setFilters,
    refreshStores: loadStores,
  }
}
