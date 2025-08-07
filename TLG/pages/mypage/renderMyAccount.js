
async function renderMyAccount() {
  const main = document.getElementById('main');

  // UI 프레임을 먼저 렌더링 (로딩 상태)
  main.innerHTML = `
    <button id="backBtn" class="back-button">←</button>

    <main id="content">
      <section class="section-card title-section">
        <h1>👤 내 계정 정보</h1>
      </section>

      <section class="section-card">
        <h2>📌 기본 정보</h2>
        <div id="basicInfo">
          <p>⏳ 기본 정보를 불러오는 중...</p>
        </div>
      </section>

      <section class="section-card">
        <h2>📦 주문 내역</h2>
        <div id="orderHistory">
          <p>⏳ 주문 내역을 불러오는 중...</p>
        </div>
      </section>

      <section class="section-card">
        <h2>📅 예약 내역</h2>
        <div id="reservationHistory">
          <p>⏳ 예약 내역을 불러오는 중...</p>
        </div>
      </section>

      <section class="section-card">
        <h2>🎁 쿠폰</h2>
        <div id="couponInfo">
          <p>⏳ 쿠폰 정보를 불러오는 중...</p>
        </div>
      </section>

      <section class="section-card">
        <h2>⭐ 즐겨찾기</h2>
        <div id="favoriteInfo">
          <p>⏳ 즐겨찾기 정보를 불러오는 중...</p>
        </div>
      </section>

      <button id="accountEdit" class="solid-button">내 정보 수정하기</button>
      <button id="backToMain" class="ghost-button">마이페이지로 돌아가기</button>
    </main>

    <style>
      #main {
        font-family: sans-serif;
        background: #f8f9fb;
        overflow: hidden; /* 전체 스크롤 방지 */
      }
      
      .back-button {
        position: fixed;
        top: 20px;
        left: 20px;
        width: 50px;
        height: 50px;
        border: none;
        background: rgba(255, 255, 255, 0.95);
        border-radius: 50%;
        font-size: 24px;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        color: #297efc;
        transition: all 0.3s ease;
        box-shadow: 0 4px 16px rgba(41, 126, 252, 0.15);
        z-index: 9999;
        backdrop-filter: blur(10px);
        border: 2px solid rgba(41, 126, 252, 0.1);
      }

      .back-button:hover {
        background: rgba(41, 126, 252, 0.1);
        transform: scale(1.1);
        box-shadow: 0 6px 20px rgba(41, 126, 252, 0.25);
      }

      .back-button:active {
        background: rgba(41, 126, 252, 0.2);
        transform: scale(0.95);
      }
      
      #content {
        position: absolute;
        top: 0;          /* 탑바 삭제로 0부터 시작 */
        bottom: 0;       /* 바닥까지 */
        left: 0;
        width: 100%;
        max-width: 430px;
        overflow-y: auto;  /* 여기만 스크롤 */
        padding: 80px 18px 20px 18px; /* 상단에 뒤로가기 버튼 공간 확보 */
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
      
      .title-section {
        text-align: center;
        padding: 20px 16px;
        margin-bottom: 24px;
      }
      
      .title-section h1 {
        margin: 0;
        font-size: 24px;
        font-weight: 700;
        color: #333;
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
        margin: 10px 0 80px 0; /* 아래 여백 확보 */
        cursor: pointer;
      }
    </style>
  `;

  // 즉시 이벤트 리스너 등록
  document.getElementById('backBtn').addEventListener('click', () => {
    renderMyPage();
  });

  document.getElementById('accountEdit').addEventListener('click', () => {
    alert('계정 수정 기능은 아직 준비 중입니다');
  });

  document.getElementById('backToMain').addEventListener('click', () => {
    renderMyPage();
  });

  // 비동기로 사용자 정보 로드 및 업데이트
  loadAccountData();
}

// 계정 데이터를 비동기로 로드하는 함수
async function loadAccountData() {
  try {
    const response = await fetch('/api/users/info', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: userInfo.id })
    });

    if (!response.ok) throw new Error('사용자 정보 조회 실패');
    const data = await response.json();
    const currentUserInfo = data.user;

    // 각 섹션별로 업데이트
    updateBasicInfo(currentUserInfo);
    updateOrderHistory(currentUserInfo);
    updateReservationHistory(currentUserInfo);
    updateCouponInfo(currentUserInfo);
    updateFavoriteInfo(currentUserInfo);

  } catch (error) {
    console.error('계정 정보 로딩 실패:', error);
    
    // 에러 발생 시 각 섹션에 에러 메시지 표시
    const basicInfo = document.querySelector('#basicInfo');
    const orderHistory = document.querySelector('#orderHistory');
    const reservationHistory = document.querySelector('#reservationHistory');
    const couponInfo = document.querySelector('#couponInfo');
    const favoriteInfo = document.querySelector('#favoriteInfo');
    
    if (basicInfo) basicInfo.innerHTML = `<p>❌ 기본 정보를 불러올 수 없습니다.</p>`;
    if (orderHistory) orderHistory.innerHTML = `<p>❌ 주문 내역을 불러올 수 없습니다.</p>`;
    if (reservationHistory) reservationHistory.innerHTML = `<p>❌ 예약 내역을 불러올 수 없습니다.</p>`;
    if (couponInfo) couponInfo.innerHTML = `<p>❌ 쿠폰 정보를 불러올 수 없습니다.</p>`;
    if (favoriteInfo) favoriteInfo.innerHTML = `<p>❌ 즐겨찾기 정보를 불러올 수 없습니다.</p>`;
  }
}

// 기본 정보 업데이트
function updateBasicInfo(currentUserInfo) {
  const basicInfo = document.querySelector('#basicInfo');
  if (!basicInfo) return;

  const totalCost = currentUserInfo.orderList?.reduce((sum, o) => sum + o.total, 0)?.toLocaleString() || '0';

  basicInfo.innerHTML = `
    <p><strong>아이디:</strong> ${currentUserInfo.id}</p>
    <p><strong>이름:</strong> ${currentUserInfo.name || '정보없음'}</p>
    <p><strong>전화번호:</strong> ${currentUserInfo.phone || '정보없음'}</p>
    <p><strong>이메일:</strong> ${currentUserInfo.email || '정보없음'}</p>
    <p><strong>주소:</strong> ${currentUserInfo.address || '정보없음'}</p>
    <p><strong>생년월일:</strong> ${currentUserInfo.birth || '정보없음'}</p>
    <p><strong>성별:</strong> ${currentUserInfo.gender || '정보없음'}</p>
    <p><strong>포인트:</strong> ${currentUserInfo.point || 0}P</p>
    <p><strong>총 주문금액:</strong> ${totalCost}원</p>
  `;
}

// 주문 내역 업데이트
function updateOrderHistory(currentUserInfo) {
  const orderHistory = document.querySelector('#orderHistory');
  if (!orderHistory) return;

  const orderHistoryHTML = currentUserInfo.orderList?.length > 0
    ? currentUserInfo.orderList.map(o =>
      `• ${o.items.map(i => `${i.name}(${i.qty}개)`).join(', ')} - ${o.total.toLocaleString()}원 (${o.date})`
    ).join('<br>')
    : '주문 내역 없음';

  orderHistory.innerHTML = `<p>${orderHistoryHTML}</p>`;
}

// 예약 내역 업데이트
function updateReservationHistory(currentUserInfo) {
  const reservationHistory = document.querySelector('#reservationHistory');
  if (!reservationHistory) return;

  const reservationHistoryHTML = currentUserInfo.reservationList?.length > 0
    ? currentUserInfo.reservationList.map(r =>
      `• ${r.store} - ${r.date} (${r.people}명)`
    ).join('<br>')
    : '예약 내역 없음';

  reservationHistory.innerHTML = `<p>${reservationHistoryHTML}</p>`;
}

// 쿠폰 정보 업데이트
function updateCouponInfo(currentUserInfo) {
  const couponInfo = document.querySelector('#couponInfo');
  if (!couponInfo) return;

  const couponHTML = currentUserInfo.coupons?.unused?.length > 0
    ? currentUserInfo.coupons.unused.map(c =>
      `• ${c.name} (${c.discountValue}${c.discountType === 'percent' ? '%' : '원'}) - 유효기간: ${c.validUntil}`
    ).join('<br>')
    : '보유한 쿠폰 없음';

  couponInfo.innerHTML = `<p>${couponHTML}</p>`;
}

// 즐겨찾기 정보 업데이트
function updateFavoriteInfo(currentUserInfo) {
  const favoriteInfo = document.querySelector('#favoriteInfo');
  if (!favoriteInfo) return;

  const favoritesHTML = currentUserInfo.favoriteStores?.length > 0
    ? currentUserInfo.favoriteStores.join('<br>')
    : '즐겨찾기 매장 없음';

  favoriteInfo.innerHTML = `<p>${favoritesHTML}</p>`;
}

window.renderMyAccount = renderMyAccount;
