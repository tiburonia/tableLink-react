/**
 * 알림 화면 렌더링 (레이어드 아키텍처)
 */
import { notificationController } from './controllers/notificationController.js';
import { notificationView } from './views/notificationView.js';

async function renderNotification() {
  const main = document.getElementById('main');

  // UI 렌더링
  main.innerHTML = notificationView.renderNotificationUI();

  // 이벤트 핸들러 초기화
  notificationController.initializeEventHandlers();

  // 초기 알림 목록 로드
  notificationController.loadNotifications('all');
}

// 전역 스코프에 함수 등록
window.renderNotification = renderNotification;

// 기본 export
export default renderNotification;

// 사용자 정보 가져오기 함수
function getUserInfo() {
  try {
    // 쿠키에서 사용자 정보 확인
    const cookies = document.cookie.split(';').map(cookie => cookie.trim());
    const userInfoCookie = cookies.find(cookie => cookie.startsWith('userInfo='));

    if (userInfoCookie) {
      const userInfoValue = decodeURIComponent(userInfoCookie.split('=')[1]);
      return JSON.parse(userInfoValue);
    }

    // localStorage에서 사용자 정보 확인
    const localStorageUserInfo = localStorage.getItem('userInfo');
    if (localStorageUserInfo) {
      return JSON.parse(localStorageUserInfo);
    }

    // 전역 변수에서 사용자 정보 확인
    if (window.userInfo && window.userInfo.userId) {
      return window.userInfo;
    }

    return null;
  } catch (error) {
    console.error('❌ 사용자 정보 파싱 오류:', error);
    return null;
  }
}

// 알림 목록 로드 함수
async function loadNotifications(type = 'all') {
  const notificationList = document.getElementById('notificationList');

  try {
    // 로딩 상태 표시
    notificationList.innerHTML = `
      <div class="loading-message">
        <div class="loading-spinner"></div>
        알림을 불러오는 중...
      </div>
    `;

    // 서버에서 알림 데이터 가져오기 (임시로 목업 데이터 사용)
    const notifications = await fetchNotifications(type);

    if (notifications.length === 0) {
      notificationList.innerHTML = `
        <div class="empty-state">
          <div class="empty-state-icon">🔔</div>
          <div class="empty-state-text">알림이 없습니다</div>
          <div class="empty-state-subtext">새로운 알림이 도착하면 여기에 표시됩니다</div>
        </div>
      `;
      return;
    }

    // 알림 목록 렌더링 - DOM 요소 직접 생성 방식으로 변경
    notificationList.innerHTML = ''; // 기존 내용 초기화

    notifications.forEach(notification => {
        const isRead = notification.isRead;
        const timeAgo = formatTimeAgo(notification.createdAt);

        // 메타데이터 및 enrichedData 파싱
        let metadata = {};
        let enrichedData = {};
        try {
          if (notification.metadata) {
            metadata = typeof notification.metadata === 'string'
              ? JSON.parse(notification.metadata)
              : notification.metadata;
          }
          // 서버에서 조회한 enrichedData가 있으면 활용
          if (notification.enrichedData) {
            enrichedData = notification.enrichedData;
          }
        } catch (error) {
          console.warn('⚠️ 알림 메타데이터 파싱 실패:', error);
          metadata = {};
          enrichedData = {};
        }

        // DOM 요소 직접 생성
        const notificationElement = document.createElement('div');
        notificationElement.className = `notification-item ${isRead ? '' : 'unread'}`;
        notificationElement.dataset.notificationId = notification.id;

        // enrichedData 우선, metadata 백업으로 활용하여 추가 정보 추출
        const storeInfo = enrichedData.store?.name || metadata.store_name ?
          `매장: ${enrichedData.store?.name || metadata.store_name}` : '';
        const tableInfo = enrichedData.order?.table_number || metadata.table_number ?
          `테이블: ${enrichedData.order?.table_number || metadata.table_number}` : '';
        const orderInfo = enrichedData.order?.id || metadata.order_id ?
          `주문번호: ${enrichedData.order?.id || metadata.order_id}` : '';
        const amountInfo = enrichedData.order?.total_amount || enrichedData.payment?.final_amount || metadata.amount ?
          `금액: ${parseInt(enrichedData.order?.total_amount || enrichedData.payment?.final_amount || metadata.amount).toLocaleString()}원` : '';
        const ticketInfo = enrichedData.ticket?.ticket_id || metadata.ticket_id ?
          `티켓: ${enrichedData.ticket?.ticket_id || metadata.ticket_id}` : '';

        const additionalInfo = [storeInfo, tableInfo, orderInfo, ticketInfo, amountInfo]
          .filter(info => info)
          .join(' | ');

        notificationElement.innerHTML = `
          <div class="notification-content">
            <div class="notification-icon ${notification.type}">
              ${getNotificationIcon(notification.type)}
            </div>
            <div class="notification-text">
              <div class="notification-title">${notification.title}</div>
              <div class="notification-message">${notification.message}</div>
              ${additionalInfo ? `<div class="notification-meta" style="font-size: 12px; color: #888; margin-top: 4px;">${additionalInfo}</div>` : ''}
            </div>
            <div class="notification-time">${timeAgo}</div>
          </div>
        `;

        // 알림 클릭 이벤트 리스너 추가
        notificationElement.addEventListener('click', async () => {
          console.log('📱 알림 클릭:', notification, '메타데이터:', metadata);

          // 읽음 처리
          if (!isRead) {
            await markNotificationAsRead(notification.id);
            notificationElement.classList.remove('unread');
          }

          // 메타데이터 및 enrichedData 기반 액션 처리
          handleNotificationAction(notification, metadata, enrichedData);
        });

        // DOM에 추가
        notificationList.appendChild(notificationElement);
      });


  } catch (error) {
    console.error('❌ 알림 로드 실패:', error);
    notificationList.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon">⚠️</div>
        <div class="empty-state-text">알림을 불러올 수 없습니다</div>
        <div class="empty-state-subtext">잠시 후 다시 시도해주세요</div>
      </div>
    `;
  }
}


// 알림 데이터 가져오기 (실제 API 연동)
async function fetchNotifications(type) {
  try {
    const userInfo = getUserInfo();
    if (!userInfo?.userId) {
      console.warn('⚠️ 사용자 정보가 없습니다. 게스트는 알림을 받을 수 없습니다.');
      return [];
    }

    const url = `/api/notifications?userId=${userInfo.userId}${type !== 'all' ? `&type=${type}` : ''}`;
    console.log('📤 알림 API 요청:', url);

    const response = await fetch(url);

    if (!response.ok) {
      console.error('❌ 알림 API 요청 실패:', response.status);
      return [];
    }

    const data = await response.json();
    console.log('✅ 알림 데이터 로드 성공:', data);

    // 서버 응답 데이터를 프론트엔드 형식으로 변환
    const processedNotifications = data.notifications.map(notification => ({
        ...notification,
        isRead: notification.isRead !== undefined ? notification.isRead : notification.is_read, // 서버 응답 우선
        createdAt: notification.createdAt ? new Date(notification.createdAt) : new Date(notification.created_at),
        // 메타데이터 안전하게 파싱
        metadata: typeof notification.metadata === 'string'
          ? JSON.parse(notification.metadata)
          : (notification.metadata || {}),
        // enrichedData가 있으면 활용
        enrichedData: notification.enrichedData || null
    }));

    return processedNotifications || [];
  } catch (error) {
    console.error('❌ 알림 데이터 로드 실패:', error);
    return [];
  }
}

// 알림 타입별 아이콘
function getNotificationIcon(type) {
  switch (type) {
    case 'order': return '🍽️';
    case 'promotion': return '🎁';
    case 'system': return '⚙️';
    default: return '📢';
  }
}

// 시간 포맷팅
function formatTimeAgo(date) {
  // Ensure date is a Date object
  const notificationDate = typeof date === 'string' ? new Date(date) : date;
  const now = new Date();
  const diff = now - notificationDate;
  const minutes = Math.floor(diff / (1000 * 60));
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));

  if (minutes < 60) {
    return `${minutes}분 전`;
  } else if (hours < 24) {
    return `${hours}시간 전`;
  } else {
    return `${days}일 전`;
  }
}

// renderProcessingOrder 스크립트 로드
async function loadRenderProcessingOrderScript() {
  if (typeof window.renderProcessingOrder === 'function') {
    return; // 이미 로드됨
  }

  try {
    console.log('🔄 renderProcessingOrder 스크립트 로드 시작');
    const script = document.createElement('script');
    script.src = '/TLG/pages/store/order/renderProcessingOrder.js';

    await new Promise((resolve, reject) => {
      script.onload = () => {
        console.log('✅ renderProcessingOrder 스크립트 로드 완료');
        resolve();
      };
      script.onerror = () => {
        console.error('❌ renderProcessingOrder 스크립트 로드 실패');
        reject();
      };
      document.head.appendChild(script);
    });
  } catch (error) {
    console.error('❌ renderProcessingOrder 스크립트 로드 중 오류:', error);
    throw error;
  }
}

// 개별 알림 읽음 처리
async function markNotificationAsRead(notificationId) {
  try {
    const userInfo = getUserInfo();
    if (!userInfo?.userId) return;

    const response = await fetch(`/api/notifications/${notificationId}/read`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: userInfo.userId })
    });

    if (!response.ok) {
      console.error('❌ 알림 읽음 처리 실패:', response.status);
    } else {
      console.log('✅ 알림 읽음 처리 성공:', notificationId);
    }
  } catch (error) {
    console.error('❌ 알림 읽음 처리 오류:', error);
  }
}

// 모든 알림을 읽음으로 처리
async function markAllNotificationsAsRead() {
  try {
    const userInfo = getUserInfo();
    if (!userInfo?.userId) {
      console.warn('⚠️ 사용자 정보가 없습니다.');
      return;
    }

    const response = await fetch('/api/notifications/mark-all-read', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: userInfo.userId })
    });

    if (response.ok) {
      const unreadItems = document.querySelectorAll('.notification-item.unread');
      unreadItems.forEach(item => {
        item.classList.remove('unread');
      });

      console.log('✅ 모든 알림을 읽음으로 처리했습니다.');
    } else {
      console.error('❌ 모든 알림 읽음 처리 실패:', response.status);
    }
  } catch (error) {
    console.error('❌ 모든 알림 읽음 처리 오류:', error);
  }
}

// 알림 액션 처리 (메타데이터 및 enrichedData 기반)
async function handleNotificationAction(notification, metadata = {}, enrichedData = {}) {
  try {
    switch (notification.type) {
      case 'order':
      case 'payment':
        // 주문/결제 관련 알림 - enrichedData 우선 활용하여 주문 상세 화면으로 이동
        const orderInfo = {
          orderId: enrichedData.order?.id || metadata.order_id,
          storeId: enrichedData.store?.store_id || metadata.store_id,
          storeName: enrichedData.store?.name || metadata.store_name,
          ticketId: enrichedData.ticket?.ticket_id || metadata.ticket_id,
          tableNumber: enrichedData.order?.table_number || metadata.table_number
        };

        console.log('📦 주문/결제 알림 클릭 - 주문 화면으로 이동', orderInfo);

        // renderProcessingOrder 스크립트 동적 로드
        if (!window.renderProcessingOrder) {
          try {
            await loadRenderProcessingOrderScript();
          } catch (error) {
            console.error('❌ renderProcessingOrder 스크립트 로드 실패:', error);
            alert('주문 화면을 불러올 수 없습니다. 다시 시도해주세요.');
            return;
          }
        }

        // 이전 화면 정보 저장
        window.previousScreen = 'renderNotification';

        // enrichedData 우선, 메타데이터 백업으로 orderId 추출
        const orderId = orderInfo.orderId;

        if (orderId && window.renderProcessingOrder) {
          // enrichedData가 있으면 함께 전달
          if (enrichedData && Object.keys(enrichedData).length > 0) {
            window.renderProcessingOrder(orderId, enrichedData);
          } else {
            window.renderProcessingOrder(orderId);
          }
        } else if (window.renderProcessingOrder) {
          window.renderProcessingOrder();
        } else {
          console.warn('⚠️ renderProcessingOrder 함수를 찾을 수 없음');
          alert('주문 화면을 불러올 수 없습니다.');
        }
        break;

      case 'promotion':
        // 프로모션 알림 - enrichedData 활용하여 매장 화면으로 이동
        const promoStoreId = enrichedData.store?.store_id || metadata.store_id;
        console.log('🎁 프로모션 알림 클릭 - 매장 화면으로 이동', {
          storeId: promoStoreId,
          storeName: enrichedData.store?.name || metadata.store_name
        });

        if (promoStoreId && window.renderStore) {
          window.renderStore(promoStoreId);
        } else {
          console.warn('⚠️ 프로모션 관련 매장 정보가 없습니다');
        }
        break;

      case 'system':
        // 시스템 알림 - 설정 화면으로 이동
        console.log('⚙️ 시스템 알림 클릭 - 설정 화면으로 이동');
        if (window.renderMyAccount) {
          window.renderMyAccount();
        }
        break;

      default:
        console.log('🔔 일반 알림 클릭');
        break;
    }
  } catch (error) {
    console.error('❌ 알림 액션 처리 실패:', error);
  }
}