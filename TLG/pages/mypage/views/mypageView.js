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
      <!-- 예약/이용예정 카드 -->
      <section class="mypage-reserve-card">
        <div class="reserve-icon">😢</div>
        <p class="reserve-text">이용 예정인 내역이 없어요.</p>
        <button class="reserve-action-btn" onclick="renderMap()">
          📍 내 주변 매장 보러가기
        </button>
      </section>

      <!-- 결제 섹션 -->
      <section class="mypage-info-section">
        <h3 class="section-title-simple">결제</h3>
        <ul class="simple-menu-list">
          <li onclick="renderAllOrderHTML(userInfo)">
            <span>결제 내역</span>
            <span class="arrow-icon">›</span>
          </li>
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
          <li onclick="renderAllOrderHTML(userInfo)">
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
        </button>
        <button class="nav-item active">
          <span class="nav-icon"><img width="30" height="30" src="https://img.icons8.com/ios-filled/30/more.png" alt="more"/></span>
          <span class="nav-label">더보기</span>
        </button>
      </nav>
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