
/**
 * Order Repository
 * 주문 데이터 계층 - API 호출 담당
 */

export const orderRepository = {
  /**
   * 사용자의 전체 주문 내역 조회
   * @param {number} userId - users.id (PK)
   * @param {number} limit - 조회 제한 개수
   */
  async getUserOrders(userId, limit = 100) {
    try {
      console.log('📡 주문 내역 API 호출:', { userId, limit });

      if (!userId) {
        throw new Error('userId가 필요합니다');
      }

      const response = await fetch(`/api/users/${userId}/orders?limit=${limit}`);

      console.log('📡 API 응답 상태:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ API 응답 에러:', errorText);
        throw new Error(`주문 내역 조회 실패 (${response.status}): ${errorText}`);
      }

      const data = await response.json();
      console.log('✅ 주문 데이터 수신:', data);
      
      return data.orders || [];
    } catch (error) {
      console.error('❌ getUserOrders 실패:', error);
      throw error;
    }
  }
};
