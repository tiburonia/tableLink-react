/**
 * 리뷰 작성 화면 렌더링 (레이어드 아키텍처)
 */

// Controller 동적 로드 및 렌더링
async function renderReviewWrite(order) {
  try {
    console.log('📝 renderReviewWrite 호출:', order);

    // Controller 모듈 동적 로드
    let reviewWriteController;
    try {
      const controllerModule = await import('./controllers/reviewWriteController.js');
      reviewWriteController = controllerModule.reviewWriteController;
    } catch (error) {
      console.warn('⚠️ reviewWriteController 모듈 임포트 실패:', error);
      reviewWriteController = window.reviewWriteController;
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

      ${getReviewWriteStyles()}
    `;
  }
}

// 뒤로가기 함수
function goBackFromReview() {
  if (window.reviewWriteController) {
    window.reviewWriteController.goBack();
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

// 스타일 정의
function getReviewWriteStyles() {
  return `
    <style>
      .review-write-container {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        width: 100%;
        max-width: 430px;
        margin: 0 auto;
        display: flex;
        flex-direction: column;
        background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
        overflow: hidden;
      }

      .review-write-header {
        height: 80px;
        background: white;
        padding: 20px 16px;
        display: flex;
        align-items: center;
        gap: 16px;
        box-shadow: 0 2px 12px rgba(0, 0, 0, 0.04);
        flex-shrink: 0;
        z-index: 100;
      }

      .header-back-btn {
        width: 44px;
        height: 44px;
        border-radius: 12px;
        border: none;
        background: #f1f5f9;
        color: #475569;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        transition: all 0.2s ease;
      }

      .header-back-btn:hover {
        background: #e2e8f0;
        color: #334155;
      }

      .header-info {
        flex: 1;
      }

      .header-info h1 {
        margin: 0 0 4px 0;
        font-size: 22px;
        font-weight: 700;
        color: #1e293b;
        line-height: 1.2;
      }

      .header-subtitle {
        margin: 0;
        font-size: 13px;
        color: #64748b;
        font-weight: 500;
      }

      .review-write-content {
        flex: 1;
        overflow-y: auto;
        padding: 20px;
        display: flex;
        flex-direction: column;
        gap: 20px;
      }

      .order-info-card,
      .review-form-card {
        background: white;
        border-radius: 16px;
        padding: 20px;
        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.04);
        border: 1px solid rgba(226, 232, 240, 0.8);
      }

      .order-info-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 16px;
        padding-bottom: 12px;
        border-bottom: 2px solid #f1f5f9;
      }

      .order-info-header h3 {
        margin: 0;
        font-size: 16px;
        font-weight: 700;
        color: #1e293b;
      }

      .order-date {
        font-size: 12px;
        color: #64748b;
        font-weight: 500;
      }

      .order-details {
        display: flex;
        flex-direction: column;
        gap: 8px;
      }

      .store-name {
        font-size: 18px;
        font-weight: 700;
        color: #1e293b;
      }

      .order-items {
        font-size: 14px;
        color: #475569;
        line-height: 1.4;
      }

      .order-amount {
        font-size: 16px;
        font-weight: 600;
        color: #3b82f6;
        margin-top: 4px;
      }

      .rating-section,
      .content-section {
        margin-bottom: 24px;
      }

      .form-label {
        margin: 0 0 16px 0;
        font-size: 16px;
        font-weight: 700;
        color: #1e293b;
      }

      .star-rating-large {
        display: flex;
        justify-content: center;
        gap: 8px;
        margin-bottom: 12px;
      }

      .star-large {
        font-size: 36px;
        cursor: pointer;
        color: #d1d5db;
        transition: all 0.2s ease;
        user-select: none;
      }

      .star-large.active {
        color: #fbbf24;
        transform: scale(1.1);
      }

      .star-large.hover {
        color: #f59e0b;
        transform: scale(1.05);
      }

      .rating-text {
        text-align: center;
        font-size: 14px;
        color: #6b7280;
        font-weight: 500;
      }

      .rating-text.selected {
        color: #1e293b;
        font-weight: 600;
        font-size: 16px;
      }

      .review-textarea-large {
        width: 100%;
        min-height: 120px;
        border: 2px solid #e5e7eb;
        border-radius: 12px;
        padding: 16px;
        font-size: 16px;
        font-family: inherit;
        resize: vertical;
        transition: border-color 0.2s ease;
        box-sizing: border-box;
        line-height: 1.5;
      }

      .review-textarea-large:focus {
        outline: none;
        border-color: #3b82f6;
        box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
      }

      .char-count {
        text-align: right;
        font-size: 12px;
        color: #6b7280;
        margin-top: 8px;
      }

      .review-tips {
        background: #f8fafc;
        border-radius: 12px;
        padding: 16px;
        border-left: 4px solid #3b82f6;
      }

      .review-tips h4 {
        margin: 0 0 12px 0;
        font-size: 14px;
        font-weight: 600;
        color: #1e293b;
      }

      .review-tips ul {
        margin: 0;
        padding-left: 16px;
        list-style-type: disc;
      }

      .review-tips li {
        font-size: 13px;
        color: #475569;
        margin-bottom: 4px;
        line-height: 1.4;
      }

      .submit-section {
        margin-top: auto;
        padding-top: 20px;
      }

      .submit-review-btn {
        width: 100%;
        padding: 16px 24px;
        border: none;
        border-radius: 12px;
        background: #d1d5db;
        color: #6b7280;
        font-size: 16px;
        font-weight: 600;
        cursor: not-allowed;
        transition: all 0.2s ease;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 8px;
      }

      .submit-review-btn.ready {
        background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
        color: white;
        cursor: pointer;
        box-shadow: 0 4px 16px rgba(59, 130, 246, 0.3);
      }

      .submit-review-btn.ready:hover {
        transform: translateY(-2px);
        box-shadow: 0 6px 20px rgba(59, 130, 246, 0.4);
      }

      .submit-review-btn:disabled {
        background: #d1d5db;
        color: #6b7280;
        cursor: not-allowed;
        transform: none;
        box-shadow: none;
      }

      .error-state {
        text-align: center;
        padding: 60px 20px;
        color: #64748b;
      }

      .error-icon {
        font-size: 64px;
        margin-bottom: 16px;
      }

      .error-state h3 {
        margin: 0 0 8px 0;
        font-size: 18px;
        font-weight: 700;
        color: #1e293b;
      }

      .error-state p {
        margin: 0 0 24px 0;
        font-size: 14px;
        color: #64748b;
      }

      .primary-btn {
        padding: 12px 24px;
        border: none;
        border-radius: 12px;
        background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
        color: white;
        font-size: 14px;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.2s ease;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        gap: 8px;
      }

      .primary-btn:hover {
        transform: translateY(-2px);
        box-shadow: 0 4px 16px rgba(59, 130, 246, 0.3);
      }

      .success-message {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.5);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 3000;
      }

      .success-content {
        background: white;
        border-radius: 20px;
        padding: 40px;
        text-align: center;
        box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
        max-width: 300px;
        margin: 20px;
      }

      .success-icon {
        font-size: 48px;
        margin-bottom: 16px;
      }

      .success-content h3 {
        margin: 0 0 8px 0;
        font-size: 18px;
        font-weight: 700;
        color: #1e293b;
      }

      .success-content p {
        margin: 0;
        font-size: 14px;
        color: #64748b;
      }

      @media (max-width: 480px) {
        .review-write-header {
          padding: 16px 12px;
        }

        .review-write-content {
          padding: 16px 12px;
        }

        .order-info-card,
        .review-form-card {
          padding: 16px;
        }

        .star-large {
          font-size: 32px;
        }

        .header-info h1 {
          font-size: 20px;
        }
      }
    </style>
  `;
}

// 전역으로 함수 노출
window.renderReviewWrite = renderReviewWrite;
window.goBackFromReview = goBackFromReview;