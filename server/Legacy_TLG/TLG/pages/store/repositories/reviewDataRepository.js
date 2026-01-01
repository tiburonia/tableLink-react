
/**
 * 리뷰 데이터 레포지토리 - 데이터 접근 계층
 */
export const reviewDataRepository = {
  /**
   * 매장별 전체 리뷰 조회
   */
  async getStoreReviews(storeId) {
    const response = await fetch(`/api/reviews/stores/${storeId}`);
    if (!response.ok) {
      throw new Error(`리뷰 조회 실패: ${response.status}`);
    }
    return response.json();
  },

  /**
   * 사용자별 리뷰 조회
   */
  async getUserReviews(userId, limit = 10) {
    const response = await fetch(`/api/users/${userId}/reviews?limit=${limit}`);
    if (!response.ok) {
      throw new Error(`사용자 리뷰 조회 실패: ${response.status}`);
    }
    return response.json();
  },

  /**
   * 리뷰 제출
   */
  async submitReview(reviewData) {
    const response = await fetch('/api/reviews/submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(reviewData)
    });

    const result = await response.json();
    
    if (!response.ok) {
      throw new Error(result.error || '리뷰 제출 실패');
    }
    
    return result;
  },

  /**
   * 리뷰 수정
   */
  async updateReview(reviewId, updateData) {
    const response = await fetch(`/api/reviews/${reviewId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updateData)
    });

    const result = await response.json();
    
    if (!response.ok) {
      throw new Error(result.error || '리뷰 수정 실패');
    }
    
    return result;
  },

  /**
   * 리뷰 삭제
   */
  async deleteReview(reviewId, userId) {
    const response = await fetch(`/api/reviews/${reviewId}`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId })
    });

    const result = await response.json();
    
    if (!response.ok) {
      throw new Error(result.error || '리뷰 삭제 실패');
    }
    
    return result;
  }
};

// 전역 등록
window.reviewDataRepository = reviewDataRepository;

console.log('✅ reviewDataRepository 로드 완료');
