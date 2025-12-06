
/**
 * Guest Payment Service - 비회원 결제 비즈니스 로직
 */

import { guestPaymentRepository } from '../repositories/guestPaymentRepository.js';

export const guestPaymentService = {
  /**
   * 비회원 결제 데이터 준비
   */
  prepareGuestPaymentData(guestInfo, orderData, storeData, finalAmount) {
    const { name, phone } = guestInfo;
    const { storeId, tableNumber, items } = orderData;

    return {
      storeId: parseInt(storeId),
      tableNumber: parseInt(tableNumber),
      guestName: name,
      guestPhone: phone,
      orderData: {
        storeName: storeData.name || '매장',
        items: (items || []).map(item => ({
          menuId: item.menuId,
          name: item.menuName || item.name,
          quantity: item.quantity,
          price: item.price
        })),
        guestName: name,
        guestPhone: phone,
        isGuest: true
      },
      amount: parseInt(finalAmount)
    };
  },

  /**
   * 비회원 결제 준비 실행
   */
  async preparePayment(guestInfo, orderData, storeData, finalAmount) {
    try {
      const prepareData = this.prepareGuestPaymentData(
        guestInfo,
        orderData,
        storeData,
        finalAmount
      );

      console.log('💳 비회원 결제 준비 시작:', prepareData);

      const result = await guestPaymentRepository.prepareGuestPayment(prepareData);

      return {
        success: true,
        orderId: result.orderId
      };
    } catch (error) {
      console.error('❌ 비회원 결제 준비 실패:', error);
      return {
        success: false,
        error: error.message
      };
    }
  },

  /**
   * 비회원 결제 승인 실행
   */
  async confirmPayment(paymentKey, orderId, amount) {
    try {
      const confirmData = {
        paymentKey,
        orderId,
        amount: parseInt(amount)
      };

      console.log('💳 비회원 결제 승인 시작:', confirmData);

      const result = await guestPaymentRepository.confirmGuestPayment(confirmData);

      return {
        success: true,
        data: result
      };
    } catch (error) {
      console.error('❌ 비회원 결제 승인 실패:', error);
      return {
        success: false,
        error: error.message
      };
    }
  },

  /**
   * 토스페이먼츠 초기화
   */
  async initializeTossPayments() {
    try {
      if (window.TossPayments) {
        console.log('✅ 토스페이먼츠 이미 로드됨');
      } else {
        console.log('📦 토스페이먼츠 SDK 로드 중...');
        const script = document.createElement('script');
        script.src = 'https://js.tosspayments.com/v1/payment';
        script.async = true;
        document.head.appendChild(script);

        await new Promise((resolve, reject) => {
          script.onload = resolve;
          script.onerror = () => reject(new Error('토스페이먼츠 SDK 로드 실패'));
        });
      }

      const clientKey = await guestPaymentRepository.fetchTossClientKey();
      const tossPayments = window.TossPayments(clientKey);

      console.log('✅ 토스페이먼츠 초기화 완료');
      return tossPayments;
    } catch (error) {
      console.error('❌ 토스페이먼츠 초기화 실패:', error);
      throw error;
    }
  }
};

console.log('✅ guestPaymentService 모듈 로드 완료');
