import { OrderScreen } from '@/widgets/order-screen'
import styles from './OrderPage.module.css'

interface OrderPageProps {
  storeId: number
  tableNumber: number
  onOrderComplete?: () => void
  onBack?: () => void
}

export function OrderPage({
  storeId,
  tableNumber,
  onOrderComplete,
  onBack,
}: OrderPageProps) {
  const handleBack = () => {
    onBack?.()
  }

  return (
    <div className={styles.page}>
      <div className={styles.backButton} onClick={handleBack}>
        <span className={styles.backIcon}>←</span>
        <span>테이블 목록</span>
      </div>

      <div className={styles.content}>
        <OrderScreen
          storeId={storeId}
          tableNumber={tableNumber}
          onOrderComplete={onOrderComplete}
        />
      </div>
    </div>
  )
}
