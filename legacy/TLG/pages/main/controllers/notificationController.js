
/**
 * 알림 컨트롤러
 */
import { notificationService } from '../services/notificationService.js';
import { notificationView } from '../views/notificationView.js';

export const notificationController = {
  currentType: 'all',

  /**
   * 사용자 정보 가져오기
   */
  getUserInfo() {
    try {
      const cookies = document.cookie.split(';').map(cookie => cookie.trim());
      const userInfoCookie = cookies.find(cookie => cookie.startsWith('userInfo='));

      if (userInfoCookie) {
        const userInfoValue = decodeURIComponent(userInfoCookie.split('=')[1]);
        return JSON.parse(userInfoValue);
      }

      const localStorageUserInfo = localStorage.getItem('userInfo');
      if (localStorageUserInfo) {
        return JSON.parse(localStorageUserInfo);
      }

      if (window.userInfo && window.userInfo.userId) {
        return window.userInfo;
      }

      return null;
    } catch (error) {
      console.error('❌ 사용자 정보 파싱 오류:', error);
      return null;
    }
  },

  /**
   * 알림 목록 로드
   */
  async loadNotifications(type = 'all') {
    const notificationList = document.getElementById('notificationList');
    if (!notificationList) return;

    try {
      const userInfo = this.getUserInfo();
      if (!userInfo?.userId) {
        console.warn('⚠️ 사용자 정보가 없습니다.');
        notificationList.innerHTML = notificationView.renderEmptyState();
        return;
      }

      notificationList.innerHTML = notificationView.renderLoading();

      const notifications = await notificationService.getNotifications(userInfo.userId, type);

      notificationList.innerHTML = notificationView.renderNotificationList(
        notifications,
        notificationService.formatTimeAgo,
        notificationService.getNotificationIcon
      );

      this.attachNotificationItemEvents();

    } catch (error) {
      console.error('❌ 알림 로드 실패:', error);
      notificationList.innerHTML = `
        <div class="empty-state">
          <div class="empty-icon">⚠️</div>
          <h3 class="empty-title">알림을 불러올 수 없어요</h3>
          <p class="empty-description">잠시 후 다시 시도해주세요</p>
        </div>
      `;
    }
  },

  /**
   * 알림 아이템 이벤트 연결
   */
  attachNotificationItemEvents() {
    const items = document.querySelectorAll('.notification-item');
    
    items.forEach(item => {
      item.addEventListener('click', async () => {
        const notificationId = item.dataset.notificationId;
        const notification = JSON.parse(item.dataset.notification);

        if (!notification.isRead) {
          const userInfo = this.getUserInfo();
          if (userInfo?.userId) {
            await notificationService.markNotificationAsRead(notificationId, userInfo.userId);
            item.classList.remove('unread');
            const unreadDot = item.querySelector('.unread-dot');
            if (unreadDot) unreadDot.remove();
          }
        }

        await this.handleNotificationAction(notification);
      });
    });
  },

  /**
   * 알림 액션 처리
   */
  async handleNotificationAction(notification) {
    const metadata = notification.metadata || {};
    const enrichedData = notification.enrichedData || {};

    try {
      switch (notification.type) {
        case 'order':
        case 'payment':
          const orderId = enrichedData.order?.id || metadata.order_id;
          
          if (!window.renderProcessingOrder) {
            await this.loadRenderProcessingOrderScript();
          }

          window.previousScreen = 'renderNotification';

          if (orderId && window.renderProcessingOrder) {
            if (enrichedData && Object.keys(enrichedData).length > 0) {
              window.renderProcessingOrder(orderId, enrichedData);
            } else {
              window.renderProcessingOrder(orderId);
            }
          }
          break;

        case 'promotion':
          const storeId = enrichedData.store?.store_id || metadata.store_id;
          if (storeId && window.renderStore) {
            window.renderStore(storeId);
          }
          break;

        case 'system':
          if (window.renderMyAccount) {
            window.renderMyAccount();
          }
          break;

        default:
          console.log('🔔 일반 알림');
          break;
      }
    } catch (error) {
      console.error('❌ 알림 액션 처리 실패:', error);
    }
  },

  /**
   * renderProcessingOrder 스크립트 로드
   */
  async loadRenderProcessingOrderScript() {
    if (typeof window.renderProcessingOrder === 'function') {
      return;
    }

    try {
      const script = document.createElement('script');
      script.src = '/TLG/pages/store/order/renderProcessingOrder.js';

      await new Promise((resolve, reject) => {
        script.onload = () => resolve();
        script.onerror = () => reject();
        document.head.appendChild(script);
      });
    } catch (error) {
      console.error('❌ renderProcessingOrder 스크립트 로드 실패:', error);
      throw error;
    }
  },

  /**
   * 모든 알림 읽음 처리
   */
  async markAllAsRead() {
    const userInfo = this.getUserInfo();
    if (!userInfo?.userId) return;

    try {
      await notificationService.markAllNotificationsAsRead(userInfo.userId);

      const unreadItems = document.querySelectorAll('.notification-item.unread');
      unreadItems.forEach(item => {
        item.classList.remove('unread');
        const unreadDot = item.querySelector('.unread-dot');
        if (unreadDot) unreadDot.remove();
      });

      console.log('✅ 모든 알림 읽음 처리 완료');
    } catch (error) {
      console.error('❌ 모든 알림 읽음 처리 실패:', error);
    }
  },

  /**
   * 이벤트 핸들러 초기화
   */
  initializeEventHandlers() {
    const backBtn = document.getElementById('backBtn');
    if (backBtn) {
      backBtn.addEventListener('click', () => {
        if (typeof renderMap === 'function') {
          renderMap();
        } else {
          history.back();
        }
      });
    }

    const markAllReadBtn = document.getElementById('markAllReadBtn');
    if (markAllReadBtn) {
      markAllReadBtn.addEventListener('click', () => {
        this.markAllAsRead();
      });
    }

    const tabButtons = document.querySelectorAll('.tab-button');
    tabButtons.forEach(button => {
      button.addEventListener('click', (e) => {
        tabButtons.forEach(btn => btn.classList.remove('active'));
        e.target.classList.add('active');

        const type = e.target.dataset.type;
        this.currentType = type;
        this.loadNotifications(type);
      });
    });
  }
};

if (typeof window !== 'undefined') {
  window.notificationController = notificationController;
}
