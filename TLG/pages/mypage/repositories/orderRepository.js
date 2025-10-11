
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
      const response = await fetch(`/api/orders/users/${userId}?limit=${limit}`);

      if (!response.ok) {
        throw new Error('주문 내역 조회 실패');
      }

      const data = await response.json();
      return data.orders || [];
    } catch (error) {
      console.error('❌ getUserOrders 실패:', error);
      throw error;
    }
  }
};
