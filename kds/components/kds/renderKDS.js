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
    const storeResponse = await fetch(`/api/stores/${storeId}`, {
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

    // 자동 새로고침 설정
    setupKDSAutoRefresh(storeId);

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
    <div class="kds-container ${isDevMode ? 'dev-mode' : ''}">
      <!-- KDS 헤더 -->
      <div class="kds-header">
        <div class="header-left">
          <div class="date-time">
            <div class="date">2024년 1월 27일</div>
            <div class="time" id="currentTime">오후 10:31:35</div>
          </div>
        </div>
        ${!isDevMode ? `
        <div class="header-center">
          <div class="pagination">
            <button class="nav-btn">◀</button>
            <span class="page-info">페이지 1 / 1</span>
            <button class="nav-btn">▶</button>
          </div>
        </div>
        ` : ''}
        <div class="header-right">
          <div class="control-buttons">
            <button class="ctrl-btn orders-btn">주문</button>
            ${!isDevMode ? '<button class="ctrl-btn functions-btn">기능</button>' : ''}
            <button class="ctrl-btn settings-btn">⚙</button>
            <button class="ctrl-btn exit-btn">✖</button>
          </div>
          ${!isDevMode ? `
          <div class="summary-info">
            <div class="summary-row">치킨: 1163</div>
            <div class="summary-row">판매완료: 1</div>
            <div class="summary-row">콤보: 1474</div>
            <div class="summary-row">세트 메뉴: 8</div>
            <div class="summary-row">8</div>
          </div>
          ` : ''}
        </div>
      </div>

      <!-- 주문 그리드 -->
      <div class="orders-grid ${isDevMode ? 'dev-mode' : ''}" id="ordersGrid">
        <!-- 주문 카드들이 동적으로 생성됩니다 -->

        <!-- 다기능 카드 (10번 위치) -->
        <div class="multifunction-card">
          <div class="multifunction-header">
            <div class="multifunction-title">📊 주방 상태</div>
          </div>
          
          <div class="queue-info">
            <div class="queue-item">
              <div class="queue-label">대기 중</div>
              <div class="queue-count" id="waitingCount">+3</div>
            </div>
            <div class="queue-item">
              <div class="queue-label">조리 중</div>
              <div class="queue-count cooking" id="cookingCount">3</div>
            </div>
          </div>

          <div class="quick-stats">
            <div class="stat-item">
              <div class="stat-label">오늘 완료</div>
              <div class="stat-value">27건</div>
            </div>
            <div class="stat-item">
              <div class="stat-label">평균 시간</div>
              <div class="stat-value">8분</div>
            </div>
          </div>

          <div class="multifunction-actions">
            <button class="multi-btn settings-btn" onclick="showKDSSettings()">
              ⚙️ 설정
            </button>
            <button class="multi-btn history-btn" onclick="showOrderHistory()">
              📋 내역
            </button>
            <button class="multi-btn refresh-btn" onclick="refreshKDS()">
              🔄 새로고침
            </button>
            <button class="multi-btn alert-btn" onclick="toggleAlerts()">
              🔔 알림
            </button>
          </div>

          <div class="system-status">
            <div class="status-indicator online">● 온라인</div>
            <div class="last-update" id="lastUpdate">최종 업데이트: 방금 전</div>
          </div>
        </div>

        <!-- 빈 카드 슬롯들 (필요한 만큼 추가) -->
        ${Array.from({length: Math.max(0, 9 - 9)}, (_, i) => `
          <div class="empty-card-slot">
            <div class="slot-number">${10 + i}</div>
            <div class="slot-placeholder">주문 대기 중</div>
          </div>
        `).join('')}
      </div>

      <!-- 하단 상태바 -->
      <div class="status-bar">
        <div class="status-left">
          <button class="status-btn">필터 - 전체 주문</button>
        </div>
        <div class="status-center">
          <button class="status-btn">보기 기준 : 그릴</button>
        </div>
        <div class="status-right">
          <button class="status-btn">기록</button>
          <div class="version">버전 6.4.36</div>
        </div>
      </div>
    </div>

    <style>
      * {
        margin: 0;
        padding: 0;
        box-sizing: border-box;
      }

      body {
        font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
        background: #ffffff;
        color: #333;
        overflow: hidden;
      }

      /* 개발 모드일 때 body 스타일 조정 */
      body.dev-mode {
        overflow: visible;
      }

      .kds-container {
        width: 1200px;
        height: 700px;
        background: linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%);
        display: flex;
        flex-direction: column;
        margin: 20px auto;
        border: 2px solid #444;
        border-radius: 20px;
        box-shadow: 0 16px 40px rgba(0, 0, 0, 0.3);
        overflow: hidden;
      }

      /* 개발 모드 스타일 */
      .kds-container.dev-mode {
        width: 500px;
        height: 800px;
        margin: 10px;
        position: fixed;
        top: 10px;
        right: 10px;
        z-index: 1000;
        background: linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%);
        box-shadow: 0 20px 50px rgba(0, 0, 0, 0.4);
      }

      /* 헤더 스타일 */
      .kds-header {
        height: 60px;
        background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
        border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 0 24px;
        border-radius: 18px 18px 0 0;
        backdrop-filter: blur(10px);
      }

      .dev-mode .kds-header {
        height: 50px;
        padding: 0 20px;
      }

      .header-left .date-time {
        text-align: left;
      }

      .date {
        font-size: 12px;
        color: rgba(255, 255, 255, 0.8);
        margin-bottom: 2px;
      }

      .time {
        font-size: 14px;
        font-weight: bold;
        color: #fff;
        font-family: 'Courier New', monospace;
      }

      .header-center .pagination {
        display: flex;
        align-items: center;
        gap: 10px;
        background: rgba(255, 255, 255, 0.15);
        padding: 8px 15px;
        border-radius: 8px;
        backdrop-filter: blur(10px);
      }

      .nav-btn {
        background: rgba(255, 255, 255, 0.2);
        border: none;
        color: white;
        padding: 6px 12px;
        border-radius: 6px;
        cursor: pointer;
        font-size: 12px;
        transition: all 0.2s ease;
      }

      .nav-btn:hover {
        background: rgba(255, 255, 255, 0.3);
      }

      .page-info {
        color: white;
        font-weight: bold;
        font-size: 12px;
        min-width: 80px;
        text-align: center;
      }

      .header-right {
        display: flex;
        gap: 15px;
        align-items: center;
      }

      .control-buttons {
        display: flex;
        gap: 8px;
      }

      .ctrl-btn {
        background: rgba(255, 255, 255, 0.15);
        border: none;
        color: white;
        padding: 8px 12px;
        border-radius: 8px;
        cursor: pointer;
        font-size: 12px;
        font-weight: 600;
        transition: all 0.2s ease;
        backdrop-filter: blur(10px);
      }

      .dev-mode .ctrl-btn {
        padding: 6px 8px;
        font-size: 10px;
      }

      .ctrl-btn:hover {
        background: #777;
      }

      .orders-btn { background: #4a90e2; }
      .functions-btn { background: #7b68ee; }
      .settings-btn { background: #666; }
      .exit-btn { background: #e74c3c; }

      .summary-info {
        font-size: 10px;
        color: #ccc;
        text-align: right;
      }

      .summary-row {
        margin-bottom: 1px;
      }

      /* 주문 그리드 */
      .orders-grid {
        flex: 1;
        display: grid;
        grid-template-columns: repeat(5, 1fr);
        grid-template-rows: repeat(2, 1fr);
        gap: 8px;
        padding: 12px;
        overflow: hidden;
      }

      /* 개발 모드 그리드 - 리스트 형태 */
      .orders-grid.dev-mode {
        display: flex;
        flex-direction: column;
        gap: 6px;
        padding: 8px;
        overflow-y: auto;
        overflow-x: hidden;
      }

      /* 주문 카드 */
      .order-card {
        background: linear-gradient(135deg, #374151 0%, #4b5563 100%);
        border: 1px solid #6b7280;
        border-radius: 12px;
        padding: 12px;
        display: flex;
        flex-direction: column;
        position: relative;
        cursor: pointer;
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        font-size: 12px;
        color: #f9fafb;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        backdrop-filter: blur(5px);
        height: 280px;
      }

      /* 개발 모드 카드 - 리스트 아이템 형태 */
      .dev-mode .order-card {
        min-height: auto;
        height: auto;
        flex-shrink: 0;
        padding: 16px;
        margin-bottom: 0;
        font-size: 11px;
      }

      .order-card:hover {
        border-color: #9ca3af;
        transform: translateY(-4px);
        box-shadow: 0 12px 30px rgba(0, 0, 0, 0.25);
        background: linear-gradient(135deg, #4b5563 0%, #6b7280 100%);
      }

      .order-card.pending {
        border-color: #f59e0b;
        background: linear-gradient(135deg, #92400e 0%, #b45309 100%);
        box-shadow: 0 4px 12px rgba(245, 158, 11, 0.2);
      }

      .order-card.cooking {
        border-color: #ef4444;
        background: linear-gradient(135deg, #dc2626 0%, #ef4444 100%);
        box-shadow: 0 4px 12px rgba(239, 68, 68, 0.2);
        animation: cooking-pulse 2s infinite;
      }

      @keyframes cooking-pulse {
        0%, 100% {
          box-shadow: 0 4px 12px rgba(239, 68, 68, 0.2);
        }
        50% {
          box-shadow: 0 6px 20px rgba(239, 68, 68, 0.4);
        }
      }

      .order-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 8px;
      }

      .order-number {
        font-size: 14px;
        font-weight: 800;
        color: #60a5fa;
        text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
      }

      .order-type {
        background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
        color: white;
        padding: 4px 8px;
        border-radius: 6px;
        font-size: 8px;
        font-weight: 600;
        box-shadow: 0 2px 4px rgba(59, 130, 246, 0.3);
      }

      .order-time {
        color: #d1d5db;
        font-size: 9px;
        font-family: 'Courier New', monospace;
        margin-bottom: 6px;
        font-weight: 500;
      }

      .order-status {
        font-size: 9px;
        font-weight: 700;
        margin-bottom: 8px;
        padding: 4px 6px;
        border-radius: 6px;
        text-align: center;
        word-wrap: break-word;
        line-height: 1.2;
        text-transform: uppercase;
        letter-spacing: 0.3px;
      }

      .order-status.pending {
        background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
        color: white;
        box-shadow: 0 2px 6px rgba(245, 158, 11, 0.3);
      }

      .order-status.cooking {
        background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
        color: white;
        box-shadow: 0 2px 6px rgba(239, 68, 68, 0.3);
      }

      .order-items {
        flex: 1;
        margin-bottom: 8px;
        overflow-y: auto;
      }

      .dev-mode .order-items {
        flex: none;
        max-height: 100px;
        overflow-y: auto;
      }

      .item {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 3px 0;
        border-bottom: 1px solid rgba(107, 114, 128, 0.3);
        color: #e5e7eb;
        font-size: 9px;
        transition: all 0.2s ease;
      }

      .item:last-child {
        border-bottom: none;
      }

      .item:hover {
        background: rgba(255, 255, 255, 0.05);
        border-radius: 6px;
        padding-left: 8px;
        padding-right: 8px;
      }

      .item-name {
        flex: 1;
        margin-right: 12px;
        word-wrap: break-word;
        font-weight: 500;
      }

      .qty {
        background: linear-gradient(135deg, #6b7280 0%, #4b5563 100%);
        color: white;
        padding: 2px 6px;
        border-radius: 10px;
        font-size: 8px;
        font-weight: 700;
        min-width: 18px;
        text-align: center;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
      }

      .order-actions {
        display: flex;
        gap: 8px;
        margin-top: 8px;
      }

      .action-btn {
        flex: 1;
        padding: 6px 10px;
        border: none;
        border-radius: 8px;
        cursor: pointer;
        font-size: 8px;
        font-weight: 700;
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        text-transform: uppercase;
        letter-spacing: 0.3px;
      }

      .start-btn {
        background: linear-gradient(135deg, #10b981 0%, #059669 100%);
        color: white;
        box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
      }

      .start-btn:hover {
        background: linear-gradient(135deg, #059669 0%, #047857 100%);
        transform: translateY(-2px);
        box-shadow: 0 6px 16px rgba(16, 185, 129, 0.4);
      }

      .cancel-btn {
        background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
        color: white;
        box-shadow: 0 4px 12px rgba(239, 68, 68, 0.3);
      }

      .cancel-btn:hover {
        background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%);
        transform: translateY(-2px);
        box-shadow: 0 6px 16px rgba(239, 68, 68, 0.4);
      }

      .order-timer {
        position: absolute;
        top: 8px;
        right: 8px;
        background: #e74c3c;
        color: white;
        padding: 2px 6px;
        border-radius: 4px;
        font-family: 'Courier New', monospace;
        font-weight: bold;
      }

      .timer-display {
        font-size: 9px;
        animation: pulse 1s infinite;
      }

      @keyframes pulse {
        0% { opacity: 1; }
        50% { opacity: 0.6; }
        100% { opacity: 1; }
      }

      /* 하단 상태바 */
      .status-bar {
        height: 50px;
        background: linear-gradient(135deg, #1f2937 0%, #374151 100%);
        border-top: 1px solid rgba(107, 114, 128, 0.3);
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 0 24px;
        border-radius: 0 0 18px 18px;
      }

      .dev-mode .status-bar {
        height: 40px;
        padding: 0 20px;
      }

      .dev-mode .status-btn {
        padding: 6px 12px;
        font-size: 10px;
      }

      .dev-mode .version {
        font-size: 9px;
      }

      .status-btn {
        background: linear-gradient(135deg, rgba(75, 85, 99, 0.8) 0%, rgba(55, 65, 81, 0.8) 100%);
        border: 1px solid rgba(156, 163, 175, 0.3);
        color: #f3f4f6;
        padding: 8px 16px;
        border-radius: 8px;
        cursor: pointer;
        font-size: 11px;
        font-weight: 600;
        transition: all 0.3s ease;
        backdrop-filter: blur(5px);
      }

      .status-btn:hover {
        background: linear-gradient(135deg, rgba(107, 114, 128, 0.9) 0%, rgba(75, 85, 99, 0.9) 100%);
        border-color: rgba(156, 163, 175, 0.5);
        transform: translateY(-1px);
        box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
      }

      .status-right {
        display: flex;
        align-items: center;
        gap: 20px;
      }

      .version {
        color: rgba(209, 213, 219, 0.8);
        font-size: 10px;
        font-family: 'Courier New', monospace;
        font-weight: 500;
      }

      /* 조리중인 카드 숨김 처리 */
      .order-card.cooking .order-actions {
        display: none;
      }

      /* 빈 카드 슬롯 스타일 */
      .empty-card-slot {
        background: linear-gradient(135deg, rgba(55, 65, 81, 0.3) 0%, rgba(75, 85, 99, 0.3) 100%);
        border: 2px dashed rgba(156, 163, 175, 0.4);
        border-radius: 12px;
        padding: 12px;
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
        position: relative;
        color: rgba(156, 163, 175, 0.6);
        height: 280px;
        text-align: center;
        transition: all 0.3s ease;
      }

      .dev-mode .empty-card-slot {
        height: 120px;
        flex-shrink: 0;
        padding: 16px;
        margin-bottom: 0;
      }

      .empty-card-slot:hover {
        border-color: rgba(156, 163, 175, 0.6);
        background: linear-gradient(135deg, rgba(55, 65, 81, 0.4) 0%, rgba(75, 85, 99, 0.4) 100%);
      }

      .slot-number {
        font-size: 24px;
        font-weight: 800;
        color: rgba(156, 163, 175, 0.4);
        margin-bottom: 8px;
        font-family: 'Courier New', monospace;
      }

      .slot-placeholder {
        font-size: 12px;
        font-weight: 500;
        color: rgba(156, 163, 175, 0.5);
        text-transform: uppercase;
        letter-spacing: 0.5px;
      }

      /* 다기능 카드 스타일 */
      .multifunction-card {
        background: linear-gradient(135deg, #2d3748 0%, #4a5568 100%);
        border: 2px solid #4a90e2;
        border-radius: 12px;
        padding: 12px;
        display: flex;
        flex-direction: column;
        position: relative;
        color: #f9fafb;
        box-shadow: 0 4px 12px rgba(74, 144, 226, 0.2);
        backdrop-filter: blur(5px);
        height: 280px;
        overflow: hidden;
      }

      .dev-mode .multifunction-card {
        height: auto;
        flex-shrink: 0;
        padding: 16px;
        margin-bottom: 0;
      }

      .multifunction-card:hover {
        border-color: #63b3ed;
        transform: translateY(-2px);
        box-shadow: 0 8px 20px rgba(74, 144, 226, 0.3);
      }

      .multifunction-header {
        margin-bottom: 12px;
        text-align: center;
      }

      .multifunction-title {
        font-size: 11px;
        font-weight: 700;
        color: #4a90e2;
        text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
      }

      .queue-info {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 8px;
        margin-bottom: 10px;
      }

      .queue-item {
        background: rgba(0, 0, 0, 0.2);
        padding: 6px 8px;
        border-radius: 8px;
        text-align: center;
      }

      .queue-label {
        font-size: 8px;
        color: #cbd5e0;
        margin-bottom: 2px;
      }

      .queue-count {
        font-size: 14px;
        font-weight: 800;
        color: #f59e0b;
      }

      .queue-count.cooking {
        color: #ef4444;
      }

      .quick-stats {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 6px;
        margin-bottom: 10px;
      }

      .stat-item {
        background: rgba(0, 0, 0, 0.15);
        padding: 4px 6px;
        border-radius: 6px;
        text-align: center;
      }

      .stat-label {
        font-size: 7px;
        color: #a0aec0;
        margin-bottom: 1px;
      }

      .stat-value {
        font-size: 9px;
        font-weight: 600;
        color: #e2e8f0;
      }

      .multifunction-actions {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 4px;
        margin-bottom: 8px;
      }

      .multi-btn {
        background: linear-gradient(135deg, rgba(74, 144, 226, 0.8) 0%, rgba(99, 179, 237, 0.8) 100%);
        border: none;
        color: white;
        padding: 4px 6px;
        border-radius: 6px;
        cursor: pointer;
        font-size: 7px;
        font-weight: 600;
        transition: all 0.2s ease;
        text-align: center;
      }

      .dev-mode .multi-btn {
        padding: 6px 8px;
        font-size: 8px;
      }

      .multi-btn:hover {
        background: linear-gradient(135deg, rgba(74, 144, 226, 1) 0%, rgba(99, 179, 237, 1) 100%);
        transform: translateY(-1px);
        box-shadow: 0 2px 6px rgba(74, 144, 226, 0.3);
      }

      .system-status {
        margin-top: auto;
        text-align: center;
        padding-top: 6px;
        border-top: 1px solid rgba(160, 174, 192, 0.2);
      }

      .status-indicator {
        font-size: 8px;
        font-weight: 600;
        margin-bottom: 2px;
      }

      .status-indicator.online {
        color: #10b981;
      }

      .last-update {
        font-size: 6px;
        color: #718096;
        font-family: 'Courier New', monospace;
      }

      /* 아이템별 조리 상태 스타일 */
      .item {
        position: relative;
      }

      .item.pending {
        background: rgba(245, 158, 11, 0.1);
        border-left: 3px solid #f59e0b;
      }

      .item.cooking {
        background: rgba(239, 68, 68, 0.1);
        border-left: 3px solid #ef4444;
        animation: cooking-item-pulse 2s infinite;
      }

      .item.completed {
        background: rgba(16, 185, 129, 0.1);
        border-left: 3px solid #10b981;
        opacity: 0.7;
      }

      @keyframes cooking-item-pulse {
        0%, 100% {
          background: rgba(239, 68, 68, 0.1);
        }
        50% {
          background: rgba(239, 68, 68, 0.2);
        }
      }

      .item-actions {
        position: absolute;
        right: 4px;
        top: 50%;
        transform: translateY(-50%);
      }

      .item-btn {
        padding: 2px 6px;
        border: none;
        border-radius: 4px;
        font-size: 8px;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.2s ease;
      }

      .item-btn.start-btn {
        background: #10b981;
        color: white;
      }

      .item-btn.complete-btn {
        background: #6366f1;
        color: white;
      }

      .item-btn:hover {
        transform: scale(1.1);
      }

      .urgent-badge {
        position: absolute;
        top: -8px;
        right: -8px;
        background: #ef4444;
        color: white;
        font-size: 8px;
        padding: 2px 6px;
        border-radius: 10px;
        font-weight: 700;
        animation: urgent-pulse 1s infinite;
      }

      @keyframes urgent-pulse {
        0%, 100% { opacity: 1; }
        50% { opacity: 0.6; }
      }

      .order-summary {
        font-size: 8px;
        color: #9ca3af;
        text-align: center;
        padding: 4px 0;
        border-top: 1px solid rgba(156, 163, 175, 0.2);
        margin: 8px 0;
      }

      .order-customer {
        font-size: 9px;
        color: #d1d5db;
        font-weight: 500;
        text-align: center;
        margin-bottom: 4px;
      }

      .table-info {
        font-size: 8px;
        color: #60a5fa;
        text-align: center;
        margin-bottom: 6px;
        font-weight: 600;
      }

      .start-all-btn {
        background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
      }

      .detail-btn {
        background: linear-gradient(135deg, #6b7280 0%, #4b5563 100%);
      }

      .dev-mode .item-actions {
        position: static;
        margin-left: auto;
        margin-top: 4px;
      }
    </style>
  `;

  // 개발 모드일 때 body 클래스 추가
  if (isDevMode) {
    document.body.classList.add('dev-mode');
  } else {
    document.body.classList.remove('dev-mode');
  }

  // 이벤트 리스너 설정
  setupKDSEventListeners(store);

  // 시간 업데이트 시작
  updateCurrentTime();
  setInterval(updateCurrentTime, 1000);

  // 마지막 업데이트 시간 초기화
  updateLastUpdateTime();
  
  // 주문 카운트 업데이트
  updateOrderCounts();

  console.log('✅ KDS 인터페이스 렌더링 완료');
}

// KDS 이벤트 리스너 설정
function setupKDSEventListeners(store) {
  // 주문 카드 클릭 이벤트
  document.querySelectorAll('.order-card').forEach(card => {
    card.addEventListener('click', function(e) {
      if (!e.target.classList.contains('action-btn') && !e.target.classList.contains('start-btn') && !e.target.classList.contains('cancel-btn')) {
        const orderId = this.dataset.orderId;
        showOrderDetail(orderId);
      }
    });
  });

  // 헤더 버튼 이벤트
  document.querySelector('.exit-btn')?.addEventListener('click', () => {
    window.location.href = '/';
  });

  document.querySelector('.settings-btn')?.addEventListener('click', () => {
    alert('설정 기능은 곧 추가될 예정입니다.');
  });
}

// 현재 시간 업데이트
function updateCurrentTime() {
  const timeElement = document.getElementById('currentTime');
  if (timeElement) {
    const now = new Date();
    const hours = now.getHours();
    const minutes = now.getMinutes();
    const seconds = now.getSeconds();
    const ampm = hours >= 12 ? '오후' : '오전';
    const hour12 = hours % 12 || 12;

    const timeString = `${ampm} ${hour12}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    timeElement.textContent = timeString;
  }
}

// 주문 데이터 로딩
async function loadKDSOrders(storeId) {
  try {
    console.log(`📟 KDS - 매장 ${storeId} 주문 데이터 로딩 시작`);

    const response = await fetch(`/api/orders/kds/${storeId}`, {
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
      updateOrderCounts();
      updateLastUpdateTime();
      console.log(`✅ KDS 주문 데이터 로딩 완료 (${data.orders.length}개)`);
    } else {
      throw new Error(data.error || '데이터 조회 실패');
    }

  } catch (error) {
    console.error('❌ KDS 주문 데이터 로딩 실패:', error);
  }
}

// KDS 주문 카드 업데이트
function updateKDSOrderCards(orders) {
  const ordersGrid = document.getElementById('ordersGrid');
  if (!ordersGrid) return;

  // 기존 주문 카드들 제거 (다기능 카드와 빈 슬롯 제외)
  const existingCards = ordersGrid.querySelectorAll('.order-card');
  existingCards.forEach(card => card.remove());

  // 주문 카드들 생성
  let cardCount = 0;
  const maxCards = 9; // 다기능 카드(10번)를 위해 9개까지

  orders.forEach(order => {
    if (cardCount >= maxCards) return;

    const orderCard = createOrderCard(order);
    ordersGrid.insertBefore(orderCard, ordersGrid.querySelector('.multifunction-card'));
    cardCount++;
  });

  // 빈 슬롯 생성 (9개 미만일 때)
  for (let i = cardCount; i < maxCards; i++) {
    const emptySlot = createEmptySlot(i + 1);
    ordersGrid.insertBefore(emptySlot, ordersGrid.querySelector('.multifunction-card'));
  }

  console.log(`📟 KDS 카드 업데이트 완료: ${cardCount}개 주문, ${maxCards - cardCount}개 빈 슬롯`);
}

// 주문 카드 생성
function createOrderCard(order) {
  const orderTime = new Date(order.orderDate);
  const timeString = orderTime.toLocaleTimeString('ko-KR', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  });

  const urgentClass = order.isUrgent ? ' urgent' : '';
  const statusClass = order.overallStatus.toLowerCase();

  const card = document.createElement('div');
  card.className = `order-card ${statusClass}${urgentClass}`;
  card.dataset.orderId = order.id;

  const itemsHTML = order.items.map(item => {
    const itemStatusClass = item.cooking_status.toLowerCase();
    const statusIcon = {
      'pending': '⏳',
      'cooking': '🔥',
      'completed': '✅'
    }[item.cooking_status.toLowerCase()] || '';

    return `
      <div class="item ${itemStatusClass}" data-item-id="${item.id}">
        <span class="item-name">${item.menu_name} ${statusIcon}</span>
        <span class="qty">${item.quantity}</span>
        <div class="item-actions">
          ${item.cooking_status === 'PENDING' ? 
            `<button class="item-btn start-btn" onclick="startCookingItem(${item.id})">시작</button>` : ''}
          ${item.cooking_status === 'COOKING' ? 
            `<button class="item-btn complete-btn" onclick="completeCookingItem(${item.id})">완료</button>` : ''}
        </div>
      </div>
    `;
  }).join('');

  card.innerHTML = `
    <div class="order-header">
      <div class="order-number">#${order.id}</div>
      <div class="order-type">${order.tableNumber ? '매장' : '배달'}</div>
      ${order.isUrgent ? '<div class="urgent-badge">긴급</div>' : ''}
    </div>
    <div class="order-time">${timeString}</div>
    <div class="order-customer">${order.customerName}</div>
    ${order.tableNumber ? `<div class="table-info">테이블 ${order.tableNumber}</div>` : ''}
    <div class="order-items">${itemsHTML}</div>
    <div class="order-summary">
      대기: ${order.pendingCount} | 조리중: ${order.cookingCount} | 완료: ${order.completedCount}
    </div>
    <div class="order-actions">
      ${order.pendingCount > 0 ? 
        `<button class="action-btn start-all-btn" onclick="startCookingOrder(${order.id})">전체 조리시작</button>` : ''}
      <button class="action-btn detail-btn" onclick="showOrderDetail(${order.id})">상세보기</button>
    </div>
    ${order.cookingCount > 0 ? `
      <div class="order-timer">
        <div class="timer-display" id="timer-${order.id}">
          ${calculateCookingTime(order)}
        </div>
      </div>
    ` : ''}
  `;

  return card;
}

// 빈 슬롯 생성
function createEmptySlot(slotNumber) {
  const slot = document.createElement('div');
  slot.className = 'empty-card-slot';
  slot.innerHTML = `
    <div class="slot-number">${slotNumber}</div>
    <div class="slot-placeholder">주문 대기 중</div>
  `;
  return slot;
}

// 조리 시간 계산
function calculateCookingTime(order) {
  const cookingItems = order.items.filter(item => item.cooking_status === 'COOKING');
  if (cookingItems.length === 0) return '00:00';

  const earliestStart = cookingItems.reduce((earliest, item) => {
    const startTime = new Date(item.started_at);
    return !earliest || startTime < earliest ? startTime : earliest;
  }, null);

  if (!earliestStart) return '00:00';

  const now = new Date();
  const diffMinutes = Math.floor((now - earliestStart) / (1000 * 60));
  const diffSeconds = Math.floor(((now - earliestStart) % (1000 * 60)) / 1000);

  return `${diffMinutes.toString().padStart(2, '0')}:${diffSeconds.toString().padStart(2, '0')}`;
}

// 개별 메뉴 조리 시작
async function startCookingItem(itemId) {
  try {
    console.log('🍳 메뉴 아이템 조리 시작:', itemId);

    const response = await fetch(`/api/orders/items/${itemId}/start-cooking`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      }
    });

    const result = await response.json();

    if (result.success) {
      console.log('✅ 메뉴 조리 시작 완료:', result.message);
      // 즉시 데이터 새로고침
      if (window.currentStoreId) {
        await loadKDSOrders(window.currentStoreId);
      }
    } else {
      alert('조리 시작 실패: ' + result.error);
    }
  } catch (error) {
    console.error('❌ 메뉴 조리 시작 실패:', error);
    alert('조리 시작 중 오류가 발생했습니다.');
  }
}

// 개별 메뉴 조리 완료
async function completeCookingItem(itemId) {
  try {
    console.log('✅ 메뉴 아이템 조리 완료:', itemId);

    const response = await fetch(`/api/orders/items/${itemId}/complete-cooking`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      }
    });

    const result = await response.json();

    if (result.success) {
      console.log('✅ 메뉴 조리 완료:', result.message);
      // 즉시 데이터 새로고침
      if (window.currentStoreId) {
        await loadKDSOrders(window.currentStoreId);
      }
    } else {
      alert('조리 완료 실패: ' + result.error);
    }
  } catch (error) {
    console.error('❌ 메뉴 조리 완료 실패:', error);
    alert('조리 완료 중 오류가 발생했습니다.');
  }
}

// 주문 전체 조리 시작
async function startCookingOrder(orderId) {
  try {
    console.log('🍳 주문 전체 조리 시작:', orderId);

    const response = await fetch(`/api/orders/${orderId}/start-cooking`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      }
    });

    const result = await response.json();

    if (result.success) {
      console.log('✅ 주문 전체 조리 시작 완료:', result.message);
      // 즉시 데이터 새로고침
      if (window.currentStoreId) {
        await loadKDSOrders(window.currentStoreId);
      }
    } else {
      alert('조리 시작 실패: ' + result.error);
    }
  } catch (error) {
    console.error('❌ 주문 조리 시작 실패:', error);
    alert('조리 시작 중 오류가 발생했습니다.');
  }
}

// 조리 시작 (레거시 - 호환성 유지)
function startCooking(orderId) {
  startCookingOrder(orderId);
}

// 주문 취소
function cancelOrder(orderId) {
  console.log('❌주문 취소:', orderId);
  if (confirm('이 주문을 취소하시겠습니까?')) {
    const orderCard = document.querySelector(`[data-order-id="${orderId}"]`);
    if (orderCard) {
      orderCard.style.opacity = '0.5';
      orderCard.style.filter = 'grayscale(100%)';

      const status = orderCard.querySelector('.order-status');
      if (status) {
        status.textContent = '취소됨';
        status.style.background = '#95a5a6';
      }

      const actions = orderCard.querySelector('.order-actions');
      if (actions) {
        actions.style.display = 'none';
      }
    }
  }
}

// 타이머 시작
function startTimer(orderId) {
  const orderCard = document.querySelector(`[data-order-id="${orderId}"]`);
  const timerDisplay = orderCard?.querySelector('.timer-display');

  if (!timerDisplay) return;

  let seconds = 0;
  const interval = setInterval(() => {
    seconds++;
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    timerDisplay.textContent = `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }, 1000);

  if (orderCard) {
    orderCard.dataset.timerId = interval;
  }
}

// 주문 상세 보기
function showOrderDetail(orderId) {
  console.log('📋 주문 상세 보기:', orderId);
  alert(`주문 #${orderId} 상세 정보\n(상세 화면은 곧 구현될 예정입니다)`);
}

// KDS 자동 새로고침 설정 (더 자주 업데이트)
function setupKDSAutoRefresh(storeId) {
  setInterval(() => {
    console.log('🔄 KDS 자동 새로고침');
    loadKDSOrders(storeId);
  }, 10000); // 10초마다 새로고침
}

// 매장 선택 화면 렌더링
function renderKDSStoreSelection() {
  const main = document.getElementById('main');

  main.innerHTML = `
    <div style="padding: 40px; text-align: center; background: #1a1a1a; color: white; min-height: 100vh;">
      <h1>📟 KDS - 매장을 선택하세요</h1>
      <p style="margin: 20px 0; color: #aaa;">올바른 매장 ID가 필요합니다.</p>
      <button onclick="window.location.href='/'" style="background: #4fc3f7; color: white; border: none; padding: 12px 24px; border-radius: 8px; cursor: pointer; font-size: 16px;">
        로그인 화면으로 돌아가기
      </button>
    </div>
  `;
}

// 에러 화면 렌더링
function renderKDSError() {
  const main = document.getElementById('main');

  main.innerHTML = `
    <div style="padding: 40px; text-align: center; background: #1a1a1a; color: white; min-height: 100vh;">
      <h1>❌ KDS 로딩 실패</h1>
      <p style="margin: 20px 0; color: #aaa;">매장 정보를 불러올 수 없습니다.</p>
      <button onclick="window.location.href='/'" style="background: #f44336; color: white; border: none; padding: 12px 24px; border-radius: 8px; cursor: pointer; font-size: 16px;">
        로그인 화면으로 돌아가기
      </button>
    </div>
  `;
}

// 다기능 카드 기능들
function showKDSSettings() {
  alert('KDS 설정 메뉴:\n• 화면 밝기 조절\n• 알림음 설정\n• 자동 새로고침 간격\n• 카드 표시 옵션');
}

function showOrderHistory() {
  alert('주문 내역:\n• 오늘 완료: 27건\n• 취소: 2건\n• 평균 조리시간: 8분\n• 최고 주문량 시간: 12-13시');
}

function refreshKDS() {
  console.log('🔄 KDS 수동 새로고침');
  if (window.currentStoreId) {
    loadKDSOrders(window.currentStoreId);
    updateLastUpdateTime();
  }
}

function toggleAlerts() {
  const isEnabled = localStorage.getItem('kdsAlertsEnabled') !== 'false';
  localStorage.setItem('kdsAlertsEnabled', (!isEnabled).toString());
  alert(isEnabled ? '🔔 알림이 비활성화되었습니다' : '🔔 알림이 활성화되었습니다');
}

function updateLastUpdateTime() {
  const lastUpdateElement = document.getElementById('lastUpdate');
  if (lastUpdateElement) {
    const now = new Date();
    const timeString = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
    lastUpdateElement.textContent = `최종 업데이트: ${timeString}`;
  }
}

// 카운트 업데이트 함수
function updateOrderCounts() {
  const waitingCards = document.querySelectorAll('.order-card.pending').length;
  const cookingCards = document.querySelectorAll('.order-card.cooking').length;
  
  const waitingCount = document.getElementById('waitingCount');
  const cookingCountElement = document.getElementById('cookingCount');
  
  if (waitingCount) {
    waitingCount.textContent = waitingCards > 9 ? `+${waitingCards - 9}` : '0';
  }
  
  if (cookingCountElement) {
    cookingCountElement.textContent = cookingCards.toString();
  }
}

// 전역 함수로 노출
window.renderKDS = renderKDS;
window.showOrderDetail = showOrderDetail;
window.startCooking = startCooking;
window.startCookingOrder = startCookingOrder;
window.startCookingItem = startCookingItem;
window.completeCookingItem = completeCookingItem;
window.cancelOrder = cancelOrder;
window.showKDSSettings = showKDSSettings;
window.showOrderHistory = showOrderHistory;
window.refreshKDS = refreshKDS;
window.toggleAlerts = toggleAlerts;

console.log('✅ KDS 시스템 로드 완료');