//가게 메뉴 진입 함수
const renderStore = (store) => {

  //첫주문 쿠폰 발급 alert
  /*
  if (userInfo.orderList.length === 0) {
    alert('첫 주문 시 10% 할인 쿠폰이 발급됩니다.');

  }
  */

  main.innerHTML = `
    <div style="position: relative;">
      <h1>TableLink</h1>
      <label for="favoriteBtn"><strong>즐겨찾기</strong></label>
      <button id="favoriteBtn" class="favorite-btn" >♡</button>
    </div>
    <br>
    <h4>store</h4>
    <br>
    <p>매장명 : ${store.name}</p>
    <p>카테고리 : ${store.category}</p>
    <p>매장까지의 거리 : ${store.distance}</p>
    <button id="order">메뉴주문</button>
    <br><br><br>
    <button id="reservation">예약하기</button>
    <p>매장까지의 거리 : ${store.distance}</p>
    <button id="back">뒤로가기</button>
  `;

  //주문,예약,돌아가기 버튼
  document.querySelector('#order').addEventListener('click', () => renderOrderScreen(store));
  document.querySelector('#reservation').addEventListener('click', () =>
    renderReservationScreen(store));
  document.querySelector('#back').addEventListener('click', () => renderMain());


  document.getElementById('favoriteBtn').addEventListener('click', () => {
    toggleFavorite(store.name);
  });
  updateFavoriteBtn(store.name);

}





