// POS 레이아웃 관리 모듈 (OKPOS 구조 기반 상용 서비스)
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

        <!-- 주문/결제 화면 (OKPOS 구조 기반) -->
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

          <!-- 세션 상태 배너 -->
          <div id="sessionStatusBanner" class="session-banner" style="display: none;">
            <div class="session-warning">
              세션 상태가 여기에 표시됩니다
            </div>
          </div>
        </div>

          <div class="okpos-workspace">
            <!-- 좌측 컬럼: 주문 내역 + 결제 정보 -->
            <section class="left-column">
              <!-- 상단: 주문 내역 패널 -->
              <div class="order-list-panel">
                <div class="panel-header">
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

                <div class="order-items-container">
                  <div class="order-items-header">
                    <div class="header-col item-type">구분</div>
                    <div class="header-col item-name">메뉴명</div>
                    <div class="header-col item-price">단가</div>
                    <div class="header-col item-qty">수량</div>
                    <div class="header-col item-discount">할인</div>
                    <div class="header-col item-total">금액</div>
                  </div>

                  <div class="order-items-list" id="orderItemsList">
                    <div class="empty-order">
                      <div class="empty-icon">📝</div>
                      <p>메뉴를 선택해주세요</p>
                    </div>
                  </div>
                </div>

                <!-- 수량/항목 조작 영역 -->
                <div class="order-controls">
                  <button class="control-btn" onclick="selectAllItems()">전체선택</button>
                  <button class="control-btn danger" onclick="deleteSelectedItems()">선택삭제</button>
                  <button class="control-btn" onclick="applyDiscount()">할인적용</button>
                  <button class="control-btn" onclick="changeQuantity(-1)">수량 -</button>
                  <button class="control-btn" onclick="changeQuantity(1)">수량 +</button>
                </div>
              </div>

              <!-- 하단: 결제 정보 패널 -->
              <div class="payment-info-panel">
                <div class="payment-summary">
                  <div class="summary-row">
                    <span class="label">총 금액</span>
                    <span class="value" id="totalAmount">₩0</span>
                  </div>
                  <div class="summary-row">
                    <span class="label">할인 금액</span>
                    <span class="value discount" id="discountAmount">₩0</span>
                  </div>
                  <div class="summary-row final">
                    <span class="label">결제 금액</span>
                    <span class="value" id="finalAmount">₩0</span>
                  </div>
                </div>
              </div>
            </section>

            <!-- 우측 컬럼: 메뉴 선택 + 결제/관리 버튼 -->
            <section class="right-column">
              <!-- 메뉴 선택 패널 -->
              <div class="menu-selection-panel">
                <div class="menu-panel-header">
                  <h3>🍽️ 메뉴 선택</h3>
                  <div class="menu-search-box">
                    <input type="text" id="menuSearch" placeholder="메뉴 검색..." onkeyup="searchMenus(this.value)">
                    <div class="search-icon">🔍</div>
                  </div>
                </div>

                <div class="category-tabs-container">
                  <div class="category-tabs" id="categoryTabs">
                    <!-- 카테고리 탭들 -->
                  </div>
                </div>

                <div class="menu-grid-container">
                  <div class="menu-grid" id="menuGrid">
                    <!-- 메뉴 버튼들 -->
                  </div>
                </div>
              </div>

              <!-- 액션 버튼들 그룹 -->
              <div class="action-panels-container">

                <!-- 주문 확정 버튼 (가장 중요한 액션) -->
                <div class="primary-action-panel">
                  <button class="primary-action-btn" onclick="handlePrimaryAction()">
                    <div class="btn-icon">📋</div>
                    <div class="btn-content">
                      <div class="btn-title">주문 확정</div>
                      <div class="btn-subtitle">테이블맵으로 이동</div>
                    </div>
                  </button>
                </div>

                <!-- 결제 수단 패널 -->
                <div class="payment-panel">
                  <div class="panel-header">
                    <h4>💳 결제 처리</h4>
                    <div class="panel-indicator" id="paymentIndicator">대기중</div>
                  </div>
                  <div class="payment-grid">
                    <button class="payment-btn card-payment" onclick="processPayment('CARD')" disabled>
                      <div class="payment-icon">💳</div>
                      <div class="payment-text">
                        <span class="payment-title">신용카드</span>
                        <span class="payment-desc">IC/MS</span>
                      </div>
                    </button>

                    <button class="payment-btn cash-payment" onclick="processPayment('CASH')" disabled>
                      <div class="payment-icon">💵</div>
                      <div class="payment-text">
                        <span class="payment-title">현금</span>
                        <span class="payment-desc">직접결제</span>
                      </div>
                    </button>

                    <button class="payment-btn mobile-payment" onclick="processPayment('MOBILE')" disabled>
                      <div class="payment-icon">📱</div>
                      <div class="payment-text">
                        <span class="payment-title">간편결제</span>
                        <span class="payment-desc">QR/NFC</span>
                      </div>
                    </button>

                    <button class="payment-btn combo-payment" onclick="processComboPayment()" disabled>
                      <div class="payment-icon">🔄</div>
                      <div class="payment-text">
                        <span class="payment-title">복합결제</span>
                        <span class="payment-desc">분할</span>
                      </div>
                    </button>
                  </div>
                </div>

                <!-- 고급 기능 패널 -->
                <div class="advanced-functions-panel">
                  <div class="panel-header">
                    <h4>⚙️ 고급 기능</h4>
                    <button class="expand-btn" onclick="toggleAdvancedPanel()" id="advancedToggle">
                      <span>▼</span>
                    </button>
                  </div>
                  <div class="advanced-functions-grid" id="advancedFunctionsGrid">
                    <button class="advanced-btn coupon-btn" onclick="applyTLCoupon()">
                      <div class="advanced-icon">🎫</div>
                      <span>쿠폰</span>
                    </button>

                    <button class="advanced-btn points-btn" onclick="applyTLPoints()">
                      <div class="advanced-icon">⭐</div>
                      <span>포인트</span>
                    </button>

                    <button class="advanced-btn tll-btn" onclick="checkTLLOrder()">
                      <div class="advanced-icon">📱</div>
                      <span>TLL연동</span>
                    </button>

                    <button class="advanced-btn kitchen-btn" onclick="sendToKitchen()">
                      <div class="advanced-icon">🍳</div>
                      <span>주방전송</span>
                    </button>

                    <button class="advanced-btn receipt-btn" onclick="printReceipt()">
                      <div class="advanced-icon">🖨️</div>
                      <span>영수증</span>
                    </button>

                    <button class="advanced-btn sales-btn" onclick="showDailySales()">
                      <div class="advanced-icon">📊</div>
                      <span>정산</span>
                    </button>

                    <button class="advanced-btn hold-btn" onclick="holdCurrentOrder()">
                      <div class="advanced-icon">⏸️</div>
                      <span>보류</span>
                    </button>

                    <button class="advanced-btn void-btn" onclick="voidOrder()">
                      <div class="advanced-icon">❌</div>
                      <span>취소</span>
                    </button>
                  </div>
                </div>
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
        background: #f1f5f9;
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

      /* 테이블맵 화면 (기존 유지) */
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

      /* 사이드 패널 (기존 유지) */
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

      /* OKPOS 구조 기반 주문 화면 */
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

      /* OKPOS 워크스페이스 */
      .okpos-workspace {
        flex: 1;
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 2px;
        background: #cbd5e1;
        min-height: 0;
      }

      /* 좌측 컬럼 */
      .left-column {
        display: flex;
        flex-direction: column;
        gap: 2px;
      }

      /* 주문 내역 패널 */
      .order-list-panel {
        background: white;
        flex: 1;
        display: flex;
        flex-direction: column;
        min-height: 500px;
      }

      .panel-header {
        padding: 16px;
        border-bottom: 2px solid #e2e8f0;
        display: flex;
        justify-content: space-between;
        align-items: center;
        background: #f8fafc;
      }

      .panel-header h3 {
        font-size: 16px;
        color: #1e293b;
        font-weight: 700;
      }

      .order-actions {
        display: flex;
        gap: 8px;
      }

      .action-btn {
        padding: 8px 12px;
        border: 1px solid #d1d5db;
        border-radius: 6px;
        background: white;
        font-size: 11px;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.2s;
      }

      .action-btn:disabled {
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

      /* 주문 아이템 컨테이너 */
      .order-items-container {
        flex: 1;
        display: flex;
        flex-direction: column;
        min-height: 300px;
      }

      .order-items-header {
        display: grid;
        grid-template-columns: 0.8fr 2fr 1fr 1fr 1fr 1fr;
        gap: 8px;
        padding: 12px 16px;
        background: #f1f5f9;
        border-bottom: 1px solid #e2e8f0;
        font-weight: 700;
        font-size: 12px;
        color: #374151;
      }

      .order-items-list {
        flex: 1;
        overflow-y: auto;
        padding: 8px;
      }

      .empty-order {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        height: 100%;
        color: #94a3b8;
        min-height: 200px;
      }

      .empty-icon {
        font-size: 48px;
        margin-bottom: 12px;
        opacity: 0.7;
      }

      .order-item-row {
        display: grid;
        grid-template-columns: 0.8fr 2fr 1fr 1fr 1fr 1fr;
        gap: 8px;
        padding: 12px 8px;
        border: 1px solid #e2e8f0;
        border-radius: 6px;
        margin-bottom: 4px;
        background: white;
        align-items: center;
        font-size: 13px;
        cursor: pointer;
        transition: all 0.2s;
      }

      .order-item-row:hover {
        background: #f8fafc;
        border-color: #3b82f6;
      }

      .order-item-row.selected {
        background: #dbeafe;
        border-color: #3b82f6;
      }

      .order-item-row.tll-item {
        background: #fffbeb;
        border-left: 4px solid #f59e0b;
      }

      .order-item-row.pos-item {
        background: #f0f9ff;
        border-left: 4px solid #0ea5e9;
      }

      /* 확정/미확정 상태 스타일 */
      .order-item-row.pending-item {
        background: #fef3c7;
        border: 2px dashed #f59e0b;
        opacity: 0.8;
      }

      .order-item-row.confirmed-item {
        background: #ecfdf5;
        border-left: 4px solid #10b981;
      }

      .status-badge {
        font-size: 10px;
        padding: 2px 6px;
        border-radius: 10px;
        font-weight: 700;
        margin-left: 4px;
      }

      .status-badge.confirmed {
        background: #dcfce7;
        color: #166534;
      }

      .status-badge.pending {
        background: #fef3c7;
        color: #92400e;
      }

      .pending-indicator {
        font-size: 12px;
        margin-left: 4px;
        opacity: 0.7;
      }

      .item-name {
        font-weight: 600;
        color: #1e293b;
        display: flex;
        align-items: center;
      }

      .item-price, .item-total {
        font-weight: 600;
        color: #059669;
        text-align: right;
      }

      .item-qty {
        text-align: center;
        font-weight: 600;
      }

      .item-discount {
        text-align: right;
        color: #dc2626;
        font-weight: 600;
      }

      .item-note {
        font-size: 11px;
        color: #64748b;
      }

      /* 주문 조작 버튼 */
      .order-controls {
        padding: 12px 16px;
        border-top: 1px solid #e2e8f0;
        background: #f8fafc;
        display: flex;
        gap: 8px;
        flex-wrap: wrap;
      }

      .control-btn {
        padding: 10px 16px;
        border: 1px solid #d1d5db;
        border-radius: 6px;
        background: white;
        font-size: 12px;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.2s;
        flex: 1;
        min-width: 80px;
      }

      .control-btn:hover {
        background: #f1f5f9;
        border-color: #94a3b8;
        transform: translateY(-1px);
      }

      .control-btn.danger:hover {
        background: #fecaca;
        border-color: #ef4444;
        color: #dc2626;
      }

      /* 결제 정보 패널 */
      .payment-info-panel {
        background: white;
        min-height: 150px;
        display: flex;
        flex-direction: column;
      }

      .payment-summary {
        padding: 20px;
        border-bottom: 2px solid #e2e8f0;
        background: #f8fafc;
      }

      .summary-row {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 8px 0;
        font-size: 14px;
      }

      .summary-row.final {
        border-top: 2px solid #e2e8f0;
        border-bottom: 2px solid #e2e8f0;
        margin: 8px 0;
        padding: 12px 0;
        font-weight: 700;
        font-size: 16px;
      }

      .summary-row .label {
        color: #374151;
        font-weight: 600;
      }

      .summary-row .value {
        font-weight: 700;
        color: #1e293b;
      }

      .summary-row .value.discount {
        color: #dc2626;
      }

      .summary-row .value.change {
        color: #059669;
      }

      /* 주문 타입 배지 */
      .order-type-badge {
        padding: 4px 8px;
        border-radius: 12px;
        font-size: 10px;
        font-weight: 700;
        text-transform: uppercase;
        text-align: center;
      }

      .type-pos {
        background: #dbeafe;
        color: #1e40af;
      }

      .type-tll {
        background: #fef3c7;
        color: #92400e;
      }

      /* 우측 컬럼 */
      .right-column {
        display: flex;
        flex-direction: column;
        gap: 3px;
        overflow-y: auto;
        max-height: 100%;
      }

      .right-column::-webkit-scrollbar {
        width: 8px;
      }

      .right-column::-webkit-scrollbar-track {
        background: #f1f5f9;
        border-radius: 4px;
      }

      .right-column::-webkit-scrollbar-thumb {
        background: #cbd5e1;
        border-radius: 4px;
      }

      .right-column::-webkit-scrollbar-thumb:hover {
        background: #94a3b8;
      }

      /* 메뉴 선택 패널 */
      .menu-selection-panel {
        background: white;
        flex: none;
        display: flex;
        flex-direction: column;
        border-radius: 8px;
        overflow: visible;
        box-shadow: 0 2px 8px rgba(0,0,0,0.1);
      }

      .menu-panel-header {
        background: #f8fafc;
        padding: 16px 20px;
        border-bottom: 2px solid #e2e8f0;
        display: flex;
        justify-content: space-between;
        align-items: center;
      }

      .menu-panel-header h3 {
        font-size: 16px;
        font-weight: 700;
        color: #1e293b;
        margin: 0;
      }

      .menu-search-box {
        position: relative;
        width: 200px;
      }

      .menu-search-box input {
        width: 100%;
        padding: 8px 12px 8px 36px;
        border: 2px solid #e2e8f0;
        border-radius: 20px;
        font-size: 13px;
        background: white;
        transition: all 0.2s;
      }

      .menu-search-box input:focus {
        outline: none;
        border-color: #3b82f6;
        box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
      }

      .search-icon {
        position: absolute;
        left: 12px;
        top: 50%;
        transform: translateY(-50%);
        color: #6b7280;
        font-size: 14px;
      }

      .category-tabs-container {
        background: #f8fafc;
        border-bottom: 1px solid #e2e8f0;
        padding: 12px 20px 16px;
      }

      .category-tabs {
        display: flex;
        gap: 8px;
        overflow-x: auto;
        scrollbar-width: none;
        -ms-overflow-style: none;
      }

      .category-tabs::-webkit-scrollbar {
        display: none;
      }

      .category-tab {
        padding: 10px 20px;
        border: 2px solid #d1d5db;
        border-radius: 25px;
        background: white;
        font-size: 13px;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.3s ease;
        white-space: nowrap;
        min-width: 80px;
        text-align: center;
        position: relative;
        overflow: hidden;
      }

      .category-tab.active {
        background: linear-gradient(135deg, #3b82f6, #2563eb);
        color: white;
        border-color: #3b82f6;
        transform: translateY(-1px);
        box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
      }

      .category-tab:not(.active):hover {
        background: #f1f5f9;
        border-color: #94a3b8;
        transform: translateY(-1px);
        box-shadow: 0 2px 8px rgba(0,0,0,0.1);
      }

      .menu-grid-container {
        padding: 20px;
        overflow: visible;
      }

      .menu-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
        gap: 16px;
      }

      .menu-item-btn {
        aspect-ratio: 1;
        border: 2px solid #e2e8f0;
        border-radius: 16px;
        background: white;
        cursor: pointer;
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
        text-align: center;
        padding: 16px;
        transition: all 0.3s ease;
        min-height: 120px;
        position: relative;
        overflow: hidden;
      }

      .menu-item-btn::before {
        content: '';
        position: absolute;
        top: 0;
        left: -100%;
        width: 100%;
        height: 100%;
        background: linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent);
        transition: left 0.5s;
      }

      .menu-item-btn:hover::before {
        left: 100%;
      }

      .menu-item-btn:hover {
        border-color: #3b82f6;
        transform: translateY(-4px) scale(1.02);
        box-shadow: 0 8px 25px rgba(59, 130, 246, 0.2);
      }

      .menu-item-btn:active {
        transform: translateY(-2px) scale(0.98);
      }

      .menu-item-name {
        font-size: 14px;
        font-weight: 700;
        color: #1e293b;
        margin-bottom: 8px;
        line-height: 1.3;
      }

      .menu-item-price {
        font-size: 13px;
        color: #059669;
        font-weight: 700;
        background: #ecfdf5;
        padding: 4px 8px;
        border-radius: 8px;
      }

      /* 액션 패널들 컨테이너 */
      .action-panels-container {
        display: flex;
        flex-direction: column;
        gap: 3px;
        overflow-y: auto;
        flex-shrink: 0;
      }

      /* 주요 액션 버튼 (주문 저장) */
      .primary-action-panel {
        background: white;
        padding: 16px;
        border-radius: 8px;
        box-shadow: 0 2px 8px rgba(0,0,0,0.1);
      }

      .primary-action-btn {
        width: 100%;
        padding: 20px;
        border: none;
        border-radius: 12px;
        background: linear-gradient(135deg, #10b981, #059669);
        color: white;
        cursor: pointer;
        transition: all 0.3s ease;
        display: flex;
        align-items: center;
        gap: 16px;
        box-shadow: 0 4px 20px rgba(16, 185, 129, 0.3);
      }

      .primary-action-btn:disabled {
        background: #f1f5f9;
        color: #94a3b8;
        cursor: not-allowed;
        transform: none;
        box-shadow: none;
      }

      .primary-action-btn:hover:not(:disabled) {
        background: linear-gradient(135deg, #059669, #047857);
        transform: translateY(-2px);
        box-shadow: 0 8px 30px rgba(16, 185, 129, 0.4);
      }

      .btn-icon {
        font-size: 24px;
        background: rgba(255,255,255,0.2);
        padding: 8px;
        border-radius: 8px;
      }

      .btn-content {
        flex: 1;
        text-align: left;
      }

      .btn-title {
        font-size: 16px;
        font-weight: 700;
        margin-bottom: 2px;
      }

      .btn-subtitle {
        font-size: 12px;
        opacity: 0.9;
      }

      /* 결제 패널 */
      .payment-panel {
        background: white;
        padding: 16px;
        border-radius: 8px;
        box-shadow: 0 2px 8px rgba(0,0,0,0.1);
      }

      .panel-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 16px;
        padding-bottom: 12px;
        border-bottom: 1px solid #e2e8f0;
      }

      .panel-header h4 {
        font-size: 14px;
        font-weight: 700;
        color: #1e293b;
        margin: 0;
      }

      .payment-indicator {
        background: #f3f4f6;
        color: #6b7280;
        padding: 8px 16px;
        border-radius: 20px;
        font-size: 13px;
        font-weight: 500;
      }

      /* 세션 상태 배너 스타일 */
      .session-banner {
        margin: 12px 0;
        border-radius: 8px;
        overflow: hidden;
        animation: slideDown 0.3s ease-out;
      }

      .session-banner.temporary {
        background: #fef3c7;
        border: 2px solid #f59e0b;
      }

      .session-banner.editing {
        background: #dbeafe;
        border: 2px solid #3b82f6;
      }

      .session-warning {
        padding: 12px 16px;
        color: #92400e;
        font-weight: 600;
        text-align: center;
        font-size: 14px;
      }

      .session-banner.editing .session-warning {
        color: #1e40af;
      }

      .session-info {
        padding: 12px 16px;
        color: #1e40af;
        font-weight: 500;
        text-align: center;
        font-size: 14px;
      }

      @keyframes slideDown {
        from {
          opacity: 0;
          transform: translateY(-10px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }

      /* 주문 아이템 섹션 헤더 */
      .order-section-header {
        padding: 12px 16px;
        margin: 16px 0 8px 0;
        border-radius: 8px;
        font-weight: 600;
        font-size: 14px;
      }

      .order-section-header.confirmed-section {
        background: #dcfce7;
        color: #166534;
        border-left: 4px solid #16a34a;
      }

      .order-section-header.temp-section {
        background: #fef3c7;
        color: #92400e;
        border-left: 4px solid #f59e0b;
        display: flex;
        justify-content: space-between;
        align-items: center;
      }

      .temp-warning {
        font-size: 12px;
        background: #f59e0b;
        color: white;
        padding: 4px 8px;
        border-radius: 4px;
      }

      /* 임시 아이템 스타일 */
      .temporary-item {
        background: #fffbeb;
        border-left: 3px solid #f59e0b;
      }

      .temp-indicator {
        color: #f59e0b;
        font-size: 12px;
        margin-left: 4px;
      }

      .status-badge.temporary {
        background: #f59e0b;
        color: white;
      }

      .order-type-badge.type-temp {
        background: #fbbf24;
        color: white;
      }

      /* 결제 요약 스타일 개선 */
      .amount-breakdown {
        text-align: right;
      }

      .confirmed-amount {
        color: #16a34a;
        font-size: 12px;
        margin-bottom: 2px;
      }

      .temp-amount {
        color: #f59e0b;
        font-size: 12px;
        margin-bottom: 2px;
      }

      .total-amount {
        font-weight: 600;
        font-size: 14px;
      }

      .payment-grid {
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        gap: 10px;
      }

      .payment-btn {
        padding: 16px 12px;
        border: 2px solid #e2e8f0;
        border-radius: 12px;
        background: white;
        cursor: pointer;
        transition: all 0.3s ease;
        display: flex;
        align-items: center;
        gap: 10px;
        min-height: 60px;
      }

      .payment-btn:disabled {
        background: #f9fafb;
        border-color: #f3f4f6;
        color: #d1d5db;
        cursor: not-allowed;
      }

      .payment-btn:not(:disabled):hover {
        transform: translateY(-2px);
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      }

      .card-payment:not(:disabled) {
        border-color: #3b82f6;
        background: linear-gradient(135deg, #dbeafe, #f0f9ff);
      }

      .card-payment:not(:disabled):hover {
        background: linear-gradient(135deg, #3b82f6, #2563eb);
        color: white;
      }

      .cash-payment:not(:disabled) {
        border-color: #059669;
        background: linear-gradient(135deg, #d1fae5, #ecfdf5);
      }

      .cash-payment:not(:disabled):hover {
        background: linear-gradient(135deg, #059669, #047857);
        color: white;
      }

      .mobile-payment:not(:disabled) {
        border-color: #7c3aed;
        background: linear-gradient(135deg, #ede9fe, #f3f0ff);
      }

      .mobile-payment:not(:disabled):hover {
        background: linear-gradient(135deg, #7c3aed, #6d28d9);
        color: white;
      }

      .combo-payment:not(:disabled) {
        border-color: #f59e0b;
        background: linear-gradient(135deg, #fef3c7, #fffbeb);
      }

      .combo-payment:not(:disabled):hover {
        background: linear-gradient(135deg, #f59e0b, #d97706);
        color: white;
      }

      .payment-icon {
        font-size: 20px;
        opacity: 0.8;
      }

      .payment-text {
        display: flex;
        flex-direction: column;
        gap: 2px;
      }

      .payment-title {
        font-size: 13px;
        font-weight: 700;
      }

      .payment-desc {
        font-size: 10px;
        opacity: 0.7;
      }

      /* 고급 기능 패널 */
      .advanced-functions-panel {
        background: white;
        border-radius: 8px;
        box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        overflow: hidden;
      }

      .expand-btn {
        background: none;
        border: none;
        cursor: pointer;
        padding: 4px 8px;
        border-radius: 4px;
        transition: all 0.2s;
        color: #6b7280;
        font-size: 12px;
      }

      .expand-btn:hover {
        background: #f3f4f6;
      }

      .expand-btn.collapsed span {
        transform: rotate(-90deg);
      }

      .advanced-functions-grid {
        padding: 16px;
        display: grid;
        grid-template-columns: repeat(4, 1fr);
        gap: 8px;
        transition: all 0.3s ease;
        max-height: 200px;
        overflow: hidden;
      }

      .advanced-functions-grid.collapsed {
        max-height: 0;
        padding: 0 16px;
      }

      .advanced-btn {
        padding: 12px 8px;
        border: 1px solid #e2e8f0;
        border-radius: 8px;
        background: white;
        cursor: pointer;
        transition: all 0.2s ease;
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 6px;
        min-height: 60px;
        font-size: 11px;
        font-weight: 600;
        color: #374151;
      }

      .advanced-btn:hover {
        background: #f8fafc;
        border-color: #cbd5e1;
        transform: translateY(-1px);
      }

      .advanced-icon {
        font-size: 16px;
        opacity: 0.8;
      }

      /* 특정 고급 버튼 색상 */
      .coupon-btn:hover {
        background: #fef3c7;
        border-color: #f59e0b;
        color: #92400e;
      }

      .points-btn:hover {
        background: #fef3c7;
        border-color: #eab308;
        color: #a16207;
      }

      .kitchen-btn:hover {
        background: #fee2e2;
        border-color: #ef4444;
        color: #dc2626;
      }

      /* 숨김 클래스 */
      .hidden {
        display: none !important;
      }

      /* 메뉴 추가 애니메이션 */
      .menu-added-animation {
        animation: menuAddedPulse 0.6s ease-out;
        transform: scale(1.05);
      }

      @keyframes menuAddedPulse {
        0% {
          background: #10b981;
          color: white;
          transform: scale(1);
        }
        50% {
          background: #059669;
          color: white;
          transform: scale(1.05);
        }
        100% {
          background: white;
          color: inherit;
          transform: scale(1);
        }
      }

      /* 결제 처리 중 로딩 스피너 */
      .payment-processing {
        position: relative;
        pointer-events: none;
      }

      .payment-processing::after {
        content: '';
        position: absolute;
        top: 50%;
        left: 50%;
        width: 20px;
        height: 20px;
        margin: -10px 0 0 -10px;
        border: 2px solid transparent;
        border-top: 2px solid #3b82f6;
        border-radius: 50%;
        animation: spin 1s linear infinite;
      }

      /* 세션 상태 표시 */
      .session-status-indicator {
        position: fixed;
        top: 70px;
        left: 50%;
        transform: translateX(-50%);
        background: #1e293b;
        color: white;
        padding: 8px 16px;
        border-radius: 20px;
        font-size: 12px;
        font-weight: 600;
        z-index: 1000;
        display: none;
      }

      .session-status-indicator.active {
        display: block;
        animation: slideDown 0.3s ease-out;
      }

      @keyframes slideDown {
        from {
          opacity: 0;
          transform: translate(-50%, -20px);
        }
        to {
          opacity: 1;
          transform: translate(-50%, 0);
        }
      }

      /* 실시간 업데이트 표시 */
      .realtime-indicator {
        position: fixed;
        bottom: 20px;
        right: 20px;
        background: #10b981;
        color: white;
        padding: 8px 12px;
        border-radius: 20px;
        font-size: 11px;
        font-weight: 600;
        z-index: 1000;
        display: none;
      }

      .realtime-indicator.active {
        display: block;
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

        .okpos-workspace {
          grid-template-columns: 1fr 1fr;
        }

        .function-buttons {
          grid-template-columns: repeat(2, 1fr);
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

        .okpos-workspace {
          grid-template-columns: 1fr;
          grid-template-rows: 1fr auto;
        }

        .payment-buttons {
          grid-template-columns: repeat(4, 1fr);
        }
      }

      @media (max-width: 768px) {
        .map-header {
          flex-direction: column;
          gap: 12px;
          align-items: flex-start;
        }

        .header-center {
          display: none;
        }

        .order-items-header {
          grid-template-columns: 0.6fr 2fr 1fr 1fr;
        }

        .order-item-row {
          grid-template-columns: 0.6fr 2fr 1fr 1fr;
        }

        .order-items-header .item-discount,
        .order-items-header .item-total,
        .order-item-row .item-discount,
        .order-item-row .item-total {
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

// Primary Action 핸들러 함수
function handlePrimaryAction() {
  // 미확정 주문이 있으면 확정, 없으면 테이블맵으로 이동
  if (window.hasUnconfirmedChanges || (window.pendingOrder && window.pendingOrder.length > 0)) {
    confirmPendingOrder();
  } else {
    returnToTableMap();
  }
}

// 주문 저장 및 테이블맵으로 이동하는 함수 (레거시)
function saveOrderAndGoToMap() {
  return handlePrimaryAction();
}

// 전역 함수로 노출
window.renderPOSLayout = renderPOSLayout;
window.logoutPOS = logoutPOS;
window.saveOrderAndGoToMap = saveOrderAndGoToMap;
window.handlePrimaryAction = handlePrimaryAction;