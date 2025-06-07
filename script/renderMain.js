// 메인 화면 렌더링 함수
function renderMain() {


  console.log('renderMain 작동함')
  // 메인 화면 HTML 삽입
  main.innerHTML = `
          <h1>TableLink</h1>
          <br>
          <h4>main</h4>
          <br>
          <button id='TLL'>QR결제</button>
          <input id='map' type='text' placeholder='주변매장검색'>        
          <button id='search'>검색</button>
          <br><br><br>
          <button id='reset'>로그아웃</button>
          <div id='list'></div>
          <button id= 'myPage'>마이페이지</button>
        `;

  // 버튼 및 입력 요소 선택
  const TLL = document.querySelector('#TLL');
  const map = document.querySelector('#map');
  const search = document.querySelector('#search');
  const reset = document.querySelector('#reset');
  const list = document.querySelector('#list');
  const myPage = document.querySelector('#myPage');



  // 매장 목록을 HTML에 추가
  stores.forEach(store => {
    const p = document.createElement('p');

    const link = document.createElement('a');
    link.href = `#`
    link.textContent = store.name;

    p.appendChild(link);
    p.append(` - ${store.category} (${store.distance})`);
    list.appendChild(p);

    link.addEventListener('click', (e) => {
      e.preventDefault();
      renderStore(store); // 기존 정의된 함수 사용
    });
  });

  // QR 결제 버튼 (현재 미구현)
  TLL.addEventListener('click', () => {
    alert('QR 결제 기능은 아직 준비 중입니다');
  });

  // 검색 버튼 클릭 이벤트

  search.addEventListener('click', () => {
    const keyword = map.value.trim().toLowerCase();
    list.innerHTML = ''; // 기존 목록 초기화

    if (keyword === '') {
      alert('검색어를 입력하세요');
      return;
    }

    const results = stores.filter(store =>
      store.name.toLowerCase().includes(keyword) ||
      store.category.toLowerCase().includes(keyword)
    );

    if (results.length === 0) {
      list.innerHTML = '<p>검색 결과가 없습니다</p>';
      return;
    }

    results.forEach(store => {
      const p = document.createElement('p');
      const link = document.createElement('a');
      link.href = '#';
      link.textContent = store.name;

      link.addEventListener('click', (e) => {
        e.preventDefault();
        renderStore(store); // 기존 정의된 함수 사용
      });

      p.appendChild(link);
      p.append(` - ${store.category} (${store.distance})`);
      list.appendChild(p);
    });
  });


  // 로그아웃 버튼 클릭 이벤트
  reset.addEventListener('click', () => {
    renderLogin(); // 로그인 화면으로 다시 돌아감
  });

  // 마이페이지 버튼 클릭 이벤트
  myPage.addEventListener('click', () => {
    renderMyPage() // 마이페이지 화면 렌더링 
  })
  
  
  
}


