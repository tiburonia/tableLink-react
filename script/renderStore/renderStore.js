const renderStore = (store) => {
  main.innerHTML = `
  <button id="backBtn" class="header-btn" onclick="renderMap()" aria-label="뒤로가기">
  <span class="header-btn-ico">⬅️</span>
</button>
<button id="TLL" class="header-btn" aria-label="QR결제">
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
            <span id="reviewScore">4.5</span>
            <button id="favoriteBtn" onclick="toggleFavorite('${store.name}')">♡</button>
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
            <button class="see-more-btn" onclick="alert('전체 리뷰 보기!')">더보기</button>
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
        <button class="nav-btn" data-tab="packing">
          <span class="nav-ico">🛍️</span>
          <span class="nav-label">포장</span>
        </button>
        <button class="nav-btn" data-tab="reservation">
          <span class="nav-ico">📅</span>
          <span class="nav-label">예약</span>
        </button>
        <button class="nav-btn" data-tab="review">
          <span class="nav-ico">💬</span>
          <span class="nav-label">리뷰</span>
        </button>
      </div>

      <div id="storeContent">
        <!-- 탭 내용이 여기에 렌더링됨 -->
      </div>
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

#backBtn, #TLL {
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

/* 카드형 UI (가게 정보, TLR, 리뷰 프리뷰 전부) */
.storeInfo,
.review-preview {
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.03);
  padding: 16px 14px 12px 14px;
  margin: 0 0 14px 0;  /* 아래만 마진! 좌우는 0 */
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

/* TLR(리뷰/리텐션) 스타일 */
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

/* 리뷰 미리보기 */
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

/* 네비게이션 바 - no-padding으로 좌우 끝까지 */
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

/* 콘텐츠 영역(탭/페이지 내용) */
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

/* 바텀바 */
#storeBottomBar {
  position: fixed;
  bottom: 0;
  left: 50%;
  transform: translateX(-50%);
  width: 100%;
  max-width: 430px;
  height: 60px;
  background: white;
  border-top: 1px solid #ccc;
  display: flex;
  justify-content: space-around;
  align-items: center;
  z-index: 1000;
}

.header-btn {
  position: absolute;
  top: 18px;
  width: 42px;
  height: 42px;
  border: none;
  border-radius: 50%;
  background: #fff;
  box-shadow: 0 4px 12px rgba(40,110,255,0.09), 0 1.5px 4px rgba(0,0,0,0.04);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 22px;
  color: #297efc;
  cursor: pointer;
  transition: background 0.14s, color 0.13s, box-shadow 0.13s;
  outline: none;
  padding: 0;
  border: 1.2px solid #e8eefe;
}
.header-btn:active {
  background: #eaf3ff;
  color: #297efc;
  box-shadow: 0 4px 16px rgba(60,110,255,0.12);
  border-color: #b7cdfa;
}
#backBtn { left: 22px; }
#TLL { right: 22px; }
.header-btn-ico {
  font-size: 23px;
  line-height: 1;
  pointer-events: none;
  display: block;
  margin-top: 1px;
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

document.querySelector('#TLL').addEventListener('click', () => {
    alert('QR 결제 기능은 아직 준비 중입니다');
  });

  const panel = document.getElementById('storePanel');
  const panelHandle = document.getElementById('panelHandle');
  const storePanelContainer = document.getElementById('storePanelContainer');
  const bottomBar = document.getElementById('storeBottomBar');

  // 메뉴/포장/예약/리뷰 탭 렌더
  function renderStoreTab(tab, store) {
    const content = document.getElementById('storeContent');
    switch (tab) {
      case 'menu': content.innerHTML = renderMenuHTML(store); break;
      case 'packing': content.innerHTML = renderTakeoutHTML(store); break;
      case 'reservation': content.innerHTML = renderReservationHTML(store); break;
      case 'review': content.innerHTML = renderReviewHTML(store); break;
      default: content.innerHTML = '준비 중...';
    }
    setPanelContainerHeight(); // 탭 바꿀 때도 높이 재조정
  }

  // 탭 이벤트 위임
  document.getElementById('storeNavBar').addEventListener('click', function(e) {
    const btn = e.target.closest('.nav-btn');
    if (!btn) return;
    document.querySelectorAll('#storeNavBar .nav-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    renderStoreTab(btn.dataset.tab, store);
  });

  // 초기 메뉴 탭 렌더
  renderStoreTab('menu', store);

  // 패널 드래그(휠) - 상태 바뀔 때마다 높이 재조정
  panel.addEventListener('wheel', e => {
    e.preventDefault();
    if (e.deltaY > 0) {
      panel.classList.remove('collapsed');
      panel.classList.add('expanded');
      panel.style.top = '0px';
    } else if (e.deltaY < 0) {
      panel.classList.remove('expanded');
      panel.classList.add('collapsed');
      panel.style.top = '200px';
    }
    setTimeout(setPanelContainerHeight, 30); // 상태 바뀌면 높이 재조정
  });

  // 브라우저 리사이즈 대응
  window.addEventListener('resize', setPanelContainerHeight);

  // 패널 transition 끝나면 강제 재계산 (애니메이션 느린 브라우저 대응)
  panel.addEventListener('transitionend', setPanelContainerHeight);

  // 실질적 높이 계산 함수 (핵심)
  function setPanelContainerHeight() {
    const vh = window.innerHeight;
    // 패널 top값 (px), bottomBar 높이(실제), 핸들 높이, 패널 padding
    const top = parseInt(window.getComputedStyle(panel).top) || 0;
    const bottomBarHeight = bottomBar ? bottomBar.offsetHeight : 60;
    const handleHeight = panelHandle ? panelHandle.offsetHeight : 0;
    const panelPadding = 24; // 패널 padding (수정 가능)
    // 실제 스크롤 컨테이너 높이 계산
    const height = vh - top - bottomBarHeight - handleHeight - panelPadding;
    storePanelContainer.style.height = height + 'px';
  }

  // 최초 1회 강제 세팅
  setTimeout(setPanelContainerHeight, 0);
};