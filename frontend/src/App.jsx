
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

// Components
import ProtectedRoute from './components/ProtectedRoute';

// Providers
import { QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { queryClient } from './lib/queryClient';

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <AuthProvider>
        <BrowserRouter>
          <Routes>
            {/* 인증 페이지 */}
            <Route path="/login" element={<LoginPage />} />
            <Route path="/signup" element={<SignUpPage />} />

            {/* 보호된 페이지 */}
            <Route path="/map" element={<ProtectedRoute><MapPage /></ProtectedRoute>} />
            <Route path="/store/:storeId" element={<ProtectedRoute><StorePage /></ProtectedRoute>} />
            <Route path="/mypage" element={<ProtectedRoute><MyPage /></ProtectedRoute>} />
            <Route path="/order/:storeId" element={<ProtectedRoute><OrderPage /></ProtectedRoute>} />
            <Route path="/payment" element={<ProtectedRoute><PaymentPage /></ProtectedRoute>} />
            
            {/* 기본 라우팅 */}
            <Route path="/" element={<Navigate to="/login" replace />} />
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </BrowserRouter>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
