
/**
 * 리뷰 레포지토리 - 데이터 접근 계층
 */
export const reviewRepository = {
  /**
   * 리뷰 제출
   */
  async submitReview(reviewData) {
    // 백엔드 API 스펙에 맞는 필드만 전송
    const requestBody = {
      userId: reviewData.userId,
      storeId: reviewData.storeId,
      orderId: reviewData.orderId,
      rating: reviewData.rating,
      reviewText: reviewData.reviewText
    };

    console.log('📤 리뷰 제출 요청:', requestBody);

    const response = await fetch('/api/reviews/submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || '리뷰 등록 실패');
    }

    return response.json();
  },

  /**
   * 주문 정보 조회
   */
  async getOrderInfo(orderId) {
    const response = await fetch(`/api/orders/${orderId}`);
    
    if (!response.ok) {
      throw new Error('주문 정보 조회 실패');
    }

    return response.json();
  }
};

// 전역 등록
window.reviewRepository = reviewRepository;
