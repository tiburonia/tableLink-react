
/**
 * 리뷰 프리뷰 컨트롤러 - 이벤트 처리 및 흐름 제어
 */
import { reviewDataService } from '../services/reviewDataService.js';
import { reviewPreviewView } from '../views/reviewPreviewView.js';

export const reviewPreviewController = {
  /**
   * 매장 리뷰 미리보기 렌더링
   */
  async renderTopReviews(store) {
    try {
      console.log(`🔍 매장 ${store.id} 리뷰 미리보기 로딩 중...`);
      
      // store 객체에서 reviews 배열 추출
      const allReviews = store.reviews || [];
      
      // 랜덤으로 2개 선택
      let reviews = [];
      if (allReviews.length <= 2) {
        reviews = allReviews;
      } else {
        const shuffled = [...allReviews].sort(() => 0.5 - Math.random());
        reviews = shuffled.slice(0, 2);
      }
      
      // 데이터 정규화
      const normalizedReviews = reviewDataService.normalizeReviews(reviews);
      
      console.log(`📖 리뷰 미리보기 데이터 (랜덤 ${normalizedReviews.length}개):`, normalizedReviews);

      // 현재 사용자 정보
      const currentUserInfo = window.cacheManager ? window.cacheManager.getUserInfo() : null;
      const currentUserId = currentUserInfo ? currentUserInfo.id : null;

      // View를 통한 렌더링
      await reviewPreviewView.renderTopReviews(normalizedReviews, currentUserId);
      
      console.log('✅ 리뷰 미리보기 렌더링 완료');
    } catch (error) {
      console.error('❌ 리뷰 미리보기 오류:', error);
      this.showError();
    }
  },

  /**
   * 전체 리뷰 조회 (API 호출)
   */
  async loadAllReviews(storeId) {
    try {
      console.log(`🔍 매장 ${storeId} 전체 리뷰 조회 중...`);
      
      const result = await reviewDataService.getStoreReviewData(storeId);
      
      console.log(`✅ 매장 ${storeId} 전체 리뷰 ${result.total}개 조회 완료`);
      
      return result;
    } catch (error) {
      console.error('❌ 전체 리뷰 조회 실패:', error);
      return {
        success: false,
        reviews: [],
        total: 0,
        error: error.message
      };
    }
  },

  /**
   * 에러 상태 표시
   */
  showError() {
    const reviewPreviewContent = document.getElementById('reviewPreviewContent');
    if (reviewPreviewContent) {
      reviewPreviewContent.innerHTML = `
        <div class="review-card" style="text-align: center; color: #dc2626;">
          <div>리뷰를 불러오는 중 오류가 발생했습니다.</div>
          <div style="font-size: 13px; margin-top: 4px;">잠시 후 다시 시도해주세요.</div>
        </div>
      `;
    }
  }
};

// 전역 등록
window.reviewPreviewController = reviewPreviewController;

console.log('✅ reviewPreviewController 로드 완료');
