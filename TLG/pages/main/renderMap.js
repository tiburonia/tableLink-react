
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
    html, body {
  margin: 0;
  padding: 0;
  height: 100%;
  font-family: 'Noto Sans KR', sans-serif;
  background: #f8f8f8;
  overflow: hidden;
}

/* 검색바 - 지도 위 오버레이 */
#searchBar {
  position: absolute;
  top: 20px;
  left: 16px;
  right: 16px;
  z-index: 1002;
  pointer-events: auto;
}

.search-container {
  display: flex;
  align-items: center;
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.98), rgba(248, 250, 252, 0.95));
  border-radius: 28px;
  padding: 10px 16px;
  box-shadow: 
    0 8px 32px rgba(0, 0, 0, 0.08),
    0 4px 16px rgba(41, 126, 252, 0.04),
    inset 0 1px 0 rgba(255, 255, 255, 0.8);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.4);
  transition: all 0.3s ease;
}

.search-container:hover {
  box-shadow: 
    0 12px 40px rgba(0, 0, 0, 0.12),
    0 6px 20px rgba(41, 126, 252, 0.08),
    inset 0 1px 0 rgba(255, 255, 255, 0.9);
  border-color: rgba(41, 126, 252, 0.2);
}

#searchInput {
  flex: 1;
  border: none;
  outline: none;
  background: transparent;
  font-size: 16px;
  color: #1f2937;
  padding: 10px 12px;
  font-weight: 500;
}

#searchInput::placeholder {
  color: #9ca3af;
  font-weight: 400;
}

#searchBtn, #refreshBtn, #clearBtn {
  background: linear-gradient(135deg, #f8f9ff 0%, #f1f5f9 100%);
  border: 1px solid rgba(41, 126, 252, 0.1);
  font-size: 18px;
  cursor: pointer;
  padding: 8px;
  border-radius: 50%;
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  color: #6b7280;
}

#searchBtn:hover {
  background: linear-gradient(135deg, #297efc 0%, #4f46e5 100%);
  color: white;
  transform: scale(1.05);
  box-shadow: 0 4px 12px rgba(41, 126, 252, 0.3);
  border-color: transparent;
}

#refreshBtn:hover {
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
  color: white;
  transform: scale(1.05) rotate(180deg);
  box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
  border-color: transparent;
}

#clearBtn:hover {
  background: linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%);
  color: #dc2626;
  transform: scale(1.05);
  box-shadow: 0 4px 12px rgba(220, 38, 38, 0.2);
  border-color: rgba(220, 38, 38, 0.2);
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
  max-height: 350px;
  overflow-y: auto;
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.98), rgba(248, 250, 252, 0.95));
  border-radius: 0 0 20px 20px;
  box-shadow: 
    0 12px 40px rgba(0, 0, 0, 0.12),
    0 6px 20px rgba(41, 126, 252, 0.08);
  backdrop-filter: blur(20px);
  margin-top: 6px;
  border: 1px solid rgba(255, 255, 255, 0.4);
  border-top: none;
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
  background: linear-gradient(135deg, rgba(41, 126, 252, 0.1), rgba(99, 102, 241, 0.05));
  opacity: 0;
  transition: opacity 0.3s ease;
  border-radius: inherit;
}

#bottomBar button:hover {
  transform: translateY(-2px);
  background: linear-gradient(135deg, #ffffff 0%, #f8faff 100%);
  color: #297efc;
  box-shadow: 
    0 8px 25px rgba(41, 126, 252, 0.15),
    0 3px 10px rgba(0, 0, 0, 0.1);
  border-color: rgba(41, 126, 252, 0.2);
}

#bottomBar button:hover::before {
  opacity: 1;
}

#bottomBar button:active {
  transform: translateY(0);
  background: linear-gradient(135deg, #eef2ff 0%, #e0e7ff 100%);
  color: #1e40af;
  box-shadow: 
    0 4px 15px rgba(41, 126, 252, 0.2),
    inset 0 2px 4px rgba(41, 126, 252, 0.1);
}

/* 현재 활성 페이지 표시 */
#bottomBar button.active {
  background: linear-gradient(135deg, #297efc 0%, #4f46e5 100%);
  color: white;
  transform: translateY(-1px);
  box-shadow: 
    0 6px 20px rgba(41, 126, 252, 0.25),
    0 2px 8px rgba(0, 0, 0, 0.1);
}

#bottomBar button.active::before {
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.2), rgba(255, 255, 255, 0.1));
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

  </style>

  `;

  // 지도 즉시 생성
  const container = document.getElementById('map');
  const options = {
    center: new kakao.maps.LatLng(37.5665, 126.9780),
    level: 3
  };

  const map = new kakao.maps.Map(container, options);

  // 마커 관리용 전역 변수 초기화
  if (!window.currentMarkers) {
    window.currentMarkers = [];
  }
  if (!window.markerMap) {
    window.markerMap = new Map();
  }

  console.log('🗺️ 지도 렌더링 완료');

  // 매장 데이터 로딩 및 마커 생성
  setTimeout(() => {
    loadStoresAndMarkers(map);
  }, 100);

  // DOM 준비 확인 및 UI 초기화
  setTimeout(() => {
    if (window.MapPanelUI && typeof window.MapPanelUI.initializeFiltering === 'function') {
      window.MapPanelUI.initializeFiltering();
    }
    if (window.MapPanelUI && typeof window.MapPanelUI.setupPanelDrag === 'function') {
      window.MapPanelUI.setupPanelDrag();
    }
  }, 200);

  //TLL 버튼 클릭 로직
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
      const response = await fetch('/api/stores');
      const data = await response.json();
      const stores = data.stores || [];

      const results = stores.filter(store =>
        store.name.toLowerCase().includes(keyword.toLowerCase()) ||
        store.category.toLowerCase().includes(keyword.toLowerCase())
      );

      displaySearchResults(results);
    } catch (error) {
      console.error('검색 실패:', error);
      searchResults.innerHTML = '<div class="search-result-item">검색 중 오류가 발생했습니다.</div>';
      searchResults.classList.remove('hidden');
    }
  }

  // 검색 결과 표시
  function displaySearchResults(results) {
    if (results.length === 0) {
      searchResults.innerHTML = '<div class="search-result-item">검색 결과가 없습니다.</div>';
    } else {
      searchResults.innerHTML = results.slice(0, 10).map(store => `
        <div class="search-result-item" data-store-id="${store.id}">
          <div class="result-name">${store.name}</div>
          <div class="result-info">${store.category} • ${store.isOpen ? '운영중' : '운영중지'} • ★${store.ratingAverage || '0.0'}</div>
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

            // 검색 결과 숨기기 및 입력창 초기화
            searchResults.classList.add('hidden');
            searchInput.value = store.name;

            // 매장 상세 페이지로 이동
            setTimeout(() => {
              if (typeof renderStore === 'function') {
                renderStore(store);
              }
            }, 500);
          }
        });
      });
    }

    searchResults.classList.remove('hidden');
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
      searchResults.classList.add('hidden');
    }
  });

  // 검색 버튼 클릭
  searchBtn.addEventListener('click', () => {
    performSearch(searchInput.value.trim());
  });

  // 새로고침 버튼 클릭
  const refreshBtn = document.getElementById('refreshBtn');
  refreshBtn.addEventListener('click', async () => {
    console.log('🔄 수동 새로고침 버튼 클릭됨 - 캐시 삭제 후 새로 로딩');
    
    refreshBtn.style.transform = 'scale(1.05) rotate(360deg)';
    refreshBtn.style.pointerEvents = 'none';
    
    try {
      // 기존 캐시 삭제
      window.storeCache.clearCache();
      
      // 강제 새로고침으로 서버에서 데이터 가져오기
      await loadStoresAndMarkers(map, true);
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
    searchResults.classList.add('hidden');
    clearBtn.style.display = 'none';
    searchInput.focus();
  });

  // 검색 결과 외부 클릭시 숨기기
  document.addEventListener('click', (e) => {
    if (!searchInput.contains(e.target) && !searchResults.contains(e.target) && !searchBtn.contains(e.target)) {
      searchResults.classList.add('hidden');
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
}

// 매장 데이터를 캐시 우선으로 로딩하고 마커를 표시하는 함수
async function loadStoresAndMarkers(map, forceRefresh = false) {
  try {
    let stores = [];

    // 캐시에 데이터가 있는지 확인 (forceRefresh인 경우에도 일단 캐시 확인)
    if (!forceRefresh && window.storeCache.hasCachedData()) {
      stores = window.storeCache.getStoreData();
      if (stores && stores.length > 0) {
        console.log('📁 캐시된 매장 데이터 사용:', stores.length, '개 매장');
        
        // 캐시 데이터로 마커 생성 (중복 방지)
        await createMarkersFromCache(stores, map);
        
        // 매장 목록도 업데이트
        setTimeout(() => {
          const storeListContainer = document.getElementById('storeListContainer');
          if (storeListContainer) {
            updateStoreList(stores, storeListContainer);
          }
        }, 100);
        
        return; // 캐시 사용 시 여기서 종료
      }
    }

    // 캐시에 데이터가 없거나 새로고침인 경우 서버에서 가져오기
    console.log(forceRefresh ? 
      '🔄 강제 새로고침 - 서버에서 최신 데이터 요청 중...' : 
      '🌐 서버에서 매장 기본 정보 로딩 중...');
    
    const response = await fetch('/api/stores/batch/basic-info');
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    if (!data.success || !Array.isArray(data.stores)) {
      throw new Error('서버 응답에 유효한 매장 데이터가 없습니다');
    }

    stores = data.stores;
    console.log('✅ 서버에서 매장 데이터 로드 성공:', stores.length, '개 매장');

    // 서버 응답 후 기존 캐시 삭제 및 새로운 데이터로 업데이트
    if (forceRefresh) {
      console.log('🗑️ 서버 응답 완료 - 기존 캐시 삭제 후 업데이트');
      await window.storeCache.clearCacheAsync();
      clearAllMarkers(); // 기존 마커 완전 삭제
    }

    // 새로운 데이터를 캐시에 저장
    await window.storeCache.setStoreDataAsync(stores);
    console.log('💾 새로운 매장 데이터 캐시 저장 완료');

    // 기존 마커 완전 삭제 후 새로 생성 (forceRefresh가 아닌 경우에만)
    if (!forceRefresh) {
      clearAllMarkers();
    }
    await createMarkersFromData(stores, map);

    // 매장 목록 업데이트
    setTimeout(() => {
      const storeListContainer = document.getElementById('storeListContainer');
      if (storeListContainer) {
        updateStoreList(stores, storeListContainer);
      }
    }, 100);

  } catch (error) {
    console.error('❌ 매장 데이터 로드 실패:', error);
  }
}

// 기존 마커 완전 삭제 함수
function clearAllMarkers() {
  console.log('🧹 기존 마커 완전 삭제 시작');
  
  // Map에서 마커 제거
  if (window.markerMap && window.markerMap.size > 0) {
    window.markerMap.forEach((marker, storeId) => {
      if (marker && typeof marker.setMap === 'function') {
        marker.setMap(null); // 지도에서 제거
      }
    });
    window.markerMap.clear();
    console.log('🗑️ markerMap 클리어 완료');
  }

  // 배열에서 마커 제거
  if (window.currentMarkers && window.currentMarkers.length > 0) {
    window.currentMarkers.forEach(marker => {
      if (marker && typeof marker.setMap === 'function') {
        marker.setMap(null); // 지도에서 제거
      }
    });
    window.currentMarkers = [];
    console.log('🗑️ currentMarkers 배열 클리어 완료');
  }

  console.log('✅ 기존 마커 완전 삭제 완료');
}

// 캐시 데이터로 마커 생성 (중복 방지)
async function createMarkersFromCache(stores, map) {
  console.log('📁 캐시 데이터로 마커 생성 시작:', stores.length, '개 매장');
  
  // 이미 마커가 생성되어 있는지 확인
  if (window.markerMap && window.markerMap.size > 0) {
    console.log('⚠️ 이미 마커가 존재함 - 중복 생성 방지');
    return;
  }

  await createMarkersFromData(stores, map);
}

// 실제 마커 생성 함수
async function createMarkersFromData(stores, map) {
  console.log('🔄 새 마커 생성 시작:', stores.length, '개 매장');

  if (window.MapMarkerManager && typeof window.MapMarkerManager.createMarkersInBatch === 'function') {
    const newMarkers = await window.MapMarkerManager.createMarkersInBatch(stores, map);
    
    // 마커 Map과 배열에 저장
    newMarkers.forEach(marker => {
      if (marker && marker.storeId) {
        window.markerMap.set(marker.storeId, marker);
      }
    });

    window.currentMarkers = Array.from(window.markerMap.values());
    console.log(`✅ 새 마커 생성 완료 - 총 ${window.markerMap.size}개 마커 활성화`);
  }
}

// 매장 목록 업데이트 함수 (캐시된 데이터 사용)
async function updateStoreList(stores, storeListContainer) {
  try {
    console.log(`🔄 매장 목록 업데이트 시작: ${stores.length}개 매장`);

    // 기존 내용 제거
    storeListContainer.innerHTML = '';

    // 매장 카드 생성 (캐시된 별점 정보 사용)
    const fragment = document.createDocumentFragment();

    stores.forEach((store, index) => {
      const card = document.createElement('div');
      card.className = 'storeCard';
      card.setAttribute('data-store-id', store.id);

      // 캐시된 데이터에 이미 별점 정보가 포함되어 있음
      const ratingData = {
        ratingAverage: store.ratingAverage || 0.0,
        reviewCount: store.reviewCount || 0
      };

      if (window.MapPanelUI && typeof window.MapPanelUI.renderStoreCard === 'function') {
        card.innerHTML = window.MapPanelUI.renderStoreCard(store, ratingData);
      } else {
        card.innerHTML = `
          <div style="padding: 15px; border: 1px solid #ddd; border-radius: 8px; margin-bottom: 10px;">
            <h3>${store.name}</h3>
            <p>카테고리: ${store.category || 'N/A'}</p>
            <p>상태: ${store.isOpen ? '운영중' : '운영중지'}</p>
            <p>별점: ${ratingData.ratingAverage}점 (${ratingData.reviewCount}개 리뷰)</p>
          </div>
        `;
      }

      card.addEventListener('click', () => {
        if (typeof renderStore === 'function') {
          renderStore(store);
        }
      });

      fragment.appendChild(card);
    });

    storeListContainer.appendChild(fragment);
    
    console.log(`✅ 매장 목록 업데이트 완료: ${stores.length}개 매장`);

  } catch (error) {
    console.error('❌ 매장 목록 업데이트 중 오류:', error);
  }
}

// 일괄 별점 정보 로딩 (직접 API 호출)
async function loadAllStoreRatings(storeIds) {
  try {
    if (!Array.isArray(storeIds) || storeIds.length === 0) {
      return {};
    }

    const storeIdsParam = storeIds.join(',');
    const response = await fetch(`/api/stores/ratings/batch?storeIds=${storeIdsParam}`);

    if (!response.ok) {
      console.error(`❌ 일괄 별점 정보 조회 실패: ${response.status}`);
      return {};
    }

    const data = await response.json();
    if (data.success && data.ratings) {
      return data.ratings;
    }

    return {};
  } catch (error) {
    console.error('❌ 일괄 별점 정보 로딩 실패:', error);
    return {};
  }
}

// 개별 매장 별점 정보 조회
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
window.loadAllStoreRatings = loadAllStoreRatings;
window.loadStoreRatingAsync = loadStoreRatingAsync;
