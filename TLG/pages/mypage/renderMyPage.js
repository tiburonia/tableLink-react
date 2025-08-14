async function renderMyPage() {
  const main = document.getElementById('main');

  // UI 먼저 렌더링 (로딩 상태로)
  main.innerHTML = `
    <button id="settingsBtn" class="settings-button">⚙️</button>

    <main id="content">
      <section class="section-card">
        <h2>📦 주문내역</h2>
        <div id="orderList">
          <p>📋 주문내역을 불러오는 중...</p>
        </div>
      </section>

      <section class="section-card">
        <h2>📅 예약내역</h2>
        <div id="reservationList">
          <p>📅 예약내역을 불러오는 중...</p>
        </div>
      </section>

      <section class="section-card">
        <h2>🎁 쿠폰 리스트</h2>
        <div id="couponList">
          <p>🎁 쿠폰 정보를 불러오는 중...</p>
        </div>
      </section>

      <section class="section-card">
        <h2>⭐ 내 리뷰 내역</h2>
        <div id="reviewList">
          <p>📝 리뷰 내역을 불러오는 중...</p>
        </div>
      </section>


    </main>

    <nav id="bottomBar">
      <button id="TLL">📱</button>
      <button id="renderMapBtn">🗺️</button>
      <button id="notificationBtn">🔔</button>
      <button onclick="renderMyPage()">👤</button>
    </nav>

    <style>
      #main {
        font-family: sans-serif;
        background: #f8f9fb;
        overflow: hidden; /* 전체 스크롤 방지 */
      }

      .settings-button {
        position: fixed;
        top: 20px;
        right: 20px;
        width: 50px;
        height: 50px;
        border: none;
        background: rgba(255, 255, 255, 0.95);
        border-radius: 50%;
        font-size: 24px;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        color: #297efc;
        transition: all 0.3s ease;
        box-shadow: 0 4px 16px rgba(41, 126, 252, 0.15);
        z-index: 9999;
        backdrop-filter: blur(10px);
        border: 2px solid rgba(41, 126, 252, 0.1);
      }

      .settings-button:hover {
        background: rgba(41, 126, 252, 0.1);
        transform: scale(1.1) rotate(90deg);
        box-shadow: 0 6px 20px rgba(41, 126, 252, 0.25);
      }

      .settings-button:active {
        background: rgba(41, 126, 252, 0.2);
        transform: scale(0.95) rotate(90deg);
      }

      #content {
        position: absolute;
        top: 0;          /* 헤더 삭제로 0부터 시작 */
        bottom: 78px;    /* 바텀 바 높이만큼 */
        left: 0;
        width: 100%;
        max-width: 430px;
        overflow-y: auto;  /* 여기만 스크롤 */
        padding: 18px 18px 0 18px;  /* 상단 패딩 추가 */
        box-sizing: border-box;
        background: #f8f9fb;
        z-index: 1;
      }

      .section-card {
        background: white;
        border-radius: 12px;
        padding: 14px 16px;
        margin-bottom: 18px;
        box-shadow: 0 2px 10px rgba(0, 0, 0, 0.04);
      }
      .section-card h2 {
        margin-bottom: 10px;
        font-size: 18px;
        font-weight: 600;
      }

      #bottomBar {
        position: fixed;
        bottom: 0;
        left: 50%;
        transform: translateX(-50%);
        width: 100%;
        max-width: 430px;
        height: 78px;
        background: linear-gradient(145deg, rgba(255,255,255,0.98), rgba(250,252,255,0.95));
        border-top: 1px solid rgba(255,255,255,0.3);
        box-shadow: 
          0 -8px 32px rgba(41, 126, 252, 0.08),
          0 -4px 16px rgba(0, 0, 0, 0.04),
          inset 0 1px 0 rgba(255, 255, 255, 0.8);
        display: flex;
        justify-content: space-around;
        align-items: center;
        z-index: 1001;
        padding: 8px 16px 12px 16px;
        box-sizing: border-box;
        border-radius: 24px 24px 0 0;
        backdrop-filter: blur(20px);
        gap: 8px;
      }

      #bottomBar button {
        position: relative;
        flex: 1;
        height: 52px;
        min-width: 0;
        border: none;
        outline: none;
        border-radius: 16px;
        background: linear-gradient(135deg, #f8f9ff 0%, #f0f4ff 100%);
        color: #6B7280;
        font-size: 20px;
        font-family: inherit;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        overflow: hidden;
        border: 1px solid rgba(255, 255, 255, 0.4);
      }

      #bottomBar button::before {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: linear-gradient(135deg, rgba(41, 126, 252, 0.05), rgba(79, 70, 229, 0.03));
        opacity: 0;
        transition: opacity 0.3s ease;
        border-radius: 16px;
      }

      #bottomBar button:hover {
        background: linear-gradient(135deg, #f0f4ff 0%, #e8f0ff 100%);
        color: #297efc;
        transform: translateY(-2px);
        box-shadow: 
          0 8px 24px rgba(41, 126, 252, 0.12),
          0 4px 12px rgba(0, 0, 0, 0.05);
        border-color: rgba(41, 126, 252, 0.2);
      }

      #bottomBar button:hover::before {
        opacity: 1;
      }

      #bottomBar button:active {
        transform: translateY(0px);
        box-shadow: 
          0 4px 16px rgba(41, 126, 252, 0.15),
          0 2px 8px rgba(0, 0, 0, 0.05);
      }
      .order-item {
        background: #fff;
        border-radius: 8px;
        padding: 8px 12px;
        margin-bottom: 8px;
        border: 1px solid #f0f0f0;
      }
      .order-info {
        margin-bottom: 6px;
        line-height: 1.3;
      }
      .review-section {
        display: flex;
        justify-content: flex-end;
      }
      .review-btn {
        background: #297efc;
        color: white;
        border: none;
        padding: 6px 12px;
        border-radius: 6px;
        font-size: 13px;
        cursor: pointer;
        transition: background 0.2s;
      }
      .review-btn:hover {
        background: #2266d9;
      }
      .review-modal {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0,0,0,0.5);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 2000;
      }
      .review-modal-content {
        background: white;
        padding: 20px;
        border-radius: 12px;
        width: 90%;
        max-width: 400px;
        max-height: 80%;
        overflow-y: auto;
      }
      .star-rating {
        display: flex;
        gap: 5px;
        margin: 10px 0;
      }
      .star {
        font-size: 24px;
        cursor: pointer;
        color: #ddd;
        transition: color 0.2s;
      }
      .star.active {
        color: #ffbf00;
      }
      .review-textarea {
        width: 100%;
        height: 100px;
        border: 1px solid #ddd;
        border-radius: 6px;
        padding: 8px;
        font-size: 14px;
        resize: vertical;
      }
      .modal-buttons {
        display: flex;
        gap: 10px;
        margin-top: 15px;
      }
      .modal-btn {
        flex: 1;
        padding: 10px;
        border: none;
        border-radius: 6px;
        cursor: pointer;
        font-size: 14px;
      }
      .submit-btn {
        background: #297efc;
        color: white;
      }
      .cancel-btn {
        background: #f0f0f0;
        color: #333;
      }
      .more-orders-btn {
        width: 100%;
        padding: 10px;
        margin-top: 10px;
        background: #6c757d;
        color: white;
        border: none;
        border-radius: 8px;
        cursor: pointer;
        font-size: 14px;
        transition: background 0.2s;
      }
      .more-orders-btn:hover {
        background: #5a6268;
      }
      .review-item {
        background: #f8f9fa;
        border-radius: 8px;
        padding: 12px;
        margin-bottom: 8px;
        border: 1px solid #e9ecef;
        transition: background 0.2s;
      }
      .review-item:hover {
        background: #e9ecef;
      }
      .review-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 8px;
      }
      .review-store {
        font-weight: 600;
        color: #333;
      }
      .review-rating {
        color: #ffbf00;
        font-weight: bold;
      }
      .review-content {
        color: #666;
        font-size: 14px;
        line-height: 1.4;
        margin-bottom: 6px;
      }
      .review-date {
        color: #999;
        font-size: 12px;
      }
      .view-all-reviews-btn {
        width: 100%;
        padding: 10px;
        margin-top: 10px;
        background: #17a2b8;
        color: white;
        border: none;
        border-radius: 8px;
        cursor: pointer;
        font-size: 14px;
        transition: background 0.2s;
      }
      .view-all-reviews-btn:hover {
        background: #138496;
      }
      .review-actions {
        display: flex;
        gap: 8px;
        margin-top: 10px;
        justify-content: flex-end;
      }
      .edit-review-btn, .delete-review-btn, .go-to-store-btn {
        padding: 6px 10px;
        border: none;
        border-radius: 5px;
        cursor: pointer;
        font-size: 12px;
        transition: background 0.2s, opacity 0.2s;
      }
      .edit-review-btn {
        background: #ffc107;
        color: white;
      }
      .edit-review-btn:hover {
        background: #e0a800;
      }
      .delete-review-btn {
        background: #dc3545;
        color: white;
      }
      .delete-review-btn:hover {
        background: #c82333;
      }
      .go-to-store-btn {
        background: #28a745;
        color: white;
      }
      .go-to-store-btn:hover {
        background: #218838;
      }
      .favorite-store-icon {
        cursor: pointer;
        font-size: 20px;
        margin-left: 10px;
        color: #ccc; /* 기본 회색 */
      }
      .favorite-store-icon.active {
        color: #ffc107; /* 활성화 시 노란색 */
      }
    </style>
  `;

  // 설정 버튼 이벤트 리스너 추가
  const settingsBtn = document.querySelector('#settingsBtn');
  settingsBtn.addEventListener('click', () => {
    if (typeof renderMyAccount === 'function') {
      renderMyAccount();
    } else {
      console.warn('⚠️ renderMyAccount 함수를 찾을 수 없습니다');
    }
  });

  // 바텀 네비게이션 이벤트 리스너 추가
  const renderTLL = document.querySelector('#TLL');
  renderTLL.addEventListener('click', async () => {
    await TLL();
  });

  const renderMapBtn = document.querySelector('#renderMapBtn');
  renderMapBtn.addEventListener('click', () => {
    if (typeof renderMap === 'function') {
      renderMap();
    } else {
      location.reload();
    }
  });

  const notificationBtn = document.querySelector('#notificationBtn');
  notificationBtn.addEventListener('click', () => {
    if (typeof renderNotification === 'function') {
      renderNotification();
    } else {
      console.warn('⚠️ renderNotification 함수를 찾을 수 없습니다');
    }
  });

  // 비동기로 사용자 정보 로드 및 업데이트
  loadUserData();
}

// 사용자 데이터를 비동기로 로드하는 함수
async function loadUserData() {
  try {
    // 사용자 기본 정보 가져오기
    const userResponse = await fetch('/api/users/info', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: userInfo.id })
    });

    if (!userResponse.ok) throw new Error('사용자 정보 조회 실패');
    const userData = await userResponse.json();
    const currentUserInfo = userData.user;

    // orders 테이블에서 주문 내역 가져오기
    const ordersResponse = await fetch(`/api/orders/mypage/${userInfo.id}?limit=2`);
    let ordersData = [];
    if (ordersResponse.ok) {
      const ordersResult = await ordersResponse.json();
      ordersData = ordersResult.orders || [];
    }

    // 즐겨찾기 매장 정보 가져오기
    const favoriteStoresResponse = await fetch(`/api/users/favorites/${userInfo.id}`);
    let favoriteStoresData = [];
    if (favoriteStoresResponse.ok) {
      const favoriteStoresResult = await favoriteStoresResponse.json();
      favoriteStoresData = favoriteStoresResult.stores || [];
    }

    // 주문내역 업데이트 (비동기)
    await updateOrderList(currentUserInfo, ordersData);

    // 예약내역 업데이트
    updateReservationList(currentUserInfo);

    // 쿠폰내역 업데이트
    updateCouponList(currentUserInfo);

    // 리뷰내역 업데이트
    updateReviewList(currentUserInfo);

    // 즐겨찾기 매장 UI 업데이트
    updateFavoriteStoresUI(favoriteStoresData);

  } catch (error) {
    console.error('사용자 데이터 로딩 실패:', error);

    // 에러 발생 시 각 섹션에 에러 메시지 표시
    const orderList = document.querySelector('#orderList');
    const reservationList = document.querySelector('#reservationList');
    const couponList = document.querySelector('#couponList');
    const reviewList = document.querySelector('#reviewList');
    const favoriteStoresSection = document.getElementById('favoriteStoresSection');

    if (orderList) orderList.innerHTML = `<p>❌ 주문내역을 불러올 수 없습니다.</p>`;
    if (reservationList) reservationList.innerHTML = `<p>❌ 예약내역을 불러올 수 없습니다.</p>`;
    if (couponList) couponList.innerHTML = `<p>❌ 쿠폰 정보를 불러올 수 없습니다.</p>`;
    if (reviewList) reviewList.innerHTML = `<p>❌ 리뷰 내역을 불러올 수 없습니다.</p>`;
    if (favoriteStoresSection) favoriteStoresSection.innerHTML = `<p>❌ 즐겨찾기 매장 정보를 불러올 수 없습니다.</p>`;
  }
}

// 주문내역 업데이트 함수 (최근 2개만 표시)
async function updateOrderList(currentUserInfo, ordersData) {
  const orderList = document.querySelector('#orderList');
  if (!orderList) return;

  orderList.innerHTML = ''; // 기존 내용 초기화

  if (ordersData && ordersData.length > 0) {
    // 각 주문에 대한 리뷰 존재 여부를 병렬로 확인
    const reviewCheckPromises = ordersData.map(order => checkOrderHasReview(order.id));
    const reviewStatuses = await Promise.all(reviewCheckPromises);

    ordersData.forEach((order, index) => {
      const orderDiv = document.createElement('div');
      orderDiv.className = 'order-item';

      // order_data에서 메뉴 정보 추출
      const orderData = order.order_data || {};
      const items = orderData.items ? orderData.items.map(i => `${i.name}(${i.qty}개)`).join(', ') : '메뉴 정보 없음';
      const storeName = orderData.store || order.store_name || '매장 정보 없음';

      // 리뷰 작성 여부 확인 결과 사용
      const hasReview = reviewStatuses[index];

      orderDiv.innerHTML = `
        <div class="order-info">
          • <strong>${storeName}</strong><br>
          ${items}<br>
          총 ${order.final_amount?.toLocaleString() || order.total_amount?.toLocaleString() || '0'}원 | 📅 ${new Date(order.order_date).toLocaleDateString()}
        </div>
        <div class="review-section">
          ${hasReview ?
            `<p style="color: #28a745; font-size: 14px; font-weight: 600;">✅ 리뷰 작성 완료</p>` :
            `<button class="review-btn" data-order-id="${order.id}" data-order-index="${index}">📝 리뷰 작성하기</button>`
          }
        </div>
        <br>
      `;
      orderList.appendChild(orderDiv);
    });

    // 더보기 버튼 추가
    const moreBtn = document.createElement('button');
    moreBtn.className = 'more-orders-btn';
    moreBtn.innerHTML = `📋 전체 주문내역 보기`;
    moreBtn.addEventListener('click', () => {
      renderAllOrderHTML(userInfo);
    });
    orderList.appendChild(moreBtn);

    // 리뷰 작성 버튼 이벤트 리스너
    document.querySelectorAll('.review-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const orderIndex = parseInt(e.target.getAttribute('data-order-index'));
        const orderId = e.target.getAttribute('data-order-id');
        const order = ordersData[orderIndex];
        console.log('🔍 선택된 주문 정보:', order);
        showReviewModalFromOrders(order, orderIndex);
      });
    });
  } else {
    orderList.innerHTML = `<p>주문 내역이 없습니다.</p>`;
  }
}

// 주문에 대한 리뷰 존재 여부 확인 함수
async function checkOrderHasReview(orderId) {
  try {
    const response = await fetch(`/api/orders/${orderId}/review-status`);
    const data = await response.json();

    if (data.success) {
      return data.hasReview;
    } else {
      console.warn(`⚠️ 주문 ${orderId} 리뷰 상태 확인 실패:`, data.error);
      return false;
    }
  } catch (error) {
    console.error(`❌ 주문 ${orderId} 리뷰 상태 확인 오류:`, error);
    return false;
  }
}

// orders 테이블 기반 리뷰 작성 모달 표시
function showReviewModalFromOrders(order, orderIndex) {
  const orderData = order.order_data || {};
  const items = orderData.items ? orderData.items.map(i => `${i.name}(${i.qty}개)`).join(', ') : '메뉴 정보 없음';
  const storeName = orderData.store || order.store_name || '매장 정보 없음';

  const modal = document.createElement('div');
  modal.className = 'review-modal';
  modal.innerHTML = `
    <div class="review-modal-content">
      <h3>리뷰 작성</h3>
      <p><strong>매장:</strong> ${storeName}</p>
      <p><strong>주문:</strong> ${items}</p>

      <div>
        <label>평점:</label>
        <div class="star-rating">
          <span class="star" data-rating="1">★</span>
          <span class="star" data-rating="2">★</span>
          <span class="star" data-rating="3">★</span>
          <span class="star" data-rating="4">★</span>
          <span class="star" data-rating="5">★</span>
        </div>
      </div>

      <div>
        <label>리뷰 내용:</label>
        <textarea class="review-textarea" placeholder="음식과 서비스에 대한 솔직한 후기를 남겨주세요..."></textarea>
      </div>

      <div class="modal-buttons">
        <button class="modal-btn cancel-btn">취소</button>
        <button class="modal-btn submit-btn">리뷰 등록</button>
      </div>
    </div>
  `;

  document.body.appendChild(modal);

  let selectedRating = 0;

  // 별점 선택 이벤트
  modal.querySelectorAll('.star').forEach(star => {
    star.addEventListener('click', (e) => {
      selectedRating = parseInt(e.target.getAttribute('data-rating'));
      updateStarDisplay(modal, selectedRating);
    });
  });

  // 취소 버튼
  modal.querySelector('.cancel-btn').addEventListener('click', () => {
    document.body.removeChild(modal);
  });

  // 등록 버튼
  modal.querySelector('.submit-btn').addEventListener('click', async () => {
    const reviewText = modal.querySelector('.review-textarea').value.trim();

    if (selectedRating === 0) {
      alert('평점을 선택해주세요.');
      return;
    }

    if (reviewText === '') {
      alert('리뷰 내용을 입력해주세요.');
      return;
    }

    try {
      await submitReviewFromOrders(order, selectedRating, reviewText);
      document.body.removeChild(modal);

      // 리뷰 캐시 초기화
      if (order.store_id) {
        const reviewCacheKey = `tablelink_reviews_store_${order.store_id}`;
        localStorage.removeItem(reviewCacheKey);
        console.log('🗑️ 리뷰 등록 후 캐시 초기화 완료:', reviewCacheKey);
      }

      renderMyPage(); // 페이지 새로고침
    } catch (error) {
      console.error('리뷰 등록 오류:', error);
      alert('리뷰 등록에 실패했습니다: ' + error.message);
    }
  });

  // 모달 배경 클릭 시 닫기
  modal.addEventListener('click', (e) => {
    if (e.target === modal) {
      document.body.removeChild(modal);
    }
  });
}

// 리뷰 모달 표시 (레거시 호환용)
function showReviewModal(order, orderIndex) {
  const modal = document.createElement('div');
  modal.className = 'review-modal';
  modal.innerHTML = `
    <div class="review-modal-content">
      <h3>리뷰 작성</h3>
      <p><strong>매장:</strong> ${order.store}</p>
      <p><strong>주문:</strong> ${order.items.map(i => `${i.name}(${i.qty}개)`).join(', ')}</p>

      <div>
        <label>평점:</label>
        <div class="star-rating">
          <span class="star" data-rating="1">★</span>
          <span class="star" data-rating="2">★</span>
          <span class="star" data-rating="3">★</span>
          <span class="star" data-rating="4">★</span>
          <span class="star" data-rating="5">★</span>
        </div>
      </div>

      <div>
        <label>리뷰 내용:</label>
        <textarea class="review-textarea" placeholder="음식과 서비스에 대한 솔직한 후기를 남겨주세요..."></textarea>
      </div>

      <div class="modal-buttons">
        <button class="modal-btn cancel-btn">취소</button>
        <button class="modal-btn submit-btn">리뷰 등록</button>
      </div>
    </div>
  `;

  document.body.appendChild(modal);

  let selectedRating = 0;

  // 별점 선택 이벤트
  modal.querySelectorAll('.star').forEach(star => {
    star.addEventListener('click', (e) => {
      selectedRating = parseInt(e.target.getAttribute('data-rating'));
      updateStarDisplay(modal, selectedRating);
    });
  });

  // 취소 버튼
  modal.querySelector('.cancel-btn').addEventListener('click', () => {
    document.body.removeChild(modal);
  });

  // 등록 버튼
  modal.querySelector('.submit-btn').addEventListener('click', async () => {
    const reviewText = modal.querySelector('.review-textarea').value.trim();

    if (selectedRating === 0) {
      alert('평점을 선택해주세요.');
      return;
    }

    if (reviewText === '') {
      alert('리뷰 내용을 입력해주세요.');
      return;
    }

    try {
      await submitReview(order, orderIndex, selectedRating, reviewText);
      document.body.removeChild(modal);

      // 리뷰 캐시 초기화 (해당 매장의 리뷰 캐시 삭제)
      if (order.storeId) {
        const reviewCacheKey = `tablelink_reviews_store_${order.storeId}`;
        localStorage.removeItem(reviewCacheKey);
        console.log('🗑️ 리뷰 등록 후 캐시 초기화 완료:', reviewCacheKey);
      }

      renderMyPage(); // 페이지 새로고침
    } catch (error) {
      console.error('리뷰 등록 오류:', error);
      if (error.message.includes('이미 리뷰를 작성한 주문입니다')) {
        alert('이미 리뷰를 작성한 주문입니다.');
      } else {
        alert('리뷰 등록에 실패했습니다: ' + error.message);
      }
    }
  });

  // 모달 배경 클릭 시 닫기
  modal.addEventListener('click', (e) => {
    if (e.target === modal) {
      document.body.removeChild(modal);
    }
  });
}

// 별점 표시 업데이트
function updateStarDisplay(modal, rating) {
  const stars = modal.querySelectorAll('.star');
  stars.forEach((star, index) => {
    if (index < rating) {
      star.classList.add('active');
    } else {
      star.classList.remove('active');
    }
  });
}

// orders 테이블 기반 리뷰 서버 전송
async function submitReviewFromOrders(order, rating, reviewText) {
  console.log('📝 orders 테이블 기반 리뷰 등록 시도:', { order, rating, reviewText });

  const orderData = order.order_data || {};
  const storeName = orderData.store || order.store_name || '매장 정보 없음';

  const reviewData = {
    userId: userInfo.id,
    storeId: order.store_id,
    storeName: storeName,
    orderId: order.id,
    rating: rating,
    reviewText: reviewText,
    orderDate: new Date(order.order_date).toISOString().slice(0, 10)
  };

  console.log('📤 서버로 전송할 리뷰 데이터:', reviewData);

  try {
    const response = await fetch('/api/reviews/submit-from-orders', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(reviewData)
    });

    console.log('📡 서버 응답 상태:', response.status, response.statusText);

    if (!response.ok) {
      let errorData;
      let errorMessage = `서버 오류 (${response.status}): ${response.statusText}`;
      try {
        errorData = await response.json();
        errorMessage = errorData.error || errorMessage;
      } catch (parseError) {
        console.error('❌ 응답 파싱 실패:', parseError);
      }
      console.error('❌ 서버 오류 응답:', errorData);
      alert('리뷰 등록에 실패했습니다: ' + errorMessage);
      throw new Error(errorMessage);
    }

    const result = await response.json();
    console.log('✅ 리뷰 등록 성공:', result);
    return result;

  } catch (error) {
    console.error('❌ 리뷰 등록 과정에서 오류 발생:', error);
    console.error('❌ 오류 스택:', error.stack);

    let userFriendlyMessage = '리뷰 등록에 실패했습니다.';

    if (error.message.includes('404')) {
      userFriendlyMessage = '리뷰 서비스를 찾을 수 없습니다. 잠시 후 다시 시도해주세요.';
    } else if (error.name === 'TypeError' && error.message.includes('fetch')) {
      userFriendlyMessage = '네트워크 연결 오류가 발생했습니다. 인터넷 연결을 확인해주세요.';
    }

    alert(userFriendlyMessage);
    throw error;
  }
}

// 리뷰 서버 전송 (레거시 호환용)
async function submitReview(order, orderIndex, rating, reviewText) {
  console.log('📝 리뷰 등록 시도:', { order, orderIndex, rating, reviewText });

  // storeId가 없는 경우 매장 이름으로 찾기
  let storeId = order.storeId;
  if (!storeId) {
    try {
      const storesResponse = await fetch('/api/stores');
      const storesData = await storesResponse.json();
      const foundStore = storesData.stores.find(store => store.name === order.store);
      storeId = foundStore ? foundStore.id : 1; // 기본값 1
      console.log('🔍 매장 이름으로 찾은 storeId:', storeId);
    } catch (error) {
      console.warn('⚠️ 매장 ID 찾기 실패, 기본값 사용:', error);
      storeId = 1; // 기본값
    }
  }

  const reviewData = {
    userId: userInfo.id,
    storeId: storeId,
    storeName: order.store,
    orderIndex: orderIndex,
    rating: rating,
    reviewText: reviewText,
    orderDate: order.date
  };

  console.log('📤 서버로 전송할 리뷰 데이터:', reviewData);

  try {
    const response = await fetch('/api/reviews/submit', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(reviewData)
    });

    console.log('📡 서버 응답 상태:', response.status, response.statusText);

    if (!response.ok) {
      let errorData;
      let errorMessage = `서버 오류 (${response.status}): ${response.statusText}`;
      try {
        errorData = await response.json();
        errorMessage = errorData.error || errorMessage;
      } catch (parseError) {
        console.error('❌ 응답 파싱 실패:', parseError);
      }
      console.error('❌ 서버 오류 응답:', errorData);
      throw new Error(errorMessage);
    }

    const result = await response.json();
    console.log('✅ 리뷰 등록 성공:', result);
    return result;

  } catch (error) {
    console.error('❌ 리뷰 등록 과정에서 오류 발생:', error);
    console.error('❌ 오류 스택:', error.stack);
    throw error;
  }
}

function updateReservationList(currentUserInfo) {
  const reservationList = document.querySelector('#reservationList');
  if (!reservationList) return;

  reservationList.innerHTML = ''; // 기존 내용 초기화

  // 예약내역
  if (currentUserInfo.reservationList?.length > 0) {
    currentUserInfo.reservationList.forEach(res => {
      const p = document.createElement('p');
      p.innerHTML = `
        • <strong>${res.store}</strong><br>
        ${res.date} / ${res.people}명<br><br>
      `;
      reservationList.appendChild(p);
    });
  } else {
    reservationList.innerHTML = `<p>예약 내역이 없습니다.</p>`;
  }
}

function updateCouponList(currentUserInfo) {
  const couponList = document.querySelector('#couponList');
  if (!couponList) return;

  couponList.innerHTML = ''; // 기존 내용 초기화

  // 쿠폰내역
  if (!currentUserInfo.coupons?.unused?.length) {
    couponList.innerHTML = `<p>보유한 쿠폰이 없습니다.</p>`;
  } else {
    currentUserInfo.coupons.unused.forEach(coupon => {
      const p = document.createElement('p');
      p.innerHTML = `
        • <strong>${coupon.name}</strong><br>
        할인율: ${coupon.discountValue}${coupon.discountType === 'percent' ? '%' : '원'}<br>
        유효기간: ${coupon.validUntil}<br><br>
      `;
      couponList.appendChild(p);
    });
  }
}

// 리뷰 내역 업데이트 함수 (DB에서 실제 데이터 가져오기)
async function updateReviewList(currentUserInfo) {
  const reviewList = document.querySelector('#reviewList');
  if (!reviewList) return;

  reviewList.innerHTML = '<p>📝 리뷰 내역을 불러오는 중...</p>'; // 로딩 상태

  try {
    console.log('📖 사용자 리뷰 내역 조회 시작, userId:', currentUserInfo.id);

    const response = await fetch(`/api/reviews/users/${currentUserInfo.id}?limit=3`);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    console.log('📖 받은 리뷰 데이터:', data);

    reviewList.innerHTML = ''; // 로딩 메시지 제거

    if (data.success && data.reviews && data.reviews.length > 0) {
      // 최근 3개 리뷰만 표시
      data.reviews.forEach(review => {
        const reviewDiv = document.createElement('div');
        reviewDiv.className = 'review-item';
        reviewDiv.innerHTML = `
          <div class="review-header">
            <span class="review-store">${review.storeName}</span>
            <span class="review-rating">★ ${review.score}</span>
          </div>
          <div class="review-content">${review.content}</div>
          <div class="review-date">${review.date}</div>
          <div class="review-actions">
            <button class="edit-review-btn" data-review-id="${review.id}" data-store-id="${review.storeId}" data-current-score="${review.score}" data-current-content="${review.content.replace(/"/g, '&quot;')}">
              ✏️ 수정
            </button>
            <button class="delete-review-btn" data-review-id="${review.id}">
              🗑️ 삭제
            </button>
            <button class="go-to-store-btn" data-store-id="${review.storeId}">
              🏪 매장보기
            </button>
          </div>
        `;

        reviewList.appendChild(reviewDiv);
      });

      // 리뷰 수정/삭제 버튼 이벤트 리스너
      reviewList.querySelectorAll('.edit-review-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
          e.stopPropagation();
          const reviewId = btn.getAttribute('data-review-id');
          const storeId = btn.getAttribute('data-store-id');
          const currentScore = parseInt(btn.getAttribute('data-current-score'));
          const currentContent = btn.getAttribute('data-current-content');
          showEditReviewModal(reviewId, storeId, currentScore, currentContent);
        });
      });

      reviewList.querySelectorAll('.delete-review-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
          e.stopPropagation();
          const reviewId = btn.getAttribute('data-review-id');
          deleteReview(reviewId);
        });
      });

      reviewList.querySelectorAll('.go-to-store-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
          e.stopPropagation();
          const storeId = btn.getAttribute('data-store-id');
          goToStore(storeId);
        });
      });

      // 전체 리뷰 보기 버튼 (3개보다 많은 리뷰가 있을 경우)
      if (data.total > 3) {
        const viewAllBtn = document.createElement('button');
        viewAllBtn.className = 'view-all-reviews-btn';
        viewAllBtn.innerHTML = `📝 전체 리뷰 보기 (${data.total}개)`;
        viewAllBtn.addEventListener('click', () => {
          showAllReviewsModal(currentUserInfo);
        });
        reviewList.appendChild(viewAllBtn);
      }
    } else {
      reviewList.innerHTML = `<p>작성한 리뷰가 없습니다.</p>`;
    }

  } catch (error) {
    console.error('❌ 리뷰 내역 조회 실패:', error);
    reviewList.innerHTML = `<p>❌ 리뷰 내역을 불러올 수 없습니다.</p>`;
  }
}

// 즐겨찾기 매장 UI 업데이트 함수
function updateFavoriteStoresUI(favoriteStoresData) {
  const mainContent = document.getElementById('content');
  let favoriteStoresSection = document.getElementById('favoriteStoresSection');

  // 기존 섹션이 있으면 제거 (새로 렌더링하기 위함)
  if (favoriteStoresSection) {
    favoriteStoresSection.remove();
  }

  favoriteStoresSection = document.createElement('section');
  favoriteStoresSection.id = 'favoriteStoresSection';
  favoriteStoresSection.className = 'section-card';
  favoriteStoresSection.innerHTML = `
    <h2>💖 즐겨찾기 매장</h2>
    <div id="favoriteStoresList">
      ${favoriteStoresData.length > 0 ?
        favoriteStoresData.map(store => `
          <div class="favorite-store-item">
            <span class="favorite-store-name">${store.name}</span>
            <span class="favorite-store-info">${store.category} | ${store.address}</span>
            <span class="favorite-store-icon active" data-store-id="${store.id}">⭐</span>
          </div>
        `).join('') :
        `<p>즐겨찾는 매장이 없습니다.</p>`
      }
    </div>
  `;

  // 즐겨찾기 섹션을 주문내역 바로 아래에 삽입
  const orderListSection = document.querySelector('#orderList').closest('.section-card');
  if (orderListSection) {
    orderListSection.parentNode.insertBefore(favoriteStoresSection, orderListSection.nextSibling);
  } else {
    // 주문 내역이 없을 경우, 다른 섹션 앞에 삽입하거나 맨 앞에 삽입
    mainContent.prepend(favoriteStoresSection);
  }

  // 즐겨찾기 아이콘 이벤트 리스너 추가
  favoriteStoresSection.querySelectorAll('.favorite-store-icon').forEach(icon => {
    icon.addEventListener('click', async (e) => {
      e.stopPropagation();
      const storeId = icon.getAttribute('data-store-id');
      const isFavorite = icon.classList.contains('active');

      try {
        const url = `/api/users/favorites/${userInfo.id}/${storeId}`;
        const method = isFavorite ? 'DELETE' : 'POST';

        const response = await fetch(url, { method });
        if (!response.ok) {
          throw new Error('즐겨찾기 상태 변경 실패');
        }

        // UI 업데이트
        if (isFavorite) {
          icon.classList.remove('active');
          // 즐겨찾기 목록에서 해당 매장 제거
          const itemToRemove = icon.closest('.favorite-store-item');
          if (itemToRemove) itemToRemove.remove();
          // 즐겨찾기 목록이 비었는지 확인
          const favoriteStoresListDiv = document.getElementById('favoriteStoresList');
          if (favoriteStoresListDiv && favoriteStoresListDiv.children.length === 0) {
            favoriteStoresListDiv.innerHTML = `<p>즐겨찾는 매장이 없습니다.</p>`;
          }
        } else {
          icon.classList.add('active');
          // 즐겨찾기 목록에 추가 (실제로는 새로고침 또는 추가 로직 필요)
          renderMyPage(); // 간단하게 전체 페이지 새로고침
        }
      } catch (error) {
        console.error('즐겨찾기 처리 중 오류:', error);
        alert('즐겨찾기 상태를 변경하지 못했습니다.');
      }
    });
  });

  // 즐겨찾기 매장 클릭 시 해당 매장 상세 페이지로 이동
  favoriteStoresSection.querySelectorAll('.favorite-store-item').forEach(item => {
    item.addEventListener('click', (e) => {
      const storeId = item.querySelector('.favorite-store-icon').getAttribute('data-store-id');
      goToStore(storeId);
    });
  });
}

// 전체 리뷰 보기 모달
async function showAllReviewsModal(currentUserInfo) {
  try {
    const response = await fetch(`/api/reviews/users/${currentUserInfo.id}`);
    const data = await response.json();

    if (!data.success) {
      throw new Error('리뷰 데이터 조회 실패');
    }

    const modal = document.createElement('div');
    modal.className = 'review-modal';
    modal.innerHTML = `
      <div class="review-modal-content" style="max-height: 80vh; overflow-y: auto;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; position: sticky; top: 0; background: white; padding-bottom: 10px; border-bottom: 1px solid #eee;">
          <h3>⭐ 내 리뷰 전체보기 (${data.total}개)</h3>
          <button class="modal-btn cancel-btn" onclick="this.closest('.review-modal').remove()">✕</button>
        </div>
        <div class="all-reviews-list">
          ${data.reviews.map(review => `
            <div class="review-item" style="cursor: pointer; margin-bottom: 12px;" onclick="closeModalAndGoToStore(${review.storeId})">
              <div class="review-header">
                <span class="review-store">${review.storeName}</span>
                <span class="review-rating">★ ${review.score}</span>
              </div>
              <div class="review-content">${review.content}</div>
              <div class="review-date">${review.date} • ${review.storeCategory}</div>
            </div>
          `).join('')}
        </div>
      </div>
    `;

    document.body.appendChild(modal);

    // 모달 배경 클릭 시 닫기
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        document.body.removeChild(modal);
      }
    });

  } catch (error) {
    console.error('❌ 전체 리뷰 조회 실패:', error);
    alert('리뷰 목록을 불러올 수 없습니다.');
  }
}

// 모달 닫고 매장으로 이동하는 전역 함수
window.closeModalAndGoToStore = function(storeId) {
  // 모달 닫기
  const modal = document.querySelector('.review-modal');
  if (modal) {
    document.body.removeChild(modal);
  }

  // 매장으로 이동
  if (typeof renderStore === 'function') {
    fetch(`/api/stores/${storeId}`)
      .then(response => response.json())
      .then(storeData => {
        if (storeData.success && storeData.store) {
          renderStore(storeData.store);
        }
      })
      .catch(error => {
        console.error('매장 정보 가져오기 실패:', error);
      });
  }
};

// 리뷰 수정 모달 표시
function showEditReviewModal(reviewId, storeId, currentScore, currentContent) {
  const modal = document.createElement('div');
  modal.className = 'review-modal';
  modal.innerHTML = `
    <div class="review-modal-content">
      <h3>리뷰 수정</h3>
      <p><strong>매장 ID:</strong> ${storeId}</p>

      <div>
        <label>평점:</label>
        <div class="star-rating">
          <span class="star" data-rating="1">★</span>
          <span class="star" data-rating="2">★</span>
          <span class="star" data-rating="3">★</span>
          <span class="star" data-rating="4">★</span>
          <span class="star" data-rating="5">★</span>
        </div>
      </div>

      <div>
        <label>리뷰 내용:</label>
        <textarea class="review-textarea">${currentContent}</textarea>
      </div>

      <div class="modal-buttons">
        <button class="modal-btn cancel-btn">취소</button>
        <button class="modal-btn submit-btn">수정 완료</button>
      </div>
    </div>
  `;

  document.body.appendChild(modal);

  let selectedRating = currentScore;
  updateStarDisplay(modal, selectedRating); // 초기 별점 설정

  // 별점 선택 이벤트
  modal.querySelectorAll('.star').forEach(star => {
    star.addEventListener('click', (e) => {
      selectedRating = parseInt(e.target.getAttribute('data-rating'));
      updateStarDisplay(modal, selectedRating);
    });
  });

  // 취소 버튼
  modal.querySelector('.cancel-btn').addEventListener('click', () => {
    document.body.removeChild(modal);
  });

  // 수정 완료 버튼
  modal.querySelector('.submit-btn').addEventListener('click', async () => {
    const reviewText = modal.querySelector('.review-textarea').value.trim();

    if (selectedRating === 0) {
      alert('평점을 선택해주세요.');
      return;
    }

    if (reviewText === '') {
      alert('리뷰 내용을 입력해주세요.');
      return;
    }

    try {
      await editReview(reviewId, selectedRating, reviewText);
      document.body.removeChild(modal);
      renderMyPage(); // 페이지 새로고침
    } catch (error) {
      console.error('리뷰 수정 오류:', error);
      alert('리뷰 수정에 실패했습니다: ' + error.message);
    }
  });

  // 모달 배경 클릭 시 닫기
  modal.addEventListener('click', (e) => {
    if (e.target === modal) {
      document.body.removeChild(modal);
    }
  });
}

// 리뷰 수정 API 호출
async function editReview(reviewId, rating, reviewText) {
  const response = await fetch(`/api/reviews/${reviewId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ rating, content: reviewText })
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || '리뷰 수정 실패');
  }
  return response.json();
}

// 리뷰 삭제 API 호출
async function deleteReview(reviewId) {
  if (!confirm('정말 리뷰를 삭제하시겠습니까?')) {
    return;
  }

  const response = await fetch(`/api/reviews/${reviewId}`, {
    method: 'DELETE'
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || '리뷰 삭제 실패');
  }

  alert('리뷰가 삭제되었습니다.');
  renderMyPage(); // 페이지 새로고침
}

// 매장 상세 페이지로 이동
function goToStore(storeId) {
  if (typeof renderStore === 'function') {
    fetch(`/api/stores/${storeId}`)
      .then(response => response.json())
      .then(storeData => {
        if (storeData.success && storeData.store) {
          renderStore(storeData.store);
        } else {
          alert('매장 정보를 가져올 수 없습니다.');
        }
      })
      .catch(error => {
        console.error('매장 정보 가져오기 실패:', error);
        alert('매장 정보를 가져오는 중 오류가 발생했습니다.');
      });
  } else {
    console.warn('renderStore 함수를 찾을 수 없습니다.');
  }
}

window.renderMyPage = renderMyPage;