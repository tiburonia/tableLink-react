
// POS 레이아웃 관리 모듈 (테이블맵 중심 상용 서비스 구조)
function renderPOSLayout() {
  const main = document.getElementById('main');

  main.innerHTML = `
    <div class="pos-container">
      <!-- 상단 고정 헤더 -->
      <header class="pos-header">
        <div class="header-left">
          <h1 class="pos-logo">🍽️ TableLink POS</h1>
          <div class="store-info">
            <span id="storeName">매장 정보 로딩중...</span>
          </div>
        </div>

        <div class="header-center">
          <div class="current-time" id="currentTime">00:00:00</div>
        </div>

        <div class="header-right">
          <div class="notification-area" id="notificationArea">
            <span class="notification-count hidden" id="notificationCount">0</span>
          </div>
          <div class="staff-info">
            <span>👨‍💼 POS 관리자</span>
          </div>
          <button class="header-btn logout-btn" onclick="logoutPOS()">
            🚪 로그아웃
          </button>
        </div>
      </header>

      <!-- 메인 화면 영역 -->
      <main class="pos-main" id="posMain">
        <!-- 테이블맵 화면 (초기 화면) -->
        <div class="table-map-view" id="tableMapView">
          <div class="map-container">
            <div class="map-header">
              <h2>📍 매장 현황</h2>
              <div class="map-legend">
                <div class="legend-item">
                  <span class="legend-dot available"></span>
                  <span>빈 자리</span>
                </div>
                <div class="legend-item">
                  <span class="legend-dot ordering"></span>
                  <span>주문 중</span>
                </div>
                <div class="legend-item">
                  <span class="legend-dot payment"></span>
                  <span>결제 대기</span>
                </div>
              </div>
            </div>
            
            <div class="table-map-grid" id="tableMapGrid">
              <!-- 테이블 배치도가 여기에 표시 -->
            </div>
          </div>

          <div class="side-panel">
            <div class="panel-section">
              <h3>📋 매장 관리</h3>
              <button class="panel-btn reservation-btn" onclick="showReservations()">
                📅 예약 확인
              </button>
              <button class="panel-btn delivery-btn" onclick="showDeliveryOrders()">
                🚗 배달/포장
              </button>
              <button class="panel-btn stats-btn" onclick="showDailyStats()">
                📊 매출 통계
              </button>
            </div>

            <div class="panel-section">
              <h3>⚙️ 시스템</h3>
              <button class="panel-btn kitchen-btn" onclick="showKitchenStatus()">
                🍳 주방 현황
              </button>
              <button class="panel-btn settings-btn" onclick="showPOSSettings()">
                ⚙️ 설정
              </button>
            </div>

            <div class="panel-section today-summary">
              <h3>📈 오늘 현황</h3>
              <div class="summary-item">
                <span class="summary-label">매출</span>
                <span class="summary-value" id="todayRevenue">₩0</span>
              </div>
              <div class="summary-item">
                <span class="summary-label">주문</span>
                <span class="summary-value" id="todayOrders">0건</span>
              </div>
              <div class="summary-item">
                <span class="summary-label">활성 테이블</span>
                <span class="summary-value" id="activeTables">0/0</span>
              </div>
            </div>
          </div>
        </div>

        <!-- 주문/결제 화면 (테이블 선택 시) -->
        <div class="order-view hidden" id="orderView">
          <div class="order-header">
            <button class="back-btn" onclick="returnToTableMap()">
              ⬅️ 테이블맵
            </button>
            <h2 id="orderTableTitle">테이블 ? - 주문/결제</h2>
            <div class="order-status" id="orderStatus">
              <span class="status-indicator" id="statusIndicator"></span>
              <span id="statusText">주문 준비</span>
            </div>
          </div>

          <div class="order-workspace">
            <!-- 좌측: 주문 내역 & 결제 패널 -->
            <section class="checkout-panel">
              <div class="current-order-section">
                <div class="section-header">
                  <h3>📦 주문 내역</h3>
                  <div class="order-actions">
                    <button class="action-btn hold-btn" onclick="holdOrder()" disabled>
                      ⏸️ 보류
                    </button>
                    <button class="action-btn clear-btn" onclick="clearOrder()" disabled>
                      🗑️ 전체삭제
                    </button>
                  </div>
                </div>
                
                <div class="order-list" id="currentOrderList">
                  <div class="empty-order">
                    <div class="empty-icon">📝</div>
                    <p>메뉴를 선택해주세요</p>
                  </div>
                </div>

                <div class="order-total">
                  <div class="total-line">
                    <span class="total-label">총 수량</span>
                    <span class="total-value" id="totalQuantity">0개</span>
                  </div>
                  <div class="total-line main-total">
                    <span class="total-label">합계</span>
                    <span class="total-value" id="orderTotalAmount">₩0</span>
                  </div>
                </div>
              </div>

              <div class="payment-section">
                <div class="section-header">
                  <h3>💳 결제</h3>
                </div>
                
                <div class="payment-buttons">
                  <button class="payment-btn cash-payment" onclick="processTablePayment('CASH')" disabled>
                    💵 현금결제
                  </button>
                  <button class="payment-btn card-payment" onclick="processTablePayment('CARD')" disabled>
                    💳 카드결제
                  </button>
                  <button class="payment-btn mobile-payment" onclick="processTablePayment('MOBILE')" disabled>
                    📱 간편결제
                  </button>
                </div>

                <div class="kitchen-actions">
                  <button class="kitchen-btn send-kitchen" onclick="sendToKitchen()" disabled>
                    🍳 주방 전송
                  </button>
                </div>
              </div>
            </section>

            <!-- 우측: 메뉴 패널 -->
            <section class="menu-panel">
              <div class="category-tabs" id="orderCategoryTabs">
                <!-- 카테고리 탭들 -->
              </div>
              <div class="menu-items-grid" id="orderMenuGrid">
                <!-- 메뉴 아이템들 -->
              </div>
            </section>
          </div>
        </div>
      </main>
    </div>

    <style>
      * {
        margin: 0;
        padding: 0;
        box-sizing: border-box;
      }

      .pos-container {
        height: 100vh;
        display: flex;
        flex-direction: column;
        background: #f8fafc;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      }

      /* 상단 헤더 */
      .pos-header {
        height: 60px;
        background: #1e293b;
        color: white;
        display: flex;
        align-items: center;
        padding: 0 24px;
        box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        z-index: 100;
      }

      .header-left {
        flex: 1;
        display: flex;
        align-items: center;
        gap: 16px;
      }

      .pos-logo {
        font-size: 18px;
        font-weight: 700;
      }

      .store-info {
        font-size: 14px;
        color: #94a3b8;
      }

      .header-center {
        flex: 1;
        display: flex;
        justify-content: center;
      }

      .current-time {
        font-size: 16px;
        font-weight: 600;
        color: #e2e8f0;
      }

      .header-right {
        flex: 1;
        display: flex;
        align-items: center;
        justify-content: flex-end;
        gap: 16px;
      }

      .notification-area {
        position: relative;
      }

      .notification-count {
        position: absolute;
        top: -8px;
        right: -8px;
        background: #ef4444;
        color: white;
        border-radius: 50%;
        font-size: 10px;
        font-weight: 700;
        width: 18px;
        height: 18px;
        display: flex;
        align-items: center;
        justify-content: center;
      }

      .notification-count.hidden {
        display: none;
      }

      .staff-info {
        font-size: 12px;
        color: #94a3b8;
      }

      .header-btn {
        background: #475569;
        color: white;
        border: none;
        padding: 8px 12px;
        border-radius: 6px;
        font-size: 12px;
        cursor: pointer;
        transition: background 0.2s;
      }

      .header-btn:hover {
        background: #334155;
      }

      /* 메인 영역 */
      .pos-main {
        flex: 1;
        overflow: hidden;
        position: relative;
      }

      /* 테이블맵 화면 */
      .table-map-view {
        height: 100%;
        display: grid;
        grid-template-columns: 1fr 300px;
        gap: 1px;
        background: #e2e8f0;
      }

      .map-container {
        background: white;
        display: flex;
        flex-direction: column;
      }

      .map-header {
        padding: 24px;
        border-bottom: 1px solid #e2e8f0;
        display: flex;
        justify-content: space-between;
        align-items: center;
      }

      .map-header h2 {
        font-size: 20px;
        color: #1e293b;
        font-weight: 700;
      }

      .map-legend {
        display: flex;
        gap: 20px;
      }

      .legend-item {
        display: flex;
        align-items: center;
        gap: 8px;
        font-size: 12px;
        color: #64748b;
      }

      .legend-dot {
        width: 12px;
        height: 12px;
        border-radius: 50%;
      }

      .legend-dot.available {
        background: #10b981;
      }

      .legend-dot.ordering {
        background: #f59e0b;
      }

      .legend-dot.payment {
        background: #ef4444;
      }

      .table-map-grid {
        flex: 1;
        padding: 32px;
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
        gap: 20px;
        overflow-y: auto;
      }

      .table-item {
        aspect-ratio: 1;
        border: 3px solid #e2e8f0;
        border-radius: 16px;
        background: white;
        cursor: pointer;
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
        font-weight: 700;
        transition: all 0.3s ease;
        position: relative;
        min-height: 100px;
      }

      .table-item:hover {
        transform: translateY(-4px);
        box-shadow: 0 8px 25px rgba(0,0,0,0.15);
      }

      .table-item.available {
        border-color: #10b981;
        background: #ecfdf5;
        color: #047857;
      }

      .table-item.ordering {
        border-color: #f59e0b;
        background: #fffbeb;
        color: #d97706;
      }

      .table-item.payment {
        border-color: #ef4444;
        background: #fef2f2;
        color: #dc2626;
      }

      .table-number {
        font-size: 18px;
        margin-bottom: 4px;
      }

      .table-status {
        font-size: 11px;
        font-weight: 600;
        text-transform: uppercase;
      }

      .table-time {
        position: absolute;
        bottom: 8px;
        font-size: 9px;
        opacity: 0.7;
      }

      /* 사이드 패널 */
      .side-panel {
        background: white;
        display: flex;
        flex-direction: column;
        padding: 20px;
        gap: 24px;
        overflow-y: auto;
      }

      .panel-section {
        border: 1px solid #e2e8f0;
        border-radius: 12px;
        padding: 16px;
        background: #f8fafc;
      }

      .panel-section h3 {
        font-size: 14px;
        color: #374151;
        margin-bottom: 12px;
        font-weight: 700;
      }

      .panel-btn {
        width: 100%;
        padding: 16px;
        border: 1px solid #d1d5db;
        border-radius: 8px;
        background: white;
        font-size: 13px;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.2s;
        margin-bottom: 8px;
        display: flex;
        align-items: center;
        gap: 8px;
      }

      .panel-btn:hover {
        background: #f1f5f9;
        border-color: #94a3b8;
        transform: translateY(-1px);
      }

      .panel-btn:last-child {
        margin-bottom: 0;
      }

      .today-summary {
        background: #f0f9ff;
        border-color: #0ea5e9;
      }

      .summary-item {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 8px;
        font-size: 13px;
      }

      .summary-item:last-child {
        margin-bottom: 0;
      }

      .summary-label {
        color: #64748b;
      }

      .summary-value {
        font-weight: 700;
        color: #1e293b;
      }

      /* 주문/결제 화면 */
      .order-view {
        height: 100%;
        display: flex;
        flex-direction: column;
      }

      .order-view.hidden {
        display: none;
      }

      .order-header {
        height: 60px;
        background: #3b82f6;
        color: white;
        display: flex;
        align-items: center;
        padding: 0 24px;
        gap: 20px;
      }

      .back-btn {
        background: rgba(255,255,255,0.2);
        color: white;
        border: none;
        padding: 8px 16px;
        border-radius: 6px;
        font-size: 14px;
        font-weight: 600;
        cursor: pointer;
        transition: background 0.2s;
      }

      .back-btn:hover {
        background: rgba(255,255,255,0.3);
      }

      .order-header h2 {
        flex: 1;
        font-size: 18px;
        font-weight: 700;
      }

      .order-status {
        display: flex;
        align-items: center;
        gap: 8px;
        font-size: 12px;
      }

      .status-indicator {
        width: 10px;
        height: 10px;
        border-radius: 50%;
        background: #10b981;
      }

      .order-workspace {
        flex: 1;
        display: grid;
        grid-template-columns: 1fr 2fr;
        gap: 1px;
        background: #e2e8f0;
        min-height: 0;
      }

      /* 메뉴 패널 */
      .menu-panel {
        background: white;
        display: flex;
        flex-direction: column;
      }

      .category-tabs {
        display: flex;
        background: #f8fafc;
        border-bottom: 1px solid #e2e8f0;
        padding: 12px;
        gap: 6px;
        overflow-x: auto;
      }

      .category-tab {
        padding: 12px 24px;
        border: 2px solid #d1d5db;
        border-radius: 8px;
        background: white;
        font-size: 14px;
        font-weight: 700;
        cursor: pointer;
        transition: all 0.2s;
        white-space: nowrap;
        min-width: 80px;
      }

      .category-tab.active {
        background: #3b82f6;
        color: white;
        border-color: #3b82f6;
      }

      .category-tab:not(.active):hover {
        background: #f1f5f9;
        border-color: #94a3b8;
      }

      .menu-items-grid {
        flex: 1;
        padding: 16px;
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
        gap: 12px;
        overflow-y: auto;
      }

      .menu-item {
        aspect-ratio: 1.2;
        border: 2px solid #e2e8f0;
        border-radius: 12px;
        background: white;
        cursor: pointer;
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
        text-align: center;
        padding: 16px;
        transition: all 0.2s;
        min-height: 120px;
      }

      .menu-item:hover {
        border-color: #3b82f6;
        transform: translateY(-3px);
        box-shadow: 0 6px 20px rgba(59, 130, 246, 0.15);
      }

      .menu-item:active {
        transform: translateY(-1px) scale(0.98);
      }

      .menu-item-name {
        font-size: 15px;
        font-weight: 700;
        color: #1e293b;
        margin-bottom: 8px;
        line-height: 1.2;
      }

      .menu-item-price {
        font-size: 14px;
        color: #059669;
        font-weight: 700;
      }

      /* 체크아웃 패널 */
      .checkout-panel {
        background: white;
        display: flex;
        flex-direction: column;
      }

      .current-order-section {
        flex: 1;
        display: flex;
        flex-direction: column;
      }

      .section-header {
        padding: 16px;
        border-bottom: 1px solid #e2e8f0;
        display: flex;
        justify-content: space-between;
        align-items: center;
        background: #f8fafc;
      }

      .section-header h3 {
        font-size: 16px;
        color: #374151;
        font-weight: 700;
      }

      .order-actions, .kitchen-actions {
        display: flex;
        gap: 8px;
      }

      .action-btn, .kitchen-btn {
        padding: 8px 12px;
        border: 1px solid #d1d5db;
        border-radius: 6px;
        background: white;
        font-size: 11px;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.2s;
      }

      .action-btn:disabled, .kitchen-btn:disabled {
        opacity: 0.5;
        cursor: not-allowed;
      }

      .hold-btn:not(:disabled):hover {
        background: #fef3c7;
        border-color: #f59e0b;
        color: #d97706;
      }

      .clear-btn:not(:disabled):hover {
        background: #fecaca;
        border-color: #ef4444;
        color: #dc2626;
      }

      .send-kitchen:not(:disabled):hover {
        background: #dcfce7;
        border-color: #22c55e;
        color: #16a34a;
      }

      .order-list {
        flex: 1;
        padding: 12px;
        overflow-y: auto;
        min-height: 200px;
      }

      .empty-order {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        height: 100%;
        color: #94a3b8;
      }

      .empty-icon {
        font-size: 48px;
        margin-bottom: 12px;
        opacity: 0.7;
      }

      .order-item {
        display: flex;
        align-items: center;
        padding: 16px;
        border: 1px solid #e2e8f0;
        border-radius: 8px;
        margin-bottom: 8px;
        background: white;
        transition: all 0.2s;
      }

      .order-item:hover {
        box-shadow: 0 2px 8px rgba(0,0,0,0.1);
      }

      .order-item-info {
        flex: 1;
      }

      .order-item-name {
        font-size: 14px;
        font-weight: 700;
        color: #1e293b;
        margin-bottom: 4px;
      }

      .order-item-price {
        font-size: 12px;
        color: #64748b;
      }

      .quantity-controls {
        display: flex;
        align-items: center;
        gap: 12px;
      }

      .qty-btn {
        width: 36px;
        height: 36px;
        border: 1px solid #d1d5db;
        border-radius: 6px;
        background: white;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        font-weight: 700;
        font-size: 16px;
        transition: all 0.2s;
      }

      .qty-btn:hover {
        background: #f1f5f9;
        border-color: #94a3b8;
      }

      .qty-display {
        min-width: 40px;
        text-align: center;
        font-weight: 700;
        font-size: 16px;
        color: #1e293b;
      }

      .order-total {
        padding: 20px;
        border-top: 2px solid #e2e8f0;
        background: #f8fafc;
      }

      .total-line {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 8px;
        font-size: 14px;
      }

      .total-line:last-child {
        margin-bottom: 0;
      }

      .total-line.main-total {
        padding-top: 8px;
        border-top: 1px solid #e2e8f0;
        margin-top: 8px;
      }

      .total-label {
        color: #64748b;
        font-weight: 600;
      }

      .total-value {
        font-weight: 700;
        color: #1e293b;
      }

      .main-total .total-value {
        font-size: 18px;
        color: #059669;
      }

      /* 결제 섹션 */
      .payment-section {
        border-top: 1px solid #e2e8f0;
      }

      .payment-buttons {
        padding: 20px;
        display: flex;
        flex-direction: column;
        gap: 12px;
      }

      .payment-btn {
        height: 56px;
        border: none;
        border-radius: 12px;
        font-size: 16px;
        font-weight: 700;
        cursor: pointer;
        transition: all 0.2s;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 10px;
      }

      .payment-btn:disabled {
        opacity: 0.5;
        cursor: not-allowed;
      }

      .cash-payment {
        background: #059669;
        color: white;
      }

      .cash-payment:not(:disabled):hover {
        background: #047857;
        transform: translateY(-2px);
      }

      .card-payment {
        background: #3b82f6;
        color: white;
      }

      .card-payment:not(:disabled):hover {
        background: #2563eb;
        transform: translateY(-2px);
      }

      .mobile-payment {
        background: #7c3aed;
        color: white;
      }

      .mobile-payment:not(:disabled):hover {
        background: #6d28d9;
        transform: translateY(-2px);
      }

      .kitchen-actions {
        padding: 0 20px 20px 20px;
      }

      .kitchen-btn {
        width: 100%;
        height: 48px;
        border: 2px solid #22c55e;
        border-radius: 8px;
        background: white;
        color: #16a34a;
        font-size: 14px;
        font-weight: 700;
        cursor: pointer;
        transition: all 0.2s;
      }

      .kitchen-btn:not(:disabled):hover {
        background: #dcfce7;
        transform: translateY(-1px);
      }

      /* 숨김 클래스 */
      .hidden {
        display: none !important;
      }

      /* 반응형 */
      @media (max-width: 1400px) {
        .table-map-view {
          grid-template-columns: 1fr 280px;
        }
        
        .table-map-grid {
          grid-template-columns: repeat(auto-fit, minmax(100px, 1fr));
          gap: 16px;
        }
      }

      @media (max-width: 1000px) {
        .table-map-view {
          grid-template-columns: 1fr;
          grid-template-rows: 1fr auto;
        }
        
        .side-panel {
          max-height: 200px;
          flex-direction: row;
          gap: 16px;
          overflow-x: auto;
        }
        
        .panel-section {
          min-width: 200px;
        }
      }

      @media (max-width: 768px) {
        .order-workspace {
          grid-template-columns: 1fr;
          grid-template-rows: 1fr auto;
        }
        
        .map-header {
          flex-direction: column;
          gap: 12px;
          align-items: flex-start;
        }
        
        .header-center {
          display: none;
        }
      }
    </style>
  `;

  // 시계 업데이트 시작
  updateCurrentTime();
  setInterval(updateCurrentTime, 1000);
}

// 현재 시간 업데이트
function updateCurrentTime() {
  const timeElement = document.getElementById('currentTime');
  if (timeElement) {
    const now = new Date();
    const timeString = now.toLocaleTimeString('ko-KR', { 
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
    timeElement.textContent = timeString;
  }
}

// POS 로그아웃
function logoutPOS() {
  if (confirm('POS 시스템에서 로그아웃하시겠습니까?')) {
    window.location.href = '/';
  }
}

// 전역 함수로 노출
window.renderPOSLayout = renderPOSLayout;
window.logoutPOS = logoutPOS;

module.exports = { renderPOSLayout };
