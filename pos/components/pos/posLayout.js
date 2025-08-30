
// POS 레이아웃 관리 모듈 (상용 서비스 기준 리팩토링)
function renderPOSLayout() {
  const main = document.getElementById('main');

  main.innerHTML = `
    <div class="pos-container">
      <!-- 상단 간소화된 헤더 -->
      <header class="pos-header">
        <div class="header-left">
          <h1 class="pos-logo">🍽️ TableLink POS</h1>
          <div class="store-info">
            <span id="storeName">매장 정보 로딩중...</span>
          </div>
        </div>

        <div class="header-center">
          <div class="table-selector">
            <button class="table-btn" onclick="showTableSelector()">
              📍 테이블 <span id="currentTableNumber">선택</span>
            </button>
          </div>
        </div>

        <div class="header-right">
          <div class="sync-status">
            <span class="sync-indicator" id="syncIndicator"></span>
            <span class="sync-text" id="syncTime">연결 중...</span>
          </div>
          <button class="header-btn stats-btn" onclick="showDailySummary()">
            📊 오늘매출
          </button>
        </div>
      </header>

      <!-- 메인 POS 작업 영역 (3분할) -->
      <div class="pos-workspace">
        <!-- 좌측: 메뉴 카테고리 & 상품 -->
        <section class="menu-section">
          <div class="category-tabs" id="categoryTabs">
            <!-- 카테고리 탭들이 여기에 표시 -->
          </div>
          <div class="menu-grid" id="menuGrid">
            <!-- 메뉴 버튼들이 여기에 표시 -->
          </div>
        </section>

        <!-- 중앙: 주문 내역 패널 -->
        <section class="order-panel">
          <div class="order-header">
            <h3>📦 주문 내역</h3>
            <div class="order-controls">
              <button class="control-btn hold-btn" onclick="holdCurrentOrder()" disabled>
                ⏸️ 보류
              </button>
              <button class="control-btn clear-btn" onclick="clearCurrentOrder()" disabled>
                🗑️ 전체삭제
              </button>
            </div>
          </div>
          
          <div class="order-items" id="orderItems">
            <div class="empty-order">
              <div class="empty-icon">📝</div>
              <p>메뉴를 선택해주세요</p>
            </div>
          </div>

          <div class="order-summary">
            <div class="total-amount">
              <span class="label">합계</span>
              <span class="amount" id="totalAmount">₩0</span>
            </div>
            <div class="item-count">
              총 <span id="itemCount">0</span>개
            </div>
          </div>
        </section>

        <!-- 우측: 결제 & 테이블 관리 -->
        <section class="payment-section">
          <div class="table-status" id="tableStatus">
            <div class="status-header">
              <h4>테이블 현황</h4>
            </div>
            <div class="table-grid" id="tableGrid">
              <!-- 테이블 상태가 여기에 표시 -->
            </div>
          </div>

          <div class="payment-buttons">
            <button class="payment-btn card-btn" onclick="processPayment('CARD')" disabled>
              💳 카드결제
            </button>
            <button class="payment-btn cash-btn" onclick="processPayment('CASH')" disabled>
              💵 현금결제
            </button>
            <button class="payment-btn mobile-btn" onclick="processPayment('MOBILE')" disabled>
              📱 간편결제
            </button>
          </div>

          <div class="quick-actions">
            <button class="action-btn" onclick="showTableMoveModal()">
              🔄 테이블이동
            </button>
            <button class="action-btn" onclick="showSplitPayment()">
              ✂️ 분할결제
            </button>
            <button class="action-btn" onclick="showOrderHistory()">
              📋 주문내역
            </button>
          </div>
        </section>
      </div>

      <!-- 하단 액션바 (간소화) -->
      <footer class="pos-footer">
        <div class="status-bar">
          <div class="server-status">
            <span class="status-dot" id="serverStatus"></span>
            <span>서버 연결됨</span>
          </div>
          <div class="today-summary" id="todaySummary">
            오늘 매출: ₩0 | 주문: 0건
          </div>
        </div>
      </footer>
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
        background: #f5f5f5;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      }

      /* 상단 헤더 - 간소화 */
      .pos-header {
        height: 60px;
        background: #1f2937;
        color: white;
        display: flex;
        align-items: center;
        padding: 0 20px;
        box-shadow: 0 2px 4px rgba(0,0,0,0.1);
      }

      .header-left {
        flex: 1;
        display: flex;
        align-items: center;
        gap: 15px;
      }

      .pos-logo {
        font-size: 18px;
        font-weight: 700;
      }

      .store-info {
        font-size: 14px;
        color: #9ca3af;
      }

      .header-center {
        flex: 1;
        display: flex;
        justify-content: center;
      }

      .table-btn {
        background: #3b82f6;
        color: white;
        border: none;
        padding: 8px 16px;
        border-radius: 6px;
        font-size: 14px;
        font-weight: 600;
        cursor: pointer;
        transition: background 0.2s;
      }

      .table-btn:hover {
        background: #2563eb;
      }

      .header-right {
        flex: 1;
        display: flex;
        align-items: center;
        justify-content: flex-end;
        gap: 15px;
      }

      .sync-status {
        display: flex;
        align-items: center;
        gap: 8px;
        font-size: 12px;
      }

      .sync-indicator {
        width: 8px;
        height: 8px;
        border-radius: 50%;
        background: #10b981;
        animation: pulse 2s infinite;
      }

      @keyframes pulse {
        0%, 100% { opacity: 1; }
        50% { opacity: 0.5; }
      }

      .stats-btn {
        background: #059669;
        color: white;
        border: none;
        padding: 8px 12px;
        border-radius: 6px;
        font-size: 12px;
        cursor: pointer;
      }

      /* 메인 작업 영역 - 3분할 */
      .pos-workspace {
        flex: 1;
        display: grid;
        grid-template-columns: 2fr 1fr 1fr;
        gap: 1px;
        background: #e5e7eb;
        min-height: 0;
      }

      /* 좌측: 메뉴 섹션 */
      .menu-section {
        background: white;
        display: flex;
        flex-direction: column;
      }

      .category-tabs {
        display: flex;
        background: #f9fafb;
        border-bottom: 1px solid #e5e7eb;
        padding: 8px;
        gap: 4px;
      }

      .category-tab {
        padding: 12px 20px;
        border: none;
        border-radius: 6px;
        font-size: 14px;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.2s;
        white-space: nowrap;
      }

      .category-tab.active {
        background: #3b82f6;
        color: white;
      }

      .category-tab:not(.active) {
        background: white;
        color: #374151;
        border: 1px solid #d1d5db;
      }

      .category-tab:not(.active):hover {
        background: #f3f4f6;
      }

      .menu-grid {
        flex: 1;
        padding: 12px;
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
        gap: 8px;
        overflow-y: auto;
      }

      .menu-item {
        aspect-ratio: 1;
        border: 2px solid #e5e7eb;
        border-radius: 8px;
        background: white;
        cursor: pointer;
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
        text-align: center;
        padding: 12px;
        transition: all 0.2s;
        min-height: 120px;
      }

      .menu-item:hover {
        border-color: #3b82f6;
        transform: translateY(-2px);
        box-shadow: 0 4px 8px rgba(0,0,0,0.1);
      }

      .menu-item-name {
        font-size: 14px;
        font-weight: 600;
        color: #1f2937;
        margin-bottom: 4px;
      }

      .menu-item-price {
        font-size: 13px;
        color: #059669;
        font-weight: 700;
      }

      /* 중앙: 주문 패널 */
      .order-panel {
        background: white;
        display: flex;
        flex-direction: column;
        border-left: 1px solid #e5e7eb;
        border-right: 1px solid #e5e7eb;
      }

      .order-header {
        padding: 16px;
        border-bottom: 1px solid #e5e7eb;
        display: flex;
        justify-content: space-between;
        align-items: center;
        background: #f9fafb;
      }

      .order-header h3 {
        font-size: 16px;
        color: #1f2937;
      }

      .order-controls {
        display: flex;
        gap: 8px;
      }

      .control-btn {
        padding: 6px 12px;
        border: 1px solid #d1d5db;
        border-radius: 4px;
        background: white;
        font-size: 12px;
        cursor: pointer;
        transition: all 0.2s;
      }

      .control-btn:disabled {
        opacity: 0.5;
        cursor: not-allowed;
      }

      .hold-btn:not(:disabled):hover {
        background: #fef3c7;
        border-color: #f59e0b;
      }

      .clear-btn:not(:disabled):hover {
        background: #fecaca;
        border-color: #ef4444;
      }

      .order-items {
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
        color: #6b7280;
      }

      .empty-icon {
        font-size: 48px;
        margin-bottom: 12px;
        opacity: 0.5;
      }

      .order-item {
        display: flex;
        align-items: center;
        padding: 12px;
        border: 1px solid #e5e7eb;
        border-radius: 6px;
        margin-bottom: 8px;
        background: white;
      }

      .order-item-info {
        flex: 1;
      }

      .order-item-name {
        font-size: 14px;
        font-weight: 600;
        color: #1f2937;
        margin-bottom: 2px;
      }

      .order-item-price {
        font-size: 12px;
        color: #6b7280;
      }

      .quantity-controls {
        display: flex;
        align-items: center;
        gap: 8px;
      }

      .qty-btn {
        width: 32px;
        height: 32px;
        border: 1px solid #d1d5db;
        border-radius: 4px;
        background: white;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        font-weight: 600;
      }

      .qty-btn:hover {
        background: #f3f4f6;
      }

      .qty-display {
        min-width: 32px;
        text-align: center;
        font-weight: 600;
        font-size: 14px;
      }

      .order-summary {
        padding: 16px;
        border-top: 2px solid #e5e7eb;
        background: #f9fafb;
      }

      .total-amount {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 8px;
      }

      .total-amount .label {
        font-size: 16px;
        font-weight: 600;
        color: #374151;
      }

      .total-amount .amount {
        font-size: 20px;
        font-weight: 700;
        color: #059669;
      }

      .item-count {
        text-align: center;
        font-size: 12px;
        color: #6b7280;
      }

      /* 우측: 결제 섹션 */
      .payment-section {
        background: white;
        display: flex;
        flex-direction: column;
      }

      .table-status {
        flex: 1;
        padding: 16px;
        border-bottom: 1px solid #e5e7eb;
      }

      .status-header {
        margin-bottom: 12px;
      }

      .status-header h4 {
        font-size: 14px;
        color: #374151;
        font-weight: 600;
      }

      .table-grid {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 8px;
      }

      .table-card {
        aspect-ratio: 1;
        border: 2px solid #e5e7eb;
        border-radius: 6px;
        background: white;
        cursor: pointer;
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
        font-size: 12px;
        font-weight: 600;
        transition: all 0.2s;
      }

      .table-card.available {
        border-color: #10b981;
        color: #059669;
        background: #f0fdf4;
      }

      .table-card.occupied {
        border-color: #f59e0b;
        color: #d97706;
        background: #fffbeb;
      }

      .table-card.selected {
        border-color: #3b82f6;
        color: #2563eb;
        background: #eff6ff;
      }

      .payment-buttons {
        padding: 16px;
        display: flex;
        flex-direction: column;
        gap: 12px;
        border-bottom: 1px solid #e5e7eb;
      }

      .payment-btn {
        height: 56px;
        border: none;
        border-radius: 8px;
        font-size: 16px;
        font-weight: 700;
        cursor: pointer;
        transition: all 0.2s;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 8px;
      }

      .payment-btn:disabled {
        opacity: 0.5;
        cursor: not-allowed;
      }

      .card-btn {
        background: #3b82f6;
        color: white;
      }

      .card-btn:not(:disabled):hover {
        background: #2563eb;
      }

      .cash-btn {
        background: #059669;
        color: white;
      }

      .cash-btn:not(:disabled):hover {
        background: #047857;
      }

      .mobile-btn {
        background: #7c3aed;
        color: white;
      }

      .mobile-btn:not(:disabled):hover {
        background: #6d28d9;
      }

      .quick-actions {
        padding: 16px;
        display: flex;
        flex-direction: column;
        gap: 8px;
      }

      .action-btn {
        padding: 12px;
        border: 1px solid #d1d5db;
        border-radius: 6px;
        background: white;
        font-size: 12px;
        cursor: pointer;
        transition: all 0.2s;
      }

      .action-btn:hover {
        background: #f3f4f6;
        border-color: #9ca3af;
      }

      /* 하단 상태바 */
      .pos-footer {
        height: 40px;
        background: #374151;
        color: white;
        display: flex;
        align-items: center;
      }

      .status-bar {
        width: 100%;
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 0 20px;
        font-size: 12px;
      }

      .server-status {
        display: flex;
        align-items: center;
        gap: 8px;
      }

      .status-dot {
        width: 8px;
        height: 8px;
        border-radius: 50%;
        background: #10b981;
      }

      .today-summary {
        color: #9ca3af;
      }

      /* 반응형 */
      @media (max-width: 1200px) {
        .pos-workspace {
          grid-template-columns: 1.5fr 1fr 1fr;
        }
        
        .menu-grid {
          grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
        }
      }

      @media (max-width: 900px) {
        .header-center {
          display: none;
        }
        
        .pos-workspace {
          grid-template-columns: 1fr;
          grid-template-rows: 2fr 1fr 1fr;
        }
      }
    </style>
  `;
}

// 홈 모드 전환 (단순화)
function switchHomeMode(mode) {
  // 더 이상 필요 없음 - 단일 POS 인터페이스로 통합
}

// 주문 리스트 렌더링 (제거)
function renderOrderList() {
  // 새로운 구조에서는 항상 주문 패널이 표시됨
}

module.exports = { renderPOSLayout };
