// TLM 매장 관리 메인 화면 렌더링
function renderTLMMain() {
  // 1. URL 쿼리 파라미터에서 매장 ID 추출
  const urlParams = new URLSearchParams(window.location.search);
  let storeId = urlParams.get('storeId');
  
  // 2. URL 경로에서 매장 ID 추출 (/tlm/1 또는 /TLM/1 형태)
  if (!storeId) {
    const pathParts = window.location.pathname.split('/');
    if (pathParts.length >= 3 && (pathParts[1].toLowerCase() === 'tlm')) {
      storeId = pathParts[2];
    }
  }
  
  // 3. 전역 변수에서 가져오기
  if (!storeId && window.currentStoreId) {
    storeId = window.currentStoreId;
  }

  console.log('🏪 TLM 매장 ID:', storeId);
  console.log('🔍 URL 정보:', {
    pathname: window.location.pathname,
    search: window.location.search,
    extractedStoreId: storeId
  });

  if (!storeId) {
    console.error('❌ 매장 ID가 없습니다.');
    alert('매장 ID가 없습니다.');
    return;
  }

  console.log('🏪 TLM 매장 관리 시작, 매장 ID:', storeId);

  // 캐시 시스템 초기화
  if (typeof cacheManager !== 'undefined') {
    cacheManager.init();
  }

  // 매장 정보 로드
  loadStoreInfo(storeId);
}

// 매장 정보 로드 함수
async function loadStoreInfo(storeId) {
  try {
    const response = await fetch(`/api/stores/${storeId}`);
    const data = await response.json();

    if (data.success) {
      renderTLMInterface(data.store);
    } else {
      alert('매장 정보를 불러올 수 없습니다: ' + data.error);
    }
  } catch (error) {
    console.error('매장 정보 로드 실패:', error);
    alert('서버 연결에 실패했습니다.');
  }
}

// TLM 인터페이스 렌더링
function renderTLMInterface(store) {
  const main = document.getElementById('main');

  main.innerHTML = `
    <div style="padding: 20px; background: #f5f5f5; min-height: 100vh; font-family: Arial, sans-serif;">
      <div style="background: white; border-radius: 10px; padding: 20px; margin-bottom: 20px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
        <h1 style="margin: 0; color: #333; text-align: center;">🏪 ${store.name} 관리</h1>
        <p style="text-align: center; color: #666; margin: 10px 0;">매장 운영 관리 시스템</p>
        <div style="text-align: center; margin: 15px 0;">
          <span style="display: inline-block; padding: 8px 16px; background: ${store.isOpen ? '#28a745' : '#dc3545'}; color: white; border-radius: 20px; font-size: 14px;">
            ${store.isOpen ? '🟢 운영중' : '🔴 운영중지'}
          </span>
        </div>
      </div>

      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 20px; margin-bottom: 20px;">
        <!-- 테이블 현황 -->
        <div style="background: white; border-radius: 10px; padding: 20px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
          <h3 style="margin: 0 0 15px 0; color: #333;">📊 테이블 현황</h3>
          <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px; text-align: center;">
            <div style="background: #e3f2fd; padding: 15px; border-radius: 8px;">
              <div style="font-size: 24px; font-weight: bold; color: #1976d2;">${store.tableInfo.totalTables}</div>
              <div style="color: #666; font-size: 14px;">총 테이블</div>
            </div>
            <div style="background: #e8f5e8; padding: 15px; border-radius: 8px;">
              <div style="font-size: 24px; font-weight: bold; color: #388e3c;">${store.tableInfo.availableTables}</div>
              <div style="color: #666; font-size: 14px;">빈 테이블</div>
            </div>
            <div style="background: #ffebee; padding: 15px; border-radius: 8px;">
              <div style="font-size: 24px; font-weight: bold; color: #d32f2f;">${store.tableInfo.occupiedTables}</div>
              <div style="color: #666; font-size: 14px;">사용중</div>
            </div>
            <div style="background: #f3e5f5; padding: 15px; border-radius: 8px;">
              <div style="font-size: 24px; font-weight: bold; color: #7b1fa2;">${store.tableInfo.occupancyRate}%</div>
              <div style="color: #666; font-size: 14px;">사용률</div>
            </div>
          </div>
        </div>

        <!-- 매장 정보 -->
        <div style="background: white; border-radius: 10px; padding: 20px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
          <h3 style="margin: 0 0 15px 0; color: #333;">🏪 매장 정보</h3>
          <div style="display: flex; flex-direction: column; gap: 10px;">
            <div style="display: flex; justify-content: space-between;">
              <span style="color: #666;">매장명:</span>
              <span style="font-weight: bold;">${store.name}</span>
            </div>
            <div style="display: flex; justify-content: space-between;">
              <span style="color: #666;">카테고리:</span>
              <span>${store.category}</span>
            </div>
            <div style="display: flex; justify-content: space-between;">
              <span style="color: #666;">평점:</span>
              <span>⭐ ${store.ratingAverage}점 (${store.reviewCount}개)</span>
            </div>
            <div style="display: flex; justify-content: space-between;">
              <span style="color: #666;">주소:</span>
              <span style="font-size: 14px; text-align: right; max-width: 60%;">${store.address}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- 관리 버튼들 -->
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px; margin-bottom: 20px;">
        <button id="toggleStoreStatus" style="padding: 15px; background: ${store.isOpen ? '#dc3545' : '#28a745'}; color: white; border: none; border-radius: 8px; font-size: 16px; cursor: pointer;">
          ${store.isOpen ? '🛑 운영 중지' : '▶️ 운영 시작'}
        </button>
        <button id="viewOrders" style="padding: 15px; background: #007bff; color: white; border: none; border-radius: 8px; font-size: 16px; cursor: pointer;">
          📋 주문 내역
        </button>
        <button id="viewReviews" style="padding: 15px; background: #ffc107; color: white; border: none; border-radius: 8px; font-size: 16px; cursor: pointer;">
          ⭐ 리뷰 관리
        </button>
        <button id="viewTables" style="padding: 15px; background: #6f42c1; color: white; border: none; border-radius: 8px; font-size: 16px; cursor: pointer;">
          🪑 테이블 관리
        </button>
      </div>

      <!-- 최근 활동 -->
      <div style="background: white; border-radius: 10px; padding: 20px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
        <h3 style="margin: 0 0 15px 0; color: #333;">📈 최근 활동</h3>
        <div id="recentActivity" style="color: #666;">
          로딩중...
        </div>
      </div>
    </div>
  `;

  // 이벤트 리스너 추가
  setupEventListeners(store);

  // 최근 활동 로드
  loadRecentActivity(store.id);

  console.log('✅ TLM 매장 관리 화면 렌더링 완료');
}

// 이벤트 리스너 설정
function setupEventListeners(store) {
  // 운영 상태 토글
  document.getElementById('toggleStoreStatus').addEventListener('click', () => {
    toggleStoreStatus(store.id);
  });

  // 주문 내역 보기
  document.getElementById('viewOrders').addEventListener('click', () => {
    alert('주문 내역 기능은 개발 중입니다.');
  });

  // 리뷰 관리
  document.getElementById('viewReviews').addEventListener('click', () => {
    alert('리뷰 관리 기능은 개발 중입니다.');
  });

  // 테이블 관리
  document.getElementById('viewTables').addEventListener('click', () => {
    alert('테이블 관리 기능은 개발 중입니다.');
  });
}

// 최근 활동 로드
async function loadRecentActivity(storeId) {
  try {
    const orders = await loadRecentOrders(storeId);
    const reviews = await loadRecentReviews(storeId);

    const activityDiv = document.getElementById('recentActivity');

    let activityHTML = '<div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">';

    // 최근 주문
    activityHTML += '<div><h4 style="margin: 0 0 10px 0; color: #007bff;">📋 최근 주문</h4>';
    if (orders.length > 0) {
      orders.slice(0, 3).forEach(order => {
        activityHTML += `
          <div style="background: #f8f9fa; padding: 10px; border-radius: 5px; margin-bottom: 8px; font-size: 14px;">
            <div>테이블 ${order.table_number} - ${new Date(order.order_date).toLocaleString()}</div>
            <div style="color: #666;">${order.final_amount.toLocaleString()}원</div>
          </div>
        `;
      });
    } else {
      activityHTML += '<div style="color: #999; font-style: italic;">최근 주문이 없습니다.</div>';
    }
    activityHTML += '</div>';

    // 최근 리뷰
    activityHTML += '<div><h4 style="margin: 0 0 10px 0; color: #ffc107;">⭐ 최근 리뷰</h4>';
    if (reviews.length > 0) {
      reviews.slice(0, 3).forEach(review => {
        activityHTML += `
          <div style="background: #f8f9fa; padding: 10px; border-radius: 5px; margin-bottom: 8px; font-size: 14px;">
            <div>⭐ ${review.rating}점 - ${new Date(review.created_at).toLocaleDateString()}</div>
            <div style="color: #666;">${review.review_text.substring(0, 50)}${review.review_text.length > 50 ? '...' : ''}</div>
          </div>
        `;
      });
    } else {
      activityHTML += '<div style="color: #999; font-style: italic;">최근 리뷰가 없습니다.</div>';
    }
    activityHTML += '</div></div>';

    activityDiv.innerHTML = activityHTML;

  } catch (error) {
    console.error('최근 활동 로드 실패:', error);
    document.getElementById('recentActivity').innerHTML = '<div style="color: #dc3545;">데이터 로드에 실패했습니다.</div>';
  }
}

// 실제 주문 데이터 로드
async function loadRecentOrders(storeId) {
  try {
    const response = await fetch(`/api/orders/recent/${storeId}`);
    const data = await response.json();

    if (data.success) {
      return data.orders || [];
    }
    return [];
  } catch (error) {
    console.error('최근 주문 로드 실패:', error);
    return [];
  }
}

// 실제 리뷰 데이터 로드
async function loadRecentReviews(storeId) {
  try {
    const response = await fetch(`/api/reviews/recent/${storeId}`);
    const data = await response.json();

    if (data.success) {
      return data.reviews || [];
    }
    return [];
  } catch (error) {
    console.error('최근 리뷰 로드 실패:', error);
    return [];
  }
}

// 매장 운영 상태 토글 함수
async function toggleStoreStatus(storeId) {
  try {
    const response = await fetch(`/api/stores/${storeId}/toggle-status`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    });

    const data = await response.json();

    if (data.success) {
      alert(`매장 운영 상태가 ${data.isOpen ? '운영중' : '운영중지'}로 변경되었습니다.`);
      location.reload(); // 페이지 새로고침으로 상태 업데이트
    } else {
      alert('운영 상태 변경에 실패했습니다: ' + data.error);
    }
  } catch (error) {
    console.error('운영 상태 변경 실패:', error);
    alert('운영 상태 변경에 실패했습니다.');
  }
}