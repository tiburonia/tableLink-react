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

  // 마커 배열 및 데이터 초기화 (재렌더링 시에도 초기화)
  window.currentMarkers = [];
  window.lastStoreData = [];
  window.markerMap = new Map();
  
  console.log('🔄 renderMap: 마커 데이터 초기화 완료');


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
      } else {
        console.warn('⚠️ DOM은 준비되었지만 매장 데이터가 없거나 컨테이너를 찾을 수 없음');
      }
    } else {
      console.error('❌ DOM 준비 실패: 매장 목록 업데이트 불가');
    }
  });

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

// 매장 별점 정보 비동기 로딩 함수 (전역 함수로 정의)
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

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();

    if (data.success && Array.isArray(data.stores)) {
      stores = data.stores;
      console.log('🗺️ 서버에서 매장 데이터 로드 성공:', stores.length, '개 매장');

      // 캐시 업데이트 (안전하게 처리)
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
  } catch (error) {
    console.error('❌ 서버에서 매장 데이터 로드 실패:', error);

    // 서버 요청 실패 시 캐시에서 데이터 사용
    if (typeof window.cacheManager !== 'undefined' && typeof window.cacheManager.getStores === 'function') {
      try {
        stores = await window.cacheManager.getStores();
        if (Array.isArray(stores) && stores.length > 0) {
          console.log('📁 캐시에서 매장 데이터 사용:', stores.length, '개 매장');
        } else {
          console.error('❌ 캐시에서 가져온 데이터가 유효하지 않음');
          return;
        }
      } catch (cacheError) {
        console.error('❌ 캐시에서도 매장 데이터를 가져올 수 없음:', cacheError);
        return;
      }
    } else {
      console.error('❌ 캐시 매니저를 사용할 수 없음');
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

  // 렌더링이 새로 시작되었거나 마커가 없는 경우 강제로 모든 마커 생성
  const hasNoMarkers = !window.markerMap || window.markerMap.size === 0;
  const isInitialRender = !window.lastStoreData || window.lastStoreData.length === 0;
  
  if (totalChanges === 0 && !hasNoMarkers && !isInitialRender) {
    console.log('📍 매장 데이터 변경사항 없음 - 마커 업데이트 건너뛰기');
    // 매장 목록은 업데이트 (UI 새로고침 용도)
    setTimeout(() => {
      const storeListContainer = document.getElementById('storeListContainer');
      if (storeListContainer) {
        updateStoreList(stores, storeListContainer);
      }
    }, 100);
    return;
  }
  
  if (hasNoMarkers || isInitialRender) {
    console.log('🔄 마커가 없거나 초기 렌더링 - 모든 마커를 새로 생성');
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

  // 새로운/수정된 마커 생성 (비동기로 처리)
  setTimeout(async () => {
    // 새로 추가된 매장의 마커 생성
    for (const store of storeChanges.added) {
      const marker = await window.MapMarkerManager.createCustomMarker(store, map);
      if (marker) {
        window.markerMap.set(store.id, marker);
        console.log(`➕ 매장 ${store.name} 새 마커 생성`);
      }
    }

    // 수정된 매장의 마커 재생성
    for (const { new: store } of storeChanges.updated) {
      const marker = await window.MapMarkerManager.createCustomMarker(store, map);
      if (marker) {
        window.markerMap.set(store.id, marker);
        console.log(`🔄 매장 ${store.name} 마커 업데이트 완료`);
      }
    }

    // 현재 마커 배열 업데이트 (역호환성 유지)
    window.currentMarkers = Array.from(window.markerMap.values());

    console.log(`✅ 마커 업데이트 완료 - 총 ${window.markerMap.size}개 마커 활성화`);

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

// 매장 목록 업데이트 함수 분리
async function updateStoreList(stores, storeListContainer) {

  try {
    storeListContainer.innerHTML = ''; // 로딩 메시지 제거

    // 매장 목록에서도 별점 정보 비동기 로딩
    for (const store of stores) {
      const card = document.createElement('div');
      card.className = 'storeCard';

      // 별점 정보 비동기 로딩
      const ratingData = await window.loadStoreRatingAsync(store.id);

      // 운영 상태 실시간 확인
      console.log(`🏪 매장 ${store.name} 운영 상태: ${store.isOpen ? '운영중' : '운영중지'}`);

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
    }

    console.log(`✅ 매장 목록 업데이트 완료: ${stores.length}개 매장`);
  } catch (error) {
    console.error('❌ 매장 목록 업데이트 중 오류:', error);
  }

}