async function renderMain() {
  const main = document.getElementById('main');

  // 로딩 화면 표시
  main.innerHTML = `
    <div style="text-align: center; padding: 50px;">
      <h1>TableLink</h1>
      <p>매장 정보를 불러오는 중...</p>
    </div>
  `;

  try {
    // 캐시에서 매장 데이터 가져오기
    const stores = await cacheManager.getStores();

    main.innerHTML = `
      <h1>TableLink</h1>
      <br>
      <h4>📍 주변 가맹점</h4>
      <div id="storeList"></div>
      <br><br>
      <button id="search">🔍 검색</button>
      <button id="map">🗺️ 지도</button>
      <button id="TLL">📱 QR 결제</button>
      <button id="myPage">👤 마이페이지</button>
      <button id="logOut">👋 로그아웃</button>

      <style>
        #main {
          padding: 20px;
          font-family: Arial, sans-serif;
        }

        #storeList {
          margin: 20px 0;
        }

        #storeList p {
          margin: 10px 0;
          padding: 10px;
          background: #f5f5f5;
          border-radius: 5px;
        }

        #storeList a {
          text-decoration: none;
          color: #333;
          font-weight: bold;
        }

        #storeList a:hover {
          color: #007bff;
        }

        button {
          margin: 5px;
          padding: 10px 15px;
          background: #007bff;
          color: white;
          border: none;
          border-radius: 5px;
          cursor: pointer;
        }

        button:hover {
          background: #0056b3;
        }
      </style>
    `;

    // 요소 선택
    const storeList = document.getElementById('storeList');
    const search = document.getElementById('search');
    const map = document.getElementById('map');
    const TLL = document.getElementById('TLL');
    const myPage = document.getElementById('myPage');
    const logOut = document.getElementById('logOut');

    // 매장 목록 렌더링 (즉시 표시)
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

    // 버튼 이벤트 리스너
    search.addEventListener('click', () => renderSearch());
    map.addEventListener('click', () => renderMap());
    TLL.addEventListener('click', () => {
      alert('QR 결제 기능은 아직 준비 중입니다');
    });
    myPage.addEventListener('click', () => renderMyPage());
    logOut.addEventListener('click', () => logOutF());

  } catch (error) {
    console.error('메인 화면 로딩 실패:', error);
    main.innerHTML = `
      <h1>TableLink</h1>
      <p>데이터를 불러오는 중 오류가 발생했습니다.</p>
      <button onclick="location.reload()">새로고침</button>
    `;
  }
}

window.renderMain = renderMain;