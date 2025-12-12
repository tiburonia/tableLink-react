import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { LoginPage } from '@/pages/Login'
import { MainPage } from '@/pages/Main/MainPage'
import { authService } from '@/shared/api/authService'

// 로그인 여부에 따라 다른 페이지 렌더링
const RootPage = () => {
  const isLoggedIn = authService.isAuthenticated()
  return isLoggedIn ? <MainPage /> : <LoginPage />
}

export const AppRouter = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<RootPage />} />
        <Route path="*" element={<RootPage />} />
      </Routes>
    </BrowserRouter>
  )
}
