let rendermain = function () {



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

    `;

// 버튼 및 입력 요소 선택
const TLL = document.querySelector('#TLL');
const map = document.querySelector('#map');
const search = document.querySelector('#search');
const reset = document.querySelector('#reset');
const list = document.querySelector('#list');


// 매장 목록을 HTML에 추가
stores.forEach(store => {
  const p = document.createElement('p');

  const link = document.createElement('a');
  link.href = `#`
  link.textContent = store.name;