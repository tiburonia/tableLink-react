// POS 시스템 메인 렌더링 모듈 - 정리된 버전
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
    console.log('📟 TableLink POS 초기화 시작');

    POSStateManager.initialize();
    renderPOSLayout();

    const urlParams = new URLSearchParams(window.location.search);
    const storeId = urlParams.get('storeId');

    if (storeId) {
      await loadStoreForTableMap(storeId);
    } else {
      showPOSNotification('매장 ID가 필요합니다', 'error');
      return;
    }

    console.log('✅ POS 초기화 완료');
  } catch (error) {
    console.error('❌ POS 초기화 실패:', error);
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
    console.error('❌ 매장 로드 실패:', error);
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
    console.error('❌ 테이블 번호 없음');
    showPOSNotification('테이블 번호를 찾을 수 없습니다', 'error');
    return;
  }

  try {
    await POSTableManager.selectTable(tableNumber);
    await switchToOrderView();
    showPOSNotification(`테이블 ${tableNumber} 선택됨`);
  } catch (error) {
    console.error('❌ 테이블 선택 실패:', error);
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

  await POSOrderManager.initializeSession(currentTable);

  POSUIRenderer.updateTableInfo();
  POSMenuManager.renderMenuCategories();
  POSMenuManager.renderMenuGrid();
  POSUIRenderer.renderOrderItems();
  POSUIRenderer.renderPaymentSummary();
  POSUIRenderer.updatePrimaryActionButton();

  console.log('✅ 주문 화면 전환 완료');
}

// 🔙 테이블맵 복귀
function returnToTableMap() {
  POSOrderManager.clearOrder();
  POSStateManager.reset();

  document.getElementById('tableMapView').classList.remove('hidden');
  document.getElementById('orderView').classList.add('hidden');

  POSTableManager.renderTableMap();
  console.log('✅ 테이블맵 복귀');
}

// ES6 모듈 export
export { renderPOS };

// 🌐 전역 함수 등록
window.renderPOS = renderPOS;
window.selectTableFromMap = selectTableFromMap;
window.returnToTableMap = returnToTableMap;

// 📝 메뉴 관리
window.selectCategory = POSMenuManager.selectCategory.bind(POSMenuManager);
window.addMenuToOrder = (menuName, price, notes = '') => {
  return POSOrderManager.addMenuToPending(menuName, price, notes);
};
window.searchMenus = POSMenuManager.searchMenus.bind(POSMenuManager);

// 📋 주문 관리
window.clearOrder = () => POSOrderManager.clearOrder();
window.confirmOrder = () => POSOrderManager.confirmPendingOrder();
window.handlePrimaryAction = () => POSOrderManager.handlePrimaryAction();

// 💳 결제 관리
window.processPayment = (paymentMethod = null) => {
  if (typeof POSPaymentManager !== 'undefined') {
    POSPaymentManager.processPayment(paymentMethod);
  } else {
    showPOSNotification('결제 시스템을 찾을 수 없습니다', 'error');
  }
};

// 🎨 UI 업데이트
window.updatePrimaryActionButton = () => POSUIRenderer.updatePrimaryActionButton();
window.updateTableInfo = () => POSUIRenderer.updateTableInfo();

// 💾 임시저장
window.saveTempOrder = () => POSTempStorage.saveTempOrder();
window.loadTempOrder = () => POSTempStorage.loadTempOrder();

// POSOrderManager를 전역에서 접근 가능하게
window.POSOrderManager = POSOrderManager;
window.POSStateManager = POSStateManager;

console.log('✅ POS 렌더링 모듈 로드 완료');