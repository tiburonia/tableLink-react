
/**
 * 결제 실패 UI 렌더링 전용 모듈
 */

function renderPaymentFailure(error, orderData, currentOrder, store) {
  console.log('❌ 결제 실패 UI 렌더링:', error.message);

  const main = document.getElementById('main') || document.body;

  main.innerHTML = `
    <div class="payment-failure-container">
      <div class="failure-content">
        <div class="failure-animation">
          <div class="failure-icon">⚠️</div>
          <div class="failure-ripple"></div>
        </div>

        <div class="failure-header">
          <h1 class="failure-title">결제 실패</h1>
          <p class="failure-message">${error.message || '결제 처리 중 오류가 발생했습니다.'}</p>
        </div>

        <div class="order-summary">
          <div class="summary-header">
            <h3>주문 정보</h3>
          </div>
          <div class="summary-content">
            <div class="order-detail">
              <span class="detail-icon">🏪</span>
              <span class="detail-text">${orderData?.store || '알 수 없음'}</span>
            </div>
            <div class="order-detail">
              <span class="detail-icon">🪑</span>
              <span class="detail-text">테이블 ${orderData?.table || '알 수 없음'}</span>
            </div>
            <div class="order-detail">
              <span class="detail-icon">💰</span>
              <span class="detail-text">${orderData?.total?.toLocaleString() || '0'}원</span>
            </div>
          </div>
        </div>

        <div class="help-section">
          <div class="help-icon">💡</div>
          <div class="help-content">
            <p>잠시 후 다시 시도해주세요</p>
            <p>문제가 지속되면 매장에 문의해주세요</p>
          </div>
        </div>

        <div class="action-buttons">
          <button id="retryPayment" class="btn primary">
            <span class="btn-icon">🔄</span>
            <span class="btn-text">다시 시도</span>
          </button>
          <button id="backToOrder" class="btn secondary">
            <span class="btn-icon">←</span>
            <span class="btn-text">주문 화면으로</span>
          </button>
          <button id="backToMain" class="btn tertiary">
            <span class="btn-icon">🏠</span>
            <span class="btn-text">메인으로</span>
          </button>
        </div>
      </div>
    </div>

    ${getFailureStyles()}
  `;

  // 이벤트 리스너 설정
  setupFailureEventListeners(currentOrder, store, orderData);
}

function getFailureStyles() {
  return `
    <style>
      * {
        margin: 0;
        padding: 0;
        box-sizing: border-box;
      }

      .payment-failure-container {
        width: 100%;
        max-width: 430px;
        margin: 0 auto;
        min-height: 100vh;
        background: linear-gradient(135deg, #fef1f2 0%, #fee2e2 50%, #fecaca 100%);
        padding: 20px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
        overflow-y: auto;
        -webkit-overflow-scrolling: touch;
      }

      .failure-content {
        width: 100%;
        max-width: 380px;
        text-align: center;
        background: white;
        border-radius: 24px;
        padding: 40px 32px;
        box-shadow: 0 20px 60px rgba(0, 0, 0, 0.15);
        border: 1px solid rgba(248, 113, 113, 0.2);
        position: relative;
        overflow: hidden;
      }

      .failure-animation {
        position: relative;
        display: inline-block;
        margin-bottom: 32px;
      }

      .failure-icon {
        font-size: 80px;
        position: relative;
        z-index: 2;
        animation: shake 0.6s ease-in-out;
      }

      .failure-ripple {
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        width: 140px;
        height: 140px;
        border: 3px solid #f87171;
        border-radius: 50%;
        opacity: 0.4;
        animation: ripple 2s infinite;
      }

      @keyframes shake {
        0%, 100% { transform: translateX(0); }
        25% { transform: translateX(-6px); }
        75% { transform: translateX(6px); }
      }

      @keyframes ripple {
        0% {
          transform: translate(-50%, -50%) scale(0.7);
          opacity: 0.8;
        }
        100% {
          transform: translate(-50%, -50%) scale(1.3);
          opacity: 0;
        }
      }

      .failure-header {
        margin-bottom: 32px;
      }

      .failure-title {
        font-size: 28px;
        font-weight: 800;
        color: #dc2626;
        margin: 0 0 16px 0;
        letter-spacing: -0.5px;
      }

      .failure-message {
        font-size: 16px;
        color: #6b7280;
        margin: 0;
        line-height: 1.6;
        font-weight: 500;
      }

      .order-summary {
        background: #f9fafb;
        border-radius: 16px;
        padding: 24px;
        margin-bottom: 24px;
        text-align: left;
      }

      .summary-header {
        margin-bottom: 16px;
        text-align: center;
      }

      .summary-header h3 {
        margin: 0;
        font-size: 18px;
        font-weight: 700;
        color: #374151;
      }

      .summary-content {
        display: flex;
        flex-direction: column;
        gap: 12px;
      }

      .order-detail {
        display: flex;
        align-items: center;
        gap: 12px;
        font-size: 15px;
        font-weight: 600;
        color: #374151;
        padding: 8px;
        background: white;
        border-radius: 8px;
      }

      .detail-icon {
        font-size: 18px;
        width: 28px;
        text-align: center;
      }

      .help-section {
        background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%);
        border-radius: 16px;
        padding: 20px;
        margin-bottom: 32px;
        border: 1px solid #bfdbfe;
        display: flex;
        align-items: center;
        gap: 16px;
      }

      .help-icon {
        font-size: 32px;
        flex-shrink: 0;
      }

      .help-content p {
        margin: 0 0 8px 0;
        font-size: 14px;
        color: #1e40af;
        font-weight: 600;
        line-height: 1.4;
      }

      .help-content p:last-child {
        margin-bottom: 0;
      }

      .action-buttons {
        display: flex;
        flex-direction: column;
        gap: 12px;
      }

      .btn {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 10px;
        padding: 18px 24px;
        border: none;
        border-radius: 16px;
        font-size: 16px;
        font-weight: 700;
        cursor: pointer;
        transition: all 0.3s ease;
        width: 100%;
        text-decoration: none;
        outline: none;
      }

      .btn-icon {
        font-size: 18px;
      }

      .btn.primary {
        background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%);
        color: white;
        box-shadow: 0 6px 20px rgba(220, 38, 38, 0.3);
      }

      .btn.primary:hover {
        transform: translateY(-3px);
        box-shadow: 0 8px 25px rgba(220, 38, 38, 0.4);
      }

      .btn.secondary {
        background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
        color: #475569;
        border: 2px solid #e2e8f0;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
      }

      .btn.secondary:hover {
        background: linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%);
        border-color: #cbd5e1;
        transform: translateY(-2px);
        box-shadow: 0 6px 16px rgba(0, 0, 0, 0.12);
      }

      .btn.tertiary {
        background: transparent;
        color: #6b7280;
        border: 2px solid #d1d5db;
      }

      .btn.tertiary:hover {
        background: #f9fafb;
        color: #374151;
        border-color: #9ca3af;
        transform: translateY(-1px);
      }

      .btn:active {
        transform: translateY(0);
      }

      @media (max-width: 480px) {
        .payment-failure-container {
          padding: 16px;
        }

        .failure-content {
          padding: 32px 24px;
        }

        .failure-title {
          font-size: 24px;
        }

        .failure-icon {
          font-size: 64px;
        }

        .failure-ripple {
          width: 120px;
          height: 120px;
        }
      }

      @media (max-height: 700px) {
        .payment-failure-container {
          align-items: flex-start;
          padding-top: 40px;
        }

        .failure-content {
          padding: 24px 20px;
        }

        .failure-icon {
          font-size: 60px;
        }

        .failure-animation {
          margin-bottom: 24px;
        }

        .failure-header {
          margin-bottom: 24px;
        }

        .order-summary {
          margin-bottom: 20px;
          padding: 20px;
        }

        .help-section {
          margin-bottom: 24px;
          padding: 16px;
        }
      }
    </style>
  `;
}

function setupFailureEventListeners(currentOrder, store, orderData) {
  // 다시 시도
  document.getElementById('retryPayment')?.addEventListener('click', () => {
    console.log('🔄 결제 재시도');
    if (typeof renderPay === 'function') {
      renderPay(currentOrder, store, orderData.tableNum);
    } else {
      console.error('❌ renderPay 함수를 찾을 수 없습니다');
    }
  });

  // 주문 화면으로
  document.getElementById('backToOrder')?.addEventListener('click', () => {
    console.log('← 주문 화면으로 돌아가기');
    if (typeof renderOrderScreen === 'function') {
      renderOrderScreen(store, orderData.tableNum);
    } else {
      console.error('❌ renderOrderScreen 함수를 찾을 수 없습니다');
    }
  });

  // 메인으로
  document.getElementById('backToMain')?.addEventListener('click', () => {
    console.log('🏠 메인 화면으로 돌아가기');
    if (typeof renderMap === 'function') {
      renderMap();
    } else {
      console.error('❌ renderMap 함수를 찾을 수 없습니다');
    }
  });
}

// 전역 함수로 등록
window.renderPaymentFailure = renderPaymentFailure;

console.log('✅ 결제 실패 UI 모듈 로드 완료');
