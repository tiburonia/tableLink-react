/**
 * POS 메인 렌더링 함수
 * - 깔끔하고 단순한 구조
 * - 새로운 주문 관리 시스템 연동
 */

async function renderPOS() {
  console.log('🚀 새로운 POS 시스템 렌더링 시작');

  const main = document.getElementById('main');
  if (!main) {
    console.error('❌ main 엘리먼트를 찾을 수 없습니다');
    return;
  }

  try {
    // URL 파라미터 확인
    const urlParams = new URLSearchParams(window.location.search);
    const storeId = urlParams.get('storeId');

    if (!storeId) {
      main.innerHTML = `
        <div style="padding: 40px; text-align: center;">
          <h2>⚠️ 매장 정보가 없습니다</h2>
          <p>올바른 URL로 접속해주세요</p>
        </div>
      `;
      return;
    }

    // POS 레이아웃 렌더링
    await renderPOSLayout();

    // 매장 및 메뉴 데이터 로드
    await loadStoreData(storeId);

    console.log('✅ 새로운 POS 시스템 렌더링 완료');

  } catch (error) {
    console.error('❌ POS 렌더링 실패:', error);
    main.innerHTML = `
      <div style="padding: 40px; text-align: center; color: #ef4444;">
        <h2>🚨 시스템 오류</h2>
        <p>POS 시스템을 불러올 수 없습니다</p>
        <p style="font-size: 14px; color: #6b7280;">${error.message}</p>
      </div>
    `;
  }
}

async function loadStoreData(storeId) {
  try {
    console.log('🏪 매장 데이터 로딩 시작:', storeId);

    // 매장 정보 로드
    const storeResponse = await fetch(`/api/stores/${storeId}/detail`);
    const storeData = await storeResponse.json();

    if (storeData.success) {
      window.currentStore = storeData.store;
      console.log('✅ 매장 정보 로드 완료:', storeData.store.name);
    }

    // 메뉴 데이터 로드
    const menuResponse = await fetch(`/api/pos/menu?storeId=${storeId}`);
    const menuData = await menuResponse.json();

    if (menuData.success) {
      window.currentMenus = menuData.menus;
      console.log('🍽️ 메뉴 데이터 로드 완료:', menuData.menus.length, '개');

      // 메뉴 UI 렌더링
      if (window.posMenuManager) {
        window.posMenuManager.renderMenus(menuData.menus);
      }
    }

    // 초기 UI 업데이트
    if (window.posUIRenderer) {
      window.posUIRenderer.updateOrderDisplay();
      window.posUIRenderer.updateActionButton();
    }

  } catch (error) {
    console.error('❌ 매장 데이터 로딩 실패:', error);
    throw new Error('매장 데이터를 불러올 수 없습니다');
  }
}

// 전역 함수들 - 레거시 호환성
window.renderPOS = renderPOS;

// 즉시 실행하여 전역 등록 보장
if (typeof window !== 'undefined') {
  window.renderPOS = renderPOS;
  console.log('✅ renderPOS 전역 함수 등록 완료');
}

// 전역 헬퍼 함수들
window.selectOrderItem = (itemId, isConfirmed) => {
  if (window.posOrderManager) {
    window.posOrderManager.selectItem(itemId, isConfirmed);
  }
};

window.changeSelectedQuantity = (delta) => {
  if (window.posOrderManager) {
    window.posOrderManager.changeSelectedQuantity(delta);
  }
};

window.deleteSelectedItem = () => {
  if (window.posOrderManager) {
    window.posOrderManager.deleteSelectedItem();
  }
};

window.confirmOrders = () => {
  if (window.posOrderManager) {
    window.posOrderManager.confirmOrders();
  }
};

window.clearAllOrders = () => {
  if (window.posOrderManager) {
    window.posOrderManager.clearAllOrders();
  }
};

console.log('✅ 새로운 POS 렌더링 모듈 로드 완료');