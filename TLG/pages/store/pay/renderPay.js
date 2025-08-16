
function renderPay(currentOrder, store, tableNum) {
  console.log('💳 결제 화면 렌더링 시작 - 매장:', store, '테이블:', tableNum);

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
      <div class="pay-header">
        <button id="payBackBtn" class="back-btn">
          ← 뒤로가기
        </button>
        <div class="header-info">
          <h1>결제 확인</h1>
          <p>${orderData.store} • 테이블 ${orderData.table}</p>
        </div>
      </div>

      <!-- 메인 콘텐츠 -->
      <div class="pay-body">
        <!-- 주문 내역 -->
        <div class="order-section">
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
        </div>

        <!-- 포인트 사용 -->
        <div class="points-section">
          <div class="section-title">
            <h2>포인트 사용</h2>
            <div id="storePointDisplay" class="point-balance">조회 중...</div>
          </div>
          <div class="point-input-group">
            <input type="number" id="usePoint" min="0" max="0" value="0"
                   placeholder="사용할 포인트" disabled class="point-input">
            <button id="maxPointBtn" class="max-point-btn" disabled>전액</button>
          </div>
        </div>

        <!-- 쿠폰 사용 -->
        <div class="coupon-section">
          <div class="section-title">
            <h2>쿠폰 사용</h2>
          </div>
          <div id="couponList" class="coupon-select"></div>
        </div>

        <!-- 결제 요약 -->
        <div class="summary-section">
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
        </div>
      </div>

      <!-- 하단 버튼 -->
      <div class="pay-footer">
        <button id="confirmPayBtn" class="confirm-btn">
          <span>결제하기</span>
          <span id="payBtnAmount" class="btn-price">${orderData.total.toLocaleString()}원</span>
        </button>
        <button id="cancelPayBtn" class="cancel-btn">취소</button>
      </div>
    </div>

    <style>
      .pay-container {
        height: 100vh;
        display: flex;
        flex-direction: column;
        background: #f8fafc;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      }

      .pay-header {
        background: white;
        padding: 16px;
        border-bottom: 1px solid #e2e8f0;
        display: flex;
        align-items: center;
        gap: 12px;
        flex-shrink: 0;
      }

      .back-btn {
        background: #f1f5f9;
        border: none;
        padding: 8px 12px;
        border-radius: 8px;
        cursor: pointer;
        color: #475569;
        font-size: 14px;
      }

      .back-btn:hover {
        background: #e2e8f0;
      }

      .header-info h1 {
        margin: 0;
        font-size: 18px;
        color: #1e293b;
      }

      .header-info p {
        margin: 0;
        font-size: 13px;
        color: #64748b;
      }

      .pay-body {
        flex: 1;
        overflow-y: auto;
        padding: 16px;
        padding-bottom: 100px;
        display: flex;
        flex-direction: column;
        gap: 16px;
        max-width: 500px;
        margin: 0 auto;
        width: 100%;
      }

      .order-section, .points-section, .coupon-section, .summary-section {
        background: white;
        border-radius: 12px;
        padding: 20px;
        box-shadow: 0 2px 8px rgba(0,0,0,0.06);
      }

      .section-title {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 16px;
      }

      .section-title h2 {
        margin: 0;
        font-size: 16px;
        font-weight: 600;
        color: #1e293b;
      }

      .item-count {
        background: #f1f5f9;
        color: #475569;
        padding: 4px 8px;
        border-radius: 6px;
        font-size: 12px;
        font-weight: 600;
      }

      .order-list {
        margin-bottom: 16px;
      }

      .order-item {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 8px 0;
        border-bottom: 1px solid #f1f5f9;
      }

      .order-item:last-child {
        border-bottom: none;
      }

      .item-info {
        display: flex;
        align-items: center;
        gap: 8px;
      }

      .item-name {
        font-weight: 500;
        color: #1e293b;
      }

      .item-qty {
        background: #e2e8f0;
        color: #475569;
        padding: 2px 6px;
        border-radius: 4px;
        font-size: 11px;
        font-weight: 600;
      }

      .item-price {
        font-weight: 600;
        color: #3b82f6;
      }

      .subtotal-row {
        display: flex;
        justify-content: space-between;
        padding-top: 16px;
        border-top: 2px solid #f1f5f9;
        font-weight: 600;
        color: #475569;
      }

      .subtotal-amount {
        color: #1e293b;
        font-weight: 700;
      }

      .point-balance {
        background: linear-gradient(135deg, #3b82f6, #1d4ed8);
        color: white;
        padding: 4px 10px;
        border-radius: 6px;
        font-size: 12px;
        font-weight: 600;
      }

      .point-input-group {
        display: flex;
        gap: 8px;
      }

      .point-input {
        flex: 1;
        padding: 12px;
        border: 2px solid #e2e8f0;
        border-radius: 8px;
        font-size: 14px;
        background: #f8fafc;
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
        padding: 12px 16px;
        border: 2px solid #3b82f6;
        border-radius: 8px;
        background: white;
        color: #3b82f6;
        font-weight: 600;
        cursor: pointer;
      }

      .max-point-btn:hover:not(:disabled) {
        background: #3b82f6;
        color: white;
      }

      .max-point-btn:disabled {
        opacity: 0.4;
        cursor: not-allowed;
      }

      .coupon-select select {
        width: 100%;
        padding: 12px;
        border: 2px solid #e2e8f0;
        border-radius: 8px;
        font-size: 14px;
        background: #f8fafc;
        cursor: pointer;
      }

      .coupon-select select:focus {
        outline: none;
        border-color: #3b82f6;
        background: white;
      }

      .coupon-select p {
        color: #64748b;
        text-align: center;
        padding: 16px;
        margin: 0;
        font-size: 14px;
      }

      .summary-section {
        background: linear-gradient(135deg, #f8fafc, #f1f5f9);
        border: 2px solid #e2e8f0;
      }

      .summary-details {
        margin-bottom: 16px;
      }

      .summary-item {
        display: flex;
        justify-content: space-between;
        padding: 4px 0;
        color: #475569;
        font-size: 14px;
      }

      .discount-item {
        color: #059669;
        font-weight: 600;
      }

      .discount-text {
        color: #059669;
        font-weight: 700;
      }

      .final-total-row {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 16px 0 12px 0;
        border-top: 2px solid #e2e8f0;
        font-weight: 600;
        color: #1e293b;
      }

      .final-amount {
        font-size: 20px;
        font-weight: 800;
        color: #3b82f6;
      }

      .earn-point-info {
        display: flex;
        justify-content: space-between;
        padding: 12px;
        background: rgba(59, 130, 246, 0.1);
        border-radius: 8px;
        font-size: 13px;
        margin-top: 8px;
      }

      .earn-amount {
        font-weight: 700;
        color: #1d4ed8;
      }

      .pay-footer {
        position: fixed;
        bottom: 0;
        left: 0;
        right: 0;
        background: white;
        padding: 16px;
        border-top: 1px solid #e2e8f0;
        box-shadow: 0 -4px 12px rgba(0,0,0,0.08);
        display: flex;
        flex-direction: column;
        gap: 8px;
        max-width: 500px;
        margin: 0 auto;
      }

      .confirm-btn {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 16px 20px;
        border: none;
        border-radius: 12px;
        background: linear-gradient(135deg, #059669, #047857);
        color: white;
        font-size: 16px;
        font-weight: 700;
        cursor: pointer;
        box-shadow: 0 4px 12px rgba(5, 150, 105, 0.25);
      }

      .confirm-btn:hover {
        transform: translateY(-1px);
        box-shadow: 0 6px 16px rgba(5, 150, 105, 0.35);
      }

      .btn-price {
        font-size: 18px;
        font-weight: 800;
      }

      .cancel-btn {
        padding: 12px 20px;
        border: 2px solid #e2e8f0;
        border-radius: 12px;
        background: white;
        color: #475569;
        font-size: 15px;
        font-weight: 600;
        cursor: pointer;
      }

      .cancel-btn:hover {
        background: #f8fafc;
        border-color: #cbd5e1;
      }

      @media (max-width: 480px) {
        .pay-header {
          padding: 12px;
        }

        .pay-body {
          padding: 12px;
        }

        .order-section, .points-section, .coupon-section, .summary-section {
          padding: 16px;
        }

        .pay-footer {
          padding: 12px;
        }

        .final-amount {
          font-size: 18px;
        }
      }
    </style>
  `;

  // 포인트 및 쿠폰 데이터 로드
  loadStorePoint();
  loadCoupons();
  setupEventListeners();

  // 매장별 포인트 로드
  async function loadStorePoint() {
    try {
      const userId = localStorage.getItem('userId');
      if (!userId) {
        document.getElementById('storePointDisplay').textContent = '로그인 필요';
        return;
      }

      const response = await fetch(`/api/regular-levels/user-store-points/${userId}/${orderData.storeId}`);
      const data = await response.json();

      if (data.success && data.storePoint) {
        const points = data.storePoint.points || 0;
        document.getElementById('storePointDisplay').textContent = `${points.toLocaleString()}P`;

        const usePointInput = document.getElementById('usePoint');
        const maxPointBtn = document.getElementById('maxPointBtn');

        if (points > 0) {
          usePointInput.max = points;
          usePointInput.disabled = false;
          maxPointBtn.disabled = false;
        }
      } else {
        document.getElementById('storePointDisplay').textContent = '0P';
      }
    } catch (error) {
      console.error('포인트 조회 실패:', error);
      document.getElementById('storePointDisplay').textContent = '조회 실패';
    }
  }

  // 쿠폰 로드
  async function loadCoupons() {
    try {
      const userId = localStorage.getItem('userId');
      if (!userId) {
        document.getElementById('couponList').innerHTML = '<p>로그인이 필요합니다</p>';
        return;
      }

      const response = await fetch(`/api/orders/user-coupons/${userId}`);
      const data = await response.json();

      if (data.success && data.coupons && data.coupons.length > 0) {
        const couponSelect = document.createElement('select');
        couponSelect.id = 'couponSelect';

        couponSelect.innerHTML = `
          <option value="">쿠폰을 선택하세요</option>
          ${data.coupons.map(coupon => `
            <option value="${coupon.id}" data-discount="${coupon.discount_amount}">
              ${coupon.coupon_name} - ${coupon.discount_amount.toLocaleString()}원 할인
            </option>
          `).join('')}
        `;

        document.getElementById('couponList').appendChild(couponSelect);
      } else {
        document.getElementById('couponList').innerHTML = '<p>사용 가능한 쿠폰이 없습니다</p>';
      }
    } catch (error) {
      console.error('쿠폰 조회 실패:', error);
      document.getElementById('couponList').innerHTML = '<p>쿠폰 조회에 실패했습니다</p>';
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
      usePointInput.value = usePointInput.max;
      calculateFinalAmount();
    });

    // 포인트 입력
    document.getElementById('usePoint').addEventListener('input', calculateFinalAmount);

    // 쿠폰 선택
    document.addEventListener('change', (e) => {
      if (e.target.id === 'couponSelect') {
        calculateFinalAmount();
      }
    });

    // 결제 확인
    document.getElementById('confirmPayBtn').addEventListener('click', () => {
      const usePoint = parseInt(document.getElementById('usePoint').value) || 0;
      const couponSelect = document.getElementById('couponSelect');
      const selectedCouponId = couponSelect ? couponSelect.value : null;
      const couponDiscount = couponSelect ? 
        parseInt(couponSelect.selectedOptions[0]?.dataset.discount) || 0 : 0;

      const finalAmount = Math.max(0, orderData.total - usePoint - couponDiscount);

      // confirmPay 함수 호출 (올바른 매개변수 순서로)
      if (typeof confirmPay === 'function') {
        confirmPay(orderData, usePoint, store, currentOrder, finalAmount, selectedCouponId, couponDiscount);
      } else {
        console.error('❌ confirmPay 함수를 찾을 수 없습니다');
        alert('결제 처리 중 오류가 발생했습니다.');
      }
    });

    // 취소
    document.getElementById('cancelPayBtn').addEventListener('click', () => {
      renderOrderScreen(store, tableNum);
    });
  }

  // 최종 금액 계산
  function calculateFinalAmount() {
    const usePoint = parseInt(document.getElementById('usePoint').value) || 0;
    const couponSelect = document.getElementById('couponSelect');
    const couponDiscount = couponSelect ? 
      parseInt(couponSelect.selectedOptions[0]?.dataset.discount) || 0 : 0;

    const totalDiscount = usePoint + couponDiscount;
    const finalAmount = Math.max(0, orderData.total - totalDiscount);

    // 할인 행 표시/숨김
    const discountRow = document.getElementById('discountRow');
    if (totalDiscount > 0) {
      discountRow.style.display = 'flex';
      document.getElementById('discountAmount').textContent = `-${totalDiscount.toLocaleString()}원`;

      if (usePoint > 0 && couponDiscount > 0) {
        document.getElementById('discountLabel').textContent = '포인트 + 쿠폰 할인';
      } else if (usePoint > 0) {
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
