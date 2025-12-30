/**
 * 검색 커스텀 훅
 */

import { useState, useCallback, useEffect } from 'react'
import { searchApi } from '../api'
import type { SearchStore } from '../model'
import { SEARCH_CONFIG } from '../model'

export const useSearch = (initialQuery = '') => {
  const [query, setQuery] = useState(initialQuery)
  const [results, setResults] = useState<SearchStore[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const performSearch = useCallback(async (searchQuery: string) => {
    if (!searchQuery || searchQuery.length < SEARCH_CONFIG.MIN_QUERY_LENGTH) {
      setResults([])
      return
    }

    setLoading(true)
    setError(null)

    try {
      const response = await searchApi.searchStores(searchQuery)
      setResults(response.stores || [])
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '검색 중 오류가 발생했습니다'
      setError(errorMessage)
      setResults([])
    } finally {
      setLoading(false)
    }
  }, [])

  const clearSearch = useCallback(() => {
    setQuery('')
    setResults([])
    setError(null)
  }, [])

  // 초기 검색어가 있으면 자동 검색
  useEffect(() => {
    if (initialQuery.trim()) {
      performSearch(initialQuery)
    }
  }, [initialQuery, performSearch])

  return {
    query,
    setQuery,
    results,
    loading,
    error,
    performSearch,
    clearSearch,
  }
}
