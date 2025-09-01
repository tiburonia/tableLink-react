// POS 주문 관리 모듈 - 새 시스템 전용
import { POSStateManager } from './posStateManager.js';
import { POSDataLoader } from './posDataLoader.js';
import { POSTempStorage } from './posTempStorage.js';
import { POSUIRenderer } from './posUIRenderer.js';
import { showPOSNotification } from '../../../utils/posNotification.js';

export class POSOrderManager {

  // 🚀 세션 초기화
  static async initializeSession(tableNumber) {
    try {
      const currentStore = POSStateManager.getCurrentStore();
      console.log(`🚀 새 시스템: 테이블 ${tableNumber} 세션 초기화`);

      // 기존 세션 상태 조회
      const sessionResponse = await fetch(`/api/pos/stores/${currentStore.id}/table/${tableNumber}/session-status`);
      const sessionData = await sessionResponse.json();

      if (!sessionData.success) {
        throw new Error('세션 상태 조회 실패: ' + sessionData.error);
      }

      // 확정된 주문 로드
      const confirmedOrders = await POSDataLoader.loadTableOrders(tableNumber, currentStore.id);

      // 임시 주문 복구
      const pendingItems = POSTempStorage.loadTempOrder();

      // 상태 설정
      POSStateManager.setConfirmedItems(confirmedOrders);
      POSStateManager.setPendingItems(pendingItems);

      if (sessionData.hasActiveSession) {
        POSStateManager.setCurrentSession({
          checkId: sessionData.sessionInfo.checkId,
          status: sessionData.sessionInfo.status,
          openedAt: sessionData.sessionInfo.startTime,
          customerName: sessionData.sessionInfo.customerName
        });
      }

      this.updateCombinedOrder();
      console.log(`✅ 새 시스템: 세션 초기화 완료 - 확정: ${confirmedOrders.length}, 임시: ${pendingItems.length}`);

    } catch (error) {
      console.error('❌ 새 시스템: 세션 초기화 실패:', error);
      throw error;
    }
  }

  // 🍽️ 메뉴를 임시 주문에 추가
  static addMenuToPending(menuName, price, notes = '') {
    try {
      const currentTable = POSStateManager.getCurrentTable();
      if (!currentTable) {
        showPOSNotification('테이블이 선택되지 않았습니다.', 'warning');
        return false;
      }

      console.log(`🍽️ 새 시스템: 메뉴 추가 시작 - ${menuName} (₩${price})`);

      // 유효성 검사
      if (!menuName || !price) {
        console.error('❌ 메뉴명 또는 가격이 없습니다');
        showPOSNotification('메뉴 정보가 올바르지 않습니다', 'error');
        return false;
      }

      const numericPrice = parseInt(price);
      if (isNaN(numericPrice) || numericPrice < 0) {
        console.error('❌ 잘못된 가격:', price);
        showPOSNotification('올바른 가격을 입력해주세요', 'error');
        return false;
      }

      const pendingItems = [...POSStateManager.getPendingItems()]; // 배열 복사
      const existingItem = pendingItems.find(item => item.name === menuName && !item.isDeleted);

      if (existingItem) {
        existingItem.quantity += 1;
        existingItem.updatedAt = new Date().toISOString();
        console.log(`📈 기존 아이템 수량 증가: ${menuName} -> ${existingItem.quantity}개`);
        showPOSNotification(`${menuName} 수량 +1 (총 ${existingItem.quantity}개)`, 'info');
      } else {
        const newItem = {
          id: `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          name: menuName,
          price: numericPrice,
          quantity: 1,
          discount: 0,
          notes: notes || '',
          status: 'pending',
          isPending: true,
          isConfirmed: false,
          isDeleted: false,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        pendingItems.push(newItem);
        console.log(`➕ 새 아이템 추가:`, newItem);
        showPOSNotification(`${menuName} 임시 주문 추가`, 'success');
      }

      // 상태 업데이트
      POSStateManager.setPendingItems(pendingItems);
      this.updateCombinedOrder();
      POSTempStorage.saveTempOrder();

      console.log(`📊 현재 임시 주문: ${pendingItems.length}개 아이템`);

      // UI 강제 업데이트
      this.forceUIUpdate();
      
      console.log(`✅ 새 시스템: 메뉴 추가 완료`);
      return true;

    } catch (error) {
      console.error('❌ 메뉴 추가 중 오류:', error);
      showPOSNotification('메뉴 추가 실패: ' + error.message, 'error');
      return false;
    }
  }

  // 🏆 임시 주문 확정
  static async confirmPendingOrder() {
    const pendingItems = POSStateManager.getPendingItems().filter(item => !item.isDeleted);

    if (pendingItems.length === 0) {
      showPOSNotification('확정할 임시 주문이 없습니다.', 'warning');
      return;
    }

    try {
      console.log(`🏆 새 시스템: ${pendingItems.length}개 임시 주문 확정 시작`);

      const currentStore = POSStateManager.getCurrentStore();
      const currentTable = POSStateManager.getCurrentTable();

      // 주문 데이터 구성
      const orderData = {
        storeId: currentStore.id,
        storeName: currentStore.name,
        tableNumber: currentTable,
        items: pendingItems.map(item => ({
          name: item.name,
          price: item.price,
          quantity: item.quantity,
          discount: item.discount || 0,
          notes: item.notes || ''
        })),
        totalAmount: pendingItems.reduce((sum, item) => 
          sum + ((item.price - (item.discount || 0)) * item.quantity), 0
        ),
        customerName: '포스 주문',
        batchType: 'POS_ORDER'
      };

      // API 호출
      const response = await fetch('/api/pos/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderData)
      });

      const result = await response.json();
      if (!result.success) {
        throw new Error(result.error);
      }

      // 임시 → 확정 전환
      const confirmedItems = pendingItems.map((item, index) => ({
        ...item,
        id: result.itemIds ? result.itemIds[index] : `confirmed_${Date.now()}_${index}`,
        status: 'ordered',
        isConfirmed: true,
        isPending: false,
        checkId: result.checkId,
        confirmedAt: new Date().toISOString()
      }));

      // 상태 업데이트
      const existingConfirmed = POSStateManager.getConfirmedItems();
      POSStateManager.setConfirmedItems([...existingConfirmed, ...confirmedItems]);
      POSStateManager.setPendingItems([]);

      // 세션 업데이트
      POSStateManager.setCurrentSession({
        checkId: result.checkId,
        status: 'ordering'
      });

      this.updateCombinedOrder();
      POSTempStorage.clearTempOrder();
      this.refreshUI();

      showPOSNotification(`${confirmedItems.length}개 아이템 확정 완료!`, 'success');
      console.log(`✅ 새 시스템: 주문 확정 완료 - 배치 ID: ${result.checkId}`);

    } catch (error) {
      console.error('❌ 새 시스템: 주문 확정 실패:', error);
      showPOSNotification('주문 확정 실패: ' + error.message, 'error');
    }
  }

  // 🔄 통합 주문 업데이트
  static updateCombinedOrder() {
    const confirmedItems = POSStateManager.getConfirmedItems();
    const pendingItems = POSStateManager.getPendingItems();

    const allItems = [
      ...confirmedItems.map(item => ({ ...item, isConfirmed: true, isPending: false })),
      ...pendingItems.map(item => ({ ...item, isConfirmed: false, isPending: true }))
    ];

    POSStateManager.setCurrentOrder(allItems);
    console.log(`🔄 새 시스템: 통합 주문 업데이트 - 총 ${allItems.length}개`);
  }

  // 🎨 UI 강제 업데이트
  static forceUIUpdate() {
    console.log('🎨 새 시스템: UI 강제 업데이트 시작');

    try {
      if (typeof POSUIRenderer !== 'undefined') {
        // 즉시 실행
        POSUIRenderer.renderOrderItems();
        POSUIRenderer.renderPaymentSummary();
        POSUIRenderer.updatePrimaryActionButton();
        
        // 추가 안전 업데이트 (비동기)
        setTimeout(() => {
          POSUIRenderer.renderOrderItems();
          console.log('✅ 새 시스템: UI 강제 업데이트 완료');
        }, 10);
        
        // 최종 안전 업데이트
        setTimeout(() => {
          POSUIRenderer.renderOrderItems();
        }, 100);
      } else {
        console.error('❌ POSUIRenderer를 찾을 수 없습니다');
      }
    } catch (error) {
      console.error('❌ UI 업데이트 실패:', error);
    }
  }

  // 🎨 UI 새로고침 (기존 호환성)
  static refreshUI() {
    this.forceUIUpdate();
  }

  // 💳 결제 처리
  static async processPayment(paymentMethod) {
    try {
      const session = POSStateManager.getCurrentSession();
      const currentStore = POSStateManager.getCurrentStore();
      const currentTable = POSStateManager.getCurrentTable();

      if (!session.checkId) {
        throw new Error('활성 세션이 없습니다');
      }

      // 임시 주문이 있으면 먼저 확정 요청
      const pendingItems = POSStateManager.getPendingItems().filter(item => !item.isDeleted);
      if (pendingItems.length > 0) {
        const confirmFirst = confirm(`임시 주문 ${pendingItems.length}개가 있습니다. 먼저 확정하고 결제하시겠습니까?`);
        if (confirmFirst) {
          await this.confirmPendingOrder();
          setTimeout(() => this.processPayment(paymentMethod), 1000);
          return;
        }
      }

      console.log(`💳 새 시스템: 세션 ${session.checkId} 결제 - ${paymentMethod}`);

      const response = await fetch(`/api/pos/stores/${currentStore.id}/table/${currentTable}/payment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paymentMethod })
      });

      const result = await response.json();
      if (!result.success) {
        throw new Error(result.error);
      }

      // 세션 상태 업데이트
      POSStateManager.setCurrentSession({
        status: result.sessionSummary.isFullyPaid ? 'closed' : 'payment_processing',
        paidAmount: result.sessionSummary.paidAmount,
        remainingAmount: result.sessionSummary.remainingAmount
      });

      this.refreshUI();

      if (result.sessionSummary.isFullyPaid) {
        showPOSNotification('결제 완료! 세션 종료됨', 'success');
        this.handleSessionClosure();
      } else {
        showPOSNotification(`부분 결제 완료 (잔액: ₩${result.sessionSummary.remainingAmount.toLocaleString()})`, 'info');
      }

    } catch (error) {
      console.error('❌ 새 시스템: 결제 실패:', error);
      showPOSNotification('결제 실패: ' + error.message, 'error');
    }
  }

  // 🏁 세션 종료
  static handleSessionClosure() {
    POSStateManager.setPendingItems([]);
    POSTempStorage.clearTempOrder();
    console.log('🏁 새 시스템: 세션 종료 완료');
  }

  // 🗑️ 주문 초기화
  static clearOrder() {
    POSStateManager.setPendingItems([]);
    POSStateManager.clearSelectedItems();
    POSTempStorage.clearTempOrder();
    this.updateCombinedOrder();
    this.refreshUI();
    showPOSNotification('임시 주문 초기화됨', 'info');
    console.log('🗑️ 새 시스템: 주문 초기화 완료');
  }

  // 🔢 수량 변경
  static changeQuantity(itemId, change) {
    const pendingItems = POSStateManager.getPendingItems();
    const item = pendingItems.find(item => item.id === itemId);

    if (!item) {
      showPOSNotification('임시 주문에서만 수량 변경 가능합니다', 'warning');
      return;
    }

    item.quantity += change;

    if (item.quantity <= 0) {
      const index = pendingItems.indexOf(item);
      pendingItems.splice(index, 1);
      showPOSNotification(`${item.name} 제거됨`, 'info');
    } else {
      showPOSNotification(`${item.name} 수량: ${item.quantity}개`, 'info');
    }

    POSStateManager.setPendingItems(pendingItems);
    this.updateCombinedOrder();
    POSTempStorage.saveTempOrder();
    this.refreshUI();
  }

  // 🎯 아이템 선택/해제
  static toggleItemSelection(itemId) {
    const selectedItems = POSStateManager.getSelectedItems();
    const index = selectedItems.indexOf(itemId);

    if (index === -1) {
      selectedItems.push(itemId);
    } else {
      selectedItems.splice(index, 1);
    }

    POSStateManager.setSelectedItems(selectedItems);
    this.refreshUI();
  }

  // 🗑️ 선택된 아이템 삭제
  static async deleteSelectedItems() {
    const selectedItems = POSStateManager.getSelectedItems();

    if (selectedItems.length === 0) {
      showPOSNotification('삭제할 아이템을 선택해주세요', 'warning');
      return;
    }

    // 임시 아이템만 즉시 삭제
    const pendingItems = POSStateManager.getPendingItems();
    const filteredPending = pendingItems.filter(item => !selectedItems.includes(item.id));
    POSStateManager.setPendingItems(filteredPending);

    // 확정된 아이템은 취소 API 호출 필요 (향후 구현)
    const confirmedItems = POSStateManager.getConfirmedItems();
    const confirmedToDelete = confirmedItems.filter(item => selectedItems.includes(item.id));

    if (confirmedToDelete.length > 0) {
      showPOSNotification('확정된 주문 취소 기능은 향후 구현 예정입니다', 'warning');
    }

    POSStateManager.setSelectedItems([]);
    this.updateCombinedOrder();
    POSTempStorage.saveTempOrder();
    this.refreshUI();

    showPOSNotification(`${selectedItems.length - confirmedToDelete.length}개 아이템 삭제됨`, 'success');
  }

  // 🎯 주요 액션 핸들러
  static async handlePrimaryAction() {
    const pendingItems = POSStateManager.getPendingItems().filter(item => !item.isDeleted);
    const session = POSStateManager.getCurrentSession();

    if (pendingItems.length > 0) {
      await this.confirmPendingOrder();
    } else if (session.checkId && session.status !== 'closed') {
      showPOSNotification('결제 버튼을 클릭해주세요', 'info');
    } else {
      showPOSNotification('주문할 메뉴를 추가해주세요', 'warning');
    }
  }

  // 📊 전체 선택
  static selectAllItems() {
    const currentOrder = POSStateManager.getCurrentOrder();
    const allItemIds = currentOrder.map(item => item.id);
    POSStateManager.setSelectedItems(allItemIds);
    this.refreshUI();
    showPOSNotification(`${allItemIds.length}개 아이템 전체 선택`, 'info');
  }

  // 💰 할인 적용
  static applyDiscount(discountType, discountValue) {
    const selectedItems = POSStateManager.getSelectedItems();
    const pendingItems = POSStateManager.getPendingItems();

    if (selectedItems.length === 0) {
      showPOSNotification('할인을 적용할 아이템을 선택해주세요', 'warning');
      return;
    }

    let appliedCount = 0;
    selectedItems.forEach(itemId => {
      const item = pendingItems.find(i => i.id === itemId);
      if (item) {
        if (discountType === 'percent') {
          item.discount = Math.floor(item.price * (discountValue / 100));
        } else {
          item.discount = Math.min(discountValue, item.price);
        }
        appliedCount++;
      }
    });

    if (appliedCount > 0) {
      POSStateManager.setPendingItems(pendingItems);
      this.updateCombinedOrder();
      POSTempStorage.saveTempOrder();
      this.refreshUI();
      showPOSNotification(`${appliedCount}개 아이템에 할인 적용`, 'success');
    } else {
      showPOSNotification('임시 주문에만 할인 적용 가능합니다', 'warning');
    }
  }

  // 📋 세션 로드 (기존 함수명 호환)
  static async loadTableOrders(tableNumber) {
    await this.initializeSession(tableNumber);
  }

  // 🍽️ 메뉴 추가 (기존 함수명 호환)
  static addMenuToOrder(menuName, price, notes = '') {
    this.addMenuToPending(menuName, price, notes);
  }

  // 🏆 주문 확정 (기존 함수명 호환)
  static async confirmOrder() {
    await this.confirmPendingOrder();
  }

  // 🗑️ 임시 주문 초기화 (기존 함수명 호환)
  static clearTempOrder() {
    this.clearOrder();
  }
}