
// POS 시스템 메인 렌더링 모듈 - 새 시스템 전용
import { POSStateManager } from './modules/posStateManager.js';
import { POSDataLoader } from './modules/posDataLoader.js';
import { POSTableManager } from './modules/posTableManager.js';
import { POSMenuManager } from './modules/posMenuManager.js';
import { POSOrderManager } from './modules/posOrderManager.js';
import { POSPaymentManager } from './modules/posPaymentManager.js';
import { POSTempStorage } from './modules/posTempStorage.js';
import { POSUIRenderer } from './modules/posUIRenderer.js';
import { showPOSNotification } from '../../utils/posNotification.js';
import { renderPOSLayout } from './posLayout.js';

// 🚀 POS 시스템 초기화
async function renderPOS() {
  try {
    console.log('📟 새 시스템: TableLink POS 초기화 시작');

    POSStateManager.initialize();
    renderPOSLayout();

    const urlParams = new URLSearchParams(window.location.search);
    const storeId = urlParams.get('storeId');

    if (storeId) {
      await loadStoreForTableMap(storeId);
      startPeriodicUpdates();
    } else {
      showPOSNotification('매장 ID가 필요합니다', 'error');
      return;
    }

    console.log('✅ 새 시스템: POS 초기화 완료');
  } catch (error) {
    console.error('❌ 새 시스템: POS 초기화 실패:', error);
    showPOSNotification('POS 초기화 실패', 'error');
  }
}

// 🏪 매장 정보 로드
async function loadStoreForTableMap(storeId) {
  try {
    const storeData = await POSDataLoader.loadStore(storeId);
    POSStateManager.setCurrentStore(storeData.store);

    document.getElementById('storeName').textContent = storeData.store.name;

    await Promise.all([
      POSDataLoader.loadStoreMenus(storeId),
      POSDataLoader.loadStoreTables(storeId)
    ]);

    await POSTableManager.renderTableMap();
    showPOSNotification(`${storeData.store.name} POS 준비 완료`);

  } catch (error) {
    console.error('❌ 새 시스템: 매장 로드 실패:', error);
    showPOSNotification('매장 정보 로드 실패', 'error');
  }
}

// 🪑 테이블 선택
async function selectTableFromMap(tableElementOrNumber) {
  let tableNumber;

  if (typeof tableElementOrNumber === 'number' || typeof tableElementOrNumber === 'string') {
    tableNumber = tableElementOrNumber.toString();
  } else if (tableElementOrNumber && typeof tableElementOrNumber === 'object') {
    const element = tableElementOrNumber.target || tableElementOrNumber;
    tableNumber = element.dataset?.tableNumber || 
                 element.getAttribute?.('data-table-number') ||
                 element.closest?.('[data-table-number]')?.dataset?.tableNumber ||
                 element.textContent?.match(/T?(\d+)/)?.[1];
  }

  if (!tableNumber) {
    console.error('❌ 새 시스템: 테이블 번호 없음');
    showPOSNotification('테이블 번호를 찾을 수 없습니다', 'error');
    return;
  }

  console.log(`🪑 새 시스템: 테이블 ${tableNumber} 선택`);
  
  try {
    await POSTableManager.selectTable(tableNumber);
    await switchToOrderView();
    showPOSNotification(`테이블 ${tableNumber} 선택됨`);
  } catch (error) {
    console.error('❌ 새 시스템: 테이블 선택 실패:', error);
    showPOSNotification('테이블 선택 실패', 'error');
  }
}

// 📱 주문 화면 전환
async function switchToOrderView() {
  POSStateManager.setCurrentView('order');

  document.getElementById('tableMapView').classList.add('hidden');
  document.getElementById('orderView').classList.remove('hidden');

  const currentTable = POSStateManager.getCurrentTable();
  document.getElementById('orderTableTitle').textContent = `테이블 ${currentTable} - 주문/결제`;

  await POSOrderManager.loadTableOrders(currentTable);

  // DOM 준비 확인 후 UI 렌더링
  await ensureDOMReady();
  
  try {
    POSUIRenderer.updateTableInfo();
    POSMenuManager.renderMenuCategories();
    POSMenuManager.renderMenuGrid();
    
    // 주문 항목 렌더링 다중 시도
    for (let i = 0; i < 3; i++) {
      await new Promise(resolve => setTimeout(resolve, 50 * i));
      POSUIRenderer.renderOrderItems();
      
      const orderContainer = document.getElementById('orderItems') || document.getElementById('orderItemsList');
      if (orderContainer) {
        console.log(`✅ ${i + 1}번째 시도에서 주문 렌더링 성공`);
        break;
      }
    }
    
    POSUIRenderer.renderPaymentSummary();
    POSUIRenderer.updatePrimaryActionButton();
    
    console.log('✅ 주문 화면 전환 완료');
  } catch (error) {
    console.error('❌ 주문 화면 UI 렌더링 실패:', error);
  }
}

// DOM 준비 확인 함수
async function ensureDOMReady() {
  return new Promise((resolve) => {
    if (document.readyState === 'complete') {
      resolve();
    } else {
      const checkReady = () => {
        if (document.readyState === 'complete') {
          resolve();
        } else {
          setTimeout(checkReady, 10);
        }
      };
      checkReady();
    }
  });
}

// 🔙 테이블맵 복귀
function returnToTableMap() {
  POSOrderManager.clearOrder();
  POSStateManager.reset();

  document.getElementById('tableMapView').classList.remove('hidden');
  document.getElementById('orderView').classList.add('hidden');

  POSTableManager.renderTableMap();
  console.log('✅ 새 시스템: 테이블맵 복귀');
}

// 🔄 주기적 업데이트
function startPeriodicUpdates() {
  setInterval(() => {
    if (POSStateManager.getCurrentView() === 'table-map') {
      POSTableManager.renderTableMap();
    }
  }, 5000);
}

// ES6 모듈 export
export { renderPOS };

// 🌐 새 시스템 전역 함수 (레거시 제거)
window.renderPOS = renderPOS;
window.selectTableFromMap = selectTableFromMap;
window.returnToTableMap = returnToTableMap;

// 📝 메뉴 관리
window.selectCategory = POSMenuManager.selectCategory.bind(POSMenuManager);
window.addMenuToOrder = (menuName, price, notes = '') => {
  console.log(`🍽️ 전역 함수 호출: 메뉴 추가 - ${menuName} (₩${price})`);
  
  try {
    // 입력 검증
    if (!menuName || menuName.trim() === '') {
      console.error('❌ 메뉴명이 비어있습니다');
      showPOSNotification('메뉴명이 필요합니다', 'warning');
      return false;
    }

    if (!price || isNaN(price) || price <= 0) {
      console.error('❌ 가격이 유효하지 않습니다');
      showPOSNotification('유효한 가격이 필요합니다', 'warning');
      return false;
    }

    // 새 시스템 메뉴 추가
    POSOrderManager.addMenuToPending(menuName, price, notes);
    return true;

  } catch (error) {
    console.error('❌ 메뉴 추가 실패:', error);
    showPOSNotification('메뉴 추가 실패: ' + error.message, 'error');
    return false;
  }
};
window.searchMenus = POSMenuManager.searchMenus.bind(POSMenuManager);

// 📋 주문 관리
window.toggleItemSelection = (itemId) => POSOrderManager.toggleItemSelection(itemId);
window.selectAllItems = () => POSOrderManager.selectAllItems();
window.deleteSelectedItems = () => POSOrderManager.deleteSelectedItems();
window.changeQuantity = (itemId, change) => POSOrderManager.changeQuantity(itemId, change);
window.clearOrder = () => POSOrderManager.clearOrder();
window.confirmOrder = () => POSOrderManager.confirmOrder();
window.handlePrimaryAction = () => POSOrderManager.handlePrimaryAction();
window.applyDiscount = (type, value) => POSOrderManager.applyDiscount(type, value);

// 💳 결제 관리 (새 시스템)
window.processPayment = (paymentMethod = null) => {
  console.log('💳 전역 결제 함수 호출 - 새 시스템');
  if (typeof POSPaymentManager !== 'undefined') {
    POSPaymentManager.processPayment(paymentMethod);
  } else {
    console.error('❌ POSPaymentManager를 찾을 수 없습니다');
    showPOSNotification('결제 시스템을 찾을 수 없습니다', 'error');
  }
};

// 🔧 UI 업데이트
window.updatePrimaryActionButton = () => POSUIRenderer.updatePrimaryActionButton();
window.updateTableInfo = () => POSUIRenderer.updateTableInfo();

// 💾 임시저장
window.saveTempOrder = () => POSTempStorage.saveTempOrder();
window.loadTempOrder = () => POSTempStorage.loadTempOrder();
window.clearTempOrder = () => POSOrderManager.clearTempOrder();

// 🎯 ordercontrol nav button 전용 함수들
window.changeSelectedQuantity = (change) => POSOrderManager.changeSelectedQuantity(change);
window.deleteSelectedPendingItems = () => POSOrderManager.deleteSelectedPendingItems();
window.savePendingChanges = () => POSOrderManager.savePendingChanges();
window.confirmSelectedPendingItems = () => POSOrderManager.confirmSelectedPendingItems();
window.requestCancelSelectedItems = () => POSOrderManager.requestCancelSelectedItems();
window.clearOrderSelection = () => {
  POSStateManager.setSelectedItems([]);
  POSOrderManager.refreshUI();
  showPOSNotification('선택 해제됨', 'info');
};

console.log('✅ 새 시스템: 전역 함수 등록 완료 (ordercontrol nav button 포함)');
