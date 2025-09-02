
// POS 주문 관리 모듈 - 완전 재작성 (간단하고 명확한 로직)
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
      console.log(`🚀 테이블 ${tableNumber} 세션 초기화`);

      // DB에서 확정된 주문 로드
      const confirmedOrders = await POSDataLoader.loadTableOrders(tableNumber, currentStore.id);
      
      // 임시 주문 복구
      const pendingItems = POSTempStorage.loadTempOrder();

      // 상태 설정
      POSStateManager.setConfirmedItems(confirmedOrders);
      POSStateManager.setPendingItems(pendingItems);
      POSStateManager.setSelectedItems([]);

      this.refreshUI();
      console.log(`✅ 세션 초기화 완료 - 확정: ${confirmedOrders.length}, 임시: ${pendingItems.length}`);

    } catch (error) {
      console.error('❌ 세션 초기화 실패:', error);
      throw error;
    }
  }

  // 📝 메뉴 추가 (임시 주문에)
  static addMenuToPending(menuName, price, notes = '') {
    try {
      const pendingItems = [...POSStateManager.getPendingItems()];
      const numericPrice = parseInt(price);

      // 같은 메뉴 찾기
      const existingIndex = pendingItems.findIndex(item => 
        item.name === menuName && item.price === numericPrice && item.notes === notes
      );

      if (existingIndex !== -1) {
        // 기존 메뉴 수량 증가
        pendingItems[existingIndex].quantity += 1;
        showPOSNotification(`${menuName} 수량 증가: ${pendingItems[existingIndex].quantity}개`, 'success');
      } else {
        // 새 메뉴 추가
        const newItem = {
          id: `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          name: menuName,
          price: numericPrice,
          quantity: 1,
          notes: notes,
          isPending: true,
          createdAt: new Date().toISOString()
        };
        pendingItems.push(newItem);
        showPOSNotification(`${menuName} 주문 추가`, 'success');
      }

      POSStateManager.setPendingItems(pendingItems);
      POSTempStorage.saveTempOrder();
      this.refreshUI();
      return true;

    } catch (error) {
      console.error('❌ 메뉴 추가 실패:', error);
      showPOSNotification('메뉴 추가 실패', 'error');
      return false;
    }
  }

  // 🏆 임시 주문 확정 (DB에 저장)
  static async confirmPendingOrder() {
    const pendingItems = POSStateManager.getPendingItems();
    if (pendingItems.length === 0) {
      showPOSNotification('확정할 주문이 없습니다', 'warning');
      return;
    }

    try {
      console.log(`🏆 ${pendingItems.length}개 임시 주문 확정 시작`);

      const currentStore = POSStateManager.getCurrentStore();
      const currentTable = POSStateManager.getCurrentTable();

      // API 호출
      const response = await fetch('/api/orders/create-or-add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          storeId: currentStore.id,
          tableNumber: currentTable,
          items: pendingItems.map(item => ({
            name: item.name,
            price: item.price,
            quantity: item.quantity,
            notes: item.notes || ''
          })),
          customerName: '포스 주문',
          sourceSystem: 'POS'
        })
      });

      const result = await response.json();
      if (!result.success) {
        throw new Error(result.error);
      }

      // 확정된 아이템으로 전환
      const confirmedItems = pendingItems.map((item, index) => ({
        id: result.itemIds ? result.itemIds[index] : `confirmed_${Date.now()}_${index}`,
        name: item.name,
        price: item.price,
        quantity: item.quantity,
        notes: item.notes || '',
        isConfirmed: true,
        checkId: result.checkId,
        confirmedAt: new Date().toISOString()
      }));

      // 상태 업데이트
      const existingConfirmed = POSStateManager.getConfirmedItems();
      POSStateManager.setConfirmedItems([...existingConfirmed, ...confirmedItems]);
      POSStateManager.setPendingItems([]);
      POSStateManager.setSelectedItems([]);

      // 세션 정보 저장
      POSStateManager.setCurrentSession({
        checkId: result.checkId,
        status: 'ordering'
      });

      POSTempStorage.clearTempOrder();
      this.refreshUI();

      showPOSNotification(`${confirmedItems.length}개 주문 확정 완료!`, 'success');
      console.log(`✅ 주문 확정 완료 - 체크 ID: ${result.checkId}`);

    } catch (error) {
      console.error('❌ 주문 확정 실패:', error);
      showPOSNotification('주문 확정 실패: ' + error.message, 'error');
    }
  }

  // 🎯 아이템 선택/해제
  static toggleItemSelection(itemId) {
    const selectedItems = POSStateManager.getSelectedItems();
    const index = selectedItems.indexOf(itemId);

    if (index === -1) {
      selectedItems.push(itemId);
      console.log(`✅ 아이템 선택: ${itemId}`);
    } else {
      selectedItems.splice(index, 1);
      console.log(`❌ 아이템 선택 해제: ${itemId}`);
    }

    POSStateManager.setSelectedItems(selectedItems);
    this.refreshUI();
  }

  // 🔢 수량 변경 (임시 주문만)
  static changeQuantity(itemId, change) {
    const pendingItems = POSStateManager.getPendingItems();
    const itemIndex = pendingItems.findIndex(item => item.id === itemId);

    if (itemIndex === -1) {
      showPOSNotification('임시 주문에서만 직접 수량 변경이 가능합니다', 'warning');
      return;
    }

    const item = pendingItems[itemIndex];
    item.quantity += change;

    if (item.quantity <= 0) {
      pendingItems.splice(itemIndex, 1);
      showPOSNotification(`${item.name} 제거됨`, 'info');
    } else {
      showPOSNotification(`${item.name} 수량: ${item.quantity}개`, 'info');
    }

    POSStateManager.setPendingItems(pendingItems);
    POSTempStorage.saveTempOrder();
    this.refreshUI();
  }

  // 🔧 선택된 아이템 수량 변경 (확정 주문 수정용)
  static changeSelectedQuantity(change) {
    const selectedItems = POSStateManager.getSelectedItems();
    if (selectedItems.length === 0) {
      showPOSNotification('수량을 변경할 아이템을 선택해주세요', 'warning');
      return;
    }

    const pendingItems = POSStateManager.getPendingItems();
    const confirmedItems = POSStateManager.getConfirmedItems();
    let changedCount = 0;

    selectedItems.forEach(itemId => {
      // 임시 주문 수량 변경
      const pendingItem = pendingItems.find(item => item.id === itemId);
      if (pendingItem) {
        pendingItem.quantity += change;
        if (pendingItem.quantity <= 0) {
          const index = pendingItems.indexOf(pendingItem);
          pendingItems.splice(index, 1);
        }
        changedCount++;
      }

      // 확정 주문 임시 수정사항 저장
      const confirmedItem = confirmedItems.find(item => item.id === itemId);
      if (confirmedItem) {
        if (!confirmedItem.tempChanges) {
          confirmedItem.tempChanges = {
            originalQuantity: confirmedItem.quantity,
            newQuantity: confirmedItem.quantity
          };
        }
        
        confirmedItem.tempChanges.newQuantity += change;
        confirmedItem.tempChanges.isModified = true;
        
        if (confirmedItem.tempChanges.newQuantity <= 0) {
          confirmedItem.tempChanges.isDeleted = true;
        }
        
        changedCount++;
      }
    });

    if (changedCount > 0) {
      POSStateManager.setPendingItems(pendingItems);
      POSStateManager.setConfirmedItems(confirmedItems);
      POSTempStorage.saveTempOrder();
      this.refreshUI();
      
      showPOSNotification(`${changedCount}개 아이템 수량 변경됨 (확정 아이템은 임시 변경)`, 'success');
    }
  }

  // 🗑️ 선택된 아이템 삭제
  static deleteSelectedItems() {
    const selectedItems = POSStateManager.getSelectedItems();
    if (selectedItems.length === 0) {
      showPOSNotification('삭제할 아이템을 선택해주세요', 'warning');
      return;
    }

    const pendingItems = POSStateManager.getPendingItems();
    const confirmedItems = POSStateManager.getConfirmedItems();
    let deletedCount = 0;

    // 임시 주문 삭제
    const filteredPending = pendingItems.filter(item => {
      if (selectedItems.includes(item.id)) {
        deletedCount++;
        return false;
      }
      return true;
    });

    // 확정 주문 삭제 표시
    confirmedItems.forEach(item => {
      if (selectedItems.includes(item.id)) {
        if (!item.tempChanges) {
          item.tempChanges = { originalQuantity: item.quantity };
        }
        item.tempChanges.isDeleted = true;
        item.tempChanges.isModified = true;
        deletedCount++;
      }
    });

    POSStateManager.setPendingItems(filteredPending);
    POSStateManager.setConfirmedItems(confirmedItems);
    POSStateManager.setSelectedItems([]);
    
    POSTempStorage.saveTempOrder();
    this.refreshUI();

    showPOSNotification(`${deletedCount}개 아이템 삭제됨`, 'success');
  }

  // ✅ 선택된 아이템의 변경사항 확정
  static async confirmSelectedChanges() {
    const selectedItems = POSStateManager.getSelectedItems();
    const pendingItems = POSStateManager.getPendingItems();
    const confirmedItems = POSStateManager.getConfirmedItems();

    // 새로 추가된 임시 아이템
    const newPendingItems = pendingItems.filter(item => selectedItems.includes(item.id));
    
    // 변경사항이 있는 확정 아이템
    const modifiedConfirmedItems = confirmedItems.filter(item => 
      selectedItems.includes(item.id) && item.tempChanges?.isModified
    );

    if (newPendingItems.length === 0 && modifiedConfirmedItems.length === 0) {
      showPOSNotification('확정할 변경사항이 없습니다', 'warning');
      return;
    }

    try {
      const currentStore = POSStateManager.getCurrentStore();
      const currentTable = POSStateManager.getCurrentTable();

      // 1. 새 임시 아이템 확정
      if (newPendingItems.length > 0) {
        const response = await fetch('/api/orders/create-or-add', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            storeId: currentStore.id,
            tableNumber: currentTable,
            items: newPendingItems.map(item => ({
              name: item.name,
              price: item.price,
              quantity: item.quantity,
              notes: item.notes || ''
            })),
            customerName: '포스 주문',
            sourceSystem: 'POS'
          })
        });

        const result = await response.json();
        if (result.success) {
          // 새 확정 아이템 추가
          const newConfirmedItems = newPendingItems.map((item, index) => ({
            id: result.itemIds ? result.itemIds[index] : `confirmed_${Date.now()}_${index}`,
            name: item.name,
            price: item.price,
            quantity: item.quantity,
            notes: item.notes || '',
            isConfirmed: true,
            checkId: result.checkId
          }));

          const existingConfirmed = confirmedItems.filter(item => !selectedItems.includes(item.id) || item.tempChanges?.isModified);
          POSStateManager.setConfirmedItems([...existingConfirmed, ...newConfirmedItems]);
        }
      }

      // 2. 확정 아이템 변경사항 적용
      modifiedConfirmedItems.forEach(item => {
        if (item.tempChanges.isDeleted) {
          item.quantity = 0;
          item.status = 'cancelled';
        } else {
          item.quantity = item.tempChanges.newQuantity;
        }
        delete item.tempChanges; // 임시 변경사항 제거
      });

      // 3. 상태 정리
      const remainingPending = pendingItems.filter(item => !selectedItems.includes(item.id));
      POSStateManager.setPendingItems(remainingPending);
      POSStateManager.setSelectedItems([]);

      POSTempStorage.saveTempOrder();
      this.refreshUI();

      const totalProcessed = newPendingItems.length + modifiedConfirmedItems.length;
      showPOSNotification(`✅ ${totalProcessed}개 변경사항 확정 완료!`, 'success');

    } catch (error) {
      console.error('❌ 변경사항 확정 실패:', error);
      showPOSNotification('변경사항 확정 실패: ' + error.message, 'error');
    }
  }

  // 🗑️ 주문 초기화
  static clearOrder() {
    POSStateManager.setPendingItems([]);
    POSStateManager.setSelectedItems([]);
    POSTempStorage.clearTempOrder();
    this.refreshUI();
    showPOSNotification('임시 주문 초기화됨', 'info');
  }

  // 🎨 UI 새로고침
  static refreshUI() {
    try {
      POSUIRenderer.renderOrderItems();
      POSUIRenderer.renderPaymentSummary();
      POSUIRenderer.updatePrimaryActionButton();
    } catch (error) {
      console.error('❌ UI 새로고침 실패:', error);
    }
  }

  // 📋 기본 액션 처리
  static async handlePrimaryAction() {
    const pendingItems = POSStateManager.getPendingItems();
    if (pendingItems.length > 0) {
      await this.confirmPendingOrder();
    } else {
      showPOSNotification('주문할 메뉴를 추가해주세요', 'warning');
    }
  }

  // 레거시 함수명 지원
  static addMenuToOrder(menuName, price, notes = '') {
    return this.addMenuToPending(menuName, price, notes);
  }

  static async confirmOrder() {
    return await this.confirmPendingOrder();
  }

  static async loadTableOrders(tableNumber) {
    return await this.initializeSession(tableNumber);
  }
}
