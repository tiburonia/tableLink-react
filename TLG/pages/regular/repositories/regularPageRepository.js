
/**
 * 단골매장 페이지 Repository
 * 더미 데이터 제공
 */

export const regularPageRepository = {
  /**
   * 사용자 단골매장 데이터 조회 (더미)
   */
  async getUserRegularStores(userId) {
    // 더미 데이터 시뮬레이션
    await new Promise(resolve => setTimeout(resolve, 300));
    
    return [
      {
        id: 1,
        storeId: 101,
        storeName: '본격 로스터리 카페',
        category: '카페',
        level: 'GOLD',
        levelName: '골드',
        points: 3200,
        coupons: 2,
        lastVisit: '2일 전',
        address: '서울시 강남구 테헤란로',
        distance: '0.8km',
        recentReview: '항상 친절하고 분위기 좋아요!',
        hasUnwrittenReview: false
      },
      {
        id: 2,
        storeId: 102,
        storeName: '정통 양념치킨',
        category: '치킨',
        level: 'SILVER',
        levelName: '실버',
        points: 1800,
        coupons: 1,
        lastVisit: '5일 전',
        address: '서울시 서초구 서초대로',
        distance: '1.2km',
        recentReview: '',
        hasUnwrittenReview: true
      },
      {
        id: 3,
        storeId: 103,
        storeName: '유명한 본가',
        category: '한식',
        level: 'PLATINUM',
        levelName: '플래티넘',
        points: 5600,
        coupons: 3,
        lastVisit: '1일 전',
        address: '서울시 강남구 역삼동',
        distance: '0.5km',
        recentReview: '최고의 맛집입니다!',
        hasUnwrittenReview: false
      },
      {
        id: 4,
        storeId: 104,
        storeName: '황금 순살',
        category: '치킨',
        level: 'BRONZE',
        levelName: '브론즈',
        points: 800,
        coupons: 1,
        lastVisit: '10일 전',
        address: '서울시 강남구 논현동',
        distance: '2.1km',
        recentReview: '',
        hasUnwrittenReview: false
      },
      {
        id: 5,
        storeId: 105,
        storeName: '전통 냉면집',
        category: '한식',
        level: 'GOLD',
        levelName: '골드',
        points: 2400,
        coupons: 2,
        lastVisit: '3일 전',
        address: '서울시 강남구 삼성동',
        distance: '1.5km',
        recentReview: '여름엔 역시 이집!',
        hasUnwrittenReview: true
      }
    ];
  },

  /**
   * 사용자 단골 요약 정보 조회 (더미)
   */
  async getUserRegularSummary(userId) {
    await new Promise(resolve => setTimeout(resolve, 200));
    
    return {
      totalStores: 8,
      topLevel: 'PLATINUM',
      topLevelName: '플래티넘',
      totalPoints: 24300,
      totalCoupons: 5,
      lastVisit: '2일 전',
      unwrittenReviews: 3
    };
  }
};

window.regularPageRepository = regularPageRepository;
console.log('✅ regularPageRepository 모듈 로드 완료');
