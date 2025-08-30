
// POS 세션 관리 모듈 - 실시간 주문 상태 동기화 및 충돌 방지

let sessionManager = {
  currentSession: null,
  sessionTimers: new Map(),
  conflictResolution: 'merge', // 'merge', 'overwrite', 'prompt'
  autoSaveInterval: 30000, // 30초마다 자동 저장
  maxSessionDuration: 4 * 60 * 60 * 1000, // 4시간 세션 만료
  lastSyncTime: null
};

// 테이블 세션 검증
async function validateTableSession(tableNumber) {
  try {
    console.log(`🔍 테이블 ${tableNumber} 세션 검증 시작`);

    const response = await fetch(`/api/pos/stores/${window.currentStore.id}/table/${tableNumber}/session-status`);
    const data = await response.json();

    if (!data.success) {
      return {
        canAddItems: false,
        message: '세션 상태를 확인할 수 없습니다.'
      };
    }

    const { hasActiveSession, sessionInfo, conflictingSessions } = data;

    // 충돌하는 세션이 있는 경우
    if (conflictingSessions && conflictingSessions.length > 0) {
      return await handleSessionConflict(conflictingSessions);
    }

    // 세션 시간 만료 검증
    if (hasActiveSession && sessionInfo) {
      const sessionStartTime = new Date(sessionInfo.startTime);
      const now = new Date();
      const sessionDuration = now - sessionStartTime;

      if (sessionDuration > sessionManager.maxSessionDuration) {
        return {
          canAddItems: false,
          message: '세션이 만료되었습니다. 새로운 주문을 시작해주세요.'
        };
      }

      // 기존 세션 정보 업데이트
      sessionManager.currentSession = sessionInfo;
    }

    return {
      canAddItems: true,
      message: 'OK',
      sessionInfo: sessionInfo
    };

  } catch (error) {
    console.error('❌ 세션 검증 실패:', error);
    return {
      canAddItems: false,
      message: '세션 검증 중 오류가 발생했습니다.'
    };
  }
}

// 세션 충돌 처리
async function handleSessionConflict(conflictingSessions) {
  console.log('⚠️ 세션 충돌 감지:', conflictingSessions);

  if (sessionManager.conflictResolution === 'prompt') {
    return await showSessionConflictModal(conflictingSessions);
  } else if (sessionManager.conflictResolution === 'merge') {
    return await mergeConflictingSessions(conflictingSessions);
  } else {
    // overwrite - 기존 세션 덮어쓰기
    return {
      canAddItems: true,
      message: '기존 세션을 덮어쓰고 새 주문을 시작합니다.'
    };
  }
}

// 충돌 세션 병합
async function mergeConflictingSessions(sessions) {
  try {
    console.log('🔄 세션 병합 시작');

    // 모든 세션의 아이템을 합치기
    const mergedItems = [];
    let totalAmount = 0;

    sessions.forEach(session => {
      if (session.items) {
        session.items.forEach(item => {
          const existingItem = mergedItems.find(merged => merged.name === item.name);
          if (existingItem) {
            existingItem.quantity += item.quantity;
          } else {
            mergedItems.push({ ...item });
          }
          totalAmount += item.price * item.quantity;
        });
      }
    });

    // 현재 주문에 반영
    window.currentOrder = mergedItems.map(item => ({
      id: generateOrderItemId(),
      name: item.name,
      price: item.price,
      quantity: item.quantity,
      discount: 0,
      note: '',
      addedAt: new Date().toISOString()
    }));

    console.log(`✅ 세션 병합 완료: ${mergedItems.length}개 아이템, 총 ₩${totalAmount.toLocaleString()}`);

    return {
      canAddItems: true,
      message: `기존 세션과 병합되었습니다. (${mergedItems.length}개 아이템)`
    };

  } catch (error) {
    console.error('❌ 세션 병합 실패:', error);
    return {
      canAddItems: false,
      message: '세션 병합 중 오류가 발생했습니다.'
    };
  }
}

// 고유 주문 아이템 ID 생성
function generateOrderItemId() {
  return `item_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// 세션 자동 저장
async function autoSaveSession() {
  if (!window.currentTable || !window.currentOrder || window.currentOrder.length === 0) {
    return;
  }

  try {
    const sessionData = {
      tableNumber: window.currentTable,
      items: window.currentOrder.map(item => ({
        id: item.id,
        name: item.name,
        price: item.price,
        quantity: item.quantity,
        discount: item.discount,
        note: item.note,
        addedAt: item.addedAt
      })),
      lastModified: new Date().toISOString(),
      sessionType: 'auto_save'
    };

    // 로컬 스토리지에 임시 저장
    localStorage.setItem(`pos_session_${window.currentStore.id}_${window.currentTable}`, JSON.stringify(sessionData));
    sessionManager.lastSyncTime = new Date();

    console.log(`💾 세션 자동 저장 완료 (테이블 ${window.currentTable})`);

  } catch (error) {
    console.error('❌ 세션 자동 저장 실패:', error);
  }
}

// 세션 복구
async function restoreSession(tableNumber) {
  try {
    const sessionKey = `pos_session_${window.currentStore.id}_${tableNumber}`;
    const savedSession = localStorage.getItem(sessionKey);

    if (savedSession) {
      const sessionData = JSON.parse(savedSession);
      const sessionAge = new Date() - new Date(sessionData.lastModified);

      // 세션이 1시간 이내인 경우에만 복구
      if (sessionAge < 60 * 60 * 1000) {
        console.log(`🔄 세션 복구 중 (테이블 ${tableNumber}):`, sessionData);

        if (confirm(`테이블 ${tableNumber}의 임시 저장된 주문이 있습니다. 복구하시겠습니까?\n(${sessionData.items.length}개 아이템, ${Math.floor(sessionAge / 60000)}분 전 저장)`)) {
          window.currentOrder = sessionData.items;
          renderOrderItems();
          renderPaymentSummary();
          updateButtonStates();
          updateOrderStatus('세션 복구됨', 'ordering');

          showPOSNotification(`임시 저장된 주문이 복구되었습니다. (${sessionData.items.length}개 아이템)`, 'success');
          return true;
        }
      } else {
        // 오래된 세션 삭제
        localStorage.removeItem(sessionKey);
        console.log(`🗑️ 만료된 세션 삭제 (테이블 ${tableNumber})`);
      }
    }

    return false;

  } catch (error) {
    console.error('❌ 세션 복구 실패:', error);
    return false;
  }
}

// 실시간 주문 업데이트 브로드캐스트
function broadcastOrderUpdate(type, data) {
  if (global.posWebSocket && window.currentStore) {
    const updateData = {
      type: type,
      tableNumber: window.currentTable,
      storeId: window.currentStore.id,
      timestamp: new Date().toISOString(),
      data: data
    };

    global.posWebSocket.emit('pos-order-update', updateData);
    console.log(`📡 실시간 주문 업데이트 전송:`, updateData);
  }
}

// 주문 통계 업데이트
function updateOrderStatistics() {
  if (!window.currentOrder) return;

  const stats = {
    totalItems: window.currentOrder.reduce((sum, item) => sum + item.quantity, 0),
    totalAmount: window.currentOrder.reduce((sum, item) => sum + (item.price * item.quantity - item.discount), 0),
    uniqueMenus: window.currentOrder.length,
    averageItemPrice: 0
  };

  if (stats.totalItems > 0) {
    stats.averageItemPrice = Math.round(stats.totalAmount / stats.totalItems);
  }

  // 헤더 영역 통계 업데이트
  updateHeaderStatistics(stats);

  return stats;
}

// 헤더 통계 업데이트
function updateHeaderStatistics(stats) {
  // 알림 영역에 현재 주문 통계 표시
  const notificationArea = document.getElementById('notificationArea');
  if (notificationArea && stats.totalItems > 0) {
    const countElement = document.getElementById('notificationCount');
    if (countElement) {
      countElement.textContent = stats.totalItems;
      countElement.classList.remove('hidden');
      countElement.title = `총 ${stats.uniqueMenus}개 메뉴, ₩${stats.totalAmount.toLocaleString()}`;
    }
  } else if (notificationArea) {
    const countElement = document.getElementById('notificationCount');
    if (countElement) {
      countElement.classList.add('hidden');
    }
  }
}

// 테이블 타이머 관리
function startTableTimer(tableNumber) {
  const timerKey = `table_${tableNumber}`;
  
  if (tableTimers.has(timerKey)) {
    clearInterval(tableTimers.get(timerKey));
  }

  const startTime = new Date();
  const timerId = setInterval(() => {
    updateTableTimerDisplay(tableNumber, startTime);
  }, 1000);

  tableTimers.set(timerKey, timerId);
  console.log(`⏰ 테이블 ${tableNumber} 타이머 시작`);
}

// 테이블 타이머 표시 업데이트
function updateTableTimerDisplay(tableNumber, startTime) {
  const elapsed = new Date() - startTime;
  const minutes = Math.floor(elapsed / 60000);
  const seconds = Math.floor((elapsed % 60000) / 1000);
  
  const timerText = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  
  // 테이블맵의 해당 테이블 업데이트
  const tableElement = document.querySelector(`[data-table="${tableNumber}"] .table-time`);
  if (tableElement) {
    tableElement.textContent = timerText;
  }
}

// 테이블 타이머 중지
function stopTableTimer(tableNumber) {
  const timerKey = `table_${tableNumber}`;
  
  if (tableTimers.has(timerKey)) {
    clearInterval(tableTimers.get(timerKey));
    tableTimers.delete(timerKey);
    console.log(`⏰ 테이블 ${tableNumber} 타이머 중지`);
  }
}

// 사운드 알림 재생
function playNotificationSound(type) {
  if (!soundSettings[type]) return;

  // Web Audio API를 사용한 간단한 알림음
  try {
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    // 타입별 다른 주파수
    const frequencies = {
      newOrder: [800, 1000, 1200],
      paymentComplete: [400, 600],
      errorAlert: [300, 200, 300]
    };

    const freq = frequencies[type] || [500];
    
    freq.forEach((frequency, index) => {
      oscillator.frequency.setValueAtTime(frequency, audioContext.currentTime + index * 0.1);
    });

    gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);

    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.3);

  } catch (error) {
    console.log('🔇 사운드 재생 실패 (지원되지 않는 브라우저)');
  }
}

// 주문 항목 검증
function validateOrderItem(item) {
  const errors = [];

  if (!item.name || item.name.trim() === '') {
    errors.push('메뉴명이 없습니다.');
  }

  if (!item.price || item.price <= 0) {
    errors.push('올바르지 않은 가격입니다.');
  }

  if (!item.quantity || item.quantity <= 0 || item.quantity > 99) {
    errors.push('수량은 1-99개 사이여야 합니다.');
  }

  if (item.discount && item.discount < 0) {
    errors.push('할인 금액은 0원 이상이어야 합니다.');
  }

  if (item.discount && item.discount >= (item.price * item.quantity)) {
    errors.push('할인 금액이 상품 금액보다 클 수 없습니다.');
  }

  return {
    isValid: errors.length === 0,
    errors: errors
  };
}

// 전체 주문 검증
function validateOrderList(orderList) {
  if (!Array.isArray(orderList) || orderList.length === 0) {
    return {
      isValid: false,
      errors: ['주문 목록이 비어있습니다.']
    };
  }

  const allErrors = [];
  let isValid = true;

  orderList.forEach((item, index) => {
    const validation = validateOrderItem(item);
    if (!validation.isValid) {
      isValid = false;
      validation.errors.forEach(error => {
        allErrors.push(`항목 ${index + 1}: ${error}`);
      });
    }
  });

  // 중복 메뉴 검사
  const menuNames = orderList.map(item => item.name);
  const duplicates = menuNames.filter((name, index) => menuNames.indexOf(name) !== index);
  
  if (duplicates.length > 0) {
    allErrors.push(`중복된 메뉴가 있습니다: ${duplicates.join(', ')}`);
    isValid = false;
  }

  return {
    isValid: isValid,
    errors: allErrors
  };
}

// 자동 백업 시스템
function startAutoBackup() {
  if (sessionManager.autoSaveInterval) {
    clearInterval(sessionManager.autoSaveInterval);
  }

  sessionManager.autoSaveInterval = setInterval(async () => {
    if (window.currentOrder && window.currentOrder.length > 0) {
      await autoSaveSession();
    }
  }, 30000); // 30초마다

  console.log('💾 자동 백업 시스템 시작 (30초 간격)');
}

// 세션 충돌 모달 표시
async function showSessionConflictModal(conflictingSessions) {
  return new Promise((resolve) => {
    const modal = document.createElement('div');
    modal.className = 'session-conflict-modal';
    modal.innerHTML = `
      <div class="modal-overlay">
        <div class="modal-content">
          <div class="modal-header">
            <h3>⚠️ 세션 충돌 감지</h3>
          </div>
          <div class="modal-body">
            <p>다른 기기에서 이 테이블의 주문을 진행 중입니다.</p>
            <div class="conflict-sessions">
              ${conflictingSessions.map(session => `
                <div class="conflict-session">
                  <div class="session-info">
                    <span class="session-device">${session.deviceInfo || '알 수 없는 기기'}</span>
                    <span class="session-time">${formatTimeAgo(session.lastActivity)}</span>
                  </div>
                  <div class="session-items">${session.itemCount || 0}개 아이템</div>
                </div>
              `).join('')}
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn btn-secondary" onclick="resolveConflict('cancel')">취소</button>
            <button class="btn btn-warning" onclick="resolveConflict('merge')">병합</button>
            <button class="btn btn-danger" onclick="resolveConflict('overwrite')">덮어쓰기</button>
          </div>
        </div>
      </div>
      <style>
        .session-conflict-modal .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: rgba(0, 0, 0, 0.6);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 10000;
        }
        .session-conflict-modal .modal-content {
          background: white;
          border-radius: 12px;
          width: 90%;
          max-width: 500px;
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
        }
        .conflict-session {
          padding: 12px;
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          margin-bottom: 8px;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .btn-warning {
          background: #f59e0b;
          color: white;
        }
        .btn-danger {
          background: #ef4444;
          color: white;
        }
      </style>
    `;

    document.body.appendChild(modal);

    window.resolveConflict = (action) => {
      modal.remove();
      delete window.resolveConflict;

      if (action === 'cancel') {
        resolve({
          canAddItems: false,
          message: '주문이 취소되었습니다.'
        });
      } else if (action === 'merge') {
        resolve(mergeConflictingSessions(conflictingSessions));
      } else if (action === 'overwrite') {
        resolve({
          canAddItems: true,
          message: '기존 세션을 덮어쓰고 새 주문을 시작합니다.'
        });
      }
    };
  });
}

// 시간 포맷팅
function formatTimeAgo(dateString) {
  const date = new Date(dateString);
  const now = new Date();
  const diffMinutes = Math.floor((now - date) / (1000 * 60));

  if (diffMinutes < 1) return '방금 전';
  if (diffMinutes < 60) return `${diffMinutes}분 전`;

  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours}시간 전`;

  return date.toLocaleDateString();
}

// 세션 정리
function cleanupSession(tableNumber) {
  // 로컬 스토리지 정리
  const sessionKey = `pos_session_${window.currentStore.id}_${tableNumber}`;
  localStorage.removeItem(sessionKey);

  // 타이머 정리
  stopTableTimer(tableNumber);

  // 전역 변수 초기화
  if (window.currentTable === tableNumber) {
    window.currentOrder = [];
    selectedItems = [];
    sessionManager.currentSession = null;
  }

  console.log(`🧹 테이블 ${tableNumber} 세션 정리 완료`);
}

// 전역 함수 등록
window.validateTableSession = validateTableSession;
window.autoSaveSession = autoSaveSession;
window.restoreSession = restoreSession;
window.generateOrderItemId = generateOrderItemId;
window.broadcastOrderUpdate = broadcastOrderUpdate;
window.updateOrderStatistics = updateOrderStatistics;
window.startTableTimer = startTableTimer;
window.stopTableTimer = stopTableTimer;
window.playNotificationSound = playNotificationSound;
window.validateOrderItem = validateOrderItem;
window.validateOrderList = validateOrderList;
window.cleanupSession = cleanupSession;
window.sessionManager = sessionManager;

console.log('✅ POS 세션 관리 모듈 로드 완료');
