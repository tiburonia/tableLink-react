async function renderMap() {
  const main = document.getElementById('main');

  // MapPanelUI 의존성 체크
  if (!window.MapPanelUI || typeof window.MapPanelUI.renderPanelHTML !== 'function') {
    console.error('❌ MapPanelUI가 로드되지 않았습니다. 필수 스크립트를 확인하세요.');
    main.innerHTML = `
      <div style="padding: 20px; text-align: center; color: red;">
        <h2>🚫 지도 로딩 실패</h2>
        <p>MapPanelUI 모듈을 찾을 수 없습니다.</p>
        <button onclick="location.reload()">다시 시도</button>
      </div>
    `;
    return;
  }

  // UI 먼저 렌더링
  main.innerHTML = `
    <main id="content">
      <div id="map" style="width: 100%; height: 100%; min-height: 100vh;"></div>
      <div id="searchBar">
        <div class="search-container">
          <input id="searchInput" type="text" placeholder="매장명 또는 카테고리 검색...">
          <button id="searchBtn">🔍</button>
          <button id="refreshBtn" title="매장 정보 새로고침">🔄</button>
          <button id="clearBtn">✕</button>
        </div>
        <div id="searchResults" class="search-results hidden"></div>
      </div>
      ${window.MapPanelUI.renderPanelHTML()}
    </main>

    <nav id="bottomBar">
      <button id="TLL" title="QR 주문">
        <span style="font-size: 22px;">📱</span>
      </button>
      <button id="renderMapBtn" class="active" title="지도">
        <span style="font-size: 22px;">🗺️</span>
      </button>
      <button id="notificationBtn" title="알림">
        <span style="font-size: 22px;">🔔</span>
      </button>
      <button onclick="renderMyPage()" title="마이페이지">
        <span style="font-size: 22px;">👤</span>
      </button>
    </nav>

    ${window.MapPanelUI.getPanelStyles()}
   <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap');

    html, body {
  margin: 0;
  padding: 0;
  height: 100%;
  font-family: 'Inter', 'Noto Sans KR', -apple-system, BlinkMacSystemFont, sans-serif;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  overflow: hidden;
  font-feature-settings: 'liga' 1, 'kern' 1;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

/* 검색바 - 지도 위 오버레이 */
#searchBar {
  position: absolute;
  top: 24px;
  left: 20px;
  right: 20px;
  z-index: 1002;
  pointer-events: auto;
  animation: slideDown 0.6s cubic-bezier(0.16, 1, 0.3, 1);
}

@keyframes slideDown {
  from {
    opacity: 0;
    transform: translateY(-20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.search-container {
  display: flex;
  align-items: center;
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.95), rgba(255, 255, 255, 0.85));
  border-radius: 32px;
  padding: 12px 20px;
  box-shadow:
    0 20px 60px rgba(0, 0, 0, 0.1),
    0 8px 24px rgba(41, 126, 252, 0.08),
    0 2px 8px rgba(0, 0, 0, 0.04),
    inset 0 1px 0 rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(24px) saturate(180%);
  border: 2px solid rgba(255, 255, 255, 0.6);
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  overflow: hidden;
}

.search-container::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.4), transparent);
  transition: left 0.6s ease;
}

.search-container:hover::before {
  left: 100%;
}

.search-container:hover {
  transform: translateY(-2px);
  box-shadow:
    0 32px 80px rgba(0, 0, 0, 0.15),
    0 12px 32px rgba(41, 126, 252, 0.12),
    0 4px 16px rgba(0, 0, 0, 0.08),
    inset 0 1px 0 rgba(255, 255, 255, 1);
  border-color: rgba(41, 126, 252, 0.3);
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.98), rgba(255, 255, 255, 0.9));
}

#searchInput {
  flex: 1;
  border: none;
  outline: none;
  background: transparent;
  font-size: 16px;
  color: #1f2937;
  padding: 12px 16px;
  font-weight: 500;
  font-family: inherit;
  letter-spacing: -0.01em;
}

#searchInput::placeholder {
  color: #9ca3af;
  font-weight: 400;
  opacity: 0.8;
}

#searchInput:focus::placeholder {
  opacity: 0.6;
  transform: translateX(4px);
  transition: all 0.3s ease;
}

#searchBtn, #refreshBtn, #clearBtn {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border: none;
  font-size: 18px;
  cursor: pointer;
  padding: 10px;
  border-radius: 50%;
  width: 44px;
  height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  color: white;
  position: relative;
  overflow: hidden;
  box-shadow: 0 4px 16px rgba(102, 126, 234, 0.3);
}

#searchBtn::before, #refreshBtn::before, #clearBtn::before {
  content: '';
  position: absolute;
  top: 50%;
  left: 50%;
  width: 0;
  height: 0;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 50%;
  transition: all 0.4s ease;
  transform: translate(-50%, -50%);
}

#searchBtn:hover {
  background: linear-gradient(135deg, #5b73e8 0%, #6b46c1 100%);
  transform: scale(1.1) translateY(-2px);
  box-shadow: 0 12px 32px rgba(91, 115, 232, 0.4);
}

#searchBtn:hover::before {
  width: 100%;
  height: 100%;
}

#refreshBtn {
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
  box-shadow: 0 4px 16px rgba(16, 185, 129, 0.3);
}

#refreshBtn:hover {
  background: linear-gradient(135deg, #0d9488 0%, #047857 100%);
  transform: scale(1.1) translateY(-2px) rotate(180deg);
  box-shadow: 0 12px 32px rgba(13, 148, 136, 0.4);
}

#refreshBtn:hover::before {
  width: 100%;
  height: 100%;
}

#clearBtn {
  background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
  box-shadow: 0 4px 16px rgba(239, 68, 68, 0.3);
}

#clearBtn:hover {
  background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%);
  transform: scale(1.1) translateY(-2px);
  box-shadow: 0 12px 32px rgba(220, 38, 38, 0.4);
}

#clearBtn:hover::before {
  width: 100%;
  height: 100%;
}

#clearBtn {
  font-size: 16px;
  margin-left: 4px;
}

.search-results {
  position: absolute;
  top: 100%;
  left: 0;
  width: 100%;
  max-height: 400px;
  overflow-y: auto;
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.95), rgba(248, 250, 252, 0.9));
  border-radius: 0 0 24px 24px;
  box-shadow:
    0 20px 60px rgba(0, 0, 0, 0.15),
    0 12px 32px rgba(102, 126, 234, 0.1),
    0 4px 16px rgba(0, 0, 0, 0.06),
    inset 0 1px 0 rgba(255, 255, 255, 0.8);
  backdrop-filter: blur(24px) saturate(180%);
  margin-top: 8px;
  border: 2px solid rgba(255, 255, 255, 0.6);
  border-top: none;
  z-index: 3000;
  animation: slideDownResult 0.4s cubic-bezier(0.4, 0, 0.2, 1);
}

@keyframes slideDownResult {
  from {
    opacity: 0;
    transform: translateY(-10px) scale(0.98);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

.search-results::-webkit-scrollbar {
  width: 6px;
}

.search-results::-webkit-scrollbar-track {
  background: rgba(0, 0, 0, 0.02);
  border-radius: 3px;
}

.search-results::-webkit-scrollbar-thumb {
  background: linear-gradient(135deg, rgba(102, 126, 234, 0.3), rgba(118, 75, 162, 0.3));
  border-radius: 3px;
  transition: background 0.3s ease;
}

.search-results::-webkit-scrollbar-thumb:hover {
  background: linear-gradient(135deg, rgba(102, 126, 234, 0.5), rgba(118, 75, 162, 0.5));
}

.search-results.hidden {
  display: none;
}

.search-result-item {
  padding: 14px 18px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.04);
  cursor: pointer;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
}

.search-result-item::before {
  content: '';
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 3px;
  background: linear-gradient(135deg, #297efc, #4f46e5);
  opacity: 0;
  transition: opacity 0.2s ease;
}

.search-result-item:hover {
  background: linear-gradient(135deg, rgba(41, 126, 252, 0.08), rgba(79, 70, 229, 0.05));
  transform: translateX(4px);
}

.search-result-item:hover::before {
  opacity: 1;
}

.search-result-item:last-child {
  border-bottom: none;
  border-radius: 0 0 20px 20px;
}

.result-name {
  font-weight: 700;
  color: #1f2937;
  margin-bottom: 6px;
  font-size: 15px;
}

.result-info {
  font-size: 13px;
  color: #6b7280;
  font-weight: 500;
}

/* 콘텐츠 전체 */
#content {
  position: fixed;
  top: 0;
  bottom: 84px;
  left: 0;
  width: 100%;
  max-width: 430px;
  height: calc(100vh - 84px);
  overflow: hidden;
  background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
  z-index: 1;
  border-radius: 0 0 24px 24px;
  box-shadow: 
    0 10px 40px rgba(0, 0, 0, 0.1),
    inset 0 1px 0 rgba(255, 255, 255, 0.6);
}

/* 지도 */
#map {
  width: 100%;
  height: 100%;
  position: relative;
  z-index: 0;
  overflow: hidden;
  border-radius: 0 0 24px 24px;
  box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.1);
}

/* 바텀바 */
#bottomBar {
  position: fixed;
  bottom: 0;
  left: 50%;
  transform: translateX(-50%);
  width: 100%;
  max-width: 430px;
  height: 88px;
  background: linear-gradient(145deg, rgba(255,255,255,0.95), rgba(248,250,252,0.9));
  border-top: 2px solid rgba(255,255,255,0.6);
  box-shadow:
    0 -20px 60px rgba(0, 0, 0, 0.1),
    0 -8px 32px rgba(41, 126, 252, 0.06),
    0 -4px 16px rgba(0, 0, 0, 0.04),
    inset 0 2px 0 rgba(255, 255, 255, 0.8);
  display: flex;
  justify-content: space-around;
  align-items: center;
  z-index: 1001;
  padding: 12px 20px 16px 20px;
  box-sizing: border-box;
  border-radius: 32px 32px 0 0;
  backdrop-filter: blur(24px) saturate(180%);
  gap: 12px;
  animation: slideUp 0.6s cubic-bezier(0.16, 1, 0.3, 1);
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateX(-50%) translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateX(-50%) translateY(0);
  }
}

#bottomBar button {
  position: relative;
  flex: 1;
  height: 56px;
  min-width: 0;
  border: none;
  outline: none;
  border-radius: 20px;
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.8) 0%, rgba(248, 250, 252, 0.6) 100%);
  color: #64748b;
  font-size: 22px;
  font-family: inherit;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  border: 2px solid rgba(255, 255, 255, 0.6);
  box-shadow: 
    0 4px 16px rgba(0, 0, 0, 0.04),
    inset 0 1px 0 rgba(255, 255, 255, 0.8);
}

#bottomBar button::before {
  content: '';
  position: absolute;
  top: 50%;
  left: 50%;
  width: 0;
  height: 0;
  background: radial-gradient(circle, rgba(102, 126, 234, 0.2) 0%, transparent 70%);
  border-radius: 50%;
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  transform: translate(-50%, -50%);
}

#bottomBar button:hover {
  transform: translateY(-4px) scale(1.05);
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(248, 250, 252, 0.8) 100%);
  color: #667eea;
  box-shadow:
    0 12px 40px rgba(102, 126, 234, 0.2),
    0 6px 20px rgba(0, 0, 0, 0.08),
    inset 0 1px 0 rgba(255, 255, 255, 1);
  border-color: rgba(102, 126, 234, 0.3);
}

#bottomBar button:hover::before {
  width: 100%;
  height: 100%;
  opacity: 1;
}

#bottomBar button:active {
  transform: translateY(-2px) scale(1.02);
  background: linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.05) 100%);
  color: #5b73e8;
  box-shadow:
    0 8px 24px rgba(102, 126, 234, 0.15),
    inset 0 2px 8px rgba(102, 126, 234, 0.1);
}

/* 현재 활성 페이지 표시 */
#bottomBar button.active {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  transform: translateY(-3px) scale(1.03);
  box-shadow:
    0 12px 40px rgba(102, 126, 234, 0.4),
    0 6px 20px rgba(118, 75, 162, 0.3),
    inset 0 1px 0 rgba(255, 255, 255, 0.2);
  border-color: rgba(255, 255, 255, 0.3);
}

#bottomBar button.active::before {
  width: 100%;
  height: 100%;
  background: radial-gradient(circle, rgba(255, 255, 255, 0.3) 0%, transparent 70%);
  opacity: 1;
}

/* 버튼별 고유 색상 */
#bottomBar button#TLL:hover {
  color: #059669;
  border-color: rgba(5, 150, 105, 0.2);
}

#bottomBar button#renderMapBtn:hover,
#bottomBar button#renderMapBtn.active {
  color: #dc2626;
  border-color: rgba(220, 38, 38, 0.2);
}

#bottomBar button#renderMapBtn.active {
  background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%);
  color: white;
}

#bottomBar button#notificationBtn:hover {
  color: #d97706;
  border-color: rgba(217, 119, 6, 0.2);
}

#bottomBar button[onclick*="renderMyPage"]:hover {
  color: #7c3aed;
  border-color: rgba(124, 58, 237, 0.2);
}

/* 위치 정보 표시 */
#locationInfo {
  position: absolute;
  top: 100px;
  left: 24px;
  z-index: 1000;
  pointer-events: none;
  animation: fadeInUp 0.8s cubic-bezier(0.16, 1, 0.3, 1) 0.3s both;
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.location-container {
  background: linear-gradient(135deg, rgba(102, 126, 234, 0.9), rgba(118, 75, 162, 0.85));
  color: white;
  border-radius: 16px;
  padding: 8px 12px;
  text-align: left;
  box-shadow: 
    0 8px 32px rgba(102, 126, 234, 0.3),
    0 4px 16px rgba(0, 0, 0, 0.1),
    inset 0 1px 0 rgba(255, 255, 255, 0.2);
  backdrop-filter: blur(16px) saturate(180%);
  border: 1px solid rgba(255, 255, 255, 0.3);
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  font-size: 12px;
  font-weight: 600;
  min-width: 100px;
  max-width: 140px;
  letter-spacing: -0.01em;
}

.location-container:hover {
  background: linear-gradient(135deg, rgba(41, 126, 252, 1), rgba(79, 70, 229, 0.95));
  box-shadow: 0 3px 12px rgba(41, 126, 252, 0.3);
  transform: translateY(-1px);
}

#locationText {
  display: flex;
  align-items: center;
  gap: 2px;
  line-height: 1.2;
}

/* 버튼별 고유 색상 */
  </style>

  `;

  // 지도 즉시 생성
  const container = document.getElementById('map');
  const options = {
    center: new kakao.maps.LatLng(37.5665, 126.9780),
    level: 3,
    maxLevel: 12  // 최대 줌 레벨을 12로 제한
  };

  const map = new kakao.maps.Map(container, options);

  // 지도 인스턴스를 전역 변수로 저장
  window.currentMap = map;

  // 마커 관리용 전역 변수 초기화 (DOM 재생성 시 기존 참조 무효화)
  window.currentMarkers = [];
  window.markerMap = new Map();

  // MapMarkerManager 상태 완전 초기화
  if (window.MapMarkerManager && typeof window.MapMarkerManager.reset === 'function') {
    window.MapMarkerManager.reset();
  } else {
    console.warn('⚠️ MapMarkerManager 또는 reset 메서드를 찾을 수 없음');
  }

  console.log('🔄 지도 재진입 - 마커 상태 완전 초기화');
  console.log('🗺️ 지도 렌더링 완료');

  // 지도 레벨 및 뷰포트 변경 이벤트
  kakao.maps.event.addListener(map, 'zoom_changed', () => {
    const level = map.getLevel();
    console.log('🔍 지도 레벨 변경됨:', level);

    // MapMarkerManager를 통한 뷰포트 기반 마커 관리
    if (window.MapMarkerManager) {
      window.MapMarkerManager.handleMapLevelChange(level, map);
    } else {
      console.error('❌ MapMarkerManager가 로드되지 않음');
    }
  });

  // 지도 이동 완료 이벤트
  kakao.maps.event.addListener(map, 'dragend', () => {
    const level = map.getLevel();
    console.log('🗺️ 지도 이동 완료 - 레벨:', level);

    // MapMarkerManager를 통한 뷰포트 기반 마커 관리
    if (window.MapMarkerManager) {
      window.MapMarkerManager.handleMapLevelChange(level, map);
    }
  });

  // 초기 마커 로딩 (충분한 딜레이로 안정성 확보)
  setTimeout(() => {
    if (!window.currentMap) {
      console.error('❌ 지도 인스턴스가 사라짐 - 초기 마커 로딩 취소');
      return;
    }

    const level = map.getLevel();
    console.log('🆕 초기 마커 로딩 시작 - 레벨:', level);

    if (window.MapMarkerManager && typeof window.MapMarkerManager.handleMapLevelChange === 'function') {
      window.MapMarkerManager.handleMapLevelChange(level, map);
    } else {
      console.error('❌ MapMarkerManager가 준비되지 않음');
    }
  }, 500);

  // DOM 준비 확인 및 UI 초기화
  setTimeout(() => {
    if (window.MapPanelUI && typeof window.MapPanelUI.initializeFiltering === 'function') {
      window.MapPanelUI.initializeFiltering();
    }
    if (window.MapPanelUI && typeof window.MapPanelUI.setupPanelDrag === 'function') {
      window.MapPanelUI.setupPanelDrag();
    }
    // 지도와 패널 연동
    if (window.MapPanelUI && typeof window.MapPanelUI.connectToMap === 'function') {
      window.MapPanelUI.connectToMap(map);
    }
  }, 200);

  // TLL 버튼 클릭 로직
  const renderTLL = document.querySelector('#TLL')
  renderTLL.addEventListener('click', async () => {
    await TLL();
  })

  // 알림 버튼 클릭 로직
  const notificationBtn = document.querySelector('#notificationBtn');
  notificationBtn.addEventListener('click', () => {
    if (typeof renderNotification === 'function') {
      renderNotification();
    } else {
      console.warn('⚠️ renderNotification 함수를 찾을 수 없습니다');
    }
  });

  // 검색 기능 구현
  const searchInput = document.getElementById('searchInput');
  const searchBtn = document.getElementById('searchBtn');
  const clearBtn = document.getElementById('clearBtn');
  const searchResults = document.getElementById('searchResults');

  let searchTimeout;

  // 검색 함수
  async function performSearch(keyword) {
    if (!keyword.trim()) {
      searchResults.classList.add('hidden');
      return;
    }

    try {
      const response = await fetch('/api/stores/search?query=' + encodeURIComponent(keyword));
      const data = await response.json();
      const stores = data.stores || [];

      displaySearchResults(stores);
    } catch (error) {
      console.error('검색 실패:', error);
      searchResults.innerHTML = '<div class="search-result-item">검색 중 오류가 발생했습니다.</div>';
      searchResults.classList.remove('hidden');
    }
  }

  // 검색 결과 표시
  function displaySearchResults(results) {
    // 현재 위치 UI 숨기기 (검색 결과가 표시될 때)
    const locationInfo = document.getElementById('locationInfo');
    if (locationInfo) {
      locationInfo.style.display = 'none';
    }

    if (results.length === 0) {
      searchResults.innerHTML = '<div class="search-result-item">검색 결과가 없습니다.</div>';
    } else {
      searchResults.innerHTML = results.slice(0, 10).map(store => `
        <div class="search-result-item" data-store-id="${store.id}">
          <div class="result-name">${store.name}</div>
          <div class="result-info">${store.category} • ${store.address || '주소 정보 없음'} • ${store.isOpen ? '운영중' : '운영중지'} • ★${store.ratingAverage || '0.0'}</div>
        </div>
      `).join('');

      // 검색 결과 클릭 이벤트
      searchResults.querySelectorAll('.search-result-item').forEach(item => {
        item.addEventListener('click', () => {
          const storeId = parseInt(item.dataset.storeId);
          const store = results.find(s => s.id === storeId);
          if (store) {
            // 지도 중심을 해당 매장으로 이동
            if (store.coord && store.coord.lat && store.coord.lng) {
              const position = new kakao.maps.LatLng(store.coord.lat, store.coord.lng);
              map.setCenter(position);
              map.setLevel(2);
            }

            // 검색 결과 숨기기 및 입력창 업데이트
            hideSearchResults();
            searchInput.value = store.name;

            console.log(`📍 ${store.name} 위치로 지도 이동 완료`);
          }
        });
      });
    }

    searchResults.classList.remove('hidden');
  }

  // 검색 결과 숨기기 함수
  function hideSearchResults() {
    searchResults.classList.add('hidden');
    
    // 현재 위치 UI 다시 보이기
    const locationInfo = document.getElementById('locationInfo');
    if (locationInfo) {
      locationInfo.style.display = 'block';
    }
  }

  // 입력 이벤트 (실시간 검색)
  searchInput.addEventListener('input', (e) => {
    clearTimeout(searchTimeout);
    const keyword = e.target.value.trim();

    if (keyword) {
      clearBtn.style.display = 'flex';
      searchTimeout = setTimeout(() => performSearch(keyword), 300);
    } else {
      clearBtn.style.display = 'none';
      hideSearchResults();
    }
  });

  // 검색 버튼 클릭 - renderSearch로 이동
  searchBtn.addEventListener('click', () => {
    const query = searchInput.value.trim();
    if (typeof renderSearch === 'function') {
      renderSearch(query);
    } else {
      console.warn('⚠️ renderSearch 함수를 찾을 수 없습니다');
    }
  });

  // 새로고침 버튼 클릭
  const refreshBtn = document.getElementById('refreshBtn');
  refreshBtn.addEventListener('click', async () => {
    console.log('🔄 수동 새로고침 버튼 클릭됨 - 뷰포트 기반 새로 로딩');

    refreshBtn.style.transform = 'scale(1.05) rotate(360deg)';
    refreshBtn.style.pointerEvents = 'none';

    try {
      // 기존 마커 모두 제거
      if (window.MapMarkerManager) {
        window.MapMarkerManager.clearAllMarkers();
      }

      // 현재 레벨에서 뷰포트 기반 새로고침
      const level = map.getLevel();
      if (window.MapMarkerManager) {
        await window.MapMarkerManager.handleMapLevelChange(level, map);
      }

      // 패널도 함께 새로고침
      if (window.MapPanelUI && typeof window.MapPanelUI.refresh === 'function') {
        await window.MapPanelUI.refresh();
      }

      console.log('✅ 수동 새로고침 완료');
    } catch (error) {
      console.error('❌ 수동 새로고침 실패:', error);
    } finally {
      setTimeout(() => {
        refreshBtn.style.transform = '';
        refreshBtn.style.pointerEvents = '';
      }, 500);
    }
  });

  // Enter 키 검색
  searchInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      performSearch(searchInput.value.trim());
    }
  });

  // 초기화 버튼
  clearBtn.addEventListener('click', () => {
    searchInput.value = '';
    hideSearchResults();
    clearBtn.style.display = 'none';
    searchInput.focus();
  });

  // 검색 결과 외부 클릭시 숨기기
  document.addEventListener('click', (e) => {
    if (!searchInput.contains(e.target) && !searchResults.contains(e.target) && !searchBtn.contains(e.target)) {
      hideSearchResults();
    }
  });

  // 초기 상태에서 초기화 버튼 숨기기
  clearBtn.style.display = 'none';

  // 바텀바 지도 버튼 클릭시
  const renderMapBtn = document.getElementById('renderMapBtn');
  renderMapBtn.addEventListener('click', () => {
    if (typeof renderMap === 'function') {
      renderMap();
    } else {
      location.reload();
    }
  });

  // 지도 이동 또는 확대/축소 시 현재 위치 정보를 업데이트하는 로직 추가
  const updateLocationInfo = async () => {
    const center = map.getCenter();
    const lat = center.getLat();
    const lng = center.getLng();

    try {
      // 서버를 통해 카카오 API 호출 (API 키 보안)
      const response = await fetch(`/api/stores/get-location-info?lat=${lat}&lng=${lng}`);
      const data = await response.json();

      if (data.success && data.eupmyeondong) {
        const locationTextElement = document.getElementById('locationText');
        if (locationTextElement) {
          locationTextElement.innerHTML = `📍 ${data.eupmyeondong}`;
        }
      }
    } catch (error) {
      console.error('현재 위치 정보 로딩 실패:', error);
      const locationTextElement = document.getElementById('locationText');
      if (locationTextElement) {
        locationTextElement.innerHTML = '📍 위치 정보 없음';
      }
    }
  };

  // 위치 정보 UI 생성
  const locationInfoDiv = document.createElement('div');
  locationInfoDiv.id = 'locationInfo';
  locationInfoDiv.innerHTML = `
    <div class="location-container">
      <div id="locationText">⏳ 로딩 중...</div>
    </div>
  `;
  main.appendChild(locationInfoDiv);

  // 초기 위치 정보 로드
  updateLocationInfo();

  // 지도 이동 또는 확대/축소 시 위치 정보 업데이트
  kakao.maps.event.addListener(map, 'idle', updateLocationInfo); // 'idle' 이벤트는 지도 이동/확대/축소 완료 시 발생


  // 개별 매장 별점 정보 조회 (MapMarkerManager에서 사용)
  async function loadStoreRatingAsync(storeId) {
    try {
      const response = await fetch(`/api/stores/${storeId}/rating`);

      if (!response.ok) {
        console.warn(`⚠️ 매장 ${storeId} 별점 정보 조회 실패: ${response.status}`);
        return { ratingAverage: 0.0, reviewCount: 0 };
      }

      const data = await response.json();
      return {
        ratingAverage: data.ratingAverage || 0.0,
        reviewCount: data.reviewCount || 0
      };
    } catch (error) {
      console.error(`❌ 매장 ${storeId} 별점 정보 로딩 실패:`, error);
      return { ratingAverage: 0.0, reviewCount: 0 };
    }
  }

  // 전역 함수로 설정
  window.loadStoreRatingAsync = loadStoreRatingAsync;
}