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

/* 위치 정보 표시 */
#locationInfo {
  position: absolute;
  top: 90px;
  left: 16px;
  right: 16px;
  z-index: 1001;
  pointer-events: none;
}

.location-container {
  background: linear-gradient(135deg, rgba(41, 126, 252, 0.95), rgba(79, 70, 229, 0.90));
  color: white;
  border-radius: 20px;
  padding: 8px 16px;
  text-align: center;
  box-shadow: 0 4px 16px rgba(41, 126, 252, 0.15);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  transition: all 0.3s ease;
  font-size: 13px;
  font-weight: 600;
}

.location-container:hover {
  background: linear-gradient(135deg, rgba(41, 126, 252, 1), rgba(79, 70, 229, 0.95));
  box-shadow: 0 6px 20px rgba(41, 126, 252, 0.25);
  transform: translateY(-1px);
}

#locationText {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
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

            // 검색 결과 숨기기 및 입력창 업데이트
            searchResults.classList.add('hidden');
            searchInput.value = store.name;

            console.log(`📍 ${store.name} 위치로 지도 이동 완료`);
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

  // 지도 이동 또는 확대/축소 시 현재 위치 정보를 업데이트하는 로직 추가
  const updateLocationInfo = async () => {
    const center = map.getCenter();
    const lat = center.getLat();
    const lng = center.getLng();

    try {
      const response = await fetch(`https://dapi.kakao.com/v2/local/geo/coord2regioncode.json?input_coord=WGS84&output=json&x=${lng}&y=${lat}`, {
        headers: {
          'Authorization': 'KakaoAK b293f061d64835827c5792302598d7c9' // 실제 API 키로 교체해야 합니다.
        }
      });
      const data = await response.json();

      if (data.documents && data.documents.length > 0) {
        const location = data.documents[0];
        // 가장 상세한 지역 정보 (예: '서울특별시 종로구 삼청동')
        const address = location.road_address ? location.road_address.address_name : location.address_name;

        // 읍면동 정보 추출 (한국어 주소 기준)
        const addressParts = address.split(' ');
        let district = '';
        if (addressParts.length >= 3) {
          district = `${addressParts[0]} ${addressParts[1]} ${addressParts[2]}`;
        } else {
          district = address;
        }

        const locationTextElement = document.getElementById('locationText');
        if (locationTextElement) {
          locationTextElement.innerHTML = `
            <span style="font-size: 16px;">📍</span> ${district}
          `;
        }
      }
    } catch (error) {
      console.error('현재 위치 정보 로딩 실패:', error);
      const locationTextElement = document.getElementById('locationText');
      if (locationTextElement) {
        locationTextElement.innerHTML = '<span style="font-size: 16px;">📍</span> 위치 정보 없음';
      }
    }
  };

  // 위치 정보 UI 생성
  const locationInfoDiv = document.createElement('div');
  locationInfoDiv.id = 'locationInfo';
  locationInfoDiv.innerHTML = `
    <div class="location-container">
      <div id="locationText">
        <span style="font-size: 16px;">⏳</span> 위치 정보 로딩 중...
      </div>
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