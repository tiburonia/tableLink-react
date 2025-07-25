async function renderMyPage() {
  try {
    const response = await fetch('/api/users/info', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: userInfo.id })
    });

    if (!response.ok) throw new Error('사용자 정보 조회 실패');
    const data = await response.json();
    const currentUserInfo = data.user;

    main.innerHTML = `
      <header>
        <h1>📄 마이페이지</h1>
      </header>

      <main id="content">
        <section class="section-card">
          <h2>📦 주문내역</h2>
          <div id="orderList"></div>
        </section>

        <section class="section-card">
          <h2>📅 예약내역</h2>
          <div id="reservationList"></div>
        </section>

        <section class="section-card">
          <h2>🎁 쿠폰 리스트</h2>
          <div id="couponList"></div>
        </section>

        <button id="info" class="solid-button">내 계정 보기</button>
      </main>

      <nav id="bottomBar">
        <button onclick="renderMap()">🏠</button>
        <button onclick="renderSearch()">🔍</button>
        <button onclick="renderMap()">📍</button>
        <button onclick="renderMyPage()">👤</button>
      </nav>

      <style>
        #main {
          font-family: sans-serif;
          background: #f8f9fb;
          overflow: hidden; /* 전체 스크롤 방지 */
        }
        
        header {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          max-width: 430px;
          height: 80px;
          background: white;
          border-bottom: 1px solid #ddd;
          display: flex;
          align-items: center;
          z-index: 1001;
        }
        
        header h1 {
          margin: 20px;
          font-size: 24px;
        }
        
        #content {
          position: absolute;
          top: 80px;       /* 헤더 높이만큼 */
          bottom: 60px;    /* 바텀 바 높이만큼 */
          left: 0;
          width: 100%;
          max-width: 430px;
          overflow-y: auto;  /* 여기만 스크롤 */
          padding: 0 18px;
          box-sizing: border-box;
          background: #f8f9fb;
          z-index: 1;
        }
        
        .section-card {
          background: white;
          border-radius: 12px;
          padding: 14px 16px;
          margin-bottom: 18px;
          box-shadow: 0 2px 10px rgba(0, 0, 0, 0.04);
        }
        .section-card h2 {
          margin-bottom: 10px;
          font-size: 18px;
          font-weight: 600;
        }
        .solid-button {
          width: 100%;
          padding: 12px 0;
          font-size: 16px;
          background: #297efc;
          color: white;
          border: none;
          border-radius: 10px;
          margin: 20px 0 80px 0; /* 바텀바 여백 확보 */
          cursor: pointer;
        }
        #bottomBar {
          position: fixed;
          bottom: 0;
          left: 0;
          width: 100%;
          max-width: 430px;
          height: 60px;
          background: white;
          border-top: 1px solid #ccc;
          display: flex;
          justify-content: space-around;
          align-items: center;
          z-index: 1000;
        }
      </style>
    `;

    // DOM 요소 선택
    const orderList = document.querySelector('#orderList');
    const reservationList = document.querySelector('#reservationList');
    const couponList = document.querySelector('#couponList');
    const info = document.querySelector('#info');

    // 주문내역
    if (currentUserInfo.orderList?.length > 0) {
      currentUserInfo.orderList.forEach(order => {
        const p = document.createElement('p');
        const items = order.items.map(i => `${i.name}(${i.qty}개)`).join(', ');
        p.innerHTML = `
          • <strong>${order.store}</strong><br>
          ${items}<br>
          총 ${order.total.toLocaleString()}원<br>
          📅 ${order.date}<br><br>
        `;
        orderList.appendChild(p);
      });
    } else {
      orderList.innerHTML = `<p>주문 내역이 없습니다.</p>`;
    }

    // 예약내역
    if (currentUserInfo.reservationList?.length > 0) {
      currentUserInfo.reservationList.forEach(res => {
        const p = document.createElement('p');
        p.innerHTML = `
          • <strong>${res.store}</strong><br>
          ${res.date} / ${res.people}명<br><br>
        `;
        reservationList.appendChild(p);
      });
    } else {
      reservationList.innerHTML = `<p>예약 내역이 없습니다.</p>`;
    }

    // 쿠폰내역
    if (!currentUserInfo.coupons?.unused?.length) {
      couponList.innerHTML = `<p>보유한 쿠폰이 없습니다.</p>`;
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

    info.addEventListener('click', () => renderMyAccount());

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
