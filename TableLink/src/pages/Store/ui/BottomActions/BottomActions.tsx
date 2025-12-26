import styles from './BottomActions.module.css'

interface BottomActionsProps {
  storeId: number
  storeName: string
}

export const BottomActions = ({ storeId, storeName }: BottomActionsProps) => {
  const handleQROrder = () => {
    // TODO: QR 주문 페이지로 이동
    console.log('QR 주문:', storeId)
    alert('QR 주문 기능 준비 중')
  }

  const handleReservation = () => {
    // TODO: 예약 페이지로 이동
    console.log('예약하기:', storeName)
    alert('예약 기능 준비 중')
  }

  return (
    <div className={styles.bottomActions}>
      <button 
        className={`${styles.actionBtn} ${styles.secondary}`} 
        onClick={handleQROrder}
      >
        QR 주문
      </button>
      <button 
        className={`${styles.actionBtn} ${styles.primary}`} 
        onClick={handleReservation}
      >
        예약하기
      </button>
    </div>
  )
}
