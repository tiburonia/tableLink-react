
/**
 * MyPage Skeleton Component
 * 마이페이지 로딩 중 스켈레톤 UI
 */

const mypageSkeleton = {
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
          <span class="nav-icon"><img width="26" height="26" src="https://img.icons8.com/external-solid-adri-ansyah/26/external-home-essentials-ui-solid-adri-ansyah.png" alt="external-home-essentials-ui-solid-adri-ansyah"/></span>
          <span class="nav-label">홈</span>
        </button>
        <button onclick="TLL()" class="nav-item">
          <span class="nav-icon"><img width="30" height="30" src="https://img.icons8.com/external-tanah-basah-glyph-tanah-basah/30/external-qr-metaverse-tanah-basah-glyph-tanah-basah.png" alt="external-qr-metaverse-tanah-basah-glyph-tanah-basah"/></span>
          <span class="nav-label">QR 주문</span>
        </button>
        <button onclick="renderMap()" class="nav-item" id="renderMapBtn">
          <span class="nav-icon"><img width="26" height="26" src="https://img.icons8.com/ios-filled/26/marker.png" alt="marker"/></span>
          <span class="nav-label">내주변</span>
        <button class="nav-item" onclick="renderRegularPage()">
          <span class="nav-icon"><img width="30" height="30" src="https://img.icons8.com/pastel-glyph/30/shop--v2.png" alt="shop--v2"/></span>
           <span class="nav-label">단골매장</span>
        </button>
        <button class="nav-item active">
          <span class="nav-icon"><img width="30" height="30" src="https://img.icons8.com/ios-filled/30/more.png" alt="more"/></span>
          <span class="nav-label">더보기</span>
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

// 전역 등록
window.mypageSkeleton = mypageSkeleton;
