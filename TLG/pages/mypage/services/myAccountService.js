
/**
 * Service Layer: 비즈니스 로직 전담
 * 데이터 변환, 계산, 검증 등
 */

export const myAccountService = {
  // VIP 레벨 계산
  calculateVipLevel(point) {
    if (point >= 100000) return 'PLATINUM';
    if (point >= 50000) return 'GOLD';
    if (point >= 20000) return 'SILVER';
    return 'BRONZE';
  },

  // 업적 생성
  generateAchievements(orderCount, reviewCount, point) {
    const achievements = [];

    if (orderCount >= 1) {
      achievements.push({ name: '첫 주문 달성', icon: '🎉', date: '달성' });
    }
    if (orderCount >= 10) {
      achievements.push({ name: '10회 주문 달성', icon: '🏆', date: '달성' });
    }
    if (reviewCount >= 5) {
      achievements.push({ name: '리뷰왕', icon: '⭐', date: '달성' });
    }
    if (point >= 50000) {
      achievements.push({ name: 'VIP 등급 달성', icon: '👑', date: '달성' });
    }

    return achievements;
  },

  // 주문 데이터 변환
  async convertOrder(order, repository) {
    try {
      // 매장 이름 우선순위: order_data.storeName > store_name > API 조회
      let storeName = order.store_name || '알 수 없는 매장';

      if (order.order_data?.storeName) {
        storeName = order.order_data.storeName;
      } else if (!order.store_name && order.store_id && repository) {
        const storeData = await repository.fetchStoreInfo(order.store_id);
        storeName = storeData?.name || `매장 ${order.store_id}`;
      }

      // 주문 항목 파싱
      let items = [];
      try {
        if (order.order_data?.items) {
          items = order.order_data.items;
        } else if (order.items) {
          items = typeof order.items === 'string' ? JSON.parse(order.items) : order.items;
        }
      } catch (e) {
        console.warn('주문 항목 파싱 실패:', order.id, e);
        items = [];
      }

      const rawDate = new Date(order.order_date || order.created_at);
      
      return {
        id: order.id,
        store: storeName,
        items: items.map(item => ({
          name: item.name || item.menu_name || '메뉴',
          qty: item.qty || item.quantity || 1,
          price: item.price || 0
        })),
        total: order.total_amount || order.final_amount || 0,
        date: rawDate.toLocaleDateString('ko-KR'),
        rawDate: rawDate,
        status: order.order_status || '완료',
        reviewId: order.has_review ? order.id : null
      };
    } catch (error) {
      console.error('❌ 주문 데이터 변환 실패:', order.id, error);
      const fallbackDate = new Date();
      return {
        id: order.id || 'unknown',
        store: order.store_name || '알 수 없는 매장',
        items: [],
        total: order.total_amount || 0,
        date: fallbackDate.toLocaleDateString('ko-KR'),
        rawDate: fallbackDate,
        status: '완료',
        reviewId: null
      };
    }
  },

  // 리뷰 데이터 변환
  convertReview(review) {
    return {
      id: review.id,
      store: review.store_name || `매장 ${review.store_id}`,
      rating: review.score || review.rating || 0,
      content: review.content || review.review_text || '',
      date: new Date(review.created_at).toLocaleDateString('ko-KR')
    };
  },

  // 월간 통계 계산
  calculateMonthlyStats(orders) {
    const today = new Date();
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();

    const thisMonthOrders = orders.filter(order => {
      const orderDate = order.rawDate || new Date(order.date);
      return orderDate.getMonth() === currentMonth && orderDate.getFullYear() === currentYear;
    });

    const monthlySpent = thisMonthOrders.reduce((sum, order) => sum + order.total, 0);

    return {
      currentMonth: {
        orders: thisMonthOrders.length,
        spent: monthlySpent,
        savedMoney: Math.floor(monthlySpent * 0.1)
      },
      lastMonth: {
        orders: 0,
        spent: 0,
        savedMoney: 0
      }
    };
  },

  // 데이터 파싱 헬퍼
  safeJsonParse(value, fallback) {
    try {
      if (!value) return fallback;
      return typeof value === 'string' ? JSON.parse(value) : value;
    } catch (e) {
      console.warn('JSON 파싱 실패:', e);
      return fallback;
    }
  },

  // 실제 API 데이터를 UI 표시 형식으로 변환
  async convertToDisplayFormat(userInfo, ordersData, reviewsData, repository) {
    // 주문 데이터 변환
    const convertedOrders = await Promise.all(
      ordersData.map(order => this.convertOrder(order, repository))
    );
    const validOrders = convertedOrders.filter(order => order !== null);

    // 리뷰 데이터 변환
    const convertedReviews = reviewsData.map(review => this.convertReview(review));

    // 추가 데이터 파싱
    const reservationList = this.safeJsonParse(userInfo.reservation_list, []);
    const coupons = this.safeJsonParse(userInfo.coupons, { unused: [], used: [] });
    const favoriteStores = this.safeJsonParse(userInfo.favorite_stores, []);

    // 월간 통계 계산
    const monthlyStats = this.calculateMonthlyStats(validOrders);

    // 최종 ViewModel 구성
    return {
      id: userInfo.id,
      name: userInfo.name || '사용자',
      phone: userInfo.phone || '정보 없음',
      email: `${userInfo.id}@tablelink.com`,
      address: '정보 없음',
      birth: '정보 없음',
      gender: '정보 없음',
      point: userInfo.point || 0,
      vipLevel: this.calculateVipLevel(userInfo.point || 0),
      joinDate: new Date(userInfo.created_at).toLocaleDateString('ko-KR'),
      totalOrders: validOrders.length,
      totalSpent: validOrders.reduce((sum, order) => sum + order.total, 0),
      profileImage: `https://ui-avatars.com/api/?name=${encodeURIComponent(userInfo.name || userInfo.id)}&background=297efc&color=fff&size=128`,
      orderList: validOrders,
      reservationList,
      coupons,
      favoriteStores,
      achievements: this.generateAchievements(validOrders.length, convertedReviews.length, userInfo.point),
      monthlyStats,
      regularLevels: userInfo.regularLevels || []
    };
  },

  // 더미 데이터 생성 (폴백용)
  generateDummyData(userId) {
    return {
      id: userId,
      name: '김테이블',
      phone: '010-1234-5678',
      email: 'tablelink@gmail.com',
      address: '서울특별시 강남구 테헤란로 123',
      birth: '1990.05.15',
      gender: '남성',
      point: 25600,
      vipLevel: 'GOLD',
      joinDate: '2023.03.15',
      totalOrders: 47,
      totalSpent: 892000,
      profileImage: 'https://ui-avatars.com/api/?name=김테이블&background=297efc&color=fff&size=128',
      orderList: [
        {
          id: 1,
          store: '스타벅스 강남점',
          items: [
            { name: '아메리카노', qty: 2, price: 4500 },
            { name: '카라멜마키아또', qty: 1, price: 6500 }
          ],
          total: 15500,
          date: '2024.01.25',
          status: '완료',
          reviewId: 1
        }
      ],
      reservationList: [],
      coupons: { unused: [], used: [] },
      favoriteStores: ['스타벅스 강남점'],
      achievements: [
        { name: '첫 주문 달성', icon: '🎉', date: '2023.03.15' },
        { name: 'VIP 등급 달성', icon: '👑', date: '2023.12.01' }
      ],
      monthlyStats: {
        currentMonth: { orders: 8, spent: 127500, savedMoney: 15200 },
        lastMonth: { orders: 12, spent: 189300, savedMoney: 22100 }
      },
      regularLevels: []
    };
  },

  // 메인 빌드 함수: Repository를 사용해 ViewModel 생성
  async buildAccountViewModel(userId, repository) {
    try {
      const { userInfo, orders, reviews } = await repository.fetchAllAccountData(userId);
      return await this.convertToDisplayFormat(userInfo, orders, reviews, repository);
    } catch (error) {
      console.error('❌ ViewModel 생성 실패, 더미 데이터 반환:', error);
      return this.generateDummyData(userId);
    }
  }
};

export default myAccountService;
