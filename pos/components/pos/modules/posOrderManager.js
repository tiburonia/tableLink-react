// POS 주문 관리 모듈 - 단순 장바구니 방식
import { POSStateManager } from './posStateManager.js';
import { showPOSNotification } from '../../../utils/posNotification.js'; // Ensure this import is present if showPOSNotification is used in new methods

export class POSOrderManager {

  // 🛒 장바구니에 메뉴 추가 (이름, 가격으로)
  static addMenuToCart(menuName, price, notes = '') {
    console.log('🛒 장바구니에 메뉴 추가:', menuName, '₩' + price);

    const cartItems = POSStateManager.getCartItems();
    const existingItem = cartItems.find(item => item.name === menuName);

    if (existingItem) {
      // 기존 아이템 수량 증가
      existingItem.quantity += 1;
      showPOSNotification(`${menuName} 수량: ${existingItem.quantity}개`, 'info');
    } else {
      // 새 아이템 추가
      const cartItem = {
        id: `cart_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        name: menuName,
        price: parseInt(price),
        quantity: 1,
        notes: notes,
        addedAt: new Date().toISOString()
      };
      cartItems.push(cartItem);
      showPOSNotification(`${menuName} 장바구니 추가`, 'success');
    }

    POSStateManager.setCartItems(cartItems);
    this.updateUI();

    console.log(`✅ 장바구니 업데이트 완료: ${cartItems.length}개 아이템`);
    return true;
  }

  // 🛒 장바구니에 메뉴 추가 (객체로)
  static addToCart(menuItem) {
    console.log('🛒 장바구니에 메뉴 추가:', menuItem.name);

    const cartItems = POSStateManager.getCartItems();
    const existingItem = cartItems.find(item => item.id === menuItem.id);

    if (existingItem) {
      // 기존 아이템 수량 증가
      existingItem.quantity += 1;
      showPOSNotification(`${menuItem.name} 수량: ${existingItem.quantity}개`, 'info');
    } else {
      // 새 아이템 추가
      const cartItem = {
        id: menuItem.id,
        name: menuItem.name,
        price: menuItem.price,
        quantity: 1,
        notes: '', // Assuming notes are handled differently or defaulted
        addedAt: new Date().toISOString()
      };
      cartItems.push(cartItem);
      showPOSNotification(`${menuItem.name} 장바구니 추가`, 'success');
    }

    POSStateManager.setCartItems(cartItems);
    this.updateUI();

    console.log(`✅ 장바구니 업데이트 완료: ${cartItems.length}개 아이템`);
  }

  // 🏆 장바구니 → 주문 확정 (DB 저장)
  static async confirmCartOrder() {
    console.log('🏆 주문 확정 시작');

    const cartItems = POSStateManager.getCartItems();
    const currentStore = POSStateManager.getCurrentStore();
    const currentTable = POSStateManager.getCurrentTable();

    if (cartItems.length === 0) {
      showPOSNotification('장바구니가 비어있습니다', 'warning');
      return;
    }

    if (!currentStore || !currentTable) {
      showPOSNotification('매장 또는 테이블 정보가 없습니다', 'error');
      return;
    }

    try {
      const totalAmount = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);

      const orderData = {
        storeId: currentStore.id,
        storeName: currentStore.name,
        tableNumber: currentTable,
        items: cartItems,
        totalAmount: totalAmount,
        orderType: 'POS',
        timestamp: new Date().toISOString()
      };

      console.log('📦 주문 데이터 DB 저장:', orderData);

      const response = await fetch('/api/pos/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(orderData)
      });

      // Check response status before parsing JSON
      if (!response.ok) {
        const errorText = await response.text(); // Get error details from response body
        throw new Error(`HTTP ${response.status}: ${errorText || '서버 오류'}`);
      }

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || '주문 저장 실패');
      }

      // 장바구니 → 확정 주문으로 이동
      const confirmedItems = cartItems.map((item, index) => ({
        id: result.itemIds ? result.itemIds[index] : `confirmed_${Date.now()}_${index}`,
        name: item.name,
        price: item.price,
        quantity: item.quantity,
        notes: item.notes,
        status: 'ordered',
        checkId: result.checkId,
        confirmedAt: new Date().toISOString()
      }));

      // 상태 업데이트
      const existingConfirmed = POSStateManager.getConfirmedItems();
      POSStateManager.setConfirmedItems([...existingConfirmed, ...confirmedItems]);
      POSStateManager.setCartItems([]); // 장바구니 비우기

      // 세션 정보 설정
      POSStateManager.setCurrentSession({
        checkId: result.checkId,
        status: 'ordering'
      });

      this.updateUI();
      showPOSNotification(`${confirmedItems.length}개 메뉴 주문 완료!`, 'success');
      console.log(`✅ 주문 확정 완료 - 체크 ID: ${result.checkId}`);

    } catch (error) {
      console.error('❌ 주문 확정 실패:', error);
      showPOSNotification('주문 확정 실패: ' + error.message, 'error');
    }
  }

  // 🔢 장바구니 수량 변경
  static changeCartQuantity(itemId, change) {
    const cartItems = POSStateManager.getCartItems();
    const item = cartItems.find(item => item.id === itemId);

    if (!item) {
      showPOSNotification('장바구니 아이템을 찾을 수 없습니다', 'warning');
      return;
    }

    item.quantity += change;

    if (item.quantity <= 0) {
      const index = cartItems.indexOf(item);
      cartItems.splice(index, 1);
      showPOSNotification(`${item.name} 장바구니에서 제거`, 'info');
    } else {
      showPOSNotification(`${item.name} 수량: ${item.quantity}개`, 'info');
    }

    POSStateManager.setCartItems(cartItems);
    this.updateUI();
  }

  // 🗑️ 장바구니 비우기
  static clearCart() {
    POSStateManager.setCartItems([]);
    this.updateUI();
    showPOSNotification('장바구니 비우기 완료', 'info');
    console.log('🗑️ 장바구니 비우기 완료');
  }

  // 🎯 Primary Action 핸들러 (장바구니 → 주문 확정)
  static handlePrimaryAction() {
    console.log('🎯 Primary Action: 주문 확정 버튼 클릭');

    const cartItems = POSStateManager.getCartItems();

    if (cartItems.length > 0) {
      this.confirmCartOrder();
    } else {
      console.log('⚠️ 장바구니가 비어있음');
      showPOSNotification('장바구니가 비어있습니다', 'warning');
    }
  }

  // 🎨 UI 업데이트
  static updateUI() {
    try {
      console.log('🎨 UI 업데이트 시작');

      // POSUIRenderer 확인 및 호출
      if (typeof POSUIRenderer !== 'undefined' && POSUIRenderer) {
        POSUIRenderer.renderOrderItems();
        POSUIRenderer.renderPaymentSummary();
        POSUIRenderer.updatePrimaryActionButton();
        console.log('✅ UI 업데이트 완료');
      } else if (typeof window.POSUIRenderer !== 'undefined' && window.POSUIRenderer) {
        window.POSUIRenderer.renderOrderItems();
        window.POSUIRenderer.renderPaymentSummary();
        window.POSUIRenderer.updatePrimaryActionButton();
        console.log('✅ UI 업데이트 완료 (window 전역)');
      } else {
        console.warn('⚠️ POSUIRenderer를 찾을 수 없습니다. 직접 DOM 업데이트를 시도합니다.');

        // 직접 DOM 업데이트 시도
        this.directUIUpdate();
      }
    } catch (error) {
      console.error('❌ UI 업데이트 실패:', error);
      // 에러 발생 시에도 직접 업데이트 시도
      this.directUIUpdate();
    }
  }

  // 🔧 직접 DOM 업데이트 (fallback)
  static directUIUpdate() {
    try {
      console.log('🔧 직접 DOM 업데이트 시도');

      const cartItems = POSStateManager.getCartItems();
      const primaryBtn = document.getElementById('primaryActionBtn');

      if (primaryBtn) {
        if (cartItems.length > 0) {
          const totalAmount = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);

          primaryBtn.innerHTML = `
            <div class="btn-content">
              <span class="btn-title">🏆 주문 확정</span>
              <span class="btn-subtitle">${cartItems.length}개 메뉴 • ₩${totalAmount.toLocaleString()}</span>
            </div>
          `;
          primaryBtn.className = 'primary-action-btn confirm-order active';
          primaryBtn.disabled = false;

          console.log(`✅ 직접 업데이트: 주문 확정 버튼 활성화 (${cartItems.length}개)`);
        } else {
          primaryBtn.innerHTML = `
            <div class="btn-content">
              <span class="btn-title">🛒 주문 확정</span>
              <span class="btn-subtitle">메뉴를 선택하세요</span>
            </div>
          `;
          primaryBtn.className = 'primary-action-btn disabled';
          primaryBtn.disabled = true;

          console.log('⚪ 직접 업데이트: 주문 확정 버튼 비활성화');
        }
      }

      // 주문 목록 직접 업데이트
      this.directUpdateOrderItems();

    } catch (error) {
      console.error('❌ 직접 DOM 업데이트 실패:', error);
    }
  }

  // 🔧 주문 목록 직접 업데이트
  static directUpdateOrderItems() {
    try {
      const orderItemsContainer = document.getElementById('orderItemsContainer');
      if (!orderItemsContainer) {
        console.warn('⚠️ orderItemsContainer 요소를 찾을 수 없습니다');
        return;
      }

      const cartItems = POSStateManager.getCartItems();
      const confirmedItems = POSStateManager.getConfirmedItems();

      let html = '';

      // 장바구니 아이템들
      if (cartItems.length > 0) {
        html += '<div class="cart-section"><h4>🛒 장바구니</h4>';
        cartItems.forEach(item => {
          html += `
            <div class="order-item cart-item">
              <div class="item-info">
                <span class="item-name">${item.name}</span>
                <span class="item-price">₩${(item.price * item.quantity).toLocaleString()}</span>
              </div>
              <div class="item-controls">
                <button onclick="POSOrderManager.changeCartQuantity('${item.id}', -1)">-</button>
                <span class="quantity">${item.quantity}</span>
                <button onclick="POSOrderManager.changeCartQuantity('${item.id}', 1)">+</button>
              </div>
            </div>
          `;
        });
        html += '</div>';
      }

      // 확정된 주문들
      if (confirmedItems.length > 0) {
        html += '<div class="confirmed-section"><h4>✅ 확정 주문</h4>';
        confirmedItems.forEach(item => {
          html += `
            <div class="order-item confirmed-item">
              <div class="item-info">
                <span class="item-name">${item.name}</span>
                <span class="item-price">₩${(item.price * item.quantity).toLocaleString()}</span>
              </div>
              <div class="item-status">
                <span class="quantity">${item.quantity}개</span>
                <span class="status">${item.status || 'ordered'}</span>
              </div>
            </div>
          `;
        });
        html += '</div>';
      }

      if (cartItems.length === 0 && confirmedItems.length === 0) {
        html = '<div class="no-items">선택된 메뉴가 없습니다</div>';
      }

      orderItemsContainer.innerHTML = html;
      console.log(`🔧 직접 주문 목록 업데이트: 장바구니 ${cartItems.length}개, 확정 ${confirmedItems.length}개`);

    } catch (error) {
      console.error('❌ 직접 주문 목록 업데이트 실패:', error);
    }
  }

  // 🔄 UI 강제 업데이트
  static forceUIUpdate() {
    setTimeout(() => {
      this.updateUI();
    }, 50);
  }

  // 📋 테이블 주문 로드 (확정된 주문만)
  static async loadTableOrders(tableNumber) {
    console.log(`📋 테이블 ${tableNumber} 주문 로드 시작`);

    try {
      const currentStore = POSStateManager.getCurrentStore();
      if (!currentStore) {
        console.warn('⚠️ 현재 매장 정보 없음');
        return;
      }

      const response = await fetch(`/api/pos/orders?storeId=${currentStore.id}&tableNumber=${tableNumber}`);

      if (!response.ok) {
        console.warn(`⚠️ 테이블 ${tableNumber} 주문 로드 실패: ${response.status}`);
        POSStateManager.setConfirmedItems([]);
        return;
      }

      const data = await response.json();
      const confirmedItems = data.orders || [];

      POSStateManager.setConfirmedItems(confirmedItems);
      console.log(`✅ 테이블 ${tableNumber} 확정 주문 ${confirmedItems.length}개 로드 완료`);

    } catch (error) {
      console.error('❌ 테이블 주문 로드 실패:', error);
      POSStateManager.setConfirmedItems([]);
    }
  }

  // 🚪 페이지 이탈 시 장바구니 정리
  static handlePageUnload() {
    const cartItems = POSStateManager.getCartItems();
    if (cartItems.length > 0) {
      console.log(`🗑️ 페이지 이탈: 장바구니 ${cartItems.length}개 아이템 자동 삭제`);
      POSStateManager.setCartItems([]);
    }
  }
}

// 전역 함수로 노출
window.POSOrderManager = POSOrderManager;