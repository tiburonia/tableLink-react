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
          const totalQuantity = cartItems.reduce((sum, item) => sum + item.quantity, 0);

          primaryBtn.innerHTML = `
            <div class="btn-content">
              <span class="btn-title">🏆 주문 확정</span>
              <span class="btn-subtitle">${totalQuantity}개 메뉴 • ₩${totalAmount.toLocaleString()}</span>
            </div>
          `;
          primaryBtn.className = 'primary-action-btn confirm-order active';
          primaryBtn.disabled = false;
          primaryBtn.style.background = 'linear-gradient(135deg, #10b981, #059669)';
          primaryBtn.style.color = 'white';
          primaryBtn.style.cursor = 'pointer';

          console.log(`✅ 직접 업데이트: 주문 확정 버튼 활성화 (장바구니 ${cartItems.length}개, 총 수량 ${totalQuantity}개)`);
        } else {
          primaryBtn.innerHTML = `
            <div class="btn-content">
              <span class="btn-title">🛒 주문 없음</span>
              <span class="btn-subtitle">메뉴를 선택하세요</span>
            </div>
          `;
          primaryBtn.className = 'primary-action-btn disabled';
          primaryBtn.disabled = true;
          primaryBtn.style.background = '#f1f5f9';
          primaryBtn.style.color = '#94a3b8';
          primaryBtn.style.cursor = 'not-allowed';

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
      // orderItemsContainer와 orderItems 둘 다 확인
      let orderItemsContainer = document.getElementById('orderItemsContainer') || document.getElementById('orderItems');
      if (!orderItemsContainer) {
        console.warn('⚠️ orderItemsContainer/orderItems 요소를 찾을 수 없습니다');
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
    // 즉시 업데이트
    this.updateUI();
    
    // 추가 업데이트 (안전장치)
    setTimeout(() => {
      this.updateUI();
    }, 100);
    
    setTimeout(() => {
      this.updateUI();
    }, 300);
  }

  // 🎯 장바구니 추가 후 즉시 UI 업데이트
  static addMenuAndUpdateUI(menuName, price, notes = '') {
    const success = this.addMenuToCart(menuName, price, notes);
    if (success) {
      // 즉시 UI 반영
      this.forceUIUpdate();
    }
    return success;
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

  // 📝 확정된 주문 수정 관리
  static modifiedConfirmedItems = [];
  static originalConfirmedItems = [];

  // ✏️ 확정된 주문 수정 시작
  static startModifyingConfirmedOrders() {
    const confirmedItems = POSStateManager.getConfirmedItems();
    this.originalConfirmedItems = JSON.parse(JSON.stringify(confirmedItems)); // 깊은 복사
    this.modifiedConfirmedItems = [];
    console.log('✏️ 확정된 주문 수정 모드 시작');
  }

  // 🔢 확정된 주문 수량 변경 (선택된 주문들 대상)
  static changeConfirmedQuantity(change) {
    const confirmedItems = POSStateManager.getConfirmedItems();
    const selectedItems = POSStateManager.getSelectedItems();
    
    if (selectedItems.length === 0) {
      showPOSNotification('먼저 수정할 주문을 선택해주세요', 'warning');
      return;
    }

    let modifiedCount = 0;
    selectedItems.forEach(itemId => {
      const item = confirmedItems.find(item => item.id === itemId);
      if (!item) return;

      // 수정된 아이템 기록
      if (!this.modifiedConfirmedItems.find(m => m.id === itemId)) {
        this.modifiedConfirmedItems.push({
          id: itemId,
          originalQuantity: item.quantity,
          action: 'modify'
        });
      }

      item.quantity += change;

      if (item.quantity <= 0) {
        // 삭제로 처리
        const modifiedItem = this.modifiedConfirmedItems.find(m => m.id === itemId);
        if (modifiedItem) {
          modifiedItem.action = 'delete';
        }
        
        const index = confirmedItems.indexOf(item);
        confirmedItems.splice(index, 1);
        
        // 선택된 아이템 목록에서도 제거
        const selectedIndex = selectedItems.indexOf(itemId);
        if (selectedIndex > -1) {
          selectedItems.splice(selectedIndex, 1);
        }
      }
      modifiedCount++;
    });

    POSStateManager.setConfirmedItems(confirmedItems);
    POSStateManager.setSelectedItems(selectedItems);
    this.updateUI();
    
    if (change > 0) {
      showPOSNotification(`${modifiedCount}개 주문 수량 증가 (수정 예정)`, 'info');
    } else {
      showPOSNotification(`${modifiedCount}개 주문 수량 감소 (수정 예정)`, 'info');
    }
  }

  // 🗑️ 선택된 확정 주문 삭제
  static deleteSelectedConfirmedItems() {
    const confirmedItems = POSStateManager.getConfirmedItems();
    const selectedItems = POSStateManager.getSelectedItems();

    if (selectedItems.length === 0) {
      showPOSNotification('삭제할 주문을 선택해주세요', 'warning');
      return;
    }

    selectedItems.forEach(itemId => {
      const item = confirmedItems.find(item => item.id === itemId);
      if (item) {
        // 수정된 아이템 기록
        if (!this.modifiedConfirmedItems.find(m => m.id === itemId)) {
          this.modifiedConfirmedItems.push({
            id: itemId,
            originalQuantity: item.quantity,
            action: 'delete'
          });
        }
        
        const index = confirmedItems.indexOf(item);
        confirmedItems.splice(index, 1);
      }
    });

    POSStateManager.setConfirmedItems(confirmedItems);
    POSStateManager.clearSelectedItems();
    this.updateUI();
    showPOSNotification(`${selectedItems.length}개 주문 삭제 예정`, 'info');
  }

  // 💾 확정된 주문 수정사항 DB 반영
  static async saveConfirmedOrderChanges() {
    if (this.modifiedConfirmedItems.length === 0) {
      showPOSNotification('수정된 주문이 없습니다', 'warning');
      return;
    }

    try {
      const currentStore = POSStateManager.getCurrentStore();
      const currentTable = POSStateManager.getCurrentTable();

      const changeData = {
        storeId: currentStore.id,
        tableNumber: currentTable,
        modifications: this.modifiedConfirmedItems,
        timestamp: new Date().toISOString()
      };

      console.log('💾 확정된 주문 수정사항 DB 저장:', changeData);

      const response = await fetch('/api/pos/orders/modify', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(changeData)
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorText || '서버 오류'}`);
      }

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || '주문 수정 실패');
      }

      // 수정 완료 후 초기화
      this.modifiedConfirmedItems = [];
      this.originalConfirmedItems = [];

      showPOSNotification('주문 수정사항이 저장되었습니다', 'success');
      console.log('✅ 확정된 주문 수정 완료');

    } catch (error) {
      console.error('❌ 확정된 주문 수정 실패:', error);
      showPOSNotification('주문 수정 실패: ' + error.message, 'error');
    }
  }

  // ❌ 확정된 주문 수정 취소
  static cancelConfirmedOrderChanges() {
    if (this.modifiedConfirmedItems.length === 0) {
      showPOSNotification('수정된 주문이 없습니다', 'info');
      return;
    }

    // 원본 상태로 복원
    POSStateManager.setConfirmedItems(this.originalConfirmedItems);
    POSStateManager.clearSelectedItems();
    
    this.modifiedConfirmedItems = [];
    this.originalConfirmedItems = [];
    
    this.updateUI();
    showPOSNotification('주문 수정이 취소되었습니다', 'info');
    console.log('❌ 확정된 주문 수정 취소');
  }

  // 🎯 Primary Action 핸들러 업데이트
  static handlePrimaryAction() {
    console.log('🎯 Primary Action: 주문 확정 버튼 클릭');

    const cartItems = POSStateManager.getCartItems();
    const hasModifications = this.modifiedConfirmedItems.length > 0;

    if (cartItems.length > 0) {
      // 장바구니가 있으면 주문 확정
      this.confirmCartOrder();
    } else if (hasModifications) {
      // 확정된 주문 수정사항이 있으면 DB 저장
      this.saveConfirmedOrderChanges();
    } else {
      console.log('⚠️ 장바구니가 비어있고 수정사항도 없음');
      showPOSNotification('주문할 메뉴를 선택하거나 수정할 주문을 선택해주세요', 'warning');
    }
  }

  // 🎯 확정 주문 선택 토글
  static toggleConfirmedItemSelection(itemId) {
    const selectedItems = POSStateManager.getSelectedItems();
    const index = selectedItems.indexOf(itemId);

    if (index > -1) {
      // 이미 선택된 경우 선택 해제
      selectedItems.splice(index, 1);
      console.log(`🔲 확정 주문 선택 해제: ${itemId}`);
      
      // 모든 선택이 해제되면 수정 모드 종료
      if (selectedItems.length === 0) {
        this.cancelConfirmedOrderChanges();
      }
    } else {
      // 선택되지 않은 경우 선택 추가
      selectedItems.push(itemId);
      console.log(`☑️ 확정 주문 선택: ${itemId}`);
      
      // 첫 번째 선택이면 수정 모드 시작
      if (selectedItems.length === 1) {
        this.startModifyingConfirmedOrders();
      }
    }

    POSStateManager.setSelectedItems(selectedItems);
    this.updateUI();
    
    // 선택 상태 알림
    if (selectedItems.length > 0) {
      showPOSNotification(`${selectedItems.length}개 주문 선택됨`, 'info');
    }
  }

  // 🔲 전체 확정 주문 선택/해제
  static toggleAllConfirmedItems() {
    const confirmedItems = POSStateManager.getConfirmedItems();
    const selectedItems = POSStateManager.getSelectedItems();
    
    if (selectedItems.length === confirmedItems.length && confirmedItems.length > 0) {
      // 전체 선택된 상태면 전체 해제 및 수정 모드 종료
      POSStateManager.setSelectedItems([]);
      this.cancelConfirmedOrderChanges();
      showPOSNotification('전체 선택 해제', 'info');
      console.log('🔲 전체 확정 주문 선택 해제');
    } else {
      // 일부만 선택되거나 아무것도 선택되지 않은 상태면 전체 선택
      const allIds = confirmedItems.map(item => item.id);
      POSStateManager.setSelectedItems(allIds);
      this.startModifyingConfirmedOrders();
      showPOSNotification(`${allIds.length}개 주문 전체 선택`, 'success');
      console.log(`☑️ 전체 확정 주문 선택: ${allIds.length}개`);
    }
    
    this.updateUI();
  }

  // 🚪 페이지 이탈 시 장바구니 정리 및 수정 취소
  static handlePageUnload() {
    const cartItems = POSStateManager.getCartItems();
    if (cartItems.length > 0) {
      console.log(`🗑️ 페이지 이탈: 장바구니 ${cartItems.length}개 아이템 자동 삭제`);
      POSStateManager.setCartItems([]);
    }

    // 확정된 주문 수정사항도 취소
    if (this.modifiedConfirmedItems.length > 0) {
      console.log(`❌ 페이지 이탈: 확정된 주문 수정사항 ${this.modifiedConfirmedItems.length}개 자동 취소`);
      this.modifiedConfirmedItems = [];
      this.originalConfirmedItems = [];
    }
  }
}

// 전역 함수로 노출
window.POSOrderManager = POSOrderManager;