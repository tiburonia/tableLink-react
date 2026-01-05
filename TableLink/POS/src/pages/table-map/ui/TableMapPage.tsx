import { useCallback } from 'react'
import { TableMapGrid } from '@/features/table-map'
import { usePosStore } from '@/shared/stores'
import styles from './TableMapPage.module.css'

interface TableMapPageProps {
  storeId: number
  onTableSelect: (tableNumber: number) => void
}

export function TableMapPage({ storeId, onTableSelect }: TableMapPageProps) {
  const { tables } = usePosStore()

  const handleTableSelect = useCallback((tableNumber: number) => {
    onTableSelect(tableNumber)
  }, [onTableSelect])

  // 주문이 있는 테이블 필터링 (주문이 있거나 점유 중인 테이블)
  const tablesWithOrders = tables.filter((t) => t.isOccupied || t.orders.length > 0)
  
  // 총 매출 계산
  const totalAmount = tablesWithOrders.reduce((sum, table) => {
    const tableTotal = table.orders.reduce((orderSum, order) => {
      return orderSum + Object.values(order.items).reduce((itemSum, item) => itemSum + item.totalPrice, 0)
    }, 0)
    return sum + tableTotal
  }, 0)

  return (
    <div className={styles.page}>
      <div className={styles.summary}>
        <div className={styles.summaryItem}>
          <span className={styles.summaryLabel}>전체 테이블</span>
          <span className={styles.summaryValue}>{tables.length}</span>
        </div>
        <div className={styles.summaryItem}>
          <span className={styles.summaryLabel}>주문 테이블</span>
          <span className={styles.summaryValue}>{tablesWithOrders.length}</span>
        </div>
        <div className={styles.summaryItem}>
          <span className={styles.summaryLabel}>총 매출</span>
          <span className={styles.summaryValue}>
            {totalAmount.toLocaleString()}원
          </span>
        </div>
      </div>

      <div className={styles.tableMapContainer}>
        <TableMapGrid
          storeId={storeId}
          columns={5}
          onTableSelect={handleTableSelect}
        />
      </div>

      <div className={styles.legend}>
        <div className={styles.legendItem}>
          <span className={`${styles.legendColor} ${styles.empty}`} />
          <span>빈 테이블</span>
        </div>
        <div className={styles.legendItem}>
          <span className={`${styles.legendColor} ${styles.pos}`} />
          <span>POS 주문</span>
        </div>
        <div className={styles.legendItem}>
          <span className={`${styles.legendColor} ${styles.tll}`} />
          <span>TLL 주문</span>
        </div>
        <div className={styles.legendItem}>
          <span className={`${styles.legendColor} ${styles.combined}`} />
          <span>복합 주문</span>
        </div>
      </div>
    </div>
  )
}
