//메뉴주문 버튼 클릭 실행
function renderOrderScreen(store) {
  main.innerHTML = `
          <h1>TableLink</h1>
          <br>
          <div id= 'list'></div>
          <br>
          <div id= 'orderList'></div>
          <br>
          <button id= 'pay'>결제하기</button>
          <button id='back'>뒤로가기</button>
          `

  const list = document.querySelector('#list');
  const orderList = document.querySelector('#orderList');
  const pay = document.querySelector('#pay');
  const back = document.querySelector('#back');

  //주문 목록
  const currentOrder = {}

  //주문 목록 렌더링
  function renderOrderList() {
    orderList.innerHTML = '';
    let total = 0;

    for (const item in currentOrder) {
      const qty = currentOrder[item];
      const menu = store.menu.find(m => m.name === item);
      const price = menu.price * qty;
      total += price;

      const p = document.createElement('p');
      const nameSpan = document.createElement('span');
      const minusBtn = document.createElement('button');
      const plusBtn = document.createElement('button');
      const qtySpan = document.createElement('span');

      nameSpan.innerHTML = `
              ${item}<br> - <strong>${price.toLocaleString()}원</strong><br>`;
      minusBtn.textContent = '➖';
      plusBtn.textContent = '➕';
      qtySpan.textContent = ` ${qty} `;

      minusBtn.addEventListener('click', () => {
        if (currentOrder[item] > 1) {
          currentOrder[item]--;
        } else {
          delete currentOrder[item];
        }
        renderOrderList();
      });

      plusBtn.addEventListener('click', () => {
        currentOrder[item]++;
        renderOrderList();
      });

      p.appendChild(nameSpan);
      p.appendChild(minusBtn);
      p.appendChild(qtySpan);
      p.appendChild(plusBtn);
      orderList.appendChild(p);
    }

    if (total > 0) {
      const totalP = document.createElement('p');
      totalP.innerHTML = `<hr><strong>총 금액: ${total.toLocaleString()}원</strong>`;
      orderList.appendChild(totalP);
    }
  }




  store.menu.forEach(menu => {
    const p = document.createElement('p');
    const span = document.createElement('span');
    const minusBtn = document.createElement('button');
    const plusBtn = document.createElement('button');
    const qtyText = document.createElement('span');
    const addBtn = document.createElement('button');


    let qty = 0;
    span.textContent = `${menu.name} - ${menu.price}원 `;
    minusBtn.textContent = '➖';
    plusBtn.textContent = '➕';
    qtyText.textContent = `0`;
    addBtn.textContent = '추가';

    minusBtn.addEventListener('click', () => {
      if (qty > 0) {
        qty--;
        qtyText.textContent = `${qty}`;
      }
    });

    plusBtn.addEventListener('click', () => {
      if (qty < 10) {
        qty++;
        qtyText.textContent = `${qty}`;
      }
    });

    addBtn.addEventListener('click', () => {
      if (qty === 0) return;

      if (currentOrder[menu.name]) {
        currentOrder[menu.name] += qty;
      } else {
        currentOrder[menu.name] = qty;
      }

      qty = 0;
      qtyText.textContent = `0`;
      renderOrderList();
    });

    p.appendChild(span);
    p.appendChild(minusBtn);
    p.appendChild(qtyText);
    p.appendChild(plusBtn);
    p.appendChild(addBtn);
    list.appendChild(p);
  });

  //결제하기 버튼 이벤트 -> 중요함
  pay.addEventListener('click', () => {

    if (Object.keys(currentOrder).length === 0) {
      alert('주문 내역이 없습니다.');
      return;
    }

    // 주문 총액과 항목 구성
    let total = 0;
    const items = [];

    for (const name in currentOrder) {
      const qty = currentOrder[name];
      const menu = store.menu.find(m => m.name === name);
      const price = menu.price * qty;
      total += price;
      items.push({ name, qty, price });
    }

    // 주문 데이터 객체 구성
    const orderData = {
      store: store.name || store.title || '알 수 없는 매장',
      date: new Date().toLocaleString(),
      items,
      total
    };

    // users 총 주문금액 업데이트
    userInfo.totalCost += total;

    // 주문 내역 users DB에 저장

    users[userInfo.id].orderList.push(orderData);

    // 초기화 및 리렌더링
    alert('결제가 완료되었습니다.');
    for (const key in currentOrder) delete currentOrder[key];
    orderList.innerHTML = '';
    renderStore(store);
  });



  //뒤로가기
  back.addEventListener('click', () => {
    renderStore(store)
  })
}