
/**
 * 토스페이먼츠 SDK 통합 모듈 (완전 재작성 - 통합 결제 시스템)
 */

let tossPayments = null;
let isInitialized = false;

// 토스페이먼츠 SDK 초기화
async function initTossPayments() {
  if (tossPayments && isInitialized) {
    console.log('✅ 토스페이먼츠 이미 초기화됨');
    return tossPayments;
  }

  try {
    console.log('🔄 토스페이먼츠 SDK 초기화 시작...');

    // SDK 로드
    if (!window.TossPayments) {
      console.log('📦 토스페이먼츠 SDK 스크립트 로드 중...');
      const script = document.createElement('script');
      script.src = 'https://js.tosspayments.com/v1/payment';
      script.async = true;
      document.head.appendChild(script);

      await new Promise((resolve, reject) => {
        script.onload = resolve;
        script.onerror = () => reject(new Error('토스페이먼츠 SDK 로드 실패'));
      });
      console.log('✅ 토스페이먼츠 SDK 스크립트 로드 완료');
    }

    // 클라이언트 키 가져오기 (재시도 로직 포함)
    console.log('🔑 토스페이먼츠 클라이언트 키 요청 중...');
    let clientKey = null;
    let retryCount = 0;
    const maxRetries = 3;

    while (!clientKey && retryCount < maxRetries) {
      try {
        const response = await fetch('/api/toss/client-key', {
          headers: {
            'Cache-Control': 'no-cache',
            'Pragma': 'no-cache'
          }
        });

        if (!response.ok) {
          throw new Error(`클라이언트 키 조회 실패: ${response.status}`);
        }

        const data = await response.json();
        clientKey = data.clientKey;
        console.log('✅ 토스페이먼츠 클라이언트 키 획득 완료');
        break;
      } catch (error) {
        retryCount++;
        console.warn(`⚠️ 클라이언트 키 조회 실패 (${retryCount}/${maxRetries}):`, error.message);
        
        if (retryCount >= maxRetries) {
          throw new Error('클라이언트 키를 가져올 수 없습니다');
        }
        
        await new Promise(resolve => setTimeout(resolve, 1000 * retryCount));
      }
    }

    // 토스페이먼츠 객체 생성
    tossPayments = window.TossPayments(clientKey);
    isInitialized = true;
    
    console.log('✅ 토스페이먼츠 SDK 초기화 완료');
    return tossPayments;

  } catch (error) {
    console.error('❌ 토스페이먼츠 SDK 초기화 실패:', error);
    throw error;
  }
}

// 토스페이먼츠 결제 요청
async function requestTossPayment(orderData, paymentMethod = '카드') {
  try {
    console.log('💳 토스페이먼츠 결제 요청:', { orderData, paymentMethod });

    if (!tossPayments) {
      await initTossPayments();
    }

    const { amount, orderId, orderName, customerName, customerEmail } = orderData;

    if (!amount || amount <= 0) {
      throw new Error('결제 금액이 유효하지 않습니다');
    }

    if (!orderId) {
      throw new Error('주문 ID가 없습니다');
    }

    // 토스페이먼츠 결제 방법 매핑
    const methodMap = {
      '카드': 'CARD',
      '가상계좌': 'VIRTUAL_ACCOUNT',
      '간편결제': 'EASY_PAY',
      '휴대폰': 'MOBILE_PHONE',
      '계좌이체': 'TRANSFER',
      '문화상품권': 'CULTURE_GIFT_CERTIFICATE',
      '도서문화상품권': 'BOOK_CULTURE_GIFT_CERTIFICATE',
      '게임문화상품권': 'GAME_CULTURE_GIFT_CERTIFICATE'
    };

    const tossMethod = methodMap[paymentMethod] || 'CARD';

    console.log('🔄 토스페이먼츠 결제 창 호출:', { 
      amount, 
      orderId, 
      orderName: orderName || '주문', 
      method: tossMethod 
    });

    // 토스페이먼츠 결제 요청
    const result = await tossPayments.requestPayment(tossMethod, {
      amount: parseInt(amount),
      orderId: orderId,
      orderName: orderName || '주문',
      customerName: customerName || '고객',
      customerEmail: customerEmail || 'customer@tablelink.com',
      successUrl: orderData.successUrl || `${window.location.origin}/toss-success.html`,
      failUrl: orderData.failUrl || `${window.location.origin}/toss-fail.html`
    });

    console.log('✅ 토스페이먼츠 결제 요청 성공:', result);
    return { success: true, data: result };

  } catch (error) {
    console.error('❌ 토스페이먼츠 결제 요청 실패:', error);
    return { success: false, error: error.message };
  }
}

// 토스페이먼츠 결제 승인
async function confirmTossPayment(paymentKey, orderId, amount) {
  console.log('🔑 토스페이먼츠 결제 승인 요청:', { paymentKey, orderId, amount });
  
  try {
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
      const errorData = await response.text();
      let errorMessage;
      
      try {
        const errorJson = JSON.parse(errorData);
        errorMessage = errorJson.error || '결제 승인 실패';
      } catch {
        errorMessage = `서버 오류 (${response.status})`;
      }
      
      // 이미 처리된 결제인 경우 성공으로 처리
      if (errorMessage.includes('이미 처리된 결제') || errorMessage.includes('ALREADY_PROCESSED')) {
        console.log('⚠️ 이미 처리된 결제 - 성공으로 처리');
        return { 
          success: true, 
          data: { paymentKey, orderId, amount, alreadyProcessed: true }
        };
      }
      
      throw new Error(errorMessage);
    }

    const result = await response.json();
    console.log('✅ 토스페이먼츠 결제 승인 성공:', result);
    
    return { success: true, data: result };
  } catch (error) {
    console.error('❌ 토스페이먼츠 결제 승인 실패:', error);
    return { success: false, error: error.message };
  }
}

// 전역 함수로 등록
window.initTossPayments = initTossPayments;
window.requestTossPayment = requestTossPayment;
window.confirmTossPayment = confirmTossPayment;

console.log('✅ 토스페이먼츠 모듈 전역 등록 완료');
console.log('🔍 등록된 함수들:', {
  initTossPayments: typeof window.initTossPayments,
  requestTossPayment: typeof window.requestTossPayment,
  confirmTossPayment: typeof window.confirmTossPayment
});
