
/**
 * Guest Payment Controller - 비회원 결제 이벤트 처리 및 흐름 제어
 */

import { guestPaymentService } from '../services/guestPaymentService.js';

export class GuestPaymentController {
  constructor() {
    this.tossPayments = null;
    this.guestInfo = null;
    this.orderData = null;
    this.storeData = null;
    this.selectedPaymentMethod = '카드';
  }

  /**
   * 결제 컨트롤러 초기화
   */
  async initialize(guestInfo, orderData, storeData) {
    console.log('🔄 비회원 결제 컨트롤러 초기화');

    this.guestInfo = guestInfo;
    this.orderData = orderData;
    this.storeData = storeData;

    // 토스페이먼츠 초기화
    this.tossPayments = await guestPaymentService.initializeTossPayments();

    console.log('✅ 비회원 결제 컨트롤러 초기화 완료');
  }

  /**
   * 결제 수단 선택
   */
  selectPaymentMethod(method) {
    this.selectedPaymentMethod = method;
    console.log('✅ 결제 수단 선택:', method);
  }

  /**
   * 결제 실행
   */
  async executePayment(finalAmount) {
    try {
      console.log('💳 비회원 결제 실행 시작');
      console.log('🎯 결제 정보:', {
        guestName: this.guestInfo.name,
        guestPhone: this.guestInfo.phone,
        amount: finalAmount,
        paymentMethod: this.selectedPaymentMethod
      });

      // 1. 결제 준비
      const prepareResult = await guestPaymentService.preparePayment(
        this.guestInfo,
        this.orderData,
        this.storeData,
        finalAmount
      );

      if (!prepareResult.success) {
        throw new Error(prepareResult.error || '결제 준비 실패');
      }

      const { orderId } = prepareResult;
      console.log('✅ 결제 준비 완료, orderId:', orderId);

      // 2. 토스페이먼츠 결제 요청
      const paymentConfig = {
        amount: parseInt(finalAmount),
        orderId: orderId,
        orderName: `${this.storeData.name} 주문`,
        customerName: this.guestInfo.name,
        customerEmail: 'guest@tablelink.com',
        successUrl: `${window.location.origin}/toss-success.html?isGuest=true`,
        failUrl: `${window.location.origin}/toss-fail.html?isGuest=true`
      };

      // 결제 수단 매핑
      const tossMethodMap = {
        '카드': '카드',
        '계좌이체': '계좌이체',
        '가상계좌': '가상계좌',
        '휴대폰': '휴대폰',
        '간편결제': '토스페이',
        '문화상품권': '문화상품권',
        '도서문화상품권': '도서문화상품권',
        '게임문화상품권': '게임문화상품권'
      };

      const tossMethod = tossMethodMap[this.selectedPaymentMethod] || '카드';
      
      console.log('💳 토스페이먼츠 결제 요청:', {
        method: tossMethod,
        config: paymentConfig
      });

      await this.tossPayments.requestPayment(tossMethod, paymentConfig);

      console.log('✅ 비회원 결제 처리 완료');
      return { success: true };

    } catch (error) {
      console.error('❌ 비회원 결제 실패:', error);
      throw error;
    }
  }
}

// 전역 등록
window.GuestPaymentController = GuestPaymentController;

console.log('✅ guestPaymentController 모듈 로드 완료');
