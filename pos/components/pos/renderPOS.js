// POS 시스템 메인 렌더링 모듈 - 단순 장바구니 방식
import { POSStateManager } from './modules/posStateManager.js';
import { POSDataLoader } from './modules/posDataLoader.js';
import { POSTableManager } from './modules/posTableManager.js';
import { POSMenuManager } from './modules/posMenuManager.js';
import { POSOrderManager } from './modules/posOrderManager.js';
import { POSPaymentManager } from './modules/posPaymentManager.js';
import { POSUIRenderer } from './modules/posUIRenderer.js';
import { showPOSNotification } from '../../utils/posNotification.js';
import { renderPOSLayout } from './posLayout.js';

// 🚀 POS 시스템 초기화
async function renderPOS() {
  try {
    console.log('📟 TableLink POS 초기화 시작 (단순 장바구니 방식)');

    POSStateManager.initialize();
    renderPOSLayout();

    const urlParams = new URLSearchParams(window.location.search);
    const storeId = urlParams.get('storeId');

    if (storeId) {
      await loadStoreForTableMap(storeId);
      setupPageUnloadHandler(); // 페이지 이탈 시 장바구니 정리
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

    const menuData = await POSDataLoader.loadStoreMenus(storeId);
    const tableData = await POSDataLoader.loadStoreTables(storeId);

    await POSTableManager.renderTableMap();
    POSMenuManager.renderMenuCategories();
    POSMenuManager.renderMenuGrid();

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

  console.log(`🪑 테이블 ${tableNumber} 선택`);

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

  await POSOrderManager.loadTableOrders(currentTable);

  // UI 렌더링
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
  // 장바구니 정리 확인
  const cartItems = POSStateManager.getCartItems();
  if (cartItems.length > 0) {
    if (!confirm(`장바구니에 ${cartItems.length}개 메뉴가 있습니다. 정말 나가시겠습니까? (장바구니 내용이 삭제됩니다)`)) {
      return;
    }
  }

  POSOrderManager.clearCart();
  POSStateManager.reset();

  document.getElementById('tableMapView').classList.remove('hidden');
  document.getElementById('orderView').classList.add('hidden');

  POSTableManager.renderTableMap();
  console.log('✅ 테이블맵 복귀');
}

// 📱 페이지 이탈 시 장바구니 정리
function setupPageUnloadHandler() {
  window.addEventListener('beforeunload', (event) => {
    const cartItems = POSStateManager.getCartItems();
    if (cartItems.length > 0) {
      POSOrderManager.handlePageUnload();
      // 브라우저 확인 대화상자는 표시하지 않음 (UX 개선)
    }
  });

  // 다른 페이지로 이동 시에도 장바구니 정리
  window.addEventListener('pagehide', () => {
    POSOrderManager.handlePageUnload();
  });
}

// ES6 모듈 export
export { renderPOS };

// 전역 함수 등록
window.renderPOS = renderPOS;
window.selectTableFromMap = selectTableFromMap;
window.returnToTableMap = returnToTableMap;

// 메뉴 관리
window.selectCategory = POSMenuManager.selectCategory.bind(POSMenuManager);
window.searchMenus = POSMenuManager.searchMenus.bind(POSMenuManager);

// 🛒 장바구니 메뉴 추가 (전역)
window.addMenuToOrder = (menuName, price, notes = '') => {
  try {
    console.log(`🛒 메뉴 장바구니 추가: ${menuName} (₩${price})`);

    if (!menuName || menuName.trim() === '') {
      showPOSNotification('메뉴명이 필요합니다', 'warning');
      return false;
    }

    if (!price || isNaN(price) || price <= 0) {
      showPOSNotification('유효한 가격이 필요합니다', 'warning');
      return false;
    }

    const success = POSOrderManager.addMenuToCart(menuName, price, notes);
    return success;

  } catch (error) {
    console.error('❌ 메뉴 추가 실패:', error);
    showPOSNotification('메뉴 추가 실패: ' + error.message, 'error');
    return false;
  }
};

// 🎨 메뉴 추가 시 UI 피드백
window.addMenuWithFeedback = (menuName, price, menuId, notes = '') => {
  console.log(`🍽️ UI 피드백 메뉴 추가: ${menuName} (₩${price})`);

  const success = window.addMenuToOrder(menuName, price, notes);

  // 버튼 애니메이션
  const menuCard = document.querySelector(`[data-menu-id="${menuId}"]`);
  if (menuCard && success) {
    const addBtn = menuCard.querySelector('.add-btn');
    if (addBtn) {
      addBtn.style.background = '#10b981';
      addBtn.innerHTML = '<span class="add-icon">✓</span>';

      setTimeout(() => {
        addBtn.style.background = '';
        addBtn.innerHTML = '<span class="add-icon">+</span>';
      }, 800);
    }
  }

  return success;
};

// 🎯 Primary Action 핸들러 (주문 확정)
window.handlePrimaryAction = () => {
  POSOrderManager.handlePrimaryAction();
};

// 🗑️ 장바구니 비우기
window.clearOrder = () => POSOrderManager.clearCart();

// 💳 결제 처리
window.processPayment = (paymentMethod = null) => {
  console.log('💳 결제 처리 시작');
  if (typeof POSPaymentManager !== 'undefined') {
    POSPaymentManager.processPayment(paymentMethod);
  } else {
    console.error('❌ POSPaymentManager를 찾을 수 없습니다');
    showPOSNotification('결제 시스템을 찾을 수 없습니다', 'error');
  }
};

// UI 업데이트
window.updatePrimaryActionButton = () => POSUIRenderer.updatePrimaryActionButton();
window.updateTableInfo = () => POSUIRenderer.updateTableInfo();

console.log('✅ 단순 장바구니 방식 POS 시스템 로드 완료');