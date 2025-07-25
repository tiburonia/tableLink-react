
async function renderMyAccount() {
  const main = document.getElementById('main');

  try {
    // 캐시에서 사용자 정보 가져오기 (이미 로드된 상태)
    const currentUserInfo = cacheManager.cache.userInfo || await cacheManager.getUserInfo(userInfo.id);

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
      <ul style="padding: 20px; font-family: Arial, sans-serif;">
        <li style="margin: 10px 0;"><strong>아이디:</strong> ${currentUserInfo.id}</li>
        <li style="margin: 10px 0;"><strong>이름:</strong> ${currentUserInfo.name || '정보없음'}</li>
        <li style="margin: 10px 0;"><strong>전화번호:</strong> ${currentUserInfo.phone || '정보없음'}</li>
        <li style="margin: 10px 0;"><strong>이메일:</strong> ${currentUserInfo.email || '정보없음'}</li>
        <li style="margin: 10px 0;"><strong>주소:</strong> ${currentUserInfo.address || '정보없음'}</li>
        <li style="margin: 10px 0;"><strong>생년월일:</strong> ${currentUserInfo.birth || '정보없음'}</li>
        <li style="margin: 10px 0;"><strong>성별:</strong> ${currentUserInfo.gender || '정보없음'}</li>
        <li style="margin: 10px 0;"><strong>포인트:</strong> ${currentUserInfo.point || 0}</li>
        <li style="margin: 10px 0;"><strong>총 주문금액:</strong> ${totalCost}원</li>
        <li style="margin: 15px 0;"><strong>주문내역:</strong><br>
          <div style="margin: 10px 0; padding: 10px; background: #f8f9fa; border-radius: 5px;">
            ${orderHistoryHTML}
          </div>
        </li>
        <li style="margin: 15px 0;"><strong>사용가능한 쿠폰:</strong><br>
          <div style="margin: 10px 0; padding: 10px; background: #f8f9fa; border-radius: 5px;">
            ${couponHTML}
          </div>
        </li>
        <li style="margin: 15px 0;"><strong>예약내역:</strong><br>
          <div style="margin: 10px 0; padding: 10px; background: #f8f9fa; border-radius: 5px;">
            ${reservationHistoryHTML}
          </div>
        </li>
        <li style="margin: 15px 0;"><strong>즐겨찾기 매장:</strong><br>
          <div style="margin: 10px 0; padding: 10px; background: #f8f9fa; border-radius: 5px;">
            ${favoritesHTML}
          </div>
        </li>
      </ul>
      <button id="accountEdit">수정하기</button>
      <button id="backToMain">돌아가기</button>
      <button id="admin">관리자</button>
      
      <style>
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
      </style>
    `;

    const accountEdit = document.getElementById('accountEdit');
    const backToMain = document.getElementById('backToMain');
    const admin = document.getElementById('admin');

    accountEdit.addEventListener('click', () => {
      alert('계정 수정 기능은 아직 준비 중입니다');
    });

    // 뒤로가기 (캐시된 데이터로 즉시 렌더링)
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
