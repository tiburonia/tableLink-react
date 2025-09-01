// POS 주문 관리 모듈 - 세션 기반 임시/확정 분리 시스템
import { POSStateManager } from './posStateManager.js';
import { POSDataLoader } from './posDataLoader.js';
import { POSTempStorage } from './posTempStorage.js';
import { POSUIRenderer } from './posUIRenderer.js';
import { showPOSNotification } from '../../../utils/posNotification.js';

export class POSOrderManager {

  // 🏆 세션 초기화 및 기존 데이터 로드
  static async initializeSession(tableNumber) {
    try {
      const currentStore = POSStateManager.getCurrentStore();

      console.log(`🚀 테이블 ${tableNumber} 세션 초기화 시작`);

      // 세션 락 확인
      const lockStatus = await this.checkSessionLock(tableNumber);
      if (lockStatus.isLocked && lockStatus.lockedBy !== 'POS' && lockStatus.lockedBy !== 'current_pos') {
        throw new Error(`테이블이 다른 시스템(${lockStatus.lockedBy})에서 사용 중입니다.`);
      }

      // 기존 활성 세션 조회 (재시도 로직 포함)
      let sessionData = null;
      let sessionResponse = null;

      for (let attempt = 1; attempt <= 3; attempt++) {
        try {
          sessionResponse = await fetch(`/api/pos/stores/${currentStore.id}/table/${tableNumber}/session-status`);

          if (sessionResponse.ok) {
            sessionData = await sessionResponse.json();
            break;
          } else {
            throw new Error(`HTTP ${sessionResponse.status}: ${sessionResponse.statusText}`);
          }
        } catch (error) {
          console.warn(`⚠️ 세션 상태 조회 실패 (시도 ${attempt}/3):`, error.message);

          if (attempt < 3) {
            // 재시도 전 1초 대기
            await new Promise(resolve => setTimeout(resolve, 1000));
            continue;
          }

          throw new Error(`세션 상태 조회 실패: ${error.message}`);
        }
      }

      if (!sessionData || !sessionData.success) {
        throw new Error('세션 상태 조회 실패: ' + (sessionData?.error || '알 수 없는 오류'));
      }

      // 확정된 주문 조회
      const confirmedOrders = await POSDataLoader.loadTableOrders(tableNumber, currentStore.id);

      // 임시 주문 복구
      const pendingItems = POSTempStorage.loadTempOrder();

      // 세션 정보 설정
      if (sessionData.hasActiveSession) {
        POSStateManager.setCurrentSession({
          checkId: sessionData.sessionInfo.checkId,
          status: sessionData.sessionInfo.status,
          openedAt: sessionData.sessionInfo.startTime,
          customerName: sessionData.sessionInfo.customerName,
          totalAmount: 0, // 계산해서 설정
          paidAmount: 0,
          remainingAmount: 0
        });
      }

      // 상태 분리 설정
      POSStateManager.setConfirmedItems(confirmedOrders);
      POSStateManager.setPendingItems(pendingItems);

      // 전체 주문 목록 (UI 표시용)
      const allItems = [...confirmedOrders, ...pendingItems];
      POSStateManager.setCurrentOrder(allItems);

      // 세션 락 획득
      await this.acquireSessionLock(tableNumber);

      console.log(`✅ 세션 초기화 완료 - 확정: ${confirmedOrders.length}개, 임시: ${pendingItems.length}개`);

    } catch (error) {
      console.error('❌ 세션 초기화 실패:', error);
      showPOSNotification('세션 초기화 실패: ' + error.message, 'error');
      throw error;
    }
  }

  // 🔒 세션 락 관리
  static async checkSessionLock(tableNumber) {
    try {
      const currentStore = POSStateManager.getCurrentStore();
      const response = await fetch(`/api/pos/stores/${currentStore.id}/table/${tableNumber}/lock-status`);
      return await response.json();
    } catch (error) {
      console.warn('세션 락 상태 확인 실패:', error);
      return { isLocked: false };
    }
  }

  static async acquireSessionLock(tableNumber) {
    try {
      const currentStore = POSStateManager.getCurrentStore();
      const response = await fetch(`/api/pos/stores/${currentStore.id}/table/${tableNumber}/acquire-lock`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          lockBy: 'POS',
          lockDuration: 300000 // 5분
        })
      });

      const result = await response.json();
      if (result.success) {
        POSStateManager.setSessionLock({
          isLocked: true,
          lockedBy: 'POS',
          lockedAt: new Date(),
          lockExpires: new Date(Date.now() + 300000)
        });
      }
    } catch (error) {
      console.warn('세션 락 획득 실패:', error);
    }
  }

  // 📝 임시 주문에 메뉴 추가
  static addMenuToPending(menuName, price) {
    const currentTable = POSStateManager.getCurrentTable();
    if (!currentTable) {
      showPOSNotification('테이블이 선택되지 않았습니다.', 'warning');
      return;
    }

    try {
      const pendingItems = POSStateManager.getPendingItems();
      const existingItem = pendingItems.find(item => item.name === menuName && !item.isDeleted);

      if (existingItem) {
        existingItem.quantity += 1;
        showPOSNotification(`${menuName} 수량 +1 (총 ${existingItem.quantity}개) [임시]`, 'info');
      } else {
        const newItem = {
          id: `pending_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          name: menuName,
          price: parseInt(price),
          quantity: 1,
          discount: 0,
          notes: '',
          status: 'pending',
          createdAt: new Date().toISOString(),
          isConfirmed: false,
          isPending: true
        };
        pendingItems.push(newItem);
        showPOSNotification(`${menuName} 임시 주문에 추가됨`, 'success');
      }

      POSStateManager.setPendingItems(pendingItems);
      this.updateCombinedOrder();
      POSTempStorage.saveTempOrder();

      POSUIRenderer.renderOrderItems();
      POSUIRenderer.renderPaymentSummary();
      POSUIRenderer.updatePrimaryActionButton();

    } catch (error) {
      console.error('❌ 임시 주문 추가 실패:', error);
      showPOSNotification('메뉴 추가 중 오류가 발생했습니다.', 'error');
    }
  }

  // 🔄 임시 + 확정 주문 통합 업데이트
  static updateCombinedOrder() {
    const confirmedItems = POSStateManager.getConfirmedItems();
    const pendingItems = POSStateManager.getPendingItems();

    const allItems = [
      ...confirmedItems.map(item => ({ ...item, isConfirmed: true, isPending: false })),
      ...pendingItems.map(item => ({ ...item, isConfirmed: false, isPending: true }))
    ];

    POSStateManager.setCurrentOrder(allItems);
  }

  // 🏆 임시 주문 → 확정 (세션에 배치 추가)
  static async confirmPendingOrder() {
    const pendingItems = POSStateManager.getPendingItems().filter(item => !item.isDeleted);

    if (pendingItems.length === 0) {
      showPOSNotification('확정할 임시 주문이 없습니다.', 'warning');
      return;
    }

    // 세션 락 확인
    if (POSStateManager.isSessionLocked()) {
      showPOSNotification('다른 시스템에서 사용 중인 테이블입니다.', 'error');
      return;
    }

    try {
      console.log('🏆 임시 주문 → 세션 확정 시작:', {
        임시아이템: pendingItems.length,
        테이블: POSStateManager.getCurrentTable()
      });

      // 🍽️ 동일 메뉴 통합 (수량 합산)
      const consolidatedItems = {};
      pendingItems.forEach(item => {
        const key = `${item.name}_${item.price}_${item.discount || 0}`;
        if (consolidatedItems[key]) {
          consolidatedItems[key].quantity += item.quantity;
        } else {
          consolidatedItems[key] = {
            name: item.name,
            price: item.price,
            quantity: item.quantity,
            discount: item.discount || 0,
            notes: item.notes || ''
          };
        }
      });

      const finalItems = Object.values(consolidatedItems);
      const currentStore = POSStateManager.getCurrentStore();
      const currentTable = POSStateManager.getCurrentTable();

      // 🏆 세션 배치 주문 데이터 구성
      const sessionBatchData = {
        storeId: currentStore.id,
        storeName: currentStore.name,
        tableNumber: currentTable,
        items: finalItems,
        totalAmount: finalItems.reduce((sum, item) => 
          sum + ((item.price - (item.discount || 0)) * item.quantity), 0
        ),
        userId: null,
        guestPhone: null,
        customerName: '포스 주문',
        batchType: 'POS_ORDER' // 배치 구분
      };

      console.log(`📦 세션 배치 추가: ${finalItems.length}개 메뉴, 총 ₩${sessionBatchData.totalAmount.toLocaleString()}`);

      // 🚀 세션 기반 주문 배치 API 호출
      const response = await fetch('/api/pos/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(sessionBatchData)
      });

      const result = await response.json();
      if (!result.success) {
        throw new Error(result.error || '세션 배치 추가 실패');
      }

      // ✅ 임시 → 확정 상태 전환
      const newConfirmedItems = finalItems.map((item, index) => ({
        id: result.itemIds ? result.itemIds[index] : `confirmed_${Date.now()}_${index}`,
        name: item.name,
        price: item.price,
        quantity: item.quantity,
        discount: item.discount,
        notes: item.notes,
        status: 'ordered',
        cookingStatus: 'ORDERED',
        sessionId: result.checkId,
        checkId: result.checkId,
        confirmedAt: new Date().toISOString(),
        isConfirmed: true,
        isPending: false
      }));

      // 상태 업데이트
      const existingConfirmed = POSStateManager.getConfirmedItems();
      POSStateManager.setConfirmedItems([...existingConfirmed, ...newConfirmedItems]);
      POSStateManager.setPendingItems([]); // 임시 주문 비우기

      // 세션 정보 업데이트
      POSStateManager.setCurrentSession({
        checkId: result.checkId,
        status: 'ordering',
        totalAmount: (POSStateManager.getCurrentSession().totalAmount || 0) + sessionBatchData.totalAmount
      });

      this.updateCombinedOrder();
      POSTempStorage.clearTempOrder();

      POSUIRenderer.renderOrderItems();
      POSUIRenderer.renderPaymentSummary();
      POSUIRenderer.updatePrimaryActionButton();

      showPOSNotification(
        `${finalItems.length}개 아이템 세션에 확정! 배치 총액: ₩${sessionBatchData.totalAmount.toLocaleString()}`, 
        'success'
      );

      console.log(`✅ 세션 배치 확정 완료 - 배치 ID: ${result.checkId}, 확정 아이템: ${finalItems.length}개`);

      // KDS/KRP 이벤트 발행 시뮬레이션
      this.emitOrderBatchEvent(result.checkId, newConfirmedItems);

    } catch (error) {
      console.error('❌ 임시 주문 확정 실패:', error);
      showPOSNotification('주문 확정 실패: ' + error.message, 'error');
    }
  }

  // 📡 KDS/KRP 이벤트 발행
  static emitOrderBatchEvent(checkId, items) {
    if (typeof window.posSocket !== 'undefined' && window.posSocket) {
      window.posSocket.emit('order_batch_confirmed', {
        checkId: checkId,
        items: items,
        timestamp: new Date().toISOString(),
        source: 'POS'
      });
      console.log(`📡 KDS/KRP 이벤트 발행: 배치 ${checkId}`);
    }
  }

  // 🔄 항목 수정 (기존 취소 + 신규 생성)
  static async modifyConfirmedItem(itemId, changes) {
    try {
      const confirmedItems = POSStateManager.getConfirmedItems();
      const item = confirmedItems.find(i => i.id === itemId);

      if (!item) {
        throw new Error('수정할 항목을 찾을 수 없습니다');
      }

      if (item.status === 'served') {
        throw new Error('이미 서빙된 항목은 수정할 수 없습니다');
      }

      console.log(`🔄 항목 수정: ${item.name} (취소 + 신규 생성)`);

      // 1. 기존 항목 취소
      await POSDataLoader.cancelItem(itemId, '수정을 위한 취소');

      // 2. 수정된 항목을 임시 주문에 추가
      const modifiedItem = {
        id: `modified_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        name: changes.name || item.name,
        price: changes.price || item.price,
        quantity: changes.quantity || item.quantity,
        discount: changes.discount || item.discount,
        notes: changes.notes || item.notes,
        status: 'pending',
        originalItemId: itemId,
        isModified: true,
        createdAt: new Date().toISOString(),
        isConfirmed: false,
        isPending: true
      };

      const pendingItems = POSStateManager.getPendingItems();
      pendingItems.push(modifiedItem);
      POSStateManager.setPendingItems(pendingItems);

      // 3. 기존 확정 항목에서 제거
      const filteredConfirmed = confirmedItems.filter(i => i.id !== itemId);
      POSStateManager.setConfirmedItems(filteredConfirmed);

      this.updateCombinedOrder();
      POSTempStorage.saveTempOrder();

      POSUIRenderer.renderOrderItems();
      POSUIRenderer.renderPaymentSummary();
      POSUIRenderer.updatePrimaryActionButton();

      showPOSNotification(`${item.name} 수정됨 (재확정 필요)`, 'warning');

      // 감사 로그 이벤트
      this.logAuditEvent('ITEM_MODIFIED', {
        originalItemId: itemId,
        newItemId: modifiedItem.id,
        changes: changes,
        reason: '항목 수정'
      });

    } catch (error) {
      console.error('❌ 항목 수정 실패:', error);
      showPOSNotification('항목 수정 실패: ' + error.message, 'error');
    }
  }

  // 💳 세션 통합 결제 처리
  static async processSessionPayment(paymentMethod, partialAmount = null) {
    try {
      const session = POSStateManager.getCurrentSession();
      const currentStore = POSStateManager.getCurrentStore();
      const currentTable = POSStateManager.getCurrentTable();

      if (!session.checkId) {
        throw new Error('활성 세션이 없습니다');
      }

      // 임시 주문이 있으면 먼저 확정 제안
      const pendingItems = POSStateManager.getPendingItems().filter(item => !item.isDeleted);
      if (pendingItems.length > 0) {
        const confirmFirst = confirm(
          `임시 주문 ${pendingItems.length}개가 있습니다. 먼저 확정하고 결제하시겠습니까?`
        );

        if (confirmFirst) {
          await this.confirmPendingOrder();
          // 잠시 대기 후 결제 진행
          setTimeout(() => this.processSessionPayment(paymentMethod, partialAmount), 1000);
          return;
        }
      }

      console.log(`💳 세션 ${session.checkId} 결제 시작 - 방법: ${paymentMethod}`);

      // 세션 결제 API 호출
      const paymentData = {
        paymentMethod: paymentMethod,
        guestPhone: null
      };

      if (partialAmount) {
        paymentData.partialAmount = partialAmount;
      }

      const response = await fetch(`/api/pos/stores/${currentStore.id}/table/${currentTable}/payment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(paymentData)
      });

      const result = await response.json();
      if (!result.success) {
        throw new Error(result.error || '결제 처리 실패');
      }

      // 세션 상태 업데이트
      const sessionSummary = result.sessionSummary;
      POSStateManager.setCurrentSession({
        status: sessionSummary.isFullyPaid ? 'closed' : 'payment_processing',
        paidAmount: sessionSummary.paidAmount,
        remainingAmount: sessionSummary.remainingAmount
      });

      if (sessionSummary.isFullyPaid) {
        // 세션 완전 종료
        this.handleSessionClosure();
        showPOSNotification(
          `결제 완료! 총 ₩${sessionSummary.totalAmount.toLocaleString()} (세션 종료)`, 
          'success'
        );
      } else {
        // 부분 결제
        showPOSNotification(
          `부분 결제 완료! 결제: ₩${result.amount.toLocaleString()}, 잔액: ₩${sessionSummary.remainingAmount.toLocaleString()}`, 
          'info'
        );
      }

      POSUIRenderer.renderPaymentSummary();

      // 결제 이벤트 발행
      this.emitPaymentEvent(result);

    } catch (error) {
      console.error('❌ 세션 결제 실패:', error);
      showPOSNotification('결제 실패: ' + error.message, 'error');
    }
  }

  // 🏁 세션 종료 처리
  static handleSessionClosure() {
    // 세션 락 해제
    POSStateManager.setSessionLock({
      isLocked: false,
      lockedBy: null,
      lockedAt: null,
      lockExpires: null
    });

    // 임시 데이터 정리
    POSStateManager.setPendingItems([]);
    POSTempStorage.clearTempOrder();

    console.log('🏁 세션 종료 - 데이터 정리 완료');
  }

  // 📡 결제 이벤트 발행
  static emitPaymentEvent(paymentResult) {
    if (typeof window.posSocket !== 'undefined' && window.posSocket) {
      window.posSocket.emit('payment_processed', {
        sessionId: paymentResult.sessionId,
        paymentId: paymentResult.paymentId,
        amount: paymentResult.amount,
        method: paymentResult.method,
        status: paymentResult.status,
        timestamp: new Date().toISOString()
      });
      console.log(`📡 결제 이벤트 발행: ${paymentResult.paymentId}`);
    }
  }

  // 📊 감사 로그 기록
  static logAuditEvent(eventType, eventData) {
    const auditLog = {
      eventType: eventType,
      timestamp: new Date().toISOString(),
      sessionId: POSStateManager.getCurrentSession().checkId,
      tableNumber: POSStateManager.getCurrentTable(),
      storeId: POSStateManager.getCurrentStore()?.id,
      userId: 'POS_USER', // POS 사용자 구분
      eventData: eventData
    };

    console.log('📊 감사 로그:', auditLog);

    // 향후 감사 로그 API 호출로 대체
    // await fetch('/api/audit/log', { method: 'POST', body: JSON.stringify(auditLog) });
  }

  // 🎯 주요 액션 핸들러 (UI에서 호출)
  static async handlePrimaryAction() {
    try {
      const pendingItems = POSStateManager.getPendingItems().filter(item => !item.isDeleted);
      const session = POSStateManager.getCurrentSession();

      // 임시 주문이 있으면 확정
      if (pendingItems.length > 0) {
        await this.confirmPendingOrder();
        return;
      }

      // 확정된 주문이 있고 세션이 활성화되어 있으면 결제 진행
      if (session.checkId && session.status !== 'closed') {
        const confirmedItems = POSStateManager.getConfirmedItems();
        if (confirmedItems.length > 0) {
          showPOSNotification('결제 모달을 열어주세요.', 'info');
          return;
        }
      }

      showPOSNotification('주문할 메뉴를 추가해주세요.', 'warning');

    } catch (error) {
      console.error('❌ 주요 액션 처리 실패:', error);
      showPOSNotification('작업 처리 중 오류가 발생했습니다.', 'error');
    }
  }

  // 기존 메서드들 유지 (하위 호환성)
  static async loadTableOrders(tableNumber) {
    await this.initializeSession(tableNumber);
  }

  // 메뉴를 주문에 추가 (임시 주문)
  static addMenuToOrder(menuName, price, notes = '') {
    const currentTable = POSStateManager.getCurrentTable();
    if (!currentTable) {
      showPOSNotification('테이블이 선택되지 않았습니다.', 'warning');
      return;
    }

    try {
      console.log(`🍽️ 메뉴 추가: ${menuName} (₩${price})`);

      const pendingItems = POSStateManager.getPendingItems();
      const existingItem = pendingItems.find(item => item.name === menuName && !item.isDeleted);

      if (existingItem) {
        existingItem.quantity += 1;
        showPOSNotification(`${menuName} 수량 +1 (총 ${existingItem.quantity}개) [임시]`, 'info');
      } else {
        const newItem = {
          id: `pending_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          name: menuName,
          price: parseInt(price),
          quantity: 1,
          discount: 0,
          notes: notes,
          status: 'pending',
          createdAt: new Date().toISOString(),
          isConfirmed: false,
          isPending: true
        };
        pendingItems.push(newItem);
        showPOSNotification(`${menuName} 임시 주문에 추가됨`, 'success');
      }

      // 상태 즉시 업데이트
      POSStateManager.setPendingItems(pendingItems);
      this.updateCombinedOrder();
      POSTempStorage.saveTempOrder();

      console.log(`📝 현재 임시 주문 상태:`, pendingItems);

      // UI 강제 업데이트 (비동기 처리로 확실히 실행)
      setTimeout(() => {
        if (typeof POSUIRenderer !== 'undefined') {
          console.log(`🎨 UI 업데이트 시작 - 임시 아이템: ${pendingItems.length}개`);
          POSUIRenderer.renderOrderItems();
          POSUIRenderer.renderPaymentSummary();
          POSUIRenderer.updatePrimaryActionButton();
          console.log(`✅ UI 업데이트 완료`);
        } else {
          console.error('❌ POSUIRenderer를 찾을 수 없습니다');
        }
      }, 50);

      console.log('✅ 메뉴 추가 완료');

    } catch (error) {
      console.error('❌ 메뉴 추가 실패:', error);
      showPOSNotification('메뉴 추가 중 오류가 발생했습니다.', 'error');
    }
  }

  static async confirmOrder() {
    try {
      const currentTable = POSStateManager.getCurrentTable();
      const currentStore = POSStateManager.getCurrentStore();
      const tempItems = POSStateManager.getTempOrderItems();

      if (!tempItems || tempItems.length === 0) {
        showPOSNotification('주문할 메뉴가 없습니다.', 'warning');
        return false;
      }

      showPOSNotification('주문을 처리하고 있습니다...', 'info');

      // 서버에 주문 전송
      const response = await fetch('/api/pos/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          store_id: currentStore.id,
          table_number: currentTable,
          items: tempItems,
          order_type: 'pos',
          status: 'confirmed'
        })
      });

      if (!response.ok) {
        throw new Error(`주문 처리 실패: ${response.status}`);
      }

      const result = await response.json();
      
      // 성공 시 상태 업데이트
      POSStateManager.setCurrentSession({
        checkId: result.checkId,
        status: 'active',
        items: result.items || [],
        orderCount: result.items ? result.items.length : 0
      });

      // 임시 주문 정리
      POSStateManager.clearTempOrderItems();
      POSTempStorage.clearTempOrder();

      // UI 즉시 업데이트
      if (typeof POSUIRenderer !== 'undefined') {
        POSUIRenderer.renderOrderItems();
        POSUIRenderer.renderPaymentSummary();
        POSUIRenderer.updatePrimaryActionButton();
      }

      showPOSNotification(
        `주문 확정 완료! 체크 ID: ${result.checkId}`, 
        'success'
      );

      console.log('✅ 주문 확정 완료:', result);
      return true;

    } catch (error) {
      console.error('❌ 주문 확정 실패:', error);
      showPOSNotification('주문 확정에 실패했습니다.', 'error');
      return false;
    }
  }

  // 주문 초기화
  static clearOrder() {
    try {
      // 상태 초기화
      POSStateManager.clearTempOrderItems();
      POSStateManager.clearSelectedItems();

      // 임시저장소 초기화
      POSTempStorage.clearTempOrder();

      // UI 즉시 업데이트
      if (typeof POSUIRenderer !== 'undefined') {
        POSUIRenderer.renderOrderItems();
        POSUIRenderer.renderPaymentSummary();
        POSUIRenderer.updatePrimaryActionButton();
      }

      showPOSNotification('임시 주문이 초기화되었습니다', 'info');
      console.log('🧹 주문 초기화 완료');
    } catch (error) {
      console.error('❌ 주문 초기화 실패:', error);
      showPOSNotification('주문 초기화 실패: ' + error.message, 'error');
    }
  }

  // 임시 주문 초기화
  static clearTempOrder() {
    try {
      this.clearOrder();
      console.log('🧹 임시 주문 초기화 완료');
    } catch (error) {
      console.error('❌ 임시 주문 초기화 실패:', error);
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

  // 선택된 아이템 삭제/취소
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
      if (!confirm(`확정된 ${confirmedItems.length}개와 임시 ${pendingItems.length}개를 삭제하시겠습니까?`)) {
        return;
      }

      // 확정된 아이템들 취소 처리
      for (const item of confirmedItems) {
        try {
          await POSDataLoader.cancelItem(item.id, 'POS에서 취소');
          this.logAuditEvent('ITEM_CANCELED', {
            itemId: item.id,
            menuName: item.name,
            quantity: item.quantity,
            reason: 'POS에서 취소'
          });
        } catch (error) {
          console.error(`❌ 아이템 ${item.id} 취소 실패:`, error);
          showPOSNotification(`${item.name} 취소 실패: ${error.message}`, 'error');
          return;
        }
      }
    }

    // 임시 아이템들 제거
    if (pendingItems.length > 0) {
      const filteredPending = POSStateManager.getPendingItems()
        .filter(item => !selectedItems.includes(item.id));
      POSStateManager.setPendingItems(filteredPending);
    }

    // 확정 아이템들 제거
    if (confirmedItems.length > 0) {
      const filteredConfirmed = POSStateManager.getConfirmedItems()
        .filter(item => !selectedItems.includes(item.id));
      POSStateManager.setConfirmedItems(filteredConfirmed);
    }

    POSStateManager.setSelectedItems([]);
    this.updateCombinedOrder();
    POSTempStorage.saveTempOrder();

    POSUIRenderer.renderOrderItems();
    POSUIRenderer.renderPaymentSummary();
    POSUIRenderer.updatePrimaryActionButton();

    showPOSNotification(`${selectedItemsData.length}개 아이템 삭제 완료`, 'success');
  }

  // 수량 변경
  static changeQuantity(itemId, change) {
    try {
      const updated = POSStateManager.changeItemQuantity(itemId, change);
      if (updated) {
        POSTempStorage.saveTempOrder();

        // UI 즉시 업데이트
        if (typeof POSUIRenderer !== 'undefined') {
          POSUIRenderer.renderOrderItems();
          POSUIRenderer.renderPaymentSummary();
          POSUIRenderer.updatePrimaryActionButton();
        }

        showPOSNotification(
          change > 0 ? '수량이 증가했습니다' : '수량이 감소했습니다', 
          'info'
        );
        console.log(`📝 수량 변경: ${itemId}, 변경량: ${change}`);
      }
    } catch (error) {
      console.error('❌ 수량 변경 실패:', error);
      showPOSNotification('수량 변경 실패: ' + error.message, 'error');
    }
  }

  // 전체 아이템 선택
  static selectAllItems() {
    const currentOrder = POSStateManager.getCurrentOrder();
    const allItemIds = currentOrder.map(item => item.id);
    POSStateManager.setSelectedItems(allItemIds);
    POSUIRenderer.renderOrderItems();
    showPOSNotification(`${allItemIds.length}개 아이템 전체 선택`, 'info');
  }

  // 할인 적용
  static applyDiscount(discountType, discountValue) {
    const selectedItems = POSStateManager.getSelectedItems();
    const currentOrder = POSStateManager.getCurrentOrder();

    if (selectedItems.length === 0) {
      showPOSNotification('할인을 적용할 아이템을 선택해주세요.', 'warning');
      return;
    }

    let appliedCount = 0;
    selectedItems.forEach(itemId => {
      const item = currentOrder.find(i => i.id === itemId);
      if (item && item.isPending) {
        if (discountType === 'percent') {
          item.discount = Math.floor(item.price * (discountValue / 100));
        } else if (discountType === 'amount') {
          item.discount = Math.min(discountValue, item.price);
        }
        appliedCount++;
      }
    });

    if (appliedCount > 0) {
      this.updateCombinedOrder();
      POSTempStorage.saveTempOrder();
      POSUIRenderer.renderOrderItems();
      POSUIRenderer.renderPaymentSummary();

      showPOSNotification(
        `${appliedCount}개 아이템에 할인 적용 (${discountType === 'percent' ? discountValue + '%' : '₩' + discountValue.toLocaleString()})`, 
        'success'
      );
    } else {
      showPOSNotification('임시 주문에만 할인을 적용할 수 있습니다.', 'warning');
    }
  }
}