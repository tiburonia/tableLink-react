/**
 * useQRScan - QR 주문 페이지 상태 및 로직 관리
 * 
 * FSD 원칙: 유저 행동 "매장 검색/테이블 선택/주문 시작"의 상태와 로직을 관리
 */

import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { qrController } from './qrController'

interface Store {
  id: string
  name: string
  category?: string
  address?: string
}

interface Table {
  id: number
  tableName: string
  isOccupied: boolean
  status: string
}

export function useQRScan() {
  const navigate = useNavigate()
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<Store[]>([])
  const [selectedStore, setSelectedStore] = useState<Store | null>(null)
  const [selectedTable, setSelectedTable] = useState<number | null>(null)
  const [tables, setTables] = useState<Table[]>([])
  const [showResults, setShowResults] = useState(false)
  const [isSearching, setIsSearching] = useState(false)

  // 매장 검색
  useEffect(() => {
    const searchStores = async () => {
      if (searchQuery.length >= 2) {
        setIsSearching(true)
        await qrController.handleSearch(searchQuery, (stores) => {
          setSearchResults(stores)
          setShowResults(true)
          setIsSearching(false)
        })
      } else {
        setSearchResults([])
        setShowResults(false)
        setIsSearching(false)
      }
    }

    const timeoutId = setTimeout(searchStores, 300)
    return () => clearTimeout(timeoutId)
  }, [searchQuery, selectedStore])

  // 매장 선택
  const handleStoreSelect = useCallback(async (store: Store) => {
    try {
      const tables = await qrController.handleStoreSelect(store.id)
      
      setSelectedStore(store)
      setShowResults(false)
      setSearchResults([])
      setSearchQuery(store.name)
      setTables(tables)
      setSelectedTable(null)
    } catch (error) {
      console.error('매장 선택 실패:', error)
      setSelectedStore(null)
      setTables([])
    }
  }, [])

  // 검색어 변경
  const handleSearchChange = useCallback((newValue: string) => {
    setSearchQuery(newValue)
    if (selectedStore && newValue !== selectedStore.name) {
      setSelectedStore(null)
      setTables([])
      setSelectedTable(null)
    }
  }, [selectedStore])

  // 검색 포커스
  const handleSearchFocus = useCallback(() => {
    if (searchQuery) setShowResults(true)
  }, [searchQuery])

  // 검색 블러
  const handleSearchBlur = useCallback(() => {
    setTimeout(() => setShowResults(false), 200)
  }, [])

  // 테이블 선택
  const handleTableSelect = useCallback((tableId: number) => {
    setSelectedTable(tableId)
  }, [])

  // 주문 시작
  const handleStartOrder = useCallback(() => {
    if (selectedStore && selectedTable) {
      navigate(`/p/${selectedStore.id}?table=${selectedTable}`)
    }
  }, [selectedStore, selectedTable, navigate])

  return {
    // 상태
    searchQuery,
    searchResults,
    selectedStore,
    selectedTable,
    tables,
    showResults,
    isSearching,
    // 액션
    handleSearchChange,
    handleSearchFocus,
    handleSearchBlur,
    handleStoreSelect,
    handleTableSelect,
    handleStartOrder,
  }
}
