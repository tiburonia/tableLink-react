
/**
 * MyPage Skeleton Component
 * 마이페이지 로딩 중 스켈레톤 UI
 */

export const mypageSkeleton = {
  /**
   * 마이페이지 스켈레톤 HTML 생성
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

        <!-- 바텀 네비게이션 스켈레톤 -->
        <div class="skeleton-bottom-nav">
          ${this.createNavItemSkeleton(5)}
        </div>
      </div>

      <style>
        ${this.getStyles()}
      </style>
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
  },

  /**
   * 네비게이션 아이템 스켈레톤 생성
   */
  createNavItemSkeleton(count) {
    return Array(count).fill(0).map(() => `
      <div class="skeleton-nav-item">
        <div class="skeleton-nav-icon skeleton-shimmer"></div>
        <div class="skeleton-nav-label skeleton-shimmer"></div>
      </div>
    `).join('');
  },

  /**
   * 스켈레톤 스타일
   */
  getStyles() {
    return `
      .mypage-skeleton {
        position: fixed;
        top: 0;
        left: 50%;
        transform: translateX(-50%);
        width: 100%;
        max-width: 430px;
        height: 100vh;
        background-color: #fafafa;
        overflow: hidden;
        padding-bottom: 80px;
      }

      /* 애니메이션 */
      .skeleton-shimmer {
        background: linear-gradient(90deg, #f1f5f9 25%, #e2e8f0 50%, #f1f5f9 75%);
        background-size: 200% 100%;
        animation: skeleton-loading 1.5s infinite;
        border-radius: 8px;
      }

      @keyframes skeleton-loading {
        0% { background-position: 200% 0; }
        100% { background-position: -200% 0; }
      }

      /* 헤더 스켈레톤 */
      .skeleton-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 16px 20px;
        background-color: #fff;
        border-bottom: 1px solid #eee;
      }

      .skeleton-login-link {
        width: 120px;
        height: 24px;
      }

      .skeleton-settings-btn {
        width: 32px;
        height: 32px;
        border-radius: 50%;
      }

      /* 예약 카드 스켈레톤 */
      .skeleton-reserve-card {
        background-color: #fff;
        border-radius: 12px;
        margin: 16px 16px 8px 16px;
        padding: 32px 20px;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
        text-align: center;
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 16px;
      }

      .skeleton-reserve-icon {
        width: 60px;
        height: 60px;
        border-radius: 50%;
      }

      .skeleton-reserve-text {
        width: 180px;
        height: 20px;
      }

      .skeleton-reserve-btn {
        width: 200px;
        height: 44px;
        border-radius: 8px;
      }

      /* 섹션 스켈레톤 */
      .skeleton-section {
        background-color: #fff;
        margin-top: 8px;
        padding: 20px 0;
        border-top: 8px solid #f5f5f5;
      }

      .skeleton-section-title {
        width: 80px;
        height: 16px;
        margin: 0 0 12px 20px;
      }

      .skeleton-menu-list {
        padding: 0;
      }

      .skeleton-menu-item {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 16px 20px;
        border-bottom: 1px solid #f5f5f5;
      }

      .skeleton-menu-item:last-child {
        border-bottom: none;
      }

      .skeleton-menu-text {
        width: 100px;
        height: 18px;
      }

      .skeleton-menu-arrow {
        width: 20px;
        height: 20px;
        border-radius: 4px;
      }

      /* 바텀 네비게이션 스켈레톤 */
      .skeleton-bottom-nav {
        position: fixed;
        bottom: 0;
        left: 50%;
        transform: translateX(-50%);
        width: 100%;
        max-width: 430px;
        background-color: #fff;
        display: flex;
        justify-content: space-around;
        align-items: center;
        padding: 8px 0 12px 0;
        border-top: 1px solid #eee;
        box-shadow: 0 -2px 10px rgba(0, 0, 0, 0.05);
      }

      .skeleton-nav-item {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 6px;
        flex: 1;
        padding: 6px 12px;
      }

      .skeleton-nav-icon {
        width: 28px;
        height: 28px;
        border-radius: 50%;
      }

      .skeleton-nav-label {
        width: 40px;
        height: 12px;
      }

      /* 반응형 */
      @media (max-width: 380px) {
        .skeleton-reserve-card {
          margin: 12px;
          padding: 24px 16px;
        }

        .skeleton-nav-icon {
          width: 24px;
          height: 24px;
        }

        .skeleton-nav-label {
          width: 36px;
          height: 10px;
        }
      }

      /* 안전 영역 (노치 대응) */
      @supports (padding: max(0px)) {
        .skeleton-bottom-nav {
          padding-bottom: max(12px, env(safe-area-inset-bottom));
        }
      }
    `;
  }
};
