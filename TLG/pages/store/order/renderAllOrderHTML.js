// 전체 주문내역을 전체 화면으로 표시하는 함수
async function renderAllOrderHTML(userInfo) {
  try {
    console.log('📋 전체 주문내역 화면 렌더링');

    const main = document.getElementById('main');

    // 스켈레톤 UI 먼저 표시
    main.innerHTML = `
      <div class="order-history-container">
        <div class="order-history-header">
          <button id="backBtn" class="header-back-btn" onclick="renderMyPage()">
            <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor">
              <path d="M19 12H5m7-7l-7 7 7 7"/>
            </svg>
          </button>
          <div class="header-info">
            <h1>📦 주문 내역</h1>
            <p class="header-subtitle">나의 모든 주문을 확인하세요</p>
          </div>
        </div>

        <div class="order-history-content">
          <div class="order-stats-card">
            <div class="stat-item">
              <div class="stat-number skeleton-text">-</div>
              <div class="stat-label">총 주문</div>
            </div>
            <div class="stat-item">
              <div class="stat-number skeleton-text">-</div>
              <div class="stat-label">이번 달</div>
            </div>
            <div class="stat-item">
              <div class="stat-number skeleton-text">-</div>
              <div class="stat-label">총 금액</div>
            </div>
          </div>

          <div class="orders-section">
            <div class="section-header">
              <h2>주문 목록</h2>
              <div class="order-count skeleton-badge">로딩중...</div>
            </div>

            <div id="ordersList" class="orders-list">
              ${generateSkeletonCards(5)}
            </div>
          </div>
        </div>
      </div>

      ${getOrderHistoryStyles()}
    `;

    // 실제 데이터 로드
    await loadOrderData(userInfo);

  } catch (error) {
    console.error('❌ 전체 주문내역 로드 실패:', error);
    showErrorState();
  }
}

// 스켈레톤 카드 생성
function generateSkeletonCards(count) {
  return Array.from({ length: count }, (_, i) => `
    <div class="order-card skeleton-card">
      <div class="order-card-header">
        <div class="skeleton-store-name"></div>
        <div class="skeleton-date"></div>
      </div>
      <div class="order-card-body">
        <div class="skeleton-items"></div>
        <div class="skeleton-items short"></div>
        <div class="order-card-footer">
          <div class="skeleton-amount"></div>
          <div class="skeleton-button"></div>
        </div>
      </div>
    </div>
  `).join('');
}

// 실제 주문 데이터 로드
async function loadOrderData(userInfo) {
  try {
    // paid_orders 테이블에서 전체 주문 내역 가져오기
    const response = await fetch(`/api/orders/users/${userInfo.userId}?limit=100`);

    if (!response.ok) throw new Error('주문 내역 조회 실패');
    const data = await response.json();
    const ordersData = data.orders || [];

    // 통계 데이터 계산
    const totalOrders = ordersData.length;
    const thisMonthOrders = ordersData.filter(order => {
      const orderDate = new Date(order.order_date);
      const now = new Date();
      return orderDate.getMonth() === now.getMonth() && 
             orderDate.getFullYear() === now.getFullYear();
    }).length;
    const totalAmount = ordersData.reduce((sum, order) => 
      sum + (order.final_amount || order.total_amount || 0), 0);

    // 통계 업데이트
    updateOrderStats(totalOrders, thisMonthOrders, totalAmount);

    // 주문 목록 업데이트
    updateOrdersList(ordersData);

  } catch (error) {
    console.error('❌ 주문 데이터 로드 실패:', error);
    showErrorState();
  }
}

// 통계 업데이트
function updateOrderStats(totalOrders, thisMonthOrders, totalAmount) {
  const statNumbers = document.querySelectorAll('.stat-number');
  if (statNumbers[0]) statNumbers[0].textContent = totalOrders + '건';
  if (statNumbers[1]) statNumbers[1].textContent = thisMonthOrders + '건';
  if (statNumbers[2]) statNumbers[2].textContent = totalAmount.toLocaleString() + '원';

  // 스켈레톤 클래스 제거
  statNumbers.forEach(el => el.classList.remove('skeleton-text'));
}

// 주문 목록 업데이트
function updateOrdersList(ordersData) {
  const ordersList = document.getElementById('ordersList');
  const orderCount = document.querySelector('.order-count');

  if (orderCount) {
    orderCount.textContent = `${ordersData.length}건`;
    orderCount.classList.remove('skeleton-badge');
  }

  if (ordersData.length === 0) {
    ordersList.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">🍽️</div>
        <h3>아직 주문 내역이 없어요</h3>
        <p>첫 주문을 해보세요!</p>
        <button class="primary-btn" onclick="renderMap()">
          <span class="btn-icon">🗺️</span>
          매장 찾기
        </button>
      </div>
    `;
    return;
  }

  const ordersHTML = ordersData.map((order, index) => {
    const orderData = order.order_data || {};
    const items = orderData.items ? 
      orderData.items.map(i => `${i.name}(${i.qty}개)`).join(', ') : 
      '메뉴 정보 없음';
    const storeName = orderData.store || order.store_name || '매장 정보 없음';
    const orderDate = new Date(order.order_date);
    const hasReview = false; // 실제로는 API 호출로 확인해야 함

    return `
      <div class="order-card" data-order-id="${order.id}">
        <div class="order-card-header">
          <div class="store-info">
            <h3 class="store-name">${storeName}</h3>
            <div class="order-meta">
              <span class="order-date">${orderDate.toLocaleDateString()}</span>
              ${order.table_number ? `<span class="table-info">테이블 ${order.table_number}</span>` : ''}
            </div>
          </div>
          <div class="order-status completed">완료</div>
        </div>

        <div class="order-card-body">
          <div class="order-items">
            <p class="items-text">${items}</p>
          </div>

          <div class="order-card-footer">
            <div class="order-amount">
              <span class="amount-label">결제금액</span>
              <span class="amount-value">${(order.final_amount || order.total_amount || 0).toLocaleString()}원</span>
            </div>

            <div class="order-actions">
              ${hasReview ? 
                `<span class="review-completed">✅ 리뷰 완료</span>` :
                `<button class="review-btn" data-order-id="${order.id}" data-order-index="${index}">
                  <span class="btn-icon">📝</span>
                  리뷰 작성
                </button>`
              }
              <button class="reorder-btn" onclick="handleReorder('${order.id}')">
                <span class="btn-icon">🔄</span>
                재주문
              </button>
            </div>
          </div>
        </div>
      </div>
    `;
  }).join('');

  ordersList.innerHTML = ordersHTML;

  // 리뷰 작성 버튼 이벤트 리스너 추가
  document.querySelectorAll('.review-btn').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      const orderIndex = parseInt(e.target.closest('.review-btn').getAttribute('data-order-index'));
      const orderId = e.target.closest('.review-btn').getAttribute('data-order-id');
      const order = ordersData[orderIndex];
      console.log('🔍 선택된 주문 정보:', order);

      // 리뷰 작성 스크립트 로드
      await loadReviewWriteScript();

      // 이전 화면 정보 저장
      window.previousScreen = 'renderAllOrderHTML';

      // 리뷰 작성 화면으로 이동
      if (typeof renderReviewWrite === 'function') {
        renderReviewWrite(order);
      } else {
        console.error('renderReviewWrite 함수를 찾을 수 없습니다');
      }
    });
  });
}

// 에러 상태 표시
function showErrorState() {
  const main = document.getElementById('main');
  if (main) {
    main.innerHTML = `
      <div class="order-history-container">
        <div class="order-history-header">
          <button id="backBtn" class="header-back-btn" onclick="renderMyPage()">
            <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor">
              <path d="M19 12H5m7-7l-7 7 7 7"/>
            </svg>
          </button>
          <div class="header-info">
            <h1>📦 주문 내역</h1>
          </div>
        </div>

        <div class="order-history-content">
          <div class="error-state">
            <div class="error-icon">⚠️</div>
            <h3>주문 내역을 불러올 수 없어요</h3>
            <p>잠시 후 다시 시도해주세요</p>
            <button class="primary-btn" onclick="renderAllOrderHTML(userInfo)">
              <span class="btn-icon">🔄</span>
              다시 시도
            </button>
          </div>
        </div>
      </div>

      ${getOrderHistoryStyles()}
    `;
  }
}

// 재주문 처리
function handleReorder(orderId) {
  console.log('🔄 재주문 요청:', orderId);
  alert('재주문 기능은 준비중입니다.');
}

// 스타일 정의
function getOrderHistoryStyles() {
  return `
    <style>
      .order-history-container {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        width: 100%;
        max-width: 430px;
        margin: 0 auto;
        display: flex;
        flex-direction: column;
        background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
        overflow: hidden;
      }

      .order-history-header {
        height: 80px;
        background: white;
        padding: 20px 16px;
        display: flex;
        align-items: center;
        gap: 16px;
        box-shadow: 0 2px 12px rgba(0, 0, 0, 0.04);
        flex-shrink: 0;
        z-index: 100;
      }

      .header-back-btn {
        width: 44px;
        height: 44px;
        border-radius: 12px;
        border: none;
        background: #f1f5f9;
        color: #475569;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        transition: all 0.2s ease;
      }

      .header-back-btn:hover {
        background: #e2e8f0;
        color: #334155;
      }

      .header-info {
        flex: 1;
      }

      .header-info h1 {
        margin: 0 0 4px 0;
        font-size: 22px;
        font-weight: 700;
        color: #1e293b;
        line-height: 1.2;
      }

      .header-subtitle {
        margin: 0;
        font-size: 13px;
        color: #64748b;
        font-weight: 500;
      }

      .order-history-content {
        flex: 1;
        overflow-y: auto;
        padding: 20px;
        display: flex;
        flex-direction: column;
        gap: 20px;
      }

      .order-stats-card {
        background: white;
        border-radius: 16px;
        padding: 20px;
        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.04);
        border: 1px solid rgba(226, 232, 240, 0.8);
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 16px;
      }

      .stat-item {
        text-align: center;
      }

      .stat-number {
        font-size: 20px;
        font-weight: 800;
        color: #1e293b;
        margin-bottom: 4px;
        background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        background-clip: text;
      }

      .stat-label {
        font-size: 12px;
        color: #64748b;
        font-weight: 600;
      }

      .orders-section {
        background: white;
        border-radius: 16px;
        padding: 20px;
        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.04);
        border: 1px solid rgba(226, 232, 240, 0.8);
        flex: 1;
        display: flex;
        flex-direction: column;
      }

      .section-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 20px;
        padding-bottom: 12px;
        border-bottom: 2px solid #f1f5f9;
      }

      .section-header h2 {
        margin: 0;
        font-size: 18px;
        font-weight: 700;
        color: #1e293b;
      }

      .order-count {
        background: #f1f5f9;
        color: #475569;
        padding: 4px 12px;
        border-radius: 12px;
        font-size: 12px;
        font-weight: 600;
      }

      .orders-list {
        flex: 1;
        display: flex;
        flex-direction: column;
        gap: 16px;
        overflow-y: auto;
      }

      .order-card {
        background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
        border-radius: 12px;
        padding: 16px;
        border: 1px solid #e2e8f0;
        transition: all 0.2s ease;
      }

      .order-card:hover {
        transform: translateY(-2px);
        box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
        border-color: #cbd5e1;
      }

      .order-card-header {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        margin-bottom: 12px;
      }

      .store-info {
        flex: 1;
      }

      .store-name {
        margin: 0 0 4px 0;
        font-size: 16px;
        font-weight: 700;
        color: #1e293b;
        line-height: 1.3;
      }

      .order-meta {
        display: flex;
        align-items: center;
        gap: 8px;
      }

      .order-date {
        font-size: 12px;
        color: #64748b;
        font-weight: 500;
      }

      .table-info {
        background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
        color: white;
        padding: 2px 6px;
        border-radius: 6px;
        font-size: 10px;
        font-weight: 600;
      }

      .order-status {
        padding: 4px 8px;
        border-radius: 6px;
        font-size: 11px;
        font-weight: 600;
      }

      .order-status.completed {
        background: #dcfce7;
        color: #166534;
      }

      .order-card-body {
        display: flex;
        flex-direction: column;
        gap: 12px;
      }

      .order-items {
        flex: 1;
      }

      .items-text {
        margin: 0;
        font-size: 14px;
        color: #475569;
        line-height: 1.4;
      }

      .order-card-footer {
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 12px;
      }

      .order-amount {
        display: flex;
        flex-direction: column;
        gap: 2px;
      }

      .amount-label {
        font-size: 11px;
        color: #64748b;
        font-weight: 500;
      }

      .amount-value {
        font-size: 16px;
        font-weight: 700;
        color: #3b82f6;
      }

      .order-actions {
        display: flex;
        gap: 8px;
      }

      .review-btn,
      .reorder-btn {
        padding: 6px 12px;
        border: none;
        border-radius: 8px;
        font-size: 12px;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.2s ease;
        display: flex;
        align-items: center;
        gap: 4px;
      }

      .review-btn {
        background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
        color: white;
      }

      .review-btn:hover {
        transform: translateY(-1px);
        box-shadow: 0 3px 12px rgba(59, 130, 246, 0.3);
      }

      .reorder-btn {
        background: #f1f5f9;
        color: #475569;
        border: 1px solid #e2e8f0;
      }

      .reorder-btn:hover {
        background: #e2e8f0;
        color: #334155;
      }

      .review-completed {
        color: #166534;
        font-size: 12px;
        font-weight: 600;
        padding: 4px 8px;
        background: #dcfce7;
        border-radius: 6px;
      }

      .primary-btn {
        padding: 12px 24px;
        border: none;
        border-radius: 12px;
        background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
        color: white;
        font-size: 14px;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.2s ease;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 8px;
      }

      .primary-btn:hover {
        transform: translateY(-2px);
        box-shadow: 0 4px 16px rgba(59, 130, 246, 0.3);
      }

      .empty-state,
      .error-state {
        text-align: center;
        padding: 60px 20px;
        color: #64748b;
      }

      .empty-icon,
      .error-icon {
        font-size: 64px;
        margin-bottom: 16px;
      }

      .empty-state h3,
      .error-state h3 {
        margin: 0 0 8px 0;
        font-size: 18px;
        font-weight: 700;
        color: #1e293b;
      }

      .empty-state p,
      .error-state p {
        margin: 0 0 24px 0;
        font-size: 14px;
        color: #64748b;
      }

      /* 스켈레톤 애니메이션 */
      .skeleton-text,
      .skeleton-badge,
      .skeleton-store-name,
      .skeleton-date,
      .skeleton-items,
      .skeleton-amount,
      .skeleton-button {
        background: linear-gradient(90deg, #f1f5f9 25%, #e2e8f0 50%, #f1f5f9 75%);
        background-size: 200% 100%;
        animation: skeleton-loading 2s infinite;
        border-radius: 4px;
      }

      .skeleton-card {
        pointer-events: none;
      }

      .skeleton-store-name {
        height: 16px;
        width: 120px;
        margin-bottom: 4px;
      }

      .skeleton-date {
        height: 12px;
        width: 80px;
      }

      .skeleton-items {
        height: 14px;
        width: 100%;
        margin-bottom: 4px;
      }

      .skeleton-items.short {
        width: 60%;
      }

      .skeleton-amount {
        height: 16px;
        width: 80px;
      }

      .skeleton-button {
        height: 28px;
        width: 60px;
      }

      @keyframes skeleton-loading {
        0% {
          background-position: -200% 0;
        }
        100% {
          background-position: 200% 0;
        }
      }

      @media (max-width: 480px) {
        .order-history-header {
          padding: 16px 12px;
        }

        .order-history-content {
          padding: 16px 12px;
        }

        .order-stats-card,
        .orders-section {
          padding: 16px;
        }

        .header-info h1 {
          font-size: 20px;
        }

        .order-card-footer {
          flex-direction: column;
          align-items: flex-start;
          gap: 8px;
        }

        .order-actions {
          width: 100%;
          justify-content: flex-end;
        }
      }
    </style>
  `;
}

// 리뷰 작성 스크립트 로드 함수
async function loadReviewWriteScript() {
  if (typeof window.renderReviewWrite === 'function') {
    return; // 이미 로드됨
  }

  try {
    console.log('🔄 renderReviewWrite 스크립트 로드 시작');
    const script = document.createElement('script');
    script.src = '/TLG/pages/store/review/renderReviewWrite.js';

    await new Promise((resolve, reject) => {
      script.onload = () => {
        console.log('✅ renderReviewWrite 스크립트 로드 완료');
        resolve();
      };
      script.onerror = () => {
        console.error('❌ renderReviewWrite 스크립트 로드 실패');
        reject();
      };
      document.head.appendChild(script);
    });
  } catch (error) {
    console.error('❌ renderReviewWrite 스크립트 로드 중 오류:', error);
    throw error;
  }
}

// 전역으로 함수 노출
window.renderAllOrderHTML = renderAllOrderHTML;