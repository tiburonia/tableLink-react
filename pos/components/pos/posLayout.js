
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
          <button class="header-btn logout-btn" onclick="logOut()">
            <span>🚪 로그아웃</span>
          </button>
        </div>
      </header>

      <!-- 메인 컨텐츠 영역 -->
      <main class="pos-main">
        <!-- 테이블맵 뷰 -->
        <div id="tableMapView" class="view-container">
          <div class="map-container">
            <div class="map-header">
              <div class="header-left">
                <h2 class="section-title">📍 테이블 현황</h2>
                <div class="table-stats">
                  <span class="stat-item">
                    <span class="stat-label">활성 테이블:</span>
                    <span class="stat-value" id="activeTables">0/0</span>
                  </span>
                </div>
              </div>
              
              <div class="header-right">
                <div class="today-summary">
                  <div class="summary-item">
                    <span class="summary-label">오늘 매출</span>
                    <span class="summary-value" id="todayRevenue">₩0</span>
                  </div>
                  <div class="summary-item">
                    <span class="summary-label">주문 건수</span>
                    <span class="summary-value" id="todayOrders">0건</span>
                  </div>
                </div>
              </div>
            </div>

            <div class="table-map-grid" id="tableMapGrid">
              <!-- 테이블 버튼들이 동적으로 생성됩니다 -->
            </div>
          </div>

          <!-- 사이드 패널 -->
          <div class="side-panel">
            <div class="panel-section">
              <h3>📊 매장 관리</h3>
              <div class="panel-buttons">
                <button class="panel-btn" onclick="showReservations()">
                  <span class="btn-icon">📅</span>
                  <span class="btn-text">예약 현황</span>
                </button>
                <button class="panel-btn" onclick="showDeliveryOrders()">
                  <span class="btn-icon">🚚</span>
                  <span class="btn-text">배달/포장</span>
                </button>
                <button class="panel-btn" onclick="showDailyStats()">
                  <span class="btn-icon">📈</span>
                  <span class="btn-text">매출 통계</span>
                </button>
              </div>
            </div>

            <div class="panel-section">
              <h3>🔧 시스템</h3>
              <div class="panel-buttons">
                <button class="panel-btn" onclick="showKitchenStatus()">
                  <span class="btn-icon">👨‍🍳</span>
                  <span class="btn-text">주방 현황</span>
                </button>
                <button class="panel-btn" onclick="showPOSSettings()">
                  <span class="btn-icon">⚙️</span>
                  <span class="btn-text">POS 설정</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- 주문 뷰 -->
        <div id="orderView" class="view-container hidden">
          <div class="okpos-workspace">
            <!-- 좌측: 메뉴 선택 영역 -->
            <div class="menu-section">
              <div class="menu-header">
                <h2 id="orderTableTitle">테이블 주문/결제</h2>
                <div class="table-info">
                  <span class="table-status" id="statusIndicator"></span>
                  <span class="status-text" id="statusText">준비중</span>
                </div>
              </div>

              <!-- 메뉴 카테고리 탭 -->
              <div class="category-tabs" id="categoryTabs">
                <!-- 카테고리 버튼들이 동적으로 생성됩니다 -->
              </div>

              <!-- 메뉴 검색 -->
              <div class="menu-search">
                <input type="text" placeholder="메뉴 검색..." onkeyup="searchMenus(this.value)">
              </div>

              <!-- 메뉴 그리드 -->
              <div class="menu-grid" id="menuGrid">
                <!-- 메뉴 아이템들이 동적으로 생성됩니다 -->
              </div>
            </div>

            <!-- 우측: 주문 관리 영역 -->
            <div class="order-section">
              <!-- 주문 아이템 목록 -->
              <div class="order-panel">
                <div class="order-header">
                  <h3>📝 주문 내역</h3>
                  <div class="order-controls">
                    <button class="control-btn" onclick="selectAllItems()">전체선택</button>
                    <button class="control-btn delete-btn" onclick="deleteSelectedItems()">선택삭제</button>
                  </div>
                </div>

                <div class="order-items-container">
                  <div class="order-items-header">
                    <div class="item-type">구분</div>
                    <div class="item-name">메뉴명</div>
                    <div class="item-price">가격</div>
                    <div class="item-qty">수량</div>
                    <div class="item-discount">할인</div>
                    <div class="item-total">합계</div>
                  </div>
                  <div class="order-items-list" id="orderItemsList">
                    <!-- 주문 아이템들이 동적으로 생성됩니다 -->
                  </div>
                </div>
              </div>

              <!-- 수량/할인 컨트롤 -->
              <div class="item-controls">
                <div class="quantity-controls">
                  <button class="qty-btn" onclick="changeQuantity(-1)">수량-</button>
                  <button class="qty-btn" onclick="changeQuantity(1)">수량+</button>
                  <button class="discount-btn" onclick="applyDiscount()">할인적용</button>
                </div>
              </div>

              <!-- 결제 요약 -->
              <div class="payment-summary">
                <div class="summary-row">
                  <span class="summary-label">소계:</span>
                  <span class="summary-value" id="totalAmount">₩0</span>
                </div>
                <div class="summary-row">
                  <span class="summary-label">할인:</span>
                  <span class="summary-value discount" id="discountAmount">₩0</span>
                </div>
                <div class="summary-row total">
                  <span class="summary-label">총 금액:</span>
                  <span class="summary-value" id="finalAmount">₩0</span>
                </div>
              </div>

              <!-- 메인 액션 버튼 -->
              <div class="main-actions">
                <button class="primary-action-btn" id="primaryActionBtn">
                  <div class="btn-content">
                    <div class="btn-title">주문 없음</div>
                    <div class="btn-subtitle">메뉴를 선택하세요</div>
                  </div>
                </button>
                <button class="secondary-action-btn cancel-changes-btn" onclick="cancelOrderChanges()" style="display: none;">
                  <span>변경사항 취소</span>
                </button>
              </div>

              <!-- 결제 상태 표시 -->
              <div class="payment-status">
                <div class="status-indicator" id="paymentIndicator">대기중</div>
              </div>

              <!-- 결제 버튼들 -->
              <div class="payment-buttons">
                <button class="payment-btn card-btn" onclick="showPaymentModal()">
                  <span class="payment-icon">💳</span>
                  <span class="payment-text">카드결제</span>
                </button>
                <button class="payment-btn cash-btn" onclick="showPaymentModal()">
                  <span class="payment-icon">💵</span>
                  <span class="payment-text">현금결제</span>
                </button>
                <button class="payment-btn mobile-btn" onclick="showPaymentModal()">
                  <span class="payment-icon">📱</span>
                  <span class="payment-text">간편결제</span>
                </button>
                <button class="payment-btn combo-btn" onclick="showPaymentModal()">
                  <span class="payment-icon">🔄</span>
                  <span class="payment-text">복합결제</span>
                </button>
              </div>

              <!-- 고급 기능 패널 -->
              <div class="advanced-panel">
                <button class="advanced-toggle" id="advancedToggle" onclick="toggleAdvancedPanel()">
                  <span>▼</span> 고급 기능
                </button>
                <div class="advanced-functions" id="advancedFunctionsGrid">
                  <button class="advanced-btn" onclick="holdCurrentOrder()">
                    <span class="btn-icon">⏸️</span>
                    <span class="btn-text">주문보류</span>
                  </button>
                  <button class="advanced-btn" onclick="voidOrder()">
                    <span class="btn-icon">❌</span>
                    <span class="btn-text">주문취소</span>
                  </button>
                  <button class="advanced-btn" onclick="applyTLCoupon()">
                    <span class="btn-icon">🎫</span>
                    <span class="btn-text">TL쿠폰</span>
                  </button>
                  <button class="advanced-btn" onclick="applyTLPoints()">
                    <span class="btn-icon">⭐</span>
                    <span class="btn-text">TL포인트</span>
                  </button>
                  <button class="advanced-btn" onclick="checkTLLOrder()">
                    <span class="btn-icon">🔗</span>
                    <span class="btn-text">TLL연동</span>
                  </button>
                  <button class="advanced-btn" onclick="printReceipt()">
                    <span class="btn-icon">🖨️</span>
                    <span class="btn-text">영수증</span>
                  </button>
                </div>
              </div>

              <!-- 하단 액션 버튼들 -->
              <div class="bottom-actions">
                <button class="action-btn secondary" onclick="returnToTableMap()">
                  <span class="btn-icon">🗺️</span>
                  <span class="btn-text">테이블맵</span>
                </button>
                <button class="action-btn primary hold-btn" onclick="holdOrder()">
                  <span class="btn-icon">💾</span>
                  <span class="btn-text">보류</span>
                </button>
                <button class="action-btn danger clear-btn" onclick="clearOrder()">
                  <span class="btn-icon">🗑️</span>
                  <span class="btn-text">전체삭제</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>

      <!-- 알림 시스템 -->
      <div id="posNotificationContainer" class="pos-notification-container"></div>
    </div>

    <style>
      /* POS 레이아웃 스타일 */
      .pos-container {
        height: 100vh;
        display: flex;
        flex-direction: column;
        font-family: 'Noto Sans KR', -apple-system, BlinkMacSystemFont, sans-serif;
        background: #f8fafc;
      }

      .pos-header {
        background: white;
        border-bottom: 2px solid #e5e7eb;
        padding: 12px 24px;
        display: flex;
        justify-content: space-between;
        align-items: center;
        box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        z-index: 1000;
      }

      .header-left {
        display: flex;
        align-items: center;
        gap: 24px;
      }

      .pos-logo {
        font-size: 24px;
        font-weight: 700;
        color: #1f2937;
        margin: 0;
      }

      .store-info {
        font-size: 16px;
        color: #6b7280;
        font-weight: 500;
      }

      .header-center {
        font-size: 18px;
        font-weight: 600;
        color: #374151;
        font-family: 'Courier New', monospace;
      }

      .header-right {
        display: flex;
        align-items: center;
        gap: 16px;
      }

      .header-btn {
        padding: 8px 16px;
        border: none;
        border-radius: 6px;
        background: #f3f4f6;
        color: #374151;
        cursor: pointer;
        font-weight: 500;
        transition: all 0.2s;
      }

      .header-btn:hover {
        background: #e5e7eb;
      }

      .logout-btn:hover {
        background: #fef2f2;
        color: #dc2626;
      }

      .pos-main {
        flex: 1;
        overflow: hidden;
      }

      .view-container {
        height: 100%;
        padding: 20px;
        overflow: hidden;
      }

      .hidden {
        display: none !important;
      }

      /* 테이블맵 스타일 */
      .map-container {
        background: white;
        border-radius: 12px;
        padding: 24px;
        height: calc(100% - 200px);
        margin-bottom: 20px;
        box-shadow: 0 4px 6px rgba(0,0,0,0.05);
      }

      .map-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 24px;
        padding-bottom: 16px;
        border-bottom: 2px solid #f3f4f6;
      }

      .section-title {
        font-size: 20px;
        font-weight: 700;
        color: #1f2937;
        margin: 0;
      }

      .table-stats {
        margin-top: 8px;
      }

      .stat-item {
        display: inline-flex;
        align-items: center;
        gap: 4px;
        font-size: 14px;
      }

      .stat-label {
        color: #6b7280;
      }

      .stat-value {
        color: #1f2937;
        font-weight: 600;
      }

      .today-summary {
        display: flex;
        gap: 24px;
      }

      .summary-item {
        text-align: right;
      }

      .summary-label {
        display: block;
        font-size: 12px;
        color: #6b7280;
        margin-bottom: 4px;
      }

      .summary-value {
        display: block;
        font-size: 18px;
        font-weight: 700;
        color: #1f2937;
      }

      .table-map-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
        gap: 16px;
        height: calc(100% - 80px);
        overflow-y: auto;
      }

      .table-item {
        aspect-ratio: 1;
        border: 2px solid #e5e7eb;
        border-radius: 12px;
        background: white;
        cursor: pointer;
        transition: all 0.2s;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: 8px;
        font-weight: 600;
      }

      .table-item:hover {
        transform: translateY(-2px);
        box-shadow: 0 4px 12px rgba(0,0,0,0.1);
      }

      .table-item.available {
        border-color: #10b981;
        background: #f0fdf4;
      }

      .table-item.ordering {
        border-color: #f59e0b;
        background: #fffbeb;
      }

      .table-item.payment {
        border-color: #ef4444;
        background: #fef2f2;
      }

      .table-number {
        font-size: 18px;
        color: #1f2937;
      }

      .table-status {
        font-size: 12px;
        color: #6b7280;
      }

      .table-time {
        font-size: 10px;
        color: #9ca3af;
      }

      .side-panel {
        background: white;
        border-radius: 12px;
        padding: 20px;
        height: 200px;
        overflow-y: auto;
        box-shadow: 0 4px 6px rgba(0,0,0,0.05);
        display: flex;
        gap: 20px;
      }

      .panel-section {
        flex: 1;
      }

      .panel-section h3 {
        font-size: 16px;
        font-weight: 600;
        color: #1f2937;
        margin: 0 0 12px 0;
      }

      .panel-buttons {
        display: flex;
        flex-direction: column;
        gap: 8px;
      }

      .panel-btn {
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 10px 12px;
        border: 1px solid #e5e7eb;
        border-radius: 6px;
        background: white;
        cursor: pointer;
        transition: all 0.2s;
        font-size: 14px;
      }

      .panel-btn:hover {
        background: #f9fafb;
        border-color: #d1d5db;
      }

      /* 주문 화면 스타일 */
      .okpos-workspace {
        display: grid;
        grid-template-columns: 1fr 400px;
        gap: 20px;
        height: 100%;
      }

      .menu-section {
        background: white;
        border-radius: 12px;
        padding: 20px;
        overflow: hidden;
        display: flex;
        flex-direction: column;
        box-shadow: 0 4px 6px rgba(0,0,0,0.05);
      }

      .menu-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 20px;
        padding-bottom: 16px;
        border-bottom: 2px solid #f3f4f6;
      }

      .menu-header h2 {
        font-size: 20px;
        font-weight: 700;
        color: #1f2937;
        margin: 0;
      }

      .table-info {
        display: flex;
        align-items: center;
        gap: 8px;
      }

      .table-status {
        width: 12px;
        height: 12px;
        border-radius: 50%;
        background: #10b981;
      }

      .status-text {
        font-size: 14px;
        color: #6b7280;
        font-weight: 500;
      }

      .category-tabs {
        display: flex;
        gap: 8px;
        margin-bottom: 16px;
        overflow-x: auto;
        padding-bottom: 8px;
      }

      .category-tab {
        padding: 8px 16px;
        border: 2px solid #e5e7eb;
        border-radius: 20px;
        background: white;
        cursor: pointer;
        transition: all 0.2s;
        white-space: nowrap;
        font-weight: 500;
      }

      .category-tab.active {
        background: #3b82f6;
        color: white;
        border-color: #3b82f6;
      }

      .menu-search {
        margin-bottom: 16px;
      }

      .menu-search input {
        width: 100%;
        padding: 12px 16px;
        border: 2px solid #e5e7eb;
        border-radius: 8px;
        font-size: 14px;
        outline: none;
        transition: border-color 0.2s;
      }

      .menu-search input:focus {
        border-color: #3b82f6;
      }

      .menu-grid {
        flex: 1;
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
        gap: 12px;
        overflow-y: auto;
        padding-right: 8px;
      }

      .menu-item-btn {
        aspect-ratio: 1;
        border: 2px solid #e5e7eb;
        border-radius: 8px;
        background: white;
        cursor: pointer;
        transition: all 0.2s;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: 8px;
        padding: 12px;
      }

      .menu-item-btn:hover {
        border-color: #3b82f6;
        transform: translateY(-2px);
        box-shadow: 0 4px 12px rgba(0,0,0,0.1);
      }

      .menu-item-name {
        font-size: 14px;
        font-weight: 600;
        color: #1f2937;
        text-align: center;
        line-height: 1.2;
      }

      .menu-item-price {
        font-size: 12px;
        color: #6b7280;
        font-weight: 500;
      }

      .menu-added-animation {
        animation: menuAdded 0.6s ease;
      }

      @keyframes menuAdded {
        0% { transform: scale(1); }
        50% { transform: scale(1.1); background: #dbeafe; }
        100% { transform: scale(1); }
      }

      .order-section {
        display: flex;
        flex-direction: column;
        gap: 16px;
        height: 100%;
      }

      .order-panel {
        background: white;
        border-radius: 12px;
        padding: 16px;
        flex: 1;
        overflow: hidden;
        display: flex;
        flex-direction: column;
        box-shadow: 0 4px 6px rgba(0,0,0,0.05);
      }

      .order-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 16px;
        padding-bottom: 12px;
        border-bottom: 2px solid #f3f4f6;
      }

      .order-header h3 {
        font-size: 16px;
        font-weight: 600;
        color: #1f2937;
        margin: 0;
      }

      .order-controls {
        display: flex;
        gap: 8px;
      }

      .control-btn {
        padding: 6px 12px;
        border: 1px solid #e5e7eb;
        border-radius: 4px;
        background: white;
        cursor: pointer;
        font-size: 12px;
        transition: all 0.2s;
      }

      .control-btn:hover {
        background: #f9fafb;
      }

      .control-btn.delete-btn:hover {
        background: #fef2f2;
        border-color: #fca5a5;
        color: #dc2626;
      }

      .order-items-container {
        flex: 1;
        overflow: hidden;
        display: flex;
        flex-direction: column;
      }

      .order-items-header {
        display: grid;
        grid-template-columns: 60px 2fr 1fr 1fr 1fr 1fr;
        gap: 8px;
        padding: 8px;
        background: #f8fafc;
        border-radius: 6px;
        font-size: 12px;
        font-weight: 600;
        color: #6b7280;
      }

      .order-items-list {
        flex: 1;
        overflow-y: auto;
        margin-top: 8px;
      }

      .order-item-row {
        display: grid;
        grid-template-columns: 60px 2fr 1fr 1fr 1fr 1fr;
        gap: 8px;
        padding: 12px 8px;
        border-bottom: 1px solid #f3f4f6;
        cursor: pointer;
        transition: background 0.2s;
        align-items: center;
        font-size: 14px;
      }

      .order-item-row:hover {
        background: #f8fafc;
      }

      .order-item-row.selected {
        background: #dbeafe;
        border-color: #3b82f6;
      }

      .order-item-row.tll-item {
        background: #f0f9ff;
        border-left: 3px solid #0ea5e9;
      }

      .order-item-row.confirmed-item {
        background: #f0f9ff;
        border-left: 4px solid #3b82f6;
      }

      .order-item-row.pending-item {
        background: #fef3c7;
        border-left: 4px solid #f59e0b;
      }

      .item-type {
        display: flex;
        flex-direction: column;
        gap: 2px;
      }

      .order-type-badge {
        font-size: 10px;
        padding: 2px 6px;
        border-radius: 4px;
        font-weight: 600;
        text-align: center;
      }

      .type-pos {
        background: #dbeafe;
        color: #1e40af;
      }

      .type-tll {
        background: #dcfce7;
        color: #166534;
      }

      .status-badge {
        font-size: 9px;
        padding: 1px 4px;
        border-radius: 3px;
        font-weight: 500;
        text-align: center;
      }

      .status-badge.confirmed {
        background: #dbeafe;
        color: #1e40af;
      }

      .status-badge.pending {
        background: #fef3c7;
        color: #92400e;
      }

      .empty-order {
        text-align: center;
        padding: 40px 20px;
        color: #6b7280;
      }

      .empty-icon {
        font-size: 48px;
        margin-bottom: 12px;
      }

      .item-controls {
        background: white;
        border-radius: 8px;
        padding: 12px;
        box-shadow: 0 2px 4px rgba(0,0,0,0.05);
      }

      .quantity-controls {
        display: flex;
        gap: 8px;
      }

      .qty-btn, .discount-btn {
        flex: 1;
        padding: 8px 12px;
        border: 1px solid #e5e7eb;
        border-radius: 6px;
        background: white;
        cursor: pointer;
        font-size: 14px;
        font-weight: 500;
        transition: all 0.2s;
      }

      .qty-btn:hover, .discount-btn:hover {
        background: #f9fafb;
        border-color: #d1d5db;
      }

      .payment-summary {
        background: white;
        border-radius: 8px;
        padding: 16px;
        box-shadow: 0 2px 4px rgba(0,0,0,0.05);
      }

      .summary-row {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 8px 0;
        border-bottom: 1px solid #f3f4f6;
      }

      .summary-row:last-child {
        border-bottom: none;
      }

      .summary-row.total {
        font-size: 18px;
        font-weight: 700;
        border-top: 2px solid #e5e7eb;
        margin-top: 8px;
        padding-top: 12px;
      }

      .summary-label {
        color: #6b7280;
        font-weight: 500;
      }

      .summary-value {
        color: #1f2937;
        font-weight: 600;
      }

      .summary-value.discount {
        color: #dc2626;
      }

      .main-actions {
        display: flex;
        gap: 12px;
      }

      .primary-action-btn {
        flex: 1;
        padding: 16px 24px;
        border: none;
        border-radius: 8px;
        background: linear-gradient(135deg, #3b82f6, #2563eb);
        color: white;
        cursor: pointer;
        font-weight: 600;
        transition: all 0.2s;
        display: flex;
        align-items: center;
        justify-content: center;
      }

      .primary-action-btn:hover:not(:disabled) {
        transform: translateY(-1px);
        box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
      }

      .primary-action-btn:disabled {
        background: #f1f5f9;
        color: #6b7280;
        cursor: not-allowed;
      }

      .btn-content {
        text-align: center;
      }

      .btn-title {
        font-size: 16px;
        font-weight: 700;
      }

      .btn-subtitle {
        font-size: 12px;
        opacity: 0.9;
        margin-top: 2px;
      }

      .secondary-action-btn {
        padding: 12px 24px;
        border: 2px solid #6b7280;
        background: white;
        color: #374151;
        border-radius: 8px;
        cursor: pointer;
        font-weight: 600;
        transition: all 0.2s;
      }

      .secondary-action-btn:hover {
        background-color: #f9fafb;
        border-color: #4b5563;
      }

      .cancel-changes-btn:hover {
        background-color: #fef2f2;
        border-color: #dc2626;
        color: #dc2626;
      }

      .payment-status {
        background: white;
        border-radius: 8px;
        padding: 12px;
        text-align: center;
        box-shadow: 0 2px 4px rgba(0,0,0,0.05);
      }

      .status-indicator {
        padding: 8px 16px;
        border-radius: 6px;
        font-size: 14px;
        font-weight: 600;
        background: #f3f4f6;
        color: #6b7280;
        cursor: default;
      }

      .payment-buttons {
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        gap: 12px;
      }

      .payment-btn {
        padding: 12px;
        border: 2px solid #e5e7eb;
        border-radius: 8px;
        background: white;
        cursor: pointer;
        transition: all 0.2s;
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 4px;
      }

      .payment-btn:hover:not(:disabled) {
        border-color: #3b82f6;
        transform: translateY(-1px);
        box-shadow: 0 4px 8px rgba(0,0,0,0.1);
      }

      .payment-btn:disabled {
        opacity: 0.5;
        cursor: not-allowed;
      }

      .payment-icon {
        font-size: 20px;
      }

      .payment-text {
        font-size: 12px;
        font-weight: 600;
        color: #374151;
      }

      .advanced-panel {
        background: white;
        border-radius: 8px;
        overflow: hidden;
        box-shadow: 0 2px 4px rgba(0,0,0,0.05);
      }

      .advanced-toggle {
        width: 100%;
        padding: 12px 16px;
        border: none;
        background: #f8fafc;
        cursor: pointer;
        font-weight: 600;
        color: #374151;
        display: flex;
        align-items: center;
        gap: 8px;
        transition: background 0.2s;
      }

      .advanced-toggle:hover {
        background: #f1f5f9;
      }

      .advanced-toggle.collapsed span {
        transform: rotate(-90deg);
      }

      .advanced-functions {
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        gap: 8px;
        padding: 16px;
        transition: all 0.3s ease;
        max-height: 200px;
        overflow: hidden;
      }

      .advanced-functions.collapsed {
        max-height: 0;
        padding: 0 16px;
      }

      .advanced-btn {
        padding: 10px;
        border: 1px solid #e5e7eb;
        border-radius: 6px;
        background: white;
        cursor: pointer;
        transition: all 0.2s;
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 4px;
      }

      .advanced-btn:hover {
        background: #f9fafb;
        border-color: #d1d5db;
      }

      .btn-icon {
        font-size: 16px;
      }

      .btn-text {
        font-size: 11px;
        font-weight: 500;
        color: #6b7280;
      }

      .bottom-actions {
        display: flex;
        gap: 8px;
      }

      .action-btn {
        flex: 1;
        padding: 10px;
        border: 1px solid #e5e7eb;
        border-radius: 6px;
        background: white;
        cursor: pointer;
        transition: all 0.2s;
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 4px;
        font-size: 12px;
      }

      .action-btn:hover:not(:disabled) {
        background: #f9fafb;
        border-color: #d1d5db;
      }

      .action-btn:disabled {
        opacity: 0.5;
        cursor: not-allowed;
      }

      .action-btn.primary:hover {
        background: #dbeafe;
        border-color: #3b82f6;
      }

      .action-btn.danger:hover {
        background: #fef2f2;
        border-color: #dc2626;
        color: #dc2626;
      }

      /* 알림 시스템 */
      .pos-notification-container {
        position: fixed;
        top: 80px;
        right: 20px;
        z-index: 9999;
        display: flex;
        flex-direction: column;
        gap: 8px;
        max-width: 400px;
      }

      /* 시간 업데이트 */
      .current-time {
        animation: timeGlow 2s ease-in-out infinite alternate;
      }

      @keyframes timeGlow {
        from { opacity: 0.8; }
        to { opacity: 1; }
      }

      /* 반응형 디자인 */
      @media (max-width: 1200px) {
        .okpos-workspace {
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

  // 시간 업데이트 함수
  function updateCurrentTime() {
    const now = new Date();
    const timeString = now.toLocaleTimeString('ko-KR', {
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
    const timeElement = document.getElementById('currentTime');
    if (timeElement) {
      timeElement.textContent = timeString;
    }
  }

  // 시간 업데이트 시작
  updateCurrentTime();
  setInterval(updateCurrentTime, 1000);

  console.log('✅ POS 레이아웃 렌더링 완료 (OKPOS 구조)');
}

// 전역 함수로 노출
window.renderPOSLayout = renderPOSLayout;
