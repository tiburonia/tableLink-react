/**
 * useStoreList - 매장 목록 조회 및 필터링 Feature Hook
 * 
 * FSD 원칙: 유저 행동 "매장 목록 보기/검색/필터링"의 상태와 로직을 관리
 * 
 * 설계 원칙:
 * - 초기 로딩: 최초 N개만 로딩 (id순)
 * - 더보기 버튼: 사용자 의도 확인 트리거
 * - 무한 스크롤: 더보기 클릭 후 활성화
 * - 커서 기반 페이지네이션
 */

import { useState, useEffect, useMemo, useCallback, useRef } from 'react'
import { storeService } from '@/shared/api'
import type { Store } from '@/entities/store'
import type { StoreFilterState } from './types'

const INITIAL_LIMIT = 20

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

  // 커서 기반 페이지네이션 상태
  const [cursor, setCursor] = useState<string | null>(null)
  const [hasNext, setHasNext] = useState(true)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  
  // 핵심 상태: 더보기 버튼 클릭 후 무한 스크롤 활성화
  const [autoLoadEnabled, setAutoLoadEnabled] = useState(false)
  
  // IntersectionObserver ref
  const loadMoreRef = useRef<HTMLDivElement | null>(null)

  /**
   * 초기 매장 데이터 로드
   */
  const loadInitialStores = useCallback(async () => {
    setLoading(true)
    setError(null)
    setAutoLoadEnabled(false) // 초기화 시 자동 로드 비활성화

    try {
      const result = await storeService.getInitialStores(INITIAL_LIMIT)

      if (result.success) {
        setStores(result.items as Store[])
        setCursor(result.nextCursor)
        setHasNext(result.hasNext)
      } else {
        setError(result.message || '매장 데이터를 불러올 수 없습니다.')
      }
    } catch (err) {
      setError('매장 데이터를 불러오는 중 오류가 발생했습니다.')
    } finally {
      setLoading(false)
    }
  }, [])

  /**
   * 추가 매장 데이터 로드 (더보기 / 무한 스크롤 공통)
   * - 최소 로딩 시간을 보장하여 UX 개선
   */
  const loadMoreStores = useCallback(async () => {
    if (isLoadingMore || !hasNext || !cursor) return

    setIsLoadingMore(true)

    // 최소 로딩 시간 (ms) - 로딩 UI가 너무 빨리 사라지지 않도록
    const MIN_LOADING_TIME = 1000
    const startTime = Date.now()

    try {
      const result = await storeService.getMoreStores(cursor, INITIAL_LIMIT)

      // 최소 로딩 시간 보장
      const elapsed = Date.now() - startTime
      if (elapsed < MIN_LOADING_TIME) {
        await new Promise(resolve => setTimeout(resolve, MIN_LOADING_TIME - elapsed))
      }

      if (result.success) {
        setStores(prev => [...prev, ...(result.items as Store[])])
        setCursor(result.nextCursor)
        setHasNext(result.hasNext)
      }
    } catch (err) {
      console.error('추가 매장 로딩 오류:', err)
    } finally {
      setIsLoadingMore(false)
    }
  }, [cursor, hasNext, isLoadingMore])

  /**
   * 더보기 버튼 클릭 핸들러
   * - 한 번 클릭하면 무한 스크롤 활성화
   */
  const handleLoadMore = useCallback(async () => {
    await loadMoreStores()
    setAutoLoadEnabled(true) // 이후부터 무한 스크롤 활성화
  }, [loadMoreStores])

  // 초기 로드
  useEffect(() => {
    loadInitialStores()
  }, [loadInitialStores])

  // IntersectionObserver: autoLoadEnabled가 true일 때만 활성화
  useEffect(() => {
    if (!autoLoadEnabled) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && hasNext && !isLoadingMore) {
          loadMoreStores()
        }
      },
      { threshold: 0.1 }
    )

    const currentRef = loadMoreRef.current
    if (currentRef) {
      observer.observe(currentRef)
    }

    return () => {
      if (currentRef) {
        observer.unobserve(currentRef)
      }
      observer.disconnect()
    }
  }, [autoLoadEnabled, hasNext, isLoadingMore, loadMoreStores])

  // 필터링된 매장 목록 (클라이언트 사이드 필터링)
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
    
    // 페이지네이션 상태
    hasNext,
    isLoadingMore,
    autoLoadEnabled,
    loadMoreRef,
    
    // 액션
    setSearchQuery,
    setFilters,
    refreshStores: loadInitialStores,
    loadMore: handleLoadMore,
  }
}
