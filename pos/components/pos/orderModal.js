// 주문 모달 관리 모듈

let currentOrderItems = [];

// 주문 추가 기능
function addOrder() {
  if (!window.currentTable) {
    showPOSNotification('테이블을 먼저 선택해주세요.', 'warning');
    return;
  }
  checkTableTLLOrder(window.currentTable);
}

// 테이블의 TLL 주문 확인
async function checkTableTLLOrder(tableNumber) {
  try {
    const response = await fetch(`/api/pos/stores/${window.currentStore.id}/table/${tableNumber}/orders`);
    const data = await response.json();

    if (data.success && data.tllOrder) {
      showOrderModal(data.tllOrder);
    } else {
      showOrderModal();
    }
  } catch (error) {
    console.error('❌ TLL 주문 확인 실패:', error);
    showOrderModal();
  }
}

// 주문 모달 표시
function showOrderModal(tllOrderInfo = null) {
  const modal = document.createElement('div');
  modal.id = 'orderModal';
  modal.innerHTML = `
    <div class="modal-overlay" onclick="closeOrderModal(event)">
      <div class="modal-content order-modal" onclick="event.stopPropagation()">
        <div class="modal-header">
          <h2>🍽️ 주문 추가 - 테이블 ${window.currentTable}</h2>
          <button class="close-btn" onclick="closeOrderModal()">✕</button>
        </div>

        <div class="modal-body">
          <!-- 고객 정보 입력 -->
          <div class="customer-section">
            <div class="section-title">👤 주문 정보</div>

            ${tllOrderInfo ? `
              <!-- TLL 주문 정보 표시 -->
              <div class="tll-order-info ${tllOrderInfo.isGuest ? 'guest-order' : 'member-order'}">
                <div class="tll-badge ${tllOrderInfo.isGuest ? 'guest' : 'member'}">
                  ${tllOrderInfo.isGuest ? '👤 TLL 비회원 주문' : '🔗 TLL 회원 주문'}
                </div>
                <div class="tll-customer-info">
                  <div class="customer-detail">
                    <span class="label">고객명:</span>
                    <span class="value">${tllOrderInfo.customerName}</span>
                  </div>
                  <div class="customer-detail">
                    <span class="label">주문방식:</span>
                    <span class="value">${tllOrderInfo.isGuest ? 'TLL 비회원' : 'TLL 회원'}</span>
                  </div>
                  ${tllOrderInfo.phone ? `
                    <div class="customer-detail">
                      <span class="label">연락처:</span>
                      <span class="value">${tllOrderInfo.phone}</span>
                    </div>
                  ` : ''}
                </div>
                <div class="tll-note">
                  기존 TLL 주문에 메뉴를 추가합니다. 결제 시 고객 정보가 적용됩니다.
                </div>
              </div>
            ` : `
              <!-- 일반 POS 주문 -->
              <div class="pos-order-info">
                <div class="pos-badge">🏪 POS 주문</div>
                <div class="pos-note">
                  새 주문을 생성합니다. 메뉴를 선택하여 주문을 추가하세요.
                </div>
              </div>
            `}
          </div>

          <!-- 메뉴 선택 -->
          <div class="menu-section">
            <div class="section-title">🍴 메뉴 선택</div>
            <div class="menu-categories">
              <button class="category-btn active" onclick="filterMenuCategory('all')">전체</button>
              <button class="category-btn" onclick="filterMenuCategory('치킨')">치킨</button>
              <button class="category-btn" onclick="filterMenuCategory('사이드')">사이드</button>
              <button class="category-btn" onclick="filterMenuCategory('음료')">음료</button>
            </div>

            <div class="menu-grid" id="menuGrid">
              <!-- 메뉴 아이템들이 여기에 표시됩니다 -->
            </div>
          </div>

          <!-- 주문 요약 -->
          <div class="order-summary">
            <div class="section-title">📝 주문 내역</div>
            <div class="order-items" id="orderItems">
              <div class="empty-order">메뉴를 선택해주세요</div>
            </div>
            <div class="order-total">
              <div class="total-line">
                <span>총 금액:</span>
                <span id="totalAmount">₩0</span>
              </div>
            </div>
          </div>
        </div>

        <div class="modal-footer">
          <button class="btn btn-secondary" onclick="closeOrderModal()">취소</button>
          <button class="btn btn-primary" onclick="submitOrder()" id="submitOrderBtn" disabled>
            주문 추가
          </button>
        </div>
      </div>
    </div>

    <style>
      .modal-overlay {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.5);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 10000;
        animation: fadeIn 0.2s ease;
      }

      .order-modal {
        width: 90%;
        max-width: 800px;
        height: 90%;
        max-height: 600px;
        background: white;
        border-radius: 12px;
        display: flex;
        flex-direction: column;
        animation: slideUp 0.3s ease;
      }

      .modal-header {
        padding: 20px;
        border-bottom: 1px solid #e2e8f0;
        display: flex;
        justify-content: space-between;
        align-items: center;
      }

      .modal-header h2 {
        margin: 0;
        font-size: 18px;
        font-weight: 600;
        color: #1e293b;
      }

      .close-btn {
        background: none;
        border: none;
        font-size: 24px;
        cursor: pointer;
        color: #64748b;
        padding: 0;
        width: 30px;
        height: 30px;
        display: flex;
        align-items: center;
        justify-content: center;
      }

      .modal-body {
        flex: 1;
        padding: 20px;
        overflow-y: auto;
        display: flex;
        gap: 20px;
      }

      .customer-section {
        width: 250px;
        flex-shrink: 0;
      }

      .menu-section {
        flex: 1;
        min-width: 0;
      }

      .order-summary {
        width: 200px;
        flex-shrink: 0;
      }

      .section-title {
        font-size: 14px;
        font-weight: 600;
        color: #374151;
        margin-bottom: 12px;
        padding-bottom: 8px;
        border-bottom: 1px solid #f1f5f9;
      }

      .tll-order-info {
        border-radius: 12px;
        padding: 20px;
        margin-bottom: 16px;
      }

      .tll-order-info.member-order {
        background: #eff6ff;
        border: 2px solid #3b82f6;
      }

      .tll-order-info.guest-order {
        background: #fef3c7;
        border: 2px solid #f59e0b;
      }

      .tll-badge {
        color: white;
        padding: 6px 16px;
        border-radius: 25px;
        font-size: 13px;
        font-weight: 700;
        display: inline-block;
        margin-bottom: 16px;
        text-transform: uppercase;
        letter-spacing: 0.5px;
      }

      .tll-badge.member {
        background: linear-gradient(135deg, #3b82f6, #1d4ed8);
      }

      .tll-badge.guest {
        background: linear-gradient(135deg, #f59e0b, #d97706);
      }

      .pos-order-info {
        background: #f8fafc;
        border: 2px solid #e2e8f0;
        border-radius: 12px;
        padding: 20px;
      }

      .pos-badge {
        background: linear-gradient(135deg, #10b981, #059669);
        color: white;
        padding: 6px 16px;
        border-radius: 25px;
        font-size: 13px;
        font-weight: 700;
        display: inline-block;
        margin-bottom: 16px;
        text-transform: uppercase;
        letter-spacing: 0.5px;
      }

      .tll-customer-info {
        margin-bottom: 12px;
      }

      .customer-detail {
        display: flex;
        justify-content: space-between;
        margin-bottom: 6px;
        font-size: 14px;
      }

      .customer-detail .label {
        color: #64748b;
        font-weight: 500;
      }

      .customer-detail .value {
        color: #1e293b;
        font-weight: 600;
      }

      .tll-note, .pos-note {
        font-size: 12px;
        color: #64748b;
        font-style: italic;
        background: rgba(59, 130, 246, 0.1);
        padding: 8px;
        border-radius: 4px;
      }

      .menu-categories {
        display: flex;
        gap: 8px;
        margin-bottom: 16px;
        flex-wrap: wrap;
      }

      .category-btn {
        padding: 6px 12px;
        border: 1px solid #d1d5db;
        background: white;
        border-radius: 6px;
        font-size: 13px;
        cursor: pointer;
        transition: all 0.2s;
      }

      .category-btn.active {
        background: #3b82f6;
        color: white;
        border-color: #3b82f6;
      }

      .menu-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
        gap: 12px;
        max-height: 300px;
        overflow-y: auto;
      }

      .menu-item-card {
        border: 1px solid #e2e8f0;
        border-radius: 8px;
        padding: 12px;
        cursor: pointer;
        transition: all 0.2s;
        background: white;
      }

      .menu-item-card:hover {
        border-color: #3b82f6;
        background: #f8fafc;
      }

      .menu-item-name {
        font-size: 13px;
        font-weight: 500;
        margin-bottom: 4px;
        color: #374151;
      }

      .menu-item-price {
        font-size: 12px;
        color: #059669;
        font-weight: 600;
      }

      .order-items {
        max-height: 200px;
        overflow-y: auto;
        margin-bottom: 16px;
      }

      .empty-order {
        text-align: center;
        color: #9ca3af;
        font-size: 13px;
        padding: 20px;
      }

      .order-item-row {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 8px 0;
        border-bottom: 1px solid #f1f5f9;
        font-size: 13px;
      }

      .order-item-row:last-child {
        border-bottom: none;
      }

      .item-name {
        flex: 1;
        color: #374151;
      }

      .item-controls {
        display: flex;
        align-items: center;
        gap: 6px;
      }

      .qty-btn {
        width: 20px;
        height: 20px;
        border: 1px solid #d1d5db;
        background: white;
        border-radius: 4px;
        cursor: pointer;
        font-size: 12px;
        display: flex;
        align-items: center;
        justify-content: center;
      }

      .qty-btn:hover {
        background: #f3f4f6;
      }

      .qty-btn:disabled {
        opacity: 0.5;
        cursor: not-allowed;
      }

      .item-quantity {
        min-width: 20px;
        text-align: center;
        font-weight: 500;
      }

      .item-price {
        min-width: 60px;
        text-align: right;
        color: #059669;
        font-weight: 500;
      }

      .order-total {
        border-top: 1px solid #e2e8f0;
        padding-top: 12px;
      }

      .total-line {
        display: flex;
        justify-content: space-between;
        font-weight: 600;
        color: #1e293b;
      }

      .modal-footer {
        padding: 20px;
        border-top: 1px solid #e2e8f0;
        display: flex;
        gap: 12px;
        justify-content: flex-end;
      }

      .btn {
        padding: 10px 20px;
        border: none;
        border-radius: 6px;
        font-size: 14px;
        font-weight: 500;
        cursor: pointer;
        transition: all 0.2s;
      }

      .btn-secondary {
        background: #f1f5f9;
        color: #64748b;
      }

      .btn-secondary:hover {
        background: #e2e8f0;
      }

      .btn-primary {
        background: #3b82f6;
        color: white;
      }

      .btn-primary:hover {
        background: #2563eb;
      }

      .btn-primary:disabled {
        background: #9ca3af;
        cursor: not-allowed;
      }

      @keyframes fadeIn {
        from { opacity: 0; }
        to { opacity: 1; }
      }

      @keyframes slideUp {
        from { transform: translateY(20px); opacity: 0; }
        to { transform: translateY(0); opacity: 1; }
      }
    </style>
  `;

  document.body.appendChild(modal);

  // TLL 주문 정보를 전역 변수에 저장
  window.currentTLLOrder = tllOrderInfo;
  window.currentOrderItems = [];

  loadMenuItems();
}

// 메뉴 아이템 로드
function loadMenuItems() {
  const menuGrid = document.getElementById('menuGrid');

  if (!window.allMenus || window.allMenus.length === 0) {
    menuGrid.innerHTML = '<div class="empty-order">메뉴 데이터가 없습니다</div>';
    return;
  }

  const menuHTML = window.allMenus.map(menu => `
    <div class="menu-item-card" onclick="addMenuItem('${menu.name}', ${menu.price})" data-category="${menu.category || '기타'}">
      <div class="menu-item-name">${menu.name}</div>
      <div class="menu-item-price">₩${menu.price.toLocaleString()}</div>
    </div>
  `).join('');

  menuGrid.innerHTML = menuHTML;
}

// 메뉴 카테고리 필터
function filterMenuCategory(category) {
  // 버튼 활성화 상태 변경
  document.querySelectorAll('.category-btn').forEach(btn => btn.classList.remove('active'));
  event.target.classList.add('active');

  // 메뉴 아이템 필터링
  const menuCards = document.querySelectorAll('.menu-item-card');
  menuCards.forEach(card => {
    const cardCategory = card.dataset.category;
    if (category === 'all' || cardCategory === category) {
      card.style.display = 'block';
    } else {
      card.style.display = 'none';
    }
  });
}

// 메뉴 아이템 추가
function addMenuItem(name, price) {
  if (!window.currentOrderItems) {
    window.currentOrderItems = [];
  }

  const existingItem = window.currentOrderItems.find(item => item.name === name);

  if (existingItem) {
    existingItem.quantity += 1;
  } else {
    window.currentOrderItems.push({
      name: name,
      price: price,
      quantity: 1
    });
  }

  updateOrderDisplay();
  updateSubmitButton();
}

// 주문 디스플레이 업데이트
function updateOrderDisplay() {
  const orderItemsContainer = document.getElementById('orderItems');
  const totalAmountElement = document.getElementById('totalAmount');

  if (!window.currentOrderItems) {
    window.currentOrderItems = [];
  }

  if (window.currentOrderItems.length === 0) {
    orderItemsContainer.innerHTML = '<div class="empty-order">메뉴를 선택해주세요</div>';
    totalAmountElement.textContent = '₩0';
    return;
  }

  const itemsHTML = window.currentOrderItems.map((item, index) => `
    <div class="order-item-row">
      <div class="item-name">${item.name}</div>
      <div class="item-controls">
        <button class="qty-btn" onclick="changeQuantity(${index}, -1)" ${item.quantity <= 1 ? 'disabled' : ''}>-</button>
        <span class="item-quantity">${item.quantity}</span>
        <button class="qty-btn" onclick="changeQuantity(${index}, 1)">+</button>
      </div>
      <div class="item-price">₩${(item.price * item.quantity).toLocaleString()}</div>
    </div>
  `).join('');

  orderItemsContainer.innerHTML = itemsHTML;

  const totalAmount = window.currentOrderItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  totalAmountElement.textContent = `₩${totalAmount.toLocaleString()}`;
}

// 수량 변경
function changeQuantity(index, change) {
  if (!window.currentOrderItems) {
    window.currentOrderItems = [];
  }

  const item = window.currentOrderItems[index];
  if (item) {
    item.quantity += change;

    if (item.quantity <= 0) {
      window.currentOrderItems.splice(index, 1);
    }
  }
  updateOrderDisplay();
  updateSubmitButton();
}

// 제출 버튼 상태 업데이트
function updateSubmitButton() {
  const submitBtn = document.getElementById('submitOrderBtn');
  if (!submitBtn) return;

  if (!window.currentOrderItems) {
    window.currentOrderItems = [];
  }

  const hasItems = window.currentOrderItems.length > 0;
  submitBtn.disabled = !hasItems;
}

// 주문 제출 (새 DB 구조에 맞게 수정)
async function submitOrder() {
  try {
    if (!window.currentOrderItems) {
      window.currentOrderItems = [];
    }

    const totalAmount = window.currentOrderItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);

    // TLL 주문 정보 확인
    const tllOrderInfo = window.currentTLLOrder;

    const orderData = {
      storeId: window.currentStore.id,
      storeName: window.currentStore.name,
      tableNumber: window.currentTable,
      items: window.currentOrderItems,
      totalAmount: totalAmount,
      isTLLOrder: !!tllOrderInfo
    };

    if (tllOrderInfo) {
      // TLL 주문인 경우 - 기존 고객 정보 사용
      orderData.userId = tllOrderInfo.userId;
      orderData.guestPhone = tllOrderInfo.guestPhone;
      orderData.customerName = tllOrderInfo.customerName;
    }

    console.log('📦 POS 주문 제출 (DB 저장):', orderData);

    const response = await fetch('/api/pos/orders', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(orderData)
    });

    const result = await response.json();

    if (result.success) {
      window.showPOSNotification(
        `테이블 ${window.currentTable}에 주문이 추가되었습니다.`,
        'success'
      );

      closeOrderModal();

      // 테이블 맵 새로고침
      if (typeof window.renderTableMap === 'function') {
        window.renderTableMap();
      }

      // 현재 선택된 테이블의 상세 패널 새로고침
      if (window.currentTable && typeof window.renderTableDetailPanel === 'function') {
        window.renderTableDetailPanel(window.currentTable);
      }
    } else {
      alert('주문 처리 실패: ' + result.error);
    }

  } catch (error) {
    console.error('❌ POS 주문 제출 실패:', error);
    alert('주문 처리 중 오류가 발생했습니다.');
  }
}

// 주문 모달 닫기
function closeOrderModal(event) {
  if (event && event.target !== event.currentTarget) return;

  const modal = document.getElementById('orderModal');
  if (modal) {
    modal.remove();
  }

  // 주문 상태 초기화
  window.currentOrderItems = [];
  window.currentTLLOrder = null;
}

// 전역 함수 등록
window.addOrder = addOrder;
window.checkTableTLLOrder = checkTableTLLOrder;
window.showOrderModal = showOrderModal;
window.closeOrderModal = closeOrderModal;
window.addMenuItem = addMenuItem;
window.submitOrder = submitOrder;
window.changeQuantity = changeQuantity;
window.currentOrderItems = currentOrderItems;