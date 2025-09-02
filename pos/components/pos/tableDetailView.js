
// POS 테이블 상세 화면 모듈 - 완전 재구성
import { POSStateManager } from './modules/posStateManager.js';
import { showPOSNotification } from '../../utils/posNotification.js';

export class POSTableDetailView {
  static currentTableNumber = null;
  static draftOrders = []; // 임시주문 (장바구니)
  static confirmedOrders = []; // 확정주문 (DB 저장됨)
  static tableInfo = null;

  // 🏠 테이블 상세 화면 초기화
  static async initializeTableDetail(tableNumber) {
    this.currentTableNumber = tableNumber;
    this.draftOrders = [];
    
    console.log(`🪑 테이블 ${tableNumber} 상세 화면 초기화`);

    // 테이블 정보 로드
    await this.loadTableInfo();
    
    // 기존 확정 주문 로드
    await this.loadConfirmedOrders();
    
    // UI 렌더링
    this.renderTableDetailUI();
    this.renderMenuGrid();
    this.updateOrderDisplay();
    
    console.log(`✅ 테이블 ${tableNumber} 상세 화면 초기화 완료`);
  }

  // 🍽️ 테이블 정보 로드
  static async loadTableInfo() {
    try {
      const currentStore = POSStateManager.getCurrentStore();
      if (!currentStore) return;

      const response = await fetch(`/api/stores/${currentStore.id}/tables/${this.currentTableNumber}`);
      
      if (response.ok) {
        this.tableInfo = await response.json();
      } else {
        this.tableInfo = {
          tableNumber: this.currentTableNumber,
          seats: 4,
          status: 'available',
          occupiedSince: null
        };
      }
    } catch (error) {
      console.error('❌ 테이블 정보 로드 실패:', error);
      this.tableInfo = {
        tableNumber: this.currentTableNumber,
        seats: 4,
        status: 'available',
        occupiedSince: null
      };
    }
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

  // 🛒 임시주문에 메뉴 추가
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

  // 📋 주문내역 렌더링
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
          <small>좌측에서 메뉴를 선택해주세요</small>
        </div>
      `;
      return;
    }

    const html = allItems.map(item => {
      const itemName = item.name || item.menuName;
      const itemTotal = item.price * item.quantity;
      const status = item.status || 'ordered';
      
      return `
        <div class="order-row ${item.isConfirmed ? 'confirmed' : 'pending'}">
          <div class="order-item-info">
            <div class="item-header">
              <span class="item-name">${itemName}</span>
              ${item.isConfirmed ? `<span class="item-status ${status}">${this.getStatusText(status)}</span>` : ''}
            </div>
            <div class="item-meta">
              <span class="item-price">단가: ₩${item.price.toLocaleString()}</span>
              <span class="item-qty">수량: ${item.quantity}개</span>
              <span class="item-total">소계: ₩${itemTotal.toLocaleString()}</span>
            </div>
          </div>
          <div class="order-controls">
            ${item.isConfirmed ? `
              <button class="control-btn modify-btn" onclick="POSTableDetailView.modifyConfirmedItem('${item.id}', 'decrease')">−</button>
              <button class="control-btn modify-btn" onclick="POSTableDetailView.modifyConfirmedItem('${item.id}', 'increase')">+</button>
              <button class="control-btn cancel-btn" onclick="POSTableDetailView.cancelConfirmedItem('${item.id}')">취소</button>
            ` : `
              <button class="control-btn draft-btn" onclick="POSTableDetailView.changeDraftQuantity('${item.id}', -1)">−</button>
              <button class="control-btn draft-btn" onclick="POSTableDetailView.changeDraftQuantity('${item.id}', 1)">+</button>
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

    // 임시주문 금액도 표시
    const draftTotalElement = document.getElementById('draftTotal');
    if (draftTotalElement) {
      draftTotalElement.textContent = `₩${draftTotal.toLocaleString()}`;
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
        orderBtn.className = 'action-btn order-btn active';
      } else {
        orderBtn.disabled = true;
        orderBtn.textContent = '주문';
        orderBtn.className = 'action-btn order-btn disabled';
      }
    }

    if (clearBtn) {
      clearBtn.disabled = this.draftOrders.length === 0;
      clearBtn.textContent = '정정';
    }

    if (checkoutBtn) {
      const hasConfirmedOrders = this.confirmedOrders.length > 0;
      checkoutBtn.disabled = !hasConfirmedOrders;
      checkoutBtn.textContent = '계산';
      if (hasConfirmedOrders) {
        checkoutBtn.className = 'action-btn checkout-btn active';
      } else {
        checkoutBtn.className = 'action-btn checkout-btn disabled';
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

  // 🗑️ 임시주문 전체 비우기 (정정)
  static clearDraftOrders() {
    if (this.draftOrders.length === 0) {
      showPOSNotification('임시주문이 이미 비어있습니다', 'warning');
      return;
    }

    const itemCount = this.draftOrders.length;
    this.draftOrders = [];
    this.updateOrderDisplay();
    showPOSNotification(`${itemCount}개 아이템 정정됨`, 'info');
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
        await this.cancelConfirmedItem(itemId);
        return;
      }

      console.log(`✏️ 확정 주문 수량 수정: ${item.menuName || item.name} (${item.quantity} → ${newQuantity})`);

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
      showPOSNotification(`${item.menuName || item.name} 수량이 ${newQuantity}개로 변경되었습니다`, 'success');

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

      const itemName = item.menuName || item.name;
      if (!confirm(`${itemName}을(를) 취소하시겠습니까?`)) {
        return;
      }

      console.log(`🗑️ 확정 주문 취소: ${itemName}`);

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
      showPOSNotification(`${itemName} 주문이 취소되었습니다`, 'success');

    } catch (error) {
      console.error('❌ 확정 주문 취소 실패:', error);
      showPOSNotification('주문 취소 실패: ' + error.message, 'error');
    }
  }

  // 💳 계산 처리
  static async processCheckout() {
    if (this.confirmedOrders.length === 0) {
      showPOSNotification('결제할 주문이 없습니다', 'warning');
      return;
    }

    // 임시주문이 있으면 먼저 확정하라고 안내
    if (this.draftOrders.length > 0) {
      showPOSNotification('임시주문을 먼저 확정해주세요', 'warning');
      return;
    }

    try {
      const currentStore = POSStateManager.getCurrentStore();
      
      const response = await fetch(`/api/pos/stores/${currentStore.id}/table/${this.currentTableNumber}/payment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          paymentMethod: 'CASH'
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
    this.tableInfo = null;

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
      'CANCELED': '취소됨',
      'ordered': '주문접수',
      'preparing': '조리중',
      'ready': '완료',
      'served': '서빙완료',
      'canceled': '취소됨'
    };
    return statusMap[status] || '주문접수';
  }

  // 🕐 시간 포맷팅
  static formatTimeElapsed(timestamp) {
    if (!timestamp) return '';
    
    const now = new Date();
    const time = new Date(timestamp);
    const diffMinutes = Math.floor((now - time) / (1000 * 60));

    if (diffMinutes < 1) return '방금 전';
    if (diffMinutes < 60) return `${diffMinutes}분 전`;

    const diffHours = Math.floor(diffMinutes / 60);
    const remainingMinutes = diffMinutes % 60;
    return `${diffHours}시간 ${remainingMinutes}분 전`;
  }

  // 🎨 테이블 상세 UI 렌더링
  static renderTableDetailUI() {
    const tableDetailView = document.getElementById('tableDetailView');
    if (!tableDetailView) return;

    const tableStatus = this.getTableStatusText();
    const occupiedTime = this.tableInfo?.occupiedSince ? this.formatTimeElapsed(this.tableInfo.occupiedSince) : '';

    tableDetailView.innerHTML = `
      <div class="pos-detail-interface">
        <!-- 좌측: 메뉴 선택 영역 -->
        <div class="menu-section">
          <div class="menu-header">
            <h3>메뉴 선택</h3>
            <div class="menu-search-box">
              <input type="text" id="menuSearch" placeholder="메뉴 검색..." onkeyup="POSTableDetailView.searchMenu(this.value)">
              <span class="search-icon">🔍</span>
            </div>
          </div>
          <div class="menu-grid" id="menuGrid">
            <!-- 메뉴 카드들이 여기에 렌더링됩니다 -->
          </div>
        </div>

        <!-- 우측: 주문 관리 영역 -->
        <div class="order-section">
          <!-- 테이블 정보 헤더 -->
          <div class="table-info-header">
            <button class="back-btn" onclick="POSTableDetailView.returnToTableMap()">
              ← 테이블맵
            </button>
            <div class="table-info">
              <h2>테이블 ${this.currentTableNumber}</h2>
              <div class="table-meta">
                <span class="table-seats">${this.tableInfo?.seats || 4}인석</span>
                <span class="table-status ${this.tableInfo?.status || 'available'}">${tableStatus}</span>
                ${occupiedTime ? `<span class="occupied-time">${occupiedTime}</span>` : ''}
              </div>
            </div>
          </div>

          <!-- 주문내역 패널 -->
          <div class="order-panel">
            <div class="order-panel-header">
              <h4>주문내역</h4>
              <div class="order-summary">
                ${this.draftOrders.length > 0 ? `<span class="draft-count">임시: ${this.draftOrders.length}개</span>` : ''}
                ${this.confirmedOrders.length > 0 ? `<span class="confirmed-count">확정: ${this.confirmedOrders.length}개</span>` : ''}
              </div>
            </div>
            <div class="order-list-container" id="orderListContainer">
              <!-- 주문 아이템들이 여기에 렌더링됩니다 -->
            </div>
          </div>

          <!-- 합계 정보 -->
          <div class="total-section">
            ${this.draftOrders.length > 0 ? `
              <div class="draft-total-row">
                <span class="draft-total-label">임시주문</span>
                <span class="draft-total-amount" id="draftTotal">₩0</span>
              </div>
            ` : ''}
            <div class="total-row">
              <span class="total-label">총 합계</span>
              <span class="total-amount" id="totalAmount">₩0</span>
            </div>
          </div>

          <!-- 액션 버튼 영역 -->
          <div class="action-section">
            <div class="action-row-top">
              <button id="clearDraftBtn" class="action-btn clear-btn" onclick="POSTableDetailView.clearDraftOrders()">
                정정
              </button>
              <button id="confirmOrderBtn" class="action-btn order-btn" onclick="POSTableDetailView.confirmOrders()">
                주문
              </button>
            </div>
            <div class="action-row-bottom">
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

  // 🏷️ 테이블 상태 텍스트
  static getTableStatusText() {
    if (!this.tableInfo) return '정보없음';
    
    switch (this.tableInfo.status) {
      case 'occupied': return '사용중';
      case 'ordering': return '주문중';
      case 'payment': return '결제대기';
      case 'available': return '이용가능';
      default: return '사용중';
    }
  }

  // 🎨 스타일 정의
  static getTableDetailStyles() {
    return `
      <style>
        .pos-detail-interface {
          height: 100vh;
          display: grid;
          grid-template-columns: 2fr 1fr;
          background: #f8f9fa;
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          overflow: hidden;
        }

        /* 좌측 메뉴 영역 */
        .menu-section {
          background: white;
          display: flex;
          flex-direction: column;
          border-right: 2px solid #e9ecef;
        }

        .menu-header {
          padding: 20px;
          border-bottom: 1px solid #dee2e6;
          background: #f8f9fa;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .menu-header h3 {
          margin: 0;
          font-size: 18px;
          font-weight: 600;
          color: #495057;
        }

        .menu-search-box {
          position: relative;
        }

        #menuSearch {
          padding: 10px 40px 10px 15px;
          border: 1px solid #ced4da;
          border-radius: 8px;
          font-size: 14px;
          width: 250px;
          background: white;
        }

        .search-icon {
          position: absolute;
          right: 12px;
          top: 50%;
          transform: translateY(-50%);
          color: #6c757d;
          pointer-events: none;
        }

        .menu-grid {
          flex: 1;
          padding: 25px;
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
          gap: 20px;
          overflow-y: auto;
          background: #fafbfc;
        }

        .menu-card {
          background: white;
          border: 2px solid #e9ecef;
          border-radius: 12px;
          padding: 16px;
          cursor: pointer;
          transition: all 0.3s ease;
          text-align: center;
          display: flex;
          flex-direction: column;
          justify-content: center;
          min-height: 100px;
          box-shadow: 0 2px 4px rgba(0,0,0,0.05);
        }

        .menu-card:hover {
          border-color: #007bff;
          box-shadow: 0 4px 12px rgba(0,123,255,0.2);
          transform: translateY(-2px);
          background: #f8f9ff;
        }

        .menu-card:active {
          transform: translateY(0);
          box-shadow: 0 2px 8px rgba(0,123,255,0.3);
        }

        .menu-name {
          font-size: 15px;
          font-weight: 600;
          color: #212529;
          margin-bottom: 8px;
          line-height: 1.3;
        }

        .menu-price {
          font-size: 14px;
          color: #6c757d;
          font-weight: 500;
        }

        /* 우측 주문 영역 */
        .order-section {
          background: #ffffff;
          display: flex;
          flex-direction: column;
          border-left: 1px solid #dee2e6;
        }

        .table-info-header {
          background: #343a40;
          color: white;
          padding: 15px 20px;
          display: flex;
          align-items: center;
          gap: 15px;
        }

        .back-btn {
          background: #6c757d;
          color: white;
          border: none;
          padding: 8px 12px;
          border-radius: 6px;
          cursor: pointer;
          font-size: 13px;
          font-weight: 500;
          transition: background 0.2s;
        }

        .back-btn:hover {
          background: #5a6268;
        }

        .table-info h2 {
          margin: 0;
          font-size: 20px;
          font-weight: 600;
        }

        .table-meta {
          display: flex;
          gap: 10px;
          font-size: 12px;
          margin-top: 4px;
        }

        .table-seats {
          background: rgba(255,255,255,0.2);
          padding: 2px 6px;
          border-radius: 4px;
        }

        .table-status {
          padding: 2px 6px;
          border-radius: 4px;
          font-weight: 500;
        }

        .table-status.occupied {
          background: #ffc107;
          color: #000;
        }

        .table-status.available {
          background: #28a745;
          color: white;
        }

        .occupied-time {
          background: rgba(255,255,255,0.2);
          padding: 2px 6px;
          border-radius: 4px;
        }

        .order-panel {
          flex: 1;
          background: white;
          margin: 15px;
          border-radius: 10px;
          border: 1px solid #dee2e6;
          display: flex;
          flex-direction: column;
          box-shadow: 0 2px 4px rgba(0,0,0,0.05);
        }

        .order-panel-header {
          padding: 15px 20px;
          border-bottom: 1px solid #e9ecef;
          background: #f8f9fa;
          border-radius: 10px 10px 0 0;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .order-panel-header h4 {
          margin: 0;
          font-size: 16px;
          font-weight: 600;
          color: #495057;
        }

        .order-summary {
          display: flex;
          gap: 10px;
          font-size: 12px;
        }

        .draft-count {
          background: #fff3cd;
          color: #856404;
          padding: 3px 8px;
          border-radius: 6px;
          font-weight: 500;
        }

        .confirmed-count {
          background: #d1ecf1;
          color: #0c5460;
          padding: 3px 8px;
          border-radius: 6px;
          font-weight: 500;
        }

        .order-list-container {
          flex: 1;
          overflow-y: auto;
          padding: 15px;
        }

        .empty-order-list {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          height: 200px;
          color: #6c757d;
          text-align: center;
        }

        .empty-icon {
          font-size: 48px;
          margin-bottom: 15px;
          opacity: 0.5;
        }

        .order-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 15px;
          border: 1px solid #e9ecef;
          border-radius: 8px;
          margin-bottom: 10px;
          background: white;
          transition: all 0.2s;
        }

        .order-row:hover {
          box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        }

        .order-row.pending {
          border-left: 4px solid #ffc107;
          background: linear-gradient(90deg, #fff8e1 0%, white 5%);
        }

        .order-row.confirmed {
          border-left: 4px solid #28a745;
          background: linear-gradient(90deg, #f0fff4 0%, white 5%);
        }

        .order-item-info {
          flex: 1;
        }

        .item-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 6px;
        }

        .item-name {
          font-size: 15px;
          font-weight: 600;
          color: #212529;
        }

        .item-status {
          font-size: 11px;
          padding: 2px 6px;
          border-radius: 4px;
          font-weight: 500;
        }

        .item-status.ordered {
          background: #e2e3e5;
          color: #495057;
        }

        .item-status.preparing {
          background: #fff3cd;
          color: #856404;
        }

        .item-status.ready {
          background: #d1ecf1;
          color: #0c5460;
        }

        .item-status.served {
          background: #d4edda;
          color: #155724;
        }

        .item-meta {
          display: flex;
          gap: 12px;
          font-size: 12px;
          color: #6c757d;
        }

        .item-price, .item-qty, .item-total {
          font-weight: 500;
        }

        .order-controls {
          display: flex;
          gap: 6px;
          align-items: center;
        }

        .control-btn {
          width: 32px;
          height: 32px;
          border: 1px solid #ced4da;
          background: white;
          border-radius: 6px;
          cursor: pointer;
          font-size: 14px;
          font-weight: 600;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s;
        }

        .control-btn:hover {
          background: #f8f9fa;
          border-color: #adb5bd;
          transform: translateY(-1px);
        }

        .draft-btn {
          background: #e3f2fd;
          border-color: #2196f3;
          color: #1976d2;
        }

        .draft-btn:hover {
          background: #bbdefb;
        }

        .modify-btn {
          background: #fff3e0;
          border-color: #ff9800;
          color: #f57c00;
        }

        .modify-btn:hover {
          background: #ffe0b2;
        }

        .remove-btn, .cancel-btn {
          background: #ffebee;
          border-color: #f44336;
          color: #d32f2f;
          font-size: 10px;
          width: 40px;
        }

        .remove-btn:hover, .cancel-btn:hover {
          background: #ffcdd2;
        }

        /* 합계 영역 */
        .total-section {
          background: white;
          margin: 15px;
          padding: 20px;
          border-radius: 10px;
          border: 1px solid #dee2e6;
          box-shadow: 0 2px 4px rgba(0,0,0,0.05);
        }

        .draft-total-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding-bottom: 10px;
          margin-bottom: 10px;
          border-bottom: 1px solid #e9ecef;
        }

        .draft-total-label {
          font-size: 14px;
          color: #6c757d;
          font-weight: 500;
        }

        .draft-total-amount {
          font-size: 14px;
          color: #ffc107;
          font-weight: 600;
        }

        .total-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .total-label {
          font-size: 18px;
          font-weight: 600;
          color: #212529;
        }

        .total-amount {
          font-size: 20px;
          font-weight: 700;
          color: #28a745;
        }

        /* 액션 버튼 영역 */
        .action-section {
          padding: 20px;
          background: white;
          margin: 15px;
          border-radius: 10px;
          border: 1px solid #dee2e6;
          box-shadow: 0 2px 4px rgba(0,0,0,0.05);
        }

        .action-row-top {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 10px;
          margin-bottom: 10px;
        }

        .action-row-bottom {
          display: grid;
          grid-template-columns: 1fr;
        }

        .action-btn {
          padding: 15px 20px;
          border: none;
          border-radius: 8px;
          font-size: 15px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s ease;
          position: relative;
          overflow: hidden;
        }

        .action-btn::before {
          content: '';
          position: absolute;
          top: 0;
          left: -100%;
          width: 100%;
          height: 100%;
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent);
          transition: left 0.5s;
        }

        .action-btn:hover::before {
          left: 100%;
        }

        .clear-btn {
          background: #6c757d;
          color: white;
        }

        .clear-btn:hover:not(.disabled) {
          background: #5a6268;
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(108, 117, 125, 0.3);
        }

        .order-btn {
          background: #007bff;
          color: white;
        }

        .order-btn.active:hover {
          background: #0056b3;
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0, 123, 255, 0.3);
        }

        .checkout-btn {
          background: #28a745;
          color: white;
          font-size: 16px;
          padding: 18px 20px;
        }

        .checkout-btn.active:hover {
          background: #1e7e34;
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(40, 167, 69, 0.3);
        }

        .action-btn.disabled, .action-btn:disabled {
          background: #e9ecef;
          color: #6c757d;
          cursor: not-allowed;
          transform: none;
          box-shadow: none;
        }

        .action-btn.disabled::before {
          display: none;
        }

        /* 반응형 */
        @media (max-width: 1200px) {
          .pos-detail-interface {
            grid-template-columns: 1fr;
            grid-template-rows: 1fr 1fr;
          }
          
          .order-section {
            border-left: none;
            border-top: 2px solid #e9ecef;
          }
        }

        @media (max-width: 768px) {
          .menu-grid {
            grid-template-columns: repeat(auto-fill, minmax(110px, 1fr));
            gap: 15px;
            padding: 20px;
          }
          
          .menu-card {
            min-height: 80px;
            padding: 12px;
          }
          
          .menu-name {
            font-size: 13px;
          }
          
          .menu-price {
            font-size: 12px;
          }
        }

        /* 스크롤바 스타일링 */
        .menu-grid::-webkit-scrollbar,
        .order-list-container::-webkit-scrollbar {
          width: 8px;
        }

        .menu-grid::-webkit-scrollbar-track,
        .order-list-container::-webkit-scrollbar-track {
          background: #f1f1f1;
          border-radius: 4px;
        }

        .menu-grid::-webkit-scrollbar-thumb,
        .order-list-container::-webkit-scrollbar-thumb {
          background: #c1c1c1;
          border-radius: 4px;
        }

        .menu-grid::-webkit-scrollbar-thumb:hover,
        .order-list-container::-webkit-scrollbar-thumb:hover {
          background: #a8a8a8;
        }
      </style>
    `;
  }
}

// 전역 함수 등록
window.POSTableDetailView = POSTableDetailView;

console.log('✅ POS 테이블 상세 화면 모듈 로드 완료 (재구성됨)');
