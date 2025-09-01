// 레거시 결제 모달 - 새 시스템으로 완전 이전됨
// 이 파일은 더 이상 사용되지 않습니다.
// 모든 결제 기능은 POSPaymentManager로 통합되었습니다.

console.warn('⚠️ 레거시 결제 모달이 로드되었습니다. 새 시스템(POSPaymentManager)을 사용하세요.');

// 레거시 호환성을 위한 최소한의 함수들
window.processPayment = function() {
  console.log('🔄 레거시 processPayment 호출 - 새 시스템으로 리다이렉트');
  if (window.POSPaymentManager) {
    window.POSPaymentManager.processPayment();
  } else {
    console.error('❌ POSPaymentManager를 찾을 수 없습니다');
  }
};

window.closePaymentModal = function() {
  console.log('🔄 레거시 closePaymentModal 호출 - 새 시스템으로 리다이렉트');
  if (window.POSPaymentManager) {
    window.POSPaymentManager.closePaymentModal();
  }
};