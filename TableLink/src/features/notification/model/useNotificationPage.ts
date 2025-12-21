/**
 * useNotificationPage - 알림 페이지 상태 관리
 * 
 * FSD 원칙: 유저 행동 "알림 조회/탭 전환/읽음 처리"의 상태와 로직을 관리
 */

import { useState, useEffect, useCallback } from 'react'
import type { Notification, NotificationType } from './notificationService'
import { getNotifications, markAllAsRead } from './notificationService'

export function useNotificationPage() {
  const [currentTab, setCurrentTab] = useState<NotificationType>('all')
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const tabs = [
    { id: 'all' as NotificationType, label: '전체', icon: '📢' },
    { id: 'order' as NotificationType, label: '주문', icon: '🍽️' },
    { id: 'promotion' as NotificationType, label: '프로모션', icon: '🎁' },
    { id: 'system' as NotificationType, label: '시스템', icon: '⚙️' }
  ]

  const loadNotifications = useCallback(async () => {
    setIsLoading(true)
    setError(null)

    const userInfo = localStorage.getItem('user')
    const userId = userInfo ? JSON.parse(userInfo).user_pk : 0
    
    if (!userId) {
      setError('로그인이 필요합니다.')
      setIsLoading(false)
      return
    }

    const data = await getNotifications(userId, currentTab)
    
    setNotifications(data.notifications)
    setUnreadCount(data.unreadCount)
    setIsLoading(false)
  }, [currentTab])

  useEffect(() => {
    loadNotifications()
  }, [loadNotifications])

  const handleTabChange = useCallback((tabId: NotificationType) => {
    setCurrentTab(tabId)
  }, [])

  const handleMarkAllAsRead = useCallback(async () => {
    const userInfo = localStorage.getItem('user')
    const userId = userInfo ? JSON.parse(userInfo).user_pk : 0
    if (!userId) return

    const success = await markAllAsRead(userId)
    if (success) {
      setNotifications(prev => 
        prev.map(n => ({ ...n, isRead: true }))
      )
      setUnreadCount(0)
    }
  }, [])

  const handleNotificationRead = useCallback(() => {
    loadNotifications()
  }, [loadNotifications])

  return {
    // 상태
    currentTab,
    notifications,
    unreadCount,
    isLoading,
    error,
    tabs,
    // 액션
    handleTabChange,
    handleMarkAllAsRead,
    handleNotificationRead,
    refetch: loadNotifications,
  }
}
