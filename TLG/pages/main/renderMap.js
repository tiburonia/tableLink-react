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

  // 지도 즉시 생성 (UI 렉 방지)
  const container = document.getElementById('map');
  const options = {
    center: new kakao.maps.LatLng(37.5665, 126.9780),
    level: 3
  };

  const map = new kakao.maps.Map(container, options);

  // 마커 배열 및 데이터 초기화 (첫 렌더링시만)
  if (!window.currentMarkers) {
    window.currentMarkers = [];
  }
  if (!window.lastStoreData) {
    window.lastStoreData = [];
  }
  if (!window.markerMap) {
    window.markerMap = new Map();
  }

  console.log('🔄 renderMap: 마커 데이터 확인 완료 - 기존 마커:', window.markerMap.size, '개');


  // DOM 즉시 확인 및 강제 재렌더링
  const waitForDOM = () => {
    return new Promise((resolve) => {
      let checkCount = 0;
      const maxChecks = 30;

      const checkDOM = () => {
        checkCount++;
        console.log(`🔍 DOM 요소 확인 시도 ${checkCount}/${maxChecks}`);

        const storeListContainer = document.getElementById('storeListContainer');
        const storePanel = document.getElementById('storePanel');

        // 전체 DOM 구조 상세 확인
        console.log('📋 현재 DOM 상태:');
        console.log('- storePanel 존재:', !!storePanel);
        console.log('- storeListContainer 존재:', !!storeListContainer);

        // 모든 ID가 있는 요소들 확인
        const allElementsWithId = document.querySelectorAll('[id]');
        const allIds = Array.from(allElementsWithId).map(el => el.id);
        console.log('- 현재 문서의 모든 ID들:', allIds);

        if (storePanel) {
          console.log('- storePanel innerHTML 길이:', storePanel.innerHTML.length);
          console.log('- storePanel 첫 100글자:', storePanel.innerHTML.substring(0, 100));

          // storePanel 내부에서 직접 찾아보기
          let containerInPanel = storePanel.querySelector('#storeListContainer');
          console.log('- storePanel 내부 storeListContainer 직접 검색:', !!containerInPanel);

          // 찾을 수 없으면 안전하게 생성 (기존 상태 보존)
          if (!containerInPanel) {
            console.log('🔧 DOM 대기 중 storeListContainer 안전 생성 (패널 상태 보존)');

            // 기존 핸들이 없으면 생성
            let existingHandle = storePanel.querySelector('#panelHandle');
            if (!existingHandle) {
              const handleDiv = document.createElement('div');
              handleDiv.id = 'panelHandle';
              handleDiv.style.cssText = 'width: 44px; height: 7px; background: #e0e3f3; border-radius: 4px; margin: 10px auto 6px auto; cursor: pointer; opacity: 0.8;';
              storePanel.insertBefore(handleDiv, storePanel.firstChild);
            }

            // 컨테이너만 새로 생성
            const containerDiv = document.createElement('div');
            containerDiv.id = 'storeListContainer';
            containerDiv.style.cssText = 'height: calc(100% - 23px); overflow-y: auto; padding: 8px 4px 20px 4px; box-sizing: border-box; scrollbar-width: none; -ms-overflow-style: none;';
            containerDiv.innerHTML = '<div class="loading-message" style="text-align: center; padding: 20px; color: #666;">매장 정보를 불러오는 중...</div>';

            storePanel.appendChild(containerDiv);
            containerInPanel = containerDiv;
          }

          if (containerInPanel) {
            console.log('✅ storePanel 내부에서 storeListContainer 발견/생성 완료!');
            resolve(true);
            return;
          }
        }

        if (storeListContainer && storePanel) {
          console.log(`✅ 두 요소 모두 발견됨 (시도 ${checkCount}회)`);
          resolve(true);
          return;
        }

        if (checkCount < maxChecks) {
          setTimeout(checkDOM, 150);
        } else {
          console.error('❌ DOM 요소를 찾을 수 없음. 강제로 계속 진행합니다.');

          // 최후의 수단: storePanel이라도 있으면 성공으로 처리
          if (storePanel) {
            console.log('⚠️ storePanel만 발견되어 진행합니다.');
            resolve(true);
          } else {
            resolve(false);
          }
        }
      };

      // 바로 확인 시작
      checkDOM();
    });
  };

  // 즉시 매장 데이터 로딩 시작 (DOM 준비와 병렬 처리)
  loadStoresAndMarkers(map);

  // DOM 준비 확인은 별도로 처리
  waitForDOM().then((success) => {
    if (success) {
      console.log('✅ DOM 준비 완료, 매장 목록 업데이트 시작');
      // DOM이 준비되면 매장 목록 즉시 업데이트
      const storeListContainer = document.getElementById('storeListContainer');
      if (storeListContainer && window.lastLoadedStores) {
        console.log('📝 저장된 매장 데이터로 목록 업데이트:', window.lastLoadedStores.length, '개 매장');
        updateStoreList(window.lastLoadedStores, storeListContainer);
        // 필터링 기능 초기화
        if (window.MapPanelUI && typeof window.MapPanelUI.initializeFiltering === 'function') {
          window.MapPanelUI.initializeFiltering();
        }
        // 패널 드래그 기능 초기화 (중복 방지를 위해 DOM 준비 후 한 번만 실행)
        if (window.MapPanelUI && typeof window.MapPanelUI.setupPanelDrag === 'function') {
          window.MapPanelUI.setupPanelDrag();
          console.log('✅ MapPanelUI 드래그 시스템 초기화 완료');
        }
      } else {
        console.warn('⚠️ DOM은 준비되었지만 매장 데이터가 없거나 컨테이너를 찾을 수 없음');
      }
    } else {
      console.warn('⚠️ DOM 준비 실패, 기본 처리로 진행');
    }
  });

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
              map.setLevel(2); // 줌 레벨 설정
            }

            // 검색 결과 숨기기 및 입력창 초기화
            searchResults.classList.add('hidden');
            searchInput.value = store.name;

            // 매장 상세 페이지로 이동 (선택사항)
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
    console.log('🔄 수동 새로고침 버튼 클릭됨');
    
    // 버튼 회전 애니메이션
    refreshBtn.style.transform = 'scale(1.05) rotate(360deg)';
    refreshBtn.style.pointerEvents = 'none'; // 중복 클릭 방지
    
    try {
      // 통합 API 호출로 매장 정보 새로고침
      await loadStoresAndMarkers(map);
      console.log('✅ 수동 새로고침 완료');
    } catch (error) {
      console.error('❌ 수동 새로고침 실패:', error);
    } finally {
      // 버튼 상태 복원
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

  // 바텀바 지도 버튼 클릭시 (현재 페이지 새로고침)
  const renderMapBtn = document.getElementById('renderMapBtn');
  renderMapBtn.addEventListener('click', () => {
    if (typeof renderMap === 'function') {
      renderMap();
    } else {
      location.reload();
    }
  });

  // 패널 드래그 기능은 MapPanelUI.setupPanelDrag()에서 전담 처리

  // 주기적으로 매장 상태 업데이트 (30분마다)
  const updateInterval = setInterval(() => {
    console.log('🔄 지도: 매장 상태 주기적 업데이트 시작 (30분 간격)');
    loadStoresAndMarkers(map);
  }, 30 * 60 * 1000); // 30분 = 30 * 60 * 1000ms

  // 페이지 떠날 때 인터벌 정리
  window.addEventListener('beforeunload', () => {
    clearInterval(updateInterval);
  });

  }

// 통합 별점 정보 로딩 시스템 (일괄 조회)
window.loadAllStoreRatings = async function(storeIds) {
  try {
    if (!Array.isArray(storeIds) || storeIds.length === 0) {
      console.warn('⚠️ 빈 매장 ID 배열이 전달됨');
      return {};
    }

    console.log(`🔄 일괄 별점 정보 로딩 시작: ${storeIds.length}개 매장`);

    // 1. 캐시에서 먼저 확인
    const ratingsCache = {};
    const uncachedStoreIds = [];

    if (typeof window.cacheManager !== 'undefined') {
      storeIds.forEach(storeId => {
        const cachedRating = window.cacheManager.getStoreRating(storeId);
        if (cachedRating) {
          ratingsCache[storeId] = cachedRating;
        } else {
          uncachedStoreIds.push(storeId);
        }
      });

      console.log(`📁 캐시에서 ${Object.keys(ratingsCache).length}개 매장 별점 정보 발견`);
      console.log(`🌐 서버에서 가져올 매장: ${uncachedStoreIds.length}개`);
    } else {
      uncachedStoreIds.push(...storeIds);
    }

    // 2. 캐시에 없는 매장들만 일괄 조회
    if (uncachedStoreIds.length > 0) {
      const storeIdsParam = uncachedStoreIds.join(',');
      const response = await fetch(`/api/stores/ratings/batch?storeIds=${storeIdsParam}`);

      if (!response.ok) {
        console.error(`❌ 일괄 별점 정보 조회 실패: ${response.status}`);
        // 실패해도 캐시된 데이터라도 반환
        return ratingsCache;
      }

      const data = await response.json();
      if (data.success && data.ratings) {
        // 3. 새로 가져온 데이터를 캐시에 저장하고 결과에 추가
        Object.keys(data.ratings).forEach(storeId => {
          const ratingData = data.ratings[storeId];
          ratingsCache[storeId] = ratingData;

          // 캐시에 저장
          if (typeof window.cacheManager !== 'undefined') {
            window.cacheManager.setStoreRating(parseInt(storeId), ratingData);
          }
        });

        console.log(`✅ 일괄 별점 정보 로딩 완료: 총 ${Object.keys(ratingsCache).length}개 매장`);
      }
    }

    return ratingsCache;
  } catch (error) {
    console.error('❌ 일괄 별점 정보 로딩 실패:', error);
    return {};
  }
}

// 개별 매장 별점 정보 조회 (기존 호환성 유지, 일괄 조회 우선 사용)
window.loadStoreRatingAsync = async function(storeId) {
  try {
    // 1. 먼저 캐시에서 확인
    if (typeof window.cacheManager !== 'undefined') {
      const cachedRating = window.cacheManager.getStoreRating(storeId);
      if (cachedRating) {
        console.log(`⭐ 지도: 캐시된 매장 ${storeId} 별점 정보 사용: ${cachedRating.ratingAverage}점`);
        return cachedRating;
      }
    }

    // 2. 개별 조회 (비효율적이지만 기존 호환성 유지)
    console.log(`🔄 지도: 매장 ${storeId} 별점 정보 개별 조회 중...`);
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
  let usedCache = false;

  try {
    // 1. 먼저 캐시에서 데이터 확인
    if (typeof window.cacheManager !== 'undefined' && typeof window.cacheManager.getCacheStatus === 'function') {
      const cacheStatus = window.cacheManager.getCacheStatus();
      
      if (cacheStatus.isValid && cacheStatus.hasStoresCache) {
        console.log('📁 유효한 캐시 발견 - 캐시에서 매장 데이터 로드 중...');
        
        try {
          const cachedData = localStorage.getItem('tablelink_stores_cache');
          if (cachedData) {
            const parsedData = JSON.parse(cachedData);
            if (parsedData.stores && Array.isArray(parsedData.stores) && parsedData.stores.length > 0) {
              stores = parsedData.stores;
              usedCache = true;
              console.log('✅ 캐시에서 매장 데이터 로드 성공:', stores.length, '개 매장');
            }
          }
        } catch (cacheError) {
          console.warn('⚠️ 캐시 데이터 파싱 실패:', cacheError);
        }
      } else {
        console.log('⚠️ 캐시가 유효하지 않거나 비어있음 - 서버에서 데이터 가져옴');
      }
    }

    // 2. 캐시에 데이터가 없거나 유효하지 않은 경우만 서버 요청
    if (!usedCache || stores.length === 0) {
      console.log('🌐 서버에서 최신 매장 정보 로딩 중...');
      const response = await fetch('/api/stores');

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();

      if (data.success && Array.isArray(data.stores)) {
        stores = data.stores;
        console.log('🗺️ 서버에서 매장 데이터 로드 성공:', stores.length, '개 매장');

        // 캐시 업데이트
        if (typeof window.cacheManager !== 'undefined' && typeof window.cacheManager.setStores === 'function') {
          try {
            const cacheResult = window.cacheManager.setStores(stores);
            if (cacheResult) {
              console.log('✅ 매장 데이터 캐시 업데이트 완료');
            } else {
              console.warn('⚠️ 매장 데이터 캐시 업데이트 실패');
            }
          } catch (cacheError) {
            console.warn('⚠️ 캐시 업데이트 중 오류:', cacheError);
          }
        }
      } else {
        throw new Error('서버 응답에 유효한 매장 데이터가 없습니다');
      }
    }
  } catch (error) {
    console.error('❌ 매장 데이터 로드 실패:', error);

    // 3. 서버 요청 실패 시 캐시에서 fallback 시도 (캐시를 사용하지 않았던 경우)
    if (!usedCache && typeof window.cacheManager !== 'undefined') {
      try {
        const fallbackData = localStorage.getItem('tablelink_stores_cache');
        if (fallbackData) {
          const parsedData = JSON.parse(fallbackData);
          if (parsedData.stores && Array.isArray(parsedData.stores)) {
            stores = parsedData.stores;
            console.log('🆘 fallback으로 캐시 데이터 사용:', stores.length, '개 매장');
          }
        }
      } catch (fallbackError) {
        console.error('❌ fallback 시도도 실패:', fallbackError);
        return;
      }
    }

    if (stores.length === 0) {
      console.error('❌ 모든 데이터 소스에서 매장 정보를 가져올 수 없음');
      return;
    }
  }

  // 기존 마커 데이터와 비교
  if (!window.currentMarkers) {
    window.currentMarkers = [];
    window.lastStoreData = [];
  }

  // 개별 매장 변경사항 감지 함수
  function getStoreChanges(oldStores, newStores) {
    const changes = {
      added: [],
      updated: [],
      removed: [],
      unchanged: []
    };

    // 기존 매장 배열이 없으면 모든 매장을 추가로 처리
    if (!oldStores || oldStores.length === 0) {
      changes.added = [...newStores];
      return changes;
    }

    // 새로운 매장들을 확인
    newStores.forEach(newStore => {
      const oldStore = oldStores.find(s => s.id === newStore.id);

      if (!oldStore) {
        // 새로 추가된 매장
        changes.added.push(newStore);
      } else {
        // 기존 매장의 변경사항 확인
        const hasChanges = 
          oldStore.isOpen !== newStore.isOpen ||
          oldStore.name !== newStore.name ||
          JSON.stringify(oldStore.coord) !== JSON.stringify(newStore.coord) ||
          oldStore.ratingAverage !== newStore.ratingAverage;

        if (hasChanges) {
          changes.updated.push({ old: oldStore, new: newStore });
        } else {
          changes.unchanged.push(newStore);
        }
      }
    });

    // 삭제된 매장들 확인
    oldStores.forEach(oldStore => {
      const exists = newStores.find(s => s.id === oldStore.id);
      if (!exists) {
        changes.removed.push(oldStore);
      }
    });

    return changes;
  }

  // 매장별 변경사항 확인
  const storeChanges = getStoreChanges(window.lastStoreData, stores);
  const totalChanges = storeChanges.added.length + storeChanges.updated.length + storeChanges.removed.length;

  // 지도 객체가 새로 생성되었는지 확인
  const isMapReset = !window.currentMap || window.currentMap !== map;
  const hasNoMarkers = !window.markerMap || window.markerMap.size === 0;
  const isInitialRender = !window.lastStoreData || window.lastStoreData.length === 0;

  // 지도가 새로 생성되었으면 모든 마커를 다시 생성해야 함
  if (isMapReset) {
    console.log('🗺️ 지도가 새로 생성됨 - 모든 마커를 지도에 다시 표시');
    window.currentMap = map;

    // 기존 마커들을 새 지도에 다시 연결
    if (window.markerMap.size > 0) {
      console.log('🔄 기존 마커들을 새 지도에 연결:', window.markerMap.size, '개');
      Array.from(window.markerMap.values()).forEach(marker => {
        if (marker && marker.setMap) {
          marker.setMap(map);
        }
      });
    }
  }

  if (totalChanges === 0 && !hasNoMarkers && !isInitialRender && !isMapReset) {
    console.log('📍 매장 데이터 변경사항 없음 - 마커 업데이트 건너뛰기');
    // 매장 목록은 업데이트 (UI 새로고침 용도)
    setTimeout(() => {
      const storeListContainer = document.getElementById('storeListContainer');
      if (storeListContainer) {
        updateStoreList(stores, storeListContainer);
        // 필터링 기능 초기화
        if (window.MapPanelUI && typeof window.MapPanelUI.initializeFiltering === 'function') {
          window.MapPanelUI.initializeFiltering();
        }
      }
    }, 100);
    return;
  }

  if (hasNoMarkers || isInitialRender || isMapReset) {
    console.log('🔄 마커가 없거나 초기 렌더링 또는 지도 리셋 - 모든 마커를 새로 생성');
    // 기존 마커들 정리 (지도 리셋인 경우)
    if (isMapReset && window.markerMap.size > 0) {
      window.markerMap.clear();
      console.log('🗑️ 지도 리셋으로 기존 마커 맵 클리어');
    }
    // 모든 매장을 새로 추가할 매장으로 처리
    storeChanges.added = [...stores];
    storeChanges.updated = [];
    storeChanges.removed = [];
  }

  console.log(`🔄 매장 변경사항 감지 - 추가: ${storeChanges.added.length}, 수정: ${storeChanges.updated.length}, 삭제: ${storeChanges.removed.length}개`);

  // 마커 맵 초기화 (마커 ID로 관리)
  if (!window.markerMap) {
    window.markerMap = new Map();
  }

  // 삭제된 매장의 마커 제거
  storeChanges.removed.forEach(removedStore => {
    const existingMarker = window.markerMap.get(removedStore.id);
    if (existingMarker) {
      existingMarker.setMap(null);
      window.markerMap.delete(removedStore.id);
      console.log(`🗑️ 매장 ${removedStore.name} 마커 제거`);
    }
  });

  // 수정된 매장의 마커 업데이트
  storeChanges.updated.forEach(({ old: oldStore, new: newStore }) => {
    const existingMarker = window.markerMap.get(oldStore.id);
    if (existingMarker) {
      existingMarker.setMap(null);
      window.markerMap.delete(oldStore.id);
      console.log(`🔄 매장 ${oldStore.name} 마커 업데이트 준비`);
    }
  });

  // 통합 API 호출로 새로운/수정된 마커 생성
  setTimeout(async () => {
    const storesToCreateMarkers = [...storeChanges.added, ...storeChanges.updated.map(u => u.new)];
    
    if (storesToCreateMarkers.length > 0) {
      console.log(`🔄 통합 API 호출로 ${storesToCreateMarkers.length}개 매장 마커 생성/업데이트 중...`);
      
      // 일괄 마커 생성 (통합 별점 조회 포함)
      const newMarkers = await window.MapMarkerManager.createMarkersInBatch(storesToCreateMarkers, map);
      
      // 마커 맵에 추가/업데이트
      newMarkers.forEach(marker => {
        if (marker && marker.storeId) {
          window.markerMap.set(marker.storeId, marker);
          
          // 로깅
          const isUpdate = storeChanges.updated.some(u => u.new.id === marker.storeId);
          const action = isUpdate ? '🔄 업데이트' : '➕ 생성';
          console.log(`${action} 매장 ${marker.storeName} 마커 완료`);
        }
      });
    }

    // 현재 마커 배열 업데이트 (역호환성 유지)
    window.currentMarkers = Array.from(window.markerMap.values());

    console.log(`✅ 통합 API 호출로 마커 업데이트 완료 - 총 ${window.markerMap.size}개 마커 활성화`);

    // 현재 데이터를 저장 (다음 비교용)
    window.lastStoreData = JSON.parse(JSON.stringify(stores));
  }, 100);

  // 매장 데이터를 전역에 저장 (DOM 준비 후 재사용을 위해)
  window.lastLoadedStores = stores;

  // 가게 목록 업데이트 시도 (UI 보존 방식)
  setTimeout(() => {
    let storeListContainer = document.getElementById('storeListContainer');

    // 직접 찾기 실패 시 storePanel 내부에서 검색
    if (!storeListContainer) {
      const storePanel = document.getElementById('storePanel');
      if (storePanel) {
        storeListContainer = storePanel.querySelector('#storeListContainer');
        console.log('🔍 storePanel 내부에서 storeListContainer 검색 결과:', !!storeListContainer);
      }
    }

    // 여전히 찾을 수 없으면 안전하게 생성 (기존 패널 상태 보존)
    if (!storeListContainer) {
      const storePanel = document.getElementById('storePanel');
      if (storePanel) {
        console.log('🔧 storeListContainer만 안전하게 생성합니다 (패널 상태 보존)');

        // 기존 패널 핸들은 유지하고 컨테이너만 추가
        let panelHandle = storePanel.querySelector('#panelHandle');
        if (!panelHandle) {
          const handleDiv = document.createElement('div');
          handleDiv.id = 'panelHandle';
          handleDiv.style.cssText = 'width: 44px; height: 7px; background: #e0e3f3; border-radius: 4px; margin: 10px auto 6px auto; cursor: pointer; opacity: 0.8;';
          storePanel.insertBefore(handleDiv, storePanel.firstChild);
        }

        // storeListContainer만 새로 생성
        const containerDiv = document.createElement('div');
        containerDiv.id = 'storeListContainer';
        containerDiv.style.cssText = 'height: calc(100% - 23px); overflow-y: auto; padding: 8px 4px 20px 4px; box-sizing: border-box; scrollbar-width: none; -ms-overflow-style: none;';

        // 로딩 메시지 추가
        containerDiv.innerHTML = `
          <div class="loading-message" style="text-align: center; padding: 20px; color: #666;">
            <div class="loading-spinner" style="margin: 0 auto 10px auto; width: 30px; height: 30px; border: 3px solid #e0e0e0; border-top: 3px solid #297efc; border-radius: 50%; animation: spin 1s linear infinite;"></div>
            매장 정보를 불러오는 중...
          </div>
        `;

        storePanel.appendChild(containerDiv);
        storeListContainer = containerDiv;

        console.log('✅ storeListContainer 안전 생성 완료 (패널 상태 유지)');
      }
    }

    if (storeListContainer) {
      console.log('✅ storeListContainer 준비됨, 매장 목록 업데이트 진행');
      updateStoreList(stores, storeListContainer);
    } else {
      console.error('❌ 모든 시도에서 storeListContainer 생성/발견 실패');
      console.log('💾 매장 데이터를 전역 변수에 저장:', stores.length, '개 매장');
    }
  }, 200);
}

// 통합 API 호출을 사용한 매장 목록 업데이트 함수
async function updateStoreList(stores, storeListContainer) {
  try {
    storeListContainer.innerHTML = ''; // 로딩 메시지 제거

    // 1. 모든 매장의 별점 정보를 일괄 조회
    const storeIds = stores.map(store => store.id);
    const allRatings = await window.loadAllStoreRatings(storeIds);
    
    console.log(`✅ 일괄 별점 조회 완료 - ${Object.keys(allRatings).length}개 매장 별점 정보 준비됨`);

    // 2. 각 매장 카드 렌더링 (별점 정보는 이미 준비됨)
    stores.forEach(store => {
      const card = document.createElement('div');
      card.className = 'storeCard';

      // 일괄 조회한 별점 정보 사용
      const ratingData = allRatings[store.id] || { ratingAverage: 0.0, reviewCount: 0 };

      // 운영 상태 확인
      console.log(`🏪 매장 ${store.name} 운영 상태: ${store.isOpen ? '운영중' : '운영중지'}, 별점: ${ratingData.ratingAverage}점`);

      // MapPanelUI가 존재하는지 확인
      if (window.MapPanelUI && typeof window.MapPanelUI.renderStoreCard === 'function') {
        // 카드 HTML 생성
        card.innerHTML = window.MapPanelUI.renderStoreCard(store, ratingData);
      } else {
        console.warn(`⚠️ MapPanelUI를 찾을 수 없어 기본 카드를 생성합니다: ${store.name}`);
        card.innerHTML = `
          <div style="padding: 15px; border: 1px solid #ddd; border-radius: 8px; margin-bottom: 10px;">
            <h3>${store.name}</h3>
            <p>카테고리: ${store.category || 'N/A'}</p>
            <p>상태: ${store.isOpen ? '운영중' : '운영중지'}</p>
            <p>별점: ${ratingData.ratingAverage}점 (${ratingData.reviewCount}개 리뷰)</p>
          </div>
        `;
      }

      // 카드 클릭 시 해당 가게의 상세 페이지로 이동
      card.addEventListener('click', () => {
        if (typeof renderStore === 'function') {
          renderStore(store);
        } else {
          console.warn('⚠️ renderStore 함수를 찾을 수 없습니다');
        }
      });

      storeListContainer.appendChild(card);
    });

    console.log(`✅ 통합 API 호출로 매장 목록 업데이트 완료: ${stores.length}개 매장`);
  } catch (error) {
    console.error('❌ 매장 목록 업데이트 중 오류:', error);
  }
}