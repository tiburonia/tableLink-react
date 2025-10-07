
/**
 * 알림 UI 렌더링 뷰
 */
export const notificationView = {
  /**
   * 알림 페이지 UI 렌더링
   */
  renderNotificationUI() {
    return `
      <main id="notificationContent">
        <header class="notification-header">
          <button id="backBtn" class="back-btn" aria-label="뒤로가기">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path d="M15 18L9 12L15 6" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </button>
          <h1 class="header-title">알림</h1>
          <button id="markAllReadBtn" class="mark-all-btn">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path d="M20 6L9 17L4 12" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </button>
        </header>

        <div class="notification-tabs">
          <button id="allTab" class="tab-button active" data-type="all">전체</button>
          <button id="orderTab" class="tab-button" data-type="order">주문</button>
          <button id="promoTab" class="tab-button" data-type="promotion">프로모션</button>
          <button id="systemTab" class="tab-button" data-type="system">시스템</button>
        </div>

        <div id="notificationList" class="notification-list">
          ${this.renderLoading()}
        </div>
      </main>

      ${this.renderBottomNav()}
      ${this.getNotificationStyles()}
    `;
  },

  /**
   * 로딩 상태
   */
  renderLoading() {
    return `
      <div class="loading-container">
        <div class="loading-spinner"></div>
        <p class="loading-text">알림을 불러오는 중...</p>
      </div>
    `;
  },

  /**
   * 알림 목록 렌더링
   */
  renderNotificationList(notifications, formatTimeAgo, getIcon) {
    if (notifications.length === 0) {
      return this.renderEmptyState();
    }

    return notifications.map(notification => 
      this.renderNotificationItem(notification, formatTimeAgo, getIcon)
    ).join('');
  },

  /**
   * 개별 알림 아이템
   */
  renderNotificationItem(notification, formatTimeAgo, getIcon) {
    const metadata = notification.metadata || {};
    const enrichedData = notification.enrichedData || {};
    const timeAgo = formatTimeAgo(notification.createdAt);

    const storeInfo = enrichedData.store?.name || metadata.store_name ? 
      `매장: ${enrichedData.store?.name || metadata.store_name}` : '';
    const tableInfo = enrichedData.order?.table_number || metadata.table_number ? 
      `테이블: ${enrichedData.order?.table_number || metadata.table_number}` : '';
    const orderInfo = enrichedData.order?.id || metadata.order_id ? 
      `주문번호: ${enrichedData.order?.id || metadata.order_id}` : '';
    const amountInfo = enrichedData.order?.total_amount || enrichedData.payment?.final_amount || metadata.amount ? 
      `금액: ${parseInt(enrichedData.order?.total_amount || enrichedData.payment?.final_amount || metadata.amount).toLocaleString()}원` : '';

    const additionalInfo = [storeInfo, tableInfo, orderInfo, amountInfo]
      .filter(info => info)
      .join(' · ');

    return `
      <div class="notification-item ${notification.isRead ? '' : 'unread'}" 
           data-notification-id="${notification.id}"
           data-notification='${JSON.stringify(notification).replace(/'/g, '&#39;')}'>
        <div class="notification-icon ${notification.type}">
          ${getIcon(notification.type)}
        </div>
        <div class="notification-content">
          <div class="notification-header-text">
            <h3 class="notification-title">${notification.title}</h3>
            <span class="notification-time">${timeAgo}</span>
          </div>
          <p class="notification-message">${notification.message}</p>
          ${additionalInfo ? `<p class="notification-meta">${additionalInfo}</p>` : ''}
        </div>
        ${!notification.isRead ? '<div class="unread-dot"></div>' : ''}
      </div>
    `;
  },

  /**
   * Empty State
   */
  renderEmptyState() {
    return `
      <div class="empty-state">
        <div class="empty-icon">🔔</div>
        <h3 class="empty-title">알림이 없어요</h3>
        <p class="empty-description">새로운 알림이 도착하면<br>여기에 표시됩니다</p>
      </div>
    `;
  },

  /**
   * 바텀 네비게이션
   */
  renderBottomNav() {
    return `
      <nav class="bottom-nav-bar">
        <button onclick="renderSubMain()" class="nav-item">
          <span class="nav-icon">🏠</span>
          <span class="nav-label">홈</span>
        </button>
        <button onclick="TLL()" class="nav-item">
          <span class="nav-icon">📱</span>
          <span class="nav-label">QR 주문</span>
        </button>
        <button onclick="renderMap()" class="nav-item">
          <span class="nav-icon">📍</span>
          <span class="nav-label">내주변</span>
        </button>
        <button onclick="renderMyPage()" class="nav-item">
          <span class="nav-icon">👤</span>
          <span class="nav-label">내정보</span>
        </button>
      </nav>
    `;
  },

  /**
   * CSS 스타일
   */
  getNotificationStyles() {
    return `
      <style>
        /* 전체 레이아웃 */
        #notificationContent {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100vh;
          background: #fafafa;
          display: flex;
          flex-direction: column;
          padding-bottom: 78px;
        }

        /* 헤더 - 노치 영역 고려 */
        .notification-header {
          position: sticky;
          top: 0;
          background: #fff;
          padding: 60px 16px 16px 16px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          z-index: 10;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
        }

        .back-btn {
          width: 40px;
          height: 40px;
          background: #f5f5f5;
          border: none;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          color: #1f2937;
          transition: all 0.2s ease;
        }

        .back-btn:active {
          transform: scale(0.95);
          background: #e5e7eb;
        }

        .header-title {
          font-size: 24px;
          font-weight: 700;
          color: #1f2937;
          margin: 0;
          font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Pretendard', sans-serif;
        }

        .mark-all-btn {
          width: 40px;
          height: 40px;
          background: #f5f5f5;
          border: none;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          color: #007aff;
          transition: all 0.2s ease;
        }

        .mark-all-btn:active {
          transform: scale(0.95);
          background: #e5e7eb;
        }

        /* 탭 버튼 */
        .notification-tabs {
          display: flex;
          background: #fff;
          padding: 0 16px;
          border-bottom: 1px solid #f3f4f6;
          gap: 8px;
        }

        .tab-button {
          flex: 1;
          padding: 12px 16px;
          border: none;
          background: transparent;
          font-size: 15px;
          font-weight: 500;
          color: #9ca3af;
          cursor: pointer;
          border-bottom: 2px solid transparent;
          transition: all 0.2s ease;
          border-radius: 8px 8px 0 0;
        }

        .tab-button.active {
          color: #007aff;
          background: #f0f7ff;
          border-bottom-color: #007aff;
          font-weight: 600;
        }

        .tab-button:active {
          transform: scale(0.98);
        }

        /* 알림 목록 */
        .notification-list {
          flex: 1;
          overflow-y: auto;
          -webkit-overflow-scrolling: touch;
          padding: 8px 0;
        }

        .notification-list::-webkit-scrollbar {
          display: none;
        }

        /* 알림 아이템 */
        .notification-item {
          background: #fff;
          padding: 16px;
          margin: 8px 16px;
          border-radius: 16px;
          display: flex;
          align-items: flex-start;
          gap: 12px;
          cursor: pointer;
          transition: all 0.2s ease;
          position: relative;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
        }

        .notification-item:active {
          transform: scale(0.98);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.12);
        }

        .notification-item.unread {
          background: linear-gradient(135deg, #f0f7ff 0%, #e8f4fd 100%);
          border: 1px solid #007aff20;
        }

        .notification-icon {
          width: 48px;
          height: 48px;
          border-radius: 14px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 24px;
          flex-shrink: 0;
        }

        .notification-icon.order {
          background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
        }

        .notification-icon.payment {
          background: linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%);
        }

        .notification-icon.promotion {
          background: linear-gradient(135deg, #fce7f3 0%, #fbcfe8 100%);
        }

        .notification-icon.system {
          background: linear-gradient(135deg, #e0e7ff 0%, #c7d2fe 100%);
        }

        .notification-content {
          flex: 1;
          min-width: 0;
        }

        .notification-header-text {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 8px;
          margin-bottom: 6px;
        }

        .notification-title {
          font-size: 16px;
          font-weight: 600;
          color: #1f2937;
          margin: 0;
          line-height: 1.4;
          flex: 1;
        }

        .notification-time {
          font-size: 12px;
          color: #9ca3af;
          font-weight: 500;
          flex-shrink: 0;
        }

        .notification-message {
          font-size: 14px;
          color: #6b7280;
          line-height: 1.5;
          margin: 0 0 8px 0;
        }

        .notification-meta {
          font-size: 12px;
          color: #9ca3af;
          margin: 0;
          line-height: 1.4;
        }

        .unread-dot {
          position: absolute;
          top: 20px;
          right: 16px;
          width: 8px;
          height: 8px;
          background: #007aff;
          border-radius: 50%;
          box-shadow: 0 0 8px rgba(0, 122, 255, 0.5);
        }

        /* 로딩 상태 */
        .loading-container {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 80px 20px;
        }

        .loading-spinner {
          width: 40px;
          height: 40px;
          border: 3px solid #f3f4f6;
          border-top: 3px solid #007aff;
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
          margin-bottom: 16px;
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        .loading-text {
          font-size: 15px;
          color: #9ca3af;
          font-weight: 500;
        }

        /* Empty State */
        .empty-state {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 100px 20px;
          text-align: center;
        }

        .empty-icon {
          font-size: 64px;
          margin-bottom: 20px;
          opacity: 0.4;
        }

        .empty-title {
          font-size: 20px;
          font-weight: 700;
          color: #1f2937;
          margin: 0 0 8px 0;
        }

        .empty-description {
          font-size: 15px;
          color: #9ca3af;
          line-height: 1.6;
          margin: 0;
        }

        /* 바텀 네비게이션 */
        .bottom-nav-bar {
          position: fixed;
          bottom: 0;
          left: 50%;
          transform: translateX(-50%);
          width: 100%;
          max-width: 430px;
          background: #fff;
          display: flex;
          justify-content: space-around;
          padding: 8px 0 12px 0;
          border-top: 1px solid #f3f4f6;
          box-shadow: 0 -1px 3px rgba(0, 0, 0, 0.05);
          z-index: 1000;
        }

        .nav-item {
          background: none;
          border: none;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 4px;
          cursor: pointer;
          padding: 6px 12px;
          flex: 1;
          transition: all 0.2s ease;
        }

        .nav-item:active {
          transform: scale(0.95);
        }

        .nav-icon {
          font-size: 22px;
        }

        .nav-label {
          font-size: 11px;
          color: #9ca3af;
          font-weight: 500;
        }
      </style>
    `;
  }
};

if (typeof window !== 'undefined') {
  window.notificationView = notificationView;
}
