async function renderMain() {
  // 캐시에서 스토어 정보 가져오기 (캐시 우선, 없으면 서버에서 가져와서 캐시 저장)
  let stores = [];
  try {
    stores = await cacheManager.getStores();
    console.log('🏪 메인에서 캐시된 매장 데이터 사용:', stores.length, '개 매장');
  } catch (error) {
    console.error('스토어 정보 로딩 실패:', error);
    alert('스토어 정보를 불러올 수 없습니다.');
    return;
  }

  main.innerHTML = `
    <div id="header">
      <h2 id= "renderMainTL">TableLink</h2>

    </div>

    <div id="content">
      <div id="storeList"></div>
    </div>

    <nav id="bottomBar">
      <button id= "TLL">📱</button>
      <button id= "search">🔍</button>
      <button id= "map">🗺️</button>
      <button id= "myPage">👤</button>
      <button id= "logOut">👋</button>
    </nav>
    <!-- renderMain.css -->
   <style>

    html, body {
      margin: 0;
      padding: 0;
      height: 100%;
      background: #f8f8f8;
      font-family: sans-serif;
      overflow: hidden; /* 💡 전체 스크롤 막고, content만 스크롤되게 */
    }

    #header {
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      max-width: 430px;
      height: 45px;
      background: white;
      border-bottom: 1px solid #ddd;
      padding: 0px;
      box-sizing: border-box;
      z-index: 1001;
      text-align: center;
    }



    #content {
      position: absolute;
      top: 45px;       /* 헤더 높이만큼 */
      bottom: 60px;    /* 바텀 바 높이만큼 */
      left: 0;
      width: 100%;
      max-width: 430px;
      overflow-y: auto;  /* ✅ 여기만 스크롤! */
      padding: 0px;
      box-sizing: border-box;
      background: #fdfdfd;
      z-index: 1;
    }

    #bottomBar {
      position: fixed;
      bottom: 0;
      left: 0;
      width: 100%;
      max-width: 430px;
      height: 60px;
      background: white;
      display: flex;
      justify-content: space-around;
      align-items: center;
      border-top: 1px solid #ccc;
      z-index: 1000;
    }

    #topControls {

      transform: translateY(-30px); /* 정확히 10px 위로 올리기 */
    }

    #content {
      position: absolute;
      bottom: 60px;
      left: 0;
      width: 100%;
      max-width: 430px;
      overflow-y: auto;
      padding: 20px 14px;
      box-sizing: border-box;
      background: #fdfdfd;
    }

    #storeList p {
      margin: 10px 0;
      font-size: 16px;         /* 글씨 크게 */
      line-height: 1.5;        /* 줄간격 넉넉히 */
    }



    #renderMainTL {
      transform: translateY(-15px);
    }



   </style>


  `;

  // DOM 요소 선택
  const TLL = document.querySelector('#TLL');
  const map = document.querySelector('#map');
  const search = document.querySelector('#search');
  const storeList = document.querySelector('#storeList');
  const logOut = document.querySelector('#logOut');
  const myPage = document.querySelector('#myPage');

  // 가게 목록 렌더링
  stores.forEach(store => {
    const p = document.createElement('p');
    const link = document.createElement('a');
    link.href = '#';
    link.textContent = store.name;

    p.appendChild(link);
    p.append(` - ${store.category} (${store.distance})`);
    storeList.appendChild(p);

    link.addEventListener('click', (e) => {
      e.preventDefault();
      renderStore(store);
    });
  });

  // 검색화면 이동
  search.addEventListener('click', () => {
    renderSearch()
  })
  // QR 결제 버튼 (현재 미구현)
  TLL.addEventListener('click', () => {
    alert('QR 결제 기능은 아직 준비 중입니다');
  });

  // 로그아웃 버튼 클릭 이벤트
  logOut.addEventListener('click', () => {
   logOutF()
  })

  // 지도 화면으로 이동
  map.addEventListener('click', async () => {
    await renderMap()
  })

  // 마이페이지 버튼 클릭 이벤트
  myPage.addEventListener('click', () => {
    renderMyPage()
  })

}

// 전역 함수로 등록
window.renderMain = renderMain;