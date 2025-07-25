async function renderMyPage() {
  try {
    // 캐시된 사용자 정보 우선 사용
    let currentUser = cacheManager.getUserInfo();

    // 필요시에만 서버에서 최신 정보 가져오기
    if (!currentUser || !cacheManager.isCacheValid()) {
      const response = await fetch('/api/users/info', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: userInfo.id
        })
      });

      if (!response.ok) {
        throw new Error('사용자 정보 조회 실패');
      }

      const data = await response.json();
      currentUser = data.user;
      cacheManager.setUserInfo(currentUser);
    }

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
      }
      </style>
    `;

    // 요소 선택
    const orderList = document.querySelector('#orderList');
    const reservationList = document.querySelector('#reservationList');
    const info = document.querySelector('#info');
    const back = document.querySelector('#back');
    const couponList = document.querySelector('#couponList');

    // 주문내역 렌더링
    if (currentUser.orderList && currentUser.orderList.length > 0) {
      currentUser.orderList.forEach(order => {
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
    if (currentUser.reservationList && currentUser.reservationList.length > 0) {
      currentUser.reservationList.forEach(res => {
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

    // 쿠폰 리스트 렌더링
    if (!currentUser.coupons || !currentUser.coupons.unused || currentUser.coupons.unused.length === 0) {
      const empty = document.createElement('p');
      empty.textContent = '보유한 쿠폰이 없습니다.';
      couponList.appendChild(empty);
    } else {
      currentUser.coupons.unused.forEach(coupon => {
        const p = document.createElement('p');
        p.innerHTML = `
          • <strong>${coupon.name}</strong><br>
          할인율: ${coupon.discountValue}${coupon.discountType === 'percent' ? '%' : '원'}<br>
          유효기간: ${coupon.validUntil}<br><br>
        `;
        couponList.appendChild(p);
      });
    }

    // 내 계정 화면 렌더링
    info.addEventListener('click', () => {
      renderMyAccount();
    });

    // 뒤로가기
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

// cacheManager 객체 (localStorage 사용)
const cacheManager = {
  cacheKey: 'userInfo',
  cacheDuration: 300000, // 5분 (밀리초)

  getUserInfo: function() {
    const cachedData = localStorage.getItem(this.cacheKey);
    if (cachedData) {
      const { data, timestamp } = JSON.parse(cachedData);
      if (Date.now() - timestamp < this.cacheDuration) {
        return data;
      } else {
        this.clearCache();
        return null;
      }
    }
    return null;
  },

  setUserInfo: function(userInfo) {
    const data = {
      data: userInfo,
      timestamp: Date.now()
    };
    localStorage.setItem(this.cacheKey, JSON.stringify(data));
  },

  isCacheValid: function() {
    const cachedData = localStorage.getItem(this.cacheKey);
    if (cachedData) {
      const { timestamp } = JSON.parse(cachedData);
      return Date.now() - timestamp < this.cacheDuration;
    }
    return false;
  },

  clearCache: function() {
    localStorage.removeItem(this.cacheKey);
  }
};