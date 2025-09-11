
/**
 * 토스페이먼츠 결제 성공 처리 페이지 (안전한 버전)
 */

console.log('🔄 토스 결제 성공 페이지 로드 시작');

// DOM 요소 안전 확인
function ensureContainer() {
  let container = document.querySelector('.container');
  if (!container) {
    console.warn('⚠️ .container 요소가 없음, body에 직접 추가');
    container = document.createElement('div');
    container.className = 'container';
    document.body.appendChild(container);
  }
  return container;
}

// URL 파라미터 추출
function getUrlParams() {
  try {
    const urlParams = new URLSearchParams(window.location.search);
    const params = {
      paymentKey: urlParams.get('paymentKey'),
      orderId: urlParams.get('orderId'),
      amount: urlParams.get('amount')
    };
    console.log('📋 URL 파라미터 추출:', params);
    return params;
  } catch (error) {
    console.error('❌ URL 파라미터 추출 실패:', error);
    return { paymentKey: null, orderId: null, amount: null };
  }
}

// TableLink로 돌아가기
function goBack() {
  console.log('🔄 TableLink로 돌아가기');
  window.location.href = '/';
}

// 상태 표시
function showStatus(message) {
  try {
    console.log('📱 상태 표시:', message);
    const container = ensureContainer();
    container.innerHTML = `
      <div class="status-icon">⏳</div>
      <h1>${message}</h1>
      <div class="loading-spinner"></div>
    `;
  } catch (error) {
    console.error('❌ 상태 표시 실패:', error);
  }
}

// 오류 표시
function showError(message) {
  try {
    console.log('❌ 오류 표시:', message);
    const container = ensureContainer();
    container.innerHTML = `
      <div class="status-icon">❌</div>
      <h1>결제 처리 실패</h1>
      <p class="error-message">${message}</p>
      <button class="btn" onclick="goBack()">TableLink로 돌아가기</button>
    `;
  } catch (error) {
    console.error('❌ 오류 표시 실패:', error);
    // 최후의 수단으로 alert 사용
    alert('결제 처리 실패: ' + message);
  }
}

// 성공 표시
function showSuccess(orderData) {
  try {
    console.log('✅ 성공 표시:', orderData);
    const container = ensureContainer();
    container.innerHTML = `
      <div class="status-icon">✅</div>
      <h1>결제 완료!</h1>
      <div class="order-info">
        <h3>주문 정보</h3>
        <p><strong>매장:</strong> ${orderData.storeName || '알 수 없음'}</p>
        <p><strong>테이블:</strong> ${orderData.tableNumber || '알 수 없음'}</p>
        <p><strong>주문번호:</strong> ${orderData.orderId || '알 수 없음'}</p>
        <p><strong>결제금액:</strong> ${parseInt(orderData.finalTotal || orderData.amount || 0).toLocaleString()}원</p>
      </div>
      <button class="btn" onclick="goBack()">TableLink로 돌아가기</button>
    `;
  } catch (error) {
    console.error('❌ 성공 표시 실패:', error);
  }
}

// 메인 처리 함수
async function handlePaymentSuccess() {
  console.log('🚀 결제 성공 처리 함수 시작');
  
  try {
    console.log('🔍 URL 파라미터 추출 중...');
    const { paymentKey, orderId, amount } = getUrlParams();
    console.log('📋 추출된 파라미터:', { paymentKey, orderId, amount });

    if (!paymentKey || !orderId || !amount) {
      console.error('❌ 필수 파라미터 누락');
      throw new Error('결제 정보가 올바르지 않습니다.');
    }

    console.log('🔄 결제 성공 처리 시작:', { paymentKey, orderId, amount });
    showStatus('결제 승인 처리 중');

    // 1. 전역 객체에서 주문 정보 가져오기
    console.log('📋 전역 객체에서 주문 정보 조회 중...');
    console.log('🔍 window.tablelink 상태:', window.tablelink);
    
    let pendingOrderData = {};
    
    if (window.tablelink && window.tablelink.pendingPaymentData) {
      pendingOrderData = window.tablelink.pendingPaymentData;
      console.log('✅ 전역 객체에서 데이터 로드 성공:', pendingOrderData);
      console.log('🔍 로드된 데이터 상세 확인:', {
        userId: pendingOrderData.userId,
        storeId: pendingOrderData.storeId,
        storeName: pendingOrderData.storeName,
        tableNumber: pendingOrderData.tableNumber,
        hasOrderData: !!pendingOrderData.orderData,
        orderDataType: typeof pendingOrderData.orderData,
        orderDataKeys: pendingOrderData.orderData ? Object.keys(pendingOrderData.orderData) : 'none'
      });
    } else {
      // 폴백: sessionStorage에서 시도
      console.warn('⚠️ 전역 객체에 pendingPaymentData가 없음, sessionStorage에서 시도');
      const sessionData = sessionStorage.getItem('pendingOrderData');
      console.log('💾 sessionStorage 데이터:', sessionData);
      
      if (sessionData) {
        try {
          pendingOrderData = JSON.parse(sessionData);
          console.log('📦 sessionStorage에서 데이터 복구:', pendingOrderData);
        } catch (error) {
          console.error('❌ sessionStorage 데이터 파싱 실패:', error);
        }
      }
      console.log('🔍 window.tablelink 상태:', window.tablelink);
    }
    
    // 기본값 설정 (undefined 방지)
    const safeOrderData = {
      userId: pendingOrderData.userId || null,
      storeId: pendingOrderData.storeId || null,
      storeName: pendingOrderData.storeName || null,
      tableNumber: pendingOrderData.tableNumber || pendingOrderData.tableNum || null,
      orderData: pendingOrderData.orderData || null,
      usedPoint: pendingOrderData.usedPoint || pendingOrderData.usedPoints || 0,
      selectedCouponId: pendingOrderData.selectedCouponId || null,
      couponDiscount: pendingOrderData.couponDiscount || 0,
      paymentMethod: pendingOrderData.paymentMethod || '카드',
      finalTotal: pendingOrderData.finalTotal || amount
    };
    
    console.log('🛡️ 안전한 주문 데이터:', safeOrderData);

    // 2. 토스페이먼츠 결제 승인 API 호출 - 안전한 데이터 사용
    console.log('🔄 토스페이먼츠 결제 승인 API 호출 시작');
    console.log('📤 전송할 데이터:', {
      paymentKey,
      orderId,
      amount: parseInt(amount),
      ...safeOrderData
    });

    const requestBody = { 
      paymentKey, 
      orderId, 
      amount: parseInt(amount),
      // 안전한 주문 정보 전달
      userId: safeOrderData.userId,
      storeId: safeOrderData.storeId,
      storeName: safeOrderData.storeName,
      tableNumber: safeOrderData.tableNumber,
      orderData: safeOrderData.orderData,
      usedPoint: safeOrderData.usedPoint,
      selectedCouponId: safeOrderData.selectedCouponId,
      couponDiscount: safeOrderData.couponDiscount,
      paymentMethod: safeOrderData.paymentMethod
    };

    console.log('🔍 최종 요청 본문:', JSON.stringify(requestBody, null, 2));

    const confirmResponse = await fetch('/api/toss/confirm', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache'
      },
      body: JSON.stringify(requestBody)
    });

    console.log('📨 API 응답 상태:', confirmResponse.status);
    console.log('📨 API 응답 헤더:', Object.fromEntries(confirmResponse.headers.entries()));

    if (!confirmResponse.ok) {
      const errorText = await confirmResponse.text();
      console.error('❌ API 응답 오류 (텍스트):', errorText);
      
      let errorData;
      try {
        errorData = JSON.parse(errorText);
      } catch (parseError) {
        console.error('❌ 오류 응답 파싱 실패:', parseError);
        errorData = { error: `서버 오류 (${confirmResponse.status}): ${errorText}` };
      }
      
      console.error('❌ API 응답 오류 (파싱됨):', errorData);
      throw new Error(errorData.error || '결제 승인 실패');
    }

    const confirmResult = await confirmResponse.json();
    console.log('✅ 결제 승인 및 주문 생성 완료:', confirmResult);

    // 3. 전역 객체 정리
    if (window.tablelink) {
      delete window.tablelink.pendingPaymentData;
      console.log('🗑️ 전역 객체 결제 데이터 정리 완료');
    }
    
    // 4. 성공 화면 표시
    showSuccess({
      storeName: safeOrderData.storeName,
      tableNumber: safeOrderData.tableNumber,
      orderId: orderId,
      finalTotal: safeOrderData.finalTotal,
      amount: amount
    });

    console.log('✅ 결제 성공 처리 완료');

  } catch (error) {
    console.error('❌ 결제 후 처리 실패:', error);
    console.error('❌ 오류 스택:', error.stack);
    showError(error.message || '결제 처리 중 오류가 발생했습니다.');
  }
}

// DOM 로드 확인
console.log('🔍 DOM 상태:', document.readyState);

// DOM 로드 후 실행 (더 안전한 방식)
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    console.log('📄 DOM 로드 완료, 결제 처리 시작');
    handlePaymentSuccess();
  });
} else {
  console.log('📄 DOM 이미 로드됨, 즉시 결제 처리 시작');
  handlePaymentSuccess();
}

console.log('✅ 토스 결제 성공 페이지 스크립트 로드 완료');
