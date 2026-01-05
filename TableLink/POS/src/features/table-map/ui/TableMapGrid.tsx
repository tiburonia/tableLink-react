import { useEffect, useRef } from 'react'
import { TableCard } from '@/entities/table'
import { useTableMap } from '../model'
import styles from './TableMapGrid.module.css'

interface TableMapGridProps {
  storeId: number
  columns?: number
  onTableSelect: (tableNumber: number) => void
}

export function TableMapGrid({
  storeId,
  columns = 5,
  onTableSelect,
}: TableMapGridProps) {
  const { tables, selectedTable, fetchTables, handleTableSelect } = useTableMap()
  const hasFetched = useRef(false)

  useEffect(() => {
    // 초기 로딩 시 한 번만 실행
    if (!hasFetched.current) {
      hasFetched.current = true
      fetchTables(storeId)
    }
  }, [storeId])

  const handleClick = (tableNumber: number) => {
    handleTableSelect(tableNumber)
    onTableSelect(tableNumber)
  }

  return (
    <div
      className={styles.grid}
      style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}
    >
      {tables.map((table) => (
        <div
          key={table.tableNumber}
          className={`${styles.tableWrapper} ${
            selectedTable === table.tableNumber ? styles.selected : ''
          }`}
        >
          <TableCard table={table} onClick={handleClick} />
        </div>
      ))}
    </div>
  )
}
