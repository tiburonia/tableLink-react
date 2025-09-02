// POS 주문 관리 모듈 - 단순 장바구니 방식
import { POSStateManager } from './posStateManager.js';
import { showPOSNotification } from '../../../utils/posNotification.js'; // Ensure this import is present if showPOSNotification is used in new methods

export class POSOrderManager {

  // 🛒 장바구니에 메뉴 추가
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
      // Ensure POSUIRenderer is available before calling its methods
      if (typeof POSUIRenderer !== 'undefined' && POSUIRenderer) {
        POSUIRenderer.renderOrderItems();
        POSUIRenderer.renderPaymentSummary();
        POSUIRenderer.updatePrimaryActionButton();
      } else {
        console.warn('POSUIRenderer is not defined or available. UI updates may not occur.');
      }
    } catch (error) {
      console.error('❌ UI 업데이트 실패:', error);
    }
  }

  // 🔄 UI 강제 업데이트
  static forceUIUpdate() {
    setTimeout(() => {
      this.updateUI();
    }, 50);
  }
}

// 전역 함수로 노출
window.POSOrderManager = POSOrderManager;