/**
 * KDS (Kitchen Display System) 메인 앱 컴포넌트
 */

import { useEffect } from 'react';
import { KDSProvider } from './context/KDSContext';
import { Header, TabBar, KDSGrid, LoadingScreen, ErrorScreen } from './components';
import { useKDSManager } from './hooks/useKDSManager';
import './App.css';

// URL에서 storeId 가져오기
function getStoreIdFromURL(): string {
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.get('storeId') || urlParams.get('store_id') || '1';
}

// KDS 메인 컨텐츠 컴포넌트
function KDSContent() {
  const storeId = getStoreIdFromURL();
  const {
    state,
    currentTickets,
    initialize,
    switchTab,
    startCooking,
    markComplete,
    printOrder,
    refresh,
    showSettings,
  } = useKDSManager({ storeId });

  // 초기화
  useEffect(() => {
    initialize();
  }, [initialize]);

  // 로딩 중
  if (state.isLoading && state.tickets.size === 0) {
    return <LoadingScreen />;
  }

  // 에러 발생
  if (state.error) {
    return <ErrorScreen message={state.error} onRetry={() => window.location.reload()} />;
  }

  return (
    <div className="kds-container">
      <Header onRefresh={refresh} />
      <TabBar onTabChange={switchTab} />
      <KDSGrid
        tickets={currentTickets}
        onStartCooking={startCooking}
        onMarkComplete={markComplete}
        onPrintOrder={printOrder}
        onShowSettings={showSettings}
      />
    </div>
  );
}

// 메인 App 컴포넌트
function App() {
  return (
    <KDSProvider>
      <KDSContent />
    </KDSProvider>
  );
}

export default App;
