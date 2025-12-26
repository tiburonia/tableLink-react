import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from '@/features/auth'
import { LoginPage } from '@/pages/Login'
import { MainPage } from '@/pages/Main/MainPage'
import { StorePage } from '@/pages/Store'
import { StoreFeedPage } from '@/pages/StoreFeed'
import { PaymentPage } from '@/pages/Payment'
import { QRPage } from '@/pages/QR'
import { OrderPage } from '@/pages/Order'
import { PayPage } from '@/pages/Pay'
import { MyPage } from '@/pages/MyPage'
import { MapPage } from '@/pages/Map'
import { SearchPage } from '@/pages/Search'
import { OrderSessionPage } from '@/pages/OrderSession'
import { OrderHistory } from '@/pages/OrderHistory'
import { RegularPage } from '@/pages/Regular'
import { NotificationPage } from '@/pages/Notifications'
import { SettingsPage } from '@/pages/Settings'
import { ReviewPage } from '@/pages/Review'
import { ProtectedRoute } from './ProtectedRoute'


export const AppRouter = () => {
  // FSD 원칙: Feature에서 인증 상태 관리
  const { isAuthenticated, user, logout } = useAuthStore()

  const handleLogout = () => {
    logout()
    window.location.href = '/login'
  }

  // userInfo 호환성 유지
  const userInfo = user ? {
    userId: user.id,
    name: user.nickname || user.username,
    username: user.username,
  } : undefined

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/" element={isAuthenticated ? <Navigate to="/main" replace /> : <Navigate to="/login" replace />} />
        <Route path="/main" element={<ProtectedRoute><MainPage /></ProtectedRoute>} />
        <Route path="/map" element={<ProtectedRoute><MapPage /></ProtectedRoute>} />
        <Route path="/search" element={<ProtectedRoute><SearchPage /></ProtectedRoute>} />
        <Route path="/mypage" element={<ProtectedRoute><MyPage onLogout={handleLogout} userInfo={userInfo} /></ProtectedRoute>} />
        <Route path="/orders" element={<ProtectedRoute><OrderHistory userInfo={userInfo} /></ProtectedRoute>} />
        <Route path="/qr" element={<ProtectedRoute><QRPage /></ProtectedRoute>} />
        <Route path="/rp" element={<ProtectedRoute><RegularPage /></ProtectedRoute>} />
        <Route path="/notifications" element={<ProtectedRoute><NotificationPage /></ProtectedRoute>} />
        <Route path="/setting" element={<ProtectedRoute><SettingsPage onLogout={handleLogout} userInfo={userInfo} /></ProtectedRoute>} />
        <Route path="/p/:storeId" element={<ProtectedRoute><OrderPage /></ProtectedRoute>} />
        <Route path="/pay" element={<ProtectedRoute><PayPage /></ProtectedRoute>} />
        <Route path="/payment/*" element={<PaymentPage />} />
        <Route path="/payment/success" element={<PaymentPage />} />
        <Route path="/payment/fail" element={<PaymentPage />} />
        <Route path="/rs/:storeId" element={<ProtectedRoute><StorePage /></ProtectedRoute>} />
        <Route path="/rs/:storeId/sf" element={<ProtectedRoute><StoreFeedPage /></ProtectedRoute>} />
        <Route path="/rs/:storeId/rv" element={<ProtectedRoute><ReviewPage /></ProtectedRoute>} />
        <Route path="/ns/:orderId" element={<ProtectedRoute><OrderSessionPage /></ProtectedRoute>} />
          
        <Route path="*" element={<Navigate to={isAuthenticated ? "/main" : "/login"} replace />} />
      </Routes>
    </BrowserRouter>
  )
}
