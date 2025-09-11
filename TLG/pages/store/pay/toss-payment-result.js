
/**
 * 토스페이먼츠 결제 결과 통합 처리 스크립트
 * 성공/실패 모두 처리하는 통합 모듈
 */

console.log('📱 토스 결제 결과 처리 모듈 로드');

// =================== 유틸리티 함수 ===================
function getUrlParams() {
  console.log('🔍 URL 파라미터 추출 시작');
  const urlParams = new URLSearchParams(window.location.search);
  const params = {
    // 성공 시 파라미터
    paymentKey: urlParams.get('paymentKey'),
    orderId: urlParams.get('orderId'),
    amount: urlParams.get('amount'),
    
    // 실패 시 파라미터
    message: urlParams.get('message'),
    code: urlParams.get('code'),
    
    // 공통
    success: urlParams.get('success')
  };
  console.log('✅ URL 파라미터 추출 완료:', params);
  return params;
}

function forceLog(message, ...args) {
  console.log(`[${new Date().toISOString()}] ${message}`, ...args);
}

// =================== UI 렌더링 함수 ===================
function showStatus(message, isLoading = true) {
  console.log('⏳ 상태 표시:', message);
  const main = document.getElementById('main') || document.body;
  main.innerHTML = `
    <div class="payment-result-container">
      <div class="status-icon">${isLoading ? '⏳' : '✅'}</div>
      <h1>${isLoading ? '처리 중...' : '완료!'}</h1>
      <p>${message}</p>
      ${isLoading ? '<div class="loading-spinner"></div>' : ''}
    </div>
    ${getResultStyles()}
  `;
}

function showError(message, code = 'UNKNOWN_ERROR') {
  console.error('❌ 오류 표시:', message, code);
  const main = document.getElementById('main') || document.body;
  main.innerHTML = `
    <div class="payment-result-container">
      <div class="status-icon">❌</div>
      <h1>결제 실패</h1>
      <div class="error-info">
        <p><strong>사유:</strong> ${message}</p>
        <p><strong>코드:</strong> ${code}</p>
      </div>
      <div class="action-buttons">
        <button class="btn primary" onclick="retryPayment()">다시 시도</button>
        <button class="btn secondary" onclick="goBack()">TableLink로 돌아가기</button>
      </div>
    </div>
    ${getResultStyles()}
  `;
}

function showSuccess(data) {
  console.log('✅ 성공 표시:', data);
  const main = document.getElementById('main') || document.body;
  main.innerHTML = `
    <div class="payment-result-container">
      <div class="status-icon">✅</div>
      <h1>결제 완료!</h1>
      <div class="order-info">
        <h3>주문 정보</h3>
        <p><strong>매장:</strong> ${data.storeName || '알 수 없음'}</p>
        <p><strong>테이블:</strong> ${data.tableNumber || '알 수 없음'}</p>
        <p><strong>주문번호:</strong> ${data.orderId || '알 수 없음'}</p>
        <p><strong>결제금액:</strong> ${parseInt(data.finalTotal || data.amount || 0).toLocaleString()}원</p>
        <p><strong>결제방법:</strong> 토스페이먼츠</p>
      </div>
      <button class="btn" onclick="goBack()">TableLink로 돌아가기</button>
    </div>
    ${getResultStyles()}
  `;
}

function getResultStyles() {
  return `
    <style>
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
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
        color: white;
        padding: 20px;
        text-align: center;
      }

      .status-icon {
        font-size: 80px;
        margin-bottom: 20px;
        animation: bounce 1s infinite;
      }

      @keyframes bounce {
        0%, 20%, 50%, 80%, 100% { transform: translateY(0); }
        40% { transform: translateY(-10px); }
        60% { transform: translateY(-5px); }
      }

      .payment-result-container h1 {
        font-size: 28px;
        font-weight: 700;
        margin-bottom: 20px;
        color: white;
      }

      .payment-result-container p {
        font-size: 16px;
        margin-bottom: 15px;
        opacity: 0.9;
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

      .order-info {
        background: rgba(255, 255, 255, 0.1);
        border-radius: 16px;
        padding: 20px;
        margin: 20px 0;
        text-align: left;
        backdrop-filter: blur(10px);
        border: 1px solid rgba(255, 255, 255, 0.2);
      }

      .order-info h3 {
        font-size: 20px;
        margin-bottom: 15px;
        text-align: center;
        color: white;
      }

      .order-info p {
        margin: 8px 0;
        font-size: 14px;
        display: flex;
        justify-content: space-between;
        padding: 5px 0;
        border-bottom: 1px solid rgba(255, 255, 255, 0.1);
      }

      .order-info p:last-child {
        border-bottom: none;
      }

      .error-info {
        background: rgba(231, 76, 60, 0.2);
        border-radius: 12px;
        padding: 20px;
        margin: 20px 0;
        text-align: left;
        border-left: 4px solid #e74c3c;
        backdrop-filter: blur(10px);
      }

      .error-info p {
        margin: 8px 0;
        font-size: 14px;
      }

      .btn {
        background: linear-gradient(135deg, #27ae60 0%, #2ecc71 100%);
        color: white;
        border: none;
        padding: 15px 30px;
        border-radius: 25px;
        font-size: 16px;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.3s ease;
        margin: 10px;
        min-width: 150px;
        box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
      }

      .btn:hover {
        transform: translateY(-2px);
        box-shadow: 0 6px 20px rgba(0, 0, 0, 0.3);
      }

      .btn.primary {
        background: linear-gradient(135deg, #3498db 0%, #2980b9 100%);
      }

      .btn.secondary {
        background: linear-gradient(135deg, #95a5a6 0%, #7f8c8d 100%);
      }

      .action-buttons {
        margin-top: 20px;
      }

      @media (max-width: 480px) {
        .payment-result-container {
          padding: 20px;
        }
        
        .status-icon {
          font-size: 60px;
        }
        
        .payment-result-container h1 {
          font-size: 24px;
        }
        
        .btn {
          display: block;
          width: 100%;
          margin: 10px 0;
        }
      }
    </style>
  `;
}

// =================== 네비게이션 함수 ===================
function retryPayment() {
  console.log('🔄 결제 재시도');
  goBack();
}

function goBack() {
  console.log('🔙 TableLink로 돌아가기');
  try {
    if (window.opener && !window.opener.closed) {
      window.opener.location.href = '/';
      window.close();
    } else {
      window.location.href = '/';
    }
  } catch (e) {
    window.location.href = '/';
  }
}

// =================== 결제 처리 함수 ===================
/**
 * TLL 결제 성공 처리
 */
async function processTLLPaymentSuccess() {
  try {
    const { paymentKey, orderId, amount } = getUrlParams();

    if (!paymentKey || !orderId || !amount) {
      throw new Error('결제 정보가 올바르지 않습니다.');
    }

    forceLog('🔄 TLL 결제 성공 처리 시작:', { paymentKey, orderId, amount });
    showStatus('결제 승인 처리 중...');

    // 전역 객체에서 주문 정보 가져오기
    forceLog('📋 전역 객체에서 주문 정보 조회 중...');
    
    let pendingOrderData = {};
    
    if (window.tablelink && window.tablelink.pendingPaymentData) {
      pendingOrderData = window.tablelink.pendingPaymentData;
      forceLog('✅ 전역 객체에서 데이터 로드 성공:', pendingOrderData);
    } else {
      forceLog('⚠️ 전역 객체에서 결제 데이터를 찾을 수 없음, 기본 처리');
    }

    forceLog('📤 토스페이먼츠 결제 승인 요청 - 추가 파라미터:', {
      userId: pendingOrderData.userId,
      storeId: pendingOrderData.storeId,
      storeName: pendingOrderData.storeName,
      tableNumber: pendingOrderData.tableNumber,
      orderData: pendingOrderData.orderData || '없음',
      usedPoint: pendingOrderData.usedPoint,
      selectedCouponId: pendingOrderData.selectedCouponId,
      couponDiscount: pendingOrderData.couponDiscount,
      paymentMethod: pendingOrderData.paymentMethod
    });

    // 토스페이먼츠 결제 승인 API 호출
    const confirmResponse = await fetch('/api/toss/confirm', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        paymentKey,
        orderId,
        amount: parseInt(amount),
        // 전역 객체의 추가 데이터 포함
        ...pendingOrderData
      })
    });

    forceLog('📡 API 응답 상태:', confirmResponse.status, confirmResponse.statusText);
    forceLog('📡 API 응답 헤더:', Object.fromEntries(confirmResponse.headers.entries()));

    if (!confirmResponse.ok) {
      forceLog('❌ API 응답이 성공이 아님, 상태 코드:', confirmResponse.status);
      let errorData;
      try {
        errorData = await confirmResponse.json();
        forceLog('❌ API 응답 오류 데이터:', errorData);
      } catch (parseError) {
        forceLog('❌ 오류 응답 JSON 파싱 실패:', parseError);
        errorData = { error: '서버 응답을 파싱할 수 없음' };
      }
      throw new Error(errorData.error || `서버 오류 (${confirmResponse.status})`);
    }

    forceLog('✅ API 응답 성공');
    const result = await confirmResponse.json();
    forceLog('✅ 결제 승인 완료:', result);
    
    // 성공 화면 표시 (전역 객체 데이터 활용)
    showSuccess({
      paymentKey,
      orderId,
      amount,
      storeName: pendingOrderData.storeName,
      tableNumber: pendingOrderData.tableNumber,
      finalTotal: pendingOrderData.finalTotal || amount
    });

    // 전역 객체 정리
    if (window.tablelink && window.tablelink.pendingPaymentData) {
      delete window.tablelink.pendingPaymentData;
      forceLog('🧹 전역 객체 결제 데이터 정리 완료');
    }

  } catch (error) {
    forceLog('❌ TLL 결제 성공 처리 실패:', error);
    showError(error.message || '결제 처리 중 오류가 발생했습니다.');
  }
}

/**
 * TLL 결제 실패 처리
 */
function processTLLPaymentFailure() {
  try {
    const { message, code } = getUrlParams();
    const errorMessage = message || '결제 처리 중 오류가 발생했습니다';
    const errorCode = code || 'UNKNOWN_ERROR';
    
    forceLog('❌ TLL 결제 실패 파라미터:', { message: errorMessage, code: errorCode });
    
    showError(errorMessage, errorCode);
    
    // 전역 객체 정리
    if (window.tablelink && window.tablelink.pendingPaymentData) {
      delete window.tablelink.pendingPaymentData;
      forceLog('🧹 전역 객체 결제 데이터 정리 완료');
    }
    
  } catch (error) {
    forceLog('❌ TLL 결제 실패 처리 오류:', error);
    showError('결제 실패 처리 중 오류가 발생했습니다.');
  }
}

// =================== 메인 처리 함수 ===================
/**
 * 결제 결과 자동 판단 및 처리
 */
function processPaymentResult() {
  try {
    const params = getUrlParams();
    
    forceLog('🔍 결제 결과 판단:', params);
    
    // 성공 파라미터가 있는지 확인
    if (params.paymentKey && params.orderId && params.amount) {
      forceLog('✅ 결제 성공 파라미터 감지');
      processTLLPaymentSuccess();
    } 
    // 실패 파라미터가 있는지 확인
    else if (params.message || params.code || params.success === 'false') {
      forceLog('❌ 결제 실패 파라미터 감지');
      processTLLPaymentFailure();
    }
    // 파라미터가 없는 경우
    else {
      forceLog('⚠️ 결제 결과 파라미터를 찾을 수 없음');
      showError('결제 정보를 찾을 수 없습니다.');
    }
    
  } catch (error) {
    forceLog('❌ 결제 결과 처리 오류:', error);
    showError('결제 결과 처리 중 오류가 발생했습니다.');
  }
}

// =================== 전역 함수 등록 ===================
window.processTLLPaymentSuccess = processTLLPaymentSuccess;
window.processTLLPaymentFailure = processTLLPaymentFailure;
window.processPaymentResult = processPaymentResult;
window.retryPayment = retryPayment;
window.goBack = goBack;

// =================== 자동 실행 ===================
// DOM 로드 시 또는 즉시 실행
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', processPaymentResult);
} else {
  processPaymentResult();
}

forceLog('✅ 토스 결제 결과 통합 처리 모듈 로드 완료');
