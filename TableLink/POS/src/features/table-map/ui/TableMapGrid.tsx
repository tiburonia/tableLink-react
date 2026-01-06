import { TableCard } from '@/entities/table'
import { useTableMap } from '../model'
import styles from './TableMapGrid.module.css'

interface TableMapGridProps {
  storeId: number
  columns?: number
  onTableSelect: (tableNumber: number) => void
}

/**
 * 테이블맵 그리드 컴포넌트
 * - 테이블 로딩은 App.tsx에서 1회만 수행
 * - 이 컴포넌트는 store의 tables를 렌더링만 담당
 */
export function TableMapGrid({
  columns = 5,
  onTableSelect,
}: TableMapGridProps) {
  const { tables, selectedTable, handleTableSelect } = useTableMap()

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
