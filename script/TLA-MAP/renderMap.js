async function renderMap() {
  const main = document.getElementById('main');

  // 캐시에서 스토어 정보 가져오기 (캐시 우선, 없으면 서버에서 가져와서 캐시 저장)
  let stores = [];
  try {
    stores = await cacheManager.getStores();
    console.log('🗺️ 지도에서 캐시된 매장 데이터 사용:', stores.length, '개 매장');
  } catch (error) {
    console.error('스토어 정보 로딩 실패:', error);
    alert('스토어 정보를 불러올 수 없습니다.');
    return;
  }

  main.innerHTML = `
    <header id="header">
      <h2 id="renderMainTL">📍 주변 가맹점 지도</h2>
    </header>

    <main id="content">
      <div id="map" style="width: 100%; height: 100%; min-height: 100vh;"></div>

      <div id="storePanel" class="collapsed">
        <div id="panelHandle"></div>
        <div id="storeListContainer">
          <!-- 여기에 가게 목록 들어감 -->
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

/* 헤더 */
#header {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  max-width: 430px;
  height: 45px;
  background: #fff;
  border-bottom: 1.2px solid #e0e0ee;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1001;
}
#renderMainTL {
  font-size: 17px;
  font-weight: 700;
  color: #297efc;
  letter-spacing: -0.5px;
}

/* 콘텐츠 전체 */
#content {
  position: absolute;
  top: 45px;
  bottom: 66px;   /* 바텀바 높이 */
  left: 0;
  width: 100%;
  max-width: 430px;
  height: calc(100vh - 111px);
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
  border-radius: 0 0 24px 24px;
  box-shadow: 0 3px 8px rgba(20,40,70,0.07);
}

/* 바텀바 */
#bottomBar {
  position: fixed;
  bottom: 0;
  left: 0;
  width: 100%;
  max-width: 430px;
  height: 66px;
  background: rgba(255,255,255,0.98);
  border-top: 1.5px solid #e2e6ee;
  box-shadow: 0 -2px 16px 2px rgba(20,40,90,0.07), 0 -1.5px 6px rgba(70,110,180,0.06);
  display: flex;
  justify-content: space-between;
  align-items: center;
  z-index: 1000;
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
  left: 0;
  width: 100%;
  max-width: 430px;
  background: #fff;
  border-top-left-radius: 16px;
  border-top-right-radius: 16px;
  box-shadow: 0 -2px 14px rgba(30, 60, 120, 0.13);
  overflow: hidden;
  transition: height 0.3s cubic-bezier(.68,-0.55,.27,1.55);
  z-index: 11;
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
}
#storeListContainer::-webkit-scrollbar { width: 6px; }
#storeListContainer::-webkit-scrollbar-thumb { background: #e3e6ee; border-radius: 3px; }

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

  // 지도 생성
  const container = document.getElementById('map');
  const options = {
    center: new kakao.maps.LatLng(37.5665, 126.9780),
    level: 3
  };

  const map = new kakao.maps.Map(container, options);

  // 마커 생성
  stores.forEach(store => {
    if (!store.coord) return;
    const marker = new kakao.maps.Marker({
      map,
      position: new kakao.maps.LatLng(store.coord.lat, store.coord.lng),
      title: store.name
    });

    kakao.maps.event.addListener(marker, 'click', () => {
      renderStore(store);
    });
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


  // 가게 목록 출력
  const storeListContainer = document.getElementById('storeListContainer');
  stores.forEach(store => {
    const card = document.createElement('div');
    card.className = 'storeCard';

    card.innerHTML = `
      <div class="storeInfoBox">
        <div class="storeRatingBox">⭐</div>
        <div class="storeTextBox">
          <div class="storeName">${store.name}</div>
          <div class="storeDistance">${store.category}</div>
        </div>
      </div>
      <div class="storeImageBox">
  <img src="TableLink.png" alt="가게 이미지" />
</div>


      <style>

      .storeImageBox {
        border: 2px solid black;
        border-radius: 12px;
        height: 120px;
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
        object-fit: contain;
        border: none;
      }

      .storeCard {
        border: 2px solid black;
        border-radius: 16px;
        padding: 12px;
        margin-bottom: 12px;
        background: white;
        box-sizing: border-box;
      }

      .storeInfoBox {
        display: flex;
        align-items: flex-start;
        margin-bottom: 8px;
      }

      /* 좌측 별점 영역 (지금은 비워둠) */
      .storeRatingBox {
        width: 60px;
        height: 60px;
        border: 2px solid black;
        border-radius: 8px;
        box-sizing: border-box;
        margin-right: 8px;
      }

      /* 텍스트 영역 (이름 + 거리) */
      .storeTextBox {
        flex-grow: 1;
      }

      .storeName {
        border: 2px solid black;
        padding: 4px 8px;
        margin-bottom: 4px;
        font-weight: bold;
        font-size: 15px;
      }

      .storeDistance {
        border: 2px solid black;
        padding: 4px 8px;
        font-size: 13px;
      }

      /* 가게 이미지 영역 */
      .storeImageBox {
        border: 2px solid black;
        border-radius: 12px;
        height: 120px;
        margin-top: 8px;
        text-align: center;
        line-height: 120px;
        font-size: 14px;
        background: #f5f5f5;
      }

      </style>
    `;
    // 카드 클릭 시 해당 가게의 상세 페이지로 이동
    card.addEventListener('click', () => renderStore(store));
    storeListContainer.appendChild(card);
  });

}