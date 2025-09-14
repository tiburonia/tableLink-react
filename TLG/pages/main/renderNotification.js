window.renderNotification = async function renderNotification() {
  const main = document.getElementById('main');

  // UI 렌더링
  main.innerHTML = `
    <main id="content">
      <div class="notification-header">
        <button id="backBtn" class="back-button">←</button>
        <h1>알림</h1>
        <button id="markAllReadBtn" class="mark-all-read">모두 읽음</button>
      </div>

      <div class="notification-tabs">
        <button id="allTab" class="tab-button active">전체</button>
        <button id="orderTab" class="tab-button">주문</button>
        <button id="promoTab" class="tab-button">프로모션</button>
        <button id="systemTab" class="tab-button">시스템</button>
      </div>

      <div id="notificationList" class="notification-list">
        <div class="loading-message">
          <div class="loading-spinner"></div>
          알림을 불러오는 중...
        </div>
      </div>
    </main>

    <nav id="bottomBar">
      <button onclick="renderSubMain()" title="홈">
        <span style="font-size: 22px;">🏠</span>
      </button>
      <button onclick="TLL().catch(console.error)" title="QR주문">
        <span style="font-size: 22px;">📱</span>
      </button>
      <button onclick="renderMap().catch(console.error)" title="지도">
        <span style="font-size: 22px;">📍</span>
      </button>
      <button onclick="renderSearch('')" title="검색">
        <span style="font-size: 22px;">🔍</span>
      </button>
      <button onclick="renderMyPage()" title="마이페이지">
        <span style="font-size: 22px;">👤</span>
      </button>
    </nav>

    <style>
      html, body {
        margin: 0;
        padding: 0;
        height: 100%;
        font-family: 'Noto Sans KR', sans-serif;
        background: #f8f8f8;
        overflow: hidden;
      }

      /* 콘텐츠 전체 */
      #content {
        position: fixed;
        top: 0;
        bottom: 78px;
        left: 0;
        width: 100%;
        max-width: 430px;
        height: calc(100vh - 78px);
        overflow: hidden;
        background: #fdfdfd;
        z-index: 1;
        display: flex;
        flex-direction: column;
      }

      /* 헤더 */
      .notification-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 20px 16px 16px 16px;
        background: #fff;
        border-bottom: 1px solid #e5e8f0;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
      }

      .back-button {
        background: none;
        border: none;
        font-size: 24px;
        cursor: pointer;
        color: #297efc;
        width: 40px;
        height: 40px;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 50%;
        transition: background 0.2s;
      }

      .back-button:hover {
        background: rgba(41, 126, 252, 0.1);
      }

      .notification-header h1 {
        margin: 0;
        font-size: 20px;
        font-weight: 600;
        color: #1a1d29;
      }

      .mark-all-read {
        background: none;
        border: none;
        color: #297efc;
        font-size: 14px;
        cursor: pointer;
        padding: 8px 12px;
        border-radius: 8px;
        transition: background 0.2s;
      }

      .mark-all-read:hover {
        background: rgba(41, 126, 252, 0.1);
      }

      /* 탭 버튼 */
      .notification-tabs {
        display: flex;
        background: #fff;
        padding: 0 16px;
        border-bottom: 1px solid #e5e8f0;
      }

      .tab-button {
        flex: 1;
        padding: 16px 12px;
        border: none;
        background: none;
        font-size: 14px;
        font-weight: 500;
        color: #666;
        cursor: pointer;
        border-bottom: 2px solid transparent;
        transition: all 0.2s;
      }

      .tab-button.active {
        color: #297efc;
        border-bottom-color: #297efc;
      }

      .tab-button:hover:not(.active) {
        color: #333;
        background: rgba(0, 0, 0, 0.02);
      }

      /* 알림 목록 */
      .notification-list {
        flex: 1;
        overflow-y: auto;
        padding: 8px 0;
      }

      .notification-item {
        padding: 16px;
        border-bottom: 1px solid #f0f2f5;
        cursor: pointer;
        transition: background 0.2s;
        position: relative;
      }

      .notification-item:hover {
        background: #f8f9fa;
      }

      .notification-item.unread {
        background: #f0f7ff;
        border-left: 4px solid #297efc;
      }

      .notification-item.unread::before {
        content: '';
        position: absolute;
        top: 20px;
        right: 16px;
        width: 8px;
        height: 8px;
        background: #297efc;
        border-radius: 50%;
      }

      .notification-content {
        display: flex;
        align-items: flex-start;
        gap: 12px;
      }

      .notification-icon {
        width: 40px;
        height: 40px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 18px;
        flex-shrink: 0;
      }

      .notification-icon.order {
        background: #e8f4fd;
        color: #297efc;
      }

      .notification-icon.promotion {
        background: #fff3e0;
        color: #f57c00;
      }

      .notification-icon.system {
        background: #f3e5f5;
        color: #9c27b0;
      }

      .notification-text {
        flex: 1;
      }

      .notification-title {
        font-weight: 600;
        color: #1a1d29;
        margin-bottom: 4px;
        line-height: 1.4;
      }

      .notification-message {
        font-size: 14px;
        color: #666;
        line-height: 1.4;
        margin-bottom: 8px;
      }

      .notification-time {
        font-size: 12px;
        color: #999;
      }

      .loading-message {
        text-align: center;
        padding: 60px 20px;
        color: #666;
      }

      .loading-spinner {
        margin: 0 auto 16px auto;
        width: 32px;
        height: 32px;
        border: 3px solid #e0e0e0;
        border-top: 3px solid #297efc;
        border-radius: 50%;
        animation: spin 1s linear infinite;
      }

      @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }

      .empty-state {
        text-align: center;
        padding: 80px 20px;
        color: #999;
      }

      .empty-state-icon {
        font-size: 48px;
        margin-bottom: 16px;
      }

      .empty-state-text {
        font-size: 16px;
        margin-bottom: 8px;
      }

      .empty-state-subtext {
        font-size: 14px;
        color: #bbb;
      }

      /* 바텀바 */
      #bottomBar {
        position: fixed;
        bottom: 0;
        left: 50%;
        transform: translateX(-50%);
        width: 100%;
        max-width: 430px;
        height: 78px;
        background: linear-gradient(145deg, rgba(255,255,255,0.98), rgba(250,252,255,0.95));
        border-top: 1px solid rgba(255,255,255,0.3);
        box-shadow: 
          0 -8px 32px rgba(41, 126, 252, 0.08),
          0 -4px 16px rgba(0, 0, 0, 0.04),
          inset 0 1px 0 rgba(255, 255, 255, 0.8);
        display: flex;
        justify-content: space-around;
        align-items: center;
        z-index: 1001;
        padding: 8px 16px 12px 16px;
        box-sizing: border-box;
        border-radius: 24px 24px 0 0;
        backdrop-filter: blur(20px);
        gap: 8px;
      }

      #bottomBar button {
        position: relative;
        flex: 1;
        height: 52px;
        min-width: 0;
        border: none;
        outline: none;
        border-radius: 16px;
        background: linear-gradient(135deg, #f8f9ff 0%, #f0f4ff 100%);
        color: #6B7280;
        font-size: 20px;
        font-family: inherit;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        overflow: hidden;
        border: 1px solid rgba(255, 255, 255, 0.4);
      }

      #bottomBar button::before {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: linear-gradient(135deg, rgba(41, 126, 252, 0.05), rgba(79, 70, 229, 0.03));
        opacity: 0;
        transition: opacity 0.3s ease;
        border-radius: 16px;
      }

      #bottomBar button:hover {
        background: linear-gradient(135deg, #f0f4ff 0%, #e8f0ff 100%);
        color: #297efc;
        transform: translateY(-2px);
        box-shadow: 
          0 8px 24px rgba(41, 126, 252, 0.12),
          0 4px 12px rgba(0, 0, 0, 0.05);
        border-color: rgba(41, 126, 252, 0.2);
      }

      #bottomBar button:hover::before {
        opacity: 1;
      }

      #bottomBar button.active {
        background: linear-gradient(135deg, #297efc, #4f46e5);
        color: white;
        transform: translateY(-2px);
        box-shadow: 
          0 8px 24px rgba(41, 126, 252, 0.3),
          0 4px 12px rgba(79, 70, 229, 0.2);
        border-color: transparent;
      }

      #bottomBar button:active {
        transform: translateY(0px);
        box-shadow: 
          0 4px 16px rgba(41, 126, 252, 0.15),
          0 2px 8px rgba(0, 0, 0, 0.05);
      }
    </style>
  `;

  // 뒤로가기 버튼 이벤트
  document.getElementById('backBtn').addEventListener('click', () => {
    if (typeof renderMap === 'function') {
      renderMap();
    } else {
      history.back();
    }
  });

  // 탭 버튼 이벤트
  document.querySelectorAll('.tab-button').forEach(button => {
    button.addEventListener('click', (e) => {
      // 모든 탭에서 active 클래스 제거
      document.querySelectorAll('.tab-button').forEach(tab => tab.classList.remove('active'));
      // 클릭한 탭에 active 클래스 추가
      e.target.classList.add('active');

      // 알림 목록 필터링
      const tabType = e.target.id.replace('Tab', '');
      loadNotifications(tabType);
    });
  });

  // 모두 읽음 처리
  document.getElementById('markAllReadBtn').addEventListener('click', () => {
    markAllNotificationsAsRead();
  });

  // 초기 알림 목록 로드
  loadNotifications('all');
}

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

    // 알림 목록 렌더링
    notificationList.innerHTML = notifications.map(notification => `
      <div class="notification-item ${notification.isRead ? '' : 'unread'}" data-id="${notification.id}">
        <div class="notification-content">
          <div class="notification-icon ${notification.type}">
            ${getNotificationIcon(notification.type)}
          </div>
          <div class="notification-text">
            <div class="notification-title">${notification.title}</div>
            <div class="notification-message">${notification.message}</div>
            <div class="notification-time">${formatTimeAgo(notification.createdAt)}</div>
          </div>
        </div>
      </div>
    `).join('');

    // 알림 클릭 이벤트 추가
    document.querySelectorAll('.notification-item').forEach(item => {
      item.addEventListener('click', (e) => {
        const notificationId = e.currentTarget.dataset.id;
        handleNotificationClick(notificationId);
      });
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

    return data.notifications || [];
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
  const now = new Date();
  const diff = now - date;
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

// 알림 클릭 처리
async function handleNotificationClick(notificationId) {
  console.log(`알림 클릭: ${notificationId}`);

  // 읽음 상태로 변경
  const item = document.querySelector(`[data-id="${notificationId}"]`);
  if (item && item.classList.contains('unread')) {
    item.classList.remove('unread');
    await markNotificationAsRead(notificationId);
  }

  // 알림 타입에 따른 적절한 액션 수행
  // 예: 주문 알림이면 주문 상세 페이지로, 프로모션이면 해당 매장으로
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