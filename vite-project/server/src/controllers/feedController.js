
const feedService = require('../services/feedService');

/**
 * 피드 컨트롤러 - HTTP 요청/응답 처리
 */
class FeedController {
  /**
   * 개인화된 피드 조회
   */
  async getPersonalizedFeed(req, res, next) {
    try {
      const { userId } = req.params;
      const { type } = req.query;

      console.log('📰 개인화 피드 요청:', { userId, type });

      if (!userId) {
        return res.status(400).json({
          success: false,
          error: '사용자 ID가 필요합니다'
        });
      }

      const userPk = parseInt(userId, 10);
      if (isNaN(userPk) || userPk <= 0) {
        return res.status(400).json({
          success: false,
          error: '유효하지 않은 사용자 ID입니다'
        });
      }

      // type이 'following'인 경우 팔로잉 매장 피드 조회
      if (type === 'following') {
        const feedData = await feedService.getFollowingFeed(userPk);

        return res.json({
          success: true,
          recentVisited: feedData.recentVisited,
          posts: feedData.posts
        });
      }

      // 다른 타입은 향후 구현
      res.status(400).json({
        success: false,
        error: '지원하지 않는 피드 타입입니다'
      });

    } catch (error) {
      console.error('❌ getPersonalizedFeed 컨트롤러 에러:', error);
      next(error);
    }
  }
}

module.exports = new FeedController();
