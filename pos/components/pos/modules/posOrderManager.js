
// POS 주문 관리 모듈
import { POSStateManager } from './posStateManager.js';
import { POSDataLoader } from './posDataLoader.js';
import { POSTempStorage } from './posTempStorage.js';
import { POSUIRenderer } from './posUIRenderer.js';
import { showPOSNotification } from '../../../utils/posNotification.js';

export class POSOrderManager {
  // 테이블 주문 로드
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

  // 선택된 아이템 삭제
  static deleteSelectedItems() {
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
    } else if (pendingItems.length > 0) {
      if (!confirm(`선택된 ${pendingItems.length}개 임시 아이템을 삭제하시겠습니까?`)) {
        return;
      }
    }

    // 확정된 아이템들을 삭제 상태로 임시저장
    confirmedItems.forEach(item => {
      if (item.isConfirmed) {
        const deleteItem = {
          ...item,
          id: `delete_${item.id}_${Date.now()}`,
          quantity: 0,
          isConfirmed: false,
          isPending: true,
          isDeleted: true,
          originalSessionId: item.sessionId
        };
        currentOrder.push(deleteItem);
      }
    });

    // 기존 선택된 아이템들 제거
    const filteredOrder = currentOrder.filter(item => !selectedItems.includes(item.id));
    POSStateManager.setCurrentOrder(filteredOrder);
    POSStateManager.setSelectedItems([]);

    POSTempStorage.saveTempOrder();
    POSUIRenderer.renderOrderItems();
    POSUIRenderer.renderPaymentSummary();
    POSUIRenderer.updatePrimaryActionButton();

    showPOSNotification(`${selectedItemsData.length}개 아이템 삭제 (확정 필요)`, 'warning');
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

  // 주문 확정
  static async confirmOrder() {
    const currentOrder = POSStateManager.getCurrentOrder();
    
    if (!currentOrder || currentOrder.length === 0) {
      showPOSNotification('확정할 주문이 없습니다.', 'warning');
      return;
    }

    const pendingItems = currentOrder.filter(item => item.isPending && !item.isConfirmed);
    const newItems = pendingItems.filter(item => !item.isModified && !item.isDeleted);
    const modifiedItems = pendingItems.filter(item => item.isModified);
    const deletedItems = pendingItems.filter(item => item.isDeleted);

    if (pendingItems.length === 0) {
      showPOSNotification('확정할 새로운 주문이 없습니다.', 'warning');
      return;
    }

    try {
      console.log('📦 주문 확정 시작 - 세션 단위 DB 저장:', {
        new: newItems.length,
        modified: modifiedItems.length,
        deleted: deletedItems.length
      });

      // 새로운 아이템들을 메뉴별로 통합하여 서버로 전송
      if (newItems.length > 0) {
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

        const sessionOrderData = {
          storeId: currentStore.id,
          storeName: currentStore.name,
          tableNumber: currentTable,
          items: finalItems,
          totalAmount: finalItems.reduce((sum, item) => sum + (item.price * item.quantity), 0),
          isTLLOrder: false,
          userId: null,
          guestPhone: null,
          customerName: '포스 주문'
        };

        const response = await fetch('/api/pos/orders', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(sessionOrderData)
        });

        const result = await response.json();
        if (!result.success) {
          throw new Error(result.error || '세션 저장 실패');
        }

        // 새로 추가된 아이템들을 확정 상태로 변경
        newItems.forEach(item => {
          item.isConfirmed = true;
          item.isPending = false;
          item.sessionId = result.orderId;
        });
      }

      // 수정/삭제된 아이템들 처리
      this._handleModifiedAndDeletedItems(modifiedItems, deletedItems, currentOrder);

      POSStateManager.setCurrentOrder(currentOrder);
      POSTempStorage.clearTempOrder();

      POSUIRenderer.renderOrderItems();
      POSUIRenderer.renderPaymentSummary();
      POSUIRenderer.updatePrimaryActionButton();

      const totalChanges = newItems.length + modifiedItems.length + deletedItems.length;
      showPOSNotification(`${totalChanges}개 변경사항이 세션에 확정되었습니다!`, 'success');

      console.log(`✅ 세션 단위 주문 확정 완료 - 신규: ${newItems.length}개, 수정: ${modifiedItems.length}개, 삭제: ${deletedItems.length}개`);

    } catch (error) {
      console.error('❌ 세션 단위 주문 확정 실패:', error);
      showPOSNotification('주문 확정 실패: ' + error.message, 'error');
    }
  }

  // 수정/삭제된 아이템들 처리
  static _handleModifiedAndDeletedItems(modifiedItems, deletedItems, currentOrder) {
    // 수정된 아이템들 처리
    if (modifiedItems.length > 0) {
      modifiedItems.forEach(modifiedItem => {
        // 원본 확정 아이템 제거
        const filteredOrder = currentOrder.filter(item => 
          item.sessionId !== modifiedItem.originalSessionId || 
          item.name !== modifiedItem.name
        );
        POSStateManager.setCurrentOrder(filteredOrder);

        // 수정된 아이템을 확정 상태로 변경
        modifiedItem.isConfirmed = true;
        modifiedItem.isPending = false;
        modifiedItem.isModified = false;
        delete modifiedItem.originalSessionId;
      });
    }

    // 삭제된 아이템들 처리
    if (deletedItems.length > 0) {
      deletedItems.forEach(deletedItem => {
        // 원본 확정 아이템과 삭제 표시 아이템 모두 제거
        const filteredOrder = currentOrder.filter(item => 
          (item.sessionId !== deletedItem.originalSessionId || item.name !== deletedItem.name) &&
          !item.isDeleted
        );
        POSStateManager.setCurrentOrder(filteredOrder);
      });
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
