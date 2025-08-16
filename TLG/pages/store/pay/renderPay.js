
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
      <div class="pay-header">
        <button id="payBackBtn" class="header-back-btn" aria-label="뒤로가기">
          <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor">
            <path d="M19 12H5m7-7l-7 7 7 7"/>
          </svg>
        </button>
        <div class="header-title">
          <h1>결제 확인</h1>
          <p class="header-subtitle">${orderData.store} • 테이블 ${orderData.table}</p>
        </div>
      </div>

      <div class="pay-content">
        <!-- 주문 내역 카드 -->
        <div class="order-summary-card">
          <div class="card-header">
            <h3>주문 내역</h3>
            <span class="item-count">${items.length}개 메뉴</span>
          </div>
          <div class="order-items-list">
            ${items.map(item => `
              <div class="order-item">
                <div class="item-info">
                  <span class="item-name">${item.name}</span>
                  <span class="item-qty">× ${item.qty}</span>
                </div>
                <span class="item-price">${item.totalPrice.toLocaleString()}원</span>
              </div>
            `).join('')}
          </div>
          <div class="subtotal">
            <span>소계</span>
            <span class="subtotal-amount">${orderData.total.toLocaleString()}원</span>
          </div>
        </div>

        <!-- 포인트 사용 카드 -->
        <div class="points-card">
          <div class="card-header">
            <h3>포인트 사용</h3>
            <div class="points-badge" id="storePointDisplay">포인트 조회 중...</div>
          </div>
          <div class="points-input-group">
            <input type="number" id="usePoint" min="0" max="0" value="0" disabled placeholder="사용할 포인트">
            <button class="max-btn" id="maxPointBtn" disabled>전액 사용</button>
          </div>
        </div>

        <!-- 쿠폰 사용 카드 -->
        <div class="coupon-card">
          <div class="card-header">
            <h3>쿠폰 사용</h3>
          </div>
          <div id="couponList" class="coupon-content"></div>
        </div>

        <!-- 결제 금액 요약 -->
        <div class="payment-summary-card">
          <div class="summary-row">
            <span>주문 금액</span>
            <span>${orderData.total.toLocaleString()}원</span>
          </div>
          <div class="summary-row discount" id="discountRow" style="display: none;">
            <span id="discountLabel">할인 금액</span>
            <span id="discountAmount" class="discount-amount">-0원</span>
          </div>
          <div class="summary-total">
            <span>최종 결제 금액</span>
            <span id="finalAmount" class="final-amount">${orderData.total.toLocaleString()}원</span>
          </div>
          <div class="points-earned">
            <span>💰 적립 예정 포인트</span>
            <span id="pointEarned" class="earned-points">+${Math.floor(orderData.total * 0.1).toLocaleString()}원</span>
          </div>
        </div>

        <!-- 결제 버튼 -->
        <div class="payment-actions">
          <button id="confirmPay" class="pay-btn primary">
            <span class="btn-text">결제하기</span>
            <span class="btn-amount" id="payBtnAmount">${orderData.total.toLocaleString()}원</span>
          </button>
          <button id="cancelPay" class="pay-btn secondary">취소</button>
        </div>
      </div>
    </div>

    <style>
      .pay-container {
        min-height: 100vh;
        height: auto;
        background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
        padding-bottom: 120px;
        overflow-y: auto;
        -webkit-overflow-scrolling: touch;
      }

      .pay-header {
        background: white;
        padding: 20px 16px;
        display: flex;
        align-items: center;
        gap: 16px;
        box-shadow: 0 2px 12px rgba(0, 0, 0, 0.04);
        position: sticky;
        top: 0;
        z-index: 100;
        width: 100%;
        box-sizing: border-box;
      }

      .header-back-btn {
        width: 44px;
        height: 44px;
        border-radius: 12px;
        border: none;
        background: #f1f5f9;
        color: #475569;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        transition: all 0.2s ease;
      }

      .header-back-btn:hover {
        background: #e2e8f0;
        color: #334155;
      }

      .header-back-btn:active {
        transform: scale(0.95);
      }

      .header-title h1 {
        margin: 0;
        font-size: 24px;
        font-weight: 700;
        color: #1e293b;
        line-height: 1.2;
      }

      .header-subtitle {
        margin: 4px 0 0 0;
        font-size: 14px;
        color: #64748b;
        font-weight: 500;
      }

      .pay-content {
        padding: 20px 16px;
        max-width: 480px;
        margin: 0 auto;
        display: flex;
        flex-direction: column;
        gap: 16px;
        min-height: calc(100vh - 120px);
        overflow-y: auto;
        -webkit-overflow-scrolling: touch;
      }

      .order-summary-card,
      .points-card,
      .coupon-card,
      .payment-summary-card {
        background: white;
        border-radius: 16px;
        padding: 20px;
        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.04);
        border: 1px solid rgba(226, 232, 240, 0.8);
      }

      .card-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 16px;
      }

      .card-header h3 {
        margin: 0;
        font-size: 18px;
        font-weight: 700;
        color: #1e293b;
      }

      .item-count {
        background: #f1f5f9;
        color: #475569;
        padding: 4px 12px;
        border-radius: 12px;
        font-size: 12px;
        font-weight: 600;
      }

      .order-items-list {
        display: flex;
        flex-direction: column;
        gap: 12px;
        margin-bottom: 16px;
      }

      .order-item {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 12px 0;
        border-bottom: 1px solid #f1f5f9;
      }

      .order-item:last-child {
        border-bottom: none;
      }

      .item-info {
        display: flex;
        align-items: center;
        gap: 8px;
        flex: 1;
      }

      .item-name {
        font-weight: 600;
        color: #1e293b;
        font-size: 15px;
      }

      .item-qty {
        background: #e2e8f0;
        color: #475569;
        padding: 2px 8px;
        border-radius: 8px;
        font-size: 12px;
        font-weight: 600;
      }

      .item-price {
        font-weight: 700;
        color: #1e293b;
        font-size: 15px;
      }

      .subtotal {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 16px 0 0 0;
        border-top: 2px solid #f1f5f9;
        font-weight: 600;
        color: #475569;
      }

      .subtotal-amount {
        font-size: 18px;
        font-weight: 700;
        color: #1e293b;
      }

      .points-badge {
        background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
        color: white;
        padding: 6px 12px;
        border-radius: 12px;
        font-size: 12px;
        font-weight: 600;
        box-shadow: 0 2px 8px rgba(59, 130, 246, 0.2);
      }

      .points-input-group {
        display: flex;
        gap: 8px;
        align-items: stretch;
      }

      .points-input-group input {
        flex: 1;
        padding: 12px 16px;
        border: 2px solid #e2e8f0;
        border-radius: 12px;
        font-size: 15px;
        font-weight: 500;
        background: #f8fafc;
        color: #1e293b;
        transition: all 0.2s ease;
      }

      .points-input-group input:focus {
        outline: none;
        border-color: #3b82f6;
        background: white;
        box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
      }

      .points-input-group input:disabled {
        opacity: 0.6;
        cursor: not-allowed;
      }

      .max-btn {
        padding: 12px 16px;
        border: 2px solid #3b82f6;
        border-radius: 12px;
        background: white;
        color: #3b82f6;
        font-size: 13px;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.2s ease;
      }

      .max-btn:hover:not(:disabled) {
        background: #3b82f6;
        color: white;
      }

      .max-btn:disabled {
        opacity: 0.4;
        cursor: not-allowed;
      }

      .coupon-content select {
        width: 100%;
        padding: 12px 16px;
        border: 2px solid #e2e8f0;
        border-radius: 12px;
        font-size: 15px;
        font-weight: 500;
        background: #f8fafc;
        color: #1e293b;
        cursor: pointer;
        transition: all 0.2s ease;
      }

      .coupon-content select:focus {
        outline: none;
        border-color: #3b82f6;
        background: white;
        box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
      }

      .coupon-content p {
        margin: 0;
        color: #64748b;
        font-size: 14px;
        text-align: center;
        padding: 16px 0;
      }

      .payment-summary-card {
        background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
        border: 2px solid #e2e8f0;
      }

      .summary-row {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 8px 0;
        font-size: 15px;
        color: #475569;
      }

      .summary-row.discount {
        color: #059669;
        font-weight: 600;
      }

      .discount-amount {
        color: #059669;
        font-weight: 700;
      }

      .summary-total {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 16px 0 12px 0;
        border-top: 2px solid #e2e8f0;
        margin-top: 8px;
      }

      .summary-total span:first-child {
        font-size: 16px;
        font-weight: 600;
        color: #1e293b;
      }

      .final-amount {
        font-size: 20px;
        font-weight: 800;
        color: #1e293b;
        background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        background-clip: text;
      }

      .points-earned {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 8px 12px;
        background: rgba(59, 130, 246, 0.1);
        border-radius: 8px;
        font-size: 14px;
        margin-top: 12px;
      }

      .earned-points {
        font-weight: 700;
        color: #1d4ed8;
      }

      .payment-actions {
        display: flex;
        flex-direction: column;
        gap: 12px;
        margin-top: 8px;
      }

      .pay-btn {
        padding: 16px 24px;
        border-radius: 16px;
        font-size: 16px;
        font-weight: 700;
        border: none;
        cursor: pointer;
        transition: all 0.2s ease;
        display: flex;
        justify-content: space-between;
        align-items: center;
      }

      .pay-btn.primary {
        background: linear-gradient(135deg, #059669 0%, #047857 100%);
        color: white;
        box-shadow: 0 4px 20px rgba(5, 150, 105, 0.3);
      }

      .pay-btn.primary:hover {
        transform: translateY(-2px);
        box-shadow: 0 6px 25px rgba(5, 150, 105, 0.4);
      }

      .pay-btn.primary:active {
        transform: translateY(0);
        box-shadow: 0 2px 12px rgba(5, 150, 105, 0.3);
      }

      .pay-btn.secondary {
        background: white;
        color: #475569;
        border: 2px solid #e2e8f0;
        justify-content: center;
      }

      .pay-btn.secondary:hover {
        background: #f8fafc;
        border-color: #cbd5e1;
      }

      .btn-amount {
        font-size: 18px;
        font-weight: 800;
      }

      @media (max-width: 480px) {
        .pay-container {
          padding-bottom: 140px;
        }
        
        .pay-header {
          padding: 16px 12px;
        }
        
        .pay-content {
          padding: 16px 12px;
          min-height: calc(100vh - 140px);
        }
        
        .order-summary-card,
        .points-card,
        .coupon-card,
        .payment-summary-card {
          padding: 16px;
        }
        
        .header-title h1 {
          font-size: 20px;
        }
        
        .final-amount {
          font-size: 18px;
        }
      }
    </style>
  `;

  // 요소 선택
  const usePointInput = document.getElementById('usePoint');
  const storePointDisplay = document.getElementById('storePointDisplay');
  const finalAmount = document.getElementById('finalAmount');
  const pointEarned = document.getElementById('pointEarned');
  const couponList = document.getElementById('couponList');
  const discountAmount = document.getElementById('discountAmount');
  const discountRow = document.getElementById('discountRow');
  const payBtnAmount = document.getElementById('payBtnAmount');
  const maxPointBtn = document.getElementById('maxPointBtn');

  // 매장별 포인트 조회 및 표시 (비동기 처리)
  let storePoints = 0;
  
  // 매장별 포인트 조회
  async function loadStorePoints() {
    try {
      const storePointsResponse = await fetch(`/api/regular-levels/user/${userInfo.id}/store/${store.id}/points`);
      if (storePointsResponse.ok) {
        const storePointsData = await storePointsResponse.json();
        storePoints = storePointsData.success ? (storePointsData.points || 0) : 0;
      }
    } catch (error) {
      console.error('매장별 포인트 조회 실패:', error);
    }

    // 포인트 사용 섹션 업데이트
    storePointDisplay.textContent = `${storePoints.toLocaleString()}P 보유`;
    usePointInput.max = storePoints;
    usePointInput.placeholder = `최대 ${storePoints.toLocaleString()}P`;
    usePointInput.disabled = false;
    
    if (storePoints > 0) {
      maxPointBtn.disabled = false;
      maxPointBtn.onclick = () => {
        const maxUsable = Math.min(storePoints, orderData.total);
        usePointInput.value = maxUsable;
        updateFinalAmount();
      };
    }
    
    // 최초 1회 초기 계산
    updateFinalAmount();
  }

  // 포인트 조회 시작
  loadStorePoints();

  // 쿠폰 리스트 렌더링
  let select = null;
  if (!userInfo.coupons?.unused || userInfo.coupons.unused.length === 0) {
    couponList.innerHTML = `<p>보유한 쿠폰이 없습니다</p>`;
  } else {
    select = document.createElement('select');
    select.id = 'selectedCoupon';
    select.innerHTML = `<option value="">쿠폰을 선택하세요</option>`;
    userInfo.coupons.unused
      .filter(c => new Date(c.validUntil) >= new Date())
      .forEach(coupon => {
        const option = document.createElement('option');
        option.value = coupon.id;
        option.textContent = `${coupon.name} (${coupon.discountValue}${coupon.discountType === 'percent' ? '%' : '원'} 할인)`;
        select.appendChild(option);
      });
    couponList.appendChild(select);
  }

  // 할인 계산 함수
  function calculateBestPayment(orderTotal, coupon, userStorePoints, enteredPoint) {
    enteredPoint = Math.min(enteredPoint, userStorePoints, orderTotal);
    let discount1 = 0;
    if (coupon?.discountType === 'percent') {
      discount1 = Math.floor(orderTotal * (coupon.discountValue / 100));
    } else if (coupon?.discountType === 'fixed') {
      discount1 = coupon.discountValue;
    }
    const afterCoupon = Math.max(orderTotal - discount1, 0);
    const appliedPoint1 = Math.min(enteredPoint, afterCoupon);
    const final1 = Math.max(afterCoupon - appliedPoint1, 0);

    const afterPoint = Math.max(orderTotal - enteredPoint, 0);
    let discount2 = 0;
    if (coupon?.discountType === 'percent') {
      discount2 = Math.floor(afterPoint * (coupon.discountValue / 100));
    } else if (coupon?.discountType === 'fixed') {
      discount2 = coupon.discountValue;
    }
    const final2 = Math.max(afterPoint - discount2, 0);

    if (final1 < final2) {
      return {
        final: final1,
        appliedPoint: appliedPoint1,
        couponDiscount: discount1,
        strategy: 'couponFirst'
      };
    } else {
      return {
        final: final2,
        appliedPoint: enteredPoint,
        couponDiscount: discount2,
        strategy: 'pointFirst'
      };
    }
  }

  // 실시간 반영 함수
  function updateFinalAmount() {
    const enteredPoint = Number(usePointInput.value) || 0;
    const selectedCouponId = document.getElementById('selectedCoupon')?.value;
    const selectedCoupon = userInfo.coupons?.unused?.find(c => c.id == selectedCouponId);

    const result = calculateBestPayment(orderData.total, selectedCoupon, storePoints, enteredPoint);

    finalAmount.textContent = `${result.final.toLocaleString()}원`;
    payBtnAmount.textContent = `${result.final.toLocaleString()}원`;

    const totalDiscount = result.couponDiscount + result.appliedPoint;
    if (totalDiscount > 0) {
      discountAmount.textContent = `-${totalDiscount.toLocaleString()}원`;
      discountRow.style.display = 'flex';
    } else {
      discountRow.style.display = 'none';
    }

    // 적립 포인트 업데이트
    const earnedPoints = Math.floor(result.final * 0.1);
    pointEarned.textContent = `+${earnedPoints.toLocaleString()}원`;
  }

  // 이벤트 등록
  usePointInput.addEventListener('input', updateFinalAmount);
  document.getElementById('selectedCoupon')?.addEventListener('change', updateFinalAmount);

  document.getElementById('confirmPay').addEventListener('click', async () => {
    const confirmPayBtn = document.getElementById('confirmPay');
    
    try {
      // 버튼 비활성화 및 로딩 상태 표시
      confirmPayBtn.disabled = true;
      confirmPayBtn.innerHTML = `
        <div class="btn-content">
          <span class="btn-text">결제 처리 중...</span>
          <span class="btn-icon">⏳</span>
        </div>
      `;

      const enteredPoint = Number(usePointInput.value) || 0;
      const selectedCouponId = document.getElementById('selectedCoupon')?.value;
      const selectedCoupon = userInfo.coupons?.unused?.find(c => c.id == selectedCouponId);

      const result = calculateBestPayment(orderData.total, selectedCoupon, storePoints, enteredPoint);

      await confirmPay(
        orderData,
        result.appliedPoint,
        store,
        currentOrder,
        result.final,
        selectedCoupon?.id || null,
        result.couponDiscount
      );
    } catch (error) {
      console.error('결제 처리 중 오류:', error);
      // 버튼 원복
      confirmPayBtn.disabled = false;
      confirmPayBtn.innerHTML = `
        <div class="btn-content">
          <span class="btn-text">결제하기</span>
          <span class="btn-amount" id="payBtnAmount">${orderData.total.toLocaleString()}원</span>
        </div>
      `;
      alert('결제 처리 중 오류가 발생했습니다. 다시 시도해주세요.');
    }
  });

  document.getElementById('cancelPay').addEventListener('click', () => {
    renderOrderScreen(store, tableNum);
  });

  document.getElementById('payBackBtn').addEventListener('click', () => {
    renderOrderScreen(store, tableNum);
  });
}

window.renderPay = renderPay;
