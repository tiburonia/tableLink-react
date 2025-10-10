
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
  },

  /**
   * 단골 매장 소식 피드 조회 (더미)
   */
  async getStorePosts(userId) {
    await new Promise(resolve => setTimeout(resolve, 250));
    
    return [
      {
        id: 1,
        storeId: 101,
        storeName: '본격 로스터리 카페',
        storeLogo: '☕',
        userLevel: 'GOLD',
        userLevelName: '골드',
        title: '플래티넘 단골 전용 10% 쿠폰 오픈!',
        content: '이번 주말 단골 손님에게만 10% 즉시할인! 금요일부터 일요일까지 사용 가능합니다.',
        postType: 'event',
        targetTag: '단골전용',
        hasImage: true,
        imageUrl: 'https://via.placeholder.com/400x200/FFD700/FFF?text=Weekend+Event',
        likes: 24,
        comments: 3,
        hasLiked: false,
        hasCoupon: true,
        couponReceived: false,
        createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000) // 2시간 전
      },
      {
        id: 2,
        storeId: 103,
        storeName: '유명한 본가',
        storeLogo: '🍜',
        userLevel: 'PLATINUM',
        userLevelName: '플래티넘',
        title: '신메뉴 출시! 프리미엄 육개장',
        content: '15년 전통 비법으로 만든 프리미엄 육개장이 출시되었습니다. 리뷰 남겨주시면 포인트 2배 적립!',
        postType: 'new_menu',
        targetTag: '신메뉴',
        hasImage: true,
        imageUrl: 'https://via.placeholder.com/400x200/FF6B6B/FFF?text=New+Menu',
        likes: 18,
        comments: 5,
        hasLiked: true,
        hasCoupon: false,
        couponReceived: false,
        createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000) // 어제
      },
      {
        id: 3,
        storeId: 102,
        storeName: '정통 양념치킨',
        storeLogo: '🍗',
        userLevel: 'SILVER',
        userLevelName: '실버',
        title: '오늘만! 치킨 1+1 이벤트',
        content: '모든 단골 고객님께 치킨 1+1 이벤트 진행합니다! 오후 2시~5시 한정',
        postType: 'promotion',
        targetTag: '이벤트중',
        hasImage: true,
        imageUrl: 'https://via.placeholder.com/400x200/4ECDC4/FFF?text=1+1+Event',
        likes: 42,
        comments: 8,
        hasLiked: false,
        hasCoupon: true,
        couponReceived: true,
        createdAt: new Date(Date.now() - 3 * 60 * 60 * 1000) // 3시간 전
      },
      {
        id: 4,
        storeId: 101,
        storeName: '본격 로스터리 카페',
        storeLogo: '☕',
        userLevel: 'GOLD',
        userLevelName: '골드',
        title: '영업시간 변경 안내',
        content: '다음주부터 평일 오전 8시부터 영업 시작합니다. 더 좋은 서비스로 찾아뵙겠습니다!',
        postType: 'notice',
        targetTag: '공지사항',
        hasImage: false,
        imageUrl: null,
        likes: 12,
        comments: 2,
        hasLiked: false,
        hasCoupon: false,
        couponReceived: false,
        createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000) // 3일 전
      }
    ];
  }
};

window.regularPageRepository = regularPageRepository;
console.log('✅ regularPageRepository 모듈 로드 완료');
