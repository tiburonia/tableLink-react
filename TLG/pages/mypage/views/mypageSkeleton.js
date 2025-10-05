
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
          <button onclick="renderSearch()" class="nav-item">
            <span class="nav-icon">🔍</span>
            <span class="nav-label">검색</span>
          </button>
          <button class="nav-item active">
            <span class="nav-icon">👤</span>
            <span class="nav-label">내정보</span>
          </button>
        </nav>
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

      /* 바텀 네비게이션 */
      .bottom-nav-bar {
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
        z-index: 1000;
      }

      .nav-item {
        background: none;
        border: none;
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 4px;
        cursor: pointer;
        padding: 6px 12px;
        transition: all 0.2s ease;
        flex: 1;
      }

      .nav-icon {
        font-size: 22px;
        transition: transform 0.2s ease;
      }

      .nav-label {
        font-size: 11px;
        color: #999;
        font-weight: 500;
      }

      .nav-item.active .nav-label {
        color: #007aff;
        font-weight: 600;
      }

      .nav-item.active .nav-icon {
        transform: scale(1.1);
      }

      .nav-item:active {
        transform: scale(0.95);
      }

      /* 반응형 */
      @media (max-width: 380px) {
        .skeleton-reserve-card {
          margin: 12px;
          padding: 24px 16px;
        }

        .nav-label {
          font-size: 10px;
        }

        .nav-icon {
          font-size: 20px;
        }
      }

      /* 안전 영역 (노치 대응) */
      @supports (padding: max(0px)) {
        .bottom-nav-bar {
          padding-bottom: max(12px, env(safe-area-inset-bottom));
        }
      }
    `;
  }
};
