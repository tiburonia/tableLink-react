import { useEffect, useCallback, useState, useRef } from 'react'
import { usePosStore } from '@/shared/stores'
import { wsClient, authApi } from '@/shared/api'
import type { Store } from '@/shared/api'
import { tableApi } from '@/entities/table'
import { Header } from '@/widgets/header'
import { TableMapPage } from '@/pages/table-map'
import { OrderPage } from '@/pages/order'
import { LoginPage } from '@/pages/login'
import { LoadingSpinner } from '@/shared/ui'
import './styles/global.css'

/**
 * URL에서 storeId 파라미터 추출
 */
function getStoreIdFromURL(): number | null {
  const params = new URLSearchParams(window.location.search)
  const storeId = params.get('storeId')
  return storeId ? parseInt(storeId, 10) : null
}

/**
 * URL 파라미터 설정 (히스토리 변경 없이)
 */
function setStoreIdToURL(storeId: number): void {
  const url = new URL(window.location.href)
  url.searchParams.set('storeId', String(storeId))
  window.history.replaceState({}, '', url.toString())
}

/**
 * URL 파라미터 제거
 */
function clearStoreIdFromURL(): void {
  const url = new URL(window.location.href)
  url.searchParams.delete('storeId')
  window.history.replaceState({}, '', url.toString())
}

function App() {
  // 인증 및 매장 상태
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [currentStore, setCurrentStore] = useState<Store | null>(null)
  const [isInitializing, setIsInitializing] = useState(true)
  
  // 테이블 로딩 플래그 (1회만 로딩)
  const hasLoadedTables = useRef(false)

  const {
    currentView,
    selectedTable,
    isLoading,
    error,
    setCurrentView,
    selectTable,
    setTables,
    setLoading,
    clearError,
  } = usePosStore()

  // =================== 초기화 ===================
  useEffect(() => {
    const initialize = async () => {
      console.log('🚀 [POS] 시스템 초기화 시작')
      
      // 1. URL에서 storeId 확인
      const urlStoreId = getStoreIdFromURL()
      
      // 2. localStorage에서 인증 정보 확인
      const isAuth = authApi.isAuthenticated()
      const savedStore = authApi.getStore()
      
      if (urlStoreId && isAuth && savedStore && savedStore.id === urlStoreId) {
        // URL storeId와 저장된 매장이 일치 - 바로 POS 진입
        console.log('✅ [POS] URL 파라미터로 매장 확인:', savedStore.name)
        setIsAuthenticated(true)
        setCurrentStore(savedStore)
      } else if (isAuth && savedStore) {
        // 인증은 있지만 URL에 storeId 없음 - URL 설정
        console.log('✅ [POS] 저장된 매장 정보로 진입:', savedStore.name)
        setStoreIdToURL(savedStore.id)
        setIsAuthenticated(true)
        setCurrentStore(savedStore)
      } else {
        // 인증 정보 없음 - 로그인 필요
        console.log('🔐 [POS] 로그인 필요')
        setIsAuthenticated(false)
        setCurrentStore(null)
        clearStoreIdFromURL()
        
        // 불완전한 인증 정보 클리어
        if (isAuth && !savedStore) {
          authApi.logout()
        }
      }
      
      setIsInitializing(false)
    }

    initialize()
  }, [])

  // =================== 테이블 로딩 (1회만) ===================
  useEffect(() => {
    if (!currentStore || hasLoadedTables.current) return

    const loadTables = async () => {
      console.log(`🗺️ [POS] 테이블 로딩 시작 - 매장 ${currentStore.id}`)
      setLoading(true)
      
      try {
        const data = await tableApi.getStoreTables(currentStore.id)
        setTables(data)
        hasLoadedTables.current = true
        console.log(`✅ [POS] 테이블 ${data.length}개 로드 완료`)
      } catch (err) {
        console.error('❌ [POS] 테이블 로딩 실패:', err)
      } finally {
        setLoading(false)
      }
    }

    loadTables()
  }, [currentStore, setTables, setLoading])

  // =================== WebSocket 실시간 업데이트 ===================
  useEffect(() => {
    if (!currentStore) return

    const storeId = currentStore.id
    let debounceTimer: ReturnType<typeof setTimeout> | null = null

    // 테이블 갱신 (debounced)
    const refreshTables = () => {
      if (debounceTimer) clearTimeout(debounceTimer)
      
      debounceTimer = setTimeout(async () => {
        try {
          console.log('🔄 [POS] 실시간 테이블 갱신')
          const data = await tableApi.getStoreTables(storeId)
          setTables(data)
        } catch (err) {
          console.error('❌ 테이블 갱신 실패:', err)
        }
      }, 500)
    }

    wsClient.connect({
      storeId,
      onConnect: () => {
        console.log('✅ [POS] WebSocket 연결됨')
      },
      onDisconnect: () => {
        console.log('❌ [POS] WebSocket 연결 해제됨')
      },
      onTableUpdate: (data) => {
        console.log('📊 테이블 업데이트:', data)
        refreshTables()
      },
      onNewOrder: (data) => {
        console.log('🆕 새 주문:', data)
        refreshTables()
      },
      onOrderUpdate: (data) => {
        console.log('📝 주문 업데이트:', data)
        refreshTables()
      },
      onTLLOrder: (data) => {
        console.log('📱 TLL 주문:', data)
        refreshTables()
      },
      onPaymentComplete: (data) => {
        console.log('💳 결제 완료:', data)
        refreshTables()
      },
    })

    return () => {
      if (debounceTimer) clearTimeout(debounceTimer)
      wsClient.disconnect()
    }
  }, [currentStore, setTables])

  // =================== 이벤트 핸들러 ===================
  
  // 로그인 성공 - URL 파라미터 설정 후 상태 업데이트
  const handleLoginSuccess = useCallback((store: Store) => {
    console.log('✅ [POS] 로그인 완료, 매장:', store.name)
    
    // URL 파라미터 설정 (레거시 방식)
    setStoreIdToURL(store.id)
    
    // 테이블 로딩 플래그 리셋
    hasLoadedTables.current = false
    
    setIsAuthenticated(true)
    setCurrentStore(store)
  }, [])

  // 로그아웃
  const handleLogout = useCallback(() => {
    console.log('👋 [POS] 로그아웃')
    
    // WebSocket 연결 해제
    wsClient.disconnect()
    
    // 인증 정보 클리어
    authApi.logout()
    
    // URL 파라미터 제거
    clearStoreIdFromURL()
    
    // 상태 리셋
    hasLoadedTables.current = false
    setIsAuthenticated(false)
    setCurrentStore(null)
    selectTable(null)
    setCurrentView('table')
  }, [selectTable, setCurrentView])

  // 테이블 선택
  const handleTableSelect = useCallback((tableNumber: number) => {
    selectTable(tableNumber)
    setCurrentView('order')
  }, [selectTable, setCurrentView])

  // 테이블맵으로 돌아가기
  const handleBackToTable = useCallback(() => {
    selectTable(null)
    setCurrentView('table')
  }, [selectTable, setCurrentView])

  // 주문 완료
  const handleOrderComplete = useCallback(() => {
    console.log('✅ 주문 완료')
  }, [])

  // 에러 자동 클리어
  useEffect(() => {
    if (error) {
      console.error(error)
      const timer = setTimeout(() => clearError(), 5000)
      return () => clearTimeout(timer)
    }
  }, [error, clearError])

  // =================== 렌더링 ===================

  // 초기화 중 로딩
  if (isInitializing) {
    return (
      <div className="app">
        <div className="loading-container" style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <LoadingSpinner size="large" text="🍴 POS 시스템 초기화 중..." />
        </div>
      </div>
    )
  }

  // 미인증 - 로그인 페이지
  if (!isAuthenticated || !currentStore) {
    return <LoginPage onLoginSuccess={handleLoginSuccess} />
  }

  // 메인 콘텐츠 렌더링
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
            storeId={currentStore.id}
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
            storeId={currentStore.id}
            tableNumber={selectedTable}
            onOrderComplete={handleOrderComplete}
            onBack={handleBackToTable}
          />
        )
      case 'payment':
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
        storeName={currentStore.name}
        tableNumber={selectedTable ?? undefined}
        onLogout={handleLogout}
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