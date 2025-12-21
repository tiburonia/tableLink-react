/**
 * NotificationPage - 알림 페이지
 * 
 * FSD 원칙: 페이지는 조립만 한다
 * - useState ❌
 * - useEffect ❌
 * - API 호출 ❌
 */

import { useNotificationPage, NotificationCard } from '@/features/notification';
import { BottomNavigation } from '@/widgets/Layout';
import styles from './NotificationPage.module.css';

export const NotificationPage = () => {
  // Hook에서 모든 상태와 로직을 가져옴
  const {
    currentTab,
    notifications,
    unreadCount,
    isLoading,
    error,
    tabs,
    handleTabChange,
    handleMarkAllAsRead,
    handleNotificationRead,
    refetch,
  } = useNotificationPage();

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
            <button onClick={refetch} className="retry-btn">
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
                onClick={() => handleTabChange(tab.id)}
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
