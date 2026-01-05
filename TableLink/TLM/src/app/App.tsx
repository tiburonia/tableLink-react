import { useState, useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthPage } from '@/pages/Auth'
import { AddStorePage, StoreRegistrationPage, StoreDashboardPage, StorePreviewPage, MenuManagementPage, TableManagementPage, StoreSettingsPage, StoreOrdersPage } from '@/pages/Stores'
import * as authApi from '@/shared/api/authApi'
import * as storeApi from '@/shared/api/storeApi'
import '@/index.css'

function App() {
  // 인증 상태 관리
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [hasStores, setHasStores] = useState(false)
  const [currentStoreId, setCurrentStoreId] = useState<number | null>(null)

  // 초기 로딩 시 인증 상태 및 매장 소유 여부 확인
  useEffect(() => {
    const checkAuthAndStores = async () => {
      const authenticated = authApi.isAuthenticated()
      setIsAuthenticated(authenticated)
      
      if (!authenticated) {
        setIsLoading(false)
        return
      }

      // 로그인된 회원 정보 가져오기
      const member = authApi.getMember()
      if (!member || !member.id) {
        setIsLoading(false)
        return
      }

      try {
        // store_members 테이블에서 해당 member_id로 매장 조회
        console.log('🔍 회원의 매장 소유 여부 확인:', member.id)
        const response = await storeApi.getMyStores(member.id)
        
        console.log('📦 API 응답:', response)
        
        if (response.success && response.stores && response.stores.length > 0 && response.count && response.count > 0) {
          // 매장이 존재하면 첫 번째 매장 ID 저장
          const firstStore = response.stores[0]
          console.log('✅ 소유 매장 발견:', firstStore.name, '(ID:', firstStore.id, ') - 대시보드로 이동')
          setHasStores(true)
          setCurrentStoreId(firstStore.id)
          
          // localStorage에도 저장
          localStorage.setItem('tlm_stores', JSON.stringify(response.stores))
          localStorage.setItem('tlm_current_store_id', String(firstStore.id))
        } else {
          // 매장이 없음
          console.log('📭 소유 매장 없음 - 매장 추가 페이지로 이동')
          setHasStores(false)
          setCurrentStoreId(null)
          localStorage.removeItem('tlm_stores')
          localStorage.removeItem('tlm_current_store_id')
        }
      } catch (error) {
        console.error('❌ 매장 조회 실패:', error)
        setHasStores(false)
      } finally {
        setIsLoading(false)
      }
    }
    
    checkAuthAndStores()
  }, [])

  // 로딩 중
  if (isLoading) {
    return (
      <div className="mobile-app">
        <div className="mobile-content" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>🏪</div>
            <p>로딩 중...</p>
          </div>
        </div>
      </div>
    )
  }

  // 로그인되지 않은 경우 AuthPage 표시
  if (!isAuthenticated) {
    return (
      <BrowserRouter>
        <AuthPage />
      </BrowserRouter>
    )
  }

  // 로그인된 경우 라우팅 처리
  return (
    <BrowserRouter>
      <Routes>
        {/* 매장 등록 페이지 */}
        <Route path="/register-store" element={<StoreRegistrationPage />} />
        
        {/* 매장 대시보드 (등록 완료 후) */}
        <Route 
          path="/store" 
          element={
            hasStores && currentStoreId 
              ? <StoreDashboardPage storeId={currentStoreId} /> 
              : <Navigate to="/add-store" replace />
          } 
        />
        
        {/* 매장 미리보기 페이지 */}
        <Route path="/preview" element={<StorePreviewPage />} />
        
        {/* 매장 추가 페이지 */}
        <Route path="/add-store" element={<AddStorePage />} />
        
        {/* 기본 경로 - 매장 유무에 따라 분기 */}
        <Route 
          path="/" 
          element={
            hasStores && currentStoreId
              ? <StoreDashboardPage storeId={currentStoreId} />
              : <AddStorePage />
          } 
        />
        
        {/* 매장 관련 하위 페이지들 */}
        <Route path="/stores/:storeId/menu" element={<MenuManagementPage />} />
        <Route path="/stores/:storeId/tables" element={<TableManagementPage />} />
        <Route path="/stores/:storeId/promotions" element={<StoreDashboardPage storeId={currentStoreId || undefined} />} />
        <Route path="/stores/:storeId/photos" element={<StoreDashboardPage storeId={currentStoreId || undefined} />} />
        <Route path="/stores/:storeId/reviews" element={<StoreDashboardPage storeId={currentStoreId || undefined} />} />
        
        {/* 설정 페이지 */}
        <Route path="/settings" element={<StoreSettingsPage />} />
        
        {/* 주문 관리 페이지 */}
        <Route path="/orders" element={<StoreOrdersPage />} />
        
        {/* 기타 경로는 홈으로 리다이렉트 */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
