
import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import './App.css';

// Pages
import LoginPage from './pages/LoginPage';
import SignUpPage from './pages/SignUpPage';
import MapPage from './pages/MapPage';
import StorePage from './pages/StorePage';
import MyPage from './pages/MyPage';
import OrderPage from './pages/OrderPage';
import PaymentPage from './pages/PaymentPage';
import NotFoundPage from './pages/NotFoundPage';

// Providers
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from './contexts/AuthContext';

// React Query 클라이언트 설정
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5분
      retry: 1,
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            {/* 인증 페이지 */}
            <Route path="/login" element={<LoginPage />} />
            <Route path="/signup" element={<SignUpPage />} />

            {/* 메인 페이지 */}
            <Route path="/map" element={<MapPage />} />
            
            {/* 매장 페이지 */}
            <Route path="/store/:storeId" element={<StorePage />} />
            
            {/* 마이페이지 */}
            <Route path="/mypage" element={<MyPage />} />
            
            {/* 주문/결제 */}
            <Route path="/order/:storeId" element={<OrderPage />} />
            <Route path="/payment" element={<PaymentPage />} />
            
            {/* 기본 라우팅 */}
            <Route path="/" element={<Navigate to="/login" replace />} />
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
