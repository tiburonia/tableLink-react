/**
 * Payment Failure View - 결제 실패 UI 렌더링
 * 순수하게 실패 화면 UI만 담당
 */

export const paymentFailureView = {
  /**
   * 결제 실패 화면 렌더링
   */
  renderFailureScreen(error, orderData) {
    console.log('❌ 결제 실패 UI 렌더링:', error.message);

    const main = document.getElementById('main') || document.body;

    main.innerHTML = `
      <div class="payment-failure-container">
        <div class="failure-content">
          ${this.renderFailureAnimation()}
          ${this.renderFailureHeader(error)}
          ${this.renderOrderSummary(orderData)}
          ${this.renderHelpSection()}
          ${this.renderActionButtons()}
        </div>
      </div>

      ${this.getFailureStyles()}
    `;
  },

  /**
   * 실패 애니메이션
   */
  renderFailureAnimation() {
    return `
      <div class="failure-animation">
        <div class="failure-icon">⚠️</div>
        <div class="failure-ripple"></div>
      </div>
    `;
  },

  /**
   * 실패 헤더
   */
  renderFailureHeader(error) {
    return `
      <div class="failure-header">
        <h1 class="failure-title" data-testid="text-failure-title">결제 실패</h1>
        <p class="failure-message" data-testid="text-failure-message">
          ${error.message || '결제 처리 중 오류가 발생했습니다.'}
        </p>
      </div>
    `;
  },

  /**
   * 주문 정보 요약
   */
  renderOrderSummary(orderData) {
    return `
      <div class="order-summary">
        <div class="summary-header">
          <h3>주문 정보</h3>
        </div>
        <div class="summary-content">
          <div class="order-detail">
            <span class="detail-icon">🏪</span>
            <span class="detail-text" data-testid="text-store-name">
              ${orderData?.store || orderData?.storeName || '알 수 없음'}
            </span>
          </div>
          <div class="order-detail">
            <span class="detail-icon">🪑</span>
            <span class="detail-text" data-testid="text-table">
              테이블 ${orderData?.table || orderData?.tableNum || '알 수 없음'}
            </span>
          </div>
          <div class="order-detail">
            <span class="detail-icon">💰</span>
            <span class="detail-text" data-testid="text-amount">
              ${orderData?.total?.toLocaleString() || '0'}원
            </span>
          </div>
        </div>
      </div>
    `;
  },

  /**
   * 도움말 섹션
   */
  renderHelpSection() {
    return `
      <div class="help-section">
        <div class="help-icon">💡</div>
        <div class="help-content">
          <p>잠시 후 다시 시도해주세요</p>
          <p>문제가 지속되면 매장에 문의해주세요</p>
        </div>
      </div>
    `;
  },

  /**
   * 액션 버튼들
   */
  renderActionButtons() {
    return `
      <div class="action-buttons">
        <button id="retryPayment" class="btn primary" data-testid="button-retry">
          <span class="btn-icon">🔄</span>
          <span class="btn-text">다시 시도</span>
        </button>
        <button id="backToOrder" class="btn secondary" data-testid="button-back-order">
          <span class="btn-icon">←</span>
          <span class="btn-text">주문 화면으로</span>
        </button>
        <button id="backToMain" class="btn tertiary" data-testid="button-back-main">
          <span class="btn-icon">🏠</span>
          <span class="btn-text">메인으로</span>
        </button>
      </div>
    `;
  },

  /**
   * CSS 스타일
   */
  getFailureStyles() {
    return `
      <style>
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }

        .payment-failure-container {
          position: fixed;
          top: 0;
          left: 50%;
          transform: translateX(-50%);
          width: 100%;
          max-width: 430px;
          height: 100vh;
          background: linear-gradient(135deg, #fef1f2 0%, #fee2e2 50%, #fecaca 100%);
          padding: 20px;
          display: flex;
          align-items: flex-start;
          justify-content: center;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
          overflow-y: auto;
          overflow-x: hidden;
          -webkit-overflow-scrolling: touch;
          box-sizing: border-box;
        }

        .failure-content {
          width: 100%;
          max-width: 380px;
          text-align: center;
          background: white;
          border-radius: 24px;
          padding: 40px 32px;
          margin: 20px 0 40px 0;
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.15);
          border: 1px solid rgba(248, 113, 113, 0.2);
          position: relative;
          overflow: hidden;
          flex-shrink: 0;
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
          color: #64748b;
          line-height: 1.6;
          margin: 0;
        }

        .order-summary {
          background: #f8fafc;
          border-radius: 16px;
          padding: 24px;
          margin-bottom: 24px;
          text-align: left;
        }

        .summary-header h3 {
          font-size: 16px;
          font-weight: 700;
          color: #1e293b;
          margin-bottom: 16px;
        }

        .order-detail {
          display: flex;
          align-items: center;
          padding: 12px 0;
          border-bottom: 1px solid #e2e8f0;
        }

        .order-detail:last-child {
          border-bottom: none;
        }

        .detail-icon {
          font-size: 24px;
          margin-right: 12px;
        }

        .detail-text {
          font-size: 15px;
          color: #475569;
          font-weight: 500;
        }

        .help-section {
          background: #fef3c7;
          border: 1px solid #fbbf24;
          border-radius: 12px;
          padding: 20px;
          margin-bottom: 32px;
          display: flex;
          align-items: flex-start;
          gap: 12px;
        }

        .help-icon {
          font-size: 24px;
          flex-shrink: 0;
        }

        .help-content {
          text-align: left;
        }

        .help-content p {
          font-size: 14px;
          color: #92400e;
          margin: 4px 0;
          line-height: 1.5;
        }

        .action-buttons {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .btn {
          width: 100%;
          padding: 16px 24px;
          border: none;
          border-radius: 12px;
          font-size: 16px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
        }

        .btn.primary {
          background: #dc2626;
          color: white;
        }

        .btn.primary:hover {
          background: #b91c1c;
          transform: translateY(-2px);
          box-shadow: 0 8px 16px rgba(220, 38, 38, 0.2);
        }

        .btn.secondary {
          background: #f1f5f9;
          color: #475569;
        }

        .btn.secondary:hover {
          background: #e2e8f0;
        }

        .btn.tertiary {
          background: white;
          color: #64748b;
          border: 1px solid #e2e8f0;
        }

        .btn.tertiary:hover {
          background: #f8fafc;
        }

        .btn-icon {
          font-size: 18px;
        }

        @media (max-width: 430px) {
          .payment-failure-container {
            padding: 16px;
          }

          .failure-content {
            padding: 32px 24px;
          }

          .failure-title {
            font-size: 24px;
          }
        }
      </style>
    `;
  }
};

console.log('✅ paymentFailureView 모듈 로드 완료');
