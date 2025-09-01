// POS 시스템 메인 렌더링 모듈
import { POSStateManager } from './modules/posStateManager.js';
import { POSDataLoader } from './modules/posDataLoader.js';
import { POSTableManager } from './modules/posTableManager.js';
import { POSMenuManager } from './modules/posMenuManager.js';
import { POSOrderManager } from './modules/posOrderManager.js';
import { POSPaymentManager } from './modules/posPaymentManager.js';
import { POSTempStorage } from './modules/posTempStorage.js';
import { POSUIRenderer } from './modules/posUIRenderer.js';
import { showPOSNotification } from '../../utils/posNotification.js';
import { renderPOSLayout } from './posLayout.js'; // renderPOSLayout 함수 import

// POS 시스템 초기화
async function renderPOS() {
  try {
    console.log('📟 TableLink POS 시스템 초기화 중...');

    // 상태 초기화
    POSStateManager.initialize();

    // 기본 UI 렌더링
    renderPOSLayout();

    // URL 파라미터에서 매장 ID 추출
    const urlParams = new URLSearchParams(window.location.search);
    const storeId = urlParams.get('storeId');

    if (storeId) {
      console.log(`📟 URL에서 매장 ID 감지: ${storeId}`);
      await loadStoreForTableMap(storeId);
      startPeriodicUpdates();
    } else {
      showPOSNotification('매장 ID가 URL에 포함되어야 합니다.', 'error');
      return;
    }

    console.log('✅ TableLink POS 시스템 초기화 완료');
  } catch (error) {
    console.error('❌ POS 시스템 초기화 실패:', error);
    showPOSNotification('POS 시스템 초기화에 실패했습니다.', 'error');
  }
}

// 매장 정보 로드
async function loadStoreForTableMap(storeId) {
  try {
    const storeData = await POSDataLoader.loadStore(storeId);
    POSStateManager.setCurrentStore(storeData.store);

    document.getElementById('storeName').textContent = `${storeData.store.name}`;

    await Promise.all([
      POSDataLoader.loadStoreMenus(storeId),
      POSDataLoader.loadStoreTables(storeId)
    ]);

    await POSTableManager.renderTableMap();

    console.log(`✅ 매장 ${storeData.store.name} 로드 완료`);
    showPOSNotification(`${storeData.store.name} POS 시스템 준비 완료`);

  } catch (error) {
    console.error('❌ 매장 로드 실패:', error);
    showPOSNotification('매장 정보를 불러오는데 실패했습니다.', 'error');
  }
}

// 테이블 선택
async function selectTableFromMap(tableElementOrNumber) {
  let tableNumber;

  // 파라미터가 숫자인 경우 (직접 테이블 번호 전달)
  if (typeof tableElementOrNumber === 'number' || typeof tableElementOrNumber === 'string') {
    tableNumber = tableElementOrNumber.toString();
  } 
  // 파라미터가 DOM 엘리먼트인 경우
  else if (tableElementOrNumber && typeof tableElementOrNumber === 'object' && tableElementOrNumber.dataset) {
    tableNumber = tableElementOrNumber.dataset.tableNumber;eElementOrNumber.dataset?.tableNumber || 
                 tableElementOrNumber.getAttribute?.('data-table-number') ||
                 tableElementOrNumber.textContent?.match(/\d+/)?.[0];
  }

  if (!tableNumber) {
    console.error('❌ 테이블 번호를 찾을 수 없습니다:', tableElementOrNumber);
    showPOSNotification('테이블 번호를 찾을 수 없습니다.', 'error');
    return;
  }

  console.log(`🪑 테이블 ${tableNumber} 선택됨`);
  try {
    await POSTableManager.selectTable(tableNumber);
    await switchToOrderView();
    showPOSNotification(`테이블 ${tableNumber} 주문 화면으로 전환됨`);
  } catch (error) {
    console.error('❌ 테이블 선택 실패:', error);
    showPOSNotification('테이블 선택에 실패했습니다.', 'error');
  }
}

// 주문 화면으로 전환
async function switchToOrderView() {
  POSStateManager.setCurrentView('order');

  document.getElementById('tableMapView').classList.add('hidden');
  document.getElementById('orderView').classList.remove('hidden');

  const currentTable = POSStateManager.getCurrentTable();
  document.getElementById('orderTableTitle').textContent = `테이블 ${currentTable} - 주문/결제`;

  await POSOrderManager.loadTableOrders(currentTable);

  POSUIRenderer.updateTableInfo();
  POSMenuManager.renderMenuCategories();
  POSMenuManager.renderMenuGrid();
  POSUIRenderer.renderOrderItems();
  POSUIRenderer.renderPaymentSummary();
  POSUIRenderer.updatePrimaryActionButton();
}

// 테이블맵으로 돌아가기
function returnToTableMap() {
  POSOrderManager.clearTempOrder();
  POSStateManager.resetCurrentSession();

  document.getElementById('tableMapView').classList.remove('hidden');
  document.getElementById('orderView').classList.add('hidden');

  POSTableManager.renderTableMap();
  console.log('✅ 테이블맵으로 복귀 - 임시데이터 정리됨');
}

// 주기적 업데이트
function startPeriodicUpdates() {
  setInterval(() => {
    if (POSStateManager.getCurrentView() === 'table-map') {
      POSTableManager.renderTableMap();
    }
  }, 5000);
}

// ES6 모듈 export
export { renderPOS };

// 전역 함수 노출
window.renderPOS = renderPOS;
window.selectTableFromMap = selectTableFromMap;
window.returnToTableMap = returnToTableMap;

// 메뉴 관련 전역 함수
window.selectCategory = POSMenuManager.selectCategory.bind(POSMenuManager);
window.addMenuToOrder = (menuName, price) => POSOrderManager.addMenuToOrder(menuName, price);
window.searchMenus = POSMenuManager.searchMenus.bind(POSMenuManager);

// 주문 관리 전역 함수
window.toggleItemSelection = (itemId) => POSOrderManager.toggleItemSelection(itemId);
window.selectAllItems = () => POSOrderManager.selectAllItems();
window.deleteSelectedItems = () => POSOrderManager.deleteSelectedItems();
window.applyDiscount = (discountType, discountValue) => POSOrderManager.applyDiscount(discountType, discountValue);
window.changeQuantity = (itemId, change) => POSOrderManager.changeQuantity(itemId, change);
window.clearOrder = () => POSOrderManager.clearOrder();
window.confirmOrder = () => POSOrderManager.confirmOrder();
window.handlePrimaryAction = () => POSOrderManager.handlePrimaryAction();

// 결제 관련 전역 함수
window.processPayment = (paymentMethod) => POSPaymentManager.processPayment(paymentMethod);
window.handleDirectPayment = (paymentMethod) => POSPaymentManager.handleDirectPayment && POSPaymentManager.handleDirectPayment(paymentMethod);
window.confirmOrderAndPay = (paymentMethod) => POSPaymentManager.confirmOrderAndPay && POSPaymentManager.confirmOrderAndPay(paymentMethod);

// UI 업데이트 전역 함수
window.updatePrimaryActionButton = () => POSUIRenderer.updatePrimaryActionButton();
window.updatePaymentButtons = () => POSUIRenderer.updatePaymentButtons && POSUIRenderer.updatePaymentButtons();
window.updateTableInfo = () => POSUIRenderer.updateTableInfo();

// 임시저장 관련 전역 함수
window.saveTempOrder = () => POSTempStorage.saveTempOrder();
window.loadTempOrder = () => POSTempStorage.loadTempOrder();
window.clearTempOrder = () => POSTempStorage.clearTempOrder();

// 미구현 기능들
const unimplementedFeatures = {
  holdOrder: () => showPOSNotification('주문 보류 기능은 향후 구현 예정입니다.', 'info'),
  sendToKitchen: () => showPOSNotification('주방 전송 기능은 향후 구현 예정입니다.', 'info'),
  applyTLCoupon: () => showPOSNotification('TL 쿠폰 기능은 향후 구현 예정입니다.', 'info'),
  applyTLPoints: () => showPOSNotification('TL 포인트 기능은 향후 구현 예정입니다.', 'info'),
  checkTLLOrder: () => showPOSNotification('TLL 주문 연동 기능은 향후 구현 예정입니다.', 'info'),
  printReceipt: () => showPOSNotification('영수증 출력 기능은 향후 구현 예정입니다.', 'info'),
  showDailySales: () => showPOSNotification('일일정산 기능은 향후 구현 예정입니다.', 'info'),
  showReservations: () => showPOSNotification('예약 확인 기능은 향후 구현 예정입니다.', 'info'),
  showDeliveryOrders: () => showPOSNotification('배달/포장 주문 기능은 향후 구현 예정입니다.', 'info'),
  showDailyStats: () => showPOSNotification('매출 통계 기능은 향후 구현 예정입니다.', 'info'),
  showKitchenStatus: () => showPOSNotification('주방 현황 기능은 향후 구현 예정입니다.', 'info'),
  showPOSSettings: () => showPOSNotification('POS 설정 기능은 향후 구현 예정입니다.', 'info'),
  processComboPayment: () => showPOSNotification('복합 결제 기능은 향후 구현 예정입니다.', 'info'),
  toggleAdvancedPanel: () => showPOSNotification('고급 기능 패널은 향후 구현 예정입니다.', 'info'),
  holdCurrentOrder: () => showPOSNotification('주문 보류 기능은 향후 구현 예정입니다.', 'info'),
  voidOrder: () => {
    if (typeof POSOrderManager !== 'undefined' && POSOrderManager.clearOrder) {
      POSOrderManager.clearOrder();
    } else {
      showPOSNotification('주문 취소 기능을 로드할 수 없습니다.', 'error');
    }
  }
};

// 미구현 기능들을 전역으로 노출
Object.assign(window, unimplementedFeatures);