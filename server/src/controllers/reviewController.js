
const reviewService = require('../services/reviewService');

/**
 * 리뷰 컨트롤러 - HTTP 요청/응답 처리
 */
class ReviewController {
  /**
   * 매장별 전체 리뷰 조회
   */
  async getStoreReviews(req, res, next) {
    try {
      const { storeId } = req.params;
      const { page = 1, limit = 50 } = req.query;

      console.log(`📖 GET /api/reviews/stores/${storeId} 요청 (page: ${page}, limit: ${limit})`);

      const result = await reviewService.getStoreReviews(
        parseInt(storeId),
        parseInt(page),
        parseInt(limit)
      );

      res.json({
        success: true,
        reviews: result.reviews,
        total: result.total,
        page: result.page,
        limit: result.limit
      });
    } catch (error) {
      console.error('❌ 전체 리뷰 조회 실패:', error);
      next(error);
    }
  }

  /**
   * 사용자별 리뷰 조회
   */
  async getUserReviews(req, res, next) {
    try {
      const { userId } = req.params;
      const { limit = 10 } = req.query;

      console.log(`📝 사용자 ${userId} 리뷰 조회`);

      const result = await reviewService.getUserReviews(userId, parseInt(limit));

      res.json({
        success: true,
        reviews: result.reviews,
        total: result.total
      });
    } catch (error) {
      console.error('❌ 사용자 리뷰 조회 실패:', error);
      next(error);
    }
  }

  /**
   * 리뷰 제출 (storeController에서 이관)
   */
  async submitReview(req, res, next) {
    try {
      const { userId, storeId, orderId, rating, reviewText } = req.body;

      console.log('📝 리뷰 제출 요청:', { userId, storeId, orderId, rating });

      const review = await reviewService.submitReview({
        userId,
        storeId,
        orderId,
        rating,
        reviewText
      });

      res.json({
        success: true,
        message: '리뷰가 등록되었습니다',
        review: review
      });
    } catch (error) {
      console.error('❌ 리뷰 제출 실패:', error);
      // 중복 리뷰 에러는 400으로 응답
      if (error.message.includes('이미')) {
        return res.status(400).json({
          success: false,
          message: error.message
        });
      }
      next(error);
    }
  }

  /**
   * 주문에 대한 리뷰 작성 가능 여부 검증
   */
  async checkReviewEligibility(req, res, next) {
    try {
      const { orderId } = req.params;

      console.log(`🔍 리뷰 작성 가능 여부 확인: 주문 ${orderId}`);

      const result = await reviewService.checkReviewEligibility(parseInt(orderId));

      res.json({
        success: true,
        canReview: result.canReview,
        message: result.message
      });
    } catch (error) {
      console.error('❌ 리뷰 작성 가능 여부 확인 실패:', error);
      next(error);
    }
  }
}

module.exports = new ReviewController();
