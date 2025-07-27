function renderStore(store) {
  console.log('🏪 매장 렌더링:', store.name, '별점 평균:', store.ratingAverage, '(타입:', typeof store.ratingAverage, ')');
  
  main.innerHTML = `
    <button id="backBtn" class="header-btn" onclick="renderMap().catch(console.error)" aria-label="뒤로가기">
      <span class="header-btn-ico">⬅️</span>
    </button>
    <button id="TLL" class="header-btn" aria-label="QR결제" onclick="TLL().catch(console.error)">
      <span class="header-btn-ico">📱</span>
    </button>
    <header id="storeHeader">
      <div class="imgWrapper">
        <img src="TableLink2.png" alt="메뉴이미지" />
      </div>
    </header>
    <div id="storePanel" class="collapsed">
      <div id="panelHandle"></div>
      <div id="storePanelContainer">
        <div id="storeInfoContainer">
          <div class="storeInfo">
            <div class="score-row">
              <span id="reviewStar">★</span>
              <span id="reviewScore">${(store.ratingAverage && store.ratingAverage > 0) ? parseFloat(store.ratingAverage).toFixed(1) : '0.0'}&nbsp<span id="reviewLink">></span></span> 
              <button id="favoriteBtn">♡</button>
            </div>
            <h2 id="storeName">${store.name}</h2>
            <p class="store-desc">여기에 간단한 가게 소개 또는 태그</p>
          </div>
          <div id="TLR" class="tlr-container">
            <div class="tlr-header">
              <div class="tlr-title">🏪 테이블 현황</div>
              <div class="tlr-status-badge" id="tableStatusBadge">로딩중...</div>
            </div>
            <div class="tlr-info-grid">
              <div class="tlr-info-item">
                <div class="tlr-info-label">총 테이블</div>
                <div class="tlr-info-value" id="totalTables">-</div>
              </div>
              <div class="tlr-info-item">
                <div class="tlr-info-label">잔여 테이블</div>
                <div class="tlr-info-value" id="availableTables">-</div>
              </div>
              <div class="tlr-info-item">
                <div class="tlr-info-label">총 좌석</div>
                <div class="tlr-info-value" id="totalSeats">-</div>
              </div>
              <div class="tlr-info-item">
                <div class="tlr-info-label">잔여 좌석</div>
                <div class="tlr-info-value" id="availableSeats">-</div>
              </div>
              <div class="tlr-info-item">
                <div class="tlr-info-label">사용률</div>
                <div class="tlr-info-value" id="occupancyRate">-</div>
              </div>
            </div>
            <button class="tlr-layout-btn" onclick="renderTableLayout(${JSON.stringify(store).replace(/"/g, '&quot;')})">
              <span class="btn-icon">🗺️</span>
              테이블 배치 보기
            </button>
          </div>
          <div id="reviewPreview" class="review-preview">
            <div class="review-title-row">
              <span class="review-title">리뷰 미리보기</span>
              <button class="see-more-btn">전체보기</button>
            </div>
            <div id="reviewPreviewContent">
              <div class="review-card">
                <span class="review-user">🐤 익명</span>
                <span class="review-score">★ 5</span>
                <span class="review-date">1일 전</span>
                <div class="review-text">매장이 깔끔하고 음식이 진짜 맛있었어요! 또 방문할게요.</div>
              </div>
              <div class="review-card">
                <span class="review-user">🍙 user123</span>
                <span class="review-score">★ 4</span>
                <span class="review-date">3일 전</span>
                <div class="review-text">포장 주문했는데 음식이 빨리 나왔어요. 추천!</div>
              </div>
            </div>
          </div>
        </div>
        <div id="storeNavBar" class="no-padding">
          <button class="nav-btn" data-tab="menu">
            <span class="nav-ico">🍽️</span>
            <span class="nav-label">메뉴</span>
          </button>
          <button class="nav-btn" data-tab="review">
            <span class="nav-ico">💬</span>
            <span class="nav-label">리뷰</span>
          </button>
          <button class="nav-btn" data-tab="photo">
            <span class="nav-ico">🖼️</span>
            <span class="nav-label">사진</span>
          </button>
          <button class="nav-btn" data-tab="info">
            <span class="nav-ico">ℹ️</span>
            <span class="nav-label">매장 정보</span>
          </button>
        </div>
        <div id="storeContent"></div>
      </div>
    </div>
    <nav id="storeBottomBar">
      <button id="telephone" class="btm-btn phone-btn" aria-label="전화">
        <span class="btm-btn-ico">📞</span>
      </button>
      <button id="order" class="btm-btn order-btn">
        포장·예약하기
      </button>
    </nav>
    <style>
      html, body {
        margin: 0;
        padding: 0;
        height: 100%;
        font-family: 'Noto Sans KR', sans-serif;
        background: #f8f8f8;
        overflow: hidden;
      }

      #storeHeader {
        position: fixed;
        top: 0;
        left: 50%;
        transform: translateX(-50%);
        width: 100%;
        max-width: 430px;
        height: 200px;
        background: white;
        z-index: 2;
      }

      .imgWrapper {
        width: 100%;
        height: 200px;
        overflow: hidden;
        position: relative;
      }
      .imgWrapper img {
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-190px, -100px);
      }

      #backBtn,
      #TLL {
        position: absolute;
        top: 10px;
        width: 30px;
        height: 30px;
        background: white;
        border: none;
        font-size: 20px;
        cursor: pointer;
        z-index: 1000;
      }
      #backBtn { left: 10px; }
      #TLL { right: 10px; }

      #storePanel {
        position: fixed;
        left: 50%;
        transform: translateX(-50%);
        width: 100%;
        max-width: 430px;
        background: white;
        box-shadow: 0 -2px 10px rgba(0, 0, 0, 0.1);
        transition: all 0.3s;
        z-index: 10;
      }
      #storePanel.collapsed {
        top: 200px;
        bottom: 60px;
        height: calc(100vh - 260px);
        border-radius: 16px 16px 0 0;
      }
      #storePanel.expanded {
        top: 0;
        bottom: 60px;
        height: calc(100vh - 60px);
        border-radius: 0;
        z-index: 99;
      }
      #panelHandle {
        width: 60px;
        height: 8px;
        background: #ccc;
        border-radius: 4px;
        margin: 12px auto;
        cursor: grab;
        touch-action: none;
      }
      #storePanelContainer {
        position: relative;
        height: calc(100% - 24px);
        overflow-y: auto;
        box-sizing: border-box;
        overscroll-behavior: contain;
        -webkit-overflow-scrolling: touch;
        padding: 0 16px 80px 16px; /* 좌우 16px, 하단 80px for 바텀바 */
      }
      #storePanelContainer::-webkit-scrollbar { width: 6px; }
      #storePanelContainer::-webkit-scrollbar-thumb { background: #ccc; border-radius: 3px; }

      .storeInfo,
      .review-preview {
        background: #fff;
        border-radius: 12px;
        box-shadow: 0 2px 8px rgba(0,0,0,0.03);
        padding: 16px 14px 12px 14px;
        margin: 0 0 14px 0;
        display: flex;
        flex-direction: column;
        align-items: flex-start;
      }
      .score-row {
        display: flex;
        align-items: center;
        gap: 8px;
        margin-bottom: 2px;
      }
      #reviewStar {
        font-size: 20px;
        color: #ffc107;
        margin-right: 2px;
      }
      #reviewScore {
        font-weight: bold;
        font-size: 16px;
        color: #222;
      }
      #favoriteBtn {
        margin-left: 10px;
        border: none;
        background: none;
        font-size: 19px;
        color: #ff5777;
        cursor: pointer;
        transition: transform 0.15s;
      }
      #favoriteBtn:active {
        transform: scale(1.18);
      }
      #storeName {
        font-size: 22px;
        font-weight: 700;
        color: #111;
        margin: 6px 0 2px 0;
        letter-spacing: -0.5px;
      }
      .store-desc {
        font-size: 14px;
        color: #888;
        margin: 0 0 2px 1px;
      }

      .tlr-container {
        background: linear-gradient(135deg, #f8fafd 0%, #e8f4fd 100%);
        border: 1px solid #d4e8fc;
        border-radius: 12px;
        padding: 16px;
        margin-bottom: 12px;
        box-shadow: 0 2px 8px rgba(41, 126, 252, 0.08);
      }

      .tlr-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 12px;
      }

      .tlr-title {
        font-size: 16px;
        font-weight: 700;
        color: #297efc;
        display: flex;
        align-items: center;
        gap: 6px;
      }

      .tlr-status-badge {
        background: #4CAF50;
        color: white;
        font-size: 11px;
        font-weight: 600;
        padding: 4px 8px;
        border-radius: 12px;
        text-transform: uppercase;
        letter-spacing: 0.5px;
      }

      .tlr-status-badge.busy {
        background: #FF9800;
      }

      .tlr-status-badge.full {
        background: #F44336;
      }

      .tlr-info-grid {
        display: grid;
        grid-template-columns: 1fr 1fr;
        grid-template-rows: auto auto auto;
        gap: 8px;
        margin-bottom: 14px;
      }

      .tlr-info-grid .tlr-info-item:nth-child(5) {
        grid-column: 1 / -1;
        max-width: 280px;
        margin: 0 auto;
      }

      .tlr-info-item {
        text-align: center;
        background: white;
        border-radius: 8px;
        padding: 10px 8px;
        box-shadow: 0 1px 3px rgba(0,0,0,0.04);
      }

      .tlr-info-grid .tlr-info-item:nth-child(5) {
        padding: 12px 16px;
        background: linear-gradient(135deg, #297efc 0%, #36a1ff 100%);
        color: white;
        box-shadow: 0 2px 8px rgba(41, 126, 252, 0.2);
      }

      .tlr-info-grid .tlr-info-item:nth-child(5) .tlr-info-label {
        color: rgba(255, 255, 255, 0.9);
        font-weight: 600;
      }

      .tlr-info-grid .tlr-info-item:nth-child(5) .tlr-info-value {
        color: white;
        font-size: 20px;
        font-weight: 800;
      }

      .tlr-info-label {
        font-size: 12px;
        color: #666;
        margin-bottom: 4px;
        font-weight: 500;
      }

      .tlr-info-value {
        font-size: 18px;
        font-weight: 700;
        color: #297efc;
      }

      .tlr-layout-btn {
        width: 100%;
        background: white;
        border: 2px solid #297efc;
        color: #297efc;
        font-size: 14px;
        font-weight: 600;
        padding: 10px 16px;
        border-radius: 8px;
        cursor: pointer;
        transition: all 0.2s;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 6px;
      }

      .tlr-layout-btn:hover {
        background: #297efc;
        color: white;
      }

      .btn-icon {
        font-size: 16px;
      }

      .review-preview {
        padding: 13px 14px 11px 14px;
        gap: 7px;
      }
      .review-title-row {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 4px;
      }
      .review-title {
        font-size: 15px;
        font-weight: 600;
        color: #333;
      }
      .see-more-btn {
        font-size: 13px;
        color: #5599ee;
        background: none;
        border: none;
        cursor: pointer;
        padding: 2px 7px;
        border-radius: 6px;
        transition: background 0.15s;
      }
      .see-more-btn:hover {
        background: #f0f4ff;
      }
      .review-card {
        background: #f9f9fb;
        border-radius: 8px;
        padding: 10px 12px 9px 12px;
        margin-bottom: 3px;
        display: flex;
        flex-direction: column;
        gap: 3px;
        box-shadow: 0 1px 2px rgba(0,0,0,0.01);
      }
      .review-user {
        font-size: 13px;
        color: #488;
        font-weight: 600;
        margin-right: 4px;
      }
      .review-score {
        font-size: 13px;
        color: #ffc107;
        font-weight: 600;
        margin-right: 4px;
      }
      .review-date {
        font-size: 12px;
        color: #aaa;
      }
      .review-text {
        font-size: 14px;
        color: #222;
        margin-top: 2px;
        line-height: 1.5;
      }

      #storeNavBar.no-padding {
        margin: 0;
        width: 100%;
        border-radius: 0;
        border-top: none;
        border-bottom: 1px solid #eee;
        background: #fff;
        display: flex;
        justify-content: space-between;
        padding: 0;
        margin-bottom: 8px;
        gap: 0;
        position: sticky;
        top: 0;
        z-index: 5;
      }

      .nav-btn {
        flex: 1;
        background: none;
        border: none;
        outline: none;
        font-family: inherit;
        font-size: 15px;
        color: #666;
        padding: 14px 0 10px 0;
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 2px;
        position: relative;
        cursor: pointer;
        transition: color 0.18s;
        border-bottom: 2.5px solid transparent;
      }
      .nav-btn:active {
        background: #f4f7ff;
      }
      .nav-btn .nav-ico {
        font-size: 18px;
        margin-bottom: 2px;
      }
      .nav-btn.active {
        color: #297efc;
        font-weight: 700;
        border-bottom: 2.5px solid #297efc;
        background: #f4f7ff;
      }

      #storeContent {
        margin: 0 0 0 0;
        padding: 14px 14px 8px 14px;
        font-size: 15px;
        min-height: 80px;
        color: #222;
        background: #fff;
        border-radius: 10px;
        box-shadow: 0 1px 4px rgba(0,0,0,0.02);
      }

      #storeBottomBar {
        position: fixed;
        bottom: 0;
        left: 50%;
        transform: translateX(-50%);
        width: 100%;
        max-width: 430px;
        height: 64px;
        background: #fff;
        border-top: 1.5px solid #e2e6ee;
        display: flex;
        justify-content: space-between;
        align-items: center;
        z-index: 1000;
        padding: 0 16px;
        box-sizing: border-box;
        gap: 0;
      }

      .btm-btn {
        border: none;
        outline: none;
        font-family: inherit;
        transition: background 0.12s, box-shadow 0.13s, color 0.12s;
        cursor: pointer;
        height: 44px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 17px;
        box-shadow: 0 1.5px 6px rgba(0,0,0,0.04);
        font-weight: 600;
      }

      .phone-btn {
        width: 48px;
        min-width: 48px;
        max-width: 48px;
        border-radius: 50%;
        background: #f6fafd;
        color: #2299fc;
        margin-right: 12px;
        font-size: 22px;
        box-shadow: 0 2px 8px rgba(34,153,252,0.06);
      }
      .phone-btn:active {
        background: #e4effd;
        color: #1657a0;
      }
      .btm-btn-ico {
        font-size: 23px;
        pointer-events: none;
        line-height: 1;
      }

      .order-btn {
        flex: 1;
        height: 44px;
        min-width: 0;
        border-radius: 13px;
        background: linear-gradient(90deg, #36a1ff 0%, #297efc 100%);
        color: #fff;
        margin-left: 0;
        font-size: 17px;
        letter-spacing: 0.2px;
        box-shadow: 0 2px 12px rgba(34,153,252,0.09);
        display: flex;
        justify-content: center;
        align-items: center;
      }
      .order-btn:active {
        background: linear-gradient(90deg, #297efc 0%, #36a1ff 100%);
        color: #e3f1ff;
      }

      #storePanelContainer {
        overflow-y: auto;
        /* height는 JS에서 세팅 */
        box-sizing: border-box;
        overscroll-behavior: contain;
        -webkit-overflow-scrolling: touch;
        padding: 0 16px 80px 16px; /* 좌우 16px, 하단 80px for 바텀바 */
      }
    </style>
  `;

  // 엘리먼트 캐싱
  const panel = document.getElementById('storePanel');
  const panelHandle = document.getElementById('panelHandle');
  const storePanelContainer = document.getElementById('storePanelContainer');
  const bottomBar = document.getElementById('storeBottomBar');
  const storeNavBar = document.getElementById('storeNavBar');
  const storeContent = document.getElementById('storeContent');
  const favoriteBtn = document.getElementById('favoriteBtn');
  const reviewPreviewContent = document.getElementById('reviewPreviewContent');


  // Function to fetch and render the top 2 reviews
  async function renderTopReviews(store) {
    try {
      const response = await fetch(`/api/stores/${store.id}/reviews?limit=2`);
      if (!response.ok) {
        throw new Error('Failed to fetch reviews');
      }
      const data = await response.json();
      const reviews = data.reviews || [];

      if (reviewPreviewContent) {
        if (reviews.length === 0) {
          reviewPreviewContent.innerHTML = `
            <div class="review-card" style="text-align: center; color: #888;">
              <div>아직 등록된 리뷰가 없습니다.</div>
              <div style="font-size: 13px; margin-top: 4px;">첫 리뷰를 남겨주세요!</div>
            </div>
          `;
        } else {
          reviewPreviewContent.innerHTML = reviews.slice(0, 2).map(review => `
            <div class="review-card">
              <span class="review-user">${review.user || '익명'}</span>
              <span class="review-score">★ ${review.score}</span>
              <span class="review-date">${review.date || '날짜 정보 없음'}</span>
              <div class="review-text">${review.content}</div>
            </div>
          `).join('');
        }
      }
    } catch (error) {
      console.error('Error fetching and rendering reviews:', error);
      if (reviewPreviewContent) {
        reviewPreviewContent.innerHTML = `
          <div class="review-card" style="text-align: center; color: #ff6b6b;">
            <div>리뷰를 불러올 수 없습니다.</div>
            <div style="font-size: 13px; margin-top: 4px;">네트워크 오류가 발생했습니다.</div>
          </div>
        `;
      }
    }
  }


  // Call the function to render top reviews
  renderTopReviews(store);

  // 즐겨찾기
  favoriteBtn.addEventListener('click', () => {
    toggleFavorite(store.name);
    updateFavoriteBtn(store.name);
  });
  updateFavoriteBtn(store.name);

  // 탭별 렌더 함수
  function renderStoreTab(tab) {
    switch (tab) {
      case 'menu':    storeContent.innerHTML = renderMenuHTML(store);

        break;

      case 'review':  storeContent.innerHTML = renderReviewHTML(store); 
        const seeMoreBtn = storeContent.querySelector('.see-more-btn');
          seeMoreBtn.addEventListener('click', () => {
            renderAllReview(store); // 혹은 window.currentStore 등 원하는 store
          });

        break;
      case 'photo':   storeContent.innerHTML = '등록된 사진이 없습니다...'     //renderPhotoHTML(store);  추후 생성

        break;

      case 'info':    storeContent.innerHTML = '등록된 정보가 없습니다...'     //renderInfoHTML(store); 

        break;

      default:        storeContent.innerHTML = '준비 중...';
    }
    adjustLayout();
  }


  // 탭 네비 이벤트
  storeNavBar.addEventListener('click', (e) => {
    const btn = e.target.closest('.nav-btn');
    if (!btn) return;
    storeNavBar.querySelectorAll('.nav-btn').forEach((b) => b.classList.remove('active'));
    btn.classList.add('active');
    renderStoreTab(btn.dataset.tab);
  });

  // 첫 화면(메뉴 탭)
  renderStoreTab('menu');
  storeNavBar.querySelector('[data-tab="menu"]').classList.add('active');

  // 레이아웃 조정
  function adjustLayout() {
    const vh = window.innerHeight;
    const top = parseInt(window.getComputedStyle(panel).top, 10) || 0;
    const bottomBarHeight = bottomBar ? bottomBar.offsetHeight : 60;
    const handleHeight = panelHandle ? panelHandle.offsetHeight : 0;
    const panelPadding = 24;
    const panelHeight = vh - top - bottomBarHeight - handleHeight - panelPadding;
    storePanelContainer.style.height = `${panelHeight}px`;

    const navBarOffset = storeNavBar.offsetTop;
    const containerHeight = storePanelContainer.clientHeight;
    // 네비가 top에 닿기 전까지만 min-height 확보
    storeContent.style.minHeight = navBarOffset > 0 ? (containerHeight + navBarOffset) + 'px' : '0px';
  }

  window.addEventListener('resize', adjustLayout);
  panel.addEventListener('transitionend', adjustLayout);
  setTimeout(adjustLayout, 0);

  // 휠/스크롤 이벤트(패널+내부 스크롤 자연스럽게)
  panel.addEventListener('wheel', (e) => {
    e.preventDefault();
    const top = parseInt(window.getComputedStyle(panel).top, 10) || 0;
    const isExpanded = top === 0;
    const isCollapsed = !isExpanded;

    // 아래로(내림)
    if (e.deltaY > 0) {
      if (isCollapsed) {
        panel.classList.remove('collapsed');
        panel.classList.add('expanded');
        panel.style.top = '0px';
        setTimeout(adjustLayout, 30);
        return;
      }
      storePanelContainer.scrollTop += e.deltaY;
      return;
    }
    // 위로(올림)
    if (e.deltaY < 0) {
      if (isExpanded) {
        if (storePanelContainer.scrollTop > 0) {
          storePanelContainer.scrollTop += e.deltaY;
          return;
        }
        panel.classList.remove('expanded');
        panel.classList.add('collapsed');
        panel.style.top = '200px';
        setTimeout(adjustLayout, 30);
        return;
      }
      // 접힌 상태면 아무 것도 안함
      return;
    }
  });

  //리뷰전체보기 렌더링 함수
  const reviewLink = document.getElementById('reviewLink');

  reviewLink.addEventListener('click' ,() => {
    renderAllReview(store)
  })

  const reviewLink2 = document.getElementsByClassName('see-more-btn')

  reviewLink2[0].addEventListener('click' ,() => {
    renderAllReview(store)
  })

  loadTableInfo(store);

  // TLR 영역 클릭 시 테이블 정보 새로고침
  const tlrContainer = document.getElementById('TLR');
  if (tlrContainer) {
    tlrContainer.addEventListener('click', () => {
      loadTableInfo(store);
    });
  }

  // 전역에서 접근 가능하도록 store 정보 저장
  window.currentStore = store;

}

// 테이블 정보 로딩 함수
async function loadTableInfo(store) {
  try {
    console.log(`🔍 매장 ${store.name} (ID: ${store.id}) 테이블 정보 조회 중...`);

    const response = await fetch(`/api/stores/${store.id}/tables`);
    if (!response.ok) throw new Error('테이블 정보 조회 실패');

    const data = await response.json();
    console.log(`📊 테이블 데이터:`, data);

    const tables = data.tables || [];
    const totalTables = tables.length;
    const totalSeats = tables.reduce((sum, table) => sum + table.seats, 0);
    const occupiedTables = tables.filter(t => t.isOccupied);
    const availableTables = tables.filter(t => !t.isOccupied);
    const availableSeats = availableTables.reduce((sum, table) => sum + table.seats, 0);
    const occupancyRate = totalSeats > 0 ? Math.round(((totalSeats - availableSeats) / totalSeats) * 100) : 0;

    console.log(`🏪 ${store.name} 통계:
    - 총 테이블: ${totalTables}개
    - 총 좌석: ${totalSeats}석
    - 사용중 테이블: ${occupiedTables.length}개
    - 빈 테이블: ${availableTables.length}개
    - 잔여 좌석: ${availableSeats}석
    - 사용률: ${occupancyRate}%`);

    // UI 업데이트
    const totalTablesEl = document.getElementById('totalTables');
    const availableTablesEl = document.getElementById('availableTables');
    const totalSeatsEl = document.getElementById('totalSeats');
    const availableSeatsEl = document.getElementById('availableSeats');
    const occupancyRateEl = document.getElementById('occupancyRate');
    const statusBadge = document.getElementById('tableStatusBadge');

    if (totalTablesEl) totalTablesEl.textContent = `${totalTables}개`;
    if (availableTablesEl) availableTablesEl.textContent = `${availableTables.length}개`;
    if (totalSeatsEl) totalSeatsEl.textContent = `${totalSeats}석`;
    if (availableSeatsEl) availableSeatsEl.textContent = `${availableSeats}석`;
    if (occupancyRateEl) occupancyRateEl.textContent = `${occupancyRate}%`;

    if (statusBadge) {
      statusBadge.classList.remove('busy', 'full');
      if (occupancyRate >= 90) {
        statusBadge.textContent = 'FULL';
        statusBadge.classList.add('full');
      } else if (occupancyRate >= 70) {
        statusBadge.textContent = 'BUSY';
        statusBadge.classList.add('busy');
      } else {
        statusBadge.textContent = 'OPEN';
      }
    }

  } catch (error) {
    console.error('테이블 정보 로딩 실패:', error);

    // 에러 시 UI 업데이트
    const totalTablesEl = document.getElementById('totalTables');
    const availableTablesEl = document.getElementById('availableTables');
    const totalSeatsEl = document.getElementById('totalSeats');
    const availableSeatsEl = document.getElementById('availableSeats');
    const occupancyRateEl = document.getElementById('occupancyRate');
    const statusBadge = document.getElementById('tableStatusBadge');

    if (totalTablesEl) totalTablesEl.textContent = '오류';
    if (availableTablesEl) availableTablesEl.textContent = '오류';
    if (totalSeatsEl) totalSeatsEl.textContent = '오류';
    if (availableSeatsEl) availableSeatsEl.textContent = '오류';
    if (occupancyRateEl) occupancyRateEl.textContent = '오류';
    if (statusBadge) {
      statusBadge.textContent = 'ERROR';
      statusBadge.style.background = '#666';
    }
  }
}

// 테이블 배치도 렌더링 함수
async function renderTableLayout(store) {
  try {
    const response = await fetch(`/api/stores/${store.id}/tables`);
    if (!response.ok) throw new Error('테이블 정보 조회 실패');

    const data = await response.json();
    const tables = data.tables;

    // 5열 2행 구조로 테이블 배치 (최대 10개 테이블)
    const tableGrid = Array(2).fill(null).map(() => Array(5).fill(null));

    tables.slice(0, 10).forEach((table, index) => {
      const row = Math.floor(index / 5);
      const col = index % 5;
      tableGrid[row][col] = table;
    });

    main.innerHTML = `
      <header class="table-layout-header">
        <button id="tableLayoutBackBtn" class="header-btn" onclick="renderStore(${JSON.stringify(store).replace(/"/g, '&quot;')})">
          <span class="header-btn-ico">⬅️</span>
        </button>
        <h2>${store.name} - 테이블 배치도</h2>
      </header>

      <div class="table-layout-container">
        <div class="table-status-summary">
          <div class="status-item">
            <span class="status-dot available"></span>
            <span>빈 테이블</span>
          </div>
          <div class="status-item">
            <span class="status-dot occupied"></span>
            <span>사용중</span>
          </div>
        </div>

        <div class="table-grid">
          ${tableGrid.map(row => `
            <div class="table-row">
              ${row.map(table => {
                if (!table) {
                  return `<div class="table-slot empty"></div>`;
                }
                const statusClass = table.isOccupied ? 'occupied' : 'available';
                return `
                  <div class="table-slot ${statusClass}" data-table-id="${table.id}">
                    <div class="table-number">${table.tableNumber}</div>
                    <div class="table-name">${table.tableName}</div>
                    <div class="table-seats">${table.seats}석</div>
                  </div>
                `;
              }).join('')}
            </div>
          `).join('')}
        </div>

        <div class="table-info-panel">
          <h3>테이블 정보</h3>
          <div id="selectedTableInfo">테이블을 선택해주세요</div>
        </div>
      </div>

      <style>
        .table-layout-header {
          position: fixed;
          top: 0;
          left: 50%;
          transform: translateX(-50%);
          width: 100%;
          max-width: 430px;
          height: 80px;
          background: white;
          border-bottom: 1px solid #ddd;
          display: flex;
          align-items: center;
          gap: 16px;
          padding: 0 16px;
          z-index: 1001;
          box-sizing: border-box;
        }

        .table-layout-header h2 {
          margin: 0;
          font-size: 18px;
          font-weight: 600;
          color: #333;
        }

        .header-btn {
          width: 36px;
          height: 36px;
          border-radius: 50%;
          border: none;
          background: #f8fafd;
          color: #297efc;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 20px;
          cursor: pointer;
          box-shadow: 0 2px 8px rgba(30,110,255,0.05);
        }

        .table-layout-container {
          position: absolute;
          top: 80px;
          bottom: 0;
          left: 0;
          width: 100%;
          max-width: 430px;
          overflow-y: auto;
          padding: 20px;
          background: #f8f9fb;
          box-sizing: border-box;
        }

        .table-status-summary {
          display: flex;
          justify-content: center;
          gap: 24px;
          margin-bottom: 24px;
          padding: 16px;
          background: white;
          border-radius: 12px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.04);
        }

        .status-item {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 14px;
          font-weight: 500;
        }

        .status-dot {
          width: 12px;
          height: 12px;
          border-radius: 50%;
        }

        .status-dot.available {
          background: #4CAF50;
        }

        .status-dot.occupied {
          background: #F44336;
        }

        .table-grid {
          background: white;
          border-radius: 12px;
          padding: 24px;
          margin-bottom: 20px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.04);
        }

        .table-row {
          display: flex;
          justify-content: space-between;
          margin-bottom: 16px;
          gap: 8px;
        }

        .table-row:last-child {
          margin-bottom: 0;
        }

        .table-slot {
          flex: 1;
          height: 80px;
          border-radius: 8px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.2s;
          border: 2px solid transparent;
        }

        .table-slot.empty {
          background: #f5f5f5;
          cursor: default;
        }

        .table-slot.available {
          background: #E8F5E8;
          border-color: #4CAF50;
        }

        .table-slot.occupied {
          background: #FFEBEE;
          border-color: #F44336;
        }

        .table-slot:not(.empty):hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0,0,0,0.1);
        }

        .table-slot.selected {
          border-color: #297efc;
          box-shadow: 0 0 0 2px rgba(41, 126, 252, 0.2);
        }

        .table-number {
          font-size: 16px;
          font-weight: 700;
          color: #333;
        }

        .table-name {
          font-size: 12px;
          color: #666;
          margin: 2px 0;
        }

        .table-seats {
          font-size: 11px;
          color: #888;
        }

        .table-info-panel {
          background: white;
          border-radius: 12px;
          padding: 20px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.04);
        }

        .table-info-panel h3 {
          margin: 0 0 12px 0;
          font-size: 16px;
          font-weight: 600;
          color: #333;
        }

        #selectedTableInfo {
          font-size: 14px;
          color: #666;
          line-height: 1.5;
        }
      </style>
    `;

    // 테이블 클릭 이벤트
    document.querySelectorAll('.table-slot:not(.empty)').forEach(slot => {
      slot.addEventListener('click', () => {
        // 이전 선택 제거
        document.querySelectorAll('.table-slot').forEach(s => s.classList.remove('selected'));
        // 현재 선택 추가
        slot.classList.add('selected');

        const tableId = slot.dataset.tableId;
        const table = tables.find(t => t.id == tableId);

        if (table) {
          const selectedTableInfo = document.getElementById('selectedTableInfo');
          const occupiedText = table.isOccupied 
            ? `<span style="color: #F44336;">사용중</span> (${new Date(table.occupiedSince).toLocaleString()}부터)`
            : `<span style="color: #4CAF50;">빈 테이블</span>`;

          selectedTableInfo.innerHTML = `
            <strong>${table.tableName}</strong><br>
            테이블 번호: ${table.tableNumber}번<br>
            좌석 수: ${table.seats}석<br>
            상태: ${occupiedText}
          `;
        }
      });
    });

  } catch (error) {
    console.error('테이블 배치도 로딩 실패:', error);
    alert('테이블 정보를 불러올 수 없습니다.');
  }
}

window.renderStore = renderStore;
window.renderTableLayout = renderTableLayout;