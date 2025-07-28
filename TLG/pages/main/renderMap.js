async function renderMap() {
  const main = document.getElementById('main');

  // UI 먼저 렌더링
  main.innerHTML = `
    <main id="content">
      <div id="map" style="width: 100%; height: 100%; min-height: 100vh;"></div>
      ${window.MapPanelUI.renderPanelHTML()}
    </main>

    <nav id="bottomBar">
      <button id= "TLL">📱</button>
      <button onclick="renderSearch()">🔍</button>
      <button>🗺️</button>
      <button onclick="renderMyPage()">👤</button>
      <button onclick="logOutF()">👋</button>
    </nav>

    ${window.MapPanelUI.getPanelStyles()}
   <style>  
    html, body {
  margin: 0;
  padding: 0;
  height: 100%;
  font-family: 'Noto Sans KR', sans-serif;
  background: #f8f8f8;
  overflow: hidden;
}

/* 콘텐츠 전체 */
#content {
  position: fixed;
  top: 0;
  bottom: 84px;   /* 바텀바 높이 + 둥근 모서리 여백 */
  left: 0;
  width: 100%;
  max-width: 430px;
  height: calc(100vh - 84px);
  overflow: hidden;
  background: #fdfdfd;
  z-index: 1;
}

/* 지도 */
#map {
  width: 100%;
  height: 100%;
  position: relative;
  z-index: 0;
  overflow: hidden;
  border-radius: 0 0 18px 18px;
}

/* 바텀바 */
#bottomBar {
  position: fixed;
  bottom: 0;
  left: 50%;
  transform: translateX(-50%);
  width: 100%;
  max-width: 430px;
  height: 66px;
  background: rgba(255,255,255,0.98);
  border-top: 1.5px solid #e2e6ee;
  box-shadow: 0 -2px 16px 2px rgba(20,40,90,0.07), 0 -1.5px 6px rgba(70,110,180,0.06);
  display: flex;
  justify-content: space-between;
  align-items: center;
  z-index: 1001;
  padding: 0 12px;
  box-sizing: border-box;
  border-bottom-left-radius: 18px;
  border-bottom-right-radius: 18px;
  backdrop-filter: blur(5px);
  gap: 0;
}

#bottomBar button {
  flex: 1 1 0;
  margin: 0 5px;
  height: 44px;
  min-width: 0;
  border: none;
  outline: none;
  border-radius: 13px;
  background: #f5f7fb;
  color: #297efc;
  font-size: 18px;
  font-family: inherit;
  font-weight: 700;
  box-shadow: 0 2px 8px rgba(40,110,255,0.06);
  cursor: pointer;
  transition: background 0.13s, color 0.12s, box-shadow 0.13s;
  display: flex;
  align-items: center;
  justify-content: center;
  letter-spacing: -0.2px;
}
#bottomBar button:active {
  background: #eaf3ff;
  color: #1657a0;
  box-shadow: 0 2px 16px rgba(34,153,252,0.13);
}

  </style>

  `;

  // 지도 즉시 생성 (UI 렉 방지)
  const container = document.getElementById('map');
  const options = {
    center: new kakao.maps.LatLng(37.5665, 126.9780),
    level: 3
  };

  const map = new kakao.maps.Map(container, options);

  // 비동기로 매장 데이터 로딩 및 마커 표시
  loadStoresAndMarkers(map);

  // 패널 핸들 클릭 시 열기/닫기
  const panel = document.getElementById('storePanel');
  let startY = 0;
  let currentY = 0;
  let isDragging = false;

  // 공통 드래그 로직
  function startDrag(y) {
    startY = y;
    isDragging = true;
    panel.style.transition = 'none';
  }

  //TLL 버튼 클릭 로직
  const renderTLL = document.querySelector('#TLL')
  renderTLL.addEventListener('click', async () => {
    await TLL();
  })

  function duringDrag(y) {
    if (!isDragging) return;
    currentY = y;
    const delta = startY - currentY;
    const baseHeight = panel.classList.contains('expanded') ? 550 : 60;
    let newHeight = baseHeight + delta;
    newHeight = Math.min(550, Math.max(60, newHeight));
    panel.style.height = `${newHeight}px`;
  }

  function endDrag() {
    isDragging = false;
    const delta = startY - currentY;

    if (delta > 50) {
      panel.classList.add('expanded');
      panel.classList.remove('collapsed');
      panel.style.height = '630px';
    } else if (delta < -50) {
      panel.classList.add('collapsed');
      panel.classList.remove('expanded');
      panel.style.height = '60px';
    } else {
      const target = panel.classList.contains('expanded') ? '630px' : '60px';
      panel.style.height = target;
    }

    panel.style.transition = 'height 0.3s ease';
  }

  // 📱 터치 이벤트
  panel.addEventListener('touchstart', e => startDrag(e.touches[0].clientY));
  panel.addEventListener('touchmove', e => duringDrag(e.touches[0].clientY));
  panel.addEventListener('touchend', endDrag);

  // 🖱️ 마우스 이벤트
  panel.addEventListener('mousedown', e => startDrag(e.clientY));
  document.addEventListener('mousemove', e => duringDrag(e.clientY));
  document.addEventListener('mouseup', endDrag);

  // 주기적으로 매장 상태 업데이트 (30초마다)
  const updateInterval = setInterval(() => {
    console.log('🔄 지도: 매장 상태 주기적 업데이트 시작');
    loadStoresAndMarkers(map);
  }, 30000);

  // 페이지 떠날 때 인터벌 정리
  window.addEventListener('beforeunload', () => {
    clearInterval(updateInterval);
  });

  }

// 매장 별점 정보 비동기 로딩 함수
async function loadStoreRatingAsync(storeId) {
  try {
    // 1. 먼저 캐시에서 확인
    if (typeof window.cacheManager !== 'undefined') {
      const cachedRating = window.cacheManager.getStoreRating(storeId);
      if (cachedRating) {
        console.log(`⭐ 지도: 캐시된 매장 ${storeId} 별점 정보 사용: ${cachedRating.ratingAverage}점`);
        return cachedRating;
      }
    }

    // 2. 캐시에 없으면 서버에서 가져오기
    console.log(`🔄 지도: 매장 ${storeId} 별점 정보 서버에서 가져오는 중...`);
    const response = await fetch(`/api/stores/${storeId}/rating`);

    if (!response.ok) {
      console.warn(`⚠️ 매장 ${storeId} 별점 정보 조회 실패: ${response.status}`);
      return { ratingAverage: 0.0, reviewCount: 0 };
    }

    const data = await response.json();
    const ratingData = {
      ratingAverage: data.ratingAverage || 0.0,
      reviewCount: data.reviewCount || 0
    };

    // 3. 캐시에 저장
    if (typeof window.cacheManager !== 'undefined') {
      window.cacheManager.setStoreRating(storeId, ratingData);
      console.log(`✅ 지도: 매장 ${storeId} 별점 정보 캐시 저장: ${ratingData.ratingAverage}점`);
    }

    return ratingData;
  } catch (error) {
    console.error(`❌ 지도: 매장 ${storeId} 별점 정보 로딩 실패:`, error);
    return { ratingAverage: 0.0, reviewCount: 0 };
  }
}

// 비동기로 매장 데이터를 로딩하고 마커를 표시하는 함수
async function loadStoresAndMarkers(map) {
  let stores = [];

  try {
    // 서버에서 직접 최신 매장 정보 가져오기
    console.log('🔄 서버에서 최신 매장 정보 로딩 중...');
    const response = await fetch('/api/stores');
    const data = await response.json();
    
    if (data.success) {
      stores = data.stores;
      console.log('🗺️ 서버에서 매장 데이터 로드 성공:', stores.length, '개 매장');
      
      // 캐시도 업데이트
      if (typeof window.cacheManager !== 'undefined') {
        window.cacheManager.setStores(stores);
        console.log('📁 매장 데이터 캐시 업데이트 완료');
      }
    } else {
      throw new Error(data.error || '매장 데이터를 불러올 수 없습니다');
    }

    // 커스텀 마커 생성 (비동기로 처리하여 UI 블로킹 방지)
    setTimeout(async () => {
      for (const store of stores) {
        await window.MapMarkerManager.createCustomMarker(store, map);
      }
      console.log('🗺️ 커스텀 마커 표시 완료:', stores.length, '개 매장');
    }, 100);

    // 가게 목록 업데이트
    const storeListContainer = document.getElementById('storeListContainer');
    storeListContainer.innerHTML = ''; // 로딩 메시지 제거

    // 매장 목록에서도 별점 정보 비동기 로딩
    for (const store of stores) {
      const card = document.createElement('div');
      card.className = 'storeCard';

      // 별점 정보 비동기 로딩
      const ratingData = await loadStoreRatingAsync(store.id);
      
      // 운영 상태 실시간 확인
      console.log(`🏪 매장 ${store.name} 운영 상태: ${store.isOpen ? '운영중' : '운영중지'}`);
      
      // 카드 HTML 생성
      card.innerHTML = window.MapPanelUI.renderStoreCard(store, ratingData);

      // 카드 클릭 시 해당 가게의 상세 페이지로 이동
      card.addEventListener('click', () => renderStore(store));
      storeListContainer.appendChild(card);
    }

  } catch (error) {
    console.error('스토어 정보 로딩 실패:', error);
    const storeListContainer = document.getElementById('storeListContainer');
    storeListContainer.innerHTML = '<div style="text-align: center; padding: 20px; color: #ff6b6b;">매장 정보를 불러올 수 없습니다.</div>';
  }
}