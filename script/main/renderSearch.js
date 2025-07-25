async function renderSearch() {
  const main = document.getElementById('main');

  main.innerHTML = `
    <h1>TableLink</h1>
    <br>
    <h4>🔍 매장 검색</h4>
    <input type="text" id="searchInput" placeholder="매장명 또는 카테고리 입력">
    <button id="doSearch">검색</button>
    <br><br>
    <div id="searchResult"></div>

    <style>
      #main {
        padding: 20px;
        font-family: Arial, sans-serif;
      }

      #searchInput {
        width: 70%;
        padding: 10px;
        margin: 10px 5px;
        border: 1px solid #ddd;
        border-radius: 5px;
        font-size: 16px;
      }

      #doSearch {
        padding: 10px 15px;
        background: #007bff;
        color: white;
        border: none;
        border-radius: 5px;
        cursor: pointer;
      }

      #searchResult {
        margin-top: 20px;
      }

      #searchResult p {
        margin: 10px 0;
        padding: 10px;
        background: #f5f5f5;
        border-radius: 5px;
      }

      #searchResult a {
        text-decoration: none;
        color: #333;
        font-weight: bold;
      }

      #searchResult a:hover {
        color: #007bff;
      }

      #searchBack {
        margin-top: 20px;
        padding: 10px 15px;
        background: #6c757d;
        color: white;
        border: none;
        border-radius: 5px;
        cursor: pointer;
      }
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
      addBackButton();
      return;
    }

    try {
      // 캐시에서 검색 (서버 요청 없음)
      const results = cacheManager.searchStores(keyword);

      if (results.length === 0) {
        resultArea.innerHTML += '<p>검색 결과가 없습니다.</p>';
        addBackButton();
        return;
      }

      // 검색 결과 즉시 렌더링
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

      addBackButton();

    } catch (error) {
      console.error('매장 검색 실패:', error);
      resultArea.innerHTML = '<p>검색 중 오류가 발생했습니다.</p>';
      addBackButton();
    }
  });

  // 엔터키로 검색
  searchInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      doSearch.click();
    }
  });

  function addBackButton() {
    if (!document.getElementById('searchBack')) {
      const backButton = document.createElement('button');
      backButton.textContent = '← 뒤로가기';
      backButton.id = 'searchBack';
      backButton.onclick = renderMain;
      resultArea.appendChild(backButton);
    }
  }
}

window.renderSearch = renderSearch;