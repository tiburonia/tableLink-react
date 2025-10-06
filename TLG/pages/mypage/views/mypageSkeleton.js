
/**
 * MyPage Skeleton Component
 * 마이페이지 로딩 중 스켈레톤 UI
 */

export const mypageSkeleton = {
  /**
   * 마이페이지 스켈레톤 HTML 생성
   * (CSS는 index.html에서 사전 로드됨)
   */
  render() {
    return `
      <div class="mypage-skeleton">
        <!-- 헤더 스켈레톤 -->
        <div class="skeleton-header">
          <div class="skeleton-login-link skeleton-shimmer"></div>
          <div class="skeleton-settings-btn skeleton-shimmer"></div>
        </div>

        <!-- 예약 카드 스켈레톤 -->
        <div class="skeleton-reserve-card">
          <div class="skeleton-reserve-icon skeleton-shimmer"></div>
          <div class="skeleton-reserve-text skeleton-shimmer"></div>
          <div class="skeleton-reserve-btn skeleton-shimmer"></div>
        </div>

        <!-- 섹션 스켈레톤 -->
        <div class="skeleton-section">
          <div class="skeleton-section-title skeleton-shimmer"></div>
          <div class="skeleton-menu-list">
            ${this.createMenuItemSkeleton(3)}
          </div>
        </div>

        <!-- 섹션 스켈레톤 -->
        <div class="skeleton-section">
          <div class="skeleton-section-title skeleton-shimmer"></div>
          <div class="skeleton-menu-list">
            ${this.createMenuItemSkeleton(3)}
          </div>
        </div>

        <!-- 실제 바텀 네비게이션 -->
        <nav class="bottom-nav-bar">
          <button onclick="renderSubMain()" class="nav-item">
            <span class="nav-icon">🏠</span>
            <span class="nav-label">홈</span>
          </button>
          <button onclick="TLL()" class="nav-item">
            <span class="nav-icon">📱</span>
            <span class="nav-label">QR 주문</span>
          </button>
          <button onclick="renderMap()" class="nav-item">
            <span class="nav-icon">📍</span>
            <span class="nav-label">내주변</span>
          </button>
          <button class="nav-item active">
            <span class="nav-icon">👤</span>
            <span class="nav-label">내정보</span>
          </button>
        </nav>
      </div>
    `;
  },

  /**
   * 메뉴 아이템 스켈레톤 생성
   */
  createMenuItemSkeleton(count) {
    return Array(count).fill(0).map(() => `
      <div class="skeleton-menu-item">
        <div class="skeleton-menu-text skeleton-shimmer"></div>
        <div class="skeleton-menu-arrow skeleton-shimmer"></div>
      </div>
    `).join('');
  }
};
