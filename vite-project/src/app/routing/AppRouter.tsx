import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { LoginPage } from '@/pages/Login'
import { MainPage } from '@/pages/Main/MainPage'
import { authService } from '@/shared/api/authService'
import { StorePage } from '@/pages/Store'
import { PaymentPage } from '@/pages/Main/components/PaymentPage'


export const AppRouter = () => {
  const isLoggedIn = authService.isAuthenticated()

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/" element={isLoggedIn ? <Navigate to="/main" replace /> : <Navigate to="/login" replace />} />
        <Route path="/main/*" element={isLoggedIn ? <MainPage /> : <Navigate to="/login" replace />} />
        <Route path="/payment/success" element={<PaymentPage />} />
        <Route path="/payment/fail" element={<PaymentPage />} />
        <Route path="/rs/:storeId" element={isLoggedIn ? <StorePage /> : <Navigate to="/login" replace />} />
        <Route path="*" element={<Navigate to={isLoggedIn ? "/main" : "/login"} replace />} />
      </Routes>
    </BrowserRouter>
  )
}
