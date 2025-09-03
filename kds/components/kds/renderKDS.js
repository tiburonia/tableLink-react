// KDS 메인 렌더링 함수
async function renderKDS() {
  const main = document.getElementById('main');

  try {
    console.log('📟 KDS 페이지 로딩 시작');

    // URL에서 매장 ID 추출
    const urlPath = window.location.pathname;
    const pathSegments = urlPath.split('/');
    console.log('🔍 URL 경로 분석:', pathSegments);

    let storeId = null;

    if (pathSegments[1] === 'kds' && pathSegments[2]) {
      storeId = parseInt(pathSegments[2]);
      console.log('🎯 경로에서 매장 ID 추출:', storeId);
    }

    if (!storeId || isNaN(storeId)) {
      console.log('❌ 유효하지 않은 매장 ID, 매장 선택 화면으로 이동');
      renderKDSStoreSelection();
      return;
    }

    console.log('📟 KDS 페이지 진입, 매장 ID:', storeId);

    // 전역 매장 ID 설정
    window.currentStoreId = storeId;

    // KDS 메인 화면 렌더링
    await renderKDSMain(storeId);

  } catch (error) {
    console.error('❌ KDS 페이지 로딩 실패:', error);
    renderKDSError();
  }
}

// KDS 메인 화면 렌더링
async function renderKDSMain(storeId) {
  console.log('📟 KDS 메인 함수 호출됨');
  console.log('📟 KDS 매장 ID:', storeId, '(타입:', typeof storeId, ')');

  const main = document.getElementById('main');

  try {
    // 매장 정보 조회
    console.log('🔍 KDS - 매장', storeId, '정보 조회 시작');
    const storeResponse = await fetch(`/api/kds/store/${storeId}`, {
      headers: {
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache'
      }
    });

    if (!storeResponse.ok) {
      throw new Error('매장 정보 조회 실패');
    }

    const storeData = await storeResponse.json();

    if (!storeData.success || !storeData.store) {
      throw new Error('매장 정보를 찾을 수 없습니다');
    }

    const store = storeData.store;
    console.log('✅ KDS 매장 정보 조회 완료:', store.name);

    // KDS 화면 렌더링
    renderKDSInterface(store);

    // 주문 데이터 로딩
    await loadKDSOrders(storeId);

    // 자동 새로고침 설정 (30초마다)
    setInterval(() => {
      loadKDSOrders(storeId);
    }, 30000);

  } catch (error) {
    console.error('❌ KDS 메인 화면 렌더링 실패:', error);
    renderKDSError();
  }
}

// KDS 인터페이스 렌더링
function renderKDSInterface(store) {
  const main = document.getElementById('main');

  // URL에서 dev 모드 확인
  const urlParams = new URLSearchParams(window.location.search);
  const isDevMode = urlParams.get('dev') === 'true';

  console.log(isDevMode ? '🔧 개발 모드 활성화' : '📺 풀스크린 모드');

  main.innerHTML = `
    <div class="professional-kds ${isDevMode ? 'dev-mode' : ''}">
      <!-- 상단 헤더 -->
      <header class="kds-header">
        <div class="header-left">
          <div class="store-info">
            <h1 class="store-name">${store.name}</h1>
            <div class="current-time" id="currentTime">2024.01.27 22:31:45</div>
          </div>
        </div>

        <div class="header-center">
          <div class="queue-summary">
            <div class="queue-item pending">
              <div class="queue-count" id="pendingCount">0</div>
              <div class="queue-label">대기</div>
            </div>
            <div class="queue-item cooking">
              <div class="queue-count" id="cookingCount">0</div>
              <div class="queue-label">조리중</div>
            </div>
            <div class="queue-item ready">
              <div class="queue-count" id="readyCount">0</div>
              <div class="queue-label">완료</div>
            </div>
          </div>
        </div>

        <div class="header-right">
          <div class="connection-status">
            <div class="status-indicator" id="connectionStatus">
              <div class="status-dot online"></div>
              <span>실시간 연결</span>
            </div>
            <div class="last-update" id="lastUpdate">최종 업데이트: 방금 전</div>
          </div>

          <div class="control-panel">
            <button class="control-btn refresh-btn" onclick="refreshKDS()" title="새로고침">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <path d="M17.65 6.35C16.2 4.9 14.21 4 12 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08c-.82 2.33-3.04 4-5.65 4-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z"/>
              </svg>
            </button>
          </div>
        </div>
      </header>

      <!-- 메인 컨텐츠 영역 -->
      <main class="kds-main">
        <!-- 주문 컨테이너 -->
        <div class="orders-container" id="ordersContainer">
          <div class="orders-grid ${isDevMode ? 'dev-mode' : ''}" id="ordersGrid">
            <!-- 주문 카드들이 동적으로 생성됩니다 -->
          </div>

          <!-- 빈 상태 -->
          <div class="empty-state" id="emptyState" style="display: none;">
            <div class="empty-icon">
              <svg width="64" height="64" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2M12,17A5,5 0 0,1 7,12A5,5 0 0,1 12,7A5,5 0 0,1 17,12A5,5 0 0,1 12,17M12,9A3,3 0 0,0 9,12A3,3 0 0,0 12,15A3,3 0 0,0 15,12A3,3 0 0,0 12,9Z"/>
              </svg>
            </div>
            <h3>처리할 주문이 없습니다</h3>
            <p>새로운 주문이 들어오면 여기에 표시됩니다.</p>
          </div>

          <!-- 로딩 오버레이 -->
          <div class="loading-overlay" style="display: none;">
              <div class="loading-spinner"></div>
              <div class="loading-text">주문 데이터 로딩 중...</div>
          </div>
        </div>
      </main>

      <!-- 하단 상태바 -->
      <footer class="kds-footer">
        <div class="footer-left">
          <div class="today-stats">
            <span class="stat-item">처리 중: <strong id="activeOrders">0</strong>건</span>
          </div>
        </div>

        <div class="footer-center">
          <div class="system-info">
            <span>KDS v2.0</span>
            <span class="separator">•</span>
            <span id="systemStatus">정상 운영</span>
          </div>
        </div>

        <div class="footer-right">
          <button class="footer-btn" onclick="refreshKDS()">🔄 새로고침</button>
        </div>
      </footer>
    </div>

    <style>
      * {
        margin: 0;
        padding: 0;
        box-sizing: border-box;
      }

      body {
        font-family: 'Segoe UI', -apple-system, BlinkMacSystemFont, 'Roboto', sans-serif;
        background: #0f1419;
        color: #e2e8f0;
        overflow: hidden;
        user-select: none;
      }

      .professional-kds {
        width: 100vw;
        height: 100vh;
        background: linear-gradient(135deg, #0f1419 0%, #1a202c 100%);
        display: flex;
        flex-direction: column;
        position: relative;
      }

      .professional-kds.dev-mode {
        width: 600px;
        height: 900px;
        margin: 20px;
        border-radius: 12px;
        box-shadow: 0 24px 48px rgba(0, 0, 0, 0.4);
        position: fixed;
        top: 20px;
        right: 20px;
        z-index: 1000;
        border: 1px solid #2d3748;
      }

      /* 헤더 스타일 */
      .kds-header {
        height: 80px;
        background: linear-gradient(135deg, #1a365d 0%, #2c5282 100%);
        border-bottom: 2px solid #2d3748;
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 0 32px;
        backdrop-filter: blur(10px);
        position: relative;
        overflow: hidden;
      }

      .dev-mode .kds-header {
        height: 60px;
        padding: 0 20px;
      }

      .store-name {
        font-size: 24px;
        font-weight: 700;
        color: #ffffff;
        margin-bottom: 4px;
        text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
      }

      .dev-mode .store-name {
        font-size: 18px;
      }

      .current-time {
        font-size: 14px;
        color: #a0aec0;
        font-family: 'Courier New', monospace;
        font-weight: 500;
      }

      .dev-mode .current-time {
        font-size: 12px;
      }

      /* 중앙 큐 요약 */
      .queue-summary {
        display: flex;
        gap: 32px;
        background: rgba(255, 255, 255, 0.1);
        padding: 16px 24px;
        border-radius: 12px;
        backdrop-filter: blur(10px);
        border: 1px solid rgba(255, 255, 255, 0.1);
      }

      .dev-mode .queue-summary {
        gap: 16px;
        padding: 12px 16px;
      }

      .queue-item {
        text-align: center;
        min-width: 60px;
      }

      .queue-count {
        font-size: 28px;
        font-weight: 800;
        margin-bottom: 4px;
        font-family: 'Courier New', monospace;
      }

      .dev-mode .queue-count {
        font-size: 20px;
      }

      .queue-item.pending .queue-count {
        color: #f6ad55;
      }

      .queue-item.cooking .queue-count {
        color: #fc8181;
        animation: cooking-pulse 2s infinite;
      }

      .queue-item.ready .queue-count {
        color: #68d391;
      }

      .queue-label {
        font-size: 12px;
        color: #a0aec0;
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.5px;
      }

      @keyframes cooking-pulse {
        0%, 100% { opacity: 1; }
        50% { opacity: 0.6; }
      }

      /* 헤더 오른쪽 */
      .header-right {
        display: flex;
        align-items: center;
        gap: 24px;
      }

      .connection-status {
        text-align: right;
      }

      .status-indicator {
        display: flex;
        align-items: center;
        gap: 8px;
        margin-bottom: 4px;
        font-weight: 600;
        font-size: 14px;
      }

      .status-dot {
        width: 8px;
        height: 8px;
        border-radius: 50%;
        background: #68d391;
        animation: status-pulse 2s infinite;
      }

      @keyframes status-pulse {
        0%, 100% { opacity: 1; transform: scale(1); }
        50% { opacity: 0.7; transform: scale(1.1); }
      }

      .last-update {
        font-size: 11px;
        color: #718096;
        font-family: 'Courier New', monospace;
      }

      .control-panel {
        display: flex;
        gap: 8px;
      }

      .control-btn {
        width: 44px;
        height: 44px;
        background: rgba(255, 255, 255, 0.1);
        border: 1px solid rgba(255, 255, 255, 0.2);
        border-radius: 8px;
        color: #e2e8f0;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: all 0.2s ease;
        backdrop-filter: blur(5px);
      }

      .dev-mode .control-btn {
        width: 36px;
        height: 36px;
      }

      .control-btn:hover {
        background: rgba(255, 255, 255, 0.2);
        border-color: rgba(255, 255, 255, 0.3);
        transform: translateY(-1px);
      }

      /* 메인 컨텐츠 */
      .kds-main {
        flex: 1;
        display: flex;
        flex-direction: column;
        overflow: hidden;
      }

      /* 주문 컨테이너 */
      .orders-container {
        flex: 1;
        overflow: hidden;
        position: relative;
      }

      .orders-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
        gap: 20px;
        padding: 24px 32px;
        height: 100%;
        overflow-y: auto;
        scroll-behavior: smooth;
      }

      .dev-mode .orders-grid {
        grid-template-columns: 1fr;
        gap: 12px;
        padding: 16px 20px;
      }

      /* 빈 상태 */
      .empty-state {
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        text-align: center;
        color: #718096;
      }

      .empty-icon {
        margin-bottom: 16px;
        opacity: 0.5;
      }

      .empty-state h3 {
        font-size: 20px;
        margin-bottom: 8px;
        color: #a0aec0;
      }

      .empty-state p {
        font-size: 14px;
      }

      /* 주문 카드 스타일 */
      .order-card {
        background: linear-gradient(135deg, #1a202c 0%, #2d3748 100%);
        border: 2px solid transparent;
        border-radius: 16px;
        padding: 20px;
        position: relative;
        cursor: pointer;
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
        backdrop-filter: blur(10px);
        min-height: 280px;
        display: flex;
        flex-direction: column;
      }

      .dev-mode .order-card {
        min-height: 200px;
        padding: 16px;
      }

      .order-card:hover {
        transform: translateY(-4px);
        box-shadow: 0 16px 40px rgba(0, 0, 0, 0.25);
        border-color: rgba(99, 179, 237, 0.5);
      }

      .order-card.pending {
        border-color: #f6ad55;
        background: linear-gradient(135deg, rgba(246, 173, 85, 0.1) 0%, #1a202c 100%);
      }

      .order-card.cooking {
        border-color: #fc8181;
        background: linear-gradient(135deg, rgba(252, 129, 129, 0.15) 0%, #1a202c 100%);
        animation: order-cooking-pulse 3s infinite;
      }

      .order-card.ready {
        border-color: #68d391;
        background: linear-gradient(135deg, rgba(104, 211, 145, 0.1) 0%, #1a202c 100%);
      }

      @keyframes order-cooking-pulse {
        0%, 100% { 
          box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
        }
        50% { 
          box-shadow: 0 8px 25px rgba(252, 129, 129, 0.3);
        }
      }

      /* 주문 헤더 */
      .order-header {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        margin-bottom: 16px;
      }

      .order-info {
        flex: 1;
      }

      .order-number {
        font-size: 24px;
        font-weight: 800;
        color: #63b3ed;
        margin-bottom: 4px;
        font-family: 'Courier New', monospace;
      }

      .dev-mode .order-number {
        font-size: 20px;
      }

      .order-meta {
        display: flex;
        align-items: center;
        gap: 12px;
        flex-wrap: wrap;
      }

      .table-number {
        background: rgba(99, 179, 237, 0.2);
        color: #63b3ed;
        padding: 4px 8px;
        border-radius: 6px;
        font-size: 12px;
        font-weight: 600;
      }

      .order-time {
        color: #a0aec0;
        font-size: 12px;
        font-family: 'Courier New', monospace;
      }

      .order-source {
        padding: 4px 8px;
        border-radius: 6px;
        font-size: 11px;
        font-weight: 600;
        text-transform: uppercase;
      }

      .order-source.tll {
        background: rgba(104, 211, 145, 0.2);
        color: #68d391;
      }

      .order-source.pos {
        background: rgba(246, 173, 85, 0.2);
        color: #f6ad55;
      }

      /* 상태 배지 */
      .status-badge {
        position: absolute;
        top: -8px;
        right: 16px;
        padding: 6px 12px;
        border-radius: 20px;
        font-size: 11px;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.5px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
      }

      .status-badge.pending {
        background: linear-gradient(135deg, #f6ad55 0%, #ed8936 100%);
        color: #ffffff;
      }

      .status-badge.cooking {
        background: linear-gradient(135deg, #fc8181 0%, #e53e3e 100%);
        color: #ffffff;
        animation: badge-pulse 2s infinite;
      }

      .status-badge.ready {
        background: linear-gradient(135deg, #68d391 0%, #38a169 100%);
        color: #ffffff;
      }

      @keyframes badge-pulse {
        0%, 100% { transform: scale(1); }
        50% { transform: scale(1.05); }
      }

      /* 고객 정보 */
      .customer-info {
        margin-bottom: 16px;
        padding-bottom: 12px;
        border-bottom: 1px solid rgba(74, 85, 104, 0.3);
      }

      .customer-name {
        font-size: 16px;
        font-weight: 600;
        color: #e2e8f0;
        margin-bottom: 4px;
        display: block;
      }

      .customer-phone {
        font-size: 13px;
        color: #a0aec0;
        font-family: 'Courier New', monospace;
      }

      /* 주문 아이템 */
      .order-items {
        flex: 1;
        margin-bottom: 16px;
      }

      .item {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 12px;
        margin-bottom: 8px;
        background: rgba(45, 55, 72, 0.5);
        border-radius: 8px;
        border-left: 4px solid transparent;
        transition: all 0.2s ease;
      }

      .item:hover {
        background: rgba(45, 55, 72, 0.8);
      }

      .item.pending {
        border-left-color: #f6ad55;
      }

      .item.cooking {
        border-left-color: #fc8181;
        background: rgba(252, 129, 129, 0.1);
      }

      .item.ready {
        border-left-color: #68d391;
        opacity: 0.7;
      }

      .item-info {
        flex: 1;
      }

      .item-name {
        font-weight: 600;
        color: #e2e8f0;
        margin-bottom: 2px;
      }

      .item-options {
        font-size: 12px;
        color: #a0aec0;
      }

      .item-quantity {
        background: rgba(99, 179, 237, 0.2);
        color: #63b3ed;
        padding: 4px 8px;
        border-radius: 12px;
        font-size: 12px;
        font-weight: 700;
        min-width: 24px;
        text-align: center;
      }

      /* 액션 버튼 */
      .order-actions {
        display: flex;
        gap: 8px;
        margin-top: auto;
      }

      .action-btn {
        flex: 1;
        padding: 12px 16px;
        border: none;
        border-radius: 8px;
        font-weight: 700;
        font-size: 13px;
        cursor: pointer;
        transition: all 0.2s ease;
        text-transform: uppercase;
        letter-spacing: 0.5px;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 6px;
      }

      .dev-mode .action-btn {
        padding: 10px 12px;
        font-size: 11px;
      }

      .action-btn:hover {
        transform: translateY(-1px);
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
      }

      .action-btn:active {
        transform: translateY(0);
      }

      .start-cooking-btn {
        background: linear-gradient(135deg, #68d391 0%, #38a169 100%);
        color: #ffffff;
      }

      .complete-cooking-btn {
        background: linear-gradient(135deg, #63b3ed 0%, #3182ce 100%);
        color: #ffffff;
      }

      .serve-btn {
        background: linear-gradient(135deg, #9f7aea 0%, #805ad5 100%);
        color: #ffffff;
      }

      /* 하단 상태바 */
      .kds-footer {
        height: 60px;
        background: linear-gradient(135deg, #1a202c 0%, #2d3748 100%);
        border-top: 1px solid #4a5568;
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 0 32px;
      }

      .dev-mode .kds-footer {
        height: 50px;
        padding: 0 20px;
      }

      .footer-left .today-stats {
        display: flex;
        gap: 24px;
      }

      .stat-item {
        font-size: 14px;
        color: #a0aec0;
      }

      .stat-item strong {
        color: #e2e8f0;
        font-weight: 700;
      }

      .footer-center .system-info {
        display: flex;
        align-items: center;
        gap: 8px;
        font-size: 12px;
        color: #718096;
      }

      .separator {
        opacity: 0.5;
      }

      .footer-right {
        display: flex;
        gap: 12px;
      }

      .footer-btn {
        background: rgba(74, 85, 104, 0.6);
        border: 1px solid rgba(160, 174, 192, 0.3);
        color: #e2e8f0;
        padding: 8px 16px;
        border-radius: 6px;
        cursor: pointer;
        font-size: 12px;
        font-weight: 600;
        transition: all 0.2s ease;
      }

      .footer-btn:hover {
        background: rgba(74, 85, 104, 0.8);
        border-color: rgba(160, 174, 192, 0.5);
        transform: translateY(-1px);
      }

      /* 로딩 상태 */
      .loading-overlay {
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(15, 20, 25, 0.8);
        display: flex;
        align-items: center;
        justify-content: center;
        backdrop-filter: blur(4px);
        z-index: 100;
      }

      .loading-spinner {
        width: 40px;
        height: 40px;
        border: 3px solid rgba(99, 179, 237, 0.3);
        border-top: 3px solid #63b3ed;
        border-radius: 50%;
        animation: spin 1s linear infinite;
      }

      @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }

      .loading-text {
        margin-left: 16px;
        font-size: 16px;
        color: #e2e8f0;
      }

      /* 스크롤바 스타일 */
      .orders-grid::-webkit-scrollbar {
        width: 8px;
      }

      .orders-grid::-webkit-scrollbar-track {
        background: rgba(45, 55, 72, 0.3);
        border-radius: 4px;
      }

      .orders-grid::-webkit-scrollbar-thumb {
        background: rgba(99, 179, 237, 0.5);
        border-radius: 4px;
      }

      .orders-grid::-webkit-scrollbar-thumb:hover {
        background: rgba(99, 179, 237, 0.7);
      }
    </style>
  `;

  // 개발 모드일 때 body 클래스 추가
  if (isDevMode) {
    document.body.classList.add('dev-mode');
  } else {
    document.body.classList.remove('dev-mode');
  }

  // 시간 업데이트 시작
  updateCurrentTime();
  setInterval(updateCurrentTime, 1000);

  console.log('✅ KDS 인터페이스 렌더링 완료');
}

// 현재 시간 업데이트
function updateCurrentTime() {
  const timeElement = document.getElementById('currentTime');
  if (timeElement) {
    const now = new Date();
    const timeString = now.toLocaleString('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    });
    timeElement.textContent = timeString.replace(/\. /g, '.').replace(/\.$/, '');
  }
}

// 주문 데이터 로딩
async function loadKDSOrders(storeId) {
  try {
    console.log(`📟 KDS - 매장 ${storeId} 주문 데이터 로딩 시작`);

    showLoadingState();

    const response = await fetch(`/api/kds/orders/${storeId}`, {
      headers: {
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache'
      }
    });

    if (!response.ok) {
      throw new Error('주문 데이터 조회 실패');
    }

    const data = await response.json();

    if (data.success) {
      updateKDSOrderCards(data.orders);
      updateOrderCounts(data.orders);
      updateLastUpdateTime();
      hideLoadingState();
      console.log(`✅ KDS 주문 데이터 로딩 완료 (${data.orders.length}개)`);
    } else {
      throw new Error(data.error || '데이터 조회 실패');
    }

  } catch (error) {
    console.error('❌ KDS 주문 데이터 로딩 실패:', error);
    hideLoadingState();
    showErrorState();
  }
}

// 로딩 상태 표시
function showLoadingState() {
  const container = document.getElementById('ordersContainer');
  if (!container) return;

  let loadingOverlay = container.querySelector('.loading-overlay');
  if (!loadingOverlay) {
    loadingOverlay = document.createElement('div');
    loadingOverlay.className = 'loading-overlay';
    loadingOverlay.innerHTML = `
      <div class="loading-spinner"></div>
      <div class="loading-text">주문 데이터 로딩 중...</div>
    `;
    container.appendChild(loadingOverlay);
  }
  loadingOverlay.style.display = 'flex';
}

// 로딩 상태 숨김
function hideLoadingState() {
  const loadingOverlay = document.querySelector('.loading-overlay');
  if (loadingOverlay) {
    loadingOverlay.style.display = 'none';
  }
}

// 에러 상태 표시
function showErrorState() {
  const ordersGrid = document.getElementById('ordersGrid');
  const emptyState = document.getElementById('emptyState');

  if (ordersGrid) {
    ordersGrid.innerHTML = '';
  }

  if (emptyState) {
    emptyState.innerHTML = `
      <div class="empty-icon">
        <svg width="64" height="64" viewBox="0 0 24 24" fill="currentColor" style="color: #fc8181;">
          <path d="M12,2L13.09,8.26L22,9L13.09,9.74L12,16L10.91,9.74L2,9L10.91,8.26L12,2M12,21L10.09,15.74L2,15L10.09,14.26L12,8L13.91,14.26L22,15L13.91,15.74L12,21Z"/>
        </svg>
      </div>
      <h3>데이터를 불러올 수 없습니다</h3>
      <p>네트워크 연결을 확인하고 다시 시도해주세요.</p>
      <button class="action-btn start-cooking-btn" onclick="refreshKDS()" style="margin-top: 16px; max-width: 200px;">
        다시 시도
      </button>
    `;
    emptyState.style.display = 'block';
  }
}

// KDS 주문 카드 업데이트
function updateKDSOrderCards(orders) {
  const ordersGrid = document.getElementById('ordersGrid');
  const emptyState = document.getElementById('emptyState');

  if (!ordersGrid) return;

  // 기존 카드들 제거
  ordersGrid.innerHTML = '';

  if (orders.length === 0) {
    emptyState.style.display = 'block';
    return;
  }

  emptyState.style.display = 'none';

  // 주문 카드들 생성
  orders.forEach(order => {
    const orderCard = createProfessionalOrderCard(order);
    ordersGrid.appendChild(orderCard);
  });

  console.log(`📟 KDS 카드 업데이트 완료: ${orders.length}개 주문`);
}

// 전문적인 주문 카드 생성
function createProfessionalOrderCard(order) {
  const orderTime = new Date(order.created_at);
  const timeString = orderTime.toLocaleTimeString('ko-KR', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  });

  const statusClass = order.cookingStatus?.toLowerCase() || 'pending';
  const sourceClass = order.source === 'TLL' ? 'tll' : 'pos';

  const card = document.createElement('div');
  card.className = `order-card ${statusClass}`;
  card.dataset.orderId = order.id;

  const itemsHTML = order.items?.map(item => {
    const itemStatusClass = item.cooking_status?.toLowerCase() || 'pending';
    return `
      <div class="item ${itemStatusClass}">
        <div class="item-info">
          <div class="item-name">${item.menu_name}</div>
          ${item.options ? `<div class="item-options">${item.options}</div>` : ''}
        </div>
        <div class="item-quantity">×${item.quantity}</div>
      </div>
    `;
  }).join('') || '';

  const statusTexts = {
    'pending': '대기중',
    'cooking': '조리중', 
    'ready': '완료',
    'completed': '서빙완료'
  };

  card.innerHTML = `
    <div class="status-badge ${statusClass}">
      ${statusTexts[statusClass] || '대기중'}
    </div>

    <div class="order-header">
      <div class="order-info">
        <div class="order-number">#${order.id}</div>
        <div class="order-meta">
          ${order.table_number ? `<span class="table-number">테이블 ${order.table_number}</span>` : ''}
          <span class="order-time">${timeString}</span>
          <span class="order-source ${sourceClass}">
            ${order.source === 'TLL' ? '📱 앱' : '🔴 POS'}
          </span>
        </div>
      </div>
    </div>

    <div class="customer-info">
      <span class="customer-name">${order.customername || '손님'}</span>
      ${order.customer_phone ? `<span class="customer-phone">${order.customer_phone}</span>` : ''}
    </div>

    <div class="order-items">
      ${itemsHTML}
    </div>

    <div class="order-actions">
      ${generateActionButtons(order)}
    </div>
  `;

  return card;
}

// 액션 버튼 생성
function generateActionButtons(order) {
  const status = order.cookingStatus;

  if (status === 'COMPLETED') {
    return '<div style="text-align: center; color: #68d391; font-weight: 600;">서빙 완료</div>';
  }

  let buttons = [];

  if (status === 'PENDING' || !status) {
    buttons.push(`
      <button class="action-btn start-cooking-btn" onclick="startCookingOrder(${order.id})">
        🔥 조리 시작
      </button>
    `);
  }

  if (status === 'COOKING') {
    buttons.push(`
      <button class="action-btn complete-cooking-btn" onclick="completeOrder(${order.id})">
        ✅ 조리 완료
      </button>
    `);
  }

  if (status === 'READY') {
    buttons.push(`
      <button class="action-btn serve-btn" onclick="serveOrder(${order.id})">
        🍽️ 서빙 완료
      </button>
    `);
  }

  return buttons.join('');
}

// 주문 카운트 업데이트
function updateOrderCounts(orders) {
  const pendingCards = orders.filter(o => o.cookingStatus === 'PENDING').length;
  const cookingCards = orders.filter(o => o.cookingStatus === 'COOKING').length;
  const readyCards = orders.filter(o => o.cookingStatus === 'READY').length;

  const pendingCount = document.getElementById('pendingCount');
  const cookingCount = document.getElementById('cookingCount');
  const readyCount = document.getElementById('readyCount');
  const activeOrders = document.getElementById('activeOrders');

  if (pendingCount) pendingCount.textContent = pendingCards;
  if (cookingCount) cookingCount.textContent = cookingCards;
  if (readyCount) readyCount.textContent = readyCards;
  if (activeOrders) activeOrders.textContent = orders.length;
}

// 마지막 업데이트 시간 갱신
function updateLastUpdateTime() {
  const lastUpdateElement = document.getElementById('lastUpdate');
  if (lastUpdateElement) {
    const now = new Date();
    const timeString = now.toLocaleTimeString('ko-KR', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });
    lastUpdateElement.textContent = `최종 업데이트: ${timeString}`;
  }
}

// 데이터 새로고침
function refreshKDS() {
  console.log('🔄 KDS 수동 새로고침');
  if (window.currentStoreId) {
    loadKDSOrders(window.currentStoreId);
  }
}

// 주문 전체 조리 시작
async function startCookingOrder(orderId) {
  try {
    const response = await fetch(`/api/kds/orders/${orderId}/start-cooking`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' }
    });

    const result = await response.json();
    if (result.success) {
      showNotification('주문 조리를 시작했습니다', 'success');
      refreshKDS();
    } else {
      showNotification('조리 시작 실패: ' + result.error, 'error');
    }
  } catch (error) {
    console.error('❌ 주문 조리 시작 실패:', error);
    showNotification('조리 시작 중 오류가 발생했습니다', 'error');
  }
}

// 주문 완료
async function completeOrder(orderId) {
  try {
    const response = await fetch(`/api/kds/orders/${orderId}/complete`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' }
    });

    const result = await response.json();
    if (result.success) {
      showNotification('주문이 완료되었습니다', 'success');
      refreshKDS();
    } else {
      showNotification('주문 완료 실패: ' + result.error, 'error');
    }
  } catch (error) {
    console.error('❌ 주문 완료 실패:', error);
    showNotification('주문 완료 중 오류가 발생했습니다', 'error');
  }
}

// 서빙 완료
async function serveOrder(orderId) {
  try {
    // 서빙 완료는 주문 완료와 동일하게 처리
    const response = await fetch(`/api/kds/orders/${orderId}/complete`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' }
    });

    const result = await response.json();
    if (result.success) {
      showNotification('서빙이 완료되었습니다', 'success');
      refreshKDS();
    } else {
      showNotification('서빙 완료 실패: ' + result.error, 'error');
    }
  } catch (error) {
    console.error('❌ 서빙 완료 실패:', error);
    showNotification('서빙 완료 중 오류가 발생했습니다', 'error');
  }
}

// 알림 표시
function showNotification(message, type = 'info') {
  const notification = document.createElement('div');
  const typeColors = {
    'success': '#68d391',
    'error': '#fc8181', 
    'info': '#63b3ed',
    'warning': '#f6ad55'
  };

  notification.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    background: ${typeColors[type] || typeColors.info};
    color: #ffffff;
    padding: 16px 24px;
    border-radius: 8px;
    font-weight: 600;
    z-index: 10000;
    box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
    animation: slideInRight 0.3s ease-out;
    max-width: 300px;
  `;

  notification.textContent = message;
  document.body.appendChild(notification);

  setTimeout(() => {
    notification.style.animation = 'slideOutRight 0.3s ease-in';
    setTimeout(() => {
      if (notification.parentNode) {
        notification.parentNode.removeChild(notification);
      }
    }, 300);
  }, 3000);
}

// 매장 선택 화면 렌더링
function renderKDSStoreSelection() {
  const main = document.getElementById('main');
  main.innerHTML = `
    <div style="padding: 40px; text-align: center; background: #0f1419; color: #e2e8f0; min-height: 100vh; display: flex; flex-direction: column; justify-content: center; align-items: center;">
      <h1 style="font-size: 2.5rem; margin-bottom: 1rem; color: #63b3ed;">📟 KDS</h1>
      <p style="margin: 20px 0; color: #a0aec0; font-size: 1.2rem;">매장을 선택하세요</p>
      <p style="margin: 20px 0; color: #718096;">올바른 매장 ID가 필요합니다.</p>
      <button onclick="window.location.href='/'" style="background: linear-gradient(135deg, #63b3ed 0%, #3182ce 100%); color: white; border: none; padding: 16px 32px; border-radius: 8px; cursor: pointer; font-size: 16px; font-weight: 600; margin-top: 2rem;">
        로그인 화면으로 돌아가기
      </button>
    </div>
  `;
}

// 에러 화면 렌더링
function renderKDSError() {
  const main = document.getElementById('main');
  main.innerHTML = `
    <div style="padding: 40px; text-align: center; background: #0f1419; color: #e2e8f0; min-height: 100vh; display: flex; flex-direction: column; justify-content: center; align-items: center;">
      <h1 style="font-size: 2.5rem; margin-bottom: 1rem; color: #fc8181;">❌ KDS 로딩 실패</h1>
      <p style="margin: 20px 0; color: #a0aec0; font-size: 1.2rem;">매장 정보를 불러올 수 없습니다.</p>
      <button onclick="window.location.href='/'" style="background: linear-gradient(135deg, #fc8181 0%, #e53e3e 100%); color: white; border: none; padding: 16px 32px; border-radius: 8px; cursor: pointer; font-size: 16px; font-weight: 600; margin-top: 2rem;">
        로그인 화면으로 돌아가기
      </button>
    </div>
  `;
}

// CSS 애니메이션 추가
const style = document.createElement('style');
style.textContent = `
  @keyframes slideInRight {
    from {
      transform: translateX(100%);
      opacity: 0;
    }
    to {
      transform: translateX(0);
      opacity: 1;
    }
  }

  @keyframes slideOutRight {
    from {
      transform: translateX(0);
      opacity: 1;
    }
    to {
      transform: translateX(100%);
      opacity: 0;
    }
  }
`;
document.head.appendChild(style);

// WebSocket 연결 설정
function setupKDSWebSocket(storeId) {
  console.log(`🔌 KDS WebSocket 연결 시작... (매장 ID: ${storeId})`);

  const socket = io({
    transports: ['websocket', 'polling'],
    timeout: 20000,
    forceNew: true
  });

  window.kdsSocket = socket;
  window.currentStoreId = storeId;

  socket.on('connect', () => {
    console.log('✅ KDS WebSocket 연결 성공:', socket.id);
    socket.emit('join-kds-room', parseInt(storeId));
    updateConnectionStatus(true);
    showNotification('실시간 연결됨', 'success');
  });

  socket.on('disconnect', (reason) => {
    console.log('❌ KDS WebSocket 연결 해제:', reason);
    updateConnectionStatus(false);
    showNotification('연결 끊김', 'error');
  });

  socket.on('reconnect', (attemptNumber) => {
    console.log('🔄 KDS WebSocket 재연결 성공:', attemptNumber);
    socket.emit('join-kds-room', parseInt(storeId));
    updateConnectionStatus(true);
    showNotification('재연결됨', 'success');
  });

  socket.on('kds-update', (updateData) => {
    console.log('📡 KDS 실시간 업데이트 수신:', updateData);
    if (updateData && updateData.storeId == storeId) {
      handleKDSRealTimeUpdate(updateData);
    }
  });

  window.kdsSocket = socket;
}

// 실시간 업데이트 처리
function handleKDSRealTimeUpdate(updateData) {
  const { type, data } = updateData;

  switch (type) {
    case 'new-order':
      showNotification(`새 주문 #${data?.orderId || ''}`, 'info');
      playNotificationSound();
      break;
    case 'cooking-started':
      showNotification(`조리 시작: ${data?.menuName || '메뉴'}`, 'info');
      break;
    case 'cooking-completed':
      showNotification(`조리 완료: ${data?.menuName || '메뉴'}`, 'success');
      break;
    default:
      break;
  }

  // 데이터 새로고침
  refreshKDS();
}

// 연결 상태 업데이트
function updateConnectionStatus(isConnected) {
  const statusDot = document.querySelector('.status-dot');
  const statusText = document.querySelector('.status-indicator span');

  if (statusDot && statusText) {
    if (isConnected) {
      statusDot.className = 'status-dot online';
      statusText.textContent = '실시간 연결';
    } else {
      statusDot.className = 'status-dot offline';
      statusText.textContent = '연결 끊김';
    }
  }
}

// 알림음 재생
function playNotificationSound() {
  try {
    const alertsEnabled = localStorage.getItem('kdsAlertsEnabled') !== 'false';
    if (alertsEnabled) {
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);

      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.3);
    }
  } catch (error) {
    console.log('🔇 알림음 재생 실패:', error);
  }
}

// 주문 상세 보기
function showOrderDetail(orderId) {
  console.log('📋 주문 상세 보기:', orderId);
  showNotification('상세 화면은 곧 구현될 예정입니다', 'info');
}

// 전역 함수로 노출
window.renderKDS = renderKDS;
window.startCookingOrder = startCookingOrder;
window.completeOrder = completeOrder;
window.serveOrder = serveOrder;
window.refreshKDS = refreshKDS;
window.setupKDSWebSocket = setupKDSWebSocket;
window.handleKDSRealTimeUpdate = handleKDSRealTimeUpdate;
window.updateConnectionStatus = updateConnectionStatus;
window.playNotificationSound = playNotificationSound;
window.showOrderDetail = showOrderDetail;

console.log('✅ Professional KDS 시스템 로드 완료');