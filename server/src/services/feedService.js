
const feedRepository = require('../repositories/feedRepository');

/**
 * 피드 서비스 - 비즈니스 로직
 */
class FeedService {
  /**
   * 팔로잉 매장 피드 데이터 조회
   */
  async getFollowingFeed(userId) {
    try {
      console.log('📖 팔로잉 매장 피드 데이터 조회 (userId):', userId);

      // 병렬로 데이터 조회
      const [recentVisited, posts] = await Promise.all([
        feedRepository.getFollowingRecentVisits(userId),
        feedRepository.getFollowingPosts(userId)
      ]);

      console.log(`✅ 팔로잉 매장 피드 조회 완료: 최근 방문 ${recentVisited.length}개, 포스트 ${posts.length}개`);

      return {
        recentVisited,
        posts
      };
    } catch (error) {
      console.error('❌ getFollowingFeed 실패:', error);
      throw error;
    }
  }
}

module.exports = new FeedService();
