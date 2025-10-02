
/**
 * 리뷰 서비스 - 비즈니스 로직
 */

import { reviewRepository } from '../repositories/reviewRepository.js';

export const reviewService = {
  /**
   * 리뷰 데이터 검증
   */
  validateReviewData(rating, content) {
    const errors = [];

    if (!rating || rating < 1 || rating > 5) {
      errors.push('평점을 1~5점 사이로 선택해주세요.');
    }

    if (!content || content.trim().length < 10) {
      errors.push('리뷰는 최소 10자 이상 입력해주세요.');
    }

    if (content && content.length > 500) {
      errors.push('리뷰는 최대 500자까지 입력 가능합니다.');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  },

  /**
   * 리뷰 제출 데이터 준비
   */
  prepareReviewData(order, rating, content, userId) {
    // 백엔드 API 스펙에 맞는 5개 필드만 반환
    return {
      userId: userId || window.userInfo?.id || 'user1',
      storeId: order.store_id,
      orderId: order.id,
      rating: rating,
      reviewText: content
    };
  },

  /**
   * 리뷰 제출
   */
  async submitReview(reviewData) {
    try {
      console.log('📝 리뷰 제출 시작:', reviewData);
      
      const result = await reviewRepository.submitReview(reviewData);
      
      console.log('✅ 리뷰 제출 성공:', result);
      return {
        success: true,
        data: result
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
   * 주문 정보 포맷팅
   */
  formatOrderInfo(order) {
    const orderData = order.order_data || {};
    const items = orderData.items ? 
      orderData.items.map(i => `${i.name}(${i.qty}개)`).join(', ') : 
      '메뉴 정보 없음';
    const storeName = orderData.store || order.store_name || '매장 정보 없음';
    const orderDate = new Date(order.order_date).toLocaleDateString();

    return {
      items,
      storeName,
      orderDate,
      totalAmount: (order.final_amount || order.total_amount || 0).toLocaleString() + '원'
    };
  }
};

// 전역 등록 (호환성)
window.reviewService = reviewService;

console.log('✅ reviewService 모듈 로드 완료');
