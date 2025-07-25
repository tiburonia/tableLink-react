async function renderMyAccount() {
  const main = document.getElementById('main');

  try {
    // 캐시된 사용자 정보 사용
    let currentUserInfo = cacheManager.getUserInfo();

    // 필요시에만 서버에서 최신 정보 가져오기
    if (!currentUserInfo || !cacheManager.isCacheValid()) {

    // 사용자 정보를 데이터베이스에서 새로 가져오기
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
    currentUserInfo = data.user;
    cacheManager.setUserInfo(currentUserInfo);
    }

    // 쿠폰 정보 HTML 생성
    const couponHTML = (currentUserInfo.coupons && currentUserInfo.coupons.unused && currentUserInfo.coupons.unused.length > 0)
      ? currentUserInfo.coupons.unused.map(c =>
        `• ${c.name} (${c.discountValue}${c.discountType === 'percent' ? '%' : '원'}) - 유효기간: ${c.validUntil}`
      ).join('<br>')
      : '보유한 쿠폰 없음';

    // 주문 내역 HTML 생성
    const orderHistoryHTML = (currentUserInfo.orderList && currentUserInfo.orderList.length > 0)
      ? currentUserInfo.orderList.map(o =>
        `• ${o.items.map(i => `${i.name}(${i.qty}개)`).join(', ')} - ${o.total.toLocaleString()}원 (${o.date})`
      ).join('<br>')
      : '주문 내역 없음';

    // 예약 내역 HTML 생성
    const reservationHistoryHTML = (currentUserInfo.reservationList && currentUserInfo.reservationList.length > 0)
      ? currentUserInfo.reservationList.map(r =>
        `• ${r.store} - ${r.date} (${r.people}명)`
      ).join('<br>')
      : '예약 내역 없음';

    // 즐겨찾기 매장 HTML 생성
    const favoritesHTML = (currentUserInfo.favoriteStores && currentUserInfo.favoriteStores.length > 0)
      ? currentUserInfo.favoriteStores.join('<br>')
      : '즐겨찾기 매장 없음';

    // 총 주문금액 계산
    const totalCost = (currentUserInfo.orderList && currentUserInfo.orderList.length > 0)
      ? currentUserInfo.orderList.reduce((sum, order) => sum + order.total, 0).toLocaleString()
      : '0';

    // 내 계정 정보 화면 HTML 삽입
    main.innerHTML = `
      <h2>내 계정 정보</h2>
      <ul>
        <li><strong>아이디:</strong> ${currentUserInfo.id}</li>
        <li><strong>이름:</strong> ${currentUserInfo.name || '정보없음'}</li>
        <li><strong>전화번호:</strong> ${currentUserInfo.phone || '정보없음'}</li>
        <li><strong>이메일:</strong> ${currentUserInfo.email || '정보없음'}</li>
        <li><strong>주소:</strong> ${currentUserInfo.address || '정보없음'}</li>
        <li><strong>생년월일:</strong> ${currentUserInfo.birth || '정보없음'}</li>
        <li><strong>성별:</strong> ${currentUserInfo.gender || '정보없음'}</li>
        <li><strong>포인트:</strong> ${currentUserInfo.point || 0}</li>
        <li><strong>총 주문금액:</strong> ${totalCost}원</li>
        <li><strong>주문내역:</strong><br>
          ${orderHistoryHTML}
        </li>
        <li><strong>사용가능한 쿠폰:</strong><br>
          ${couponHTML}
        </li>
        <li><strong>예약내역:</strong><br>
          ${reservationHistoryHTML}
        </li>
        <li><strong>즐겨찾기 매장:</strong><br>
          ${favoritesHTML}
        </li>
      </ul>
      <button id="accountEdit">수정하기</button>
      <button id="backToMain">돌아가기</button>
      <button id="admin">관리자</button>
    `;

    const accountEdit = document.getElementById('accountEdit');
    const backToMain = document.getElementById('backToMain');
    const admin = document.getElementById('admin');

    accountEdit.addEventListener('click', () => {
      alert('계정 수정 기능은 아직 준비 중입니다');
    });

    backToMain.addEventListener('click', () => {
      renderMyPage();
    });

    admin.addEventListener('click', () => {
      console.log('현재 사용자 정보:', JSON.stringify(currentUserInfo, null, 2));
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