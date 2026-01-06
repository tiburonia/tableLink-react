import { usePosStore } from '@/shared/stores'
import type { ViewType, OrderTabType } from '@/shared/types'
import styles from './Header.module.css'

interface HeaderProps {
  storeName: string
  tableNumber?: number
  onViewChange?: (view: ViewType) => void
  onOrderTabChange?: (tab: OrderTabType) => void
  onLogout?: () => void
}

export function Header({
  storeName,
  tableNumber,
  onViewChange,
  onOrderTabChange,
  onLogout,
}: HeaderProps) {
  const { currentView, orderTab, setCurrentView, setOrderTab } = usePosStore()

  const handleViewChange = (view: ViewType) => {
    setCurrentView(view)
    onViewChange?.(view)
  }

  const handleOrderTabChange = (tab: OrderTabType) => {
    setOrderTab(tab)
    onOrderTabChange?.(tab)
  }

  const handleLogoutClick = () => {
    if (window.confirm('로그아웃 하시겠습니까?')) {
      onLogout?.()
    }
  }

  return (
    <header className={styles.header}>
      <div className={styles.left}>
        <h1 className={styles.storeName}>{storeName}</h1>
        {tableNumber && (
          <span className={styles.tableNumber}>
            테이블 {tableNumber}번
          </span>
        )}
      </div>

      <div className={styles.center}>
        {currentView === 'order' && (
          <div className={styles.tabs}>
            <button
              className={`${styles.tab} ${orderTab === 'tll' ? styles.active : ''}`}
              onClick={() => handleOrderTabChange('tll')}
            >
              TLL 주문
            </button>
            <button
              className={`${styles.tab} ${orderTab === 'pos' ? styles.active : ''}`}
              onClick={() => handleOrderTabChange('pos')}
            >
              POS 주문
            </button>
            <button
              className={`${styles.tab} ${orderTab === 'all' ? styles.active : ''}`}
              onClick={() => handleOrderTabChange('all')}
            >
              전체
            </button>
          </div>
        )}
      </div>

      <div className={styles.right}>
        <button
          className={`${styles.viewBtn} ${currentView === 'table' ? styles.active : ''}`}
          onClick={() => handleViewChange('table')}
        >
          🗺️ 테이블
        </button>
        <button
          className={`${styles.viewBtn} ${currentView === 'order' ? styles.active : ''}`}
          onClick={() => handleViewChange('order')}
          disabled={!tableNumber}
        >
          📝 주문
        </button>
        <button
          className={`${styles.viewBtn} ${currentView === 'payment' ? styles.active : ''}`}
          onClick={() => handleViewChange('payment')}
          disabled={!tableNumber}
        >
          💳 결제
        </button>
        {onLogout && (
          <button
            className={styles.logoutBtn}
            onClick={handleLogoutClick}
            title="로그아웃"
          >
            🚪
          </button>
        )}
      </div>
    </header>
  )
}
