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
  `;

  // 검색 기능 로직
  const searchInput = document.getElementById('searchInput');
  const doSearch = document.getElementById('doSearch');
  const resultArea = document.getElementById('searchResult');


  doSearch.addEventListener('click', () => {
    const keyword = searchInput.value.trim().toLowerCase();
    resultArea.innerHTML = ''; // 검색 결과 초기화

    // ✅ 뒤로가기 버튼이 이미 없을 때만 생성


    // 검색어 입력 안 했을 경우
    if (!keyword) {
      resultArea.innerHTML += '<p>검색어를 입력해주세요.</p>';
      if (!document.getElementById('searchBack')) {
        const backButton = document.createElement('button');
        backButton.textContent = '← 뒤로가기';
        backButton.id = 'searchBack'; // 중복 방지용 ID 부여
        backButton.onclick = renderMain;
        resultArea.appendChild(backButton)}
      return;
      
    }

    const results = stores.filter(store =>
      store.name.toLowerCase().includes(keyword) ||
      store.category.toLowerCase().includes(keyword)
    );

    if (results.length === 0) {
      resultArea.innerHTML += '<p>검색 결과가 없습니다.</p>';
      if (!document.getElementById('searchBack')) {
        const backButton = document.createElement('button');
        backButton.textContent = '← 뒤로가기';
        backButton.id = 'searchBack'; // 중복 방지용 ID 부여
        backButton.onclick = renderMain;
        resultArea.appendChild(backButton)}
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
      backButton.id = 'searchBack'; // 중복 방지용 ID 부여
      backButton.onclick = renderMain;
      resultArea.appendChild(backButton);
    }
  });

}
