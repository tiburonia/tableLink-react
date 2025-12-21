/**
 * StoreFeed Repository
 * 데이터 접근 계층 - API 연동
 */

export const storeFeedRepository = {
  /**
   * 매장 피드 데이터 조회 (API 호출)
   */
  async fetchStoreFeed(storeId) {
    console.log(`📊 [StoreFeedRepository] 매장 ${storeId} 피드 데이터 조회 (API)`);

    try {
      const response = await fetch(`/api/store-feeds/${storeId}?limit=20&offset=0`);

      if (!response.ok) {
        throw new Error(`API 요청 실패: ${response.status}`);
      }

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.message || '피드 데이터를 불러올 수 없습니다');
      }

      console.log(`✅ [StoreFeedRepository] 피드 데이터 로드 완료: ${data.posts.length}개 게시물`);

      return {
        store: data.store,
        posts: data.posts
      };

    } catch (error) {
      console.error('❌ [StoreFeedRepository] API 호출 실패:', error);

      // 폴백: 에러 발생 시 빈 데이터 반환
      return {
        store: {
          id: storeId,
          name: "매장 정보 없음",
          logo: "/TableLink.png",
          bio: "피드를 불러올 수 없습니다",
          followers: 0,
          isFollowing: false
        },
        posts: []
      };
    }
  }
};