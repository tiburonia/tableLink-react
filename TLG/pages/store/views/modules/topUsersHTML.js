
// 상위 사용자 HTML 렌더링 모듈
export const topUsersHTML = {
  renderTopUsersHTML(store) {
    return `
      <div class="top-users-card premium-top-users-card">
        <div class="card-gradient-bg"></div>
        
        <div class="top-users-header">
          <div class="top-users-title-section">
            <div class="top-users-icon-wrapper">
              <span class="top-users-main-icon">👑</span>
            </div>
            <div class="top-users-title-info">
              <h3 class="top-users-title">단골 고객</h3>
              <div class="top-users-subtitle">최고의 고객들을 만나보세요</div>
            </div>
          </div>
          <div class="top-users-status-indicator">
            <span class="vip-dot"></span>
            <span class="vip-text">VIP</span>
          </div>
        </div>

        <div class="top-users-content">
          <!-- 로딩 스켈레톤 -->
          <div class="top-users-loading-skeleton">
            <div class="skeleton-user-item">
              <div class="skeleton-rank"></div>
              <div class="skeleton-user-avatar"></div>
              <div class="skeleton-user-info">
                <div class="skeleton-user-name"></div>
                <div class="skeleton-user-level"></div>
              </div>
              <div class="skeleton-user-stats">
                <div class="skeleton-stat"></div>
                <div class="skeleton-stat"></div>
              </div>
            </div>
            <div class="skeleton-user-item">
              <div class="skeleton-rank"></div>
              <div class="skeleton-user-avatar"></div>
              <div class="skeleton-user-info">
                <div class="skeleton-user-name"></div>
                <div class="skeleton-user-level"></div>
              </div>
              <div class="skeleton-user-stats">
                <div class="skeleton-stat"></div>
                <div class="skeleton-stat"></div>
              </div>
            </div>
            <div class="skeleton-user-item">
              <div class="skeleton-rank"></div>
              <div class="skeleton-user-avatar"></div>
              <div class="skeleton-user-info">
                <div class="skeleton-user-name"></div>
                <div class="skeleton-user-level"></div>
              </div>
              <div class="skeleton-user-stats">
                <div class="skeleton-stat"></div>
                <div class="skeleton-stat"></div>
              </div>
            </div>
          </div>
        </div>

        <div class="top-users-footer">
          <button class="top-users-detail-btn modern-outline-btn">
            <span class="btn-icon">🏆</span>
            <span class="btn-text">전체 랭킹 보기</span>
            <span class="btn-arrow">→</span>
          </button>
        </div>
      </div>
    `;
  }
};
