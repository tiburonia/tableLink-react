/**
 * Toss Payment Service - Toss Payments SDK 통합 레이어
 * Toss Payments 관련 비즈니스 로직 처리
 */

import { paymentRepository } from '../repositories/paymentRepository.js';

let tossPayments = null;
let isInitialized = false;

export const tossPaymentService = {
  /**
   * Toss Payments SDK 초기화
   */
  async initializeTossPayments() {
    if (tossPayments && isInitialized) {
      console.log('✅ 토스페이먼츠 이미 초기화됨');
      return tossPayments;
    }

    try {
      console.log('🔄 토스페이먼츠 SDK 초기화 시작...');

      // SDK 로드
      await this.loadTossSDK();

      // 클라이언트 키 가져오기 (재시도 로직 포함)
      const clientKey = await this.fetchClientKeyWithRetry();

      // 토스페이먼츠 객체 생성
      tossPayments = window.TossPayments(clientKey);
      isInitialized = true;
      
      console.log('✅ 토스페이먼츠 SDK 초기화 완료');
      return tossPayments;

    } catch (error) {
      console.error('❌ 토스페이먼츠 SDK 초기화 실패:', error);
      throw error;
    }
  },

  /**
   * Toss SDK 스크립트 로드
   */
  async loadTossSDK() {
    if (window.TossPayments) {
      console.log('✅ 토스페이먼츠 SDK 이미 로드됨');
      return;
    }

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
  },

  /**
   * 클라이언트 키 가져오기 (재시도 로직)
   */
  async fetchClientKeyWithRetry(maxRetries = 3) {
    console.log('🔑 토스페이먼츠 클라이언트 키 요청 중...');
    let retryCount = 0;

    while (retryCount < maxRetries) {
      try {
        const clientKey = await paymentRepository.fetchTossClientKey();
        console.log('✅ 토스페이먼츠 클라이언트 키 획득 완료');
        return clientKey;
      } catch (error) {
        retryCount++;
        console.warn(`⚠️ 클라이언트 키 조회 실패 (${retryCount}/${maxRetries}):`, error.message);
        
        if (retryCount >= maxRetries) {
          throw new Error('클라이언트 키를 가져올 수 없습니다');
        }
        
        await new Promise(resolve => setTimeout(resolve, 1000 * retryCount));
      }
    }
  },

  /**
   * 토스페이먼츠 결제 요청
   */
  async requestPayment(orderData, paymentMethod = '카드') {
    try {
      console.log('💳 토스페이먼츠 결제 요청 시작');
      console.log('📋 주문 데이터:', orderData);
      console.log('💰 결제 수단:', paymentMethod);

      if (!tossPayments) {
        await this.initializeTossPayments();
      }

      const { amount, orderId, orderName, customerName, customerEmail, successUrl, failUrl } = orderData;

      // 결제 수단별 처리
      const paymentConfig = {
        amount,
        orderId,
        orderName,
        customerName,
        customerEmail: customerEmail || 'customer@tablelink.com',
        successUrl: successUrl || `${window.location.origin}/toss-success.html`,
        failUrl: failUrl || `${window.location.origin}/toss-fail.html`
      };

      console.log('📤 결제 요청 설정:', paymentConfig);

      // 토스페이먼츠 결제 수단 매핑
      const tossPaymentMethodMap = {
        '카드': '카드',
        '신용/체크카드': '카드',
        '계좌이체': '계좌이체',
        '가상계좌': '가상계좌',
        '휴대폰': '휴대폰',
        '간편결제': '토스페이',
        '문화상품권': '문화상품권',
        '도서문화상품권': '도서문화상품권',
        '게임문화상품권': '게임문화상품권'
      };

      const tossMethod = tossPaymentMethodMap[paymentMethod] || '카드';
      console.log(`🎯 토스페이먼츠 결제 수단 매핑: ${paymentMethod} → ${tossMethod}`);

      // 결제 요청
      console.log(`💳 토스페이먼츠 API 호출: requestPayment('${tossMethod}', ...)`);
      const result = await tossPayments.requestPayment(tossMethod, paymentConfig);

      console.log('✅ 토스페이먼츠 결제 요청 완료:', result);
      return result;

    } catch (error) {
      console.error('❌ 토스페이먼츠 결제 요청 실패:', error);
      throw new Error(error.message || '결제 요청 중 오류가 발생했습니다.');
    }
  },

  /**
   * 결제 준비 (서버 API 호출)
   */
  async preparePayment(prepareData) {
    console.log('📋 서버에 결제 준비 요청 시작');
    
    try {
      const result = await paymentRepository.preparePayment(prepareData);
      console.log('✅ 결제 준비 완료, orderId:', result.orderId);
      return result;
    } catch (error) {
      console.error('❌ 결제 준비 실패:', error);
      throw error;
    }
  },

  /**
   * 결제 확인 플로우 실행
   */
  async executePaymentFlow(prepareData, paymentMethod = '카드') {
    try {
      // 1. 결제 준비
      const prepareResult = await this.preparePayment(prepareData);
      const generatedOrderId = prepareResult.orderId;

      // 2. 토스페이먼츠 결제 요청
      const paymentResult = await this.requestPayment({
        amount: prepareData.amount,
        orderId: generatedOrderId,
        orderName: `${prepareData.storeName} 주문`,
        customerName: prepareData.customerName || '고객',
        customerEmail: prepareData.customerEmail
      }, paymentMethod);

      console.log('✅ 결제 플로우 완료:', paymentResult);
      return paymentResult;

    } catch (error) {
      console.error('❌ 결제 플로우 실패:', error);
      throw error;
    }
  }
};

// 전역 등록 (하위 호환성)
window.requestTossPayment = tossPaymentService.requestPayment.bind(tossPaymentService);
window.initTossPayments = tossPaymentService.initializeTossPayments.bind(tossPaymentService);

console.log('✅ tossPaymentService 모듈 로드 완료');
