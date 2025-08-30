
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
                    <div class="header-col item-name">메뉴명</div>
                    <div class="header-col item-price">단가</div>
                    <div class="header-col item-qty">수량</div>
                    <div class="header-col item-discount">할인</div>
                    <div class="header-col item-total">금액</div>
                    <div class="header-col item-note">비고</div>
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
                  <div class="summary-row">
                    <span class="label">받은 금액</span>
                    <span class="value" id="receivedAmount">₩0</span>
                  </div>
                  <div class="summary-row">
                    <span class="label">거스름돈</span>
                    <span class="value change" id="changeAmount">₩0</span>
                  </div>
                </div>

                <!-- 숫자 키패드 -->
                <div class="number-keypad">
                  <div class="keypad-row">
                    <button class="key-btn" onclick="inputNumber('7')">7</button>
                    <button class="key-btn" onclick="inputNumber('8')">8</button>
                    <button class="key-btn" onclick="inputNumber('9')">9</button>
                    <button class="key-btn special" onclick="clearInput()">C</button>
                  </div>
                  <div class="keypad-row">
                    <button class="key-btn" onclick="inputNumber('4')">4</button>
                    <button class="key-btn" onclick="inputNumber('5')">5</button>
                    <button class="key-btn" onclick="inputNumber('6')">6</button>
                    <button class="key-btn special" onclick="deleteInput()">⌫</button>
                  </div>
                  <div class="keypad-row">
                    <button class="key-btn" onclick="inputNumber('1')">1</button>
                    <button class="key-btn" onclick="inputNumber('2')">2</button>
                    <button class="key-btn" onclick="inputNumber('3')">3</button>
                    <button class="key-btn special double-height" onclick="inputNumber('00')">00</button>
                  </div>
                  <div class="keypad-row">
                    <button class="key-btn double-width" onclick="inputNumber('0')">0</button>
                    <button class="key-btn" onclick="inputNumber('.')">.</button>
                  </div>
                </div>
              </div>
            </section>

            <!-- 우측 컬럼: 메뉴 선택 + 결제/관리 버튼 -->
            <section class="right-column">
              <!-- 메뉴 선택 패널 -->
              <div class="menu-selection-panel">
                <div class="category-tabs" id="categoryTabs">
                  <!-- 카테고리 탭들 -->
                </div>
                <div class="menu-grid" id="menuGrid">
                  <!-- 메뉴 버튼들 -->
                </div>
              </div>

              <!-- 결제 수단 버튼 -->
              <div class="payment-methods-panel">
                <div class="payment-title">💳 결제 수단</div>
                <div class="payment-buttons">
                  <button class="payment-btn card-btn" onclick="processPayment('CARD')" disabled>
                    💳 신용카드
                  </button>
                  <button class="payment-btn cash-btn" onclick="processPayment('CASH')" disabled>
                    💵 현금결제
                  </button>
                  <button class="payment-btn mobile-btn" onclick="processPayment('MOBILE')" disabled>
                    📱 간편결제
                  </button>
                  <button class="payment-btn tl-btn" onclick="processPayment('TL_PAY')" disabled>
                    🔵 TL Pay
                  </button>
                </div>
              </div>

              <!-- 보조 기능 버튼 -->
              <div class="assistant-functions-panel">
                <div class="function-title">⚙️ 관리 기능</div>
                <div class="function-buttons">
                  <button class="func-btn" onclick="applyTLCoupon()">
                    🎫 TL 쿠폰
                  </button>
                  <button class="func-btn" onclick="applyTLPoints()">
                    ⭐ TL 포인트
                  </button>
                  <button class="func-btn" onclick="checkTLLOrder()">
                    📱 TLL 주문
                  </button>
                  <button class="func-btn" onclick="sendToKitchen()">
                    🍳 주방전송
                  </button>
                  <button class="func-btn" onclick="printReceipt()">
                    🖨️ 영수증
                  </button>
                  <button class="func-btn" onclick="showDailySales()">
                    📊 일일정산
                  </button>
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
        min-height: 400px;
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
        grid-template-columns: 2fr 1fr 1fr 1fr 1fr 1fr;
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
        grid-template-columns: 2fr 1fr 1fr 1fr 1fr 1fr;
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

      .item-name {
        font-weight: 600;
        color: #1e293b;
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
        min-height: 300px;
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

      /* 숫자 키패드 */
      .number-keypad {
        flex: 1;
        padding: 16px;
        display: flex;
        flex-direction: column;
        gap: 8px;
      }

      .keypad-row {
        display: grid;
        grid-template-columns: repeat(4, 1fr);
        gap: 8px;
        flex: 1;
      }

      .key-btn {
        background: #f1f5f9;
        border: 2px solid #d1d5db;
        border-radius: 8px;
        font-size: 18px;
        font-weight: 700;
        cursor: pointer;
        transition: all 0.2s;
        color: #1e293b;
        min-height: 48px;
      }

      .key-btn:hover {
        background: #e2e8f0;
        border-color: #94a3b8;
        transform: translateY(-2px);
      }

      .key-btn:active {
        transform: translateY(0);
      }

      .key-btn.special {
        background: #3b82f6;
        color: white;
        border-color: #2563eb;
      }

      .key-btn.special:hover {
        background: #2563eb;
        border-color: #1d4ed8;
      }

      .key-btn.double-width {
        grid-column: span 2;
      }

      .key-btn.double-height {
        grid-row: span 2;
      }

      /* 우측 컬럼 */
      .right-column {
        display: flex;
        flex-direction: column;
        gap: 2px;
      }

      /* 메뉴 선택 패널 */
      .menu-selection-panel {
        background: white;
        flex: 1;
        display: flex;
        flex-direction: column;
        min-height: 400px;
      }

      .category-tabs {
        display: flex;
        background: #f8fafc;
        border-bottom: 2px solid #e2e8f0;
        padding: 12px;
        gap: 6px;
        overflow-x: auto;
      }

      .category-tab {
        padding: 12px 20px;
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

      .menu-grid {
        flex: 1;
        padding: 16px;
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
        gap: 12px;
        overflow-y: auto;
      }

      .menu-item-btn {
        aspect-ratio: 1;
        border: 2px solid #e2e8f0;
        border-radius: 12px;
        background: white;
        cursor: pointer;
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
        text-align: center;
        padding: 12px;
        transition: all 0.2s;
        min-height: 100px;
      }

      .menu-item-btn:hover {
        border-color: #3b82f6;
        transform: translateY(-3px);
        box-shadow: 0 6px 20px rgba(59, 130, 246, 0.15);
      }

      .menu-item-btn:active {
        transform: translateY(-1px) scale(0.98);
      }

      .menu-item-name {
        font-size: 14px;
        font-weight: 700;
        color: #1e293b;
        margin-bottom: 8px;
        line-height: 1.2;
      }

      .menu-item-price {
        font-size: 13px;
        color: #059669;
        font-weight: 700;
      }

      /* 결제 수단 패널 */
      .payment-methods-panel {
        background: white;
        padding: 16px;
        min-height: 120px;
      }

      .payment-title {
        font-size: 14px;
        font-weight: 700;
        color: #1e293b;
        margin-bottom: 12px;
        text-align: center;
      }

      .payment-buttons {
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        gap: 8px;
      }

      .payment-btn {
        padding: 16px 8px;
        border: none;
        border-radius: 8px;
        font-size: 13px;
        font-weight: 700;
        cursor: pointer;
        transition: all 0.2s;
        color: white;
        min-height: 48px;
      }

      .payment-btn:disabled {
        opacity: 0.5;
        cursor: not-allowed;
      }

      .card-btn {
        background: #3b82f6;
      }

      .card-btn:not(:disabled):hover {
        background: #2563eb;
        transform: translateY(-2px);
      }

      .cash-btn {
        background: #059669;
      }

      .cash-btn:not(:disabled):hover {
        background: #047857;
        transform: translateY(-2px);
      }

      .mobile-btn {
        background: #7c3aed;
      }

      .mobile-btn:not(:disabled):hover {
        background: #6d28d9;
        transform: translateY(-2px);
      }

      .tl-btn {
        background: #1e40af;
      }

      .tl-btn:not(:disabled):hover {
        background: #1e3a8a;
        transform: translateY(-2px);
      }

      /* 보조 기능 패널 */
      .assistant-functions-panel {
        background: white;
        padding: 16px;
        min-height: 140px;
      }

      .function-title {
        font-size: 14px;
        font-weight: 700;
        color: #1e293b;
        margin-bottom: 12px;
        text-align: center;
      }

      .function-buttons {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 6px;
      }

      .func-btn {
        padding: 12px 6px;
        border: 1px solid #d1d5db;
        border-radius: 6px;
        background: white;
        font-size: 11px;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.2s;
        color: #374151;
        min-height: 40px;
        text-align: center;
      }

      .func-btn:hover {
        background: #f1f5f9;
        border-color: #94a3b8;
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
          grid-template-columns: 2fr 1fr 1fr 1fr;
        }

        .order-item-row {
          grid-template-columns: 2fr 1fr 1fr 1fr;
        }

        .order-items-header .item-discount,
        .order-items-header .item-note,
        .order-item-row .item-discount,
        .order-item-row .item-note {
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
