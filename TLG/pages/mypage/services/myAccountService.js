/**
 * Service Layer: 비즈니스 로직 처리
 */

export const myAccountService = {
  /**
   * ViewModel 생성
   */
  async createViewModel(userId) {
    try {
      const { myAccountRepository } = await import('../repositories/myAccountRepository.js');

      // 병렬로 데이터 조회
      const [userInfo, orders, reviews] = await Promise.all([
        myAccountRepository.getUserInfo(userId),
        myAccountRepository.getOrders(userId, 3),
        myAccountRepository.getReviews(userId)
      ]);

      // ViewModel 변환
      return this.convertToViewModel(userInfo, orders, reviews);
    } catch (error) {
      console.error('❌ createViewModel 실패:', error);
      // 폴백 데이터
      return this.generateFallbackData(userId);
    }
  },

  /**
   * API 데이터를 ViewModel로 변환
   */
  convertToViewModel(userInfo, orders, reviews) {
    const vipLevel = this.calculateVipLevel(userInfo.point || 0);
    const totalSpent = orders.reduce((sum, order) => sum + (order.total_amount || 0), 0);

    return {
      id: userInfo.id,
      name: userInfo.name || '사용자',
      phone: userInfo.phone || '정보 없음',
      email: `${userInfo.id}@tablelink.com`,
      point: userInfo.point || 0,
      vipLevel,
      joinDate: new Date(userInfo.created_at).toLocaleDateString('ko-KR'),
      totalOrders: orders.length,
      totalSpent,
      profileImage: `https://ui-avatars.com/api/?name=${encodeURIComponent(userInfo.name || userInfo.id)}&background=297efc&color=fff&size=128`,
      orderList: this.convertOrders(orders),
      regularLevels: userInfo.regularLevels || [],
      monthlyStats: this.calculateMonthlyStats(orders)
    };
  },

  /**
   * 주문 데이터 변환
   */
  convertOrders(orders) {
    return orders.map(order => ({
      id: order.id,
      store: order.store_name || '알 수 없는 매장',
      items: this.parseItems(order),
      total: order.total_amount || 0,
      date: new Date(order.order_date || order.created_at).toLocaleDateString('ko-KR'),
      status: order.order_status || '완료'
    }));
  },

  /**
   * 주문 항목 파싱
   */
  parseItems(order) {
    try {
      if (order.order_data?.items) return order.order_data.items;
      if (order.items) {
        return typeof order.items === 'string' ? JSON.parse(order.items) : order.items;
      }
      return [];
    } catch (e) {
      console.warn('주문 항목 파싱 실패:', order.id);
      return [];
    }
  },

  /**
   * VIP 레벨 계산
   */
  calculateVipLevel(point) {
    if (point >= 100000) return 'PLATINUM';
    if (point >= 50000) return 'GOLD';
    if (point >= 20000) return 'SILVER';
    return 'BRONZE';
  },

  /**
   * 월간 통계 계산
   */
  calculateMonthlyStats(orders) {
    const today = new Date();
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();

    const thisMonthOrders = orders.filter(order => {
      const orderDate = new Date(order.order_date || order.created_at);
      return orderDate.getMonth() === currentMonth && orderDate.getFullYear() === currentYear;
    });

    const monthlySpent = thisMonthOrders.reduce((sum, order) => sum + (order.total_amount || 0), 0);

    return {
      currentMonth: {
        orders: thisMonthOrders.length,
        spent: monthlySpent,
        savedMoney: Math.floor(monthlySpent * 0.1)
      }
    };
  },

  /**
   * 폴백 데이터 생성
   */
  generateFallbackData(userId) {
    return {
      id: userId,
      name: '사용자',
      phone: '정보 없음',
      email: `${userId}@tablelink.com`,
      point: 0,
      vipLevel: 'BRONZE',
      joinDate: new Date().toLocaleDateString('ko-KR'),
      totalOrders: 0,
      totalSpent: 0,
      profileImage: `https://ui-avatars.com/api/?name=User&background=297efc&color=fff&size=128`,
      orderList: [],
      regularLevels: [],
      monthlyStats: {
        currentMonth: { orders: 0, spent: 0, savedMoney: 0 }
      }
    };
  }
};

export default myAccountService;