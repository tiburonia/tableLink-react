/**
 * TLL (TableLink Live) 주문 시스템 - 레이어드 아키텍처
 * 얇은 오케스트레이터: Controller에 위임
 */

import { tllController } from './controllers/tllController.js';

/**
 * TLL 메인 함수
 */
window.TLL = async function TLL(preselectedStore = null) {
  try {
    console.log('🚀 TLL 시작');

    // 미리 선택된 매장 확인
    const store = preselectedStore || 
                  window.preselectedStoreForTLL || 
                  window.selectedStore || 
                  window.currentStoreForTLL || 
                  window.currentStore;

    if (store) {
      console.log(`🏪 전역 매장 정보 사용: ${store.name} (ID: ${store.id})`);
    }

    // TLL Controller 초기화
    await tllController.initialize(store);

  } catch (error) {
    console.error('❌ TLL 초기화 실패:', error);
    alert('TLL 주문 시스템을 시작할 수 없습니다.');
  }
};

/**
 * 토스페이먼츠 결제 성공 처리
 */
window.handleTossPaymentSuccess = async function(data) {
  console.log('✅ 토스페이먼츠 결제 성공 처리:', data);

  try {
    const { paymentKey, orderId, amount } = data;

    if (!paymentKey || !orderId || !amount) {
      throw new Error('결제 정보가 올바르지 않습니다');
    }

    console.log('🔄 결제 승인 처리 시작:', { paymentKey, orderId, amount });

    // TLL 주문인지 확인
    const isTLLOrder = orderId.startsWith('TLL_');

    if (isTLLOrder) {
      // TLL 결제 확인 API 호출
      const tllOrderData = JSON.parse(sessionStorage.getItem('tllPendingOrder') || '{}');
      const checkId = tllOrderData.checkId || orderId.split('_')[1];

      const confirmResponse = await fetch('/api/tll/payments/confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          check_id: parseInt(checkId),
          payment_key: paymentKey,
          order_id: orderId,
          amount: parseInt(amount)
        })
      });

      if (!confirmResponse.ok) {
        const errorData = await confirmResponse.json();
        throw new Error(errorData.error || 'TLL 결제 확인 실패');
      }

      const confirmResult = await confirmResponse.json();
      console.log('✅ TLL 결제 확인 완료:', confirmResult);

      sessionStorage.removeItem('tllPendingOrder');
      console.log('✅ TLL 주문 완료 처리');

    } else {
      // 일반 주문
      const confirmResult = await window.confirmTossPayment(paymentKey, orderId, amount);

      if (!confirmResult.success) {
        throw new Error(confirmResult.error || '결제 승인 실패');
      }

      console.log('✅ 일반 결제 승인 완료:', confirmResult);
      sessionStorage.removeItem('pendingOrderData');
      console.log('✅ 일반 주문 완료 처리');
    }

    // 성공 알림
    alert(`✅ 결제가 완료되었습니다!\n주문번호: ${orderId}\n결제금액: ₩${parseInt(amount).toLocaleString()}`);

    // 지도 화면으로 이동
    if (typeof window.renderMap === 'function') {
      window.renderMap();
    } else {
      window.location.reload();
    }

  } catch (error) {
    console.error('❌ 결제 처리 실패:', error);
    alert('결제 처리 중 오류가 발생했습니다: ' + error.message);
    if (typeof window.renderMap === 'function') {
      window.renderMap();
    }
  }
};

/**
 * 토스페이먼츠 결제 실패 처리
 */
window.handleTossPaymentFailure = function(data) {
  console.log('❌ 토스페이먼츠 결제 실패 처리:', data);

  const { message } = data;

  if (typeof window.renderPaymentFailure === 'function') {
    window.renderPaymentFailure({ message }, {});
  } else {
    alert('결제가 실패했습니다: ' + message);
    if (typeof window.renderMap === 'function') {
      window.renderMap();
    }
  }
};

/**
 * TLL 테이블 선택 처리 (하위 호환성)
 */
window.selectTLLTable = function(tableName, tableNumber) {
  console.log(`🏪 선택된 테이블: ${tableName} (번호: ${tableNumber})`);

  if (!window.selectedStore) {
    console.error('❌ 선택된 매장 정보가 없습니다');
    alert('매장을 먼저 선택해주세요.');
    return;
  }

  const validTableNumber = tableNumber || parseInt(tableName?.replace(/[^0-9]/g, '')) || 1;
  const validTableName = tableName || `${validTableNumber}번`;

  console.log(`🔍 TLL 테이블 정보 검증: ${validTableName} (번호: ${validTableNumber})`);

  if (typeof window.renderOrderScreen === 'function') {
    window.renderOrderScreen(window.selectedStore, validTableName, validTableNumber);
  }
};

/**
 * TLL 함수 전역 등록 확인
 */
(function() {
  console.log('🔧 TLL 함수 전역 등록 시작...');

  if (typeof window.TLL === 'function') {
    console.log('✅ TLL 함수가 이미 등록되어 있음');
  } else if (typeof TLL !== 'undefined') {
    window.TLL = TLL;
    console.log('✅ TLL 함수 전역 등록 완료');
  } else {
    console.error('❌ TLL 함수 정의를 찾을 수 없음');
  }
})();

console.log('✅ TLL 모듈 로드 완료 (레이어드 아키텍처)');
