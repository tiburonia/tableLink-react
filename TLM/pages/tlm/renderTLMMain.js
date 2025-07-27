
let renderTLMMain = async function (storeId) {
  console.log('🏪 TLM 매장 관리 시작, 매장 ID:', storeId);

  try {
    // 매장 정보 가져오기
    const response = await fetch('/api/stores');
    const data = await response.json();
    
    if (!data.success) {
      throw new Error('매장 데이터 로딩 실패');
    }

    const store = data.stores.find(s => s.id === storeId);
    if (!store) {
      throw new Error('매장을 찾을 수 없습니다');
    }

    // UI 렌더링
    main.innerHTML = `
      <div class="tlm-container">
        <header class="tlm-header">
          <div class="store-info">
            <h1 class="store-name">${store.name}</h1>
            <p class="store-category">${store.category}</p>
            <div class="store-status ${store.isOpen ? 'open' : 'closed'}">
              ${store.isOpen ? '🟢 운영중' : '🔴 운영중지'}
            </div>
          </div>
          <button id="logoutBtn" class="logout-btn">로그아웃</button>
        </header>

        <div class="tlm-dashboard">
          <div class="dashboard-grid">
            <!-- 오늘의 통계 -->
            <div class="card stats-card">
              <h3>📊 오늘의 통계</h3>
              <div class="stats-grid">
                <div class="stat-item">
                  <span class="stat-label">총 주문</span>
                  <span class="stat-value">24건</span>
                </div>
                <div class="stat-item">
                  <span class="stat-label">매출</span>
                  <span class="stat-value">450,000원</span>
                </div>
                <div class="stat-item">
                  <span class="stat-label">평균 별점</span>
                  <span class="stat-value">${store.ratingAverage}점</span>
                </div>
                <div class="stat-item">
                  <span class="stat-label">리뷰 수</span>
                  <span class="stat-value">${store.reviewCount}개</span>
                </div>
              </div>
            </div>

            <!-- 테이블 현황 -->
            <div class="card table-card">
              <h3>🏪 테이블 현황</h3>
              <div class="table-info">
                <div class="table-stat">
                  <span>총 테이블: ${store.tableInfo.totalTables}개</span>
                </div>
                <div class="table-stat">
                  <span>사용중: ${store.tableInfo.occupiedTables}개</span>
                </div>
                <div class="table-stat">
                  <span>빈 테이블: ${store.tableInfo.availableTables}개</span>
                </div>
                <div class="occupancy-bar">
                  <div class="occupancy-fill" style="width: ${store.tableInfo.occupancyRate}%"></div>
                </div>
                <p class="occupancy-text">사용률: ${store.tableInfo.occupancyRate}%</p>
              </div>
            </div>

            <!-- 최근 주문 -->
            <div class="card orders-card">
              <h3>📋 최근 주문</h3>
              <div class="recent-orders">
                <div class="order-item">
                  <span class="order-info">테이블 3 - 불고기덮밥 2개</span>
                  <span class="order-time">5분 전</span>
                </div>
                <div class="order-item">
                  <span class="order-info">테이블 7 - 김치찌개 1개</span>
                  <span class="order-time">12분 전</span>
                </div>
                <div class="order-item">
                  <span class="order-info">테이블 1 - 된장찌개 2개</span>
                  <span class="order-time">18분 전</span>
                </div>
              </div>
            </div>

            <!-- 최근 리뷰 -->
            <div class="card reviews-card">
              <h3>⭐ 최근 리뷰</h3>
              <div class="recent-reviews">
                <div class="review-item">
                  <div class="review-header">
                    <span class="review-rating">⭐⭐⭐⭐⭐</span>
                    <span class="review-time">2시간 전</span>
                  </div>
                  <p class="review-text">음식이 정말 맛있어요! 다시 올게요.</p>
                </div>
                <div class="review-item">
                  <div class="review-header">
                    <span class="review-rating">⭐⭐⭐⭐</span>
                    <span class="review-time">5시간 전</span>
                  </div>
                  <p class="review-text">친절하고 깔끔한 매장이네요.</p>
                </div>
              </div>
            </div>
          </div>

          <!-- 빠른 액션 버튼들 -->
          <div class="action-buttons">
            <button class="action-btn primary" onclick="toggleStoreStatus()">
              ${store.isOpen ? '🔴 운영 중지' : '🟢 운영 시작'}
            </button>
            <button class="action-btn" onclick="viewAllOrders()">📋 전체 주문 보기</button>
            <button class="action-btn" onclick="viewAllReviews()">⭐ 전체 리뷰 보기</button>
            <button class="action-btn" onclick="manageMenu()">🍽️ 메뉴 관리</button>
          </div>
        </div>
      </div>

      <style>
        .tlm-container {
          width: 100%;
          max-width: 1200px;
          margin: 0 auto;
          padding: 20px;
          color: white;
        }

        .tlm-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 30px;
          background: rgba(255, 255, 255, 0.1);
          padding: 20px;
          border-radius: 15px;
          backdrop-filter: blur(10px);
        }

        .store-name {
          font-size: 32px;
          font-weight: 700;
          margin: 0 0 5px 0;
        }

        .store-category {
          font-size: 16px;
          opacity: 0.8;
          margin: 0 0 10px 0;
        }

        .store-status {
          display: inline-block;
          padding: 6px 12px;
          border-radius: 20px;
          font-size: 14px;
          font-weight: 600;
        }

        .store-status.open {
          background: rgba(76, 175, 80, 0.2);
          border: 1px solid #4CAF50;
        }

        .store-status.closed {
          background: rgba(244, 67, 54, 0.2);
          border: 1px solid #f44336;
        }

        .logout-btn {
          padding: 10px 20px;
          background: rgba(255, 255, 255, 0.2);
          color: white;
          border: 1px solid rgba(255, 255, 255, 0.3);
          border-radius: 8px;
          cursor: pointer;
          font-size: 14px;
          transition: all 0.3s ease;
        }

        .logout-btn:hover {
          background: rgba(255, 255, 255, 0.3);
        }

        .dashboard-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
          gap: 20px;
          margin-bottom: 30px;
        }

        .card {
          background: rgba(255, 255, 255, 0.1);
          border-radius: 15px;
          padding: 20px;
          backdrop-filter: blur(10px);
          border: 1px solid rgba(255, 255, 255, 0.2);
        }

        .card h3 {
          margin: 0 0 15px 0;
          font-size: 18px;
          font-weight: 600;
        }

        .stats-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 15px;
        }

        .stat-item {
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: 10px;
          background: rgba(255, 255, 255, 0.1);
          border-radius: 8px;
        }

        .stat-label {
          font-size: 12px;
          opacity: 0.8;
          margin-bottom: 5px;
        }

        .stat-value {
          font-size: 20px;
          font-weight: 700;
        }

        .table-info {
          space-y: 10px;
        }

        .table-stat {
          margin-bottom: 8px;
          font-size: 14px;
        }

        .occupancy-bar {
          width: 100%;
          height: 8px;
          background: rgba(255, 255, 255, 0.2);
          border-radius: 4px;
          overflow: hidden;
          margin: 10px 0;
        }

        .occupancy-fill {
          height: 100%;
          background: linear-gradient(90deg, #4CAF50, #FFC107, #FF5722);
          transition: width 0.3s ease;
        }

        .occupancy-text {
          text-align: center;
          font-size: 12px;
          opacity: 0.8;
          margin: 0;
        }

        .recent-orders, .recent-reviews {
          max-height: 200px;
          overflow-y: auto;
        }

        .order-item, .review-item {
          padding: 10px;
          background: rgba(255, 255, 255, 0.1);
          border-radius: 8px;
          margin-bottom: 8px;
        }

        .order-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .order-time, .review-time {
          font-size: 12px;
          opacity: 0.7;
        }

        .review-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 5px;
        }

        .review-text {
          font-size: 14px;
          margin: 0;
          opacity: 0.9;
        }

        .action-buttons {
          display: flex;
          flex-wrap: wrap;
          gap: 15px;
          justify-content: center;
        }

        .action-btn {
          padding: 12px 24px;
          background: rgba(255, 255, 255, 0.2);
          color: white;
          border: 1px solid rgba(255, 255, 255, 0.3);
          border-radius: 8px;
          cursor: pointer;
          font-size: 14px;
          font-weight: 600;
          transition: all 0.3s ease;
        }

        .action-btn:hover {
          background: rgba(255, 255, 255, 0.3);
          transform: translateY(-2px);
        }

        .action-btn.primary {
          background: rgba(102, 126, 234, 0.8);
          border-color: #667eea;
        }

        .action-btn.primary:hover {
          background: rgba(102, 126, 234, 1);
        }

        @media (max-width: 768px) {
          .tlm-header {
            flex-direction: column;
            text-align: center;
            gap: 15px;
          }

          .dashboard-grid {
            grid-template-columns: 1fr;
          }

          .action-buttons {
            flex-direction: column;
          }

          .action-btn {
            width: 100%;
          }
        }
      </style>
    `;

    // 이벤트 리스너 설정
    const logoutBtn = document.getElementById('logoutBtn');
    logoutBtn.addEventListener('click', () => {
      if (confirm('로그아웃하시겠습니까?')) {
        window.location.href = '/';
      }
    });

    console.log('✅ TLM 매장 관리 화면 렌더링 완료');

  } catch (error) {
    console.error('❌ TLM 로딩 실패:', error);
    main.innerHTML = `
      <div style="text-align:center; color:white; font-size:18px;">
        <h1>❌ 매장 정보 로딩 실패</h1>
        <p>${error.message}</p>
        <button onclick="window.location.href='/'" style="margin-top:20px; padding:10px 20px; background:#fff; color:#333; border:none; border-radius:5px; cursor:pointer;">
          메인으로 돌아가기
        </button>
      </div>
    `;
  }
};

// 매장 운영 상태 토글 함수
function toggleStoreStatus() {
  alert('매장 운영 상태 변경 기능은 개발 중입니다.');
}

// 전체 주문 보기 함수  
function viewAllOrders() {
  alert('전체 주문 보기 기능은 개발 중입니다.');
}

// 전체 리뷰 보기 함수
function viewAllReviews() {
  alert('전체 리뷰 보기 기능은 개발 중입니다.');
}

// 메뉴 관리 함수
function manageMenu() {
  alert('메뉴 관리 기능은 개발 중입니다.');
}
