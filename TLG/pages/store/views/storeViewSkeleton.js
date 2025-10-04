
/**
 * Store View Skeleton - 매장 로딩 상태 표시
 */
export const storeViewSkeleton = {
  render() {
    return `
      <div class="store-skeleton">
        <!-- 헤더 버튼 스켈레톤 -->
        <div class="skeleton-header-btns">
          <div class="skeleton-back-btn skeleton-loading"></div>
          <div class="skeleton-tll-btn skeleton-loading"></div>
        </div>

        <!-- 매장 이미지 스켈레톤 -->
        <div class="skeleton-store-image skeleton-loading"></div>

        <!-- 매장 패널 스켈레톤 -->
        <div class="skeleton-panel">
          <div class="skeleton-panel-handle skeleton-loading"></div>
          
          <div class="skeleton-panel-content">
            <!-- 매장 정보 섹션 -->
            <div class="skeleton-store-info">
              <!-- 평점 및 즐겨찾기 -->
              <div class="skeleton-rating-row">
                <div class="skeleton-rating skeleton-loading"></div>
                <div class="skeleton-favorite-btn skeleton-loading"></div>
              </div>
              
              <!-- 매장명 -->
              <div class="skeleton-store-name skeleton-loading"></div>
              
              <!-- 매장 상태 -->
              <div class="skeleton-store-status">
                <div class="skeleton-status-badge skeleton-loading"></div>
                <div class="skeleton-category-badge skeleton-loading"></div>
              </div>
            </div>

            <!-- 추가 정보 섹션 -->
            <div class="skeleton-additional-info">
              ${Array(4).fill(0).map(() => `
                <div class="skeleton-info-row">
                  <div class="skeleton-info-icon skeleton-loading"></div>
                  <div class="skeleton-info-text skeleton-loading"></div>
                </div>
              `).join('')}
            </div>

            <!-- 네비게이션 탭 -->
            <div class="skeleton-nav-bar">
              ${Array(5).fill(0).map(() => `
                <div class="skeleton-nav-btn skeleton-loading"></div>
              `).join('')}
            </div>

            <!-- 컨텐츠 영역 -->
            <div class="skeleton-content">
              <div class="skeleton-content-section skeleton-loading"></div>
              <div class="skeleton-content-section skeleton-loading"></div>
              <div class="skeleton-content-section skeleton-loading"></div>
            </div>
          </div>
        </div>

        <!-- 하단 바 스켈레톤 -->
        <div class="skeleton-bottom-bar">
          <div class="skeleton-phone-btn skeleton-loading"></div>
          <div class="skeleton-order-btn skeleton-loading"></div>
        </div>
      </div>

      <style>
        ${this.getStyles()}
      </style>
    `;
  },

  getStyles() {
    return `
      .store-skeleton {
        position: fixed;
        top: 0;
        left: 50%;
        transform: translateX(-50%);
        width: 100%;
        max-width: 430px;
        height: 100vh;
        background: #f8f9fa;
        overflow: hidden;
      }

      .skeleton-loading {
        background: linear-gradient(90deg, #f1f5f9 25%, #e2e8f0 50%, #f1f5f9 75%);
        background-size: 200% 100%;
        animation: skeleton-loading 1.5s infinite;
        border-radius: 8px;
      }

      @keyframes skeleton-loading {
        0% { background-position: 200% 0; }
        100% { background-position: -200% 0; }
      }

      /* 헤더 버튼 */
      .skeleton-header-btns {
        position: fixed;
        top: 15px;
        left: 50%;
        transform: translateX(-50%);
        width: 100%;
        max-width: 430px;
        padding: 0 15px;
        display: flex;
        justify-content: space-between;
        z-index: 1000;
      }

      .skeleton-back-btn,
      .skeleton-tll-btn {
        width: 40px;
        height: 40px;
        border-radius: 12px;
      }

      /* 매장 이미지 */
      .skeleton-store-image {
        width: 100%;
        height: 200px;
        border-radius: 0;
      }

      /* 패널 */
      .skeleton-panel {
        position: fixed;
        bottom: 0;
        left: 50%;
        transform: translateX(-50%);
        width: 100%;
        max-width: 430px;
        height: calc(100vh - 270px);
        background: white;
        border-radius: 20px 20px 0 0;
        box-shadow: 0 -8px 32px rgba(0, 0, 0, 0.12);
      }

      .skeleton-panel-handle {
        width: 40px;
        height: 4px;
        margin: 12px auto 8px auto;
        border-radius: 2px;
      }

      .skeleton-panel-content {
        padding: 0 20px 90px 20px;
        overflow-y: auto;
        height: calc(100% - 24px);
      }

      /* 매장 정보 */
      .skeleton-store-info {
        padding: 24px 0 20px 0;
      }

      .skeleton-rating-row {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 12px;
      }

      .skeleton-rating {
        width: 150px;
        height: 24px;
      }

      .skeleton-favorite-btn {
        width: 40px;
        height: 40px;
        border-radius: 50%;
      }

      .skeleton-store-name {
        width: 200px;
        height: 32px;
        margin-bottom: 12px;
      }

      .skeleton-store-status {
        display: flex;
        gap: 8px;
      }

      .skeleton-status-badge,
      .skeleton-category-badge {
        width: 80px;
        height: 28px;
        border-radius: 14px;
      }

      /* 추가 정보 */
      .skeleton-additional-info {
        margin: 20px 0;
        padding: 16px;
        background: #f8f9fa;
        border-radius: 12px;
      }

      .skeleton-info-row {
        display: flex;
        align-items: center;
        gap: 12px;
        margin-bottom: 12px;
      }

      .skeleton-info-row:last-child {
        margin-bottom: 0;
      }

      .skeleton-info-icon {
        width: 20px;
        height: 20px;
        border-radius: 4px;
      }

      .skeleton-info-text {
        flex: 1;
        height: 16px;
      }

      /* 네비게이션 */
      .skeleton-nav-bar {
        display: flex;
        justify-content: space-around;
        padding: 16px 0;
        border-top: 1px solid #e5e7eb;
        border-bottom: 1px solid #e5e7eb;
        margin: 20px -20px;
      }

      .skeleton-nav-btn {
        width: 60px;
        height: 50px;
        border-radius: 8px;
      }

      /* 컨텐츠 */
      .skeleton-content {
        padding: 20px 0;
      }

      .skeleton-content-section {
        height: 200px;
        margin-bottom: 16px;
        border-radius: 12px;
      }

      /* 하단 바 */
      .skeleton-bottom-bar {
        position: fixed;
        bottom: 0;
        left: 50%;
        transform: translateX(-50%);
        width: 100%;
        max-width: 430px;
        padding: 12px 20px;
        background: white;
        border-top: 1px solid #e5e7eb;
        display: flex;
        gap: 12px;
        z-index: 1000;
      }

      .skeleton-phone-btn {
        width: 60px;
        height: 54px;
        border-radius: 12px;
      }

      .skeleton-order-btn {
        flex: 1;
        height: 54px;
        border-radius: 12px;
      }

      /* 페이드인 애니메이션 */
      .store-skeleton {
        animation: skeleton-fade-in 0.3s ease-out;
      }

      @keyframes skeleton-fade-in {
        from { opacity: 0; }
        to { opacity: 1; }
      }
    `;
  }
};

console.log('✅ storeViewSkeleton 모듈 로드 완료');
