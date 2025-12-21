import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useState } from 'react'
import { LoginPage } from '@/pages/Login'
import { MainPage } from '@/pages/Main/MainPage'
import { authService } from '@/shared/api/authService'
import { StorePage } from '@/pages/Store'
import { PaymentPage } from '@/pages/Payment'
import { QRPage } from '@/pages/QR'
import { OrderPage } from '@/pages/Order'
import { PayPage } from '@/pages/Pay'
import { MyPage } from '@/pages/MyPage'
import { MapPage } from '@/pages/Map'
import { OrderHistory } from '@/pages/OrderHistory'
import { RegularPage } from '@/pages/Regular'
import { NotificationPage } from '@/pages/Notifications'
import { SettingsPage } from '@/pages/Settings'


export const AppRouter = () => {

  const [isLoggedIn, setIsLoggedIn] = useState(authService.isAuthenticated());
  const userInfo = authService.getUser();

  const handleLogout = () => {
    localStorage.clear()
    window.location.href = '/login'
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage setIsLoggedIn={setIsLoggedIn} />} />
        <Route path="/" element={isLoggedIn ? <Navigate to="/main" replace /> : <Navigate to="/login" replace />} />
        <Route path="/main" element={isLoggedIn ? <MainPage /> : <Navigate to="/login" replace />} />
        <Route path="/map" element={isLoggedIn ? <MapPage /> : <Navigate to="/login" replace />} />
        <Route path="/mypage" element={isLoggedIn ? <MyPage onLogout={handleLogout} userInfo={userInfo} /> : <Navigate to="/login" replace />} />
        <Route path="/orders" element={isLoggedIn ? <OrderHistory userInfo={userInfo} /> : <Navigate to="/login" replace />} />
        <Route path="/qr" element={isLoggedIn ? <QRPage /> : <Navigate to="/login" replace />} />
        <Route path="/rp" element={isLoggedIn ? <RegularPage /> : <Navigate to="/login" replace />} />
        <Route path="/notifications" element={isLoggedIn ? <NotificationPage /> : <Navigate to="/login" replace />} />
        <Route path="/setting" element={isLoggedIn ? <SettingsPage onLogout={handleLogout} userInfo={userInfo} /> : <Navigate to="/login" replace />} />
        <Route path="/p/:storeId" element={isLoggedIn ? <OrderPage /> : <Navigate to="/login" replace />} />
        <Route path="/pay" element={isLoggedIn ? <PayPage /> : <Navigate to="/login" replace />} />
        <Route path="/payment/*" element={<PaymentPage />} />
        <Route path="/payment/success" element={<PaymentPage />} />
        <Route path="/payment/fail" element={<PaymentPage />} />
        <Route path="/rs/:storeId" element={isLoggedIn ? <StorePage /> : <Navigate to="/login" replace />} />
          
        <Route path="*" element={<Navigate to={isLoggedIn ? "/main" : "/login"} replace />} />
      </Routes>
    </BrowserRouter>
  )
}
