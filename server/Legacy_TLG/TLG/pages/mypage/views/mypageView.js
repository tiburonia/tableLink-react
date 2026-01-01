/**
 * MyPage View
 * 마이페이지 메인 뷰 - HTML 생성
 */

export const mypageView = {
  /**
   * 마이페이지 HTML 생성
   */
  renderHTML(data) {
    const { userInfo, orders, reviews, stats } = data;
    const isLoggedIn = userInfo && userInfo.id;
    const displayName = isLoggedIn ? (userInfo.name || userInfo.username || userInfo.id) : null;

    return `
      <!-- 헤더 -->
      <header class="mypage-top-header">
        <span class="login-link" onclick="${isLoggedIn ? 'renderAccountSettings()' : 'renderLogin()'}">
          ${isLoggedIn ? displayName : '로그인해 주세요 >'}&nbsp&nbsp <img width="17" height="17" src="https://img.icons8.com/external-others-inmotus-design/17/external-Right-basic-web-ui-elements-others-inmotus-design-4.png" alt="external-Right-basic-web-ui-elements-others-inmotus-design-4"/>
        </span>
        
      </header>
      <div id="mypageContainer" style="overflow-y: auto; height: 660px;">
      <!-- Hero Card - 등급/포인트 정보 -->
      <section class="mypage-hero-card">
        <div class="hero-content">
          <div class="hero-badge">
            <span class="hero-emoji" id="heroEmoji">🏅</span>
            <span class="hero-level" id="heroLevel">신규고객</span>
          </div>
          <h2 class="hero-title">
            <span id="userName">${displayName || '고객'}</span>님은 현재 <strong id="levelName">신규고객</strong> 등급이에요!
          </h2>
          <div class="hero-stats">
            <div class="hero-stat">
              <span class="stat-icon">💰</span>
              <span class="stat-text">누적 포인트: <strong id="totalPoints">0P</strong></span>
            </div>
            <div class="hero-stat">
              <span class="stat-icon">🎟️</span>
              <span class="stat-text">보유 쿠폰: <strong id="totalCoupons">0장</strong></span>
            </div>
          </div>
          <div class="hero-actions">
            <button class="hero-btn outline" onclick="renderAllPoints()">포인트 내역</button>
            <button class="hero-btn filled" onclick="renderAllCoupons()">쿠폰함</button>
          </div>
        </div>
      </section>

      <section class="mypage-info-section">
        <h3 class="section-title-simple">주문</h3>
        <ul class="simple-menu-list">
          <li data-action="view-all-orders" style="cursor: pointer;">
            <span>주문 내역</span>
            <span class="arrow-icon">›</span>
          </li>
        </ul>
      </section>
      <!-- 결제 섹션 -->
      <section class="mypage-info-section">
        <h3 class="section-title-simple">결제</h3>
        <ul class="simple-menu-list">
          <li onclick="alert('준비중입니다')">
            <span>테이블링크 간편결제 관리</span>
            <span class="arrow-icon">›</span>
          </li>
          <li onclick="renderAllPoints()">
            <span>테이블링크 페이 머니 관리</span>
            <span class="arrow-icon">›</span>
          </li>
        </ul>
      </section>

      <!-- 예약 섹션 -->
      <!-- 혜택 섹션 -->

      <!-- 이용 정보 섹션 -->
      <section class="mypage-info-section">
        <h3 class="section-title-simple">이용 정보</h3>
        <ul class="simple-menu-list">
          <li onclick="renderMyReviews(userInfo?.userId, userInfo)">
            <span>내 리뷰</span>
            <span class="arrow-icon">›</span>
          </li>
          <li onclick="renderAllFavorites()">
            <span>내 단골가게</span>
            <span class="arrow-icon">›</span>
          </li>
          <li data-action="view-all-orders" style="cursor: pointer;">
            <span>이용 내역</span>
            <span class="arrow-icon">›</span>
          </li>
        </ul>
      </section>
      </div>

      <!-- 바텀 네비게이션 -->
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
           <span class="nav-label">내맛집</span>
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
   * 스타일 CSS 링크 추가
   */
  injectStyles() {
    // CSS 파일이 이미 로드되어 있는지 확인
    if (!document.querySelector('link[href="/TLG/pages/mypage/views/styles/mypage.css"]')) {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = '/TLG/pages/mypage/views/styles/mypage.css';
      document.head.appendChild(link);
    }
  }
};