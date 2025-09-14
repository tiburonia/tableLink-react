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
          <input id="searchInput" type="text" placeholder="매장명, 카테고리 또는 위치 검색...">
          <button id="searchBtn">🔍</button>
          <button id="clearBtn">✕</button>
        </div>
        <div id="searchResults" class="search-results hidden"></div>
      </div>

      <!-- 상단 컨트롤 바 -->
      <div id="topControlBar">
        <button id="locationSelectBtn" class="location-select-btn" title="위치 선택">
          <span id="locationText">현재 위치 선택</span>
          <span class="dropdown-arrow">▼</span>
        </button>
        <div class="top-control-spacer"></div>
        <button id="notificationBtn" class="top-control-btn" title="알림" onclick="renderNotification()">
          <span>🔔</span>
          <span id="notificationBadge" class="notification-badge hidden">3</span>
        </button>
        <button id="cartBtn" class="top-control-btn" title="장바구니">
          <span>🛒</span>
          <span id="cartBadge" class="cart-badge hidden">2</span>
        </button>
      </div>

      <!-- 위치 설정 모달 -->
      <div id="locationModal" class="location-modal hidden">
        <div class="modal-content">
          <div class="modal-header">
            <h3>📍 내 위치 설정</h3>
            <button id="closeModal" class="close-btn">✕</button>
          </div>
          <div class="modal-body">
            <div class="region-selection-container">
              <div class="select-group">
                <label for="provinceSelect">시/도</label>
                <select id="provinceSelect" class="region-select">
                  <option value="">시/도를 선택하세요</option>
                </select>
              </div>

              <div class="select-group">
                <label for="citySelect">시/군/구</label>
                <select id="citySelect" class="region-select" disabled>
                  <option value="">시/군/구를 선택하세요</option>
                </select>
              </div>

              <div class="select-group">
                <label for="districtSelect">읍/면/동</label>
                <select id="districtSelect" class="region-select" disabled>
                  <option value="">읍/면/동을 선택하세요</option>
                </select>
              </div>

              <button id="confirmLocationBtn" class="confirm-location-btn" disabled>
                📍 이 위치로 설정
              </button>
            </div>

            <div class="divider">또는</div>

            <div class="current-location-section">
              <button id="getCurrentLocationBtn" class="get-current-btn">
                🎯 현재 GPS 위치 사용
              </button>
            </div>
          </div>
        </div>
      </div>
      ${window.MapPanelUI.renderPanelHTML()}
    </main>

    <nav id="bottomBar">
      <button onclick="renderSubMain()" title="홈">
        <span style="font-size: 22px;">🏠</span>
      </button>
      <button onclick="TLL().catch(console.error)" title="QR주문">
        <span style="font-size: 22px;">📱</span>
      </button>
      <button id="renderMapBtn" class="active" title="지도">
        <span style="font-size: 22px;">📍</span>
      </button>
      <button onclick="renderSearch('')" title="검색">
        <span style="font-size: 22px;">🔍</span>
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

/* 상단 컨트롤 바 */
#topControlBar {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  z-index: 1003;
  display: flex;
  align-items: center;
  gap: 8px;
  pointer-events: auto;
  backdrop-filter: blur(2px);
  padding: 8px 12px 16px 12px;
}

/* 위치 선택 버튼 (텍스트 버튼) */
.location-select-btn {
  position: relative;
  height: 36px;
  padding: 0 12px;
  background: rgba(255, 255, 255, 0.05);
  border: none;
  border-radius: 18px;
  display: flex;
  align-items: center;
  gap: 6px;
  cursor: pointer;
  transition: all 0.3s ease;
  max-width: 180px;
  backdrop-filter: blur(2px);
  
}

.location-select-btn #locationText {
  font-size: 15px;
  font-weight: 800;
  color: #1f2937;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 140px;
}

.location-select-btn .dropdown-arrow {
  font-size: 10px;
  color: #1f2937;
  transition: transform 0.2s ease;
}

.location-select-btn:hover {
  background: rgba(255, 255, 255, 0.55);
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.location-select-btn:hover .dropdown-arrow {
  transform: translateY(-1px);
}

/* 일반 컨트롤 버튼들 (정렬 및 크기 조정) */
.top-control-btn {
  position: relative;
  width: 42px;
  height: 42px;
  background: transparent;
  border: none;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  font-size: 19px;
  transition: all 0.3s ease;
}

.top-control-btn:hover {
  background: rgba(255, 255, 255, 0.2);
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.top-control-spacer {
  flex: 1;
}

.notification-badge,
.cart-badge {
  position: absolute;
  top: -1px;
  right: -1px;
  background: #dc2626;
  color: white;
  font-size: 9px;
  font-weight: 600;
  padding: 1px 5px;
  border-radius: 8px;
  min-width: 14px;
  text-align: center;
}

.notification-badge.hidden,
.cart-badge.hidden {
  display: none;
}

/* 검색바 - 지도 위 오버레이 (상단 컨트롤 바 아래로) */
#searchBar {
  position: absolute;
  top: 64px;
  left: 12px;
  right: 12px;
  z-index: 1002;
  pointer-events: auto;
}

.search-container {
  display: flex;
  align-items: center;
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.65), rgba(248, 250, 252, 0.40));
  border-radius: 28px;
  padding: 10px 16px;
  box-shadow:
    0 8px 32px rgba(0, 0, 0, 0.08),
    0 4px 16px rgba(41, 126, 252, 0.04),
    inset 0 1px 0 rgba(255, 255, 255, 0.3);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.1);
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

#searchBtn, #clearBtn {
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

#clearBtn:hover {
  background: linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%);
  color: #dc2626;
  transform: scale(1.05);
  box-shadow: 0 4px 12px rgba(220, 38, 38, 0.2);
  border-color: rgba(220, 38, 38, 0.2);
}

#locationBtn, #clearBtn {
  font-size: 16px;
  margin-left: 4px;
}

#locationBtn:hover {
  background: linear-gradient(135deg, #10b981 0%, #34d399 100%);
  color: white;
  transform: scale(1.05);
  box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
  border-color: transparent;
}

/* 위치 설정 모달 */
.location-modal {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(10px);
  z-index: 9999;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  box-sizing: border-box;
}

.location-modal.hidden {
  display: none;
}

.modal-content {
  background: white;
  border-radius: 20px;
  width: 100%;
  max-width: 400px;
  max-height: 80vh;
  overflow: hidden;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.2);
  animation: modalSlideIn 0.3s ease-out;
}

@keyframes modalSlideIn {
  from {
    opacity: 0;
    transform: translateY(-50px) scale(0.9);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

.modal-header {
  padding: 20px 24px 16px 24px;
  border-bottom: 1px solid #f1f2f6;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.modal-header h3 {
  margin: 0;
  font-size: 18px;
  font-weight: 700;
  color: #2d3748;
}

.close-btn {
  background: #f7fafc;
  border: none;
  border-radius: 50%;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  font-size: 16px;
  color: #a0aec0;
  transition: all 0.2s ease;
}

.close-btn:hover {
  background: #edf2f7;
  color: #718096;
  transform: scale(1.1);
}

.modal-body {
  padding: 20px 24px 24px 24px;
  max-height: 60vh;
  overflow-y: auto;
}

.region-selection-container {
  margin-bottom: 20px;
}

.select-group {
  margin-bottom: 16px;
}

.select-group label {
  display: block;
  font-size: 14px;
  font-weight: 600;
  color: #2d3748;
  margin-bottom: 6px;
}

.region-select {
  width: 100%;
  padding: 12px 16px;
  border: 2px solid #e2e8f0;
  border-radius: 12px;
  font-size: 14px;
  background: white;
  outline: none;
  transition: all 0.2s ease;
  cursor: pointer;
}

.region-select:focus {
  border-color: #4299e1;
  box-shadow: 0 0 0 3px rgba(66, 153, 225, 0.1);
}

.region-select:disabled {
  background: #f7fafc;
  color: #a0aec0;
  cursor: not-allowed;
}

.confirm-location-btn {
  width: 100%;
  padding: 14px 20px;
  background: linear-gradient(135deg, #4299e1 0%, #3182ce 100%);
  color: white;
  border: none;
  border-radius: 12px;
  font-weight: 600;
  font-size: 15px;
  cursor: pointer;
  transition: all 0.2s ease;
  margin-top: 8px;
}

.confirm-location-btn:hover:not(:disabled) {
  background: linear-gradient(135deg, #3182ce 0%, #2c5282 100%);
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(66, 153, 225, 0.3);
}

.confirm-location-btn:disabled {
  background: #e2e8f0;
  color: #a0aec0;
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
}

.divider {
  text-align: center;
  margin: 20px 0;
  position: relative;
  color: #718096;
  font-size: 14px;
}

.divider::before {
  content: '';
  position: absolute;
  top: 50%;
  left: 0;
  right: 0;
  height: 1px;
  background: #e2e8f0;
  z-index: 1;
}

.divider span, .divider {
  background: white;
  padding: 0 16px;
  position: relative;
  z-index: 2;
}

.current-location-section {
  text-align: center;
  padding-top: 16px;
  border-top: 1px solid #e2e8f0;
}

.get-current-btn {
  padding: 12px 24px;
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
  color: white;
  border: none;
  border-radius: 12px;
  font-weight: 600;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.get-current-btn:hover {
  background: linear-gradient(135deg, #059669 0%, #047857 100%);
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
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
  z-index: 3000;
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
    if (window.MapMarkerManager && typeof window.MapMarkerManager.handleMapLevelChange === 'function') {
      try {
        window.MapMarkerManager.handleMapLevelChange(level, map);
      } catch (error) {
        console.error('❌ 줌 변경 시 마커 관리 실패:', error);
      }
    } else {
      console.warn('⚠️ MapMarkerManager가 준비되지 않음 (zoom_changed)');
    }
  });

  // 지도 이동 완료 이벤트
  kakao.maps.event.addListener(map, 'dragend', () => {
    const level = map.getLevel();
    console.log('🗺️ 지도 이동 완료 - 레벨:', level);

    // MapMarkerManager를 통한 뷰포트 기반 마커 관리
    if (window.MapMarkerManager && typeof window.MapMarkerManager.handleMapLevelChange === 'function') {
      try {
        window.MapMarkerManager.handleMapLevelChange(level, map);
      } catch (error) {
        console.error('❌ 드래그 완료 시 마커 관리 실패:', error);
      }
    } else {
      console.warn('⚠️ MapMarkerManager가 준비되지 않음 (dragend)');
    }
  });

  // 초기 마커 로딩 (MapMarkerManager 준비 상태 확인)
  const loadInitialMarkers = () => {
    if (!window.currentMap) {
      console.error('❌ 지도 인스턴스가 사라짐 - 초기 마커 로딩 취소');
      return;
    }

    // MapMarkerManager 준비 상태 확인
    if (!window.MapMarkerManager || typeof window.MapMarkerManager.handleMapLevelChange !== 'function') {
      console.warn('⚠️ MapMarkerManager 준비 대기 중... 재시도');
      setTimeout(loadInitialMarkers, 200);
      return;
    }

    const level = map.getLevel();
    console.log('🆕 초기 마커 로딩 시작 - 레벨:', level);

    try {
      window.MapMarkerManager.handleMapLevelChange(level, map);
    } catch (error) {
      console.error('❌ 초기 마커 로딩 실패:', error);
      // 한 번 더 시도
      setTimeout(() => {
        if (window.MapMarkerManager && typeof window.MapMarkerManager.handleMapLevelChange === 'function') {
          window.MapMarkerManager.handleMapLevelChange(level, map);
        }
      }, 1000);
    }
  };

  setTimeout(loadInitialMarkers, 500);

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

  // 바텀바 버튼들은 onclick 속성으로 이미 처리되므로 별도 이벤트 리스너 불필요



  // 검색 기능 구현
  const searchInput = document.getElementById('searchInput');
  const searchBtn = document.getElementById('searchBtn');
  const clearBtn = document.getElementById('clearBtn');
  const searchResults = document.getElementById('searchResults');

  let searchTimeout;

  // 통합 검색 함수 (매장 + 위치)
  async function performSearch(keyword) {
    if (!keyword.trim()) {
      searchResults.classList.add('hidden');
      return;
    }

    console.log(`🔍 통합 검색 시작: "${keyword}"`);

    try {
      // 매장 검색과 장소 검색을 동시에 실행
      console.log(`📡 매장 검색 및 장소 검색 API 호출 시작`);

      const [storeResponse, placeResults] = await Promise.all([
        fetch('/api/stores/search?query=' + encodeURIComponent(keyword)),
        searchPlaces(keyword)
      ]);

      console.log(`📡 매장 검색 응답 상태: ${storeResponse.status}`);
      console.log(`📡 장소 검색 결과: ${placeResults?.length || 0}개`);

      const storeData = await storeResponse.json();
      const stores = storeData.stores || [];

      console.log(`📊 매장 검색 결과: ${stores.length}개`);
      console.log(`📊 장소 검색 결과: ${placeResults?.length || 0}개`);

      displayCombinedResults(stores, placeResults, keyword);

      // 검색 결과창 표시
      searchResults.classList.remove('hidden');

    } catch (error) {
      console.error('❌ 통합 검색 실패:', error);
      searchResults.innerHTML = `
        <div class="search-result-item">
          <div style="text-align: center; padding: 20px; color: #e74c3c;">
            <div style="font-size: 18px; margin-bottom: 8px;">⚠️</div>
            <div style="font-weight: 600; margin-bottom: 4px;">검색 중 오류가 발생했습니다</div>
            <div style="font-size: 12px; color: #999;">잠시 후 다시 시도해주세요</div>
          </div>
        </div>
      `;
      searchResults.classList.remove('hidden');
    }
  }

  // 통합 검색 결과 표시 (매장 + 위치)
  function displayCombinedResults(stores, places, keyword) {
    console.log(`🔍 검색 결과 표시: 매장 ${stores?.length || 0}개, 장소 ${places?.length || 0}개`);

    let resultHTML = '';
    const totalResults = (stores?.length || 0) + (places?.length || 0);

    // 위치 검색 결과가 있으면 먼저 표시
    if (places && places.length > 0) {
      console.log(`📍 장소 검색 결과 표시: ${places.length}개`);
      resultHTML += `
        <div style="padding: 8px 16px; background: #f0f9ff; font-size: 12px; font-weight: 600; color: #1e40af; border-bottom: 1px solid #e0e7ff;">
          📍 위치 검색 결과 (${places.length}개)
        </div>
      `;

      resultHTML += places.slice(0, 5).map(place => `
        <div class="search-result-item location-search-item" data-lat="${place.y}" data-lng="${place.x}">
          <div class="result-name">📍 ${place.place_name}</div>
          <div class="result-info">${place.address_name} • 위치로 이동</div>
        </div>
      `).join('');
    }

    // 매장 검색 결과 표시
    if (stores && stores.length > 0) {
      console.log(`🏪 매장 검색 결과 표시: ${stores.length}개`);
      if (resultHTML) {
        resultHTML += `
          <div style="padding: 8px 16px; background: #fef3f2; font-size: 12px; font-weight: 600; color: #b91c1c; border-bottom: 1px solid #fecaca;">
            🏪 매장 검색 결과 (${stores.length}개)
          </div>
        `;
      }

      resultHTML += stores.slice(0, 7).map(store => `
        <div class="search-result-item store-search-item" data-store-id="${store.id}">
          <div class="result-name">🏪 ${store.name}</div>
          <div class="result-info">${store.category} • ${store.address || '주소 정보 없음'} • ${store.isOpen ? '운영중' : '운영중지'} • ★${store.ratingAverage || '0.0'}</div>
        </div>
      `).join('');
    }

    // 결과가 하나도 없을 때만 "검색 결과가 없습니다" 표시
    if (totalResults === 0) {
      console.log(`⚠️ "${keyword}" 검색 결과 없음`);
      resultHTML = `<div class="search-result-item">
        <div style="text-align: center; padding: 20px; color: #666;">
          <div style="font-size: 18px; margin-bottom: 8px;">🔍</div>
          <div style="font-weight: 600; margin-bottom: 4px;">"${keyword}"에 대한 검색 결과가 없습니다</div>
          <div style="font-size: 12px; color: #999;">다른 키워드로 검색해보세요</div>
        </div>
      </div>`;
    } else {
      console.log(`✅ 총 ${totalResults}개 검색 결과 표시 완료`);
    }

    searchResults.innerHTML = resultHTML;

    // 위치 검색 결과 클릭 이벤트
    searchResults.querySelectorAll('.location-search-item').forEach(item => {
      item.addEventListener('click', () => {
        const lat = parseFloat(item.dataset.lat);
        const lng = parseFloat(item.dataset.lng);
        const placeName = item.querySelector('.result-name').textContent.replace('📍 ', '');

        setCurrentLocation(lat, lng, placeName);
        hideSearchResults();
        searchInput.value = placeName;
      });
    });

    // 매장 검색 결과 클릭 이벤트
    searchResults.querySelectorAll('.store-search-item').forEach(item => {
      item.addEventListener('click', () => {
        const storeId = parseInt(item.dataset.storeId);
        const store = stores.find(s => s.id === storeId);
        if (store) {
          // 지도 중심을 해당 매장으로 이동
          if (store.coord && store.coord.lat && store.coord.lng) {
            const position = new kakao.maps.LatLng(store.coord.lat, store.coord.lng);
            map.setCenter(position);
            map.setLevel(2);
          }

          hideSearchResults();
          searchInput.value = store.name;
          console.log(`🏪 ${store.name} 위치로 지도 이동 완료`);
        }
      });
    });

    searchResults.classList.remove('hidden');
  }



  // 검색 결과 숨기기 함수
  function hideSearchResults() {
    searchResults.classList.add('hidden');
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

  // === 위치 설정 기능 ===
  const locationModal = document.getElementById('locationModal');
  const closeModal = document.getElementById('closeModal');
  const getCurrentLocationBtn = document.getElementById('getCurrentLocationBtn');

  // 현재 설정된 위치 표시용 마커
  let currentLocationMarker = null;

  // 상단 위치 선택 버튼 이벤트
  const locationSelectBtn = document.getElementById('locationSelectBtn');
  locationSelectBtn.addEventListener('click', () => {
    locationModal.classList.remove('hidden');
    loadProvinces(); // 시/도 데이터 로드
  });

  // 모달 닫기
  closeModal.addEventListener('click', () => {
    locationModal.classList.add('hidden');
    resetRegionSelects();
  });

  // 모달 외부 클릭으로 닫기
  locationModal.addEventListener('click', (e) => {
    if (e.target === locationModal) {
      locationModal.classList.add('hidden');
      resetRegionSelects();
    }
  });

  // 카카오 장소 검색 API 호출
  async function searchPlaces(query) {
    try {
      const center = map.getCenter();
      const response = await fetch(`/api/stores/search-place?query=${encodeURIComponent(query)}&x=${center.getLng()}&y=${center.getLat()}&radius=20000`);

      if (!response.ok) {
        throw new Error(`검색 실패: ${response.status}`);
      }

      const data = await response.json();

      if (data.success && data.documents && data.documents.length > 0) {
        console.log(`✅ 장소 검색 성공: ${data.documents.length}개 결과`);
        return data.documents;
      } else {
        console.warn('장소 검색 결과가 없습니다:', data);
        return [];
      }
    } catch (error) {
      console.error('장소 검색 실패:', error);
      return [];
    }
  }

  // 지역 선택 관련 변수들
  const provinceSelect = document.getElementById('provinceSelect');
  const citySelect = document.getElementById('citySelect');
  const districtSelect = document.getElementById('districtSelect');
  const confirmLocationBtn = document.getElementById('confirmLocationBtn');

  // 지역 데이터 로드
  async function loadProvinces() {
    try {
      const response = await fetch('/api/stores/regions/provinces');
      const data = await response.json();

      if (data.success) {
        provinceSelect.innerHTML = '<option value="">시/도를 선택하세요</option>';
        data.provinces.forEach(province => {
          const option = document.createElement('option');
          option.value = province;
          option.textContent = province;
          provinceSelect.appendChild(option);
        });
      }
    } catch (error) {
      console.error('시/도 데이터 로드 실패:', error);
    }
  }

  async function loadCities(province) {
    try {
      const response = await fetch(`/api/stores/regions/cities?province=${encodeURIComponent(province)}`);
      const data = await response.json();

      if (data.success) {
        citySelect.innerHTML = '<option value="">시/군/구를 선택하세요</option>';
        citySelect.disabled = false;
        data.cities.forEach(city => {
          const option = document.createElement('option');
          option.value = city;
          option.textContent = city;
          citySelect.appendChild(option);
        });

        // 하위 선택 초기화
        districtSelect.innerHTML = '<option value="">읍/면/동을 선택하세요</option>';
        districtSelect.disabled = true;
        confirmLocationBtn.disabled = true;
      }
    } catch (error) {
      console.error('시/군/구 데이터 로드 실패:', error);
    }
  }

  async function loadDistricts(province, city) {
    try {
      const response = await fetch(`/api/stores/regions/districts?province=${encodeURIComponent(province)}&city=${encodeURIComponent(city)}`);
      const data = await response.json();

      if (data.success) {
        districtSelect.innerHTML = '<option value="">읍/면/동을 선택하세요</option>';
        districtSelect.disabled = false;
        data.districts.forEach(district => {
          const option = document.createElement('option');
          option.value = district;
          option.textContent = district;
          districtSelect.appendChild(option);
        });

        confirmLocationBtn.disabled = true;
      }
    } catch (error) {
      console.error('읍/면/동 데이터 로드 실패:', error);
    }
  }

  // 지역 선택 초기화
  function resetRegionSelects() {
    provinceSelect.innerHTML = '<option value="">시/도를 선택하세요</option>';
    citySelect.innerHTML = '<option value="">시/군/구를 선택하세요</option>';
    districtSelect.innerHTML = '<option value="">읍/면/동을 선택하세요</option>';
    citySelect.disabled = true;
    districtSelect.disabled = true;
    confirmLocationBtn.disabled = true;
  }

  // 지역 선택 이벤트 리스너
  provinceSelect.addEventListener('change', (e) => {
    const province = e.target.value;
    if (province) {
      loadCities(province);
    } else {
      citySelect.innerHTML = '<option value="">시/군/구를 선택하세요</option>';
      citySelect.disabled = true;
      districtSelect.innerHTML = '<option value="">읍/면/동을 선택하세요</option>';
      districtSelect.disabled = true;
      confirmLocationBtn.disabled = true;
    }
  });

  citySelect.addEventListener('change', (e) => {
    const city = e.target.value;
    const province = provinceSelect.value;
    if (province && city) {
      loadDistricts(province, city);
    } else {
      districtSelect.innerHTML = '<option value="">읍/면/동을 선택하세요</option>';
      districtSelect.disabled = true;
      confirmLocationBtn.disabled = true;
    }
  });

  districtSelect.addEventListener('change', (e) => {
    const district = e.target.value;
    confirmLocationBtn.disabled = !district;
  });

  // 위치 확인 버튼 클릭
  confirmLocationBtn.addEventListener('click', async () => {
    const province = provinceSelect.value;
    const city = citySelect.value;
    const district = districtSelect.value;

    if (!province || !city || !district) {
      alert('모든 지역을 선택해주세요.');
      return;
    }

    try {
      // 행정기관 좌표 조회 시도
      let coords = null;
      let locationName = `${province} ${city} ${district}`;

      // 1. 시/군/구 행정기관 좌표 시도
      try {
        const adminResponse = await fetch(`/api/stores/administrative-office?regionType=sigungu&regionName=${encodeURIComponent(city)}`);
        const adminData = await adminResponse.json();

        if (adminData.success && adminData.office) {
          coords = {
            lat: adminData.office.latitude,
            lng: adminData.office.longitude
          };
          locationName = `${city} (행정기관)`;
          console.log(`✅ 시군구 행정기관 좌표 발견: ${city}`);
        }
      } catch (error) {
        console.warn('시군구 행정기관 좌표 조회 실패:', error);
      }

      // 2. 시도 행정기관 좌표 시도 (시군구 실패시)
      if (!coords) {
        try {
          const provinceResponse = await fetch(`/api/stores/administrative-office?regionType=sido&regionName=${encodeURIComponent(province)}`);
          const provinceData = await provinceResponse.json();

          if (provinceData.success && provinceData.office) {
            coords = {
              lat: provinceData.office.latitude,
              lng: provinceData.office.longitude
            };
            locationName = `${province} (도청/시청)`;
            console.log(`✅ 시도 행정기관 좌표 발견: ${province}`);
          }
        } catch (error) {
          console.warn('시도 행정기관 좌표 조회 실패:', error);
        }
      }

      // 3. 읍면동 중심점 시도 (행정기관 실패시)
      if (!coords) {
        try {
          const districtResponse = await fetch(`/api/stores/eupmyeondong-center?sido=${encodeURIComponent(province)}&sigungu=${encodeURIComponent(city)}&eupmyeondong=${encodeURIComponent(district)}`);
          const districtData = await districtResponse.json();

          if (districtData.success && districtData.center) {
            coords = {
              lat: districtData.center.latitude,
              lng: districtData.center.longitude
            };
            locationName = `${district} (중심점)`;
            console.log(`✅ 읍면동 중심점 좌표 발견: ${district}`);
          }
        } catch (error) {
          console.warn('읍면동 중심점 조회 실패:', error);
        }
      }

      // 4. 기본 좌표 API 시도 (모든 것이 실패시)
      if (!coords) {
        const response = await fetch(`/api/stores/regions/coordinates?province=${encodeURIComponent(province)}&city=${encodeURIComponent(city)}&district=${encodeURIComponent(district)}`);
        const data = await response.json();

        if (data.success && data.coordinates) {
          coords = data.coordinates;
          locationName = `${province} ${city} ${district}`;
          console.log(`✅ 기본 좌표 API 성공`);
        }
      }

      if (coords) {
        setCurrentLocation(coords.lat, coords.lng, locationName);
        locationModal.classList.add('hidden');
        resetRegionSelects();
        console.log(`📍 위치 설정 완료: ${locationName} - 행정기관 우선`);
      } else {
        alert('해당 지역의 좌표를 찾을 수 없습니다.');
      }
    } catch (error) {
      console.error('좌표 조회 실패:', error);
      alert('위치 정보를 가져올 수 없습니다.');
    }
  });

  // GPS 현재 위치 가져오기
  getCurrentLocationBtn.addEventListener('click', () => {
    if (navigator.geolocation) {
      getCurrentLocationBtn.textContent = '🔍 위치 찾는 중...';
      getCurrentLocationBtn.disabled = true;

      navigator.geolocation.getCurrentPosition(
        (position) => {
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;

          setCurrentLocation(lat, lng, '현재 GPS 위치');
          locationModal.classList.add('hidden');

          getCurrentLocationBtn.textContent = '🎯 현재 GPS 위치 사용';
          getCurrentLocationBtn.disabled = false;
        },
        (error) => {
          console.error('GPS 위치 가져오기 실패:', error);
          alert('위치 정보를 가져올 수 없습니다. 브라우저 설정에서 위치 권한을 확인해주세요.');

          getCurrentLocationBtn.textContent = '🎯 현재 GPS 위치 사용';
          getCurrentLocationBtn.disabled = false;
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 300000
        }
      );
    } else {
      alert('이 브라우저는 위치 서비스를 지원하지 않습니다.');
    }
  });

  // 현재 위치 설정 함수
  function setCurrentLocation(lat, lng, locationName) {
    const position = new kakao.maps.LatLng(lat, lng);

    // 지도 중심을 설정된 위치로 이동
    map.setCenter(position);
    map.setLevel(3);

    // 기존 위치 마커 제거 (마커 생성하지 않음)
    if (currentLocationMarker) {
      currentLocationMarker.setMap(null);
      currentLocationMarker = null;
    }

    // 위치 텍스트 업데이트
    const locationTextElement = document.getElementById('locationText');
    if (locationTextElement) {
      locationTextElement.textContent = locationName;
    }

    console.log(`📍 위치 설정 완료: ${locationName} (${lat}, ${lng})`);
  }

  // 지도 이동 시 현재 위치 정보 업데이트
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
          locationTextElement.textContent = data.eupmyeondong;
        }
      }
    } catch (error) {
      console.error('현재 위치 정보 로딩 실패:', error);
      const locationTextElement = document.getElementById('locationText');
      if (locationTextElement) {
        locationTextElement.textContent = '위치 정보 없음';
      }
    }
  };

  // 초기 위치 정보 로드
  updateLocationInfo();

  // 지도 이동 완료 시 위치 정보 업데이트
  kakao.maps.event.addListener(map, 'idle', updateLocationInfo);

  // 바텀바 지도 버튼 클릭시
  const renderMapBtn = document.getElementById('renderMapBtn');
  renderMapBtn.addEventListener('click', () => {
    if (typeof renderMap === 'function') {
      renderMap();
    } else {
      location.reload();
    }
  });

  


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

  // 장바구니 버튼 이벤트
  const cartBtn = document.getElementById('cartBtn');
  cartBtn.addEventListener('click', () => {
    // 장바구니가 있는지 확인
    if (window.savedCart && window.savedCart.order && Object.keys(window.savedCart.order).length > 0) {
      // 장바구니 내용이 있으면 장바구니 화면으로
      if (typeof renderCart === 'function') {
        renderCart(window.savedCart);
      } else {
        alert('장바구니 기능을 불러올 수 없습니다.');
      }
    } else {
      alert('장바구니가 비어있습니다.');
    }
  });

  // 장바구니 상태 업데이트 함수
  function updateCartBadge() {
    const cartBadge = document.getElementById('cartBadge');
    if (window.savedCart && window.savedCart.order) {
      const totalItems = Object.values(window.savedCart.order).reduce((a, b) => a + b, 0);
      if (totalItems > 0) {
        cartBadge.textContent = totalItems;
        cartBadge.classList.remove('hidden');
      } else {
        cartBadge.classList.add('hidden');
      }
    } else {
      cartBadge.classList.add('hidden');
    }
  }

  // 초기 장바구니 상태 업데이트
  updateCartBadge();

  // 장바구니 변경 감지를 위한 주기적 업데이트
  setInterval(updateCartBadge, 1000);

  // 전역 함수로 설정
  window.loadStoreRatingAsync = loadStoreRatingAsync;
  window.updateCartBadge = updateCartBadge;
}