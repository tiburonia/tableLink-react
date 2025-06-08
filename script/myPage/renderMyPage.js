function renderMyPage() {
  // 마이페이지 화면 HTML 삽입
  main.innerHTML = `
    <h1>TableLink</h1>
    <br>
    <div id='orderList'>
      <h2>주문내역</h2>
    </div>
    <br><br>
    <div id='reservationList'>
      <h2>예약내역</h2>
    </div>
    <br><br>
    <button id='info'>내 계정</button> 
    <button id='back'>뒤로가기</button>
  `;

  // 요소 선택
  const orderList = document.querySelector('#orderList');
  const reservationList = document.querySelector('#reservationList');
  const info = document.querySelector('#info');
  const back = document.querySelector('#back');

  // 주문내역 렌더링
  if (userInfo.orderList.length > 0) {
    userInfo.orderList.forEach(order => {
      const p = document.createElement('p');
      const items = order.items.map(i => `${i.name}(${i.qty}개)`).join(', ');
      p.innerHTML = `
        • <strong>${order.store}</strong><br>
        ${items}<br>
        총 금액: ${order.total.toLocaleString()}원<br>
        날짜: ${order.date}<br><br>
      `;
      orderList.appendChild(p);
    });
  } else {
    const empty = document.createElement('p');
    empty.textContent = '주문 내역이 없습니다.';
    orderList.appendChild(empty);
  }

  // 예약내역 렌더링
  if (userInfo.reservationList.length > 0) {
    userInfo.reservationList.forEach(res => {
      const p = document.createElement('p');
      p.innerHTML = `
        • <strong>${res.store}</strong><br>
        ${res.date} / ${res.people}명<br><br>
      `;
      reservationList.appendChild(p);
    });
  } else {
    const empty = document.createElement('p');
    empty.textContent = '예약 내역이 없습니다.';
    reservationList.appendChild(empty);
  }

  // 내 계정 화면 렌더링
  info.addEventListener('click', () => {
    renderMyAccount();
  });

  // 뒤로가기
  back.addEventListener('click', () => {
    renderMain();
  });
}

window.renderMyPage = renderMyPage;
