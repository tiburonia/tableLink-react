
/**
 * 토스페이먼츠 통합 결제 결과 처리기
 * - 성공/실패 통합 처리
 * - 안전한 오류 처리
 * - 사용자 친화적 UI
 */

(function() {
  'use strict';

  console.log('💳 토스페이먼츠 통합 결제 처리기 로드');

  // =================== 유틸리티 함수 ===================
  const TossPaymentHandler = {
    /**
     * URL 파라미터 파싱
     */
    getUrlParams() {
      const params = new URLSearchParams(window.location.search);
      return {
        paymentKey: params.get('paymentKey'),
        orderId: params.get('orderId'),
        amount: params.get('amount'),
        code: params.get('code'),
        message: params.get('message')
      };
    },

    /**
     * 결제 성공 상태 확인
     */
    isPaymentSuccess() {
      const { paymentKey, orderId, amount, code } = this.getUrlParams();
      
      // 오류 코드가 있으면 실패
      if (code) return false;
      
      // 필수 성공 파라미터가 모두 있으면 성공
      return paymentKey && orderId && amount;
    },

    /**
     * UI 렌더링
     */
    renderUI(type, data = {}) {
      const main = document.getElementById('main') || document.body;
      
      if (type === 'success') {
        main.innerHTML = this.renderSuccessUI(data);
      } else if (type === 'failure') {
        main.innerHTML = this.renderFailureUI(data);
      } else {
        main.innerHTML = this.renderLoadingUI();
      }
      
      main.appendChild(this.renderStyles());
    },

    /**
     * 로딩 UI
     */
    renderLoadingUI() {
      return `
        <div class="payment-result-container">
          <div class="status-icon loading">⏳</div>
          <h1>결제 처리 중...</h1>
          <p>잠시만 기다려주세요.</p>
          <div class="loading-spinner"></div>
        </div>
      `;
    },

    /**
     * 성공 UI
     */
    renderSuccessUI(data) {
      return `
        <div class="payment-result-container success">
          <div class="status-icon success">✅</div>
          <h1>결제 완료!</h1>
          <div class="order-info">
            <h3>주문 정보</h3>
            <p><strong>주문번호:</strong> ${data.orderId || '알 수 없음'}</p>
            <p><strong>결제금액:</strong> ${parseInt(data.amount || 0).toLocaleString()}원</p>
            <p><strong>결제방법:</strong> 토스페이먼츠</p>
            ${data.storeName ? `<p><strong>매장:</strong> ${data.storeName}</p>` : ''}
            ${data.tableNumber ? `<p><strong>테이블:</strong> ${data.tableNumber}</p>` : ''}
          </div>
          <div class="action-buttons">
            <button class="btn primary" onclick="TossPaymentHandler.goBack()">TableLink로 돌아가기</button>
          </div>
        </div>
      `;
    },

    /**
     * 실패 UI
     */
    renderFailureUI(data) {
      return `
        <div class="payment-result-container failure">
          <div class="status-icon failure">❌</div>
          <h1>결제 실패</h1>
          <div class="error-info">
            <h3>실패 원인</h3>
            <p>${data.message || '결제 처리 중 오류가 발생했습니다.'}</p>
            ${data.code ? `<p class="error-code">오류 코드: ${data.code}</p>` : ''}
          </div>
          <div class="action-buttons">
            <button class="btn primary" onclick="TossPaymentHandler.retryPayment()">다시 시도</button>
            <button class="btn secondary" onclick="TossPaymentHandler.goBack()">TableLink로 돌아가기</button>
          </div>
        </div>
      `;
    },

    /**
     * CSS 스타일
     */
    renderStyles() {
      const style = document.createElement('style');
      style.textContent = `
        .payment-result-container {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          width: 100%;
          max-width: 430px;
          margin: 0 auto;
          height: 100vh;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
          padding: 20px;
          text-align: center;
        }

        .payment-result-container.success {
          background: linear-gradient(135deg, #10b981 0%, #059669 100%);
          color: white;
        }

        .payment-result-container.failure {
          background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
          color: white;
        }

        .payment-result-container:not(.success):not(.failure) {
          background: linear-gradient(135deg, #6366f1 0%, #4f46e5 100%);
          color: white;
        }

        .status-icon {
          font-size: 80px;
          margin-bottom: 20px;
        }

        .status-icon.success {
          animation: bounce 1s ease-in-out;
        }

        .status-icon.failure {
          animation: shake 0.5s ease-in-out;
        }

        .status-icon.loading {
          animation: pulse 1.5s ease-in-out infinite;
        }

        @keyframes bounce {
          0%, 20%, 50%, 80%, 100% { transform: translateY(0); }
          40% { transform: translateY(-20px); }
          60% { transform: translateY(-10px); }
        }

        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          10%, 30%, 50%, 70%, 90% { transform: translateX(-5px); }
          20%, 40%, 60%, 80% { transform: translateX(5px); }
        }

        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }

        .payment-result-container h1 {
          font-size: 28px;
          font-weight: 700;
          margin-bottom: 20px;
          color: inherit;
        }

        .order-info, .error-info {
          background: rgba(255, 255, 255, 0.1);
          border-radius: 16px;
          padding: 24px;
          margin: 20px 0;
          backdrop-filter: blur(10px);
          border: 1px solid rgba(255, 255, 255, 0.2);
        }

        .order-info h3, .error-info h3 {
          font-size: 18px;
          font-weight: 600;
          margin-bottom: 16px;
          color: inherit;
        }

        .order-info p, .error-info p {
          margin: 8px 0;
          color: rgba(255, 255, 255, 0.9);
          font-size: 16px;
        }

        .error-code {
          font-family: monospace;
          font-size: 14px;
          background: rgba(0, 0, 0, 0.2);
          padding: 8px 12px;
          border-radius: 8px;
          margin-top: 12px;
        }

        .action-buttons {
          display: flex;
          gap: 16px;
          margin-top: 24px;
        }

        .btn {
          background: rgba(255, 255, 255, 0.9);
          color: #1f2937;
          border: none;
          padding: 16px 24px;
          border-radius: 12px;
          font-size: 16px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s ease;
          min-width: 120px;
        }

        .btn:hover {
          background: white;
          transform: translateY(-2px);
          box-shadow: 0 8px 25px rgba(0, 0, 0, 0.2);
        }

        .btn.primary {
          background: white;
          color: #059669;
        }

        .btn.secondary {
          background: rgba(255, 255, 255, 0.7);
          color: #374151;
        }

        .loading-spinner {
          width: 40px;
          height: 40px;
          border: 4px solid rgba(255, 255, 255, 0.3);
          border-top: 4px solid white;
          border-radius: 50%;
          animation: spin 1s linear infinite;
          margin: 20px auto;
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        @media (max-width: 480px) {
          .payment-result-container {
            padding: 16px;
          }
          
          .status-icon {
            font-size: 60px;
          }
          
          .payment-result-container h1 {
            font-size: 24px;
          }
          
          .action-buttons {
            flex-direction: column;
            width: 100%;
          }
          
          .btn {
            width: 100%;
          }
        }
      `;
      return style;
    },

    /**
     * 결제 성공 처리
     */
    async handlePaymentSuccess() {
      const { paymentKey, orderId, amount } = this.getUrlParams();

      try {
        console.log('🔄 결제 성공 처리 시작:', { paymentKey, orderId, amount });

        // 토스페이먼츠 결제 승인
        const response = await fetch('/api/toss/confirm', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            paymentKey,
            orderId,
            amount: parseInt(amount)
          })
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ error: '서버 오류' }));
          throw new Error(errorData.error || `서버 오류 (${response.status})`);
        }

        const result = await response.json();
        console.log('✅ 결제 승인 완료:', result);

        // 성공 UI 표시
        this.renderUI('success', {
          orderId,
          amount,
          storeName: result.storeName,
          tableNumber: result.tableNumber
        });

      } catch (error) {
        console.error('❌ 결제 성공 처리 실패:', error);
        this.renderUI('failure', {
          message: `결제 처리 실패: ${error.message}`,
          code: 'CONFIRMATION_ERROR'
        });
      }
    },

    /**
     * 결제 실패 처리
     */
    handlePaymentFailure() {
      const { code, message } = this.getUrlParams();
      
      console.log('❌ 결제 실패 처리:', { code, message });

      this.renderUI('failure', {
        message: message || '결제 처리 중 오류가 발생했습니다.',
        code: code || 'UNKNOWN_ERROR'
      });
    },

    /**
     * TableLink로 돌아가기
     */
    goBack() {
      try {
        // 팝업 창인 경우
        if (window.opener && !window.opener.closed) {
          window.opener.location.href = '/';
          window.close();
        } else {
          window.location.href = '/';
        }
      } catch (e) {
        window.location.href = '/';
      }
    },

    /**
     * 결제 재시도
     */
    retryPayment() {
      this.goBack();
    },

    /**
     * 메인 처리 함수
     */
    async process() {
      console.log('💳 토스페이먼츠 결제 결과 처리 시작');

      // 초기 로딩 UI 표시
      this.renderUI('loading');

      // 결제 성공/실패 여부 확인
      if (this.isPaymentSuccess()) {
        await this.handlePaymentSuccess();
      } else {
        this.handlePaymentFailure();
      }
    }
  };

  // 전역 객체로 등록
  window.TossPaymentHandler = TossPaymentHandler;

  console.log('✅ 토스페이먼츠 통합 결제 처리기 등록 완료');

})();
