import { useCallback } from 'react'
import { usePosStore } from '@/shared/stores'
import { tableApi } from '@/entities/table'

export function useTableMap() {
  const tables = usePosStore((state) => state.tables)
  const selectedTable = usePosStore((state) => state.selectedTable)
  const setTables = usePosStore((state) => state.setTables)
  const selectTable = usePosStore((state) => state.selectTable)
  const setLoading = usePosStore((state) => state.setLoading)
  const setError = usePosStore((state) => state.setError)

  const fetchTables = useCallback(async (storeId: number) => {
    setLoading(true)
    setError(null)
    try {
      const data = await tableApi.getStoreTables(storeId)
      setTables(data)
    } catch (error) {
      setError(error instanceof Error ? error.message : '테이블 정보를 불러오는데 실패했습니다.')
    } finally {
      setLoading(false)
    }
  }, []) // Zustand actions are stable references

  const handleTableSelect = useCallback((tableNumber: number) => {
    selectTable(tableNumber)
  }, []) // Zustand actions are stable references

  const getTableByNumber = useCallback((tableNumber: number) => {
    return tables.find((t) => t.tableNumber === tableNumber)
  }, [tables])

  const getTablesWithOrders = useCallback(() => {
    return tables.filter((t) => t.isOccupied || t.orders.length > 0)
  }, [tables])

  const getEmptyTables = useCallback(() => {
    return tables.filter((t) => !t.isOccupied && t.orders.length === 0)
  }, [tables])

  return {
    tables,
    selectedTable,
    fetchTables,
    handleTableSelect,
    getTableByNumber,
    getTablesWithOrders,
    getEmptyTables,
  }
}
