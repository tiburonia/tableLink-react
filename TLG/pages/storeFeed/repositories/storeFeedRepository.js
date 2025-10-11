
/**
 * StoreFeed Repository
 * 데이터 접근 계층 - 더미 데이터 제공 (추후 API 연동 준비)
 */

export const storeFeedRepository = {
  /**
   * 매장 피드 데이터 조회 (더미 데이터)
   */
  async fetchStoreFeed(storeId) {
    console.log(`📊 [StoreFeedRepository] 매장 ${storeId} 피드 데이터 조회`);

    // 더미 데이터 반환
    return {
      store: {
        id: storeId,
        name: "본격 로스터리",
        logo: "/TableLink.png",
        bio: "프리미엄 로스팅 커피 전문점 ☕",
        followers: 234,
        isFollowing: false
      },
      posts: [
        {
          id: 1,
          author: "본격 로스터리",
          avatar: "/TableLink.png",
          image: "/TableLink.png",
          caption: "오늘의 신선한 원두가 입고되었습니다! 에티오피아 예가체프 ☕",
          date: "1일 전",
          likes: 87,
          type: "story",
          isLiked: false
        },
        {
          id: 2,
          author: "본격 로스터리",
          avatar: "/TableLink.png",
          image: "/TableLink.png",
          caption: "단골 고객님 한정 아메리카노 1+1 이벤트 진행중! 🎁",
          date: "2일 전",
          likes: 156,
          type: "promotion",
          isLiked: false
        },
        {
          id: 3,
          author: "본격 로스터리",
          avatar: "/TableLink.png",
          image: null,
          caption: "12월 15일(일)은 매장 정기 휴무일입니다. 이용에 참고 부탁드립니다 🙏",
          date: "5일 전",
          likes: 42,
          type: "notice",
          isLiked: false
        },
        {
          id: 4,
          author: "본격 로스터리",
          avatar: "/TableLink.png",
          image: "/TableLink.png",
          caption: "신메뉴 시그니처 라떼 출시! 부드러운 우유 거품과 진한 에스프레소의 조화 🥛",
          date: "1주일 전",
          likes: 203,
          type: "story",
          isLiked: false
        }
      ]
    };
  }
};
