function renderStore(store) {
  main.innerHTML = `
    <button id="backBtn" class="header-btn" onclick="renderMap().catch(console.error)" aria-label="뒤로가기">
      <span class="header-btn-ico">⬅️</span>
    </button>
    <button id="TLL" class="header-btn" aria-label="QR결제" onclick="TLL()">
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
              <span id="reviewScore">4.5&nbsp<span id="reviewLink">></span></span> 
              <button id="favoriteBtn">♡</button>
            </div>
            <h2 id="storeName">${store.name}</h2>
            <p class="store-desc">여기에 간단한 가게 소개 또는 태그</p>
          </div>
          <div id="TLR" class="storeInfo" style="margin-bottom: 12px;">
            <div class="tlr-title">리뷰/리텐션 (TLR)</div>
            <div class="tlr-desc">구상중</div>
          </div>
          <div id="reviewPreview" class="review-preview">
            <div class="review-title-row">
              <span class="review-title">리뷰 미리보기</span>
              <button class="see-more-btn">전체보기</button>
            </div>
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

      #TLR .tlr-title {
        font-size: 16px;
        font-weight: 600;
        color: #555;
        margin-bottom: 6px;
      }
      #TLR .tlr-desc {
        font-size: 15px;
        color: #888;
        font-style: italic;
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

}
