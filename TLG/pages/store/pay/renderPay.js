window.renderPay = async function(currentOrder, store, tableNum) {
  console.log('💳 결제 화면 렌더링 시작 - 매장:', store, '테이블:', tableNum);

  // userInfo를 안전하게 가져오기 (쿠키 우선)
  function getUserInfoSafely() {
    try {
      // 쿠키에서 userInfo 찾기
      const cookies = document.cookie.split(';').map(cookie => cookie.trim());
      const userInfoCookie = cookies.find(cookie => cookie.startsWith('userInfo='));

      if (userInfoCookie) {
        const userInfoValue = decodeURIComponent(userInfoCookie.split('=')[1]);
        return JSON.parse(userInfoValue);
      }

      // localStorage 확인
      const localStorageUserInfo = localStorage.getItem('userInfo');
      if (localStorageUserInfo) {
        return JSON.parse(localStorageUserInfo);
      }

      // window.userInfo 확인
      if (window.userInfo && window.userInfo.id) {
        return window.userInfo;
      }

      return null;
    } catch (error) {
      console.error('❌ 사용자 정보 파싱 오류:', error);
      return null;
    }
  }

  const userInfo = getUserInfoSafely();
  console.log('userInfo:', userInfo);

  // 토스페이먼츠 모듈 미리 로드
  if (!window.requestTossPayment) {
    try {
      console.log('🔄 토스페이먼츠 모듈 미리 로드 중...');
      await import('/TLG/pages/store/pay/tossPayments.js');
      console.log('✅ 토스페이먼츠 모듈 미리 로드 완료');
    } catch (error) {
      console.error('❌ 토스페이먼츠 모듈 로드 실패:', error);
    }
  }

  // confirmPay 함수 동적 로드
  if (!window.confirmPay) {
    try {
      console.log('🔄 confirmPay 함수 로드 중...');
      const confirmPayModule = await import('/TLG/pages/store/pay/confirmPayF.js');
      console.log('✅ confirmPay 함수 로드 완료');
    } catch (error) {
      console.error('❌ confirmPay 함수 로드 실패:', error);
    }
  }

  // 매장 메뉴 데이터 안전하게 처리
  let menuData = [];
  if (store.menu && Array.isArray(store.menu)) {
    menuData = store.menu;
  } else if (typeof store.menu === 'string') {
    try {
      menuData = JSON.parse(store.menu);
    } catch (error) {
      console.warn('⚠️ 매장 메뉴 JSON 파싱 실패:', error);
      menuData = [];
    }
  }

  // 주문 데이터 준비
  let total = 0;
  const items = [];
  for (const name in currentOrder) {
    const qty = currentOrder[name];
    const menu = menuData.find(m => m.name === name);
    if (!menu) {
      console.warn(`⚠️ 메뉴 "${name}"를 찾을 수 없습니다`);
      continue;
    }
    const price = menu.price * qty;
    total += price;
    items.push({ name, qty, price: menu.price, totalPrice: price });
  }

  const orderData = {
    store: store.name,
    storeId: store.id,
    date: new Date().toLocaleString(),
    table: tableNum,
    tableNum: tableNum,
    items,
    total
  };

  console.log('💳 주문 데이터 준비 완료:', orderData);

  // HTML 렌더링
  main.innerHTML = `
    <div class="pay-container">
      <!-- 헤더 -->
      <header class="pay-header">
        <button id="payBackBtn" class="back-btn">
          ← 뒤로가기
        </button>
        <div class="header-info">
          <h1>결제 확인</h1>
          <p>${orderData.store} • 테이블 ${orderData.table}</p>
        </div>
      </header>

      <!-- 메인 콘텐츠 -->
      <main class="pay-main">
        <!-- 주문 내역 -->
        <section class="order-section">
          <div class="section-title">
            <h2>주문 내역</h2>
            <span class="item-count">${items.length}개</span>
          </div>
          <div class="order-list">
            ${items.map(item => `
              <div class="order-item">
                <div class="item-info">
                  <span class="item-name">${item.name}</span>
                  <span class="item-qty">×${item.qty}</span>
                </div>
                <span class="item-price">${item.totalPrice.toLocaleString()}원</span>
              </div>
            `).join('')}
          </div>
          <div class="subtotal-row">
            <span>주문 금액</span>
            <span class="subtotal-amount">${orderData.total.toLocaleString()}원</span>
          </div>
        </section>

        <!-- 포인트 사용 -->
        <section class="points-section">
          <div class="section-title">
            <h2>포인트 사용</h2>
            <div id="storePointDisplay" class="point-balance">조회 중...</div>
          </div>
          <div class="point-input-group">
            <input type="number" id="usePoint" min="0" max="0" value="0"
                   placeholder="사용할 포인트" disabled class="point-input">
            <button id="maxPointBtn" class="max-point-btn" disabled>전액</button>
          </div>
        </section>

        <!-- 쿠폰 사용 -->
        <section class="coupon-section">
          <div class="section-title">
            <h2>쿠폰 사용</h2>
          </div>
          <div id="couponList" class="coupon-select"></div>
        </section>

        <!-- 결제 수단 선택 -->
        <section class="payment-method-section">
          <div class="section-title">
            <h2>결제 수단</h2>
          </div>
          <div class="payment-methods">
            <div class="payment-method-item active" data-method="카드">
              <div class="method-icon">💳</div>
              <div class="method-info">
                <span class="method-name">신용/체크카드</span>
                <span class="method-desc">간편하고 빠른 결제</span>
              </div>
              <div class="method-check">✓</div>
            </div>
            <div class="payment-method-item" data-method="계좌이체">
              <div class="method-icon">🏦</div>
              <div class="method-info">
                <span class="method-name">계좌이체</span>
                <span class="method-desc">퀵계좌이체로 간편결제</span>
              </div>
              <div class="method-check">✓</div>
            </div>
            <div class="payment-method-item" data-method="가상계좌">
              <div class="method-icon">🏪</div>
              <div class="method-info">
                <span class="method-name">가상계좌</span>
                <span class="method-desc">계좌번호 발급 후 입금</span>
              </div>
              <div class="method-check">✓</div>
            </div>
            <div class="payment-method-item" data-method="휴대폰">
              <div class="method-icon">📱</div>
              <div class="method-info">
                <span class="method-name">휴대폰</span>
                <span class="method-desc">휴대폰 요금과 합산</span>
              </div>
              <div class="method-check">✓</div>
            </div>
            <div class="payment-method-item" data-method="간편결제">
              <div class="method-icon">⚡</div>
              <div class="method-info">
                <span class="method-name">간편결제</span>
                <span class="method-desc">페이코, 삼성페이 등</span>
              </div>
              <div class="method-check">✓</div>
            </div>
            <div class="payment-method-item" data-method="문화상품권">
              <div class="method-icon">🎫</div>
              <div class="method-info">
                <span class="method-name">문화상품권</span>
                <span class="method-desc">상품권으로 결제</span>
              </div>
              <div class="method-check">✓</div>
            </div>
            <div class="payment-method-item" data-method="도서문화상품권">
              <div class="method-icon">📚</div>
              <div class="method-info">
                <span class="method-name">도서문화상품권</span>
                <span class="method-desc">도서/문화 상품권</span>
              </div>
              <div class="method-check">✓</div>
            </div>
            <div class="payment-method-item" data-method="게임문화상품권">
              <div class="method-icon">🎮</div>
              <div class="method-info">
                <span class="method-name">게임문화상품권</span>
                <span class="method-desc">게임 상품권으로 결제</span>
              </div>
              <div class="method-check">✓</div>
            </div>
          </div>
        </section>

        <!-- 결제 요약 -->
        <section class="summary-section">
          <div class="summary-details">
            <div class="summary-item">
              <span>주문 금액</span>
              <span>${orderData.total.toLocaleString()}원</span>
            </div>
            <div class="summary-item discount-item" id="discountRow" style="display: none;">
              <span id="discountLabel">할인 금액</span>
              <span id="discountAmount" class="discount-text">-0원</span>
            </div>
          </div>
          <div class="final-total-row">
            <span>최종 결제</span>
            <span id="finalAmount" class="final-amount">${orderData.total.toLocaleString()}원</span>
          </div>
          <div class="earn-point-info">
            <span>💰 적립 예정</span>
            <span id="pointEarned" class="earn-amount">+${Math.floor(orderData.total * 0.1).toLocaleString()}P</span>
          </div>
        </section>
      </main>

      <!-- 하단 버튼 -->
      <footer class="pay-footer">
        <button id="confirmPayBtn" class="confirm-btn">
          <span>결제하기</span>
          <span id="payBtnAmount" class="btn-price">${orderData.total.toLocaleString()}원</span>
        </button>
        <button id="cancelPayBtn" class="cancel-btn">취소</button>
      </footer>
    </div>

    <style>
      * {
        margin: 0;
        padding: 0;
        box-sizing: border-box;
      }

      body {
        overflow: hidden;
      }

      .pay-container {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        width: 100%;
        max-width: 430px;
        margin: 0 auto;
        display: flex;
        flex-direction: column;
        background: #f8fafc;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
        overflow: hidden;
      }

      /* 헤더 - 고정 높이 */
      .pay-header {
        height: 80px;
        background: white;
        padding: 20px;
        border-bottom: 1px solid #e2e8f0;
        display: flex;
        align-items: center;
        gap: 16px;
        z-index: 10;
        box-shadow: 0 2px 4px rgba(0,0,0,0.02);
        flex-shrink: 0;
      }

      .back-btn {
        background: #f1f5f9;
        border: none;
        padding: 10px 16px;
        border-radius: 8px;
        cursor: pointer;
        color: #475569;
        font-size: 14px;
        font-weight: 500;
        transition: background 0.2s;
      }

      .back-btn:hover {
        background: #e2e8f0;
      }

      .header-info h1 {
        font-size: 20px;
        color: #1e293b;
        font-weight: 700;
        margin-bottom: 4px;
      }

      .header-info p {
        font-size: 14px;
        color: #64748b;
        font-weight: 500;
      }

      /* 메인 콘텐츠 - 중간 유동 공간, 스크롤 가능 */
      .pay-main {
        flex: 1;
        overflow-y: auto;
        overflow-x: hidden;
        padding: 20px;
        display: flex;
        flex-direction: column;
        gap: 20px;
        max-width: 600px;
        margin: 0 auto;
        width: 100%;
      }

      /* 푸터 - 고정 높이 */
      .pay-footer {
        height: 160px;
        background: white;
        padding: 20px;
        border-top: 1px solid #e2e8f0;
        box-shadow: 0 -4px 12px rgba(0,0,0,0.05);
        display: flex;
        flex-direction: column;
        gap: 12px;
        max-width: 600px;
        margin: 0 auto;
        width: 100%;
        flex-shrink: 0;
      }

      /* 공통 섹션 스타일 */
      .order-section, 
      .points-section, 
      .coupon-section, 
      .summary-section {
        background: white;
        border-radius: 16px;
        padding: 24px;
        box-shadow: 0 1px 3px rgba(0,0,0,0.1);
        border: 1px solid #f1f5f9;
        flex-shrink: 0;
      }

      .section-title {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 20px;
      }

      .section-title h2 {
        font-size: 18px;
        font-weight: 700;
        color: #1e293b;
      }

      .item-count {
        background: #eff6ff;
        color: #2563eb;
        padding: 6px 12px;
        border-radius: 8px;
        font-size: 12px;
        font-weight: 700;
      }

      /* 주문 내역 */
      .order-list {
        margin-bottom: 20px;
      }

      .order-item {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 12px 0;
        border-bottom: 1px solid #f8fafc;
      }

      .order-item:last-child {
        border-bottom: none;
      }

      .item-info {
        display: flex;
        align-items: center;
        gap: 12px;
      }

      .item-name {
        font-weight: 600;
        color: #1e293b;
        font-size: 16px;
      }

      .item-qty {
        background: #f1f5f9;
        color: #64748b;
        padding: 4px 8px;
        border-radius: 6px;
        font-size: 12px;
        font-weight: 700;
      }

      .item-price {
        font-weight: 700;
        color: #2563eb;
        font-size: 16px;
      }

      .subtotal-row {
        display: flex;
        justify-content: space-between;
        padding-top: 20px;
        border-top: 2px solid #f1f5f9;
        font-weight: 700;
        color: #475569;
        font-size: 16px;
      }

      .subtotal-amount {
        color: #1e293b;
        font-weight: 800;
      }

      /* 포인트 */
      .point-balance {
        background: linear-gradient(135deg, #3b82f6, #1d4ed8);
        color: white;
        padding: 6px 12px;
        border-radius: 8px;
        font-size: 12px;
        font-weight: 700;
      }

      .point-input-group {
        display: flex;
        gap: 12px;
      }

      .point-input {
        flex: 1;
        padding: 14px 16px;
        border: 2px solid #e2e8f0;
        border-radius: 12px;
        font-size: 16px;
        background: #f8fafc;
        font-weight: 600;
      }

      .point-input:focus {
        outline: none;
        border-color: #3b82f6;
        background: white;
      }

      .point-input:disabled {
        opacity: 0.6;
        cursor: not-allowed;
      }

      .max-point-btn {
        padding: 14px 20px;
        border: 2px solid #3b82f6;
        border-radius: 12px;
        background: white;
        color: #3b82f6;
        font-weight: 700;
        cursor: pointer;
        font-size: 14px;
      }

      .max-point-btn:hover:not(:disabled) {
        background: #3b82f6;
        color: white;
      }

      .max-point-btn:disabled {
        opacity: 0.4;
        cursor: not-allowed;
      }

      /* 쿠폰 */
      .coupon-select select {
        width: 100%;
        padding: 14px 16px;
        border: 2px solid #e2e8f0;
        border-radius: 12px;
        font-size: 16px;
        background: #f8fafc;
        cursor: pointer;
        font-weight: 600;
      }

      .coupon-select select:focus {
        outline: none;
        border-color: #3b82f6;
        background: white;
      }

      .coupon-select p {
        color: #64748b;
        text-align: center;
        padding: 20px;
        font-size: 16px;
        font-weight: 500;
      }

      /* 결제 수단 선택 */
      .payment-methods {
        display: flex;
        flex-direction: column;
        gap: 12px;
      }

      .payment-method-item {
        display: flex;
        align-items: center;
        padding: 16px 20px;
        border: 2px solid #e2e8f0;
        border-radius: 12px;
        background: #f8fafc;
        cursor: pointer;
        transition: all 0.2s ease;
        gap: 16px;
      }

      .payment-method-item:hover {
        border-color: #3b82f6;
        background: white;
      }

      .payment-method-item.active {
        border-color: #3b82f6;
        background: #eff6ff;
      }

      .method-icon {
        font-size: 24px;
        width: 40px;
        height: 40px;
        display: flex;
        align-items: center;
        justify-content: center;
        background: rgba(59, 130, 246, 0.1);
        border-radius: 8px;
      }

      .payment-method-item.active .method-icon {
        background: rgba(59, 130, 246, 0.2);
      }

      .method-info {
        flex: 1;
        display: flex;
        flex-direction: column;
        gap: 4px;
      }

      .method-name {
        font-size: 16px;
        font-weight: 700;
        color: #1e293b;
      }

      .method-desc {
        font-size: 13px;
        color: #64748b;
        font-weight: 500;
      }

      .method-check {
        width: 24px;
        height: 24px;
        border: 2px solid #e2e8f0;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 14px;
        font-weight: 700;
        color: transparent;
        transition: all 0.2s ease;
      }

      .payment-method-item.active .method-check {
        border-color: #3b82f6;
        background: #3b82f6;
        color: white;
      }

      /* 결제 요약 */
      .summary-section {
        background: linear-gradient(135deg, #f8fafc, #f1f5f9);
        border: 2px solid #e2e8f0;
      }

      .summary-details {
        margin-bottom: 20px;
      }

      .summary-item {
        display: flex;
        justify-content: space-between;
        padding: 8px 0;
        color: #475569;
        font-size: 16px;
        font-weight: 600;
      }

      .discount-item {
        color: #059669;
        font-weight: 700;
      }

      .discount-text {
        color: #059669;
        font-weight: 800;
      }

      .final-total-row {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 20px 0 16px 0;
        border-top: 2px solid #e2e8f0;
        font-weight: 700;
        color: #1e293b;
        font-size: 18px;
      }

      .final-amount {
        font-size: 24px;
        font-weight: 900;
        color: #2563eb;
      }

      .earn-point-info {
        display: flex;
        justify-content: space-between;
        padding: 16px;
        background: rgba(59, 130, 246, 0.1);
        border-radius: 12px;
        font-size: 14px;
        margin-top: 12px;
        font-weight: 600;
      }

      .earn-amount {
        font-weight: 800;
        color: #1d4ed8;
      }

      /* 버튼 스타일 */
      .confirm-btn {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 18px 24px;
        border: none;
        border-radius: 16px;
        background: linear-gradient(135deg, #059669, #047857);
        color: white;
        font-size: 18px;
        font-weight: 800;
        cursor: pointer;
        box-shadow: 0 4px 12px rgba(5, 150, 105, 0.25);
        transition: all 0.2s;
      }

      .confirm-btn:hover {
        transform: translateY(-2px);
        box-shadow: 0 6px 20px rgba(5, 150, 105, 0.35);
      }

      .btn-price {
        font-size: 20px;
        font-weight: 900;
      }

      .cancel-btn {
        padding: 16px 24px;
        border: 2px solid #e2e8f0;
        border-radius: 16px;
        background: white;
        color: #475569;
        font-size: 16px;
        font-weight: 700;
        cursor: pointer;
        transition: all 0.2s;
      }

      .cancel-btn:hover {
        background: #f8fafc;
        border-color: #cbd5e1;
      }
    </style>
  `;

  // 포인트 및 쿠폰 데이터 로드
  loadStorePoint();
  loadCoupons();
  setupEventListeners();

  // 매장별 포인트 로드
  async function loadStorePoint() {
    // 사용자 정보 확인
    const userInfo = getUserInfoSafely();
    if (!userInfo || !userInfo.id) {
      console.error('❌ 사용자 정보가 없습니다');
      document.getElementById('storePointDisplay').textContent = '로그인 필요';
      return;
    }

    const userId = userInfo.id;
    console.log(`💰 사용자 ${userId}의 매장 ${orderData.storeId} 포인트 조회 중...`);

    try {
      const response = await fetch(`/api/regular-levels/user/${userId}/store/${orderData.storeId}/points`);
      const data = await response.json();

      if (data.success && data.points !== undefined) {
        const points = data.points || 0;
        console.log(`✅ 매장 포인트 조회 완료: ${points}P`);
        document.getElementById('storePointDisplay').textContent = `${points.toLocaleString()}P`;

        const usePointInput = document.getElementById('usePoint');
        const maxPointBtn = document.getElementById('maxPointBtn');

        if (points > 0) {
          usePointInput.max = Math.min(points, orderData.total);
          usePointInput.disabled = false;
          maxPointBtn.disabled = false;
        }
      } else {
        console.log('ℹ️ 사용 가능한 포인트가 없습니다');
        document.getElementById('storePointDisplay').textContent = '0P';
      }
    } catch (error) {
      console.error('❌ 포인트 조회 실패:', error);
      document.getElementById('storePointDisplay').textContent = '조회 실패';
    }
  }

  // 쿠폰 로드
  async function loadCoupons() {
    // userInfo 가져오기
    const userInfo = getUserInfoSafely();
    if (!userInfo || !userInfo.id) {
      document.getElementById('couponList').innerHTML = '<p>로그인이 필요합니다</p>';
      console.warn('⚠️ 쿠폰 로드: 사용자 정보를 찾을 수 없습니다.');
      return;
    }

    const userId = userInfo.id;
    console.log(`🎫 사용자 ${userId}의 쿠폰 조회 중...`);

    // 사용자 정보에서 쿠폰 데이터 가져오기
    const response = await fetch(`/api/auth/user/${userId}`);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();

    if (data.success && data.user && data.user.coupons && data.user.coupons.unused && data.user.coupons.unused.length > 0) {
      console.log(`✅ 사용 가능한 쿠폰 ${data.user.coupons.unused.length}개 발견`);

      const couponSelect = document.createElement('select');
      couponSelect.id = 'couponSelect';

      couponSelect.innerHTML = `
        <option value="">쿠폰을 선택하세요</option>
        ${data.user.coupons.unused.map(coupon => `
          <option value="${coupon.id}" data-discount="${coupon.discountValue || coupon.discount_amount || 0}" data-type="${coupon.discountType || 'amount'}">
            ${coupon.name} - ${(coupon.discountValue || coupon.discount_amount || 0).toLocaleString()}원 할인
          </option>
        `).join('')}
      `;

      document.getElementById('couponList').appendChild(couponSelect);
    } else {
      console.log('ℹ️ 사용 가능한 쿠폰이 없습니다');
      document.getElementById('couponList').innerHTML = '<p>사용 가능한 쿠폰이 없습니다</p>';
    }
  }

  // 이벤트 리스너 설정
  function setupEventListeners() {
    // 뒤로가기
    document.getElementById('payBackBtn').addEventListener('click', () => {
      renderOrderScreen(store, tableNum);
    });

    // 전액 사용
    document.getElementById('maxPointBtn').addEventListener('click', () => {
      const usePointInput = document.getElementById('usePoint');
      const maxUsable = Math.min(parseInt(usePointInput.max), orderData.total);
      usePointInput.value = maxUsable;
      calculateFinalAmount();
    });

    // 포인트 입력 - 실시간 검증
    document.getElementById('usePoint').addEventListener('input', (e) => {
      const value = parseInt(e.target.value) || 0;
      const maxPoints = parseInt(e.target.max) || 0;
      const maxUsable = Math.min(maxPoints, orderData.total);

      if (value > maxUsable) {
        e.target.value = maxUsable;
      }
      if (value < 0) {
        e.target.value = 0;
      }

      calculateFinalAmount();
    });

    // 쿠폰 선택
    document.addEventListener('change', (e) => {
      if (e.target.id === 'couponSelect') {
        calculateFinalAmount();
      }
    });

    // 결제 수단 선택
    document.addEventListener('click', (e) => {
      const methodItem = e.target.closest('.payment-method-item');
      if (methodItem) {
        // 모든 결제 수단 선택 해제
        document.querySelectorAll('.payment-method-item').forEach(item => {
          item.classList.remove('active');
        });

        // 선택된 결제 수단 활성화
        methodItem.classList.add('active');

        const selectedMethod = methodItem.dataset.method;
        console.log('💳 결제 수단 선택:', selectedMethod);
      }
    });

    // 결제 확인
    document.getElementById('confirmPayBtn').addEventListener('click', async () => {
      const usePointInput = document.getElementById('usePoint');
      const usePoint = parseInt(usePointInput.value) || 0;
      const maxUsable = Math.min(parseInt(usePointInput.max) || 0, orderData.total);

      // 포인트 사용량 재검증
      const validatedPoints = Math.min(usePoint, maxUsable);

      const couponSelect = document.getElementById('couponSelect');
      const selectedCouponId = couponSelect ? couponSelect.value : null;
      
      let couponDiscount = 0;
      if (couponSelect && couponSelect.value) {
        const selectedOption = couponSelect.selectedOptions[0];
        const discountValue = parseFloat(selectedOption?.dataset.discount) || 0;
        const discountType = selectedOption?.dataset.type || 'amount';

        if (discountType === 'percent') {
          couponDiscount = Math.floor(orderData.total * (discountValue / 100));
        } else {
          couponDiscount = discountValue;
        }
      }

      const finalAmount = Math.max(0, orderData.total - validatedPoints - couponDiscount);

      // 선택된 결제 수단 가져오기
      const selectedPaymentMethod = document.querySelector('.payment-method-item.active')?.dataset.method || '카드';

      console.log('💳 TLL 결제 확인 버튼 클릭:', {
        validatedPoints,
        selectedCouponId,
        couponDiscount,
        finalAmount,
        paymentMethod: selectedPaymentMethod
      });

      try {
        // 1. TLL 체크 생성
        const qrCode = `TABLE_${tableNum}`;
        const userInfo = getUserInfoSafely();

        let requestBody = { qr_code: qrCode };
        if (userInfo.id && userInfo.id !== 'guest') {
          requestBody.user_id = userInfo.id;
        } else if (userInfo.phone) {
          requestBody.guest_phone = userInfo.phone;
        } else {
          requestBody.guest_phone = '010-0000-0000';
        }

        console.log('📝 TLL 체크 생성 요청:', requestBody);

        const checkResponse = await fetch('/api/tll/checks/from-qr', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(requestBody)
        });

        if (!checkResponse.ok) {
          const errorData = await checkResponse.json();
          throw new Error(errorData.error || 'TLL 체크 생성 실패');
        }

        const checkData = await checkResponse.json();
        const checkId = checkData.check_id;
        console.log('✅ TLL 체크 생성 완료:', checkId);

        // 2. TLL 주문 생성
        const orderItems = orderData.items.map(item => ({
          menu_name: item.name,
          unit_price: item.price,
          quantity: item.qty,
          options: {},
          notes: ''
        }));

        const orderResponse = await fetch('/api/tll/orders', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            check_id: checkId,
            items: orderItems,
            payment_method: 'TOSS',
            toss_order_id: `TLL_${checkId}_${Date.now()}`
          })
        });

        if (!orderResponse.ok) {
          const errorData = await orderResponse.json();
          throw new Error(errorData.error || 'TLL 주문 생성 실패');
        }

        const orderResult = await orderResponse.json();
        console.log('✅ TLL 주문 생성 성공:', orderResult);

        // 3. 토스페이먼츠 모듈 로드 및 결제 요청
        if (!window.requestTossPayment) {
          console.log('🔄 토스페이먼츠 모듈 로드 중...');
          await import('/TLG/pages/store/pay/tossPayments.js');
        }

        if (!window.requestTossPayment) {
          throw new Error('토스페이먼츠 모듈 로드 실패');
        }

        // 주문 정보 세션에 저장 (결제 성공 후 사용)
        sessionStorage.setItem('tllPendingOrder', JSON.stringify({
          checkId: checkId,
          storeId: store.id,
          storeName: store.name,
          tableNumber: tableNum,
          tableName: `${tableNum}번 테이블`,
          items: orderData.items,
          totalAmount: finalAmount,
          usedPoints: validatedPoints,
          usedCoupon: selectedCouponId,
          couponDiscount: couponDiscount
        }));

        // 결제 데이터 구성
        const paymentData = {
          amount: finalAmount,
          orderId: `TLL_${checkId}_${Date.now()}`,
          orderName: `${store.name} - ${tableNum}번 테이블`,
          customerName: userInfo.name || '고객',
          customerEmail: userInfo.email || 'customer@tablelink.com'
        };

        console.log('💳 TLL 결제 데이터:', paymentData);

        // 결제 요청 (결제창으로 리디렉션)
        const paymentResult = await window.requestTossPayment(paymentData, selectedPaymentMethod);

        if (!paymentResult.success) {
          if (paymentResult.code === 'USER_CANCEL') {
            showToast('결제가 취소되었습니다');
            return;
          }
          throw new Error(paymentResult.error || '결제 요청 실패');
        }

        console.log('✅ TLL 결제 요청 성공 - 결제창으로 이동');

      } catch (error) {
        console.error('❌ TLL 결제 처리 실패:', error);
        alert('결제 처리 중 오류가 발생했습니다: ' + error.message);
      }
    });

    // 취소
    document.getElementById('cancelPayBtn').addEventListener('click', () => {
      renderOrderScreen(store, tableNum);
    });
  }

  // 최종 금액 계산
  function calculateFinalAmount() {
    const usePointInput = document.getElementById('usePoint');
    const usePoint = parseInt(usePointInput.value) || 0;
    const maxUsable = Math.min(parseInt(usePointInput.max) || 0, orderData.total);

    // 포인트 사용량 실시간 제한
    const validatedPoints = Math.min(usePoint, maxUsable);
    if (usePoint !== validatedPoints) {
      usePointInput.value = validatedPoints;
    }

    const couponSelect = document.getElementById('couponSelect');
    let couponDiscount = 0;

    if (couponSelect && couponSelect.value) {
      const selectedOption = couponSelect.selectedOptions[0];
      const discountValue = parseFloat(selectedOption?.dataset.discount) || 0;
      const discountType = selectedOption?.dataset.type || 'amount';

      if (discountType === 'percent') {
        // 퍼센트 할인: 주문 금액의 %
        couponDiscount = Math.floor(orderData.total * (discountValue / 100));
      } else {
        // 정액 할인
        couponDiscount = discountValue;
      }
    }

    const totalDiscount = validatedPoints + couponDiscount;
    const finalAmount = Math.max(0, orderData.total - totalDiscount);

    // 할인 행 표시/숨김
    const discountRow = document.getElementById('discountRow');
    if (totalDiscount > 0) {
      discountRow.style.display = 'flex';
      document.getElementById('discountAmount').textContent = `-${totalDiscount.toLocaleString()}원`;

      if (validatedPoints > 0 && couponDiscount > 0) {
        document.getElementById('discountLabel').textContent = '포인트 + 쿠폰 할인';
      } else if (validatedPoints > 0) {
        document.getElementById('discountLabel').textContent = '포인트 할인';
      } else {
        document.getElementById('discountLabel').textContent = '쿠폰 할인';
      }
    } else {
      discountRow.style.display = 'none';
    }

    // 최종 금액 업데이트
    document.getElementById('finalAmount').textContent = `${finalAmount.toLocaleString()}원`;
    document.getElementById('payBtnAmount').textContent = `${finalAmount.toLocaleString()}원`;

    // 적립 포인트 업데이트
    const earnedPoints = Math.floor(finalAmount * 0.1);
    document.getElementById('pointEarned').textContent = `+${earnedPoints.toLocaleString()}P`;
  }
}