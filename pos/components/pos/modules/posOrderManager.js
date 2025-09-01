// POS 주문 관리 모듈 - 새 스키마 적용
import { POSStateManager } from './posStateManager.js';
import { POSDataLoader } from './posDataLoader.js';
import { POSTempStorage } from './posTempStorage.js';
import { POSUIRenderer } from './posUIRenderer.js';
import { showPOSNotification } from '../../../utils/posNotification.js';

export class POSOrderManager {
  // 테이블 주문 로드 (새 스키마)
  static async loadTableOrders(tableNumber) {
    try {
      const currentStore = POSStateManager.getCurrentStore();
      const sessionOrders = await POSDataLoader.loadTableOrders(tableNumber, currentStore.id);

      // 임시저장 데이터 복구
      const tempItems = POSTempStorage.loadTempOrder();

      const allOrders = [...sessionOrders, ...tempItems];
      POSStateManager.setCurrentOrder(allOrders);

      if (allOrders.length === 0) {
        console.log(`📭 테이블 ${tableNumber} 주문 없음`);
      } else {
        console.log(`✅ 테이블 ${tableNumber} 세션 주문 ${sessionOrders.length}개, 임시 주문 ${tempItems.length}개 로드`);
      }

    } catch (error) {
      console.error('❌ 주문 로드 실패:', error);
      POSStateManager.setCurrentOrder([]);
    }
  }

  // 메뉴를 주문에 추가
  static addMenuToOrder(menuName, price) {
    const currentTable = POSStateManager.getCurrentTable();
    if (!currentTable) {
      showPOSNotification('테이블이 선택되지 않았습니다.', 'warning');
      return;
    }

    try {
      const currentOrder = POSStateManager.getCurrentOrder();
      const pendingItems = currentOrder.filter(item => item.isPending && !item.isConfirmed && !item.isDeleted);
      const existingPendingItem = pendingItems.find(item => item.name === menuName);

      if (existingPendingItem) {
        existingPendingItem.quantity += 1;
        showPOSNotification(`${menuName} 수량 +1 (총 ${existingPendingItem.quantity}개)`, 'info');
      } else {
        const newItem = {
          id: `item_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          name: menuName,
          price: parseInt(price),
          quantity: 1,
          discount: 0,
          note: '',
          isConfirmed: false,
          isPending: true
        };
        currentOrder.push(newItem);
        showPOSNotification(`${menuName} 추가됨 (확정 필요)`, 'success');
      }

      POSStateManager.setCurrentOrder(currentOrder);
      POSTempStorage.saveTempOrder();

      POSUIRenderer.renderOrderItems();
      POSUIRenderer.renderPaymentSummary();
      POSUIRenderer.updatePrimaryActionButton();

    } catch (error) {
      console.error('❌ 메뉴 추가 실패:', error);
      showPOSNotification('메뉴 추가 중 오류가 발생했습니다.', 'error');
    }
  }

  // 아이템 선택/해제
  static toggleItemSelection(itemId) {
    const selectedItems = POSStateManager.getSelectedItems();
    const index = selectedItems.indexOf(itemId);

    if (index === -1) {
      selectedItems.push(itemId);
    } else {
      selectedItems.splice(index, 1);
    }

    POSStateManager.setSelectedItems(selectedItems);
    POSUIRenderer.renderOrderItems();
  }

  // 전체 선택
  static selectAllItems() {
    const currentOrder = POSStateManager.getCurrentOrder();
    const selectedItems = POSStateManager.getSelectedItems();

    if (selectedItems.length === currentOrder.length) {
      POSStateManager.setSelectedItems([]);
    } else {
      POSStateManager.setSelectedItems(currentOrder.map(item => item.id));
    }

    POSUIRenderer.renderOrderItems();
  }

  // 선택된 아이템 삭제/취소 (새 스키마)
  static async deleteSelectedItems() {
    const selectedItems = POSStateManager.getSelectedItems();
    const currentOrder = POSStateManager.getCurrentOrder();

    if (selectedItems.length === 0) {
      showPOSNotification('삭제할 아이템을 선택해주세요.', 'warning');
      return;
    }

    const selectedItemsData = selectedItems.map(id => 
      currentOrder.find(item => item.id === id)
    ).filter(Boolean);

    const confirmedItems = selectedItemsData.filter(item => item.isConfirmed);
    const pendingItems = selectedItemsData.filter(item => item.isPending);

    if (confirmedItems.length > 0) {
      if (!confirm(`확정된 세션 아이템 ${confirmedItems.length}개와 임시 아이템 ${pendingItems.length}개를 삭제하시겠습니까?`)) {
        return;
      }

      // 확정된 아이템들을 실제 DB에서 취소 처리 (새 스키마)
      for (const item of confirmedItems) {
        try {
          await POSDataLoader.cancelItem(item.id, 'POS에서 취소');
        } catch (error) {
          console.error(`❌ 아이템 ${item.id} 취소 실패:`, error);
          showPOSNotification(`${item.name} 취소 실패: ${error.message}`, 'error');
          return;
        }
      }
    } else if (pendingItems.length > 0) {
      if (!confirm(`선택된 ${pendingItems.length}개 임시 아이템을 삭제하시겠습니까?`)) {
        return;
      }
    }

    // 선택된 아이템들 제거
    const filteredOrder = currentOrder.filter(item => !selectedItems.includes(item.id));
    POSStateManager.setCurrentOrder(filteredOrder);
    POSStateManager.setSelectedItems([]);

    POSTempStorage.saveTempOrder();
    POSUIRenderer.renderOrderItems();
    POSUIRenderer.renderPaymentSummary();
    POSUIRenderer.updatePrimaryActionButton();

    showPOSNotification(`${selectedItemsData.length}개 아이템 삭제 완료`, 'success');
  }

  // 할인 적용
  static applyDiscount() {
    const selectedItems = POSStateManager.getSelectedItems();
    const currentOrder = POSStateManager.getCurrentOrder();

    if (selectedItems.length === 0) {
      showPOSNotification('할인 적용할 아이템을 선택해주세요.', 'warning');
      return;
    }

    const discountAmount = prompt('할인 금액을 입력하세요:');
    if (discountAmount && !isNaN(discountAmount)) {
      const discount = parseInt(discountAmount);

      selectedItems.forEach(itemId => {
        const item = currentOrder.find(item => item.id === itemId);
        if (item) {
          if (item.isConfirmed) {
            const modifiedItem = {
              ...item,
              id: `modified_${item.id}_${Date.now()}`,
              discount: discount,
              isConfirmed: false,
              isPending: true,
              isModified: true,
              originalSessionId: item.sessionId
            };
            currentOrder.push(modifiedItem);
          } else {
            item.discount = discount;
          }
        }
      });

      POSStateManager.setCurrentOrder(currentOrder);
      POSTempStorage.saveTempOrder();

      POSUIRenderer.renderOrderItems();
      POSUIRenderer.renderPaymentSummary();
      POSUIRenderer.updatePrimaryActionButton();

      showPOSNotification(`₩${discount.toLocaleString()} 할인 적용 (확정 필요)`, 'warning');
    }
  }

  // 수량 변경
  static changeQuantity(delta) {
    const selectedItems = POSStateManager.getSelectedItems();
    const currentOrder = POSStateManager.getCurrentOrder();

    if (selectedItems.length === 0) {
      showPOSNotification('수량을 변경할 아이템을 선택해주세요.', 'warning');
      return;
    }

    selectedItems.forEach(itemId => {
      const item = currentOrder.find(item => item.id === itemId);
      if (item) {
        const newQuantity = Math.max(1, item.quantity + delta);

        if (item.isConfirmed) {
          const modifiedItem = {
            ...item,
            id: `modified_${item.id}_${Date.now()}`,
            quantity: newQuantity,
            isConfirmed: false,
            isPending: true,
            isModified: true,
            originalSessionId: item.sessionId
          };
          currentOrder.push(modifiedItem);
        } else {
          item.quantity = newQuantity;
        }
      }
    });

    POSStateManager.setCurrentOrder(currentOrder);
    POSTempStorage.saveTempOrder();

    POSUIRenderer.renderOrderItems();
    POSUIRenderer.renderPaymentSummary();
    POSUIRenderer.updatePrimaryActionButton();

    showPOSNotification('수량 변경 (확정 필요)', 'warning');
  }

  // Primary Action 핸들러
  static handlePrimaryAction() {
    const currentOrder = POSStateManager.getCurrentOrder();
    const hasOrders = currentOrder && currentOrder.length > 0;

    if (hasOrders) {
      this.confirmOrder();
    } else {
      showPOSNotification('주문할 메뉴를 선택해주세요.', 'warning');
    }
  }

  // 세션 단위 주문 확정
  static async confirmOrder() {
    const currentOrder = POSStateManager.getCurrentOrder();

    if (!currentOrder || currentOrder.length === 0) {
      showPOSNotification('확정할 주문이 없습니다.', 'warning');
      return;
    }

    const pendingItems = currentOrder.filter(item => item.isPending && !item.isConfirmed);
    const newItems = pendingItems.filter(item => !item.isModified && !item.isDeleted);

    if (newItems.length === 0) {
      showPOSNotification('확정할 새로운 주문이 없습니다.', 'warning');
      return;
    }

    try {
      console.log('🏆 세션 단위 주문 확정 시작:', {
        신규아이템: newItems.length,
        테이블: POSStateManager.getCurrentTable()
      });

      // 🍽️ 메뉴별로 통합 (같은 메뉴는 수량 합산)
      const consolidatedItems = {};
      newItems.forEach(item => {
        const key = `${item.name}_${item.price}`;
        if (consolidatedItems[key]) {
          consolidatedItems[key].quantity += item.quantity;
        } else {
          consolidatedItems[key] = {
            name: item.name,
            price: item.price,
            quantity: item.quantity
          };
        }
      });

      const finalItems = Object.values(consolidatedItems);
      const currentStore = POSStateManager.getCurrentStore();
      const currentTable = POSStateManager.getCurrentTable();

      // 🏆 세션 단위 주문 데이터 구성
      const sessionOrderData = {
        storeId: currentStore.id,
        storeName: currentStore.name,
        tableNumber: currentTable,
        items: finalItems,
        totalAmount: finalItems.reduce((sum, item) => sum + (item.price * item.quantity), 0),
        userId: null, // 향후 TLL 연동 시 사용
        guestPhone: null,
        customerName: '포스 주문'
      };

      console.log(`📦 세션에 주문 추가: ${finalItems.length}개 메뉴, 총 ₩${sessionOrderData.totalAmount.toLocaleString()}`);

      // 🚀 세션 기반 주문 API 호출
      const response = await fetch('/api/pos/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(sessionOrderData)
      });

      const result = await response.json();
      if (!result.success) {
        throw new Error(result.error || '세션 주문 추가 실패');
      }

      // ✅ 확정된 아이템들을 세션 상태로 변경
      newItems.forEach(item => {
        item.isConfirmed = true;
        item.isPending = false;
        item.sessionId = result.sessionId;
        item.sessionStartTime = result.sessionStartTime;
      });

      POSStateManager.setCurrentOrder(currentOrder);
      POSTempStorage.clearTempOrder();

      POSUIRenderer.renderOrderItems();
      POSUIRenderer.renderPaymentSummary();
      POSUIRenderer.updatePrimaryActionButton();

      const sessionTotals = result.sessionTotals;
      showPOSNotification(
        `세션에 ${newItems.length}개 아이템 추가! 세션 총액: ₩${sessionTotals.finalAmount.toLocaleString()}`, 
        'success'
      );

      console.log(`✅ 세션 주문 확정 완료 - 세션 ID: ${result.sessionId}, 추가 아이템: ${newItems.length}개`);

    } catch (error) {
      console.error('❌ 세션 주문 확정 실패:', error);
      showPOSNotification('세션 주문 확정 실패: ' + error.message, 'error');
    }
  }

  // 전체 주문 삭제
  static clearOrder() {
    const currentOrder = POSStateManager.getCurrentOrder();

    if (currentOrder.length === 0) return;

    if (confirm('현재 주문 내역을 모두 삭제하시겠습니까?')) {
      POSStateManager.setCurrentOrder([]);
      POSStateManager.setSelectedItems([]);
      POSTempStorage.clearTempOrder();

      POSUIRenderer.renderOrderItems();
      POSUIRenderer.renderPaymentSummary();
      POSUIRenderer.updatePrimaryActionButton();

      showPOSNotification('주문 내역이 삭제되었습니다.', 'success');
    }
  }

  // 임시 주문 정리
  static clearTempOrder() {
    const currentOrder = POSStateManager.getCurrentOrder();

    if (currentOrder && currentOrder.length > 0) {
      const pendingItems = currentOrder.filter(item => item.isPending && !item.isConfirmed);

      if (pendingItems.length > 0) {
        console.log(`🗑️ 테이블맵 복귀 - 미확정 주문 ${pendingItems.length}개 삭제`);
        POSTempStorage.clearTempOrder();
      }
    }
  }
}