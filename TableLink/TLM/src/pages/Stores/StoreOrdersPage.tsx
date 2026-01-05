import { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import * as authApi from '@/shared/api/authApi'
import styles from './StoreOrdersPage.module.css'

// 더미 주문 데이터
const dummyOrders = [
  {
    id: 1,
    orderNumber: '#2026010201',
    tableNumber: 'A-3',
    status: 'pending',
    createdAt: '2026-01-02 12:30',
    items: [
      { name: '된장찌개', quantity: 2, price: 16000 },
      { name: '공기밥', quantity: 2, price: 2000 },
      { name: '콜라', quantity: 1, price: 2000 },
    ],
    totalAmount: 20000,
    request: '된장찌개는 덜 짜게 해주세요',
  },
  {
    id: 2,
    orderNumber: '#2026010202',
    tableNumber: 'B-1',
    status: 'cooking',
    createdAt: '2026-01-02 12:25',
    items: [
      { name: '김치찌개', quantity: 1, price: 9000 },
      { name: '제육볶음', quantity: 1, price: 12000 },
      { name: '공기밥', quantity: 2, price: 2000 },
    ],
    totalAmount: 23000,
    request: null,
  },
  {
    id: 3,
    orderNumber: '#2026010203',
    tableNumber: 'A-1',
    status: 'ready',
    createdAt: '2026-01-02 12:20',
    items: [
      { name: '비빔밥', quantity: 3, price: 27000 },
      { name: '된장국', quantity: 3, price: 6000 },
    ],
    totalAmount: 33000,
    request: null,
  },
  {
    id: 4,
    orderNumber: '#2026010204',
    tableNumber: 'C-2',
    status: 'completed',
    createdAt: '2026-01-02 11:45',
    items: [
      { name: '삼겹살 세트', quantity: 2, price: 40000 },
      { name: '소주', quantity: 2, price: 8000 },
      { name: '음료', quantity: 2, price: 4000 },
    ],
    totalAmount: 52000,
    request: '고기는 잘 익혀주세요',
  },
  {
    id: 5,
    orderNumber: '#2026010205',
    tableNumber: 'B-3',
    status: 'cancelled',
    createdAt: '2026-01-02 11:30',
    items: [
      { name: '냉면', quantity: 1, price: 10000 },
    ],
    totalAmount: 10000,
    request: null,
  },
]

type OrderStatus = 'all' | 'pending' | 'cooking' | 'ready' | 'completed' | 'cancelled'

const statusLabels: Record<string, string> = {
  pending: '접수 대기',
  cooking: '조리 중',
  ready: '조리 완료',
  completed: '완료',
  cancelled: '취소',
}

export function StoreOrdersPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const [activeTab, setActiveTab] = useState<OrderStatus>('all')
  const [orders, setOrders] = useState(dummyOrders)

  // 로그아웃 핸들러
  const handleLogout = () => {
    authApi.logout()
    localStorage.removeItem('tlm_stores')
    localStorage.removeItem('tlm_current_store_id')
    localStorage.removeItem('tlm_current_store')
    window.location.reload()
  }

  // 바텀바 활성 상태 확인
  const isActive = (path: string) => location.pathname === path || location.pathname.startsWith(path + '/')

  // 필터링된 주문 목록
  const filteredOrders = activeTab === 'all' 
    ? orders 
    : orders.filter(order => order.status === activeTab)

  // 상태별 카운트
  const statusCounts = {
    all: orders.length,
    pending: orders.filter(o => o.status === 'pending').length,
    cooking: orders.filter(o => o.status === 'cooking').length,
    ready: orders.filter(o => o.status === 'ready').length,
    completed: orders.filter(o => o.status === 'completed').length,
    cancelled: orders.filter(o => o.status === 'cancelled').length,
  }

  // 주문 상태 변경 핸들러
  const handleStatusChange = (orderId: number, newStatus: string) => {
    setOrders(prev => 
      prev.map(order => 
        order.id === orderId ? { ...order, status: newStatus } : order
      )
    )
  }

  // 다음 상태로 이동
  const getNextStatus = (currentStatus: string) => {
    const statusFlow: Record<string, string> = {
      pending: 'cooking',
      cooking: 'ready',
      ready: 'completed',
    }
    return statusFlow[currentStatus] || null
  }

  // 다음 상태 버튼 텍스트
  const getNextActionText = (currentStatus: string) => {
    const actionTexts: Record<string, string> = {
      pending: '접수하기',
      cooking: '조리완료',
      ready: '완료처리',
    }
    return actionTexts[currentStatus] || null
  }

  return (
    <div className="mobile-app">
      <div className="mobile-content">
        <div className={styles.page}>
          {/* 헤더 */}
          <header className={styles.header}>
            <div className={styles.headerTop}>
              <div className={styles.headerLeft}>
                <button className={styles.backBtn} onClick={() => navigate('/')}>
                  ←
                </button>
                <h1 className={styles.headerTitle}>주문 관리</h1>
              </div>
              <button className={styles.filterBtn}>
                🔄 새로고침
              </button>
            </div>
          </header>

          {/* 탭 필터 */}
          <div className={styles.tabFilter}>
            <button 
              className={`${styles.tabBtn} ${activeTab === 'all' ? styles.active : ''}`}
              onClick={() => setActiveTab('all')}
            >
              전체 <span className={styles.badge}>{statusCounts.all}</span>
            </button>
            <button 
              className={`${styles.tabBtn} ${activeTab === 'pending' ? styles.active : ''}`}
              onClick={() => setActiveTab('pending')}
            >
              접수대기 <span className={styles.badge}>{statusCounts.pending}</span>
            </button>
            <button 
              className={`${styles.tabBtn} ${activeTab === 'cooking' ? styles.active : ''}`}
              onClick={() => setActiveTab('cooking')}
            >
              조리중 <span className={styles.badge}>{statusCounts.cooking}</span>
            </button>
            <button 
              className={`${styles.tabBtn} ${activeTab === 'ready' ? styles.active : ''}`}
              onClick={() => setActiveTab('ready')}
            >
              조리완료 <span className={styles.badge}>{statusCounts.ready}</span>
            </button>
            <button 
              className={`${styles.tabBtn} ${activeTab === 'completed' ? styles.active : ''}`}
              onClick={() => setActiveTab('completed')}
            >
              완료 <span className={styles.badge}>{statusCounts.completed}</span>
            </button>
          </div>

          {/* 메인 콘텐츠 */}
          <main className={styles.main}>
            {filteredOrders.length === 0 ? (
              <div className={styles.emptyState}>
                <span>📋</span>
                <h3>주문이 없습니다</h3>
                <p>해당 상태의 주문이 없습니다.</p>
              </div>
            ) : (
              <div className={styles.orderList}>
                {filteredOrders.map(order => (
                  <div key={order.id} className={`${styles.orderCard} ${styles[order.status]}`}>
                    {/* 주문 헤더 */}
                    <div className={styles.orderHeader}>
                      <div className={styles.orderInfo}>
                        <span className={styles.orderNumber}>{order.orderNumber}</span>
                        <div className={styles.orderMeta}>
                          <span className={styles.tableBadge}>🪑 {order.tableNumber}</span>
                          <span className={styles.orderTime}>{order.createdAt}</span>
                        </div>
                      </div>
                      <span className={`${styles.orderStatus} ${styles[order.status]}`}>
                        {statusLabels[order.status]}
                      </span>
                    </div>

                    {/* 주문 아이템 */}
                    <div className={styles.orderItems}>
                      {order.items.map((item, idx) => (
                        <div key={idx} className={styles.orderItem}>
                          <div className={styles.itemInfo}>
                            <span className={styles.itemName}>{item.name}</span>
                            <span className={styles.itemQty}>x{item.quantity}</span>
                          </div>
                          <span className={styles.itemPrice}>
                            ₩{item.price.toLocaleString()}
                          </span>
                        </div>
                      ))}
                    </div>

                    {/* 요청사항 */}
                    {order.request && (
                      <div className={styles.orderRequest}>
                        <span className={styles.requestLabel}>📝 요청사항</span>
                        <p className={styles.requestText}>{order.request}</p>
                      </div>
                    )}

                    {/* 주문 푸터 */}
                    <div className={styles.orderFooter}>
                      <div className={styles.orderTotal}>
                        <span className={styles.totalLabel}>총 결제금액</span>
                        <span className={styles.totalAmount}>
                          ₩{order.totalAmount.toLocaleString()}
                        </span>
                      </div>
                      
                      {/* 액션 버튼 */}
                      {order.status !== 'completed' && order.status !== 'cancelled' && (
                        <div className={styles.orderActions}>
                          {order.status === 'pending' && (
                            <button 
                              className={`${styles.actionBtn} ${styles.danger}`}
                              onClick={() => handleStatusChange(order.id, 'cancelled')}
                            >
                              거절
                            </button>
                          )}
                          {getNextStatus(order.status) && (
                            <button 
                              className={`${styles.actionBtn} ${styles.primary}`}
                              onClick={() => handleStatusChange(order.id, getNextStatus(order.status)!)}
                            >
                              {getNextActionText(order.status)}
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </main>

          {/* 하단 네비게이션 */}
          <nav className={styles.bottomNav}>
            <button 
              className={`${styles.navItem} ${isActive('/') && !isActive('/orders') ? styles.active : ''}`}
              onClick={() => navigate('/')}
            >
              <span>🏠</span>
              <span>홈</span>
            </button>
            <button 
              className={`${styles.navItem} ${isActive('/orders') ? styles.active : ''}`}
              onClick={() => navigate('/orders')}
            >
              <span>📋</span>
              <span>주문</span>
            </button>
            <button 
              className={`${styles.navItem} ${isActive('/preview') ? styles.active : ''}`}
              onClick={() => navigate('/preview')}
            >
              <span>👁️</span>
              <span>미리보기</span>
            </button>
            <button 
              className={`${styles.navItem} ${isActive('/settings') ? styles.active : ''}`}
              onClick={() => navigate('/settings')}
            >
              <span>⚙️</span>
              <span>설정</span>
            </button>
            <button className={styles.navItem} onClick={handleLogout}>
              <span>🚪</span>
              <span>로그아웃</span>
            </button>
          </nav>
        </div>
      </div>
    </div>
  )
}
