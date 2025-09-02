/**
 * 완전히 새로운 POS 주문 관리 시스템
 * - 세션 기반 주문 관리
 * - 깔끔한 주문 수정 로직
 * - 시각적 피드백 시스템
 */

class POSOrderManager {
  constructor() {
    this.currentSession = null;
    this.tempOrders = new Map(); // 임시 주문들
    this.selectedItem = null; // 현재 선택된 아이템
    this.isEditMode = false; // 수정 모드 여부
    this.init();
  }

  init() {
    console.log('🔧 새로운 POS 주문 관리자 초기화');
    this.loadCurrentSession();
    this.setupEventListeners();
  }

  // ===========================================
  // 세션 관리
  // ===========================================

  async loadCurrentSession() {
    try {
      const urlParams = new URLSearchParams(window.location.search);
      const storeId = urlParams.get('storeId');
      const tableId = urlParams.get('tableId') || '1';

      if (!storeId) {
        console.error('❌ 매장 ID가 없습니다');
        return;
      }

      // 현재 세션 정보 로드
      this.currentSession = {
        storeId: parseInt(storeId),
        tableId: parseInt(tableId),
        sessionId: `${storeId}_${tableId}_${Date.now()}`
      };

      console.log('✅ 세션 로드 완료:', this.currentSession);

      // 기존 확정된 주문들 로드
      await this.loadConfirmedOrders();

    } catch (error) {
      console.error('❌ 세션 로드 실패:', error);
    }
  }

  async loadConfirmedOrders() {
    try {
      const response = await fetch(`/api/pos/orders/confirmed?storeId=${this.currentSession.storeId}&tableId=${this.currentSession.tableId}`);

      if (response.ok) {
        const data = await response.json();
        console.log('📋 확정된 주문 로드:', data.orders?.length || 0);
        this.refreshUI();
      }
    } catch (error) {
      console.error('❌ 확정된 주문 로드 실패:', error);
    }
  }

  // ===========================================
  // 주문 아이템 관리
  // ===========================================

  addMenuItem(menuItem, quantity = 1) {
    if (!menuItem) return;

    const tempId = `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const orderItem = {
      id: tempId,
      menuId: menuItem.id,
      name: menuItem.name,
      price: menuItem.price,
      quantity: quantity,
      isTemp: true,
      createdAt: new Date().toISOString()
    };

    this.tempOrders.set(tempId, orderItem);

    console.log('➕ 임시 주문 추가:', orderItem.name, 'x', quantity);
    this.refreshUI();
    this.showNotification(`${menuItem.name} ${quantity}개가 추가되었습니다`, 'success');
  }

  // 아이템 선택/해제
  selectItem(itemId, isConfirmed = false) {
    // 이전 선택 해제
    this.clearSelection();

    this.selectedItem = {
      id: itemId,
      isConfirmed: isConfirmed
    };

    console.log('🎯 아이템 선택:', itemId, isConfirmed ? '(확정됨)' : '(임시)');
    this.refreshUI();
  }

  clearSelection() {
    this.selectedItem = null;
    this.isEditMode = false;
    this.refreshUI();
  }

  // 선택된 아이템 수량 변경
  changeSelectedQuantity(delta) {
    if (!this.selectedItem) {
      this.showNotification('수정할 아이템을 먼저 선택하세요', 'warning');
      return;
    }

    const { id, isConfirmed } = this.selectedItem;

    if (isConfirmed) {
      // 확정된 아이템 수정 - 새로운 임시 주문으로 생성
      this.editConfirmedItem(id, delta);
    } else {
      // 임시 아이템 수정
      this.editTempItem(id, delta);
    }
  }

  editTempItem(tempId, delta) {
    const item = this.tempOrders.get(tempId);
    if (!item) return;

    const newQuantity = item.quantity + delta;

    if (newQuantity <= 0) {
      this.tempOrders.delete(tempId);
      this.clearSelection();
      this.showNotification(`${item.name}이(가) 삭제되었습니다`, 'info');
    } else {
      item.quantity = newQuantity;
      this.showNotification(`${item.name} 수량: ${newQuantity}개`, 'success');
    }

    this.refreshUI();
  }

  editConfirmedItem(confirmedId, delta) {
    // 확정된 아이템을 수정하면 새로운 임시 수정 주문 생성
    const tempEditId = `edit_${confirmedId}_${Date.now()}`;

    const editItem = {
      id: tempEditId,
      originalId: confirmedId,
      quantity: delta, // 변경량만 저장
      isEdit: true,
      isTemp: true,
      createdAt: new Date().toISOString()
    };

    this.tempOrders.set(tempEditId, editItem);

    console.log('✏️ 확정 아이템 수정:', confirmedId, '변경량:', delta);
    this.showNotification(`주문 수정이 임시 저장되었습니다`, 'info');
    this.refreshUI();
  }

  // 선택된 아이템 삭제
  deleteSelectedItem() {
    if (!this.selectedItem) {
      this.showNotification('삭제할 아이템을 먼저 선택하세요', 'warning');
      return;
    }

    const { id, isConfirmed } = this.selectedItem;

    if (isConfirmed) {
      // 확정된 아이템 삭제 - 수량을 -전체로 설정
      this.editConfirmedItem(id, -999); // 전체 삭제 마크
    } else {
      // 임시 아이템 삭제
      const item = this.tempOrders.get(id);
      if (item) {
        this.tempOrders.delete(id);
        this.showNotification(`${item.name}이(가) 삭제되었습니다`, 'info');
      }
    }

    this.clearSelection();
    this.refreshUI();
  }

  // ===========================================
  // 주문 확정 및 저장
  // ===========================================

  async confirmOrders() {
    const tempItems = Array.from(this.tempOrders.values());

    if (tempItems.length === 0) {
      this.showNotification('확정할 주문이 없습니다', 'warning');
      return;
    }

    try {
      // DB에 저장할 데이터 준비
      const orderData = {
        storeId: this.currentSession.storeId,
        tableId: this.currentSession.tableId,
        sessionId: this.currentSession.sessionId,
        items: tempItems.map(item => ({
          menuId: item.menuId,
          name: item.name,
          price: item.price,
          quantity: item.quantity,
          originalId: item.originalId, // 수정 주문인 경우
          isEdit: item.isEdit || false
        }))
      };

      const response = await fetch('/api/pos/orders/confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderData)
      });

      if (response.ok) {
        const result = await response.json();
        console.log('✅ 주문 확정 완료:', result);

        // 임시 주문 초기화
        this.tempOrders.clear();
        this.clearSelection();

        // 확정된 주문 다시 로드
        await this.loadConfirmedOrders();

        this.showNotification('주문이 확정되었습니다!', 'success');
      } else {
        throw new Error('주문 확정 실패');
      }
    } catch (error) {
      console.error('❌ 주문 확정 실패:', error);
      this.showNotification('주문 확정에 실패했습니다', 'error');
    }
  }

  // 전체 주문 취소
  clearAllOrders() {
    if (this.tempOrders.size === 0) {
      this.showNotification('취소할 주문이 없습니다', 'warning');
      return;
    }

    this.tempOrders.clear();
    this.clearSelection();
    this.showNotification('모든 임시 주문이 취소되었습니다', 'info');
    this.refreshUI();
  }

  // ===========================================
  // UI 업데이트
  // ===========================================

  refreshUI() {
    // UI 렌더러에게 업데이트 요청
    if (window.posUIRenderer) {
      window.posUIRenderer.updateOrderDisplay();
      window.posUIRenderer.updateOrderControls();
      window.posUIRenderer.updateActionButton();
    }
  }

  // ===========================================
  // 데이터 접근자
  // ===========================================

  getTempOrders() {
    return Array.from(this.tempOrders.values());
  }

  getSelectedItem() {
    return this.selectedItem;
  }

  getTempOrdersCount() {
    return this.tempOrders.size;
  }

  getTotalAmount() {
    let total = 0;
    for (const item of this.tempOrders.values()) {
      if (!item.isEdit) {
        total += item.price * item.quantity;
      }
    }
    return total;
  }

  // ===========================================
  // 이벤트 리스너
  // ===========================================

  setupEventListeners() {
    // 키보드 단축키
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        this.clearSelection();
      }
    });
  }

  // ===========================================
  // 알림 시스템
  // ===========================================

  showNotification(message, type = 'info') {
    if (window.POSNotification) {
      window.POSNotification.show(message, type);
    } else {
      console.log(`📢 ${type.toUpperCase()}: ${message}`);
    }
  }
}

// 전역 인스턴스 생성
window.posOrderManager = new POSOrderManager();

// 전역 함수들
window.addMenuItem = (menuItem, quantity) => window.posOrderManager.addMenuItem(menuItem, quantity);
window.selectOrderItem = (itemId, isConfirmed) => window.posOrderManager.selectItem(itemId, isConfirmed);
window.changeSelectedQuantity = (delta) => window.posOrderManager.changeSelectedQuantity(delta);
window.deleteSelectedItem = () => window.posOrderManager.deleteSelectedItem();
window.confirmOrders = () => window.posOrderManager.confirmOrders();
window.clearAllOrders = () => window.posOrderManager.clearAllOrders();

console.log('✅ 새로운 POS 주문 관리자 로드 완료');