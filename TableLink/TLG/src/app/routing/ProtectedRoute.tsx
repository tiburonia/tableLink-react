/**
 * ProtectedRoute - 인증이 필요한 라우트 보호
 * 
 * FSD 원칙: app 레이어에서 인증 체크 로직 캡슐화
 */

import { Navigate } from 'react-router-dom'
import { useAuthStore } from '@/features/auth'

interface ProtectedRouteProps {
  children: React.ReactNode
}

export const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const { isAuthenticated } = useAuthStore()
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }
  
  return <>{children}</>
}
