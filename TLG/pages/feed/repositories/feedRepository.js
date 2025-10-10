
/**
 * 단골 소식 피드 Repository
 * 더미 데이터 제공
 */

export const feedRepository = {
  /**
   * 전체 피드 데이터 가져오기
   */
  async getAllPosts(userId, filter = 'all') {
    // 더미 데이터 - 실제로는 API 호출
    const allPosts = [
      {
        id: 1,
        storeId: 386,
        storeName: '본격 로스터리카페',
        storeLogo: '☕',
        category: '카페',
        postType: 'event',
        targetTag: '[단골전용]',
        title: '플래티넘 단골 전용 10% 쿠폰 오픈!',
        content: '이번 주말 한정으로 단골 손님에게만 10% 즉시할인 쿠폰을 드립니다! 놓치지 마세요!',
        hasImage: true,
        imageUrl: 'TableLink.png',
        userLevel: 'PLATINUM',
        userLevelName: '플래티넘',
        createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        likes: 28,
        comments: 5,
        hasLiked: false,
        hasCoupon: true,
        couponReceived: false,
        couponId: 101
      },
      {
        id: 2,
        storeId: 497,
        storeName: '정통 양념치킨',
        storeLogo: '🍗',
        category: '치킨',
        postType: 'new_menu',
        targetTag: '[신메뉴]',
        title: '매콤달콤 신메뉴 출시!',
        content: '새로운 매콤달콤 치킨이 나왔어요! 단골 고객님께 먼저 소개합니다 😋',
        hasImage: true,
        imageUrl: 'TableLink.png',
        userLevel: 'GOLD',
        userLevelName: '골드',
        createdAt: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
        likes: 42,
        comments: 12,
        hasLiked: true,
        hasCoupon: false,
        couponReceived: false
      },
      {
        id: 3,
        storeId: 173,
        storeName: '유명한 본가',
        storeLogo: '🍜',
        category: '한식',
        postType: 'promotion',
        targetTag: '[프로모션]',
        title: '단골님 감사 이벤트',
        content: '단골 고객님들의 성원에 보답하고자 특별 이벤트를 준비했습니다!',
        hasImage: false,
        imageUrl: '',
        userLevel: 'SILVER',
        userLevelName: '실버',
        createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
        likes: 15,
        comments: 3,
        hasLiked: false,
        hasCoupon: true,
        couponReceived: true,
        couponId: 102
      },
      {
        id: 4,
        storeId: 131,
        storeName: '황금 순살치킨',
        storeLogo: '🍗',
        category: '치킨',
        postType: 'notice',
        targetTag: '[공지]',
        title: '영업시간 변경 안내',
        content: '다음 주부터 영업시간이 변경됩니다. 참고 부탁드립니다!',
        hasImage: false,
        imageUrl: '',
        userLevel: 'BRONZE',
        userLevelName: '브론즈',
        createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        likes: 8,
        comments: 1,
        hasLiked: false,
        hasCoupon: false,
        couponReceived: false
      },
      {
        id: 5,
        storeId: 241,
        storeName: '전통 냉면집',
        storeLogo: '🍜',
        category: '한식',
        postType: 'event',
        targetTag: '[이벤트]',
        title: '여름맞이 시원한 냉면 특가!',
        content: '무더운 여름, 시원한 냉면 드시고 더위 이겨내세요!',
        hasImage: true,
        imageUrl: 'TableLink.png',
        userLevel: 'GOLD',
        userLevelName: '골드',
        createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
        likes: 35,
        comments: 8,
        hasLiked: true,
        hasCoupon: true,
        couponReceived: false,
        couponId: 103
      },
      {
        id: 6,
        storeId: 386,
        storeName: '본격 로스터리카페',
        storeLogo: '☕',
        category: '카페',
        postType: 'new_menu',
        targetTag: '[신메뉴]',
        title: '가을 시즌 한정 메뉴 출시',
        content: '가을의 정취를 담은 특별한 음료가 준비되었습니다!',
        hasImage: true,
        imageUrl: 'TableLink.png',
        userLevel: 'PLATINUM',
        userLevelName: '플래티넘',
        createdAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
        likes: 52,
        comments: 15,
        hasLiked: false,
        hasCoupon: true,
        couponReceived: false,
        couponId: 104
      },
      {
        id: 7,
        storeId: 497,
        storeName: '정통 양념치킨',
        storeLogo: '🍗',
        category: '치킨',
        postType: 'event',
        targetTag: '[이벤트]',
        title: '리뷰 작성하면 콜라 서비스!',
        content: '주문 후 리뷰를 남겨주시면 콜라 1.25L를 무료로 드립니다!',
        hasImage: false,
        imageUrl: '',
        userLevel: 'GOLD',
        userLevelName: '골드',
        createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
        likes: 19,
        comments: 4,
        hasLiked: false,
        hasCoupon: false,
        couponReceived: false
      },
      {
        id: 8,
        storeId: 173,
        storeName: '유명한 본가',
        storeLogo: '🍜',
        category: '한식',
        postType: 'promotion',
        targetTag: '[프로모션]',
        title: '점심시간 특별 할인',
        content: '오전 11시~오후 2시 점심시간 특별 할인 진행중입니다!',
        hasImage: true,
        imageUrl: 'TableLink.png',
        userLevel: 'SILVER',
        userLevelName: '실버',
        createdAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString(),
        likes: 27,
        comments: 6,
        hasLiked: true,
        hasCoupon: true,
        couponReceived: false,
        couponId: 105
      }
    ];

    // 필터 적용
    let filteredPosts = allPosts;
    
    if (filter === 'fav') {
      // 단골 매장만 필터링 (실제로는 사용자의 단골 매장 ID로 필터)
      const regularStoreIds = [386, 497, 173]; // 더미 단골 매장 ID
      filteredPosts = allPosts.filter(post => regularStoreIds.includes(post.storeId));
    } else if (filter === 'event') {
      filteredPosts = allPosts.filter(post => post.postType === 'event' || post.postType === 'promotion');
    } else if (filter === 'menu') {
      filteredPosts = allPosts.filter(post => post.postType === 'new_menu');
    }

    return filteredPosts;
  },

  /**
   * 특정 게시물 상세 조회
   */
  async getPostById(postId) {
    const posts = await this.getAllPosts(null, 'all');
    return posts.find(post => post.id === postId);
  }
};

window.feedRepository = feedRepository;
console.log('✅ feedRepository 모듈 로드 완료');
