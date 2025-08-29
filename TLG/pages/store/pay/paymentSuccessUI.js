
/**
 * SPA용 결제 성공 UI 렌더링 모듈
 */

function renderPaymentSuccess(orderData, paymentResult, userInfo) {
  console.log('✅ 결제 성공 UI 렌더링 시작');

  const main = document.getElementById('main');
  if (!main) {
    console.error('❌ main 엘리먼트를 찾을 수 없습니다');
    return;
  }

  main.innerHTML = `
    <div class="payment-success-container">
      <div class="success-content">
        <div class="success-icon">✅</div>
        <h1 class="success-title">결제 완료!</h1>
        <p class="success-message">주문이 성공적으로 접수되었습니다.</p>

        <div class="order-summary-card">
          <div class="summary-header">
            <h3>주문 내역</h3>
            <span class="order-number">주문번호: ${paymentResult.orderId || 'N/A'}</span>
          </div>
          <div class="summary-details">
            <div class="store-info">
              <strong>${orderData.store}</strong>
              <span>${orderData.table}</span>
            </div>
            <div class="items-list">
              ${orderData.items.map(item =>
                `<div class="item-row">
                  <span class="item-name">${item.name} × ${item.qty}</span>
                  <span class="item-price">${item.totalPrice.toLocaleString()}원</span>
                </div>`
              ).join('')}
            </div>
            <div class="payment-details">
              <div class="detail-row final">
                <span>최종 결제 금액</span>
                <span>${orderData.total.toLocaleString()}원</span>
              </div>
            </div>
          </div>
        </div>

        <div class="points-earned-card">
          <div class="points-icon">🎉</div>
          <div class="points-info">
            <h4>포인트 적립</h4>
            <p>${Math.floor(orderData.total * 0.1).toLocaleString()}P가 적립되었습니다!</p>
          </div>
        </div>

        <div class="action-buttons">
          <button id="goToMain" class="btn primary">
            🏠 메인으로 이동
          </button>
          <button id="goToMyPage" class="btn secondary">
            👤 마이페이지
          </button>
        </div>

        <div class="auto-redirect-notice">
          <span class="redirect-timer" id="redirectTimer">3</span>초 후 자동으로 메인으로 이동합니다
        </div>
      </div>
    </div>

    <style>
      .payment-success-container {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        width: 100%;
        max-width: 430px;
        margin: 0 auto;
        background: linear-gradient(135deg, #f0f9ff 0%, #e0e7ff 100%);
        overflow-y: auto;
        -webkit-overflow-scrolling: touch;
        padding: 20px;
        box-sizing: border-box;
      }

      .success-content {
        max-width: 500px;
        width: 100%;
        text-align: center;
        padding: 20px;
        margin: 0 auto;
        display: flex;
        flex-direction: column;
        justify-content: flex-start;
        padding-top: 0px;
      }

      .success-icon {
        font-size: 80px;
        margin-bottom: 20px;
        animation: bounce 1s ease-in-out;
      }

      @keyframes bounce {
        0%, 20%, 53%, 80%, 100% {
          animation-timing-function: cubic-bezier(0.215, 0.610, 0.355, 1.000);
          transform: translate3d(0,0,0);
        }
        40%, 43% {
          animation-timing-function: cubic-bezier(0.755, 0.050, 0.855, 0.060);
          transform: translate3d(0, -10px, 0);
        }
        70% {
          animation-timing-function: cubic-bezier(0.755, 0.050, 0.855, 0.060);
          transform: translate3d(0, -5px, 0);
        }
        90% {
          transform: translate3d(0,-1px,0);
        }
      }

      .success-title {
        font-size: 32px;
        font-weight: 700;
        color: #1e293b;
        margin: 0 0 12px 0;
      }

      .success-message {
        font-size: 16px;
        color: #64748b;
        margin: 0 0 30px 0;
        line-height: 1.6;
      }

      .order-summary-card {
        background: white;
        border-radius: 16px;
        padding: 24px;
        margin-bottom: 20px;
        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
        border: 1px solid rgba(226, 232, 240, 0.8);
        text-align: left;
      }

      .summary-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 20px;
        padding-bottom: 12px;
        border-bottom: 2px solid #f1f5f9;
      }

      .summary-header h3 {
        margin: 0;
        font-size: 18px;
        font-weight: 700;
        color: #1e293b;
      }

      .order-number {
        background: #f1f5f9;
        color: #475569;
        padding: 4px 12px;
        border-radius: 12px;
        font-size: 12px;
        font-weight: 600;
      }

      .store-info {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 16px;
        padding: 12px;
        background: #f8fafc;
        border-radius: 8px;
      }

      .store-info strong {
        color: #1e293b;
        font-size: 16px;
      }

      .store-info span {
        color: #64748b;
        font-size: 14px;
        font-weight: 500;
      }

      .items-list {
        margin-bottom: 16px;
      }

      .item-row {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 8px 0;
        border-bottom: 1px solid #f1f5f9;
      }

      .item-row:last-child {
        border-bottom: none;
      }

      .item-name {
        color: #1e293b;
        font-weight: 500;
      }

      .item-price {
        color: #3b82f6;
        font-weight: 600;
      }

      .payment-details {
        border-top: 2px solid #f1f5f9;
        padding-top: 16px;
      }

      .detail-row {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 4px 0;
        color: #475569;
      }

      .detail-row.final {
        font-size: 18px;
        font-weight: 700;
        color: #1e293b;
        border-top: 1px solid #e2e8f0;
        padding-top: 12px;
        margin-top: 8px;
      }

      .points-earned-card {
        background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
        border-radius: 16px;
        padding: 20px;
        margin-bottom: 30px;
        color: white;
        display: flex;
        align-items: center;
        gap: 16px;
        box-shadow: 0 4px 20px rgba(59, 130, 246, 0.3);
      }

      .points-icon {
        font-size: 32px;
      }

      .points-info h4 {
        margin: 0 0 4px 0;
        font-size: 16px;
        font-weight: 700;
      }

      .points-info p {
        margin: 0;
        font-size: 14px;
        opacity: 0.9;
      }

      .action-buttons {
        display: flex;
        flex-direction: column;
        gap: 12px;
      }

      .btn {
        padding: 16px 24px;
        border: none;
        border-radius: 12px;
        font-size: 16px;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.2s ease;
        width: 100%;
      }

      .btn.primary {
        background: linear-gradient(135deg, #059669 0%, #047857 100%);
        color: white;
        box-shadow: 0 4px 16px rgba(5, 150, 105, 0.25);
      }

      .btn.primary:hover {
        transform: translateY(-2px);
        box-shadow: 0 6px 20px rgba(5, 150, 105, 0.35);
      }

      .btn.secondary {
        background: white;
        color: #475569;
        border: 2px solid #e2e8f0;
      }

      .btn.secondary:hover {
        background: #f8fafc;
        border-color: #cbd5e1;
      }

      .btn:active {
        transform: translateY(0);
      }

      .auto-redirect-notice {
        text-align: center;
        margin-top: 20px;
        font-size: 14px;
        color: #64748b;
        opacity: 0.8;
      }

      .redirect-timer {
        font-weight: bold;
        color: #3b82f6;
      }

      @media (max-width: 480px) {
        .payment-success-container {
          padding: 12px;
        }

        .success-content {
          padding: 16px;
        }

        .order-summary-card {
          padding: 20px;
        }

        .success-title {
          font-size: 28px;
        }

        .success-icon {
          font-size: 60px;
        }
      }
    </style>
  `;

  // 버튼 이벤트 리스너
  const goToMainBtn = document.getElementById('goToMain');
  const goToMyPageBtn = document.getElementById('goToMyPage');
  
  if (goToMainBtn) {
    goToMainBtn.addEventListener('click', () => {
      if (typeof renderMap === 'function') {
        renderMap();
      } else {
        window.location.href = '/';
      }
    });
  }

  if (goToMyPageBtn) {
    goToMyPageBtn.addEventListener('click', () => {
      if (typeof renderMyPage === 'function') {
        renderMyPage();
      } else {
        window.location.href = '/mypage';
      }
    });
  }

  // 자동 리다이렉트 타이머
  let countdown = 3;
  const timerElement = document.getElementById('redirectTimer');
  if (timerElement) {
    timerElement.textContent = countdown;

    const redirectInterval = setInterval(() => {
      countdown--;
      if (timerElement) {
        timerElement.textContent = countdown;
      }
      if (countdown <= 0) {
        clearInterval(redirectInterval);
        if (typeof renderMap === 'function') {
          renderMap();
        } else {
          window.location.href = '/';
        }
      }
    }, 1000);
  }

  console.log('✅ 결제 성공 UI 렌더링 완료');
}

function renderPaymentFailure(error, orderData) {
  console.log('❌ 결제 실패 UI 렌더링 시작');

  const main = document.getElementById('main');
  if (!main) {
    console.error('❌ main 엘리먼트를 찾을 수 없습니다');
    return;
  }

  main.innerHTML = `
    <div class="payment-failure-container">
      <div class="failure-content">
        <div class="failure-icon">❌</div>
        <h1 class="failure-title">결제 실패</h1>
        <p class="failure-message">${error.message || '결제 처리 중 오류가 발생했습니다.'}</p>

        <div class="error-details">
          <p>주문을 다시 시도해주세요.</p>
        </div>

        <div class="action-buttons">
          <button id="retryPayment" class="btn primary">
            🔄 다시 시도
          </button>
          <button id="goToMain" class="btn secondary">
            🏠 메인으로 이동
          </button>
        </div>
      </div>
    </div>

    <style>
      .payment-failure-container {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        width: 100%;
        max-width: 430px;
        margin: 0 auto;
        background: linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%);
        overflow-y: auto;
        -webkit-overflow-scrolling: touch;
        padding: 20px;
        box-sizing: border-box;
      }

      .failure-content {
        max-width: 500px;
        width: 100%;
        text-align: center;
        padding: 20px;
        margin: 0 auto;
        display: flex;
        flex-direction: column;
        justify-content: center;
        min-height: 70vh;
      }

      .failure-icon {
        font-size: 80px;
        margin-bottom: 20px;
      }

      .failure-title {
        font-size: 32px;
        font-weight: 700;
        color: #dc2626;
        margin: 0 0 12px 0;
      }

      .failure-message {
        font-size: 16px;
        color: #7f1d1d;
        margin: 0 0 30px 0;
        line-height: 1.6;
      }

      .error-details {
        background: white;
        border-radius: 16px;
        padding: 24px;
        margin-bottom: 30px;
        box-shadow: 0 4px 20px rgba(220, 38, 38, 0.1);
        border: 1px solid rgba(220, 38, 38, 0.2);
      }

      .error-details p {
        margin: 0;
        color: #374151;
        font-size: 14px;
      }

      .action-buttons {
        display: flex;
        flex-direction: column;
        gap: 12px;
      }

      .btn {
        padding: 16px 24px;
        border: none;
        border-radius: 12px;
        font-size: 16px;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.2s ease;
        width: 100%;
      }

      .btn.primary {
        background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%);
        color: white;
        box-shadow: 0 4px 16px rgba(220, 38, 38, 0.25);
      }

      .btn.primary:hover {
        transform: translateY(-2px);
        box-shadow: 0 6px 20px rgba(220, 38, 38, 0.35);
      }

      .btn.secondary {
        background: white;
        color: #475569;
        border: 2px solid #e2e8f0;
      }

      .btn.secondary:hover {
        background: #f8fafc;
        border-color: #cbd5e1;
      }
    </style>
  `;

  // 버튼 이벤트 리스너
  const retryBtn = document.getElementById('retryPayment');
  const goToMainBtn = document.getElementById('goToMain');
  
  if (retryBtn) {
    retryBtn.addEventListener('click', () => {
      // 결제 화면으로 돌아가기
      if (typeof renderPay === 'function' && orderData) {
        renderPay(orderData.items, orderData);
      } else if (typeof renderMap === 'function') {
        renderMap();
      }
    });
  }

  if (goToMainBtn) {
    goToMainBtn.addEventListener('click', () => {
      if (typeof renderMap === 'function') {
        renderMap();
      } else {
        window.location.href = '/';
      }
    });
  }

  console.log('✅ 결제 실패 UI 렌더링 완료');
}

// 전역 함수로 등록
window.renderPaymentSuccess = renderPaymentSuccess;
window.renderPaymentFailure = renderPaymentFailure;

console.log('✅ SPA 결제 UI 모듈 로드 완료');
