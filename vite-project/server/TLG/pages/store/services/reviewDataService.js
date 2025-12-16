
/**
 * 리뷰 데이터 서비스 - 비즈니스 로직 계층
 */
import { reviewDataRepository } from '../repositories/reviewDataRepository.js';

export const reviewDataService = {
  /**
   * 매장 리뷰 데이터 조회 및 가공
   */
  async getStoreReviewData(storeId) {
    try {
      const data = await reviewDataRepository.getStoreReviews(storeId);
      
      return {
        success: true,
        reviews: this.normalizeReviews(data.reviews || []),
        total: data.total || 0
      };
    } catch (error) {
      console.error('❌ 매장 리뷰 조회 실패:', error);
      return {
        success: false,
        reviews: [],
        total: 0,
        error: error.message
      };
    }
  },

  /**
   * 사용자 리뷰 데이터 조회 및 가공
   */
  async getUserReviewData(userId, limit = 10) {
    try {
      const data = await reviewDataRepository.getUserReviews(userId, limit);
      
      return {
        success: true,
        reviews: this.normalizeReviews(data.reviews || []),
        total: data.total || 0
      };
    } catch (error) {
      console.error('❌ 사용자 리뷰 조회 실패:', error);
      return {
        success: false,
        reviews: [],
        total: 0,
        error: error.message
      };
    }
  },

  /**
   * 리뷰 데이터 정규화
   */
  normalizeReviews(reviews) {
    return reviews.map(review => ({
      id: review.id,
      score: review.rating || review.score,
      content: review.content,
      created_at: review.created_at,
      userId: review.user_id || review.userId,
      user: review.user_name || review.user || '익명',
      date: review.created_at
    }));
  },

  /**
   * 리뷰 통계 계산
   */
  calculateStats(reviews) {
    if (!reviews || reviews.length === 0) {
      return {
        total: 0,
        average: 0.0,
        distribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 }
      };
    }

    const total = reviews.length;
    const sum = reviews.reduce((acc, review) => acc + (review.score || 0), 0);
    const average = (sum / total).toFixed(1);
    
    const distribution = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    reviews.forEach(review => {
      const score = review.score || 0;
      if (score >= 1 && score <= 5) {
        distribution[score]++;
      }
    });

    return {
      total,
      average: parseFloat(average),
      distribution
    };
  },

  /**
   * 리뷰 유효성 검사
   */
  validateReview(reviewData) {
    const errors = [];

    if (!reviewData.userId) {
      errors.push('사용자 정보가 필요합니다.');
    }

    if (!reviewData.storeId) {
      errors.push('매장 정보가 필요합니다.');
    }

    if (!reviewData.rating || reviewData.rating < 1 || reviewData.rating > 5) {
      errors.push('별점은 1~5점 사이여야 합니다.');
    }

    if (!reviewData.reviewText || reviewData.reviewText.trim().length < 5) {
      errors.push('리뷰 내용은 5자 이상이어야 합니다.');
    }

    if (reviewData.reviewText && reviewData.reviewText.length > 500) {
      errors.push('리뷰 내용은 500자를 초과할 수 없습니다.');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  },

  /**
   * 리뷰 제출
   */
  async submitReview(reviewData) {
    try {
      const validation = this.validateReview(reviewData);
      if (!validation.isValid) {
        throw new Error(validation.errors.join('\n'));
      }

      const result = await reviewDataRepository.submitReview(reviewData);
      
      return {
        success: true,
        review: result.review,
        message: result.message
      };
    } catch (error) {
      console.error('❌ 리뷰 제출 실패:', error);
      return {
        success: false,
        error: error.message
      };
    }
  },

  /**
   * 리뷰 수정
   */
  async updateReview(reviewId, updateData) {
    try {
      const result = await reviewDataRepository.updateReview(reviewId, updateData);
      
      return {
        success: true,
        review: result.review,
        message: result.message
      };
    } catch (error) {
      console.error('❌ 리뷰 수정 실패:', error);
      return {
        success: false,
        error: error.message
      };
    }
  },

  /**
   * 리뷰 삭제
   */
  async deleteReview(reviewId, userId) {
    try {
      const result = await reviewDataRepository.deleteReview(reviewId, userId);
      
      return {
        success: true,
        message: result.message,
        storeId: result.storeId
      };
    } catch (error) {
      console.error('❌ 리뷰 삭제 실패:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
};

// 전역 등록
window.reviewDataService = reviewDataService;

console.log('✅ reviewDataService 로드 완료');
