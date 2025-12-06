/**
 * Payment Repository - 데이터 접근 레이어
 * API 호출 및 데이터 CRUD만 담당
 */

export const paymentRepository = {
  /**
   * 매장별 포인트 조회
   */
  async fetchStorePoints(userId, storeId) {
    const response = await fetch(`/api/regular-levels/user/${userId}/store/${storeId}/points`);
    
    if (!response.ok) {
      throw new Error(`포인트 조회 실패: HTTP ${response.status}`);
    }
    
    const data = await response.json();
    return data;
  },

  /**
   * 사용자 쿠폰 조회
   */
  async fetchUserCoupons(userId) {
    const response = await fetch(`/api/auth/user/${userId}`);
    
    if (!response.ok) {
      throw new Error(`쿠폰 조회 실패: HTTP ${response.status}`);
    }
    
    const data = await response.json();
    return data;
  },

  /**
   * 결제 준비 요청 (Toss Payments)
   */
  async preparePayment(prepareData) {
    const response = await fetch('/api/toss/prepare', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(prepareData)
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || '결제 준비 실패');
    }

    const result = await response.json();
    return result;
  },

  /**
   * Toss Payments 클라이언트 키 조회
   */
  async fetchTossClientKey() {
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
    return data.clientKey;
  }
};

console.log('✅ paymentRepository 모듈 로드 완료');
