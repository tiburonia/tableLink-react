
import { PaymentDataService } from './modules/paymentDataService.js';
import { PaymentUIManager } from './modules/paymentUIManager.js';
import { PaymentEventHandler } from './modules/paymentEventHandler.js';
import { getUserInfoSafely } from '../../../utils/authManager.js';

window.renderPay = async function(currentOrder, store, tableNum) {
  console.log('💳 결제 화면 렌더링 시작 - 매장:', store?.name || store, '테이블:', tableNum);

  const userInfo = getUserInfoSafely();
  if (!userInfo || !userInfo.id) {
    console.error('❌ 사용자 정보가 없습니다 - 로그인 필요');
    alert('로그인이 필요합니다.');
    if (typeof renderLogin === 'function') {
      renderLogin();
    }
    return;
  }

  console.log('✅ 사용자 정보 확인:', userInfo.name || userInfo.id);

  try {
    // 1. 필수 모듈 로딩 (순서 중요)
    await loadRequiredModules();

    // 2. 주문 데이터 검증 및 준비
    if (!currentOrder || Object.keys(currentOrder).length === 0) {
      throw new Error('주문 데이터가 없습니다.');
    }

    if (!store || !store.name) {
      throw new Error('매장 정보가 없습니다.');
    }

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
    
    // 오류 시 이전 화면으로 복귀
    if (typeof renderOrderScreen === 'function') {
      renderOrderScreen(store, tableNum);
    }
  }
};

/**
 * 필수 모듈 로딩 (순서 보장)
 */
async function loadRequiredModules() {
  const modules = [
    {
      name: 'tossPayments',
      path: '/TLG/pages/store/pay/tossPayments.js',
      check: () => window.requestTossPayment && window.initTossPayments
    },
    {
      name: 'confirmPay',
      path: '/TLG/pages/store/pay/confirmPayF.js',
      check: () => window.confirmPay
    }
  ];

  for (const module of modules) {
    if (!module.check()) {
      try {
        console.log(`🔄 ${module.name} 모듈 로드 중...`);
        await import(module.path);
        
        // 모듈 로드 후 잠시 대기 (전역 함수 등록 시간 확보)
        await new Promise(resolve => setTimeout(resolve, 100));
        
        if (module.check()) {
          console.log(`✅ ${module.name} 모듈 로드 완료`);
        } else {
          console.warn(`⚠️ ${module.name} 모듈 로드됨, 하지만 함수가 등록되지 않음`);
        }
      } catch (error) {
        console.error(`❌ ${module.name} 모듈 로드 실패:`, error);
        throw new Error(`${module.name} 모듈을 로드할 수 없습니다.`);
      }
    } else {
      console.log(`✅ ${module.name} 모듈 이미 로드됨`);
    }
  }
}

/**
 * 결제 화면 초기화 (데이터 로딩 및 이벤트 설정)
 */
async function initializePaymentScreen(orderData, currentOrder, store, tableNum) {
  try {
    console.log('🔄 결제 화면 초기화 시작');

    // 1. 병렬로 데이터 로딩
    const dataPromises = [
      PaymentDataService.loadStorePoint(orderData.storeId).catch(error => {
        console.warn('⚠️ 포인트 로딩 실패:', error);
      }),
      PaymentDataService.loadCoupons().catch(error => {
        console.warn('⚠️ 쿠폰 로딩 실패:', error);
      })
    ];

    await Promise.allSettled(dataPromises);
    console.log('✅ 데이터 로딩 완료');

    // 2. 이벤트 리스너 설정
    PaymentEventHandler.setupEventListeners(orderData, currentOrder, store, tableNum);
    console.log('✅ 이벤트 리스너 설정 완료');

    // 3. 초기 금액 계산
    PaymentDataService.calculateFinalAmount(orderData.total);
    console.log('✅ 초기 금액 계산 완료');

  } catch (error) {
    console.error('❌ 결제 화면 초기화 실패:', error);
    throw error;
  }
}

console.log('✅ renderPay 모듈 로드 완료');
