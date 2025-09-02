// POS 주문 관리 모듈 - 단순 장바구니 방식
import { POSStateManager } from './posStateManager.js';
import { POSDataLoader } from './posDataLoader.js';
import { POSTempStorage } from './posTempStorage.js';
import { POSUIRenderer } from './posUIRenderer.js';
import { showPOSNotification } from '../../../utils/posNotification.js';

export class POSOrderManager {

  // 🚀 세션 초기화 (확정된 주문만 로드)
  static async initializeSession(tableNumber) {
    try {
      const currentStore = POSStateManager.getCurrentStore();
      console.log(`🚀 테이블 ${tableNumber} 세션 초기화`);

      // 확정된 주문만 로드 (DB에서)
      const confirmedOrders = await POSDataLoader.loadTableOrders(tableNumber, currentStore.id);

      // 장바구니는 항상 빈 상태로 시작
      POSStateManager.setConfirmedItems(confirmedOrders);
      POSStateManager.setCartItems([]); // 장바구니로 이름 변경

      console.log(`✅ 세션 초기화 완료 - 확정 주문: ${confirmedOrders.length}개, 장바구니: 0개`);

    } catch (error) {
      console.error('❌ 세션 초기화 실패:', error);
      throw error;
    }
  }

  // 🛒 장바구니에 메뉴 추가 (DB 저장 없음)
  static addMenuToCart(menuName, price, notes = '') {
    try {
      console.log(`🛒 장바구니 추가: ${menuName} (₩${price})`);

      const numericPrice = parseInt(price);
      if (isNaN(numericPrice) || numericPrice <= 0) {
        throw new Error('가격이 유효하지 않습니다');
      }

      const cartItems = [...POSStateManager.getCartItems()];

      // 같은 메뉴가 있으면 수량 증가
      const existingItemIndex = cartItems.findIndex(item => 
        item.name === menuName && 
        item.price === numericPrice &&
        item.notes === notes
      );

      if (existingItemIndex !== -1) {
        cartItems[existingItemIndex].quantity += 1;
        console.log(`🔄 기존 메뉴 수량 증가: ${menuName} (${cartItems[existingItemIndex].quantity}개)`);
        showPOSNotification(`${menuName} 수량: ${cartItems[existingItemIndex].quantity}개`, 'success');
      } else {
        const newItem = {
          id: `cart_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          name: menuName,
          price: numericPrice,
          quantity: 1,
          notes: notes,
          isCart: true
        };

        cartItems.push(newItem);
        console.log('✅ 새 메뉴 장바구니 추가:', newItem);
        showPOSNotification(`${menuName} 장바구니에 추가`, 'success');
      }

      POSStateManager.setCartItems(cartItems);
      this.updateUI();

      console.log(`🛒 현재 장바구니: ${cartItems.length}개 메뉴`);
      return true;

    } catch (error) {
      console.error('❌ 장바구니 추가 실패:', error);
      showPOSNotification('장바구니 추가 실패: ' + error.message, 'error');
      return false;
    }
  }

  // 🏆 장바구니 → DB 주문 확정
  static async confirmCartOrder() {
    const cartItems = POSStateManager.getCartItems();

    if (cartItems.length === 0) {
      showPOSNotification('장바구니가 비어있습니다', 'warning');
      return;
    }

    try {
      console.log(`🏆 장바구니 주문 확정: ${cartItems.length}개 메뉴`);

      const currentStore = POSStateManager.getCurrentStore();
      const currentTable = POSStateManager.getCurrentTable();

      // 주문 데이터 구성
      const orderData = {
        storeId: currentStore.id,
        storeName: currentStore.name,
        tableNumber: currentTable,
        items: cartItems.map(item => ({
          name: item.name,
          price: item.price,
          quantity: item.quantity,
          notes: item.notes || ''
        })),
        totalAmount: cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0),
        customerName: '포스 주문'
      };

      // DB에 주문 저장
      const response = await fetch('/api/pos/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderData)
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: 서버 오류`);
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
      if (typeof POSUIRenderer !== 'undefined') {
        POSUIRenderer.renderOrderItems();
        POSUIRenderer.renderPaymentSummary();
        POSUIRenderer.updatePrimaryActionButton();
      }
    } catch (error) {
      console.error('❌ UI 업데이트 실패:', error);
    }
  }

  // 💳 세션 결제 처리
  static async processSessionPayment(paymentMethod, partialAmount = null) {
    try {
      const session = POSStateManager.getCurrentSession();
      const currentStore = POSStateManager.getCurrentStore();
      const currentTable = POSStateManager.getCurrentTable();

      if (!session.checkId) {
        throw new Error('결제할 주문이 없습니다');
      }

      console.log(`💳 세션 결제: ${paymentMethod}, 금액: ${partialAmount || '전액'}`);

      const paymentData = { paymentMethod };
      if (partialAmount && partialAmount > 0) {
        paymentData.partialAmount = partialAmount;
      }

      const response = await fetch(`/api/pos/stores/${currentStore.id}/table/${currentTable}/payment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(paymentData)
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: 서버 오류`);
      }

      const result = await response.json();
      if (!result.success) {
        throw new Error(result.error || '결제 처리 실패');
      }

      // 세션 상태 업데이트
      const updatedSession = {
        ...session,
        status: result.sessionSummary?.isFullyPaid ? 'closed' : 'open',
        paidAmount: result.sessionSummary?.paidAmount || 0,
        remainingAmount: result.sessionSummary?.remainingAmount || 0
      };

      POSStateManager.setCurrentSession(updatedSession);

      if (result.sessionSummary?.isFullyPaid) {
        showPOSNotification(`${paymentMethod} 결제 완료!`, 'success');
        this.handleSessionClosure();
      } else {
        const remaining = result.sessionSummary?.remainingAmount || 0;
        showPOSNotification(`${paymentMethod} 부분결제 완료! 잔액: ₩${remaining.toLocaleString()}`, 'info');
      }

      return { success: true, result };

    } catch (error) {
      console.error('❌ 결제 실패:', error);
      showPOSNotification(`결제 실패: ${error.message}`, 'error');
      throw error;
    }
  }

  // 🏁 세션 종료 처리
  static handleSessionClosure() {
    POSStateManager.setCartItems([]);
    console.log('🏁 세션 종료 완료');
  }

  // 🔄 세션 데이터 새로고침 (확정된 주문만)
  static async refreshSessionData() {
    try {
      const currentTable = POSStateManager.getCurrentTable();
      const currentStore = POSStateManager.getCurrentStore();

      if (!currentTable || !currentStore) return;

      console.log('🔄 세션 데이터 새로고침');

      const ordersResponse = await fetch(`/api/pos/stores/${currentStore.id}/table/${currentTable}/all-orders`);
      const ordersData = await ordersResponse.json();

      if (ordersData.success && ordersData.currentSession) {
        POSStateManager.setCurrentSession({
          checkId: ordersData.currentSession.checkId,
          status: ordersData.currentSession.status,
          customerName: ordersData.currentSession.customerName,
          totalAmount: ordersData.currentSession.totalAmount
        });

        const confirmedItems = ordersData.currentSession.items || [];
        POSStateManager.setConfirmedItems(confirmedItems);

        console.log('✅ 세션 데이터 새로고침 완료');
      }

    } catch (error) {
      console.error('❌ 세션 데이터 새로고침 실패:', error);
    }
  }

  // 화면 이탈 시 장바구니 자동 정리
  static handlePageUnload() {
    POSStateManager.setCartItems([]);
    console.log('📱 화면 이탈 - 장바구니 자동 정리');
  }

  // === 기존 호환성 함수들 ===
  static async loadTableOrders(tableNumber) {
    await this.initializeSession(tableNumber);
  }

  static addMenuToOrder(menuName, price, notes = '') {
    return this.addMenuToCart(menuName, price, notes);
  }

  static async confirmOrder() {
    await this.confirmCartOrder();
  }

  static clearOrder() {
    this.clearCart();
  }

  static forceUIUpdate() {
    this.updateUI();
  }

  static refreshUI() {
    this.updateUI();
  }
}