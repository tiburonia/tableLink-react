
/**
 * 토스페이먼츠 결제 결과 통합 처리 핸들러
 */

console.log('🔄 토스페이먼츠 결과 핸들러 로드됨');

// 강제 콘솔 출력 함수
function forceLog(...args) {
  console.log(...args);
  // 브라우저 콘솔 강제 플러시
  if (typeof console.trace === 'function') {
    // console.trace();
  }
  // 비동기 콘솔 출력 보장
  setTimeout(() => {}, 0);
}

// URL 파라미터 추출
function getUrlParams() {
  forceLog('🔍 URL 파라미터 추출 시작');
  const urlParams = new URLSearchParams(window.location.search);
  const params = {
    paymentKey: urlParams.get('paymentKey'),
    orderId: urlParams.get('orderId'),
    amount: urlParams.get('amount')
  };
  forceLog('✅ URL 파라미터:', params);
  return params;
}

// UI 업데이트 함수들
function showStatus(message) {
  forceLog('⏳ 상태 표시:', message);
  updateUI(`
    <div class="status-icon">⏳</div>
    <h1>${message}</h1>
    <div class="loading-spinner"></div>
  `);
}

function showError(message) {
  forceLog('❌ 오류 표시:', message);
  updateUI(`
    <div class="status-icon">❌</div>
    <h1>결제 처리 실패</h1>
    <p class="error-message">${message}</p>
    <button class="btn" onclick="goBack()">TableLink로 돌아가기</button>
  `);
}

function showSuccess(orderData) {
  forceLog('✅ 성공 표시:', orderData);
  updateUI(`
    <div class="status-icon">✅</div>
    <h1>결제 완료!</h1>
    <div class="order-info">
      <h3>주문 정보</h3>
      <p><strong>매장:</strong> ${orderData.storeName || '정통 양념'}</p>
      <p><strong>테이블:</strong> ${orderData.tableNumber || '1번'}</p>
      <p><strong>주문번호:</strong> ${orderData.orderId || 'N/A'}</p>
      <p><strong>결제금액:</strong> ${parseInt(orderData.amount || 0).toLocaleString()}원</p>
    </div>
    <button class="btn" onclick="goBack()">TableLink로 돌아가기</button>
  `);
}

function updateUI(content) {
  const container = document.querySelector('.container') || document.body;
  container.innerHTML = content;
}

function goBack() {
  forceLog('🔙 TableLink로 돌아가기');
  window.location.href = '/';
}

// 결제 성공 처리
async function handlePaymentSuccess() {
  forceLog('🚀 결제 성공 처리 시작');
  
  try {
    // 단계별 지연으로 로그 출력 보장
    await new Promise(resolve => setTimeout(resolve, 50));
    
    const { paymentKey, orderId, amount } = getUrlParams();
    
    forceLog('📋 파라미터 검증:', { 
      paymentKey: !!paymentKey, 
      orderId: !!orderId, 
      amount: !!amount 
    });

    if (!paymentKey || !orderId || !amount) {
      throw new Error('결제 정보가 올바르지 않습니다.');
    }

    forceLog('🔄 결제 승인 처리 시작');
    showStatus('결제 승인 처리 중');

    await new Promise(resolve => setTimeout(resolve, 100));

    // 저장된 주문 정보 가져오기
    forceLog('📋 저장된 주문 정보 조회 중...');
    
    let orderInfo = {};
    
    // 전역 객체에서 먼저 시도
    if (window.tablelink && window.tablelink.pendingPaymentData) {
      orderInfo = window.tablelink.pendingPaymentData;
      forceLog('✅ 전역 객체에서 주문 정보 로드:', orderInfo);
    } else {
      // sessionStorage에서 시도
      const sessionData = sessionStorage.getItem('pendingOrderData');
      if (sessionData) {
        try {
          orderInfo = JSON.parse(sessionData);
          forceLog('✅ sessionStorage에서 주문 정보 로드:', orderInfo);
        } catch (e) {
          forceLog('❌ sessionStorage 파싱 실패:', e);
        }
      }
    }

    await new Promise(resolve => setTimeout(resolve, 50));

    // API 요청 데이터 준비
    const requestData = {
      paymentKey,
      orderId,
      amount: parseInt(amount),
      userId: orderInfo.userId || 'tiburonia',
      storeId: orderInfo.storeId || 497,
      storeName: orderInfo.storeName || '정통 양념',
      tableNumber: orderInfo.tableNumber || 1,
      orderData: orderInfo.orderData || {
        items: [{
          name: '기본 주문',
          price: parseInt(amount),
          quantity: 1
        }]
      },
      usedPoint: orderInfo.usedPoint || 0,
      selectedCouponId: orderInfo.selectedCouponId || null,
      couponDiscount: orderInfo.couponDiscount || 0,
      paymentMethod: orderInfo.paymentMethod || '카드'
    };

    forceLog('📤 API 요청 데이터:', requestData);

    await new Promise(resolve => setTimeout(resolve, 100));

    // 결제 승인 API 호출
    forceLog('📡 API 호출 시작: /api/toss/confirm');
    
    const response = await fetch('/api/toss/confirm', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestData)
    });

    forceLog('📡 API 응답 상태:', response.status);

    if (!response.ok) {
      let errorData;
      try {
        errorData = await response.json();
      } catch {
        errorData = { error: `서버 오류 (${response.status})` };
      }
      
      forceLog('❌ API 오류 응답:', errorData);
      throw new Error(errorData.error || '결제 승인 실패');
    }

    const result = await response.json();
    forceLog('✅ API 응답 성공:', result);

    // 성공 화면 표시
    showSuccess({
      storeName: requestData.storeName,
      tableNumber: requestData.tableNumber,
      orderId: orderId,
      amount: amount
    });

    // 데이터 정리
    if (window.tablelink && window.tablelink.pendingPaymentData) {
      delete window.tablelink.pendingPaymentData;
    }
    sessionStorage.removeItem('pendingOrderData');

    forceLog('🎉 결제 처리 완료');

  } catch (error) {
    forceLog('❌ 결제 처리 실패:', error.message);
    forceLog('❌ 에러 스택:', error.stack);
    showError(error.message || '결제 처리 중 오류가 발생했습니다');
  }
}

// 결제 실패 처리
async function handlePaymentFailure() {
  forceLog('💥 결제 실패 처리 시작');
  
  try {
    const { code, message, orderId } = getUrlParams();
    
    forceLog('❌ 결제 실패 정보:', { code, message, orderId });
    
    showError(message || '결제가 취소되거나 실패했습니다');
    
    // 데이터 정리
    if (window.tablelink && window.tablelink.pendingPaymentData) {
      delete window.tablelink.pendingPaymentData;
    }
    sessionStorage.removeItem('pendingOrderData');
    
  } catch (error) {
    forceLog('❌ 결제 실패 처리 중 오류:', error);
    showError('결제 실패 처리 중 오류가 발생했습니다');
  }
}

// 자동 실행
function autoRun() {
  forceLog('🔄 자동 실행 시작');
  
  const urlParams = new URLSearchParams(window.location.search);
  const hasPaymentKey = urlParams.has('paymentKey');
  const hasErrorCode = urlParams.has('code');
  
  forceLog('🔍 URL 분석:', { hasPaymentKey, hasErrorCode });
  
  if (hasPaymentKey) {
    forceLog('✅ 결제 성공으로 판단');
    handlePaymentSuccess();
  } else if (hasErrorCode) {
    forceLog('❌ 결제 실패로 판단');
    handlePaymentFailure();
  } else {
    forceLog('❓ 알 수 없는 상태');
    showError('결제 상태를 확인할 수 없습니다');
  }
}

// 전역 함수 등록
window.handlePaymentSuccess = handlePaymentSuccess;
window.handlePaymentFailure = handlePaymentFailure;
window.goBack = goBack;

// 페이지 로드 시 자동 실행
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', autoRun);
} else {
  autoRun();
}

forceLog('✅ 토스페이먼츠 결과 핸들러 초기화 완료');
