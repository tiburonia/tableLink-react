
// POS 테이블 상세 화면 모듈
import { POSStateManager } from './modules/posStateManager.js';
import { POSOrderManager } from './modules/posOrderManager.js';
import { POSMenuManager } from './modules/posMenuManager.js';
import { showPOSNotification } from '../../utils/posNotification.js';

export class POSTableDetailView {
  static currentTableNumber = null;
  static draftOrders = []; // 클라이언트 전용 장바구니
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
        <div class="add-icon">+</div>
      </button>
    `).join('');

    menuGrid.innerHTML = menusHTML;
  }

  // 🛒 장바구니에 메뉴 추가 (DB 저장 없음)
  static addMenuToDraft(menuName, price) {
    console.log(`🛒 장바구니에 추가: ${menuName} (₩${price})`);

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
    showPOSNotification(`${menuName} 장바구니에 추가됨`, 'success');
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
    this.renderDraftOrders();
    this.renderConfirmedOrders();
    this.updateTotalAmount();
    this.updateActionButtons();
  }

  // 🛒 장바구니 (임시 주문) 렌더링
  static renderDraftOrders() {
    const draftContainer = document.getElementById('draftOrdersContainer');
    if (!draftContainer) return;

    if (this.draftOrders.length === 0) {
      draftContainer.innerHTML = '<div class="empty-state">장바구니가 비어있습니다</div>';
      return;
    }

    const html = this.draftOrders.map(item => `
      <div class="order-item draft-item">
        <div class="item-info">
          <span class="item-name">${item.name}</span>
          <span class="item-price">₩${(item.price * item.quantity).toLocaleString()}</span>
        </div>
        <div class="item-controls">
          <button class="qty-btn" onclick="POSTableDetailView.changeDraftQuantity('${item.id}', -1)">-</button>
          <span class="quantity">${item.quantity}</span>
          <button class="qty-btn" onclick="POSTableDetailView.changeDraftQuantity('${item.id}', 1)">+</button>
          <button class="delete-btn" onclick="POSTableDetailView.removeDraftItem('${item.id}')">×</button>
        </div>
      </div>
    `).join('');

    draftContainer.innerHTML = html;
  }

  // ✅ 확정된 주문 렌더링
  static renderConfirmedOrders() {
    const confirmedContainer = document.getElementById('confirmedOrdersContainer');
    if (!confirmedContainer) return;

    if (this.confirmedOrders.length === 0) {
      confirmedContainer.innerHTML = '<div class="empty-state">확정된 주문이 없습니다</div>';
      return;
    }

    const html = this.confirmedOrders.map(item => `
      <div class="order-item confirmed-item" data-item-id="${item.id}">
        <div class="item-info">
          <span class="item-name">${item.menuName}</span>
          <span class="item-price">₩${(item.price * item.quantity).toLocaleString()}</span>
          <span class="item-status status-${item.cookingStatus.toLowerCase()}">${this.getStatusText(item.cookingStatus)}</span>
        </div>
        <div class="item-controls">
          <button class="qty-btn" onclick="POSTableDetailView.modifyConfirmedItem('${item.id}', 'decrease')">-</button>
          <span class="quantity">${item.quantity}</span>
          <button class="qty-btn" onclick="POSTableDetailView.modifyConfirmedItem('${item.id}', 'increase')">+</button>
          <button class="cancel-btn" onclick="POSTableDetailView.cancelConfirmedItem('${item.id}')">취소</button>
        </div>
      </div>
    `).join('');

    confirmedContainer.innerHTML = html;
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

    const draftTotalElement = document.getElementById('draftTotal');
    if (draftTotalElement) {
      draftTotalElement.textContent = `₩${draftTotal.toLocaleString()}`;
    }
  }

  // 🎯 액션 버튼 상태 업데이트
  static updateActionButtons() {
    const orderBtn = document.getElementById('confirmOrderBtn');
    const clearBtn = document.getElementById('clearDraftBtn');

    if (orderBtn) {
      if (this.draftOrders.length > 0) {
        orderBtn.disabled = false;
        orderBtn.textContent = `주문 확정 (${this.draftOrders.length}개)`;
        orderBtn.className = 'action-btn primary';
      } else {
        orderBtn.disabled = true;
        orderBtn.textContent = '주문할 메뉴를 선택하세요';
        orderBtn.className = 'action-btn disabled';
      }
    }

    if (clearBtn) {
      clearBtn.disabled = this.draftOrders.length === 0;
    }
  }

  // 🔢 장바구니 수량 변경
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

  // 🗑️ 장바구니 아이템 제거
  static removeDraftItem(itemId) {
    const index = this.draftOrders.findIndex(item => item.id === itemId);
    if (index > -1) {
      const removedItem = this.draftOrders.splice(index, 1)[0];
      this.updateOrderDisplay();
      showPOSNotification(`${removedItem.name} 장바구니에서 제거됨`, 'info');
    }
  }

  // 🗑️ 장바구니 전체 비우기
  static clearDraftOrders() {
    if (this.draftOrders.length === 0) {
      showPOSNotification('장바구니가 이미 비어있습니다', 'warning');
      return;
    }

    const itemCount = this.draftOrders.length;
    this.draftOrders = [];
    this.updateOrderDisplay();
    showPOSNotification(`장바구니 ${itemCount}개 아이템 삭제됨`, 'info');
  }

  // 🏆 주문 확정 (장바구니 → DB 저장)
  static async confirmOrders() {
    if (this.draftOrders.length === 0) {
      showPOSNotification('장바구니가 비어있습니다', 'warning');
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

      // 성공 시 장바구니 비우기 및 확정 주문 다시 로드
      this.draftOrders = [];
      await this.loadConfirmedOrders();
      this.updateOrderDisplay();

      showPOSNotification('주문이 확정되어 주방에 전달되었습니다!', 'success');
      
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
      showPOSNotification('추가할 메뉴를 먼저 장바구니에 담아주세요', 'warning');
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

      // 성공 시 장바구니 비우기 및 확정 주문 다시 로드
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
    // 장바구니에 아이템이 있으면 확인
    if (this.draftOrders.length > 0) {
      if (!confirm(`장바구니에 ${this.draftOrders.length}개 메뉴가 있습니다. 정말 나가시겠습니까?`)) {
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

  // 🎨 테이블 상세 UI 렌더링
  static renderTableDetailUI() {
    const tableDetailView = document.getElementById('tableDetailView');
    if (!tableDetailView) return;

    tableDetailView.innerHTML = `
      <div class="table-detail-container">
        <!-- 헤더 -->
        <div class="detail-header">
          <button class="back-btn" onclick="POSTableDetailView.returnToTableMap()">← 테이블맵</button>
          <h2 class="table-title">테이블 ${this.currentTableNumber}</h2>
          <div class="table-status">사용중</div>
        </div>

        <div class="detail-content">
          <!-- 메뉴 선택 영역 -->
          <div class="menu-section">
            <div class="section-header">
              <h3>메뉴 선택</h3>
              <input type="text" id="menuSearch" placeholder="메뉴 검색..." onkeyup="POSTableDetailView.searchMenu(this.value)">
            </div>
            <div class="menu-grid" id="menuGrid">
              <!-- 메뉴 카드들이 여기에 렌더링됩니다 -->
            </div>
          </div>

          <!-- 주문 관리 영역 -->
          <div class="order-section">
            <!-- 장바구니 (임시 주문) -->
            <div class="order-panel">
              <div class="panel-header">
                <h3>🛒 장바구니</h3>
                <span id="draftTotal">₩0</span>
              </div>
              <div class="order-items-container" id="draftOrdersContainer">
                <!-- 장바구니 아이템들이 여기에 렌더링됩니다 -->
              </div>
            </div>

            <!-- 확정된 주문 -->
            <div class="order-panel">
              <div class="panel-header">
                <h3>✅ 확정 주문</h3>
                <button class="add-menu-btn" onclick="POSTableDetailView.addNewMenuToConfirmed()">메뉴 추가</button>
              </div>
              <div class="order-items-container" id="confirmedOrdersContainer">
                <!-- 확정된 주문들이 여기에 렌더링됩니다 -->
              </div>
            </div>

            <!-- 총액 및 액션 버튼 -->
            <div class="action-panel">
              <div class="total-section">
                <span class="total-label">총 금액</span>
                <span class="total-amount" id="totalAmount">₩0</span>
              </div>
              <div class="action-buttons">
                <button id="clearDraftBtn" class="action-btn secondary" onclick="POSTableDetailView.clearDraftOrders()">
                  장바구니 비우기
                </button>
                <button id="confirmOrderBtn" class="action-btn primary" onclick="POSTableDetailView.confirmOrders()">
                  주문 확정
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      ${this.getTableDetailStyles()}
    `;
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
        <div class="add-icon">+</div>
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

  // 🎨 스타일 정의
  static getTableDetailStyles() {
    return `
      <style>
        .table-detail-container {
          height: 100vh;
          display: flex;
          flex-direction: column;
          background: #f8fafc;
        }

        .detail-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 16px 24px;
          background: white;
          border-bottom: 1px solid #e2e8f0;
          box-shadow: 0 2px 4px rgba(0,0,0,0.05);
        }

        .back-btn {
          padding: 8px 16px;
          background: #64748b;
          color: white;
          border: none;
          border-radius: 6px;
          cursor: pointer;
          font-size: 14px;
          transition: background-color 0.2s;
        }

        .back-btn:hover {
          background: #475569;
        }

        .table-title {
          margin: 0;
          font-size: 20px;
          font-weight: 700;
          color: #1e293b;
        }

        .table-status {
          padding: 6px 12px;
          background: #fef3c7;
          color: #92400e;
          border-radius: 20px;
          font-size: 12px;
          font-weight: 700;
        }

        .detail-content {
          flex: 1;
          display: grid;
          grid-template-columns: 1fr 400px;
          gap: 24px;
          padding: 24px;
          overflow: hidden;
        }

        .menu-section {
          display: flex;
          flex-direction: column;
          background: white;
          border-radius: 12px;
          border: 1px solid #e2e8f0;
          overflow: hidden;
        }

        .section-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 20px;
          background: #f8fafc;
          border-bottom: 1px solid #e2e8f0;
        }

        .section-header h3 {
          margin: 0;
          font-size: 16px;
          font-weight: 600;
          color: #374151;
        }

        #menuSearch {
          padding: 8px 12px;
          border: 1px solid #d1d5db;
          border-radius: 6px;
          font-size: 14px;
          width: 200px;
        }

        .menu-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
          gap: 16px;
          padding: 20px;
          overflow-y: auto;
        }

        .menu-card {
          background: white;
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          padding: 16px;
          cursor: pointer;
          transition: all 0.2s;
          position: relative;
          text-align: center;
        }

        .menu-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0,0,0,0.1);
          border-color: #3b82f6;
        }

        .menu-name {
          font-size: 14px;
          font-weight: 600;
          color: #374151;
          margin-bottom: 8px;
        }

        .menu-price {
          font-size: 16px;
          font-weight: 700;
          color: #059669;
          margin-bottom: 12px;
        }

        .add-icon {
          position: absolute;
          top: 8px;
          right: 8px;
          width: 24px;
          height: 24px;
          background: #3b82f6;
          color: white;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 16px;
          font-weight: 700;
        }

        .order-section {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .order-panel {
          background: white;
          border-radius: 12px;
          border: 1px solid #e2e8f0;
          display: flex;
          flex-direction: column;
          max-height: 300px;
        }

        .panel-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 16px;
          background: #f8fafc;
          border-bottom: 1px solid #e2e8f0;
        }

        .panel-header h3 {
          margin: 0;
          font-size: 14px;
          font-weight: 600;
          color: #374151;
        }

        .add-menu-btn {
          padding: 6px 12px;
          background: #3b82f6;
          color: white;
          border: none;
          border-radius: 6px;
          cursor: pointer;
          font-size: 12px;
          font-weight: 600;
        }

        .order-items-container {
          flex: 1;
          overflow-y: auto;
          padding: 16px;
        }

        .order-item {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 12px;
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          margin-bottom: 8px;
        }

        .draft-item {
          background: #fef3c7;
          border-color: #f59e0b;
        }

        .confirmed-item {
          background: #ecfdf5;
          border-color: #10b981;
        }

        .item-info {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .item-name {
          font-size: 14px;
          font-weight: 600;
          color: #374151;
        }

        .item-price {
          font-size: 12px;
          color: #059669;
          font-weight: 600;
        }

        .item-status {
          font-size: 11px;
          padding: 2px 6px;
          border-radius: 10px;
          font-weight: 600;
          text-transform: uppercase;
        }

        .status-ordered {
          background: #fef3c7;
          color: #92400e;
        }

        .status-preparing {
          background: #ddd6fe;
          color: #7c3aed;
        }

        .status-ready {
          background: #dcfce7;
          color: #166534;
        }

        .item-controls {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .qty-btn, .delete-btn, .cancel-btn {
          width: 28px;
          height: 28px;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          font-size: 14px;
          font-weight: 700;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .qty-btn {
          background: #e2e8f0;
          color: #64748b;
        }

        .qty-btn:hover {
          background: #cbd5e1;
        }

        .delete-btn, .cancel-btn {
          background: #fecaca;
          color: #dc2626;
        }

        .delete-btn:hover, .cancel-btn:hover {
          background: #fca5a5;
        }

        .quantity {
          font-size: 14px;
          font-weight: 600;
          color: #374151;
          min-width: 20px;
          text-align: center;
        }

        .action-panel {
          background: white;
          border-radius: 12px;
          border: 1px solid #e2e8f0;
          padding: 20px;
        }

        .total-section {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 16px;
          padding-bottom: 16px;
          border-bottom: 1px solid #e2e8f0;
        }

        .total-label {
          font-size: 16px;
          font-weight: 600;
          color: #374151;
        }

        .total-amount {
          font-size: 20px;
          font-weight: 800;
          color: #059669;
        }

        .action-buttons {
          display: flex;
          gap: 12px;
        }

        .action-btn {
          flex: 1;
          padding: 12px 16px;
          border: none;
          border-radius: 8px;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
        }

        .action-btn.primary {
          background: #3b82f6;
          color: white;
        }

        .action-btn.primary:hover:not(:disabled) {
          background: #2563eb;
          transform: translateY(-1px);
        }

        .action-btn.secondary {
          background: #f1f5f9;
          color: #64748b;
          border: 1px solid #d1d5db;
        }

        .action-btn.secondary:hover:not(:disabled) {
          background: #e2e8f0;
        }

        .action-btn.disabled, .action-btn:disabled {
          background: #f1f5f9;
          color: #94a3b8;
          cursor: not-allowed;
        }

        .empty-state {
          text-align: center;
          color: #94a3b8;
          font-style: italic;
          padding: 40px 20px;
        }

        /* 반응형 */
        @media (max-width: 1024px) {
          .detail-content {
            grid-template-columns: 1fr;
            gap: 16px;
          }
          
          .menu-grid {
            grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
          }
        }
      </style>
    `;
  }
}

// 전역 함수 등록
window.POSTableDetailView = POSTableDetailView;

console.log('✅ POS 테이블 상세 화면 모듈 로드 완료');
