
/**
 * 리뷰 작성 화면 렌더링 (레이어드 아키텍처)
 */

import { reviewWriteController } from './controllers/reviewWriteController.js';

// Controller를 통한 렌더링
async function renderReviewWrite(order) {
  try {
    console.log('📝 renderReviewWrite 호출:', order);

    // order가 문자열이면 파싱 (하위 호환성)
    if (typeof order === 'string') {
      console.warn('⚠️ renderReviewWrite: order ID만 전달됨. order 객체 전체가 필요합니다.');
      throw new Error('주문 정보가 올바르지 않습니다');
    }

    if (!reviewWriteController) {
      throw new Error('리뷰 작성 컨트롤러를 찾을 수 없습니다');
    }

    // Controller를 통한 렌더링
    await reviewWriteController.renderReviewWrite(order);

  } catch (error) {
    console.error('❌ renderReviewWrite 실행 실패:', error);
    showReviewWriteError();
  }
}

// 에러 상태 표시
function showReviewWriteError() {
  const main = document.getElementById('main');
  if (main) {
    main.innerHTML = `
      <div class="review-write-container">
        <div class="review-write-header">
          <button id="reviewBackBtn" class="header-back-btn" onclick="goBackFromReview()">
            <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor">
              <path d="M19 12H5m7-7l-7 7 7 7"/>
            </svg>
          </button>
          <div class="header-info">
            <h1>📝 리뷰 작성</h1>
          </div>
        </div>

        <div class="review-write-content">
          <div class="error-state">
            <div class="error-icon">⚠️</div>
            <h3>리뷰 작성을 불러올 수 없어요</h3>
            <p>잠시 후 다시 시도해주세요</p>
            <button class="primary-btn" onclick="goBackFromReview()">
              <span class="btn-icon">🔙</span>
              돌아가기
            </button>
          </div>
        </div>
      </div>
    `;
  }
}

// 뒤로가기 함수
function goBackFromReview() {
  if (reviewWriteController) {
    reviewWriteController.goBack();
  } else {
    if (window.previousScreen === 'renderAllOrderHTML') {
      if (typeof renderAllOrderHTML === 'function') {
        renderAllOrderHTML(window.userInfo || { id: 'user1' });
      } else {
        renderMyPage();
      }
    } else {
      renderMyPage();
    }
  }
}

// 스타일은 별도 CSS 파일로 분리되었습니다 (TLG/pages/store/review/views/css/reviewWrite.css)

// 전역으로 함수 노출
window.renderReviewWrite = renderReviewWrite;
window.goBackFromReview = goBackFromReview;
