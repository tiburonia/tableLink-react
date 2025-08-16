
<old_str>function renderPay(currentOrder, store, tableNum) {
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
      <!-- 상단 헤더 -->
      <header class="pay-header">
        <button id="payBackBtn" class="back-btn">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
            <path d="M19 12H5m7-7l-7 7 7 7"/>
          </svg>
        </button>
        <div class="header-content">
          <h1>결제 확인</h1>
          <p>${orderData.store} • 테이블 ${orderData.table}</p>
        </div>
      </header>

      <!-- 스크롤 가능한 메인 컨텐츠 -->
      <main class="pay-main">
        <div class="content-wrapper">
          <!-- 주문 내역 -->
          <section class="section order-section">
            <div class="section-header">
              <h2>주문 내역</h2>
              <span class="item-badge">${items.length}개</span>
            </div>
            <div class="order-items">
              ${items.map(item => `
                <div class="order-item">
                  <div class="item-detail">
                    <span class="item-name">${item.name}</span>
                    <span class="item-qty">×${item.qty}</span>
                  </div>
                  <span class="item-price">${item.totalPrice.toLocaleString()}원</span>
                </div>
              `).join('')}
            </div>
            <div class="subtotal">
              <span>주문 금액</span>
              <span class="subtotal-price">${orderData.total.toLocaleString()}원</span>
            </div>
          </section>

          <!-- 포인트 사용 -->
          <section class="section points-section">
            <div class="section-header">
              <h2>포인트 사용</h2>
              <div id="storePointDisplay" class="points-display">조회 중...</div>
            </div>
            <div class="points-input-wrapper">
              <input type="number" id="usePoint" min="0" max="0" value="0"
                     placeholder="사용할 포인트" disabled class="points-input">
              <button id="maxPointBtn" class="max-btn" disabled>전액</button>
            </div>
          </section>

          <!-- 쿠폰 사용 -->
          <section class="section coupon-section">
            <div class="section-header">
              <h2>쿠폰 사용</h2>
            </div>
            <div id="couponList" class="coupon-wrapper"></div>
          </section>

          <!-- 결제 요약 -->
          <section class="section summary-section">
            <div class="summary-rows">
              <div class="summary-row">
                <span>주문 금액</span>
                <span>${orderData.total.toLocaleString()}원</span>
              </div>
              <div class="summary-row discount-row" id="discountRow" style="display: none;">
                <span id="discountLabel">할인 금액</span>
                <span id="discountAmount" class="discount-value">-0원</span>
              </div>
            </div>
            <div class="final-total">
              <span>최종 결제</span>
              <span id="finalAmount" class="final-price">${orderData.total.toLocaleString()}원</span>
            </div>
            <div class="earn-points">
              <span>💰 적립 예정</span>
              <span id="pointEarned" class="earn-value">+${Math.floor(orderData.total * 0.1).toLocaleString()}P</span>
            </div>
          </section>
        </div>
      </main>

      <!-- 하단 고정 결제 버튼 -->
      <footer class="pay-footer">
        <button id="confirmPay" class="pay-btn primary">
          <span>결제하기</span>
          <span id="payBtnAmount" class="btn-amount">${orderData.total.toLocaleString()}원</span>
        </button>
        <button id="cancelPay" class="pay-btn secondary">취소</button>
      </footer>
    </div>

    <style>
      * {
        box-sizing: border-box;
        margin: 0;
        padding: 0;
      }

      .pay-container {
        height: 100vh;
        display: flex;
        flex-direction: column;
        background: #f8fafc;
      }

      /* 상단 헤더 */
      .pay-header {
        flex-shrink: 0;
        height: 70px;
        background: white;
        padding: 16px 20px;
        display: flex;
        align-items: center;
        gap: 16px;
        border-bottom: 1px solid #e2e8f0;
        box-shadow: 0 1px 3px rgba(0,0,0,0.1);
        z-index: 100;
      }

      .back-btn {
        width: 40px;
        height: 40px;
        border: none;
        border-radius: 10px;
        background: #f1f5f9;
        color: #475569;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        transition: background 0.2s;
      }

      .back-btn:hover {
        background: #e2e8f0;
      }

      .header-content h1 {
        font-size: 20px;
        font-weight: 700;
        color: #1e293b;
        margin-bottom: 2px;
      }

      .header-content p {
        font-size: 14px;
        color: #64748b;
      }

      /* 메인 스크롤 영역 */
      .pay-main {
        flex: 1;
        overflow-y: auto;
        overflow-x: hidden;
        -webkit-overflow-scrolling: touch;
        height: calc(100vh - 70px - 80px); /* 헤더(70px) + 푸터(80px) */
      }

      .content-wrapper {
        max-width: 500px;
        margin: 0 auto;
        padding: 20px 20px 20px 20px; /* 하단 패딩 제거 */
        display: flex;
        flex-direction: column;
        gap: 20px;
      }

      /* 섹션 공통 스타일 */
      .section {
        background: white;
        border-radius: 16px;
        padding: 20px;
        border: 1px solid #e2e8f0;
        box-shadow: 0 1px 3px rgba(0,0,0,0.1);
      }

      .section-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 16px;
      }

      .section-header h2 {
        font-size: 18px;
        font-weight: 700;
        color: #1e293b;
      }

      .item-badge {
        background: #f1f5f9;
        color: #475569;
        padding: 4px 10px;
        border-radius: 12px;
        font-size: 12px;
        font-weight: 600;
      }

      /* 주문 내역 */
      .order-items {
        display: flex;
        flex-direction: column;
        gap: 12px;
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

      .item-detail {
        display: flex;
        align-items: center;
        gap: 8px;
      }

      .item-name {
        font-weight: 600;
        color: #1e293b;
      }

      .item-qty {
        background: #e2e8f0;
        color: #475569;
        padding: 2px 6px;
        border-radius: 6px;
        font-size: 12px;
        font-weight: 600;
      }

      .item-price {
        font-weight: 700;
        color: #1e293b;
      }

      .subtotal {
        display: flex;
        justify-content: space-between;
        padding-top: 16px;
        border-top: 2px solid #f1f5f9;
        font-weight: 600;
        color: #475569;
      }

      .subtotal-price {
        color: #1e293b;
        font-weight: 700;
      }

      /* 포인트 섹션 */
      .points-display {
        background: linear-gradient(135deg, #3b82f6, #1d4ed8);
        color: white;
        padding: 6px 12px;
        border-radius: 12px;
        font-size: 12px;
        font-weight: 600;
      }

      .points-input-wrapper {
        display: flex;
        gap: 8px;
      }

      .points-input {
        flex: 1;
        padding: 12px 16px;
        border: 2px solid #e2e8f0;
        border-radius: 12px;
        font-size: 15px;
        background: #f8fafc;
        transition: all 0.2s;
      }

      .points-input:focus {
        outline: none;
        border-color: #3b82f6;
        background: white;
        box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
      }

      .points-input:disabled {
        opacity: 0.6;
        cursor: not-allowed;
      }

      .max-btn {
        padding: 12px 16px;
        border: 2px solid #3b82f6;
        border-radius: 12px;
        background: white;
        color: #3b82f6;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.2s;
      }

      .max-btn:hover:not(:disabled) {
        background: #3b82f6;
        color: white;
      }

      .max-btn:disabled {
        opacity: 0.4;
        cursor: not-allowed;
      }

      /* 쿠폰 섹션 */
      .coupon-wrapper select {
        width: 100%;
        padding: 12px 16px;
        border: 2px solid #e2e8f0;
        border-radius: 12px;
        font-size: 15px;
        background: #f8fafc;
        cursor: pointer;
        transition: all 0.2s;
      }

      .coupon-wrapper select:focus {
        outline: none;
        border-color: #3b82f6;
        background: white;
        box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
      }

      .coupon-wrapper p {
        color: #64748b;
        text-align: center;
        padding: 16px;
        font-size: 14px;
      }

      /* 결제 요약 */
      .summary-section {
        background: linear-gradient(135deg, #f8fafc, #f1f5f9);
        border: 2px solid #e2e8f0;
      }

      .summary-rows {
        display: flex;
        flex-direction: column;
        gap: 8px;
        margin-bottom: 16px;
      }

      .summary-row {
        display: flex;
        justify-content: space-between;
        color: #475569;
        font-size: 15px;
      }

      .discount-row {
        color: #059669;
        font-weight: 600;
      }

      .discount-value {
        color: #059669;
        font-weight: 700;
      }

      .final-total {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 16px 0 12px 0;
        border-top: 2px solid #e2e8f0;
        font-weight: 600;
        color: #1e293b;
      }

      .final-price {
        font-size: 20px;
        font-weight: 800;
        background: linear-gradient(135deg, #3b82f6, #1d4ed8);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        background-clip: text;
      }

      .earn-points {
        display: flex;
        justify-content: space-between;
        padding: 12px;
        background: rgba(59, 130, 246, 0.1);
        border-radius: 8px;
        font-size: 14px;
        margin-top: 12px;
      }

      .earn-value {
        font-weight: 700;
        color: #1d4ed8;
      }

      /* 하단 고정 결제 버튼 */
      .pay-footer {
        position: fixed;
        bottom: 0;
        left: 0;
        right: 0;
        height: 80px;
        background: white;
        padding: 8px 20px;
        border-top: 1px solid #e2e8f0;
        box-shadow: 0 -2px 10px rgba(0,0,0,0.1);
        display: flex;
        flex-direction: column;
        gap: 8px;
        max-width: 500px;
        margin: 0 auto;
        width: 100%;
        z-index: 1000;
      }

      .pay-btn {
        padding: 12px 20px;
        border: none;
        border-radius: 12px;
        font-size: 16px;
        font-weight: 700;
        cursor: pointer;
        transition: all 0.2s;
        display: flex;
        justify-content: space-between;
        align-items: center;
      }

      .pay-btn.primary {
        background: linear-gradient(135deg, #059669, #047857);
        color: white;
        box-shadow: 0 4px 15px rgba(5, 150, 105, 0.3);
      }

      .pay-btn.primary:hover {
        transform: translateY(-1px);
        box-shadow: 0 6px 20px rgba(5, 150, 105, 0.4);
      }

      .pay-btn.secondary {
        background: white;
        color: #475569;
        border: 2px solid #e2e8f0;
        justify-content: center;
      }

      .pay-btn.secondary:hover {
        background: #f8fafc;
      }

      .btn-amount {
        font-size: 18px;
        font-weight: 800;
      }

      /* 스크롤바 커스텀 */
      .pay-main::-webkit-scrollbar {
        width: 4px;
      }

      .pay-main::-webkit-scrollbar-track {
        background: transparent;
      }

      .pay-main::-webkit-scrollbar-thumb {
        background: rgba(0, 0, 0, 0.1);
        border-radius: 2px;
      }

      .pay-main::-webkit-scrollbar-thumb:hover {
        background: rgba(0, 0, 0, 0.2);
      }

      /* 모바일 최적화 */
      @media (max-width: 480px) {
        .pay-header {
          padding: 12px 16px;
        }

        .content-wrapper {
          padding: 16px;
          gap: 16px;
        }

        .section {
          padding: 16px;
        }

        .header-content h1 {
          font-size: 18px;
        }

        .final-price {
          font-size: 18px;
        }

        .pay-footer {
          padding: 12px 16px;
        }
      }
    </style>
  `;</old_str>
<new_str>function renderPay(currentOrder, store, tableNum) {
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
    <div class="pay-layout">
      <!-- 상단 헤더 -->
      <div class="pay-header">
        <button id="payBackBtn" class="back-btn">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
            <path d="M19 12H5m7-7l-7 7 7 7"/>
          </svg>
        </button>
        <div class="header-info">
          <h1>결제 확인</h1>
          <p>${orderData.store} • 테이블 ${orderData.table}</p>
        </div>
      </div>

      <!-- 스크롤 가능한 메인 컨텐츠 -->
      <div class="pay-body">
        <div class="content-container">
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
      </div>

      <!-- 하단 고정 결제 버튼 -->
      <div class="pay-footer">
        <div class="footer-buttons">
          <button id="confirmPay" class="confirm-btn">
            <span>결제하기</span>
            <span id="payBtnAmount" class="btn-price">${orderData.total.toLocaleString()}원</span>
          </button>
          <button id="cancelPay" class="cancel-btn">취소</button>
        </div>
      </div>
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

      .pay-layout {
        width: 100vw;
        height: 100vh;
        display: flex;
        flex-direction: column;
        background: #f1f5f9;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      }

      /* 헤더 */
      .pay-header {
        flex: none;
        height: 60px;
        background: white;
        display: flex;
        align-items: center;
        padding: 0 16px;
        gap: 12px;
        border-bottom: 1px solid #e2e8f0;
        box-shadow: 0 2px 8px rgba(0,0,0,0.06);
      }

      .back-btn {
        width: 36px;
        height: 36px;
        border: none;
        border-radius: 8px;
        background: #f8fafc;
        color: #64748b;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        transition: all 0.2s;
      }

      .back-btn:hover {
        background: #e2e8f0;
        color: #475569;
      }

      .header-info h1 {
        font-size: 18px;
        font-weight: 700;
        color: #1e293b;
        margin-bottom: 2px;
      }

      .header-info p {
        font-size: 13px;
        color: #64748b;
      }

      /* 메인 바디 */
      .pay-body {
        flex: 1;
        overflow-y: auto;
        overflow-x: hidden;
        -webkit-overflow-scrolling: touch;
        padding-bottom: 90px; /* 푸터 높이만큼 여백 */
      }

      .content-container {
        max-width: 480px;
        margin: 0 auto;
        padding: 16px;
        display: flex;
        flex-direction: column;
        gap: 16px;
      }

      /* 섹션 공통 스타일 */
      .order-section, .points-section, .coupon-section, .summary-section {
        background: white;
        border-radius: 12px;
        padding: 16px;
        box-shadow: 0 1px 3px rgba(0,0,0,0.1);
      }

      .section-title {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 12px;
      }

      .section-title h2 {
        font-size: 16px;
        font-weight: 700;
        color: #1e293b;
      }

      .item-count {
        background: #f1f5f9;
        color: #475569;
        padding: 3px 8px;
        border-radius: 8px;
        font-size: 11px;
        font-weight: 600;
      }

      /* 주문 내역 */
      .order-list {
        display: flex;
        flex-direction: column;
        gap: 8px;
        margin-bottom: 12px;
      }

      .order-item {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 6px 0;
        border-bottom: 1px solid #f1f5f9;
      }

      .order-item:last-child {
        border-bottom: none;
      }

      .item-info {
        display: flex;
        align-items: center;
        gap: 6px;
      }

      .item-name {
        font-weight: 600;
        color: #1e293b;
        font-size: 14px;
      }

      .item-qty {
        background: #e2e8f0;
        color: #475569;
        padding: 1px 5px;
        border-radius: 4px;
        font-size: 11px;
        font-weight: 600;
      }

      .item-price {
        font-weight: 700;
        color: #1e293b;
        font-size: 14px;
      }

      .subtotal-row {
        display: flex;
        justify-content: space-between;
        padding-top: 12px;
        border-top: 2px solid #f1f5f9;
        font-weight: 600;
        color: #475569;
      }

      .subtotal-amount {
        color: #1e293b;
        font-weight: 700;
      }

      /* 포인트 섹션 */
      .point-balance {
        background: linear-gradient(135deg, #3b82f6, #1d4ed8);
        color: white;
        padding: 4px 10px;
        border-radius: 8px;
        font-size: 11px;
        font-weight: 600;
      }

      .point-input-group {
        display: flex;
        gap: 8px;
      }

      .point-input {
        flex: 1;
        padding: 10px 12px;
        border: 2px solid #e2e8f0;
        border-radius: 8px;
        font-size: 14px;
        background: #f8fafc;
        transition: all 0.2s;
      }

      .point-input:focus {
        outline: none;
        border-color: #3b82f6;
        background: white;
        box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.1);
      }

      .point-input:disabled {
        opacity: 0.6;
        cursor: not-allowed;
      }

      .max-point-btn {
        padding: 10px 12px;
        border: 2px solid #3b82f6;
        border-radius: 8px;
        background: white;
        color: #3b82f6;
        font-weight: 600;
        font-size: 14px;
        cursor: pointer;
        transition: all 0.2s;
      }

      .max-point-btn:hover:not(:disabled) {
        background: #3b82f6;
        color: white;
      }

      .max-point-btn:disabled {
        opacity: 0.4;
        cursor: not-allowed;
      }

      /* 쿠폰 섹션 */
      .coupon-select select {
        width: 100%;
        padding: 10px 12px;
        border: 2px solid #e2e8f0;
        border-radius: 8px;
        font-size: 14px;
        background: #f8fafc;
        cursor: pointer;
        transition: all 0.2s;
      }

      .coupon-select select:focus {
        outline: none;
        border-color: #3b82f6;
        background: white;
        box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.1);
      }

      .coupon-select p {
        color: #64748b;
        text-align: center;
        padding: 12px;
        font-size: 13px;
      }

      /* 결제 요약 */
      .summary-section {
        background: linear-gradient(135deg, #f8fafc, #f1f5f9);
        border: 2px solid #e2e8f0;
      }

      .summary-details {
        display: flex;
        flex-direction: column;
        gap: 6px;
        margin-bottom: 12px;
      }

      .summary-item {
        display: flex;
        justify-content: space-between;
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
        padding: 12px 0 8px 0;
        border-top: 2px solid #e2e8f0;
        font-weight: 600;
        color: #1e293b;
      }

      .final-amount {
        font-size: 18px;
        font-weight: 800;
        background: linear-gradient(135deg, #3b82f6, #1d4ed8);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        background-clip: text;
      }

      .earn-point-info {
        display: flex;
        justify-content: space-between;
        padding: 8px 12px;
        background: rgba(59, 130, 246, 0.1);
        border-radius: 6px;
        font-size: 13px;
        margin-top: 8px;
      }

      .earn-amount {
        font-weight: 700;
        color: #1d4ed8;
      }

      /* 하단 푸터 */
      .pay-footer {
        position: fixed;
        bottom: 0;
        left: 0;
        right: 0;
        background: white;
        border-top: 1px solid #e2e8f0;
        box-shadow: 0 -4px 12px rgba(0,0,0,0.1);
        z-index: 1000;
      }

      .footer-buttons {
        max-width: 480px;
        margin: 0 auto;
        padding: 12px 16px;
        display: flex;
        flex-direction: column;
        gap: 8px;
      }

      .confirm-btn {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 14px 20px;
        border: none;
        border-radius: 10px;
        background: linear-gradient(135deg, #059669, #047857);
        color: white;
        font-size: 16px;
        font-weight: 700;
        cursor: pointer;
        transition: all 0.2s;
        box-shadow: 0 4px 12px rgba(5, 150, 105, 0.25);
      }

      .confirm-btn:hover {
        transform: translateY(-1px);
        box-shadow: 0 6px 16px rgba(5, 150, 105, 0.35);
      }

      .confirm-btn:active {
        transform: translateY(0);
      }

      .btn-price {
        font-size: 17px;
        font-weight: 800;
      }

      .cancel-btn {
        padding: 12px 20px;
        border: 2px solid #e2e8f0;
        border-radius: 10px;
        background: white;
        color: #475569;
        font-size: 15px;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.2s;
      }

      .cancel-btn:hover {
        background: #f8fafc;
        border-color: #cbd5e1;
      }

      /* 스크롤바 스타일 */
      .pay-body::-webkit-scrollbar {
        width: 3px;
      }

      .pay-body::-webkit-scrollbar-track {
        background: transparent;
      }

      .pay-body::-webkit-scrollbar-thumb {
        background: rgba(0, 0, 0, 0.1);
        border-radius: 1px;
      }

      .pay-body::-webkit-scrollbar-thumb:hover {
        background: rgba(0, 0, 0, 0.2);
      }

      /* 모바일 최적화 */
      @media (max-width: 480px) {
        .pay-header {
          padding: 0 12px;
        }

        .content-container {
          padding: 12px;
          gap: 12px;
        }

        .order-section, .points-section, .coupon-section, .summary-section {
          padding: 12px;
        }

        .header-info h1 {
          font-size: 16px;
        }

        .final-amount {
          font-size: 16px;
        }

        .footer-buttons {
          padding: 10px 12px;
        }

        .confirm-btn {
          padding: 12px 16px;
          font-size: 15px;
        }

        .cancel-btn {
          padding: 10px 16px;
          font-size: 14px;
        }
      }
    </style>
  `;</new_str>
