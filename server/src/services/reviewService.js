
const reviewRepository = require('../repositories/reviewRepository');

/**
 * 리뷰 서비스 - 비즈니스 로직 처리
 */
class ReviewService {
  /**
   * 매장별 전체 리뷰 조회
   */
  async getStoreReviews(storeId, page = 1, limit = 50) {
    // ID 유효성 검사
    if (isNaN(storeId) || storeId <= 0) {
      throw new Error('유효하지 않은 매장 ID입니다');
    }

    if (page < 1) page = 1;
    if (limit < 1 || limit > 100) limit = 50;

    const offset = (page - 1) * limit;

    console.log(`📖 매장 ${storeId} 전체 리뷰 조회 (page: ${page}, limit: ${limit})`);

    const reviews = await reviewRepository.getStoreReviews(storeId, limit, offset);

    console.log(`✅ 매장 ${storeId} 전체 리뷰 ${reviews.length}개 조회 완료`);

    return {
      reviews,
      total: reviews.length,
      page,
      limit
    };
  }

  /**
   * 사용자별 리뷰 조회
   */
  async getUserReviews(userId, limit = 10) {
    // userId 유효성 검사
    if (!userId || userId.trim().length === 0) {
      throw new Error('유효하지 않은 사용자 ID입니다');
    }

    if (limit < 1 || limit > 100) limit = 10;

    console.log(`📝 사용자 ${userId} 리뷰 조회 (limit: ${limit})`);

    try {
      const reviews = await reviewRepository.getUserReviews(userId, limit);
      const total = await reviewRepository.getUserReviewCount(userId);

      console.log(`✅ 사용자 ${userId} 리뷰 ${reviews.length}개 조회 완료`);

      return {
        reviews,
        total
      };
    } catch (error) {
      // 테이블이 존재하지 않는 경우 빈 배열 반환
      if (error.code === '42P01' || error.message.includes('does not exist')) {
        console.log('⚠️ 리뷰 테이블이 존재하지 않음 - 빈 결과 반환');
        return {
          reviews: [],
          total: 0
        };
      }
      throw error;
    }
  }

  /**
   * 리뷰 제출
   */
  async submitReview(reviewData) {
    // 데이터 유효성 검증
    if (!reviewData.userId || !reviewData.storeId || !reviewData.orderId) {
      throw new Error('필수 정보가 누락되었습니다');
    }

    if (!reviewData.rating || reviewData.rating < 1 || reviewData.rating > 5) {
      throw new Error('평점은 1~5점 사이여야 합니다');
    }

    if (!reviewData.reviewText || reviewData.reviewText.trim().length < 10) {
      throw new Error('리뷰는 최소 10자 이상이어야 합니다');
    }

    // orders 테이블의 is_reviewed 컬럼으로 중복 검증
    const isReviewed = await reviewRepository.checkOrderIsReviewed(reviewData.orderId);
    if (isReviewed) {
      throw new Error('이미 해당 주문에 대한 리뷰를 작성하셨습니다');
    }

    console.log(`📝 리뷰 제출: 주문 ${reviewData.orderId}, 평점 ${reviewData.rating}`);

    // 리뷰 제출
    const review = await reviewRepository.createReview({
      userId: reviewData.userId,
      storeId: reviewData.storeId,
      orderId: reviewData.orderId,
      rating: reviewData.rating,
      reviewText: reviewData.reviewText.trim()
    });

    // orders 테이블의 is_reviewed를 true로 업데이트
    await reviewRepository.updateOrderIsReviewed(reviewData.orderId, true);

    console.log(`✅ 리뷰 제출 완료: ID ${review.id}`);

    return review;
  }

  /**
   * 주문에 대한 리뷰 작성 가능 여부 검증
   */
  async checkReviewEligibility(orderId) {
    if (!orderId || orderId <= 0) {
      throw new Error('유효하지 않은 주문 ID입니다');
    }

    const isReviewed = await reviewRepository.checkOrderIsReviewed(orderId);

    return {
      canReview: !isReviewed,
      message: isReviewed ? '이미 리뷰가 작성된 주문입니다' : '리뷰 작성이 가능합니다'
    };
  }
}

module.exports = new ReviewService();
