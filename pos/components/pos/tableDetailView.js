
// POS 테이블 상세 화면 모듈
import { POSStateManager } from './modules/posStateManager.js';
import { POSOrderManager } from './modules/posOrderManager.js';
import { POSMenuManager } from './modules/posMenuManager.js';
import { showPOSNotification } from '../../utils/posNotification.js';

export class POSTableDetailView {
  static currentTableNumber = null;
  static draftOrders = []; // 클라이언트 전용 임시주문
  static confirmedOrders = []; // DB에 저장된 확정 주문

  // 🏠 테이블 상세 화면 초기화
  static async initializeTableDetail(tableNumber) {
    this.currentTableNumber = tableNumber;
    this.draftOrders = [];
    
    console.log(`🪑 테이블 ${tableNumber} 상세 화면 초기화`);

    // 기존 확정 주문 로드
    await this.loadConfirmedOrders();
    
    // UI 렌더링
    this.renderTableDetailUI();
    this.renderMenuGrid();
    this.updateOrderDisplay();
    
    console.log(`✅ 테이블 ${tableNumber} 상세 화면 초기화 완료`);
  }

  // 🍽️ 메뉴 그리드 렌더링
  static renderMenuGrid() {
    const menuGrid = document.getElementById('menuGrid');
    if (!menuGrid) return;

    const allMenus = POSStateManager.getAllMenus() || [];
    
    const menusHTML = allMenus.map(menu => `
      <button class="menu-card" onclick="POSTableDetailView.addMenuToDraft('${menu.name}', ${menu.price})">
        <div class="menu-name">${menu.name}</div>
        <div class="menu-price">₩${menu.price.toLocaleString()}</div>
      </button>
    `).join('');

    menuGrid.innerHTML = menusHTML;
  }

  // 🛒 임시주문에 메뉴 추가 (DB 저장 없음)
  static addMenuToDraft(menuName, price) {
    console.log(`🛒 임시주문에 추가: ${menuName} (₩${price})`);

    const existingItem = this.draftOrders.find(item => item.name === menuName);
    
    if (existingItem) {
      existingItem.quantity += 1;
    } else {
      this.draftOrders.push({
        id: `draft_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        name: menuName,
        price: price,
        quantity: 1,
        notes: '',
        addedAt: new Date().toISOString()
      });
    }

    this.updateOrderDisplay();
    showPOSNotification(`${menuName} 추가됨`, 'success');
  }

  // 📋 확정된 주문 로드
  static async loadConfirmedOrders() {
    try {
      const currentStore = POSStateManager.getCurrentStore();
      if (!currentStore) {
        console.warn('⚠️ 현재 매장 정보 없음');
        return;
      }

      const response = await fetch(`/api/pos/stores/${currentStore.id}/table/${this.currentTableNumber}/all-orders`);
      
      if (!response.ok) {
        console.warn(`⚠️ 확정 주문 로드 실패: ${response.status}`);
        this.confirmedOrders = [];
        return;
      }

      const data = await response.json();
      this.confirmedOrders = data.currentSession?.items || [];
      
      console.log(`✅ 확정 주문 ${this.confirmedOrders.length}개 로드 완료`);

    } catch (error) {
      console.error('❌ 확정 주문 로드 실패:', error);
      this.confirmedOrders = [];
    }
  }

  // 🎨 주문 표시 업데이트
  static updateOrderDisplay() {
    this.renderOrderList();
    this.updateTotalAmount();
    this.updateActionButtons();
  }

  // 📋 주문내역 렌더링 (임시주문 + 확정주문)
  static renderOrderList() {
    const orderListContainer = document.getElementById('orderListContainer');
    if (!orderListContainer) return;

    const allItems = [
      ...this.draftOrders.map(item => ({ ...item, isConfirmed: false })),
      ...this.confirmedOrders.map(item => ({ ...item, isConfirmed: true }))
    ];

    if (allItems.length === 0) {
      orderListContainer.innerHTML = `
        <div class="empty-order-list">
          <div class="empty-icon">📝</div>
          <p>선택된 메뉴가 없습니다</p>
        </div>
      `;
      return;
    }

    const html = allItems.map(item => {
      const itemName = item.name || item.menuName;
      const itemTotal = item.price * item.quantity;
      
      return `
        <div class="order-row ${item.isConfirmed ? 'confirmed' : 'pending'}">
          <div class="order-item-info">
            <span class="item-name">${itemName}</span>
            <div class="item-meta">
              <span class="item-price">₩${item.price.toLocaleString()}</span>
              <span class="item-qty">${item.quantity}</span>
              <span class="item-total">₩${itemTotal.toLocaleString()}</span>
            </div>
          </div>
          <div class="order-controls">
            ${item.isConfirmed ? `
              <button class="control-btn modify-btn" onclick="POSTableDetailView.modifyConfirmedItem('${item.id}', 'decrease')">-</button>
              <button class="control-btn modify-btn" onclick="POSTableDetailView.modifyConfirmedItem('${item.id}', 'increase')">+</button>
              <button class="control-btn cancel-btn" onclick="POSTableDetailView.cancelConfirmedItem('${item.id}')">취소</button>
            ` : `
              <button class="control-btn" onclick="POSTableDetailView.changeDraftQuantity('${item.id}', -1)">-</button>
              <button class="control-btn" onclick="POSTableDetailView.changeDraftQuantity('${item.id}', 1)">+</button>
              <button class="control-btn remove-btn" onclick="POSTableDetailView.removeDraftItem('${item.id}')">삭제</button>
            `}
          </div>
        </div>
      `;
    }).join('');

    orderListContainer.innerHTML = html;
  }

  // 📊 총 금액 업데이트
  static updateTotalAmount() {
    const draftTotal = this.draftOrders.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const confirmedTotal = this.confirmedOrders.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const grandTotal = draftTotal + confirmedTotal;

    const totalElement = document.getElementById('totalAmount');
    if (totalElement) {
      totalElement.textContent = `₩${grandTotal.toLocaleString()}`;
    }
  }

  // 🎯 액션 버튼 상태 업데이트
  static updateActionButtons() {
    const orderBtn = document.getElementById('confirmOrderBtn');
    const clearBtn = document.getElementById('clearDraftBtn');
    const checkoutBtn = document.getElementById('checkoutBtn');

    if (orderBtn) {
      if (this.draftOrders.length > 0) {
        orderBtn.disabled = false;
        orderBtn.textContent = `주문 (${this.draftOrders.length})`;
        orderBtn.className = 'action-btn primary-btn';
      } else {
        orderBtn.disabled = true;
        orderBtn.textContent = '주문';
        orderBtn.className = 'action-btn disabled';
      }
    }

    if (clearBtn) {
      clearBtn.disabled = this.draftOrders.length === 0;
    }

    if (checkoutBtn) {
      const hasConfirmedOrders = this.confirmedOrders.length > 0;
      checkoutBtn.disabled = !hasConfirmedOrders;
      if (hasConfirmedOrders) {
        checkoutBtn.className = 'action-btn checkout-btn';
      } else {
        checkoutBtn.className = 'action-btn disabled';
      }
    }
  }

  // 🔢 임시주문 수량 변경
  static changeDraftQuantity(itemId, change) {
    const item = this.draftOrders.find(item => item.id === itemId);
    if (!item) return;

    item.quantity += change;

    if (item.quantity <= 0) {
      this.removeDraftItem(itemId);
    } else {
      this.updateOrderDisplay();
      showPOSNotification(`${item.name} 수량: ${item.quantity}개`, 'info');
    }
  }

  // 🗑️ 임시주문 아이템 제거
  static removeDraftItem(itemId) {
    const index = this.draftOrders.findIndex(item => item.id === itemId);
    if (index > -1) {
      const removedItem = this.draftOrders.splice(index, 1)[0];
      this.updateOrderDisplay();
      showPOSNotification(`${removedItem.name} 제거됨`, 'info');
    }
  }

  // 🗑️ 임시주문 전체 비우기
  static clearDraftOrders() {
    if (this.draftOrders.length === 0) {
      showPOSNotification('임시주문이 이미 비어있습니다', 'warning');
      return;
    }

    const itemCount = this.draftOrders.length;
    this.draftOrders = [];
    this.updateOrderDisplay();
    showPOSNotification(`${itemCount}개 아이템 삭제됨`, 'info');
  }

  // 🏆 주문 확정 (임시주문 → DB 저장)
  static async confirmOrders() {
    if (this.draftOrders.length === 0) {
      showPOSNotification('주문할 메뉴가 없습니다', 'warning');
      return;
    }

    try {
      const currentStore = POSStateManager.getCurrentStore();
      const totalAmount = this.draftOrders.reduce((sum, item) => sum + (item.price * item.quantity), 0);

      const orderData = {
        storeId: currentStore.id,
        tableNumber: this.currentTableNumber,
        items: this.draftOrders,
        totalAmount: totalAmount,
        orderType: 'POS'
      };

      console.log('📦 주문 확정 요청:', orderData);

      const response = await fetch('/api/pos/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderData)
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || '주문 확정 실패');
      }

      // 성공 시 임시주문 비우기 및 확정 주문 다시 로드
      this.draftOrders = [];
      await this.loadConfirmedOrders();
      this.updateOrderDisplay();

      showPOSNotification('주문이 주방에 전달되었습니다!', 'success');
      
      // 3초 후 테이블맵으로 자동 복귀
      setTimeout(() => {
        this.returnToTableMap();
      }, 3000);

    } catch (error) {
      console.error('❌ 주문 확정 실패:', error);
      showPOSNotification('주문 확정 실패: ' + error.message, 'error');
    }
  }

  // ✏️ 확정된 주문 수정
  static async modifyConfirmedItem(itemId, action) {
    try {
      const item = this.confirmedOrders.find(item => item.id == itemId);
      if (!item) {
        showPOSNotification('주문 아이템을 찾을 수 없습니다', 'error');
        return;
      }

      let newQuantity = item.quantity;
      if (action === 'increase') {
        newQuantity += 1;
      } else if (action === 'decrease') {
        newQuantity -= 1;
      }

      if (newQuantity <= 0) {
        // 수량이 0 이하가 되면 취소로 처리
        await this.cancelConfirmedItem(itemId);
        return;
      }

      console.log(`✏️ 확정 주문 수량 수정: ${item.menuName} (${item.quantity} → ${newQuantity})`);

      const response = await fetch(`/api/pos/orders/${itemId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'updateQuantity',
          quantity: newQuantity
        })
      });

      if (!response.ok) {
        throw new Error('수량 수정 실패');
      }

      const result = await response.json();
      if (!result.success) {
        throw new Error(result.error || '수량 수정 실패');
      }

      // UI 업데이트
      item.quantity = newQuantity;
      this.updateOrderDisplay();
      showPOSNotification(`${item.menuName} 수량이 ${newQuantity}개로 변경되었습니다`, 'success');

    } catch (error) {
      console.error('❌ 확정 주문 수정 실패:', error);
      showPOSNotification('주문 수정 실패: ' + error.message, 'error');
    }
  }

  // 🗑️ 확정된 주문 취소
  static async cancelConfirmedItem(itemId) {
    try {
      const item = this.confirmedOrders.find(item => item.id == itemId);
      if (!item) {
        showPOSNotification('주문 아이템을 찾을 수 없습니다', 'error');
        return;
      }

      if (!confirm(`${item.menuName}을(를) 취소하시겠습니까?`)) {
        return;
      }

      console.log(`🗑️ 확정 주문 취소: ${item.menuName}`);

      const response = await fetch(`/api/pos/orders/${itemId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'cancel'
        })
      });

      if (!response.ok) {
        throw new Error('주문 취소 실패');
      }

      const result = await response.json();
      if (!result.success) {
        throw new Error(result.error || '주문 취소 실패');
      }

      // UI에서 제거
      const index = this.confirmedOrders.findIndex(item => item.id == itemId);
      if (index > -1) {
        this.confirmedOrders.splice(index, 1);
      }

      this.updateOrderDisplay();
      showPOSNotification(`${item.menuName} 주문이 취소되었습니다`, 'success');

    } catch (error) {
      console.error('❌ 확정 주문 취소 실패:', error);
      showPOSNotification('주문 취소 실패: ' + error.message, 'error');
    }
  }

  // 📝 신규 메뉴 추가 (확정된 주문에)
  static async addNewMenuToConfirmed() {
    if (this.draftOrders.length === 0) {
      showPOSNotification('추가할 메뉴를 먼저 선택해주세요', 'warning');
      return;
    }

    try {
      const currentStore = POSStateManager.getCurrentStore();
      
      // 현재 활성 체크 ID 찾기
      const checkId = this.confirmedOrders.length > 0 ? this.confirmedOrders[0].checkId : null;
      if (!checkId) {
        showPOSNotification('활성 체크가 없습니다. 먼저 주문을 확정해주세요', 'warning');
        return;
      }

      const response = await fetch(`/api/pos/orders/${checkId}/items`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: this.draftOrders
        })
      });

      if (!response.ok) {
        throw new Error('신규 메뉴 추가 실패');
      }

      const result = await response.json();
      if (!result.success) {
        throw new Error(result.error || '신규 메뉴 추가 실패');
      }

      // 성공 시 임시주문 비우기 및 확정 주문 다시 로드
      this.draftOrders = [];
      await this.loadConfirmedOrders();
      this.updateOrderDisplay();

      showPOSNotification('신규 메뉴가 추가되었습니다!', 'success');

    } catch (error) {
      console.error('❌ 신규 메뉴 추가 실패:', error);
      showPOSNotification('신규 메뉴 추가 실패: ' + error.message, 'error');
    }
  }

  // 🔙 테이블맵으로 돌아가기
  static returnToTableMap() {
    // 임시주문에 아이템이 있으면 확인
    if (this.draftOrders.length > 0) {
      if (!confirm(`임시주문에 ${this.draftOrders.length}개 메뉴가 있습니다. 정말 나가시겠습니까?`)) {
        return;
      }
    }

    // 상태 초기화
    this.draftOrders = [];
    this.confirmedOrders = [];
    this.currentTableNumber = null;

    // UI 전환
    document.getElementById('tableDetailView').classList.add('hidden');
    document.getElementById('tableMapView').classList.remove('hidden');

    console.log('🔙 테이블맵으로 복귀');
  }

  // 🔍 메뉴 검색
  static searchMenu(query) {
    const menuGrid = document.getElementById('menuGrid');
    if (!menuGrid) return;

    const allMenus = POSStateManager.getAllMenus() || [];
    
    let filteredMenus = allMenus;
    if (query && query.trim()) {
      const searchTerm = query.trim().toLowerCase();
      filteredMenus = allMenus.filter(menu => 
        menu.name.toLowerCase().includes(searchTerm)
      );
    }

    const menusHTML = filteredMenus.map(menu => `
      <button class="menu-card" onclick="POSTableDetailView.addMenuToDraft('${menu.name}', ${menu.price})">
        <div class="menu-name">${menu.name}</div>
        <div class="menu-price">₩${menu.price.toLocaleString()}</div>
      </button>
    `).join('');

    menuGrid.innerHTML = menusHTML;
  }

  // 📈 상태 텍스트 변환
  static getStatusText(status) {
    const statusMap = {
      'ORDERED': '주문접수',
      'PREPARING': '조리중',
      'READY': '완료',
      'SERVED': '서빙완료',
      'CANCELED': '취소됨'
    };
    return statusMap[status] || status;
  }

  // 🎨 테이블 상세 UI 렌더링
  static renderTableDetailUI() {
    const tableDetailView = document.getElementById('tableDetailView');
    if (!tableDetailView) return;

    tableDetailView.innerHTML = `
      <div class="pos-interface">
        <!-- 좌측: 메뉴 선택 영역 -->
        <div class="menu-section">
          <div class="menu-header">
            <h3>메뉴</h3>
            <input type="text" id="menuSearch" placeholder="메뉴 검색..." onkeyup="POSTableDetailView.searchMenu(this.value)">
          </div>
          <div class="menu-grid" id="menuGrid">
            <!-- 메뉴 카드들이 여기에 렌더링됩니다 -->
          </div>
        </div>

        <!-- 우측: 주문 관리 영역 -->
        <div class="order-section">
          <!-- 테이블 정보 -->
          <div class="table-header">
            <button class="back-btn" onclick="POSTableDetailView.returnToTableMap()">← 테이블맵</button>
            <h2>테이블 ${this.currentTableNumber}</h2>
            <div class="table-status-badge">사용중</div>
          </div>

          <!-- 주문내역 -->
          <div class="order-panel">
            <div class="order-panel-header">
              <h4>주문내역</h4>
            </div>
            <div class="order-list-container" id="orderListContainer">
              <!-- 주문 아이템들이 여기에 렌더링됩니다 -->
            </div>
          </div>

          <!-- 합계 -->
          <div class="total-section">
            <div class="total-row">
              <span class="total-label">합계</span>
              <span class="total-amount" id="totalAmount">₩0</span>
            </div>
          </div>

          <!-- 액션 버튼들 -->
          <div class="action-section">
            <div class="action-row">
              <button id="clearDraftBtn" class="action-btn clear-btn" onclick="POSTableDetailView.clearDraftOrders()">
                정정
              </button>
              <button id="confirmOrderBtn" class="action-btn primary-btn" onclick="POSTableDetailView.confirmOrders()">
                주문
              </button>
            </div>
            <div class="action-row">
              <button id="checkoutBtn" class="action-btn checkout-btn" onclick="POSTableDetailView.processCheckout()">
                계산
              </button>
            </div>
          </div>
        </div>
      </div>

      ${this.getTableDetailStyles()}
    `;
  }

  // 💳 계산 처리
  static async processCheckout() {
    if (this.confirmedOrders.length === 0) {
      showPOSNotification('결제할 주문이 없습니다', 'warning');
      return;
    }

    try {
      const currentStore = POSStateManager.getCurrentStore();
      
      const response = await fetch(`/api/pos/stores/${currentStore.id}/table/${this.currentTableNumber}/payment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          paymentMethod: 'CASH' // 기본 현금 결제
        })
      });

      if (!response.ok) {
        throw new Error('결제 처리 실패');
      }

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || '결제 처리 실패');
      }

      showPOSNotification('결제가 완료되었습니다!', 'success');
      
      // 2초 후 테이블맵으로 복귀
      setTimeout(() => {
        this.returnToTableMap();
      }, 2000);

    } catch (error) {
      console.error('❌ 결제 처리 실패:', error);
      showPOSNotification('결제 처리 실패: ' + error.message, 'error');
    }
  }

  // 🎨 스타일 정의
  static getTableDetailStyles() {
    return `
      <style>
        .pos-interface {
          height: 100vh;
          display: grid;
          grid-template-columns: 1fr 400px;
          background: #f5f5f5;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
        }

        /* 좌측 메뉴 영역 */
        .menu-section {
          background: white;
          display: flex;
          flex-direction: column;
          border-right: 1px solid #ddd;
        }

        .menu-header {
          padding: 16px;
          border-bottom: 1px solid #eee;
          display: flex;
          align-items: center;
          justify-content: space-between;
          background: #f8f9fa;
        }

        .menu-header h3 {
          margin: 0;
          font-size: 16px;
          color: #333;
        }

        #menuSearch {
          padding: 6px 10px;
          border: 1px solid #ddd;
          border-radius: 4px;
          font-size: 14px;
          width: 200px;
        }

        .menu-grid {
          flex: 1;
          padding: 20px;
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
          gap: 15px;
          overflow-y: auto;
        }

        .menu-card {
          background: white;
          border: 1px solid #ddd;
          border-radius: 8px;
          padding: 12px;
          cursor: pointer;
          transition: all 0.2s;
          text-align: center;
          display: flex;
          flex-direction: column;
          justify-content: center;
          min-height: 80px;
        }

        .menu-card:hover {
          border-color: #007bff;
          box-shadow: 0 2px 8px rgba(0,123,255,0.2);
          transform: translateY(-1px);
        }

        .menu-name {
          font-size: 14px;
          font-weight: 600;
          color: #333;
          margin-bottom: 6px;
        }

        .menu-price {
          font-size: 13px;
          color: #666;
          font-weight: 500;
        }

        /* 우측 주문 영역 */
        .order-section {
          background: #f8f9fa;
          display: flex;
          flex-direction: column;
        }

        .table-header {
          background: white;
          padding: 12px 16px;
          border-bottom: 1px solid #ddd;
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .back-btn {
          background: #6c757d;
          color: white;
          border: none;
          padding: 6px 12px;
          border-radius: 4px;
          cursor: pointer;
          font-size: 13px;
        }

        .table-header h2 {
          flex: 1;
          margin: 0;
          font-size: 18px;
          color: #333;
        }

        .table-status-badge {
          background: #ffc107;
          color: #333;
          padding: 4px 8px;
          border-radius: 12px;
          font-size: 12px;
          font-weight: 600;
        }

        .order-panel {
          flex: 1;
          background: white;
          margin: 8px;
          border-radius: 8px;
          border: 1px solid #ddd;
          display: flex;
          flex-direction: column;
        }

        .order-panel-header {
          padding: 12px 16px;
          border-bottom: 1px solid #eee;
          background: #f8f9fa;
        }

        .order-panel-header h4 {
          margin: 0;
          font-size: 14px;
          color: #333;
        }

        .order-list-container {
          flex: 1;
          overflow-y: auto;
          padding: 8px;
        }

        .empty-order-list {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          height: 200px;
          color: #999;
        }

        .empty-icon {
          font-size: 32px;
          margin-bottom: 8px;
        }

        .order-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 8px 12px;
          border: 1px solid #e9ecef;
          border-radius: 6px;
          margin-bottom: 6px;
          background: white;
        }

        .order-row.pending {
          border-left: 3px solid #ffc107;
          background: #fff8e1;
        }

        .order-row.confirmed {
          border-left: 3px solid #28a745;
          background: #f0fff4;
        }

        .order-item-info {
          flex: 1;
        }

        .item-name {
          font-size: 14px;
          font-weight: 600;
          color: #333;
          display: block;
          margin-bottom: 4px;
        }

        .item-meta {
          display: flex;
          gap: 8px;
          font-size: 12px;
          color: #666;
        }

        .item-price, .item-qty, .item-total {
          font-weight: 500;
        }

        .order-controls {
          display: flex;
          gap: 4px;
          align-items: center;
        }

        .control-btn {
          width: 28px;
          height: 28px;
          border: 1px solid #ddd;
          background: white;
          border-radius: 4px;
          cursor: pointer;
          font-size: 12px;
          font-weight: 600;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s;
        }

        .control-btn:hover {
          background: #f8f9fa;
          border-color: #adb5bd;
        }

        .remove-btn, .cancel-btn {
          background: #dc3545;
          color: white;
          border-color: #dc3545;
        }

        .remove-btn:hover, .cancel-btn:hover {
          background: #c82333;
        }

        .modify-btn {
          background: #007bff;
          color: white;
          border-color: #007bff;
        }

        .modify-btn:hover {
          background: #0056b3;
        }

        /* 합계 영역 */
        .total-section {
          background: white;
          margin: 8px;
          padding: 16px;
          border-radius: 8px;
          border: 1px solid #ddd;
        }

        .total-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .total-label {
          font-size: 16px;
          font-weight: 600;
          color: #333;
        }

        .total-amount {
          font-size: 18px;
          font-weight: 700;
          color: #28a745;
        }

        /* 액션 버튼 영역 */
        .action-section {
          padding: 16px;
          background: white;
          margin: 8px;
          border-radius: 8px;
          border: 1px solid #ddd;
        }

        .action-row {
          display: flex;
          gap: 8px;
          margin-bottom: 8px;
        }

        .action-row:last-child {
          margin-bottom: 0;
        }

        .action-btn {
          flex: 1;
          padding: 12px 16px;
          border: none;
          border-radius: 6px;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
        }

        .primary-btn {
          background: #007bff;
          color: white;
        }

        .primary-btn:hover:not(:disabled) {
          background: #0056b3;
          transform: translateY(-1px);
        }

        .clear-btn {
          background: #6c757d;
          color: white;
        }

        .clear-btn:hover:not(:disabled) {
          background: #545b62;
        }

        .checkout-btn {
          background: #28a745;
          color: white;
        }

        .checkout-btn:hover:not(:disabled) {
          background: #1e7e34;
          transform: translateY(-1px);
        }

        .action-btn.disabled, .action-btn:disabled {
          background: #e9ecef;
          color: #6c757d;
          cursor: not-allowed;
          transform: none;
        }

        /* 반응형 */
        @media (max-width: 1024px) {
          .pos-interface {
            grid-template-columns: 1fr;
            grid-template-rows: 1fr auto;
          }
          
          .order-section {
            max-height: 50vh;
          }
        }
      </style>
    `;
  }
}

// 전역 함수 등록
window.POSTableDetailView = POSTableDetailView;

console.log('✅ POS 테이블 상세 화면 모듈 로드 완료');
