/**
 * 주문 세션 헤더 컴포넌트
 */

import { formatOrderTime } from '../model'
import styles from './SessionHeader.module.css'

interface SessionHeaderProps {
  storeName: string
  tableNumber: string
  createdAt: string
  onBack: () => void
  onEndSession: () => void
}

export const SessionHeader = ({
  storeName,
  tableNumber,
  createdAt,
  onBack,
  onEndSession,
}: SessionHeaderProps) => {
  return (
    <div className={styles.sessionHeader}>
      <button onClick={onBack} className={styles.backBtn} aria-label="뒤로가기">
        <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor">
          <path d="M19 12H5m7-7l-7 7 7 7" stroke="currentColor" strokeWidth="2" fill="none" />
        </svg>
      </button>

      <div className={styles.headerInfo}>
        <h1 className={styles.storeName}>🍽️ {storeName}</h1>
        <p className={styles.subtitle}>
          테이블 {tableNumber} • {formatOrderTime(createdAt)}
        </p>
      </div>

      <button onClick={onEndSession} className={styles.endSessionBtn}>
        🔚 식사 종료
      </button>
    </div>
  )
}
