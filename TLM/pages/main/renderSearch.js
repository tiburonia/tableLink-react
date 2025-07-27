function renderSearch() {
  const main = document.getElementById('main');

  main.innerHTML = `
    <header id="header">
      <h2 id="renderMainTL">매장 검색</h2>
      <div id="topControls">
        <input id="searchInput" type="text" placeholder="매장명 또는 카테고리 입력">
        <button id="doSearch">검색</button>
      </div>
    </header>

    <main id="content">
      <div id="searchResult"></div>
     
    </main>

    <nav id="bottomBar">
      <button onclick="renderMain()">🏠</button>
      <button onclick="renderSearch()">🔍</button>
      <button onclick="renderReservation()">📅</button>
      <button onclick="renderMyPage()">👤</button>
    </nav>

    <!-- renderSearch.css -->

      <style>
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
          height: 80px;
          background: white;
          border-bottom: 1px solid #ddd;
          padding: 0px;
          box-sizing: border-box;
          z-index: 1001;
          text-align: center;
        }



        #content {
          position: absolute;
          top: 80px;       /* 헤더 높이만큼 */
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
      </style>
  `;

  // 검색 기능 로직
  const searchInput = document.getElementById('searchInput');
  const doSearch = document.getElementById('doSearch');
  const resultArea = document.getElementById('searchResult');

  doSearch.addEventListener('click', async () => {
    const keyword = searchInput.value.trim().toLowerCase();
    resultArea.innerHTML = ''; // 검색 결과 초기화

    // 검색어 입력 안 했을 경우
    if (!keyword) {
      resultArea.innerHTML += '<p>검색어를 입력해주세요.</p>';
      if (!document.getElementById('searchBack')) {
        const backButton = document.createElement('button');
        backButton.textContent = '← 뒤로가기';
        backButton.id = 'searchBack';
        backButton.onclick = renderMain;
        resultArea.appendChild(backButton);
      }
      return;
    }

    try {
      // 데이터베이스에서 매장 정보 가져오기
      const response = await fetch('/api/stores');
      const data = await response.json();
      const stores = data.stores || [];

      // 검색 필터링
      const results = stores.filter(store =>
        store.name.toLowerCase().includes(keyword) ||
        store.category.toLowerCase().includes(keyword)
      );

      if (results.length === 0) {
        resultArea.innerHTML += '<p>검색 결과가 없습니다.</p>';
        if (!document.getElementById('searchBack')) {
          const backButton = document.createElement('button');
          backButton.textContent = '← 뒤로가기';
          backButton.id = 'searchBack';
          backButton.onclick = renderMain;
          resultArea.appendChild(backButton);
        }
        return;
      }

      // 검색 결과 렌더링
      results.forEach(store => {
        const p = document.createElement('p');
        const link = document.createElement('a');
        link.href = '#';
        link.textContent = store.name;

        link.addEventListener('click', (e) => {
          e.preventDefault();
          renderStore(store);
        });

        p.appendChild(link);
        p.append(` - ${store.category} (${store.distance})`);
        resultArea.appendChild(p);
      });

      if (!document.getElementById('searchBack')) {
        const backButton = document.createElement('button');
        backButton.textContent = '← 뒤로가기';
        backButton.id = 'searchBack';
        backButton.onclick = renderMain;
        resultArea.appendChild(backButton);
      }

    } catch (error) {
      console.error('매장 검색 실패:', error);
      resultArea.innerHTML += '<p>검색 중 오류가 발생했습니다.</p>';
      if (!document.getElementById('searchBack')) {
        const backButton = document.createElement('button');
        backButton.textContent = '← 뒤로가기';
        backButton.id = 'searchBack';
        backButton.onclick = renderMain;
        resultArea.appendChild(backButton);
      }
    }
  });

}
