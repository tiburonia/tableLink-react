async function renderMyAccount() {
  const main = document.getElementById('main');

  try {
    const response = await fetch('/api/users/info', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: userInfo.id })
    });

    if (!response.ok) throw new Error('사용자 정보 조회 실패');
    const data = await response.json();
    const currentUserInfo = data.user;

    const couponHTML = currentUserInfo.coupons?.unused?.length > 0
      ? currentUserInfo.coupons.unused.map(c =>
        `• ${c.name} (${c.discountValue}${c.discountType === 'percent' ? '%' : '원'}) - 유효기간: ${c.validUntil}`
      ).join('<br>')
      : '보유한 쿠폰 없음';

    const orderHistoryHTML = currentUserInfo.orderList?.length > 0
      ? currentUserInfo.orderList.map(o =>
        `• ${o.items.map(i => `${i.name}(${i.qty}개)`).join(', ')} - ${o.total.toLocaleString()}원 (${o.date})`
      ).join('<br>')
      : '주문 내역 없음';

    const reservationHistoryHTML = currentUserInfo.reservationList?.length > 0
      ? currentUserInfo.reservationList.map(r =>
        `• ${r.store} - ${r.date} (${r.people}명)`
      ).join('<br>')
      : '예약 내역 없음';

    const favoritesHTML = currentUserInfo.favoriteStores?.length > 0
      ? currentUserInfo.favoriteStores.join('<br>')
      : '즐겨찾기 매장 없음';

    const totalCost = currentUserInfo.orderList?.reduce((sum, o) => sum + o.total, 0)?.toLocaleString() || '0';

    main.innerHTML = `
      <header>
        <h1 style="margin: 20px; font-size: 24px;">👤 내 계정 정보</h1>
      </header>

      <main id="content" style="padding: 0 18px 80px;">
        <section class="section-card">
          <h2>📌 기본 정보</h2>
          <p><strong>아이디:</strong> ${currentUserInfo.id}</p>
          <p><strong>이름:</strong> ${currentUserInfo.name || '정보없음'}</p>
          <p><strong>전화번호:</strong> ${currentUserInfo.phone || '정보없음'}</p>
          <p><strong>이메일:</strong> ${currentUserInfo.email || '정보없음'}</p>
          <p><strong>주소:</strong> ${currentUserInfo.address || '정보없음'}</p>
          <p><strong>생년월일:</strong> ${currentUserInfo.birth || '정보없음'}</p>
          <p><strong>성별:</strong> ${currentUserInfo.gender || '정보없음'}</p>
          <p><strong>포인트:</strong> ${currentUserInfo.point || 0}P</p>
          <p><strong>총 주문금액:</strong> ${totalCost}원</p>
        </section>

        <section class="section-card">
          <h2>📦 주문 내역</h2>
          <p>${orderHistoryHTML}</p>
        </section>

        <section class="section-card">
          <h2>📅 예약 내역</h2>
          <p>${reservationHistoryHTML}</p>
        </section>

        <section class="section-card">
          <h2>🎁 쿠폰</h2>
          <p>${couponHTML}</p>
        </section>

        <section class="section-card">
          <h2>⭐ 즐겨찾기</h2>
          <p>${favoritesHTML}</p>
        </section>

        <button id="accountEdit" class="solid-button">내 정보 수정하기</button>
        <button id="backToMain" class="ghost-button">마이페이지로 돌아가기</button>
      </main>

      <style>
        .section-card {
          background: white;
          border-radius: 12px;
          padding: 14px 16px;
          margin-bottom: 18px;
          box-shadow: 0 2px 10px rgba(0, 0, 0, 0.04);
        }
        .section-card h2 {
          font-size: 18px;
          margin-bottom: 10px;
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
          margin-top: 20px;
          cursor: pointer;
        }
        .ghost-button {
          width: 100%;
          padding: 10px 0;
          font-size: 15px;
          background: none;
          border: 1px solid #297efc;
          border-radius: 10px;
          color: #297efc;
          margin-top: 10px;
          cursor: pointer;
        }
      </style>
    `;

    document.getElementById('accountEdit').addEventListener('click', () => {
      alert('계정 수정 기능은 아직 준비 중입니다');
    });

    document.getElementById('backToMain').addEventListener('click', () => {
      renderMyPage();
    });

  } catch (error) {
    console.error('계정 정보 로딩 실패:', error);
    main.innerHTML = `
      <h2>내 계정 정보</h2>
      <p>계정 정보를 불러오는 중 오류가 발생했습니다.</p>
      <button onclick="renderMyPage()">마이페이지로 돌아가기</button>
    `;
  }
}

window.renderMyAccount = renderMyAccount;
