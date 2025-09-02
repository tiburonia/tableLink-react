// TableLink POS 시스템 레이아웃 구성
// (v4.0 - 2024.12.11 - 단일화된 POS 구조 기반 상용 서비스)
export function renderPOSLayout() {
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

                  <div class="order-items-list" id="orderItems">
                    <div class="empty-order">
                      <div class="empty-icon">📝</div>
                      <p>메뉴를 선택해주세요</p>
                    </div>
                  </div>
                </div>

                <!-- 주문 수정 네비게이션 -->
                <div class="order-controls">
                  <div class="order-nav-bar">
                    <div class="nav-section">
                      <h4>📝 주문 수정</h4>
                      <div class="nav-buttons">
                        <button class="nav-btn select-btn" onclick="window.selectAllItems()">
                          <span class="nav-icon">☑️</span>
                          <span>전체선택</span>
                        </button>

                        <button class="nav-btn delete-btn" onclick="window.deleteSelectedPendingItems()">
                          <span class="nav-icon">🗑️</span>
                          <span>선택삭제</span>
                        </button>



                        <button class="nav-btn qty-minus-btn" onclick="window.changeSelectedQuantity(-1)">
                          <span class="nav-icon">➖</span>
                          <span>수량-1</span>
                        </button>

                        <button class="nav-btn qty-plus-btn" onclick="window.changeSelectedQuantity(1)">
                          <span class="nav-icon">➕</span>
                          <span>수량+1</span>
                        </button>

                        <button class="nav-btn qty-plus-btn" onclick="changeQuantity(1)">
                          <span class="nav-icon">➕</span>
                          <span>수량+1</span>
                        </button>

                        <button class="nav-btn clear-btn" onclick="clearOrder()">
                          <span class="nav-icon">🗑️</span>
                          <span>전체삭제</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <!-- 하단: 결제 정보 패널 -->
              <div class="payment-info-panel">
                <div class="payment-summary" id="paymentSummary">
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

                <div id="orderControlsPanel" class="order-controls-container">
                  <!-- 주문 컨트롤 패널이 여기 렌더링됩니다 -->
                </div>

                <div class="action-buttons">
                  <button id="primaryActionBtn" class="primary-action-btn" onclick="handlePrimaryAction()">
                    <div class="btn-content">
                      <span class="btn-title">주문 없음</span>
                      <span class="btn-subtitle">메뉴를 선택하세요</span>
                    </div>
                  </button>
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
                  <button class="primary-action-btn" id="primaryActionBtn" onclick="handlePrimaryAction()" disabled>
                    <div class="btn-content">
                      <span class="btn-title">주문 없음</span>
                      <span class="btn-subtitle">메뉴를 선택하세요</span>
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

    <!-- 결제 모달 -->
    <div id="paymentModal" class="modal hidden">
      <div class="modal-content">
        <div class="modal-header">
          <h2>결제하기</h2>
          <button class="close-modal-btn" onclick="closePaymentModal()">&times;</button>
        </div>
        <div class="modal-body">
          <div class="payment-form">
            <div class="form-group">
              <label for="phoneNumber">전화번호 (TLL 연동)</label>
              <input type="tel" id="phoneNumber" placeholder="010-1234-5678" />
            </div>
            <div class="form-group">
              <label>결제 수단</label>
              <div class="payment-options">
                <button class="payment-modal-btn card-btn" onclick="confirmPayment('CARD')">카드 결제</button>
                <button class="payment-modal-btn cash-btn" onclick="confirmPayment('CASH')">현금 결제</button>
                <button class="payment-modal-btn tll-link-btn" onclick="confirmPayment('TLL_LINK')">TLL 연동</button>
              </div>
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <button class="cancel-btn" onclick="closePaymentModal()">취소</button>
          <button class="confirm-btn" onclick="processFinalPayment()">결제 완료</button>
        </div>
      </div>
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
        min-height: 0; /* flex 아이템 크기 제한 */
      }

      /* 테이블맵 화면 */
      .table-map-view {
        height: calc(100vh - 60px); /* 헤더 높이 제외 */
        display: grid;
        grid-template-columns: 1fr 300px;
        gap: 1px;
        background: #e2e8f0;
        overflow: hidden;
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
        height: calc(100vh - 120px); /* 헤더 제외한 전체 높이 */
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

      /* 주문 섹션 스타일 */
      .order-section {
        margin-bottom: 20px;
      }

      .section-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 12px 16px;
        background: #f8fafc;
        border: 1px solid #e2e8f0;
        border-radius: 8px 8px 0 0;
        margin-bottom: 8px;
      }

      .section-header h4 {
        margin: 0;
        font-size: 14px;
        font-weight: 700;
        color: #1e293b;
      }

      .status-badge {
        padding: 4px 12px;
        border-radius: 16px;
        font-size: 11px;
        font-weight: 700;
        text-transform: uppercase;
      }

      .status-badge.pending {
        background: #fef3c7;
        color: #92400e;
      }

      .status-badge.confirmed {
        background: #dcfce7;
        color: #166534;
      }

      .items-list {
        padding: 0 8px;
      }

      .empty-order {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        height: 100%;
        color: #94a3b8;
        min-height: 200px;
        padding: 40px 20px;
        text-align: center;
      }

      .empty-icon {
        font-size: 48px;
        margin-bottom: 12px;
        opacity: 0.7;
      }

      /* 새로운 주문 아이템 스타일 */
      .order-item {
        display: flex;
        align-items: center;
        padding: 12px;
        margin-bottom: 8px;
        background: white;
        border: 2px solid #e2e8f0;
        border-radius: 12px;
        cursor: pointer;
        transition: all 0.3s ease;
        position: relative;
      }

      .order-item:hover {
        border-color: #3b82f6;
        transform: translateY(-1px);
        box-shadow: 0 4px 12px rgba(0,0,0,0.1);
      }

      .order-item.selected {
        border-color: #3b82f6;
        background: #dbeafe;
        box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
      }

      .order-item.pending {
        border-color: #f59e0b;
        background: linear-gradient(135deg, #fffbeb, #fef3c7);
        border-style: dashed;
      }

      .order-item.confirmed {
        border-color: #10b981;
        background: linear-gradient(135deg, #ecfdf5, #d1fae5);
      }

      .item-main {
        flex: 1;
        display: flex;
        flex-direction: column;
        gap: 4px;
      }

      .item-name {
        font-size: 14px;
        font-weight: 700;
        color: #1e293b;
      }

      .item-price {
        font-size: 12px;
        color: #059669;
        font-weight: 600;
      }

      .item-price .discount {
        color: #dc2626;
        text-decoration: line-through;
        margin-right: 8px;
      }

      .item-price .final-price {
        color: #059669;
        font-weight: 700;
      }

      .item-controls {
        display: flex;
        align-items: center;
        gap: 12px;
      }

      .quantity-controls {
        display: flex;
        align-items: center;
        gap: 8px;
        background: #f8fafc;
        padding: 4px 8px;
        border-radius: 20px;
        border: 1px solid #e2e8f0;
      }

      .quantity-controls button {
        width: 24px;
        height: 24px;
        border: none;
        background: #3b82f6;
        color: white;
        border-radius: 50%;
        font-size: 12px;
        font-weight: 700;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: all 0.2s;
      }

      .quantity-controls button:hover {
        background: #2563eb;
        transform: scale(1.1);
      }

      .quantity-controls span {
        font-size: 14px;
        font-weight: 700;
        color: #1e293b;
        min-width: 20px;
        text-align: center;
      }

      .quantity-display {
        background: #f1f5f9;
        padding: 4px 12px;
        border-radius: 12px;
        font-size: 12px;
        font-weight: 600;
        color: #475569;
      }

      .item-status {
        background: #10b981;
        color: white;
        padding: 4px 8px;
        border-radius: 12px;
        font-size: 10px;
        font-weight: 700;
        text-transform: uppercase;
      }

      .order-item.pending .item-status {
        background: #f59e0b;
      }

      .order-item.confirmed .item-status {
        background: #10b981;
      }

      /* 확정/미확정 상태 스타일 */
      .order-item-row.pending-item {
        background: linear-gradient(90deg, transparent 0%, #f3e8ff 100%);
        border-left: 3px solid #8b5cf6;
        opacity: 0.8;
      }

      .order-item-row.confirmed-item {
        background: linear-gradient(90deg, transparent 0%, #ecfdf5 100%);
        border-left: 3px solid #10b981;
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

      /* 주문 수정 네비게이션 */
      .order-controls {
        padding: 12px 16px;
        border-top: 1px solid #e2e8f0;
        background: #f8fafc;
      }

      .order-nav-bar {
        display: flex;
        flex-direction: column;
        gap: 12px;
      }

      .nav-section {
        display: flex;
        flex-direction: column;
        gap: 10px;
      }

      .nav-section h4 {
        font-size: 12px;
        color: #374151;
        margin: 0;
        font-weight: 700;
      }

      .nav-buttons {
        display: flex;
        gap: 6px;
        flex-wrap: wrap;
      }

      .nav-btn {
        padding: 8px 10px;
        border: 1px solid #d1d5db;
        border-radius: 6px;
        background: white;
        font-size: 10px;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.2s;
        display: flex;
        align-items: center;
        gap: 3px;
        flex: 1;
        min-width: 70px;
        justify-content: center;
      }

      .nav-btn:hover {
        background: #f1f5f9;
        border-color: #94a3b8;
        transform: translateY(-1px);
      }

      .nav-btn:disabled {
        opacity: 0.5;
        cursor: not-allowed;
        transform: none;
      }

      .select-btn:hover {
        background: #dbeafe;
        border-color: #3b82f6;
        color: #1e40af;
      }

      .delete-btn:hover,
      .clear-btn:hover {
        background: #fecaca;
        border-color: #ef4444;
        color: #dc2626;
      }

      .discount-btn:hover {
        background: #fef3c7;
        border-color: #f59e0b;
        color: #d97706;
      }

      .qty-plus-btn:hover {
        background: #dcfce7;
        border-color: #22c55e;
        color: #16a34a;
      }

      .qty-minus-btn:hover {
        background: #fee2e2;
        border-color: #ef4444;
        color: #dc2626;
      }

      .nav-icon {
        font-size: 11px;
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
      .order-type-badge.type-pos {
        background: linear-gradient(135deg, #f59e0b, #d97706);
        color: white;
      }

      .order-type-badge.type-temp {
        background: linear-gradient(135deg, #8b5cf6, #7c3aed);
        color: white;
        animation: pulse 2s infinite;
      }

      .order-type-badge.type-db {
        background: linear-gradient(135deg, #10b981, #059669);
        color: white;
      }

      @keyframes pulse {
        0%, 100% { opacity: 1; }
        50% { opacity: 0.7; }
      }

      .order-item-row.pending {
        background: linear-gradient(90deg, transparent 0%, #f3e8ff 100%);
        border-left: 3px solid #8b5cf6;
      }

      .order-item-row.confirmed {
        background: linear-gradient(90deg, transparent 0%, #ecfdf5 100%);
        border-left: 3px solid #10b981;
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
        background: linear-gradient(135deg, #f8fafc, #f1f5f9);
        border: 2px solid #e2e8f0;
        border-radius: 16px;
        padding: 20px;
        margin-bottom: 16px;
      }

      .panel-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 16px;
      }

      .panel-header h4 {
        margin: 0;
        font-size: 16px;
        font-weight: 700;
        color: #374151;
      }

      .panel-indicator {
        padding: 4px 12px;
        background: #e5e7eb;
        color: #6b7280;
        border-radius: 12px;
        font-size: 12px;
        font-weight: 600;
        transition: all 0.2s ease;
      }

      .panel-indicator.ready {
        background: #059669;
        color: white;
        animation: pulse 2s infinite;
      }

      .panel-indicator.pending {
        background: #f59e0b;
        color: white;
      }

      @keyframes pulse {
        0%, 100% { opacity: 1; }
        50% { opacity: 0.7; }
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

      /* 반응형 - POS는 주로 데스크톱/태블릿 환경 */
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

        .advanced-functions-grid {
          grid-template-columns: repeat(3, 1fr);
        }
      }

      @media (max-width: 1200px) {
        .okpos-workspace {
          grid-template-columns: 1fr;
          grid-template-rows: 1fr auto;
          height: calc(100vh - 120px);
        }

        .right-column {
          max-height: 300px;
          overflow-y: auto;
        }

        .menu-grid {
          grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
        }

        .payment-grid {
          grid-template-columns: repeat(4, 1fr);
        }

        .advanced-functions-grid {
          grid-template-columns: repeat(4, 1fr);
        }
      }

      @media (max-width: 900px) {
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

        .order-items-header {
          grid-template-columns: 0.8fr 2fr 1fr 1fr;
        }

        .order-item-row {
          grid-template-columns: 0.8fr 2fr 1fr 1fr;
        }

        .order-items-header .item-discount,
        .order-items-header .item-total,
        .order-item-row .item-discount,
        .order-item-row .item-total {
          display: none;
        }
      }

      @media (max-width: 600px) {
        .pos-header {
          padding: 0 12px;
        }

        .header-center {
          display: none;
        }

        .map-header {
          flex-direction: column;
          gap: 12px;
          align-items: flex-start;
        }

        .order-items-header {
          grid-template-columns: 0.6fr 2fr 1fr;
        }

        .order-item-row {
          grid-template-columns: 0.6fr 2fr 1fr;
        }

        .order-items-header .item-qty,
        .order-item-row .item-qty {
          display: none;
        }
      }

      /* 결제 모달 스타일 */
      .modal {
        position: fixed;
        z-index: 1000;
        left: 0;
        top: 0;
        width: 100%;
        height: 100%;
        overflow: auto;
        background-color: rgba(0,0,0,0.4);
        display: flex;
        justify-content: center;
        align-items: center;
      }

      .modal.hidden {
        display: none;
      }

      .modal-content {
        background-color: #fefefe;
        margin: auto;
        padding: 20px;
        border: 1px solid #888;
        width: 90%;
        max-width: 500px;
        border-radius: 10px;
        box-shadow: 0 5px 15px rgba(0,0,0,0.3);
        animation: fadeIn 0.3s ease-out;
      }

      @keyframes fadeIn {
        from {opacity: 0; transform: scale(0.9);}
        to {opacity: 1; transform: scale(1);}
      }

      .modal-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding-bottom: 15px;
        border-bottom: 1px solid #e2e8f0;
        margin-bottom: 20px;
      }

      .modal-header h2 {
        font-size: 20px;
        font-weight: 700;
        color: #1e293b;
      }

      .close-modal-btn {
        background: none;
        border: none;
        font-size: 28px;
        color: #aaa;
        cursor: pointer;
        transition: color 0.2s;
      }

      .close-modal-btn:hover {
        color: #333;
      }

      .modal-body {
        margin-bottom: 20px;
      }

      .payment-form .form-group {
        margin-bottom: 15px;
      }

      .payment-form label {
        display: block;
        margin-bottom: 8px;
        font-weight: 600;
        color: #374151;
      }

      .payment-form input[type="tel"] {
        width: 100%;
        padding: 12px 15px;
        border: 1px solid #d1d5db;
        border-radius: 8px;
        font-size: 14px;
        box-sizing: border-box;
      }

      .payment-form input[type="tel"]:focus {
        outline: none;
        border-color: #3b82f6;
        box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
      }

      .payment-options {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 10px;
      }

      .payment-modal-btn {
        padding: 12px 10px;
        border: none;
        border-radius: 8px;
        cursor: pointer;
        transition: all 0.3s ease;
        font-size: 13px;
        font-weight: 600;
        display: flex;
        justify-content: center;
        align-items: center;
        height: 50px;
      }

      .payment-modal-btn:hover {
        transform: translateY(-2px);
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      }

      .payment-modal-btn.card-btn {
        background: linear-gradient(135deg, #3b82f6, #2563eb);
        color: white;
      }
      .payment-modal-btn.card-btn:hover {
        background: linear-gradient(135deg, #2563eb, #1d4ed8);
      }

      .payment-modal-btn.cash-btn {
        background: linear-gradient(135deg, #10b981, #059669);
        color: white;
      }
      .payment-modal-btn.cash-btn:hover {
        background: linear-gradient(135deg, #059669, #047857);
      }

      .payment-modal-btn.tll-link-btn {
        background: linear-gradient(135deg, #f59e0b, #d97706);
        color: white;
        grid-column: 1 / -1; /* Span across all columns */
      }
      .payment-modal-btn.tll-link-btn:hover {
        background: linear-gradient(135deg, #d97706, #b45309);
      }

      .modal-footer {
        display: flex;
        justify-content: flex-end;
        gap: 10px;
        padding-top: 20px;
        border-top: 1px solid #e2e8f0;
        margin-top: 20px;
      }

      .cancel-btn, .confirm-btn {
        padding: 10px 20px;
        border: none;
        border-radius: 8px;
        cursor: pointer;
        font-size: 14px;
        font-weight: 700;
        transition: background 0.2s, transform 0.2s;
      }

      .cancel-btn {
        background: #f3f4f6;
        color: #374151;
      }
      .cancel-btn:hover {
        background: #e5e7eb;
        transform: translateY(-1px);
      }

      .confirm-btn {
        background: #3b82f6;
        color: white;
      }
      .confirm-btn:hover {
        background: #2563eb;
        transform: translateY(-1px);
      }
    </style>
  `;

  // 시계 업데이트 시작
  updateCurrentTime();
  setInterval(updateCurrentTime, 1000);

  // 결제 버튼 이벤트 리스너 추가
  document.querySelectorAll('.payment-btn').forEach(button => {
    button.addEventListener('click', openPaymentModal);
  });
}

// 결제 모달 열기
function openPaymentModal() {
  const paymentModal = document.getElementById('paymentModal');
  if (paymentModal) {
    paymentModal.classList.remove('hidden');
  }
}

// 결제 모달 닫기
function closePaymentModal() {
  const paymentModal = document.getElementById('paymentModal');
  if (paymentModal) {
    paymentModal.classList.add('hidden');
  }
}

// 각 결제 수단에 대한 최종 확인 로직
function confirmPayment(paymentMethod) {
  const phoneNumber = document.getElementById('phoneNumber').value;
  console.log(`Payment method: ${paymentMethod}, Phone Number: ${phoneNumber}`);
  // 여기에 실제 결제 로직 구현 (TLL 연동, 카드/현금 처리 등)
  alert(`결제 시도: ${paymentMethod}, 전화번호: ${phoneNumber}`);
  closePaymentModal(); // 모달 닫기
}

// 최종 결제 처리 함수 (모달 외부 버튼 클릭 시)
function processFinalPayment() {
  const selectedPaymentMethod = document.querySelector('.payment-options .payment-modal-btn:not([style*="display: none"])'); // Simplified selection
  if (selectedPaymentMethod) {
    let method = '';
    if (selectedPaymentMethod.classList.contains('card-btn')) method = 'CARD';
    else if (selectedPaymentMethod.classList.contains('cash-btn')) method = 'CASH';
    else method = 'TLL_LINK'; // Assuming the default TLL button

    confirmPayment(method);
  } else {
    alert('결제 수단을 선택해주세요.');
  }
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

// 전역 함수로 노출 (하위 호환성)
if (typeof window !== 'undefined') {
  window.renderPOSLayout = renderPOSLayout;
  window.logoutPOS = logoutPOS;
  window.saveOrderAndGoToMap = saveOrderAndGoToMap;
  window.handlePrimaryAction = handlePrimaryAction;
  window.openPaymentModal = openPaymentModal;
  window.closePaymentModal = closePaymentModal;
  window.confirmPayment = confirmPayment;
  window.processFinalPayment = processFinalPayment;
}