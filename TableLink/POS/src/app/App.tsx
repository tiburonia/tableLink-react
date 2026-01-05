import { useEffect, useCallback } from 'react'
import { usePosStore } from '@/shared/stores'
import { wsClient } from '@/shared/api'
import { tableApi } from '@/entities/table'
import { Header } from '@/widgets/header'
import { TableMapPage } from '@/pages/table-map'
import { OrderPage } from '@/pages/order'
import { LoadingSpinner } from '@/shared/ui'
import './styles/global.css'

// 임시 store 정보 (실제로는 로그인 정보에서 가져옴)
const STORE_ID = 1
const STORE_NAME = 'TableLink POS'

function App() {
  const {
    currentView,
    selectedTable,
    isLoading,
    error,
    setCurrentView,
    selectTable,
    setTables,
    clearError,
  } = usePosStore()

  // WebSocket 연결 및 실시간 업데이트 처리
  useEffect(() => {
    // 테이블 상태 갱신 함수
    const refreshTables = async () => {
      try {
        const data = await tableApi.getStoreTables(STORE_ID)
        setTables(data)
      } catch (err) {
        console.error('테이블 상태 갱신 실패:', err)
      }
    }

    wsClient.connect({
      storeId: STORE_ID,
      onConnect: () => {
        console.log('✅ POS WebSocket 연결됨')
      },
      onDisconnect: () => {
        console.log('❌ POS WebSocket 연결 해제됨')
      },
      // 테이블 상태 변경 시 실시간 갱신
      onTableUpdate: (data) => {
        console.log('📊 테이블 업데이트:', data)
        refreshTables()
      },
      // 새 주문 시 테이블 상태 갱신
      onNewOrder: (data) => {
        console.log('🆕 새 주문:', data)
        refreshTables()
      },
      // 주문 업데이트 시 테이블 상태 갱신
      onOrderUpdate: (data) => {
        console.log('📝 주문 업데이트:', data)
        refreshTables()
      },
      // TLL 주문 시 테이블 상태 갱신
      onTLLOrder: (data) => {
        console.log('📱 TLL 주문:', data)
        refreshTables()
      },
      // 결제 완료 시 테이블 상태 갱신
      onPaymentComplete: (data) => {
        console.log('💳 결제 완료:', data)
        refreshTables()
      },
    })

    return () => {
      wsClient.disconnect()
    }
  }, [setTables])

  const handleTableSelect = useCallback((tableNumber: number) => {
    selectTable(tableNumber)
    setCurrentView('order')
  }, [selectTable, setCurrentView])

  const handleBackToTable = useCallback(() => {
    selectTable(null)
    setCurrentView('table')
  }, [selectTable, setCurrentView])

  const handleOrderComplete = useCallback(() => {
    // 주문 완료 후 처리 (토스트 알림 등)
    console.log('주문 완료')
  }, [])

  // 에러 표시
  useEffect(() => {
    if (error) {
      // 실제로는 토스트 알림으로 표시
      console.error(error)
      const timer = setTimeout(() => clearError(), 5000)
      return () => clearTimeout(timer)
    }
  }, [error, clearError])

  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="loading-container">
          <LoadingSpinner size="large" text="로딩 중..." />
        </div>
      )
    }

    switch (currentView) {
      case 'table':
        return (
          <TableMapPage
            storeId={STORE_ID}
            onTableSelect={handleTableSelect}
          />
        )
      case 'order':
        if (!selectedTable) {
          setCurrentView('table')
          return null
        }
        return (
          <OrderPage
            storeId={STORE_ID}
            tableNumber={selectedTable}
            onOrderComplete={handleOrderComplete}
            onBack={handleBackToTable}
          />
        )
      case 'payment':
        // 결제 페이지는 추후 구현
        return (
          <div className="coming-soon">
            <h2>결제 기능 준비 중</h2>
            <p>곧 업데이트 예정입니다.</p>
          </div>
        )
      default:
        return null
    }
  }

  return (
    <div className="app">
      <Header
        storeName={STORE_NAME}
        tableNumber={selectedTable ?? undefined}
      />
      <main className="main-content">
        {renderContent()}
      </main>

      {error && (
        <div className="error-toast" onClick={clearError}>
          {error}
        </div>
      )}
    </div>
  )
}

export default App
