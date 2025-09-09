import { PaymentDataService } from './modules/paymentDataService.js';
import { PaymentUIManager } from './modules/paymentUIManager.js';
import { PaymentEventHandler } from './modules/paymentEventHandler.js';
import { getUserInfoSafely } from '../../../utils/authManager.js';

window.renderPay = async function(currentOrder, store, tableNum) {
  console.log('💳 결제 화면 렌더링 시작 - 매장:', store, '테이블:', tableNum);

  const userInfo = getUserInfoSafely();
  console.log('userInfo:', userInfo);

  try {
    // 1. 필수 모듈 로딩
    await loadRequiredModules();

    // 2. 주문 데이터 준비
    const orderData = PaymentDataService.prepareOrderData(currentOrder, store, tableNum);
    console.log('💳 주문 데이터 준비 완료:', orderData);

    // 3. UI 렌더링
    PaymentUIManager.renderPaymentScreen(orderData);

    // 4. 데이터 로딩 및 이벤트 설정
    await initializePaymentScreen(orderData, currentOrder, store, tableNum);

    console.log('✅ 결제 화면 렌더링 완료');

  } catch (error) {
    console.error('❌ 결제 화면 렌더링 실패:', error);
    alert('결제 화면을 불러올 수 없습니다: ' + error.message);
  }
};

/**
 * 필수 모듈 로딩
 */
async function loadRequiredModules() {
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
      await import('/TLG/pages/store/pay/confirmPayF.js');
      console.log('✅ confirmPay 함수 로드 완료');
    } catch (error) {
      console.error('❌ confirmPay 함수 로드 실패:', error);
    }
  }
}

/**
 * 결제 화면 초기화
 */
async function initializePaymentScreen(orderData, currentOrder, store, tableNum) {
  // 데이터 로딩
  await PaymentDataService.loadStorePoint(orderData.storeId);
  await PaymentDataService.loadCoupons();

  // 이벤트 리스너 설정
  PaymentEventHandler.setupEventListeners(orderData, currentOrder, store, tableNum);
}