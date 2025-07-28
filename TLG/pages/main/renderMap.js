async function renderMap() {
  const main = document.getElementById('main');

  // UI 먼저 렌더링
  main.innerHTML = `
    <main id="content">
      <div id="map" style="width: 100%; height: 100%; min-height: 100vh;"></div>

      <div id="storePanel" class="collapsed">
        <div id="panelHandle"></div>
        <div id="storeListContainer">
          <div class="loading-message" style="text-align: center; padding: 20px; color: #666;">
            <div class="loading-spinner" style="margin: 0 auto 10px auto; width: 30px; height: 30px; border: 3px solid #e0e0e0; border-top: 3px solid #297efc; border-radius: 50%; animation: spin 1s linear infinite;"></div>
            매장 정보를 불러오는 중...
          </div>
        </div>
      </div>
    </main>

    <nav id="bottomBar">
      <button id= "TLL">📱</button>
      <button onclick="renderSearch()">🔍</button>
      <button>🗺️</button>
      <button onclick="renderMyPage()">👤</button>
      <button onclick="logOutF()">👋</button>
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

/* 패널 */
#storePanel {
  position: fixed;
  bottom: 66px;
  left: 50%;
  transform: translateX(-50%);
  width: 100%;
  max-width: 430px;
  background: #fff;
  border-top-left-radius: 16px;
  border-top-right-radius: 16px;
  box-shadow: 0 -2px 14px rgba(30, 60, 120, 0.13);
  overflow: hidden;
  transition: height 0.3s cubic-bezier(.68,-0.55,.27,1.55);
  z-index: 1002;
  border: 1.1px solid #f1f2fb;
}
#storePanel.collapsed { height: 60px; }
#storePanel.expanded { height: 630px; }
#panelHandle {
  width: 44px;
  height: 7px;
  background: #e0e3f3;
  border-radius: 4px;
  margin: 10px auto 6px auto;
  cursor: pointer;
  opacity: 0.8;
}

/* 가게 목록 스크롤 영역 */
#storeListContainer {
  height: calc(100% - 23px); /* 핸들 공간 빼고 */
  overflow-y: auto;
  padding: 8px 4px 20px 4px;
  box-sizing: border-box;
  /* 스크롤바 숨김 */
  scrollbar-width: none; /* Firefox */
  -ms-overflow-style: none; /* IE/Edge */
}
#storeListContainer::-webkit-scrollbar {
  display: none; /* Chrome, Safari, Opera */
}
/* 개별 가게 카드 */
.storeCard {
  border-radius: 16px;
  padding: 14px 12px 11px 12px;
  margin-bottom: 13px;
  background: #fff;
  box-shadow: 0 1.5px 7px rgba(40,80,170,0.08);
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  transition: box-shadow 0.13s;
  border: 1.3px solid #e7eaf5;
  cursor: pointer;
}
.storeCard:active {
  box-shadow: 0 3px 13px rgba(40,110,255,0.11);
  border-color: #b7cdfa;
}

.storeInfoBox {
  display: flex;
  align-items: flex-start;
  margin-bottom: 7px;
}
.storeRatingBox {
  width: 48px;
  height: 48px;
  border-radius: 9px;
  background: #f5f7fb;
  margin-right: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 17px;
  color: #f8b900;
  box-shadow: 0 1px 3px rgba(180,170,110,0.04);
}
.storeTextBox {
  flex-grow: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
}
.storeName {
  font-weight: bold;
  font-size: 16.5px;
  color: #23274c;
  margin-bottom: 3px;
  letter-spacing: -0.1px;
}
.storeDistance {
  font-size: 13.5px;
  color: #88a;
  font-weight: 500;
}
.storeImageBox {
  border-radius: 10px;
  height: 100px;
  margin-top: 8px;
  background: #f5f5f5;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
}
.storeImageBox img {
  height: 100%;
  width: auto;
  object-fit: cover;
  border: none;
  max-width: 100%;
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

  // 패널 핸들링 설정
  window.MapPanelManager.initializePanelHandling();

  //TLL 버튼 클릭 로직
  const renderTLL = document.querySelector('#TLL')
  renderTLL.addEventListener('click', async () => {
    await TLL();
  })

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
    // 캐시에서 스토어 정보 가져오기
    stores = await cacheManager.getStores();
    console.log('🗺️ 지도에서 캐시된 매장 데이터 사용:', stores.length, '개 매장');

    // 커스텀 마커 생성 (비동기로 처리하여 UI 블로킹 방지)
    setTimeout(() => {
      stores.forEach(async (store) => {
        if (!store.coord) return;

        // 매장 운영 상태 확인
        const isOpen = store.isOpen !== false; // 기본값은 true로 처리
        const statusIcon = isOpen ? '🟢' : '🔴';
        const statusText = isOpen ? '운영중' : '운영중지';
        const statusColor = isOpen ? '#4caf50' : '#f44336';

        // 별점 정보 비동기 로딩 및 캐시 처리
        let rating = '0.0';
        await loadStoreRatingAsync(store.id).then(ratingData => {
          if (ratingData) {
            rating = parseFloat(ratingData.ratingAverage).toFixed(1);
          }
        });

        // 간단하고 작은 커스텀 마커 HTML 생성
        const customOverlayContent = `
          <div class="compact-marker" onclick="renderStore(${JSON.stringify(store).replace(/"/g, '&quot;')})">
            <div class="marker-pin">
              <div class="pin-head" style="background-color: ${statusColor};">
                <span class="pin-rating">★${rating}</span>
              </div>
              <div class="pin-point"></div>
            </div>
            <div class="marker-label">
              <span class="store-name">${store.name}</span>
              <span class="store-status" style="color: ${statusColor};">${statusIcon}</span>
            </div>
          </div>

          <style>
            .compact-marker {
              position: relative;
              cursor: pointer;
              z-index: 10;
            }

            .marker-pin {
              display: flex;
              flex-direction: column;
              align-items: center;
              margin-bottom: 2px;
            }

            .pin-head {
              width: 32px;
              height: 32px;
              border-radius: 50% 50% 50% 0;
              transform: rotate(-45deg);
              display: flex;
              align-items: center;
              justify-content: center;
              box-shadow: 0 2px 6px rgba(0,0,0,0.3);
              border: 2px solid white;
            }

            .pin-rating {
              color: white;
              font-size: 9px;
              font-weight: bold;
              transform: rotate(45deg);
              white-space: nowrap;
            }

            .pin-point {
              width: 0;
              height: 0;
              border-left: 4px solid transparent;
              border-right: 4px solid transparent;
              border-top: 6px solid ${statusColor};
              margin-top: -3px;
            }

            .marker-label {
              background: rgba(255, 255, 255, 0.95);
              border: 1px solid #ddd;
              border-radius: 12px;
              padding: 3px 8px;
              font-size: 10px;
              font-weight: 600;
              text-align: center;
              box-shadow: 0 1px 4px rgba(0,0,0,0.2);
              backdrop-filter: blur(3px);
              white-space: nowrap;
              display: flex;
              align-items: center;
              gap: 4px;
              max-width: 120px;
              position: absolute;
              left: -60px;
              top: -45px;
              width: 120px;
            }

            .store-name {
              color: #333;
              overflow: hidden;
              text-overflow: ellipsis;
              flex: 1;
            }

            .store-status {
              font-size: 8px;
            }

            .compact-marker:hover .pin-head {
              transform: rotate(-45deg) scale(1.1);
              box-shadow: 0 3px 8px rgba(0,0,0,0.4);
            }

            .compact-marker:hover .marker-label {
              background: rgba(255, 255, 255, 1);
              transform: translateX(-50%) scale(1.05);
            }

            .compact-marker:active .pin-head {
              transform: rotate(-45deg) scale(0.95);
            }
          </style>
        `;

        // 커스텀 오버레이 생성 (정확한 위치 지정)
        const customOverlay = new kakao.maps.CustomOverlay({
          map: map,
          position: new kakao.maps.LatLng(store.coord.lat, store.coord.lng),
          content: customOverlayContent,
          yAnchor: 0.95, // 핀의 끝부분이 정확한 위치를 가리키도록 미세 조정
          xAnchor: 0.5   // 중앙 정렬
        });
      });
      console.log('🗺️ 커스텀 마커 표시 완료:', stores.length, '개 매장');
    }, 100);

    // 매장 리스트 렌더링
    window.MapPanelManager.renderStoreList(stores);

  } catch (error) {
    console.error('스토어 정보 로딩 실패:', error);
    const storeListContainer = document.getElementById('storeListContainer');
    storeListContainer.innerHTML = '<div style="text-align: center; padding: 20px; color: #ff6b6b;">매장 정보를 불러올 수 없습니다.</div>';
  }
}