import { Routes, Route, Navigate } from 'react-router-dom'
import { DashboardPage } from '@/pages/Dashboard'
import { StoresPage } from '@/pages/Stores'
import { UsersPage } from '@/pages/Users'
import { OrdersPage } from '@/pages/Orders'
import { ReviewsPage } from '@/pages/Reviews'
import { SettingsPage } from '@/pages/Settings'

export function AppRouter() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="/dashboard" element={<DashboardPage />} />
      <Route path="/stores" element={<StoresPage />} />
      <Route path="/users" element={<UsersPage />} />
      <Route path="/orders" element={<OrdersPage />} />
      <Route path="/reviews" element={<ReviewsPage />} />
      <Route path="/settings" element={<SettingsPage />} />
    </Routes>
  )
}
