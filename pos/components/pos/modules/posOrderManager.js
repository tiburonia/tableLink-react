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

  // 📝 임시 주문에 메뉴 추가 (같은 메뉴는 수량 증가)
  static addMenuToPending(menuName, price, notes = '') {
    try {
      console.log(`🍽️ 임시 주문 추가: ${menuName} (₩${price})`);

      const numericPrice = parseInt(price);
      if (isNaN(numericPrice) || numericPrice <= 0) {
        throw new Error('가격이 유효하지 않습니다');
      }

      const pendingItems = [...POSStateManager.getPendingItems()];

      // 같은 메뉴명과 가격, 메모의 기존 아이템 찾기
      const existingItemIndex = pendingItems.findIndex(item => 
        !item.isDeleted && 
        item.name === menuName && 
        item.price === numericPrice &&
        item.notes === notes
      );

      if (existingItemIndex !== -1) {
        // 기존 아이템의 수량 증가
        pendingItems[existingItemIndex].quantity += 1;
        pendingItems[existingItemIndex].updatedAt = new Date().toISOString(); // 업데이트 시간 갱신
        console.log(`🔄 기존 메뉴 수량 증가: ${menuName} (${pendingItems[existingItemIndex].quantity}개)`);
        showPOSNotification(`${menuName} 수량이 ${pendingItems[existingItemIndex].quantity}개로 증가했습니다`, 'success');
      } else {
        // 새로운 아이템 추가
        const newItem = {
          id: `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          name: menuName,
          price: numericPrice,
          quantity: 1,
          discount: 0,
          notes: notes,
          status: 'pending',
          isPending: true,
          isConfirmed: false,
          isDeleted: false, // isDeleted 속성 추가
          createdAt: new Date().toISOString(), // createdAt 추가
          updatedAt: new Date().toISOString() // updatedAt 추가
        };

        pendingItems.push(newItem);
        console.log('✅ 새 임시 주문 추가:', newItem);
        showPOSNotification(`${menuName} 주문에 추가되었습니다`, 'success');
      }

      POSStateManager.setPendingItems(pendingItems);
      this.updateCombinedOrder(); // 통합 주문 업데이트
      POSTempStorage.saveTempOrder(); // 임시 저장

      // UI 업데이트
      this.forceUIUpdate(); // forceUIUpdate 사용
      
      // Primary Action 버튼 즉시 업데이트
      setTimeout(() => {
        if (typeof POSUIRenderer !== 'undefined') {
          POSUIRenderer.updatePrimaryActionButton();
        }
      }, 50);

      console.log(`📊 현재 임시 주문: ${pendingItems.length}개 아이템`);
      console.log(`✅ 새 시스템: 메뉴 추가 완료`);
      return true;

    } catch (error) {
      console.error('❌ 임시 주문 추가 실패:', error);
      showPOSNotification('주문 추가 실패: ' + error.message, 'error');
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

      // 같은 메뉴는 수량을 합쳐서 통합
      const consolidatedItems = {};
      pendingItems.forEach(item => {
        const key = `${item.name}_${item.price}`; // 메뉴명과 가격으로 키 생성

        if (consolidatedItems[key]) {
          // 기존 아이템이 있으면 수량 합산
          consolidatedItems[key].quantity += item.quantity;
          consolidatedItems[key].totalDiscount += (item.discount || 0) * item.quantity;
        } else {
          // 새 아이템 추가
          consolidatedItems[key] = {
            name: item.name,
            price: item.price,
            quantity: item.quantity,
            totalDiscount: (item.discount || 0) * item.quantity,
            notes: item.notes || ''
          };
        }
      });

      // 통합된 아이템 배열로 변환
      const consolidatedItemsArray = Object.values(consolidatedItems).map(item => ({
        name: item.name,
        price: item.price,
        quantity: item.quantity,
        discount: Math.floor(item.totalDiscount / item.quantity), // 평균 할인액
        notes: item.notes
      }));

      console.log(`🔄 주문 통합: ${pendingItems.length}개 → ${consolidatedItemsArray.length}개 아이템`);

      // 주문 데이터 구성
      const orderData = {
        storeId: currentStore.id,
        storeName: currentStore.name,
        tableNumber: currentTable,
        items: consolidatedItemsArray,
        totalAmount: consolidatedItemsArray.reduce((sum, item) => 
          sum + ((item.price - (item.discount || 0)) * item.quantity), 0
        ),
        customerName: '포스 주문',
        batchType: 'POS_ORDER'
      };

      // API 호출 (에러 처리 강화)
      const response = await fetch('/api/pos/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          storeId: orderData.storeId,
          storeName: orderData.storeName,
          tableNumber: orderData.tableNumber,
          items: orderData.items,
          totalAmount: orderData.totalAmount,
          userId: null,
          guestPhone: null,
          customerName: '포스 주문'
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      const result = await response.json();
      if (!result.success) {
        throw new Error(result.error || '주문 확정 API 호출 실패');
      }

      // 임시 → 확정 전환 (통합된 아이템 기준)
      const confirmedItems = consolidatedItemsArray.map((item, index) => ({
        id: result.itemIds ? result.itemIds[index] : `confirmed_${Date.now()}_${index}`,
        name: item.name,
        price: item.price,
        quantity: item.quantity,
        discount: item.discount || 0,
        notes: item.notes || '',
        status: 'ordered',
        isConfirmed: true,
        isPending: false,
        isDeleted: false,
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

  // 💳 세션 결제 처리 (완전 재작성)
  static async processSessionPayment(paymentMethod, partialAmount = null) {
    try {
      const session = POSStateManager.getCurrentSession();
      const currentStore = POSStateManager.getCurrentStore();
      const currentTable = POSStateManager.getCurrentTable();

      if (!session.checkId) {
        throw new Error('활성 세션이 없습니다');
      }

      console.log(`💳 세션 결제 시작: ${paymentMethod}, 금액: ${partialAmount || '전액'}`);

      const paymentData = {
        paymentMethod: paymentMethod
      };

      if (partialAmount && partialAmount > 0) {
        paymentData.partialAmount = partialAmount;
      }

      const response = await fetch(`/api/pos/stores/${currentStore.id}/table/${currentTable}/payment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(paymentData)
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || '결제 처리 실패');
      }

      console.log('✅ 결제 성공:', result);

      // 세션 상태 업데이트
      const updatedSession = {
        ...session,
        status: result.sessionSummary?.isFullyPaid ? 'closed' : 'open',
        paidAmount: result.sessionSummary?.paidAmount || 0,
        remainingAmount: result.sessionSummary?.remainingAmount || 0,
        totalAmount: result.sessionSummary?.totalAmount || session.totalAmount
      };

      POSStateManager.setCurrentSession(updatedSession);

      // 완전 결제 시 세션 종료 처리
      if (result.sessionSummary?.isFullyPaid) {
        this.handleSessionClosure();
        showPOSNotification(`${paymentMethod} 결제 완료! 세션이 종료되었습니다.`, 'success');
      } else {
        const remaining = result.sessionSummary?.remainingAmount || 0;
        showPOSNotification(`${paymentMethod} 부분 결제 완료! 잔액: ₩${remaining.toLocaleString()}`, 'info');
      }

      return { success: true, result };

    } catch (error) {
      console.error('❌ 세션 결제 실패:', error);
      showPOSNotification(`${paymentMethod} 결제 실패: ${error.message}`, 'error');
      throw error;
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
    item.updatedAt = new Date().toISOString(); // 업데이트 시간 갱신

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

  // 🎯 확정된 아이템 선택/해제 (통합된 아이템 처리)
  static toggleConfirmedItemSelection(itemId) {
    console.log(`🎯 확정된 아이템 선택 토글 시작: ${itemId}`);

    const selectedItems = POSStateManager.getSelectedItems();
    const confirmedItems = POSStateManager.getConfirmedItems();

    console.log(`🔍 확정 아이템 목록 (${confirmedItems.length}개):`, confirmedItems.map(item => `${item.id}:${item.name}`));

    // 1차: 직접 ID 매칭으로 아이템 찾기
    let targetItem = confirmedItems.find(item => item.id === itemId);

    // 2차: ID가 문자열인 경우 숫자로 변환해서 재시도
    if (!targetItem && !isNaN(itemId)) {
      targetItem = confirmedItems.find(item => item.id == itemId || item.id === parseInt(itemId));
    }

    // 3차: 숫자 ID를 문자열로 변환해서 재시도
    if (!targetItem && typeof itemId === 'number') {
      targetItem = confirmedItems.find(item => item.id === itemId.toString());
    }

    // 4차: UI에서 사용하는 통합 아이템 ID 패턴 체크 (consolidated_메뉴명_가격)
    if (!targetItem && typeof itemId === 'string' && itemId.startsWith('consolidated_')) {
      const parts = itemId.split('_');
      if (parts.length >= 3) {
        const menuName = parts.slice(1, -1).join('_'); // 메뉴명 (중간 부분들)
        const price = parseInt(parts[parts.length - 1]); // 마지막이 가격

        console.log(`🔍 통합 ID 분석: 메뉴명="${menuName}", 가격=${price}`);

        // 같은 메뉴명과 가격의 첫 번째 아이템을 대표로 찾기
        targetItem = confirmedItems.find(item => 
          item.name === menuName && item.price === price
        );

        if (targetItem) {
          console.log(`✅ 통합 ID로 대표 아이템 찾음: ${targetItem.name}`);
        }
      }
    }

    if (!targetItem) {
      console.error(`❌ 확정 아이템을 찾을 수 없음: ${itemId}`);
      console.error('📋 사용 가능한 확정 아이템 ID들:', confirmedItems.map(item => item.id));
      showPOSNotification('선택할 수 없는 아이템입니다', 'warning');
      return;
    }

    console.log(`📋 대상 아이템 찾음: ${targetItem.name} (가격: ₩${targetItem.price}, ID: ${targetItem.id})`);

    // 같은 메뉴명과 가격의 모든 아이템 ID 수집
    const relatedItemIds = confirmedItems
      .filter(item => 
        item.name === targetItem.name && 
        item.price === targetItem.price
      )
      .map(item => item.id);

    console.log(`🔗 관련 아이템 ${relatedItemIds.length}개:`, relatedItemIds);

    // 현재 선택 상태 확인 (관련 아이템 중 하나라도 선택되어 있는지)
    const isAnySelected = relatedItemIds.some(id => 
      selectedItems.includes(id) || 
      selectedItems.includes(id.toString()) || 
      selectedItems.includes(parseInt(id))
    );
    console.log(`🔍 현재 선택 상태: ${isAnySelected ? '선택됨' : '선택안됨'}`);

    if (isAnySelected) {
      // 선택 해제 - 관련된 모든 아이템 제거 (타입 변환 고려)
      const filteredSelected = selectedItems.filter(selectedId => 
        !relatedItemIds.some(relatedId => 
          selectedId == relatedId || 
          selectedId === relatedId.toString() || 
          selectedId === parseInt(relatedId)
        )
      );
      POSStateManager.setSelectedItems(filteredSelected);
      showPOSNotification(`${targetItem.name} 선택 해제됨`, 'info');
      console.log(`✅ 선택 해제 완료: ${targetItem.name}`);
    } else {
      // 선택 - 대표 아이템만 추가 (첫 번째 아이템)
      const representativeId = relatedItemIds[0];
      const newSelectedItems = [...selectedItems, representativeId];
      POSStateManager.setSelectedItems(newSelectedItems);
      showPOSNotification(`${targetItem.name} 선택됨 - 주문 수정 패널에서 수량 조절 가능`, 'success');
      console.log(`✅ 선택 완료: ${targetItem.name} (대표 ID: ${representativeId}), 총 선택: ${newSelectedItems.length}개`);
    }

    // UI 즉시 업데이트
    this.forceUIUpdate();
    console.log(`🎯 확정 아이템 선택 토글 완료: ${targetItem.name}`);
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

  // 🎯 주요 액션 핸들러 (주문 확정)
  static handlePrimaryAction() {
    console.log('🎯 Primary Action 핸들러 호출');

    const pendingItems = POSStateManager.getPendingItems().filter(item => !item.isDeleted);

    if (pendingItems.length > 0) {
      // 임시 주문이 있으면 확정
      this.confirmPendingOrder();
    } else {
      console.log('⚠️ 확정할 임시 주문이 없습니다');
      showPOSNotification('확정할 주문이 없습니다', 'warning');
    }
  }

  // 🔄 선택된 아이템만 확정 (ordercontrol 패널용)
  static confirmSelectedPendingItems() {
    console.log('🔄 선택된 아이템만 확정 시작');

    const selectedItems = POSStateManager.getSelectedItems();
    const pendingItems = POSStateManager.getPendingItems();
    const confirmedItems = POSStateManager.getConfirmedItems();

    if (selectedItems.length === 0) {
      showPOSNotification('선택된 아이템이 없습니다', 'warning');
      return;
    }

    // 선택된 아이템들을 분류
    const selectedPendingItems = [];
    const selectedConfirmedItems = [];

    selectedItems.forEach(itemId => {
      const pendingItem = pendingItems.find(item => item.id === itemId);
      const confirmedItem = confirmedItems.find(item => item.id === itemId);

      if (pendingItem) {
        selectedPendingItems.push(pendingItem);
      } else if (confirmedItem) {
        selectedConfirmedItems.push(confirmedItem);
      }
    });

    console.log(`📊 선택된 아이템: 임시 ${selectedPendingItems.length}개, 확정 ${selectedConfirmedItems.length}개`);

    // 선택된 임시 주문만 확정
    if (selectedPendingItems.length > 0) {
      this.confirmPendingItems(selectedPendingItems);
    }

    // 선택된 확정 주문의 변경사항 적용
    if (selectedConfirmedItems.length > 0) {
      this.applyConfirmedItemChanges(selectedConfirmedItems);
    }

    // UI 업데이트
    POSUIRenderer.renderOrderItems();
    POSUIRenderer.renderPaymentSummary();
    POSUIRenderer.updatePrimaryActionButton();

    // 선택 해제
    POSStateManager.setSelectedItems([]);
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
        item.updatedAt = new Date().toISOString(); // 업데이트 시간 갱신
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

  // 🔢 선택된 아이템 수량 변경 (ordercontrol 전용 - 임시/확정 모두 지원)
  static changeSelectedQuantity(change) {
    const selectedItems = POSStateManager.getSelectedItems();
    const pendingItems = POSStateManager.getPendingItems();
    const confirmedItems = POSStateManager.getConfirmedItems();

    if (selectedItems.length === 0) {
      showPOSNotification('수량을 변경할 아이템을 선택해주세요', 'warning');
      return;
    }

    let pendingChangedCount = 0;
    let pendingRemovedCount = 0;
    let confirmedChangedCount = 0;
    let confirmedRemovedCount = 0;

    selectedItems.forEach(itemId => {
      // 임시 아이템 처리
      const pendingItem = pendingItems.find(i => i.id === itemId);
      if (pendingItem && !pendingItem.isConfirmed) {
        const oldQuantity = pendingItem.quantity;
        pendingItem.quantity += change;
        pendingItem.updatedAt = new Date().toISOString();

        if (pendingItem.quantity <= 0) {
          pendingItem.isDeleted = true;
          pendingRemovedCount++;
        } else {
          pendingChangedCount++;
        }

        console.log(`📝 임시 수량 변경: ${pendingItem.name} ${oldQuantity} → ${pendingItem.quantity}`);
      }

      // 확정된 아이템 처리 (임시 변경 상태로 저장)
      const confirmedItem = confirmedItems.find(i => i.id === itemId);
      if (confirmedItem) {
        console.log(`📝 확정 아이템 수량 변경 시작: ${confirmedItem.name} (현재: ${confirmedItem.quantity}개)`);

        // 같은 메뉴명과 가격의 모든 아이템 찾기 (통합 그룹)
        const relatedItems = confirmedItems.filter(item => 
          item.name === confirmedItem.name && 
          item.price === confirmedItem.price
        );

        // 통합된 총 수량 계산
        const totalOriginalQuantity = relatedItems.reduce((sum, item) => sum + item.quantity, 0);

        // 대표 아이템(첫 번째)에 변경사항 저장
        const representativeItem = relatedItems[0];

        if (!representativeItem.pendingChanges) {
          representativeItem.pendingChanges = {
            originalQuantity: totalOriginalQuantity,
            newQuantity: totalOriginalQuantity,
            isModified: false,
            isGroupRepresentative: true,
            relatedItemIds: relatedItems.map(item => item.id)
          };
          console.log(`🆕 새 임시 변경사항 초기화: ${representativeItem.name}`);
        }

        const oldNewQuantity = representativeItem.pendingChanges.newQuantity;
        representativeItem.pendingChanges.newQuantity += change;
        representativeItem.pendingChanges.isModified = true;
        representativeItem.pendingChanges.updatedAt = new Date().toISOString();

        if (representativeItem.pendingChanges.newQuantity <= 0) {
          representativeItem.pendingChanges.isDeleted = true;
          confirmedRemovedCount++;
          console.log(`🗑️ 확정 아이템 삭제 표시: ${confirmedItem.name}`);
        } else {
          confirmedChangedCount++;
          console.log(`📝 확정 아이템 수량 변경: ${confirmedItem.name} ${oldNewQuantity} → ${representativeItem.pendingChanges.newQuantity} (임시)`);
        }
      }
    });

    // 삭제된 임시 아이템 제거
    if (pendingRemovedCount > 0) {
      const filteredItems = pendingItems.filter(item => !item.isDeleted);
      POSStateManager.setPendingItems(filteredItems);
    }

    // 삭제된 아이템들은 선택에서도 제거
    const remainingSelected = selectedItems.filter(itemId => {
      const pendingItem = pendingItems.find(item => item.id === itemId && item.isDeleted);
      const confirmedItem = confirmedItems.find(item => item.id === itemId && item.pendingChanges?.isDeleted);
      return !pendingItem && !confirmedItem;
    });
    POSStateManager.setSelectedItems(remainingSelected);

    // 상태 업데이트
    POSStateManager.setConfirmedItems(confirmedItems);
    this.updateCombinedOrder();
    this.refreshUI();

    // 알림 메시지
    const totalChanged = pendingChangedCount + confirmedChangedCount;
    const totalRemoved = pendingRemovedCount + confirmedRemovedCount;

    if (totalRemoved > 0) {
      showPOSNotification(`${totalRemoved}개 아이템 제거, ${totalChanged}개 수량 변경 (확정 아이템은 임시 변경)`, 'info');
    } else if (totalChanged > 0) {
      showPOSNotification(`${totalChanged}개 아이템 수량 변경 (확정 아이템은 임시 변경)`, 'success');
    } else {
      showPOSNotification('변경할 수 있는 아이템이 없습니다', 'warning');
    }
  }

  // 🗑️ 선택된 아이템 삭제 (ordercontrol 전용 - 임시/확정 모두 지원)
  static deleteSelectedPendingItems() {
    const selectedItems = POSStateManager.getSelectedItems();
    const pendingItems = POSStateManager.getPendingItems();
    const confirmedItems = POSStateManager.getConfirmedItems();

    if (selectedItems.length === 0) {
      showPOSNotification('삭제할 아이템을 선택해주세요', 'warning');
      return;
    }

    let pendingDeletedCount = 0;
    let confirmedDeletedCount = 0;

    selectedItems.forEach(itemId => {
      // 임시 아이템 삭제
      const pendingItem = pendingItems.find(i => i.id === itemId);
      if (pendingItem && !pendingItem.isConfirmed) {
        pendingItem.isDeleted = true;
        pendingDeletedCount++;
      }

      // 확정된 아이템 임시 삭제 표시
      const confirmedItem = confirmedItems.find(i => i.id === itemId);
      if (confirmedItem && confirmedItem.isConfirmed) {
        if (!confirmedItem.pendingChanges) {
          confirmedItem.pendingChanges = {
            originalQuantity: confirmedItem.quantity,
            newQuantity: confirmedItem.quantity,
            isModified: false
          };
        }
        confirmedItem.pendingChanges.isDeleted = true;
        confirmedItem.pendingChanges.isModified = true;
        confirmedItem.pendingChanges.updatedAt = new Date().toISOString();
        confirmedDeletedCount++;
      }
    });

    if (pendingDeletedCount > 0 || confirmedDeletedCount > 0) {
      // 임시 아이템 필터링
      const filteredPendingItems = pendingItems.filter(item => !item.isDeleted);
      POSStateManager.setPendingItems(filteredPendingItems);
      POSStateManager.setConfirmedItems(confirmedItems);
      POSStateManager.setSelectedItems([]);

      this.updateCombinedOrder();
      POSTempStorage.saveTempOrder();
      this.refreshUI();

      if (confirmedDeletedCount > 0) {
        showPOSNotification(`${pendingDeletedCount}개 임시 아이템, ${confirmedDeletedCount}개 확정 아이템 삭제 표시 (임시 변경)`, 'success');
      } else {
        showPOSNotification(`${pendingDeletedCount}개 임시 아이템 삭제됨`, 'success');
      }
    } else {
      showPOSNotification('삭제할 아이템이 없습니다', 'warning');
    }
  }

  // 💾 임시 변경사항 저장 (ordercontrol 전용)
  static savePendingChanges() {
    try {
      POSTempStorage.saveTempOrder();
      showPOSNotification('임시 변경사항이 저장되었습니다', 'success');
      console.log('💾 ordercontrol: 임시 변경사항 저장 완료');
    } catch (error) {
      console.error('❌ ordercontrol: 임시 저장 실패:', error);
      showPOSNotification('임시 저장 실패', 'error');
    }
  }

  // ✅ 임시 아이템 및 확정 아이템의 변경사항 확정 (ordercontrol 전용)
  static async confirmSelectedPendingItems() {
    const selectedItems = POSStateManager.getSelectedItems();
    const pendingItems = POSStateManager.getPendingItems();
    const confirmedItems = POSStateManager.getConfirmedItems();

    if (selectedItems.length === 0) {
      showPOSNotification('확정할 아이템을 선택해주세요', 'warning');
      return;
    }

    // 새로 추가된 임시 아이템들
    const selectedPendingItems = pendingItems.filter(item => 
      selectedItems.includes(item.id) && !item.isConfirmed && !item.isDeleted
    );

    // 변경사항이 있는 확정된 아이템들
    const modifiedConfirmedItems = confirmedItems.filter(item =>
      selectedItems.includes(item.id) && item.pendingChanges?.isModified
    );

    if (selectedPendingItems.length === 0 && modifiedConfirmedItems.length === 0) {
      showPOSNotification('확정할 변경사항이 없습니다', 'warning');
      return;
    }

    // 확인 다이얼로그
    const totalNew = selectedPendingItems.length;
    const totalModified = modifiedConfirmedItems.length;
    let confirmMessage = '다음 변경사항을 확정하시겠습니까?\n\n';

    if (totalNew > 0) {
      confirmMessage += `🆕 신규 주문: ${totalNew}개\n`;
    }
    if (totalModified > 0) {
      confirmMessage += `📝 주문 변경: ${totalModified}개\n`;
    }
    confirmMessage += '\n확정 후에는 취소할 수 없습니다.';

    if (!confirm(confirmMessage)) {
      return;
    }

    // 로딩 상태 표시
    showPOSNotification('주문 확정 중...', 'info');

    try {
      console.log(`🏆 ordercontrol: ${selectedPendingItems.length}개 신규, ${modifiedConfirmedItems.length}개 변경 아이템 확정 시작`);

      const currentStore = POSStateManager.getCurrentStore();
      const currentTable = POSStateManager.getCurrentTable();
      let newSessionCheckId = null;

      // 1. 새 임시 아이템 확정 처리
      if (selectedPendingItems.length > 0) {
        const consolidatedItems = {};
        selectedPendingItems.forEach(item => {
          const key = `${item.name}_${item.price}`;
          if (consolidatedItems[key]) {
            consolidatedItems[key].quantity += item.quantity;
            consolidatedItems[key].totalDiscount += (item.discount || 0) * item.quantity;
          } else {
            consolidatedItems[key] = { 
              ...item, 
              totalDiscount: (item.discount || 0) * item.quantity 
            };
          }
        });

        const consolidatedArray = Object.values(consolidatedItems).map(item => ({
          name: item.name,
          price: item.price,
          quantity: item.quantity,
          discount: Math.floor(item.totalDiscount / item.quantity),
          notes: item.notes || ''
        }));

        const response = await fetch('/api/pos/orders', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            storeId: currentStore.id,
            storeName: currentStore.name,
            tableNumber: currentTable,
            items: consolidatedArray,
            totalAmount: consolidatedArray.reduce((sum, item) => 
              sum + ((item.price - (item.discount || 0)) * item.quantity), 0
            ),
            userId: null,
            guestPhone: null,
            customerName: '포스 주문'
          })
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: 서버 응답 오류`);
        }

        const result = await response.json();
        if (!result.success) {
          throw new Error(result.error || '새 아이템 확정 실패');
        }

        newSessionCheckId = result.checkId;

        // 확정된 아이템들을 상태에 추가
        const newConfirmedItems = consolidatedArray.map((item, index) => ({
          id: result.itemIds ? result.itemIds[index] : `confirmed_${Date.now()}_${index}`,
          name: item.name,
          price: item.price,
          quantity: item.quantity,
          discount: item.discount,
          notes: item.notes,
          status: 'ordered',
          isConfirmed: true,
          isPending: false,
          isDeleted: false,
          checkId: result.checkId,
          confirmedAt: new Date().toISOString()
        }));

        const existingConfirmed = POSStateManager.getConfirmedItems();
        POSStateManager.setConfirmedItems([...existingConfirmed, ...newConfirmedItems]);

        console.log(`✅ ${consolidatedArray.length}개 신규 아이템 확정 완료`);
      }

      // 2. 확정된 아이템의 변경사항 처리
      if (modifiedConfirmedItems.length > 0) {
        for (const item of modifiedConfirmedItems) {
          const changes = item.pendingChanges;

          if (changes.isDeleted) {
            // 아이템 삭제 처리 (향후 취소 API 구현)
            console.log(`❌ 확정 아이템 삭제 요청: ${item.name} (향후 구현)`);
            item.quantity = 0;
            item.status = 'cancelled';
          } else if (changes.newQuantity !== changes.originalQuantity) {
            const quantityDiff = changes.newQuantity - changes.originalQuantity;

            if (quantityDiff > 0) {
              // 수량 증가 - 추가 주문
              const addResponse = await fetch('/api/orders/create-or-add', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  storeId: currentStore.id,
                  tableNumber: currentTable,
                  items: [{
                    name: item.name,
                    price: item.price,
                    quantity: quantityDiff,
                    discount: item.discount || 0,
                    notes: item.notes || ''
                  }],
                  userId: null,
                  guestPhone: null,
                  customerName: '포스 주문 (수량 증가)',
                  sourceSystem: 'POS'
                })
              });

              if (addResponse.ok) {
                const addResult = await addResponse.json();
                if (addResult.success) {
                  item.quantity = changes.newQuantity;
                  newSessionCheckId = newSessionCheckId || addResult.checkId;
                  console.log(`✅ 수량 증가 확정: ${item.name} +${quantityDiff}개`);
                }
              }
            } else {
              // 수량 감소 (임시로 직접 적용)
              console.log(`⬇️ 수량 감소 적용: ${item.name} ${quantityDiff}개`);
              item.quantity = Math.max(0, changes.newQuantity);
            }
          }

          // 변경사항 초기화
          delete item.pendingChanges;
        }

        console.log(`✅ ${modifiedConfirmedItems.length}개 아이템 변경사항 적용 완료`);
      }

      // 3. 상태 정리
      const remainingPending = pendingItems.filter(item => 
        !selectedItems.includes(item.id)
      );
      POSStateManager.setPendingItems(remainingPending);
      POSStateManager.setSelectedItems([]);

      // 4. 세션 정보 업데이트
      if (newSessionCheckId) {
        POSStateManager.setCurrentSession({
          checkId: newSessionCheckId,
          status: 'ordering'
        });
      }

      // 5. UI 업데이트
      this.updateCombinedOrder();
      POSTempStorage.saveTempOrder();
      this.refreshUI();

      // 성공 알림
      const totalProcessed = selectedPendingItems.length + modifiedConfirmedItems.length;
      showPOSNotification(`✅ ${totalProcessed}개 변경사항 확정 완료!`, 'success');
      console.log(`✅ ordercontrol: 모든 변경사항 확정 완료`);

      // 세션 데이터 새로고침
      setTimeout(() => {
        this.refreshSessionData();
      }, 500);

    } catch (error) {
      console.error('❌ ordercontrol: 변경사항 확정 실패:', error);
      showPOSNotification(`주문 확정 실패: ${error.message}`, 'error');
    }
  }

  // ❌ 확정된 아이템 취소 요청 (ordercontrol 전용)
  static async requestCancelSelectedItems() {
    const selectedItems = POSStateManager.getSelectedItems();
    const confirmedItems = POSStateManager.getConfirmedItems();

    if (selectedItems.length === 0) {
      showPOSNotification('취소할 아이템을 선택해주세요', 'warning');
      return;
    }

    const selectedConfirmedItems = confirmedItems.filter(item => 
      selectedItems.includes(item.id) && item.isConfirmed
    );

    if (selectedConfirmedItems.length === 0) {
      showPOSNotification('취소할 확정 아이템이 없습니다', 'warning');
      return;
    }

    // 취소 확인
    if (!confirm(`${selectedConfirmedItems.length}개의 확정된 주문을 취소하시겠습니까?`)) {
      return;
    }

    try {
      console.log(`❌ ordercontrol: ${selectedConfirmedItems.length}개 확정 아이템 취소 요청`);

      // 향후 취소 API 구현 예정
      showPOSNotification('주문 취소 기능은 향후 구현 예정입니다', 'info');

      // 임시로 선택 해제
      POSStateManager.setSelectedItems([]);
      this.refreshUI();

    } catch (error) {
      console.error('❌ ordercontrol: 확정 아이템 취소 실패:', error);
      showPOSNotification('주문 취소 실패: ' + error.message, 'error');
    }
  }

  // 🔄 세션 데이터 새로고침
  static async refreshSessionData() {
    try {
      const currentTable = POSStateManager.getCurrentTable();
      const currentStore = POSStateManager.getCurrentStore();

      if (!currentTable || !currentStore) {
        console.log('❌ 테이블 또는 매장 정보 없음');
        return;
      }

      console.log('🔄 세션 데이터 새로고침 시작');

      // 최신 주문 정보 다시 로드
      const ordersResponse = await fetch(`/api/pos/stores/${currentStore.id}/table/${currentTable}/all-orders`);
      const ordersData = await ordersResponse.json();

      if (ordersData.success && ordersData.currentSession) {
        // 세션 정보 업데이트
        POSStateManager.setCurrentSession({
          checkId: ordersData.currentSession.checkId,
          status: ordersData.currentSession.status,
          customerName: ordersData.currentSession.customerName,
          totalAmount: ordersData.currentSession.totalAmount,
          remainingAmount: ordersData.currentSession.remainingAmount || ordersData.currentSession.totalAmount // 잔액이 없으면 totalAmount로 초기화
        });

        // 확정된 아이템 업데이트
        const confirmedItems = ordersData.currentSession.items || [];
        POSStateManager.setConfirmedItems(confirmedItems);

        this.updateCombinedOrder();
        console.log('✅ 세션 데이터 새로고침 완료');
      }

    } catch (error) {
      console.error('❌ 세션 데이터 새로고침 실패:', error);
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