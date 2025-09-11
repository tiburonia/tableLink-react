
/**
 * 결제 결과 자동 감지 및 처리 모듈
 * - URL 파라미터 기반 결제 결과 감지
 * - 자동으로 결제 처리기 호출
 */

(function() {
  'use strict';

  console.log('🔍 결제 결과 감지기 로드');

  const PaymentResultDetector = {
    /**
     * 결제 관련 URL 파라미터 확인
     */
    hasPaymentParams() {
      const params = new URLSearchParams(window.location.search);
      const hasSuccess = params.has('paymentKey') || params.has('orderId');
      const hasFailure = params.has('code') || params.has('message');
      
      return hasSuccess || hasFailure;
    },

    /**
     * 결제 결과 처리
     */
    async handlePaymentResult() {
      if (!this.hasPaymentParams()) {
        return false; // 결제 관련 파라미터 없음
      }

      console.log('💳 결제 결과 URL 파라미터 감지');

      // TossPaymentHandler가 로드될 때까지 대기
      let attempts = 0;
      while (!window.TossPaymentHandler && attempts < 10) {
        await new Promise(resolve => setTimeout(resolve, 100));
        attempts++;
      }

      if (window.TossPaymentHandler) {
        console.log('✅ 토스페이먼츠 처리기 발견, 결제 결과 처리 시작');
        await window.TossPaymentHandler.process();
        return true;
      } else {
        console.error('❌ 토스페이먼츠 처리기를 찾을 수 없습니다');
        return false;
      }
    }
  };

  // DOM 로드 완료 후 실행
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      PaymentResultDetector.handlePaymentResult();
    });
  } else {
    PaymentResultDetector.handlePaymentResult();
  }

  console.log('✅ 결제 결과 감지기 등록 완료');

})();
