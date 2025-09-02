
// POS 레이아웃 정의 - 정리된 버전
function renderPOSLayout() {
  const main = document.getElementById('main');
  if (!main) {
    console.error('❌ main 컨테이너 없음');
    return;
  }

  main.innerHTML = `
    <div id="posContainer" class="pos-container">
      <!-- 상단 헤더 -->
      <header class="pos-header">
        <div class="header-left">
          <h1 id="storeName">TableLink POS</h1>
        </div>
        <div class="header-right">
          <div class="header-time" id="currentTime"></div>
        </div>
      </header>

      <!-- 테이블 맵 화면 -->
      <div id="tableMapView" class="table-map-view">
        <div class="section-header">
          <h2>🪑 테이블 맵</h2>
        </div>
        <div id="tableMapContainer" class="table-map-container">
          <div class="loading">테이블 정보를 불러오는 중...</div>
        </div>
      </div>

      <!-- 주문 화면 -->
      <div id="orderView" class="order-view hidden">
        <div class="order-header">
          <button onclick="returnToTableMap()" class="back-btn">← 테이블맵</button>
          <h2 id="orderTableTitle">주문/결제</h2>
        </div>

        <div class="order-content">
          <!-- 메뉴 섹션 -->
          <div class="menu-section">
            <div class="menu-categories" id="menuCategories">
              <div class="loading">메뉴를 불러오는 중...</div>
            </div>
            <div class="menu-search">
              <input type="text" id="menuSearch" placeholder="메뉴 검색..." onkeyup="searchMenus(this.value)">
            </div>
            <div class="menu-grid" id="menuGrid">
              <div class="loading">메뉴를 불러오는 중...</div>
            </div>
          </div>

          <!-- 주문 섹션 -->
          <div class="order-section">
            <div class="order-panel">
              <div class="order-header-section">
                <h3>📋 주문 내역</h3>
              </div>

              <div class="order-items" id="orderItems">
                <div class="empty-order">주문된 메뉴가 없습니다</div>
              </div>

              <div class="payment-summary" id="paymentSummary">
                <div class="loading">결제 정보 준비 중...</div>
              </div>

              <div class="action-buttons">
                <button id="primaryActionBtn" class="primary-action-btn" onclick="handlePrimaryAction()">
                  <div class="btn-content">
                    <span class="btn-title">주문 없음</span>
                    <span class="btn-subtitle">메뉴를 선택하세요</span>
                  </div>
                </button>
              </div>

              <div class="payment-buttons">
                <button onclick="processPayment('cash')" class="payment-btn cash">💵 현금</button>
                <button onclick="processPayment('card')" class="payment-btn card">💳 카드</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <style>
      .pos-container {
        width: 100%;
        height: 100vh;
        display: flex;
        flex-direction: column;
        background: #f8fafc;
        font-family: 'Apple SD Gothic Neo', -apple-system, BlinkMacSystemFont, sans-serif;
      }

      .pos-header {
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
        padding: 16px 24px;
        display: flex;
        justify-content: space-between;
        align-items: center;
        box-shadow: 0 2px 10px rgba(0,0,0,0.1);
      }

      .pos-header h1 {
        margin: 0;
        font-size: 24px;
        font-weight: 700;
      }

      .table-map-view {
        flex: 1;
        padding: 24px;
        overflow: auto;
      }

      .table-map-container {
        background: white;
        border-radius: 12px;
        padding: 24px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.1);
        min-height: 400px;
      }

      .order-view {
        flex: 1;
        display: flex;
        flex-direction: column;
      }

      .order-view.hidden {
        display: none;
      }

      .order-header {
        background: white;
        border-bottom: 1px solid #e5e7eb;
        padding: 16px 24px;
        display: flex;
        align-items: center;
        gap: 16px;
      }

      .back-btn {
        background: #f3f4f6;
        border: 1px solid #d1d5db;
        color: #374151;
        padding: 8px 16px;
        border-radius: 8px;
        cursor: pointer;
        font-weight: 500;
      }

      .back-btn:hover {
        background: #e5e7eb;
      }

      .order-content {
        flex: 1;
        display: grid;
        grid-template-columns: 2fr 1fr;
        gap: 24px;
        padding: 24px;
        overflow: hidden;
      }

      .menu-section {
        background: white;
        border-radius: 12px;
        padding: 24px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.1);
        display: flex;
        flex-direction: column;
        overflow: hidden;
      }

      .menu-categories {
        display: flex;
        gap: 8px;
        margin-bottom: 16px;
        flex-wrap: wrap;
      }

      .category-btn {
        padding: 8px 16px;
        border: 1px solid #d1d5db;
        background: white;
        border-radius: 20px;
        cursor: pointer;
        font-size: 14px;
        transition: all 0.2s;
      }

      .category-btn.active {
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
        border: 1px solid #d1d5db;
        border-radius: 8px;
        font-size: 16px;
      }

      .menu-grid {
        flex: 1;
        overflow-y: auto;
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
        gap: 16px;
      }

      .menu-item {
        background: white;
        border: 1px solid #e5e7eb;
        border-radius: 12px;
        padding: 16px;
        cursor: pointer;
        transition: all 0.2s;
        position: relative;
      }

      .menu-item:hover {
        border-color: #3b82f6;
        transform: translateY(-2px);
        box-shadow: 0 4px 12px rgba(59, 130, 246, 0.15);
      }

      .menu-item .name {
        font-weight: 600;
        margin-bottom: 8px;
        color: #1f2937;
      }

      .menu-item .price {
        color: #059669;
        font-weight: 700;
        font-size: 18px;
      }

      .add-btn {
        position: absolute;
        top: 12px;
        right: 12px;
        width: 32px;
        height: 32px;
        border-radius: 50%;
        border: none;
        background: #3b82f6;
        color: white;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 18px;
        font-weight: bold;
      }

      .order-section {
        background: white;
        border-radius: 12px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.1);
        overflow: hidden;
        display: flex;
        flex-direction: column;
      }

      .order-panel {
        flex: 1;
        display: flex;
        flex-direction: column;
        padding: 24px;
      }

      .order-header-section {
        margin-bottom: 20px;
      }

      .order-header-section h3 {
        margin: 0;
        font-size: 18px;
        color: #1f2937;
      }

      .order-items {
        flex: 1;
        overflow-y: auto;
        margin-bottom: 20px;
        min-height: 200px;
      }

      .empty-order {
        text-align: center;
        padding: 40px 20px;
        color: #6b7280;
      }

      .order-item {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 12px 16px;
        border: 1px solid #e5e7eb;
        border-radius: 8px;
        margin-bottom: 8px;
        cursor: pointer;
        transition: all 0.2s;
      }

      .order-item:hover {
        background: #f9fafb;
      }

      .order-item.selected {
        background: #eff6ff;
        border-color: #3b82f6;
      }

      .order-item.pending {
        border-left: 4px solid #f59e0b;
      }

      .order-item.confirmed {
        border-left: 4px solid #10b981;
      }

      .order-item.has-changes {
        background: linear-gradient(90deg, #f0f9ff 0%, #ffffff 100%);
        border-left: 4px solid #3b82f6;
      }

      .order-item.marked-deleted {
        background: linear-gradient(90deg, #fef2f2 0%, #ffffff 100%);
        border-left: 4px solid #ef4444;
        opacity: 0.7;
      }

      .item-info {
        flex: 1;
      }

      .item-name {
        font-weight: 600;
        color: #1f2937;
        margin-bottom: 4px;
      }

      .item-price {
        color: #6b7280;
        font-size: 14px;
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
      }

      .qty-btn {
        width: 24px;
        height: 24px;
        border: 1px solid #d1d5db;
        background: white;
        border-radius: 4px;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 14px;
        font-weight: bold;
      }

      .qty-btn:hover {
        border-color: #3b82f6;
        background: #f0f9ff;
      }

      .quantity {
        min-width: 24px;
        text-align: center;
        font-weight: 600;
      }

      .change-indicator {
        color: #3b82f6;
        font-size: 12px;
      }

      .delete-indicator {
        color: #ef4444;
        font-size: 12px;
      }

      .original-qty {
        text-decoration: line-through;
        color: #6b7280;
        font-size: 12px;
      }

      .new-qty {
        color: #3b82f6;
        font-weight: bold;
      }

      .deleted-text, .deleted-total {
        color: #ef4444;
        font-weight: bold;
        font-size: 12px;
      }

      .change-overlay {
        position: absolute;
        top: 4px;
        right: 4px;
        background: #3b82f6;
        color: white;
        font-size: 10px;
        padding: 2px 6px;
        border-radius: 10px;
      }

      .primary-action-btn {
        width: 100%;
        background: linear-gradient(135deg, #10b981, #059669);
        border: none;
        color: white;
        padding: 16px;
        border-radius: 8px;
        font-size: 16px;
        font-weight: 600;
        cursor: pointer;
        margin-bottom: 16px;
        transition: all 0.3s;
        box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
      }

      .primary-action-btn:hover:not(:disabled) {
        transform: translateY(-2px);
        box-shadow: 0 6px 16px rgba(16, 185, 129, 0.4);
      }

      .primary-action-btn:disabled {
        background: #9ca3af;
        cursor: not-allowed;
        box-shadow: none;
      }

      .btn-content {
        display: flex;
        flex-direction: column;
        align-items: center;
      }

      .btn-title {
        font-size: 16px;
        font-weight: 600;
      }

      .btn-subtitle {
        font-size: 12px;
        opacity: 0.9;
        margin-top: 2px;
      }

      .payment-buttons {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 12px;
      }

      .payment-btn {
        padding: 12px;
        border: 1px solid #d1d5db;
        border-radius: 8px;
        background: white;
        cursor: pointer;
        font-weight: 500;
        transition: all 0.2s;
      }

      .payment-btn:hover:not(:disabled) {
        transform: translateY(-1px);
        box-shadow: 0 2px 8px rgba(0,0,0,0.1);
      }

      .payment-btn:disabled {
        opacity: 0.5;
        cursor: not-allowed;
      }

      .payment-btn.cash {
        background: linear-gradient(135deg, #fbbf24, #f59e0b);
        color: white;
        border-color: #f59e0b;
      }

      .payment-btn.card {
        background: linear-gradient(135deg, #3b82f6, #1e40af);
        color: white;
        border-color: #1e40af;
      }

      .loading {
        text-align: center;
        padding: 40px;
        color: #6b7280;
      }

      .section-header {
        margin-bottom: 24px;
      }

      .section-header h2 {
        margin: 0;
        font-size: 24px;
        color: #1f2937;
      }

      .status-badge {
        padding: 4px 8px;
        border-radius: 12px;
        font-size: 12px;
        font-weight: 500;
      }

      .status-badge.pending {
        background: #fef3c7;
        color: #92400e;
      }

      .status-badge.confirmed {
        background: #d1fae5;
        color: #065f46;
      }

      /* 반응형 */
      @media (max-width: 1024px) {
        .order-content {
          grid-template-columns: 1fr;
          grid-template-rows: 1fr auto;
        }

        .menu-grid {
          grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
        }
      }

      @media (max-width: 768px) {
        .pos-container {
          font-size: 14px;
        }

        .order-content {
          padding: 16px;
          gap: 16px;
        }

        .menu-section, .order-panel {
          padding: 16px;
        }

        .menu-grid {
          grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
          gap: 12px;
        }
      }
    </style>
  `;

  // 시간 업데이트
  updateTime();
  setInterval(updateTime, 1000);

  console.log('✅ POS 레이아웃 렌더링 완료');
}

function updateTime() {
  const timeElement = document.getElementById('currentTime');
  if (timeElement) {
    timeElement.textContent = new Date().toLocaleTimeString('ko-KR');
  }
}

// 전역 함수 등록 - 레거시 호환성
if (typeof window !== 'undefined') {
  window.renderPOSLayout = renderPOSLayout;
  console.log('✅ renderPOSLayout 전역 함수 등록 완료');
}

// 테이블맵으로 돌아가기 함수
window.returnToTableMap = () => {
  console.log('🔄 테이블맵으로 돌아가기');
  const tableMapView = document.getElementById('tableMapView');
  const orderView = document.getElementById('orderView');
  
  if (tableMapView && orderView) {
    tableMapView.style.display = 'block';
    orderView.classList.add('hidden');
  }
  
  // 현재 테이블 정보 초기화
  window.currentTable = null;
  
  // URL에서 테이블 파라미터 제거
  const url = new URL(window.location);
  url.searchParams.delete('tableId');
  window.history.replaceState({}, '', url);
};

// 메뉴 검색 함수
window.searchMenus = (query) => {
  if (window.posMenuManager) {
    window.posMenuManager.searchMenus(query);
  }
};

// 기본 액션 핸들러
window.handlePrimaryAction = () => {
  if (window.posOrderManager) {
    window.posOrderManager.confirmOrders();
  }
};

// 결제 처리 함수
window.processPayment = (paymentType) => {
  if (window.posPaymentManager) {
    window.posPaymentManager.processPayment(paymentType);
  } else {
    console.log(`💳 ${paymentType} 결제 처리 요청`);
    alert(`${paymentType === 'cash' ? '현금' : '카드'} 결제가 요청되었습니다.`);
  }
};

// ES6 모듈 export (파일 끝에 한 번만 - 모든 중복 제거됨)
export { renderPOSLayout };
export default renderPOSLayout;
