
/**
 * Guest Payment Repository - 비회원 결제 API 통신 레이어
 */

export const guestPaymentRepository = {
  /**
   * 비회원 TLL 결제 준비 API 호출
   */
  async prepareGuestPayment(prepareData) {
    try {
      console.log('📤 비회원 결제 준비 API 호출:', prepareData);

      const response = await fetch('/api/toss/prepare-guest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(prepareData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || '결제 준비 실패');
      }

      const result = await response.json();
      console.log('✅ 비회원 결제 준비 성공:', result);

      return result;
    } catch (error) {
      console.error('❌ 비회원 결제 준비 API 실패:', error);
      throw error;
    }
  },

  /**
   * 비회원 TLL 결제 승인 API 호출
   */
  async confirmGuestPayment(confirmData) {
    try {
      console.log('📤 비회원 결제 승인 API 호출:', confirmData);

      const response = await fetch('/api/toss/confirm-guest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(confirmData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || '결제 승인 실패');
      }

      const result = await response.json();
      console.log('✅ 비회원 결제 승인 성공:', result);

      return result;
    } catch (error) {
      console.error('❌ 비회원 결제 승인 API 실패:', error);
      throw error;
    }
  },

  /**
   * 토스 클라이언트 키 조회
   */
  async fetchTossClientKey() {
    try {
      const response = await fetch('/api/toss/client-key');
      
      if (!response.ok) {
        throw new Error('클라이언트 키 조회 실패');
      }

      const result = await response.json();
      return result.clientKey;
    } catch (error) {
      console.error('❌ 토스 클라이언트 키 조회 실패:', error);
      throw error;
    }
  }
};

console.log('✅ guestPaymentRepository 모듈 로드 완료');
