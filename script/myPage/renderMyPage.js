
async function renderMyPage() {
  const main = document.getElementById('main');
  
  // 로딩 화면 표시
  main.innerHTML = `
    <div style="text-align: center; padding: 50px;">
      <h1>TableLink</h1>
      <p>마이페이지를 불러오는 중...</p>
    </div>
  `;

  try {
    // 캐시에서 사용자 정보 가져오기
    const currentUserInfo = await cacheManager.getUserInfo(userInfo.id);

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
      
      <div id="couponList">
      <h2>쿠폰 리스트</h2>
      </div>
      <button id='info'>내 계정</button> 
      <button id='back'>뒤로가기</button>

      <style>
      #main {
        overflow: scroll;
        padding: 20px;
        font-family: Arial, sans-serif;
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
      
      #orderList, #reservationList, #couponList {
        margin: 20px 0;
        padding: 15px;
        background: #f8f9fa;
        border-radius: 8px;
      }
      
      #orderList p, #reservationList p, #couponList p {
        margin: 10px 0;
        padding: 10px;
        background: white;
        border-radius: 5px;
        border-left: 4px solid #007bff;
      }
      </style>
    `;

    // 요소 선택
    const orderList = document.querySelector('#orderList');
    const reservationList = document.querySelector('#reservationList');
    const info = document.querySelector('#info');
    const back = document.querySelector('#back');
    const couponList = document.querySelector('#couponList');

    // 주문내역 렌더링 (즉시 표시)
    if (currentUserInfo.orderList && currentUserInfo.orderList.length > 0) {
      currentUserInfo.orderList.forEach(order => {
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

    // 예약내역 렌더링 (즉시 표시)
    if (currentUserInfo.reservationList && currentUserInfo.reservationList.length > 0) {
      currentUserInfo.reservationList.forEach(res => {
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

    // 쿠폰 리스트 렌더링 (즉시 표시)
    if (!currentUserInfo.coupons || !currentUserInfo.coupons.unused || currentUserInfo.coupons.unused.length === 0) {
      const empty = document.createElement('p');
      empty.textContent = '보유한 쿠폰이 없습니다.';
      couponList.appendChild(empty);
    } else {
      currentUserInfo.coupons.unused.forEach(coupon => {
        const p = document.createElement('p');
        p.innerHTML = `
          • <strong>${coupon.name}</strong><br>
          할인율: ${coupon.discountValue}${coupon.discountType === 'percent' ? '%' : '원'}<br>
          유효기간: ${coupon.validUntil}<br><br>
        `;
        couponList.appendChild(p);
      });
    }

    // 전역 userInfo 업데이트 (캐시와 동기화)
    Object.assign(userInfo, currentUserInfo);

    // 내 계정 화면 렌더링 (캐시된 데이터 사용)
    info.addEventListener('click', () => {
      renderMyAccount();
    });

    // 뒤로가기 (서버 요청 없음)
    back.addEventListener('click', () => {
      renderMain();
    });

  } catch (error) {
    console.error('마이페이지 로딩 실패:', error);
    main.innerHTML = `
      <h1>TableLink</h1>
      <p>데이터를 불러오는 중 오류가 발생했습니다.</p>
      <button onclick="renderMain()">메인으로 돌아가기</button>
    `;
  }
}

window.renderMyPage = renderMyPage;
