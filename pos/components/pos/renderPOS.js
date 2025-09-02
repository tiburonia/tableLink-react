
// POS 메인 시스템 렌더링 모듈 - 단순 장바구니 방식
import { POSStateManager } from './modules/posStateManager.js';
import { POSDataLoader } from './modules/posDataLoader.js';
import { POSTableManager } from './modules/posTableManager.js';
import { POSOrderManager } from './modules/posOrderManager.js';
import { POSTableDetailView } from './tableDetailView.js';
import { showPOSNotification } from '../../utils/posNotification.js';

// 🎨 POS 메인 화면 렌더링
export async function renderPOS() {
  console.log('🚀 POS 시스템 시작');

  const mainElement = document.getElementById('main');
  if (!mainElement) {
    console.error('❌ main 요소를 찾을 수 없습니다.');
    return;
  }

  // 기본 POS UI 구조 생성
  mainElement.innerHTML = `
    <div id="posContainer" class="pos-container">
      <!-- 헤더 -->
      <div class="pos-header">
        <div class="header-left">
          <h1 class="pos-title">🍽️ TableLink POS</h1>
          <div class="store-info" id="storeInfo">매장 정보 로딩중...</div>
        </div>
        <div class="header-right">
          <div class="active-tables-info">
            <span>활성 테이블: </span>
            <span id="activeTables">0/0</span>
          </div>
          <button class="header-btn refresh-btn" onclick="refreshPOSData()">🔄</button>
          <button class="header-btn settings-btn" onclick="openPOSSettings()">⚙️</button>
        </div>
      </div>

      <!-- 테이블맵 뷰 -->
      <div id="tableMapView" class="view-container">
        <div class="table-map-header">
          <h2>테이블 현황</h2>
          <div class="status-legend">
            <div class="legend-item"><div class="legend-color available"></div>이용가능</div>
            <div class="legend-item"><div class="legend-color occupied"></div>사용중</div>
            <div class="legend-item"><div class="legend-color ordering"></div>주문중</div>
            <div class="legend-item"><div class="legend-color payment"></div>결제대기</div>
          </div>
        </div>
        <div class="table-map-grid" id="tableMapGrid">
          <!-- 테이블 아이템들이 여기에 렌더링됩니다 -->
        </div>
      </div>

      <!-- 테이블 상세 뷰 -->
      <div id="tableDetailView" class="view-container hidden">
        <!-- POSTableDetailView에서 동적으로 렌더링됩니다 -->
      </div>
    </div>

    ${getPOSStyles()}
  `;

  // 상태 초기화
  POSStateManager.initialize();

  try {
    // 데이터 로드
    await POSDataLoader.loadInitialData();
    
    // 테이블맵 렌더링
    await POSTableManager.renderTableMap();
    
    // 페이지 정리 이벤트 설정
    setupPageUnloadHandler();
    
    console.log('✅ POS 시스템 초기화 완료');

  } catch (error) {
    console.error('❌ POS 시스템 초기화 실패:', error);
    showPOSNotification('POS 시스템 로드 실패: ' + error.message, 'error');
  }
}

// 🔄 데이터 새로고침
async function refreshPOSData() {
  try {
    console.log('🔄 POS 데이터 새로고침');
    showPOSNotification('데이터 새로고침 중...', 'info');

    await POSDataLoader.loadInitialData();
    await POSTableManager.renderTableMap();

    showPOSNotification('데이터 새로고침 완료', 'success');
  } catch (error) {
    console.error('❌ 데이터 새로고침 실패:', error);
    showPOSNotification('새로고침 실패: ' + error.message, 'error');
  }
}

// ⚙️ POS 설정 열기
function openPOSSettings() {
  showPOSNotification('설정 기능은 준비 중입니다', 'info');
}

// 🪑 테이블맵에서 테이블 선택
function selectTableFromMap(tableNumber) {
  console.log(`🪑 테이블맵에서 테이블 ${tableNumber} 선택`);
  
  // 테이블 선택 상태 관리
  POSTableManager.selectTable(tableNumber);
  
  // 테이블 상세 화면으로 전환
  document.getElementById('tableMapView').classList.add('hidden');
  document.getElementById('tableDetailView').classList.remove('hidden');
  
  // 테이블 상세 화면 초기화
  POSTableDetailView.initializeTableDetail(tableNumber);
}

// 🔙 테이블맵으로 복귀
function returnToTableMap() {
  // 임시주문 확인
  const cartItems = POSStateManager.getCartItems();
  if (cartItems.length > 0) {
    if (!confirm(`장바구니에 ${cartItems.length}개 메뉴가 있습니다. 정말 나가시겠습니까? (장바구니 내용이 삭제됩니다)`)) {
      return;
    }
  }

  POSOrderManager.clearCart();
  POSStateManager.reset();

  document.getElementById('tableMapView').classList.remove('hidden');
  document.getElementById('tableDetailView').classList.add('hidden');

  POSTableManager.renderTableMap();
  console.log('✅ 테이블맵 복귀');
}

// 📱 페이지 이탈 시 장바구니 정리
function setupPageUnloadHandler() {
  window.addEventListener('beforeunload', (event) => {
    const cartItems = POSStateManager.getCartItems();
    if (cartItems.length > 0) {
      POSOrderManager.handlePageUnload();
    }
  });
}

// 🎨 POS 스타일 정의
function getPOSStyles() {
  return `
    <style>
      .pos-container {
        height: 100vh;
        display: flex;
        flex-direction: column;
        background: #f8f9fa;
        font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      }

      /* 헤더 */
      .pos-header {
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
        padding: 15px 25px;
        display: flex;
        justify-content: space-between;
        align-items: center;
        box-shadow: 0 2px 10px rgba(0,0,0,0.1);
      }

      .header-left {
        display: flex;
        align-items: center;
        gap: 20px;
      }

      .pos-title {
        margin: 0;
        font-size: 24px;
        font-weight: 700;
      }

      .store-info {
        font-size: 14px;
        opacity: 0.9;
        background: rgba(255,255,255,0.2);
        padding: 5px 12px;
        border-radius: 15px;
      }

      .header-right {
        display: flex;
        align-items: center;
        gap: 15px;
      }

      .active-tables-info {
        font-size: 14px;
        font-weight: 500;
      }

      .header-btn {
        background: rgba(255,255,255,0.2);
        border: 1px solid rgba(255,255,255,0.3);
        color: white;
        padding: 8px 12px;
        border-radius: 8px;
        cursor: pointer;
        font-size: 16px;
        transition: all 0.2s;
      }

      .header-btn:hover {
        background: rgba(255,255,255,0.3);
        transform: translateY(-1px);
      }

      /* 뷰 컨테이너 */
      .view-container {
        flex: 1;
        overflow: hidden;
      }

      .view-container.hidden {
        display: none;
      }

      /* 테이블맵 */
      .table-map-header {
        padding: 20px 25px;
        background: white;
        border-bottom: 1px solid #dee2e6;
        display: flex;
        justify-content: space-between;
        align-items: center;
      }

      .table-map-header h2 {
        margin: 0;
        font-size: 20px;
        font-weight: 600;
        color: #495057;
      }

      .status-legend {
        display: flex;
        gap: 15px;
      }

      .legend-item {
        display: flex;
        align-items: center;
        gap: 6px;
        font-size: 12px;
        color: #6c757d;
      }

      .legend-color {
        width: 12px;
        height: 12px;
        border-radius: 3px;
      }

      .legend-color.available {
        background: #28a745;
      }

      .legend-color.occupied {
        background: #dc3545;
      }

      .legend-color.ordering {
        background: #ffc107;
      }

      .legend-color.payment {
        background: #17a2b8;
      }

      .table-map-grid {
        padding: 25px;
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
        gap: 20px;
        overflow-y: auto;
        height: calc(100vh - 140px);
      }

      .table-item {
        background: white;
        border: 2px solid #e9ecef;
        border-radius: 12px;
        padding: 20px;
        cursor: pointer;
        transition: all 0.3s ease;
        text-align: center;
        display: flex;
        flex-direction: column;
        justify-content: center;
        min-height: 120px;
        position: relative;
        overflow: hidden;
      }

      .table-item::before {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        height: 4px;
        background: #e9ecef;
        transition: all 0.3s;
      }

      .table-item:hover {
        transform: translateY(-3px);
        box-shadow: 0 6px 20px rgba(0,0,0,0.1);
      }

      .table-item.available {
        border-color: #28a745;
        background: linear-gradient(135deg, #f8fff9 0%, #e8f5e8 100%);
      }

      .table-item.available::before {
        background: #28a745;
      }

      .table-item.occupied {
        border-color: #dc3545;
        background: linear-gradient(135deg, #fff8f8 0%, #ffe8e8 100%);
      }

      .table-item.occupied::before {
        background: #dc3545;
      }

      .table-item.ordering {
        border-color: #ffc107;
        background: linear-gradient(135deg, #fffdf5 0%, #fff3cd 100%);
      }

      .table-item.ordering::before {
        background: #ffc107;
      }

      .table-number {
        font-size: 24px;
        font-weight: 700;
        margin-bottom: 8px;
        color: #495057;
      }

      .table-status {
        font-size: 14px;
        font-weight: 500;
        color: #6c757d;
      }

      .table-time {
        font-size: 12px;
        color: #868e96;
        margin-top: 4px;
      }
    </style>
  `;
}

// 전역 함수 등록
window.renderPOS = renderPOS;
window.selectTableFromMap = selectTableFromMap;
window.returnToTableMap = returnToTableMap;
window.refreshPOSData = refreshPOSData;
window.openPOSSettings = openPOSSettings;

console.log('✅ POS 렌더링 모듈 로드 완료');
