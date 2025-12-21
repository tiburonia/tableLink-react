/**
 * 알림 페이지
 */

import { useState, useEffect } from 'react';
import type { Notification, NotificationType } from './services/notificationService';
import { getNotifications, markAllAsRead } from './services/notificationService';
import { NotificationCard } from './components/NotificationCard';
import { BottomNavigation } from '../Main/components/BottomNavigation';
import './NotificationPage.css';

export const NotificationPage = () => {
  const [currentTab, setCurrentTab] = useState<NotificationType>('all');
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const tabs = [
    { id: 'all' as NotificationType, label: '전체', icon: '📢' },
    { id: 'order' as NotificationType, label: '주문', icon: '🍽️' },
    { id: 'promotion' as NotificationType, label: '프로모션', icon: '🎁' },
    { id: 'system' as NotificationType, label: '시스템', icon: '⚙️' }
  ];

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      setError(null);

      const userInfo = localStorage.getItem('user')
      const userId = userInfo ? JSON.parse(userInfo).user_pk : 0;
      if (!userId) {
        setError('로그인이 필요합니다.');
        setIsLoading(false);
        return;
      }

      const data = await getNotifications(userId, currentTab);
      
      setNotifications(data.notifications);
      setUnreadCount(data.unreadCount);
      setIsLoading(false);
    };

    loadData();
  }, [currentTab]);

  const loadNotifications = async () => {
    setIsLoading(true);
    setError(null);

    const userId = parseInt(localStorage.getItem('userId') || '0');
    if (!userId) {
      setError('로그인이 필요합니다.');
      setIsLoading(false);
      return;
    }

    const data = await getNotifications(userId, currentTab);
    
    setNotifications(data.notifications);
    setUnreadCount(data.unreadCount);
    setIsLoading(false);
  };

  const handleMarkAllAsRead = async () => {
    const userId = parseInt(localStorage.getItem('userId') || '0');
    if (!userId) return;

    const success = await markAllAsRead(userId);
    if (success) {
      setNotifications(prev => 
        prev.map(n => ({ ...n, isRead: true }))
      );
      setUnreadCount(0);
    }
  };

  const handleNotificationRead = () => {
    loadNotifications();
  };

  if (isLoading) {
    return (
      <div className="mobile-app">
        <div className="mobile-content">
          <div className="notification-loading">
            <div className="loading-spinner"></div>
            <p>알림을 불러오는 중...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mobile-app">
        <div className="mobile-content">
          <div className="notification-error">
            <div className="error-icon">⚠️</div>
            <h3>{error}</h3>
            <button onClick={loadNotifications} className="retry-btn">
              다시 시도
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mobile-app">
      <div className="mobile-content">
        {/* 헤더 */}
        <header className="notification-header">
          <div className="header-top">
            <h1 className="page-title">알림</h1>
            {unreadCount > 0 && (
              <button onClick={handleMarkAllAsRead} className="mark-all-read-btn">
                모두 읽음
              </button>
            )}
          </div>
          
          {/* 탭 */}
          <div className="notification-tabs">
            {tabs.map(tab => (
              <button
                key={tab.id}
                className={`notification-tab ${currentTab === tab.id ? 'active' : ''}`}
                onClick={() => setCurrentTab(tab.id)}
              >
                <span className="tab-icon">{tab.icon}</span>
                <span className="tab-label">{tab.label}</span>
              </button>
            ))}
          </div>
        </header>

        {/* 알림 목록 */}
        <div className="notification-content">
          {notifications.length === 0 ? (
            <div className="notification-empty">
              <div className="empty-icon">🔔</div>
              <h3>알림이 없습니다</h3>
              <p>새로운 알림이 도착하면 여기에 표시됩니다</p>
            </div>
          ) : (
            <div className="notification-list">
              {notifications.map(notification => (
                <NotificationCard
                  key={notification.id}
                  notification={notification}
                  onRead={handleNotificationRead}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      <BottomNavigation />
    </div>
  );
};
