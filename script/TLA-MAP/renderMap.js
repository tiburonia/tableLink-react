function renderMap() {
  const main = document.getElementById('main');

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
      <button onclick="LogOutF()">👋</button>
    </nav>

   <style>  
    /* 🔷 전체 레이아웃 초기화 */
html, body {
  margin: 0;
  padding: 0;
  height: 100%;
  font-family: sans-serif;
  background: #f8f8f8;
  overflow: hidden; /* content만 스크롤되도록 제한 */
}

/* 🔷 헤더 (상단 고정) */
#header {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  max-width: 430px;
  height: 45px;
  background: white;
  border-bottom: 1px solid #ddd;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1001;
}

#renderMainTL {
  transform: translateY(-2px);
  font-size: 16px;
}

/* 🔷 메인 콘텐츠 영역 */
#content {
  position: absolute;
  top: 45px;         /* header 높이 */
  bottom: 60px;      /* bottomBar 높이 */
  left: 0;
  width: 100%;
  max-width: 430px;
  height: calc(100vh - 105px); /* header + bottomBar 제외한 높이 */
  overflow: hidden;
  background: #fdfdfd;
  z-index: 1;
}

/* 🔷 지도 영역 */
#map {
  width: 100%;
  height: 100%;
  position: relative;
  z-index: 0;
}

/* 🔷 하단 고정 바 */
#bottomBar {
  position: fixed;
  bottom: 0;
  left: 0;
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

/* 🔷 스토어 패널 (밀어올리는 바) */
#storePanel {
   position: fixed;
  bottom: 60px;
  left: 0;
  width: 100%;
  max-width: 430px;
  z-index: 1002;
  background: white;
  border-top-left-radius: 16px;
  border-top-right-radius: 16px;
  box-shadow: 0 -2px 10px rgba(0, 0, 0, 0.1);
  overflow: hidden;
  transition: height 0.3s ease;
  z-index: 10;
}

/* 접힘/펼침 상태 */
#storePanel.collapsed {
  height: 60px;
}

#storePanel.expanded {
  height: 550px;
}

/* 🔷 드래그 핸들 */
#panelHandle {
  width: 40px;
  height: 6px;
  background: #ccc;
  border-radius: 3px;
  margin: 8px auto;
  cursor: pointer;
}

/* 🔷 가게 목록 컨테이너 */
#storeListContainer {
  height: calc(100% - 20px); /* 핸들 공간 제외 */
  overflow-y: auto;
  padding: 8px 12px;
  box-sizing: border-box;
}

#storeListContainer p {
  margin: 8px 0;
  font-size: 15px;
  cursor: pointer;
  line-height: 1.4;
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
  const TLL = document.querySelector('#TLL')
  TLL.addEventListener('click', () => {
    alert('QR 결제 기능은 아직 준비 중입니다');
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
      panel.style.height = '550px';
    } else if (delta < -50) {
      panel.classList.add('collapsed');
      panel.classList.remove('expanded');
      panel.style.height = '60px';
    } else {
      const target = panel.classList.contains('expanded') ? '550px' : '60px';
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
        <div class="storeRatingBox"></div>
        <div class="storeTextBox">
          <div class="storeName">${store.name}</div>
          <div class="storeDistance">${store.distance}</div>
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

    card.addEventListener('click', () => renderStore(store));
    storeListContainer.appendChild(card);
  });

}


