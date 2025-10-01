
// 프로모션 카드 HTML 렌더링 모듈
export const promotionCardHTML = {
  renderPromotionCardHTML(store) {
    return `
      <div class="promotion-card modern-benefits-card">
        <div class="promotion-header">
          <div class="promotion-title-section">
            <div class="promotion-icon-wrapper">
              <span class="promotion-main-icon">🎁</span>
            </div>
            <div class="promotion-title-info">
              <h3 class="promotion-title">진행중인 혜택</h3>
              <div class="promotion-subtitle">특별 혜택을 확인하세요</div>
            </div>
          </div>
          <div class="promotion-status-indicator">
            <span class="live-dot"></span>
            <span class="live-text">LIVE</span>
          </div>
        </div>

        <div class="promotion-content">
          <!-- 개선된 로딩 스켈레톤 -->
          <div class="benefits-loading-skeleton">
            <div class="skeleton-benefit-item">
              <div class="skeleton-icon-container">
                <div class="skeleton-icon"></div>
              </div>
              <div class="skeleton-content">
                <div class="skeleton-title"></div>
                <div class="skeleton-desc"></div>
              </div>
              <div class="skeleton-badge"></div>
            </div>
            <div class="skeleton-benefit-item">
              <div class="skeleton-icon-container">
                <div class="skeleton-icon"></div>
              </div>
              <div class="skeleton-content">
                <div class="skeleton-title"></div>
                <div class="skeleton-desc"></div>
              </div>
              <div class="skeleton-badge"></div>
            </div>
            <div class="skeleton-benefit-item">
              <div class="skeleton-icon-container">
                <div class="skeleton-icon"></div>
              </div>
              <div class="skeleton-content">
                <div class="skeleton-title"></div>
                <div class="skeleton-desc"></div>
              </div>
              <div class="skeleton-badge"></div>
            </div>
          </div>
        </div>

        <div class="promotion-footer">
          <button class="promotion-detail-btn modern-outline-btn">
            <span class="btn-icon">📋</span>
            <span class="btn-text">전체 혜택 보기</span>
            <span class="btn-arrow">→</span>
          </button>
        </div>
      </div>
    `;
  }
};

// 전역 등록
window.promotionCardHTML = promotionCardHTML;
