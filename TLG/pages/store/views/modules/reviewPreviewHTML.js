
// 리뷰 프리뷰 HTML 렌더링 모듈
export const reviewPreviewHTML = {
  renderReviewPreviewHTML() {
    return `
      <div id="reviewPreview" class="review-preview premium-review-card">
        <div class="card-gradient-bg"></div>
        
        <div class="review-header-section">
          <div class="review-title-section">
            <div class="review-icon-wrapper">
              <span class="review-main-icon">💬</span>
            </div>
            <div class="review-title-info">
              <h3 class="review-title">고객 리뷰</h3>
              <div class="review-subtitle">실제 방문 고객들의 생생한 후기</div>
            </div>
          </div>
          <div class="review-status-indicator">
            <span class="fresh-dot"></span>
            <span class="fresh-text">FRESH</span>
          </div>
        </div>

        <div id="reviewPreviewContent" class="review-content">
          <!-- 로딩 스켈레톤 -->
          <div class="review-loading-skeleton">
            <div class="skeleton-review-item">
              <div class="skeleton-user-section">
                <div class="skeleton-avatar"></div>
                <div class="skeleton-user-info">
                  <div class="skeleton-username"></div>
                  <div class="skeleton-date"></div>
                </div>
                <div class="skeleton-rating"></div>
              </div>
              <div class="skeleton-review-text"></div>
            </div>
            <div class="skeleton-review-item">
              <div class="skeleton-user-section">
                <div class="skeleton-avatar"></div>
                <div class="skeleton-user-info">
                  <div class="skeleton-username"></div>
                  <div class="skeleton-date"></div>
                </div>
                <div class="skeleton-rating"></div>
              </div>
              <div class="skeleton-review-text"></div>
            </div>
          </div>
        </div>

        <div class="review-footer">
          <button class="see-more-btn modern-outline-btn">
            <span class="btn-icon">📋</span>
            <span class="btn-text">모든 리뷰 보기</span>
            <span class="btn-arrow">→</span>
          </button>
        </div>
      </div>
    `;
  }
};

// 전역 등록
window.reviewPreviewHTML = reviewPreviewHTML;
