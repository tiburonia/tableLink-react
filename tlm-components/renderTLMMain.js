// TLM 매장 관리 메인 화면 렌더링
function renderTLMMain() {
  console.log('🏪 TLM 메인 함수 호출됨');
  
  // 1. 전역 변수에서 우선 가져오기
  let storeId = window.currentStoreId;
  
  // 2. URL 쿼리 파라미터에서 매장 ID 추출
  if (!storeId) {
    const urlParams = new URLSearchParams(window.location.search);
    const paramStoreId = urlParams.get('storeId');
    if (paramStoreId) {
      storeId = parseInt(paramStoreId);
    }
  }
  
  // 3. URL 경로에서 매장 ID 추출 (/tlm/1 또는 /TLM/1 형태)
  if (!storeId) {
    const pathParts = window.location.pathname.split('/');
    console.log('🔍 URL 경로 분석:', pathParts);
    if (pathParts.length >= 3 && (pathParts[1].toLowerCase() === 'tlm')) {
      const pathStoreId = pathParts[2];
      if (pathStoreId && !isNaN(pathStoreId)) {
        storeId = parseInt(pathStoreId);
        console.log('🎯 경로에서 매장 ID 추출 성공:', storeId);
      }
    }
  }

  console.log('🏪 TLM 매장 ID:', storeId, '(타입:', typeof storeId, ')');
  console.log('🔍 URL 정보:', {
    pathname: window.location.pathname,
    search: window.location.search,
    extractedStoreId: storeId,
    globalStoreId: window.currentStoreId
  });

  // 매장 ID 유효성 검사
  if (!storeId || isNaN(storeId) || storeId <= 0) {
    console.error('❌ 유효하지 않은 매장 ID:', storeId);
    if (typeof renderLogin === 'function') {
      console.log('🔄 로그인 화면으로 리다이렉트');
      renderLogin();
    } else {
      document.getElementById('main').innerHTML = `
        <div style="padding: 20px; text-align: center; font-family: Arial, sans-serif;">
          <h2 style="color: #dc3545;">❌ 오류</h2>
          <p>유효하지 않은 매장 ID입니다: ${storeId}</p>
          <button onclick="window.location.href='/'" 
                  style="padding: 10px 20px; margin: 10px; background: #007bff; color: white; border: none; border-radius: 5px;">
            메인으로 이동
          </button>
        </div>
      `;
    }
    return;
  }

  console.log('🏪 TLM 매장 관리 시작, 매장 ID:', storeId);

  // 전역 변수에 저장
  window.currentStoreId = storeId;

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
      <!-- 헤더 영역 -->
      <div style="background: white; border-radius: 10px; padding: 20px; margin-bottom: 20px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); position: relative;">
        <!-- 로그아웃 버튼 -->
        <button id="logoutBtn" style="position: absolute; top: 15px; right: 15px; padding: 8px 16px; background: #dc3545; color: white; border: none; border-radius: 5px; cursor: pointer; font-size: 14px;">
          🔓 로그아웃
        </button>
        
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

      <!-- 매장 통계 -->
      <div style="background: white; border-radius: 10px; padding: 20px; margin-bottom: 20px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
        <h3 style="margin: 0 0 15px 0; color: #333;">📊 매장 통계</h3>
        <div id="storeStats" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 15px; text-align: center;">
          <div style="background: #e8f4fd; padding: 15px; border-radius: 8px;">
            <div style="font-size: 20px; font-weight: bold; color: #1976d2;" id="todayOrders">-</div>
            <div style="color: #666; font-size: 12px;">오늘 주문</div>
          </div>
          <div style="background: #e8f5e8; padding: 15px; border-radius: 8px;">
            <div style="font-size: 20px; font-weight: bold; color: #388e3c;" id="todayRevenue">-</div>
            <div style="color: #666; font-size: 12px;">오늘 매출</div>
          </div>
          <div style="background: #fff3e0; padding: 15px; border-radius: 8px;">
            <div style="font-size: 20px; font-weight: bold; color: #f57c00;" id="monthOrders">-</div>
            <div style="color: #666; font-size: 12px;">이번달 주문</div>
          </div>
          <div style="background: #fce4ec; padding: 15px; border-radius: 8px;">
            <div style="font-size: 20px; font-weight: bold; color: #c2185b;" id="monthRevenue">-</div>
            <div style="color: #666; font-size: 12px;">이번달 매출</div>
          </div>
        </div>
      </div>

      <!-- 관리 버튼들 -->
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px; margin-bottom: 20px;">
        <button id="toggleStoreStatus" style="padding: 15px; background: ${store.isOpen ? '#dc3545' : '#28a745'}; color: white; border: none; border-radius: 8px; font-size: 16px; cursor: pointer;">
          ${store.isOpen ? '🛑 운영 중지' : '▶️ 운영 시작'}
        </button>
        <button id="viewAllOrders" style="padding: 15px; background: #007bff; color: white; border: none; border-radius: 8px; font-size: 16px; cursor: pointer;">
          📋 전체 주문 보기
        </button>
        <button id="viewAllReviews" style="padding: 15px; background: #ffc107; color: white; border: none; border-radius: 8px; font-size: 16px; cursor: pointer;">
          ⭐ 전체 리뷰 보기
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

  // 매장 통계 로드
  loadStoreStats(store.id);

  console.log('✅ TLM 매장 관리 화면 렌더링 완료');
}

// 로그아웃 처리 함수
async function handleLogout() {
  try {
    const confirmed = confirm('정말 로그아웃 하시겠습니까?');
    if (!confirmed) return;

    // 서버에 로그아웃 요청
    await fetch('/api/logout', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    });

    // 로컬 데이터 초기화
    window.currentStoreId = null;
    
    // 메인 페이지로 이동
    window.location.href = '/';
    
  } catch (error) {
    console.error('로그아웃 실패:', error);
    // 오류가 있어도 메인으로 이동
    window.location.href = '/';
  }
}

// 매장 통계 로드
async function loadStoreStats(storeId) {
  try {
    console.log('📊 매장 통계 로드 시작:', storeId);
    
    const response = await fetch(`/api/stores/${storeId}/stats`);
    console.log('📊 API 응답 상태:', response.status);
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const data = await response.json();
    console.log('📊 받은 통계 데이터:', data);

    if (data.success && data.stats) {
      const todayOrdersEl = document.getElementById('todayOrders');
      const todayRevenueEl = document.getElementById('todayRevenue');
      const monthOrdersEl = document.getElementById('monthOrders');
      const monthRevenueEl = document.getElementById('monthRevenue');

      if (todayOrdersEl) todayOrdersEl.textContent = data.stats.todayOrders || '0';
      if (todayRevenueEl) todayRevenueEl.textContent = (data.stats.todayRevenue || 0).toLocaleString() + '원';
      if (monthOrdersEl) monthOrdersEl.textContent = data.stats.monthOrders || '0';
      if (monthRevenueEl) monthRevenueEl.textContent = (data.stats.monthRevenue || 0).toLocaleString() + '원';
      
      console.log('✅ 매장 통계 렌더링 완료');
    } else {
      console.error('❌ 매장 통계 데이터 형식 오류:', data);
      throw new Error('통계 데이터 형식이 올바르지 않습니다');
    }
  } catch (error) {
    console.error('❌ 매장 통계 로드 실패:', error);
    
    // 기본값으로 설정
    const todayOrdersEl = document.getElementById('todayOrders');
    const todayRevenueEl = document.getElementById('todayRevenue');
    const monthOrdersEl = document.getElementById('monthOrders');
    const monthRevenueEl = document.getElementById('monthRevenue');

    if (todayOrdersEl) todayOrdersEl.textContent = '오류';
    if (todayRevenueEl) todayRevenueEl.textContent = '데이터 로드 실패';
    if (monthOrdersEl) monthOrdersEl.textContent = '오류';
    if (monthRevenueEl) monthRevenueEl.textContent = '데이터 로드 실패';
  }
}

// 전체 주문 보기
async function showAllOrders(storeId) {
  try {
    console.log(`📋 전체 주문 조회 시작: 매장 ID ${storeId}`);
    
    const response = await fetch(`/api/stores/${storeId}/orders`);
    console.log(`📊 API 응답 상태: ${response.status}`);
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const data = await response.json();
    console.log(`📊 받은 주문 데이터:`, data);

    // 데이터 유효성 검사 개선
    if (data && typeof data === 'object' && data.hasOwnProperty('success')) {
      if (data.success === true) {
        const orders = data.orders || [];
        console.log(`✅ 처리할 주문 수: ${orders.length}개`);
        
        let ordersHTML = `
          <div style="position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.8); z-index: 1000; display: flex; justify-content: center; align-items: center;">
            <div style="background: white; width: 90%; max-width: 800px; height: 80%; border-radius: 10px; padding: 20px; overflow-y: auto;">
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
                <h2 style="margin: 0; color: #333;">📋 전체 주문 내역 (${orders.length}건)</h2>
                <button onclick="this.closest('.fixed').remove()" style="padding: 8px 16px; background: #dc3545; color: white; border: none; border-radius: 5px; cursor: pointer;">
                  ✕ 닫기
                </button>
              </div>
              <div style="max-height: calc(100% - 80px); overflow-y: auto;">
        `;

        if (orders.length > 0) {
          orders.forEach(order => {
            const orderDate = new Date(order.orderDate || order.order_date).toLocaleString();
            const tableNumber = order.tableNumber || order.table_number || '알 수 없음';
            const finalAmount = order.finalAmount || order.final_amount || 0;
            const orderStatus = order.orderStatus || order.order_status || '알 수 없음';
            const customerName = order.customerName || order.customer_name || '고객정보없음';
            
            // 주문 데이터 파싱 개선
            let orderDataStr = '주문 정보 없음';
            try {
              const rawOrderData = order.orderData || order.order_data;
              if (rawOrderData) {
                let orderDataObj;
                
                if (typeof rawOrderData === 'string') {
                  orderDataObj = JSON.parse(rawOrderData);
                } else {
                  orderDataObj = rawOrderData;
                }
                
                // 다양한 주문 데이터 형식 처리
                if (orderDataObj.items && Array.isArray(orderDataObj.items)) {
                  // items 배열 형식
                  orderDataStr = orderDataObj.items
                    .map(item => `${item.name}: ${item.qty}개`)
                    .join(', ');
                } else if (orderDataObj.menu && typeof orderDataObj.menu === 'object') {
                  // menu 객체 형식
                  orderDataStr = Object.entries(orderDataObj.menu)
                    .map(([item, qty]) => `${item}: ${qty}개`)
                    .join(', ');
                } else {
                  // 기타 형식
                  orderDataStr = JSON.stringify(orderDataObj).substring(0, 100) + '...';
                }
              }
            } catch (e) {
              console.error('주문 데이터 파싱 오류:', e);
              orderDataStr = '주문 데이터 파싱 실패';
            }
            
            ordersHTML += `
              <div style="background: #f8f9fa; padding: 15px; border-radius: 8px; margin-bottom: 10px; border-left: 4px solid #007bff;">
                <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 10px;">
                  <div>
                    <strong style="color: #333;">주문 #${order.id}</strong>
                    <div style="color: #666; font-size: 14px;">테이블 ${tableNumber} • ${customerName} • ${orderDate}</div>
                  </div>
                  <div style="text-align: right;">
                    <div style="font-size: 18px; font-weight: bold; color: #007bff;">${finalAmount.toLocaleString()}원</div>
                    <div style="font-size: 12px; color: #666;">${orderStatus}</div>
                  </div>
                </div>
                <div style="background: white; padding: 10px; border-radius: 5px; font-size: 14px;">
                  ${orderDataStr}
                </div>
              </div>
            `;
          });
        } else {
          ordersHTML += '<div style="text-align: center; padding: 40px; color: #666;">주문 내역이 없습니다.</div>';
        }

        ordersHTML += '</div></div></div>';
        
        const modalDiv = document.createElement('div');
        modalDiv.className = 'fixed';
        modalDiv.innerHTML = ordersHTML;
        document.body.appendChild(modalDiv);
        
      } else {
        console.error('❌ API 요청 실패:', data.error || '알 수 없는 오류');
        alert('주문 내역을 불러올 수 없습니다: ' + (data.error || '서버 오류'));
      }
    } else {
      console.error('❌ 예상하지 못한 응답 형식:', data);
      alert('서버 응답 형식이 올바르지 않습니다.');
    }
  } catch (error) {
    console.error('❌ 전체 주문 조회 실패:', error);
    alert('주문 내역 조회 중 오류가 발생했습니다: ' + error.message);
  }
}

// 전체 리뷰 보기
async function showAllReviews(storeId) {
  try {
    console.log(`⭐ 전체 리뷰 조회 시작: 매장 ID ${storeId}`);
    
    const response = await fetch(`/api/stores/${storeId}/reviews`);
    console.log(`📊 API 응답 상태: ${response.status}`);
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const data = await response.json();
    console.log(`📊 받은 리뷰 데이터:`, data);

    // 데이터 유효성 검사 개선
    if (data && typeof data === 'object' && data.hasOwnProperty('success')) {
      if (data.success === true) {
        const reviews = data.reviews || [];
        console.log(`✅ 처리할 리뷰 수: ${reviews.length}개`);
        
        let reviewsHTML = `
          <div style="position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.8); z-index: 1000; display: flex; justify-content: center; align-items: center;">
            <div style="background: white; width: 90%; max-width: 800px; height: 80%; border-radius: 10px; padding: 20px; overflow-y: auto;">
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
                <h2 style="margin: 0; color: #333;">⭐ 전체 리뷰 (${reviews.length}개)</h2>
                <button onclick="this.closest('.fixed').remove()" style="padding: 8px 16px; background: #dc3545; color: white; border: none; border-radius: 5px; cursor: pointer;">
                  ✕ 닫기
                </button>
              </div>
              <div style="max-height: calc(100% - 80px); overflow-y: auto;">
        `;

        if (reviews.length > 0) {
          reviews.forEach(review => {
            const reviewDate = new Date(review.created_at || review.date).toLocaleDateString();
            const rating = review.rating || review.score || 0;
            const reviewText = review.review_text || review.content || '리뷰 내용 없음';
            const userName = review.user || review.user_name || `사용자${review.user_id || review.userId}`;
            const stars = '⭐'.repeat(Math.max(0, Math.min(5, rating)));
            
            reviewsHTML += `
              <div style="background: #f8f9fa; padding: 15px; border-radius: 8px; margin-bottom: 10px; border-left: 4px solid #ffc107;">
                <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 10px;">
                  <div>
                    <div style="font-size: 16px; color: #ffc107; margin-bottom: 5px;">${stars}</div>
                    <div style="color: #666; font-size: 14px;">작성자: ${userName} • ${reviewDate}</div>
                  </div>
                  <div style="font-size: 18px; font-weight: bold; color: #ffc107;">${rating}점</div>
                </div>
                <div style="background: white; padding: 12px; border-radius: 5px; line-height: 1.5; color: #333;">
                  ${reviewText}
                </div>
              </div>
            `;
          });
        } else {
          reviewsHTML += '<div style="text-align: center; padding: 40px; color: #666;">리뷰가 없습니다.</div>';
        }

        reviewsHTML += '</div></div></div>';
        
        const modalDiv = document.createElement('div');
        modalDiv.className = 'fixed';
        modalDiv.innerHTML = reviewsHTML;
        document.body.appendChild(modalDiv);
        
      } else {
        console.error('❌ API 요청 실패:', data.error || '알 수 없는 오류');
        alert('리뷰를 불러올 수 없습니다: ' + (data.error || '서버 오류'));
      }
    } else {
      console.error('❌ 예상하지 못한 응답 형식:', data);
      alert('서버 응답 형식이 올바르지 않습니다.');
    }
  } catch (error) {
    console.error('❌ 전체 리뷰 조회 실패:', error);
    alert('리뷰 조회 중 오류가 발생했습니다: ' + error.message);
  }
}

// 이벤트 리스너 설정
function setupEventListeners(store) {
  // 로그아웃 버튼
  document.getElementById('logoutBtn').addEventListener('click', () => {
    handleLogout();
  });

  // 운영 상태 토글
  document.getElementById('toggleStoreStatus').addEventListener('click', () => {
    toggleStoreStatus(store.id);
  });

  // 전체 주문 보기
  document.getElementById('viewAllOrders').addEventListener('click', () => {
    showAllOrders(store.id);
  });

  // 전체 리뷰 보기
  document.getElementById('viewAllReviews').addEventListener('click', () => {
    showAllReviews(store.id);
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