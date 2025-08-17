async function renderMyPage() {
  const main = document.getElementById('main');

  main.innerHTML = `
    <!-- 헤더 -->
    <header id="mypageHeader">
      <div class="header-background"></div>
      <div class="header-content">
        <div class="header-title">
          <h1>마이페이지</h1>
          <p>나의 활동과 정보를 한눈에</p>
        </div>
        <!-- 설정 버튼은 헤더 밖으로 이동됨 -->
      </div>
    </header>

    <!-- 설정 버튼 -->
    <button id="settingsBtn" class="settings-btn" onclick="renderMyAccount()">
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
        <path d="M12 15C13.6569 15 15 13.6569 15 12C15 10.3431 13.6569 9 12 9C10.3431 9 9 10.3431 9 12C9 13.6569 10.3431 15 12 15Z" stroke="currentColor" stroke-width="2"/>
        <path d="M19.4 15C19.2669 15.3016 19.2272 15.6362 19.286 15.9606C19.3448 16.285 19.4995 16.5843 19.73 16.82L19.79 16.88C19.976 17.0657 20.1235 17.2863 20.2241 17.5291C20.3248 17.7719 20.3766 18.0322 20.3766 18.295C20.3766 18.5578 20.3248 18.8181 20.2241 19.0609C20.1235 19.3037 19.976 19.5243 19.79 19.71C19.6043 19.896 19.3837 20.0435 19.1409 20.1441C18.8981 20.2448 18.6378 20.2966 18.375 20.2966C18.1122 20.2966 17.8519 20.2448 17.6091 20.1441C17.3663 20.0435 17.1457 19.896 16.96 19.71L16.9 19.65C16.6643 19.4195 16.365 19.2648 16.0406 19.206C15.7162 19.1472 15.3816 19.1869 15.08 19.32C14.7842 19.4468 14.532 19.6572 14.3543 19.9255C14.1766 20.1938 14.0813 20.5082 14.08 20.83V21C14.08 21.5304 13.8693 22.0391 13.4942 22.4142C13.1191 22.7893 12.6104 23 12.08 23C11.5496 23 11.0409 22.7893 10.6658 22.4142C10.2907 22.0391 10.08 21.5304 10.08 21V20.91C10.0723 20.579 9.96512 20.258 9.77251 19.9887C9.5799 19.7194 9.31074 19.5143 9 19.4C8.69838 19.2669 8.36381 19.2272 8.03941 19.286C7.71502 19.3448 7.41568 19.4995 7.18 19.73L7.12 19.79C6.93425 19.976 6.71368 20.1235 6.47088 20.2241C6.22808 20.3248 5.96783 20.3766 5.705 20.3766C5.44217 20.3766 5.18192 20.3248 4.93912 20.2241C4.69632 20.1235 4.47575 19.976 4.29 19.79C4.10405 19.6043 3.95653 19.3837 3.85588 19.1409C3.75523 18.8981 3.70343 18.6378 3.70343 18.375C3.70343 18.1122 3.75523 17.8519 3.85588 17.6091C3.95653 17.3663 4.10405 17.1457 4.29 16.96L4.35 16.9C4.58054 16.6643 4.73519 16.365 4.794 16.0406C4.85282 15.7162 4.81312 15.3816 4.68 15.08C4.55324 14.7842 4.34276 14.532 4.07447 14.3543C3.80618 14.1766 3.49179 14.0813 3.17 14.08H3C2.46957 14.08 1.96086 13.8693 1.58579 13.4942C1.21071 13.1191 1 12.6104 1 12.08C1 11.5496 1.21071 11.0409 1.58579 10.6658C1.96086 10.2907 2.46957 10.08 3 10.08H3.09C3.42099 10.0723 3.742 9.96512 4.0113 9.77251C4.28059 9.5799 4.48572 9.31074 4.6 9C4.73312 8.69838 4.77282 8.36381 4.714 8.03941C4.65519 7.71502 4.50054 7.41568 4.27 7.18L4.21 7.12C4.02405 6.93425 3.87653 6.71368 3.77588 6.47088C3.67523 6.22808 3.62343 5.96783 3.62343 5.705C3.62343 5.44217 3.67523 5.18192 3.77588 4.93912C3.87653 4.69632 4.02405 4.47575 4.21 4.29C4.39575 4.10405 4.61632 3.95653 4.85912 3.85588C5.10192 3.75523 5.36217 3.70343 5.625 3.70343C5.88783 3.70343 6.14808 3.75523 6.39088 3.85588C6.63368 3.95653 6.85425 4.10405 7.04 4.29L7.1 4.35C7.33568 4.58054 7.63502 4.73519 7.95941 4.794C8.28381 4.85282 8.61838 4.81312 8.92 4.68H9C9.29577 4.55324 9.54802 4.34276 9.72569 4.07447C9.90337 3.80618 9.99872 3.49179 10 3.17V3C10 2.46957 10.2107 1.96086 10.5858 1.58579C10.9609 1.21071 11.4696 1 12 1C12.5304 1 13.0391 1.21071 13.4142 1.58579C13.7893 1.96086 14 2.46957 14 3V3.09C14.0013 3.41179 14.0966 3.72618 14.2743 3.99447C14.452 4.26276 14.7042 4.47324 15 4.6C15.3016 4.73312 15.6362 4.77282 15.9606 4.714C16.285 4.65519 16.5843 4.50054 16.82 4.27L16.88 4.21C17.0657 4.02405 17.2863 3.87653 17.5291 3.77588C17.7719 3.67523 18.0322 3.62343 18.295 3.62343C18.5578 3.62343 18.8181 3.67523 19.0609 3.77588C19.3037 3.87653 19.5243 4.02405 19.71 4.21C19.896 4.39575 20.0435 4.61632 20.1441 4.85912C20.2448 5.10192 20.2966 5.36217 20.2966 5.625C20.2966 5.88783 20.2448 6.14808 20.1441 6.39088C20.0435 6.63368 19.896 6.85425 19.71 7.04L19.65 7.1C19.4195 7.33568 19.2648 7.63502 19.206 7.95941C19.1472 8.28381 19.1869 8.61838 19.32 8.92V9C19.4468 9.29577 19.6572 9.54802 19.9255 9.72569C20.1938 9.90337 20.5082 9.99872 20.83 10H21C21.5304 10 22.0391 10.2107 22.4142 10.5858C22.7893 10.9609 23 11.4696 23 12C23 12.5304 22.7893 13.0391 22.4142 13.4142C22.0391 13.7893 21.5304 14 21 14H20.91C20.5882 14.0013 20.2738 14.0966 20.0055 14.2743C19.7372 14.452 19.5268 14.7042 19.4 15V15Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
    </button>

    <!-- 마이페이지 패널 -->
    <div id="mypagePanel" class="collapsed">
      <div id="mypagePanelHandle"></div>
      <div id="mypagePanelContainer">
        <div id="mypageInfoContainer">
          <!-- 프로필 카드 -->
          <div class="profile-card">
            <div class="profile-avatar">
              <div class="avatar-circle" id="profileImage">
                <span class="avatar-text">👤</span>
              </div>
              <div class="online-indicator"></div>
            </div>

            <div class="profile-info">
              <h2 id="profileName" class="profile-name">사용자 정보 로딩중...</h2>
              <div id="profileLevel" class="profile-badge">등급 확인중...</div>

              <div class="profile-stats">
                <div class="stat-item">
                  <span class="stat-number" id="totalOrders">-</span>
                  <span class="stat-label">총 주문</span>
                </div>
                <div class="stat-divider"></div>
                <div class="stat-item">
                  <span class="stat-number" id="totalReviews">-</span>
                  <span class="stat-label">리뷰</span>
                </div>
                <div class="stat-divider"></div>
                <div class="stat-item">
                  <span class="stat-number" id="favoriteCount">-</span>
                  <span class="stat-label">즐겨찾기</span>
                </div>
              </div>
            </div>
          </div>

          <!-- 퀵 액션 메뉴 -->
          <div class="quick-actions">
            <div class="quick-action-item" onclick="renderAllOrderHTML(userInfo)">
              <div class="action-icon">📦</div>
              <span class="action-label">주문내역</span>
            </div>
            <div class="quick-action-item">
              <div class="action-icon">🎫</div>
              <span class="action-label">쿠폰함</span>
            </div>
            <div class="quick-action-item">
              <div class="action-icon">💖</div>
              <span class="action-label">즐겨찾기</span>
            </div>
            <div class="quick-action-item">
              <div class="action-icon">🏆</div>
              <span class="action-label">업적</span>
            </div>
          </div>

          <!-- 섹션들 -->
          <div class="sections-container">
            <!-- 최근 주문 -->
            <section class="section-card">
              <div class="section-header">
                <h3>📦 최근 주문</h3>
                <button class="see-more-btn" onclick="renderAllOrderHTML(userInfo)">
                  <span>전체보기</span>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                    <path d="M9 18L15 12L9 6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                  </svg>
                </button>
              </div>
              <div id="orderList" class="content-list">
                <div class="loading-skeleton">
                  <div class="skeleton-line"></div>
                  <div class="skeleton-line short"></div>
                </div>
              </div>
            </section>

            <!-- 리뷰 내역 -->
            <section class="section-card">
              <div class="section-header">
                <h3>⭐ 내 리뷰</h3>
                <button class="see-more-btn" id="viewAllReviewsBtn">
                  <span>전체보기</span>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                    <path d="M9 18L15 12L9 6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                  </svg>
                </button>
              </div>
              <div id="reviewList" class="content-list">
                <div class="loading-skeleton">
                  <div class="skeleton-line"></div>
                  <div class="skeleton-line short"></div>
                </div>
              </div>
            </section>

            <!-- 즐겨찾기 매장 -->
            <section class="section-card">
              <div class="section-header">
                <h3>💖 즐겨찾기 매장</h3>
                <button class="see-more-btn" id="viewAllFavoritesBtn">
                  <span>전체보기</span>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                    <path d="M9 18L15 12L9 6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                  </svg>
                </button>
              </div>
              <div id="favoriteStoresList" class="content-list">
                <div class="loading-skeleton">
                  <div class="skeleton-line"></div>
                  <div class="skeleton-line short"></div>
                </div>
              </div>
            </section>

            <!-- 단골 레벨 -->
            <section class="section-card">
              <div class="section-header">
                <h3>🏆 단골 레벨</h3>
                <button class="see-more-btn" id="viewAllLevelsBtn">
                  <span>전체보기</span>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                    <path d="M9 18L15 12L9 6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                  </svg>
                  </button>
              </div>
              <div id="regularLevelsList" class="content-list">
                <div class="loading-skeleton">
                  <div class="skeleton-line"></div>
                  <div class="skeleton-line short"></div>
                </div>
              </div>
            </section>

            <!-- 매장별 포인트 -->
            <section class="section-card">
              <div class="section-header">
                <h3>💰 보유 포인트</h3>
                <button class="see-more-btn" id="viewAllPointsBtn">
                  <span>전체보기</span>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                    <path d="M9 18L15 12L9 6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                  </svg>
                </button>
              </div>
              <div id="storePointsList" class="content-list">
                <div class="loading-skeleton">
                  <div class="skeleton-line"></div>
                  <div class="skeleton-line short"></div>
                </div>
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>

    <!-- 바텀 네비게이션 -->
    <nav id="bottomBar">
      <button onclick="renderSubMain()" title="홈">
        <span style="font-size: 22px;">🏠</span>
      </button>
      <button onclick="TLL().catch(console.error)" title="QR주문">
        <span style="font-size: 22px;">📱</span>
      </button>
      <button onclick="renderMap().catch(console.error)" title="지도">
        <span style="font-size: 22px;">📍</span>
      </button>
      <button onclick="renderSearch('')" title="검색">
        <span style="font-size: 22px;">🔍</span>
      </button>
      <button id="mypageBtn" class="active" title="마이페이지">
        <span style="font-size: 22px;">👤</span>
      </button>
    </nav>

    <style>
      /* 헤더 영역 */
      #mypageHeader {
        position: fixed;
        top: 0;
        left: 50%;
        transform: translateX(-50%);
        width: 100%;
        max-width: 430px;
        height: 100px;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        z-index: 11;
        overflow: hidden;
      }

      .header-background {
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: url('TableLink.png') center/cover;
        opacity: 0.1;
      }

      .header-content {
        position: relative;
        height: 100%;
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 16px 20px;
        color: white;
      }

      .header-title h1 {
        margin: 0;
        font-size: 24px;
        font-weight: 700;
        letter-spacing: -0.5px;
        text-shadow: 0 1px 3px rgba(0, 0, 0, 0.3);
      }

      .header-title p {
        margin: 2px 0 0 0;
        font-size: 13px;
        opacity: 0.9;
        font-weight: 400;
      }

      /* 설정 버튼 스타일 */
      .settings-btn {
        position: fixed; /* 절대 위치로 변경 */
        top: 40px; /* 상단에서 40px 떨어진 위치 */
        right: 20px; /* 오른쪽에서 20px 떨어진 위치 */
        width: 44px;
        height: 44px;
        background: transparent; /* 투명 배경 */
        border: none;
        border-radius: 50%; /* 원형으로 변경 */
        color: #000000; /* 검은색 */
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: all 0.2s ease;
        backdrop-filter: blur(15px); /* 블러 효과 강화 */
        border: 1px solid rgba(255, 255, 255, 0.3);
        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15); /* 그림자 효과 추가 */
        z-index: 99999; /* 최상단 z-index */
        pointer-events: auto;
      }

      .settings-btn:hover {
        background: rgba(255, 255, 255, 0.3);
        transform: scale(1.05); /* 호버 시 약간 커지는 효과 */
      }

      /* 마이페이지 패널 - renderStore 스타일 적용 */
      #mypagePanel {
        position: fixed;
        left: 50%;
        transform: translateX(-50%);
        width: 100%;
        max-width: 430px;
        background: white;
        box-shadow: 0 -8px 32px rgba(0, 0, 0, 0.12);
        transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
        z-index: 10;
      }

      #mypagePanel.collapsed {
        top: 100px;
        bottom: 78px;
        height: calc(100vh - 178px);
        border-radius: 20px 20px 0 0;
      }

      #mypagePanel.expanded {
        top: 0;
        bottom: 78px;
        height: calc(100vh - 78px);
        border-radius: 0;
        z-index: 99;
      }

      #mypagePanelHandle {
        width: 40px;
        height: 4px;
        background: #d1d5db;
        border-radius: 2px;
        margin: 12px auto 8px auto;
        cursor: grab;
        touch-action: none;
        transition: background 0.2s ease;
      }

      #mypagePanelHandle:hover {
        background: #9ca3af;
      }

      #mypagePanelContainer {
        position: relative;
        height: calc(100% - 24px);
        overflow-y: auto !important;
        overflow-x: hidden;
        box-sizing: border-box;
        overscroll-behavior: contain;
        -webkit-overflow-scrolling: touch;
        padding: 0 20px 100px 20px;
        scroll-behavior: smooth;
        will-change: scroll-position;
        max-height: calc(100vh - 178px);
      }

      #mypagePanelContainer::-webkit-scrollbar {
        width: 4px;
      }

      #mypagePanelContainer::-webkit-scrollbar-track {
        background: transparent;
      }

      #mypagePanelContainer::-webkit-scrollbar-thumb {
        background: rgba(0, 0, 0, 0.1);
        border-radius: 2px;
      }

      #mypagePanelContainer::-webkit-scrollbar-thumb:hover {
        background: rgba(0, 0, 0, 0.2);
      }

      /* 프로필 카드 */
      .profile-card {
        background: white;
        border-radius: 20px;
        padding: 24px;
        margin-bottom: 24px;
        box-shadow: 0 4px 24px rgba(0, 0, 0, 0.08);
        border: 1px solid rgba(255, 255, 255, 0.8);
        position: relative;
        overflow: hidden;
      }

      .profile-card::before {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        height: 4px;
        background: linear-gradient(90deg, #667eea, #764ba2);
      }

      .profile-avatar {
        display: flex;
        justify-content: center;
        margin-bottom: 20px;
        position: relative;
      }

      .avatar-circle {
        width: 80px;
        height: 80px;
        background: linear-gradient(135deg, #667eea, #764ba2);
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
        font-size: 32px;
        box-shadow: 0 8px 24px rgba(102, 126, 234, 0.3);
        position: relative;
      }

      .online-indicator {
        position: absolute;
        bottom: 4px;
        right: 4px;
        width: 20px;
        height: 20px;
        background: #10b981;
        border: 3px solid white;
        border-radius: 50%;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
      }

      .profile-info {
        text-align: center;
      }

      .profile-name {
        margin: 0 0 8px 0;
        font-size: 24px;
        font-weight: 700;
        color: #1f2937;
        letter-spacing: -0.5px;
      }

      .profile-badge {
        display: inline-block;
        padding: 6px 16px;
        background: linear-gradient(135deg, #fef3c7, #fde68a);
        color: #92400e;
        border-radius: 20px;
        font-size: 13px;
        font-weight: 600;
        margin-bottom: 20px;
        border: 1px solid #fbbf24;
      }

      .profile-stats {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 0;
      }

      .stat-item {
        display: flex;
        flex-direction: column;
        align-items: center;
        flex: 1;
      }

      .stat-number {
        font-size: 20px;
        font-weight: 700;
        color: #1f2937;
        margin-bottom: 2px;
      }

      .stat-label {
        font-size: 12px;
        color: #6b7280;
        font-weight: 500;
      }

      .stat-divider {
        width: 1px;
        height: 32px;
        background: #e5e7eb;
        margin: 0 16px;
      }

      /* 퀵 액션 메뉴 */
      .quick-actions {
        display: grid;
        grid-template-columns: repeat(4, 1fr);
        gap: 12px;
        margin-bottom: 24px;
      }

      .quick-action-item {
        background: white;
        border-radius: 16px;
        padding: 20px 12px;
        text-align: center;
        cursor: pointer;
        transition: all 0.2s ease;
        box-shadow: 0 2px 12px rgba(0, 0, 0, 0.05);
        border: 1px solid #f1f5f9;
      }

      .quick-action-item:hover {
        transform: translateY(-2px);
        box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
        border-color: #e2e8f0;
      }

      .action-icon {
        font-size: 24px;
        margin-bottom: 8px;
        display: block;
      }

      .action-label {
        font-size: 12px;
        font-weight: 600;
        color: #4b5563;
      }

      /* 섹션 컨테이너 */
      .sections-container {
        display: flex;
        flex-direction: column;
        gap: 20px;
      }

      /* 섹션 카드 */
      .section-card {
        background: white;
        border-radius: 16px;
        padding: 20px;
        box-shadow: 0 2px 12px rgba(0, 0, 0, 0.05);
        border: 1px solid #f1f5f9;
      }

      .section-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 16px;
      }

      .section-header h3 {
        margin: 0;
        font-size: 18px;
        font-weight: 700;
        color: #1f2937;
      }

      .see-more-btn {
        display: flex;
        align-items: center;
        gap: 4px;
        background: none;
        border: none;
        color: #6366f1;
        font-size: 14px;
        font-weight: 600;
        cursor: pointer;
        padding: 8px 12px;
        border-radius: 8px;
        transition: all 0.2s ease;
      }

      .see-more-btn:hover {
        background: #f0f4ff;
        color: #4f46e5;
      }

      /* 콘텐츠 리스트 */
      .content-list {
        min-height: 60px;
      }

      /* 로딩 스켈레톤 */
      .loading-skeleton {
        display: flex;
        flex-direction: column;
        gap: 12px;
      }

      .skeleton-line {
        height: 16px;
        background: linear-gradient(90deg, #f1f5f9 25%, #e2e8f0 50%, #f1f5f9 75%);
        background-size: 200% 100%;
        border-radius: 8px;
        animation: skeleton-loading 1.5s infinite;
      }

      .skeleton-line.short {
        width: 60%;
      }

      @keyframes skeleton-loading {
        0% { background-position: 200% 0; }
        100% { background-position: -200% 0; }
      }

      /* 주문 아이템 */
      .order-item {
        background: #f8fafc;
        border-radius: 12px;
        padding: 16px;
        margin-bottom: 12px;
        border: 1px solid #e2e8f0;
        transition: all 0.2s ease;
      }

      .order-item:hover {
        background: #f1f5f9;
        border-color: #cbd5e1;
      }

      .order-info {
        margin-bottom: 12px;
        line-height: 1.5;
        color: #374151;
      }

      .order-info strong {
        color: #1f2937;
        font-weight: 600;
      }

      .review-section {
        display: flex;
        justify-content: flex-end;
      }

      .review-btn {
        background: linear-gradient(135deg, #6366f1, #4f46e5);
        color: white;
        border: none;
        padding: 8px 16px;
        border-radius: 8px;
        font-size: 13px;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.2s ease;
        box-shadow: 0 2px 8px rgba(99, 102, 241, 0.2);
      }

      .review-btn:hover {
        background: linear-gradient(135deg, #4f46e5, #4338ca);
        transform: translateY(-1px);
        box-shadow: 0 4px 12px rgba(99, 102, 241, 0.3);
      }

      /* 리뷰 아이템 */
      .review-item {
        background: #f8fafc;
        border-radius: 12px;
        padding: 16px;
        margin-bottom: 12px;
        border: 1px solid #e2e8f0;
        transition: all 0.2s ease;
      }

      .review-item:hover {
        background: #f1f5f9;
        border-color: #cbd5e1;
      }

      .review-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 8px;
      }

      .review-store {
        font-weight: 600;
        color: #1f2937;
      }

      .review-rating {
        color: #f59e0b;
        font-weight: 600;
      }

      .review-content {
        color: #4b5563;
        font-size: 14px;
        line-height: 1.5;
        margin-bottom: 8px;
      }

      .review-date {
        color: #9ca3af;
        font-size: 12px;
      }

      /* 즐겨찾기 아이템 */
      .favorite-store-item {
        background: #f8fafc;
        border-radius: 12px;
        padding: 16px;
        margin-bottom: 12px;
        border: 1px solid #e2e8f0;
        display: flex;
        justify-content: space-between;
        align-items: center;
        cursor: pointer;
        transition: all 0.2s ease;
      }

      .favorite-store-item:hover {
        background: #f1f5f9;
        border-color: #cbd5e1;
        transform: translateY(-1px);
      }

      .favorite-store-content {
        flex: 1;
      }

      .favorite-store-name {
        font-weight: 600;
        color: #1f2937;
        margin-bottom: 4px;
      }

      .favorite-store-info {
        color: #6b7280;
        font-size: 13px;
      }

      /* 단골 레벨 아이템 */
      .regular-level-item {
        background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
        border-radius: 16px;
        padding: 20px;
        margin-bottom: 16px;
        border: 1px solid #e2e8f0;
        transition: all 0.3s ease;
        cursor: pointer;
      }

      .regular-level-item:hover {
        background: linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%);
        transform: translateY(-2px);
        box-shadow: 0 8px 24px rgba(0, 0, 0, 0.1);
      }

      .level-store-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 16px;
      }

      .level-store-name {
        font-weight: 700;
        color: #1f2937;
        font-size: 16px;
      }

      .level-badge {
        padding: 6px 12px;
        border-radius: 12px;
        font-size: 12px;
        font-weight: 600;
        color: white;
        text-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
      }

      /* 포인트 아이템 */
      .store-points-item {
        background: #f8fafc;
        border-radius: 12px;
        padding: 16px;
        margin-bottom: 12px;
        border: 1px solid #e2e8f0;
        display: flex;
        justify-content: space-between;
        align-items: center;
        cursor: pointer;
        transition: all 0.2s ease;
      }

      .store-points-item:hover {
        background: #f1f5f9;
        border-color: #cbd5e1;
        transform: translateY(-1px);
      }

      .points-store-info {
        flex: 1;
      }

      .points-store-name {
        font-weight: 600;
        color: #1f2937;
        margin-bottom: 4px;
      }

      .points-store-category {
        font-size: 12px;
        color: #6b7280;
        background: #e5e7eb;
        padding: 2px 8px;
        border-radius: 8px;
        display: inline-block;
      }

      .points-amount {
        text-align: right;
      }

      .points-value {
        font-size: 18px;
        font-weight: 700;
        color: #059669;
        display: block;
      }

      .points-label {
        font-size: 11px;
        color: #6b7280;
      }

      /* 바텀 네비게이션 */
      #bottomBar {
        position: fixed;
        bottom: 0;
        left: 50%;
        transform: translateX(-50%);
        width: 100%;
        max-width: 430px;
        height: 78px;
        background: white;
        border-top: 1px solid #e5e7eb;
        display: flex;
        justify-content: space-around;
        align-items: center;
        z-index: 1001;
        padding: 8px 16px 12px 16px;
        box-sizing: border-box;
        box-shadow: 0 -4px 24px rgba(0, 0, 0, 0.1);
      }

      #bottomBar button {
        flex: 1;
        height: 52px;
        border: none;
        background: none;
        color: #9ca3af;
        cursor: pointer;
        transition: all 0.2s ease;
        border-radius: 12px;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
      }

      #bottomBar button:hover {
        background: #f3f4f6;
        color: #6b7280;
      }

      #bottomBar button.active {
        color: #6366f1;
        background: #f0f4ff;
      }

      /* 반응형 */
      @media (max-width: 380px) {
        .mypage-header {
          padding: 16px 16px 0 16px;
        }

        .header-title h1 {
          font-size: 24px;
        }

        .content-wrapper {
          padding: 20px 16px 40px 16px;
        }

        .profile-card {
          padding: 20px;
        }

        .quick-actions {
          grid-template-columns: repeat(4, 1fr);
          gap: 8px;
        }

        .quick-action-item {
          padding: 16px 8px;
        }

        .action-icon {
          font-size: 20px;
        }

        .action-label {
          font-size: 11px;
        }
      }

      
    </style>
  `;

  // 설정 버튼 이벤트 리스너 추가
  const settingsBtn = document.querySelector('#settingsBtn');
  settingsBtn.addEventListener('click', () => {
    if (typeof renderMyAccount === 'function') {
      renderMyAccount();
    } else {
      console.warn('⚠️ renderMyAccount 함수를 찾을 수 없습니다');
    }
  });

  // 전체보기 버튼들 이벤트 리스너
  const viewAllReviewsBtn = document.querySelector('#viewAllReviewsBtn');
  if (viewAllReviewsBtn) {
    viewAllReviewsBtn.addEventListener('click', () => {
      const currentUserInfo = { id: userInfo.id };
      showAllReviewsModal(currentUserInfo);
    });
  }

  const viewAllFavoritesBtn = document.querySelector('#viewAllFavoritesBtn');
  if (viewAllFavoritesBtn) {
    viewAllFavoritesBtn.addEventListener('click', async () => {
      const favoriteStoresData = await loadFavoriteStores(userInfo.id);
      showAllFavoritesModal(favoriteStoresData);
    });
  }

  const viewAllLevelsBtn = document.querySelector('#viewAllLevelsBtn');
  if (viewAllLevelsBtn) {
    viewAllLevelsBtn.addEventListener('click', async () => {
      if (!window.RegularLevelManager) {
        await new Promise((resolve, reject) => {
          const script = document.createElement('script');
          script.src = '/TLG/utils/regularLevelManager.js';
          script.onload = resolve;
          script.onerror = reject;
          document.head.appendChild(script);
        });
      }
      const regularLevels = await window.RegularLevelManager.getUserAllRegularLevels(userInfo.id);
      showAllRegularLevelsModal(regularLevels);
    });
  }

  const viewAllPointsBtn = document.querySelector('#viewAllPointsBtn');
  if (viewAllPointsBtn) {
    viewAllPointsBtn.addEventListener('click', async () => {
      try {
        const response = await fetch(`/api/regular-levels/user/${userInfo.id}/all-points`);
        const data = await response.json();
        if (data.success && data.storePoints) {
          const storesWithPoints = data.storePoints
            .filter(store => store.points > 0)
            .sort((a, b) => b.points - a.points);
          showAllStorePointsModal(storesWithPoints);
        }
      } catch (error) {
        console.error('포인트 정보 조회 실패:', error);
      }
    });
  }

  // 패널 핸들링 설정
  setupMypagePanelHandling();

  // 비동기로 사용자 정보 로드 및 업데이트
  loadUserData();
}

// 마이페이지 패널 핸들링 설정 (renderStore 스타일)
function setupMypagePanelHandling() {
  const panel = document.getElementById('mypagePanel');
  const panelHandle = document.getElementById('mypagePanelHandle');
  const panelContainer = document.getElementById('mypagePanelContainer');

  if (!panel || !panelContainer) return;

  // 레이아웃 조정
  adjustMypagePanelLayout();

  // 이벤트 리스너 설정
  window.addEventListener('resize', () => adjustMypagePanelLayout());
  panel.addEventListener('transitionend', () => adjustMypagePanelLayout());

  // 휠/스크롤 이벤트 설정
  setupMypageWheelEvents(panel, panelContainer);

  // 터치 이벤트 설정
  setupMypageTouchEvents(panel, panelContainer);

  setTimeout(() => adjustMypagePanelLayout(), 0);
}

// 마이페이지 패널 레이아웃 조정
function adjustMypagePanelLayout() {
  const panel = document.getElementById('mypagePanel');
  const panelContainer = document.getElementById('mypagePanelContainer');
  const bottomBar = document.getElementById('bottomBar');
  const panelHandle = document.getElementById('mypagePanelHandle');

  if (!panel || !panelContainer) return;

  const vh = window.innerHeight;
  const top = parseInt(window.getComputedStyle(panel).top, 10) || 0;
  const bottomBarHeight = bottomBar ? bottomBar.offsetHeight : 78;
  const handleHeight = panelHandle ? panelHandle.offsetHeight : 24;
  const panelPadding = 0;

  // 패널 컨테이너 높이 계산
  const panelHeight = vh - top - bottomBarHeight - handleHeight - panelPadding;
  panelContainer.style.height = `${panelHeight}px`;

  // 스크롤 활성화 보장
  panelContainer.style.overflowY = 'auto';
  panelContainer.style.overflowX = 'hidden';
  panelContainer.style.webkitOverflowScrolling = 'touch';

  console.log(`📐 마이페이지 패널 레이아웃 조정: 높이 ${panelHeight}px, 상단 ${top}px`);
}

// 마이페이지 패널 휠 이벤트 설정
function setupMypageWheelEvents(panel, panelContainer) {
  panel.addEventListener('wheel', (e) => {
    const top = parseInt(window.getComputedStyle(panel).top, 10) || 0;
    const isExpanded = top === 0;
    const isCollapsed = !isExpanded;

    // 아래로(내림) - 패널 확장
    if (e.deltaY > 0) {
      if (isCollapsed) {
        e.preventDefault();
        panel.classList.remove('collapsed');
        panel.classList.add('expanded');
        panel.style.top = '0px';
        setTimeout(() => adjustMypagePanelLayout(), 30);
        return;
      }
      // 확장된 상태에서는 스크롤 허용
      return;
    }

    // 위로(올림) - 패널 축소 또는 스크롤
    if (e.deltaY < 0) {
      if (isExpanded) {
        // 스크롤이 맨 위에 있을 때만 패널 축소
        if (panelContainer.scrollTop <= 0) {
          e.preventDefault();
          panel.classList.remove('expanded');
          panel.classList.add('collapsed');
          panel.style.top = '100px';
          setTimeout(() => adjustMypagePanelLayout(), 30);
          return;
        }
        // 스크롤이 중간에 있으면 스크롤 허용
        return;
      }
    }
  });
}

// 마이페이지 패널 터치 이벤트 설정
function setupMypageTouchEvents(panel, panelContainer) {
  let startY = 0;
  let currentY = 0;
  let isDragging = false;
  let initialScrollTop = 0;

  // 터치 시작
  panel.addEventListener('touchstart', (e) => {
    startY = e.touches[0].clientY;
    initialScrollTop = panelContainer.scrollTop;
    isDragging = true;
    panel.style.transition = 'none';
  });

  // 터치 이동
  panel.addEventListener('touchmove', (e) => {
    if (!isDragging) return;

    currentY = e.touches[0].clientY;
    const deltaY = startY - currentY;
    const top = parseInt(window.getComputedStyle(panel).top, 10) || 0;
    const isExpanded = top === 0;
    const isCollapsed = !isExpanded;

    // 확장된 상태에서 스크롤이 맨 위에 있고 위로 드래그하면 패널 축소
    if (isExpanded && initialScrollTop <= 0 && deltaY < 0) {
      e.preventDefault();
      const newTop = Math.max(0, Math.min(100, -deltaY));
      panel.style.top = `${newTop}px`;
      return;
    }

    // 축소된 상태에서 아래로 드래그하면 패널 확장
    if (isCollapsed && deltaY > 0) {
      e.preventDefault();
      const newTop = Math.max(0, Math.min(100, 100 - deltaY));
      panel.style.top = `${newTop}px`;
      return;
    }
  });

  // 터치 종료
  panel.addEventListener('touchend', (e) => {
    if (!isDragging) return;

    isDragging = false;
    const deltaY = startY - currentY;
    const top = parseInt(window.getComputedStyle(panel).top, 10) || 0;

    panel.style.transition = 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)';

    // 드래그 거리에 따라 패널 상태 결정
    if (Math.abs(deltaY) > 50) {
      if (deltaY > 0) {
        // 아래로 드래그 - 확장
        panel.classList.remove('collapsed');
        panel.classList.add('expanded');
        panel.style.top = '0px';
      } else {
        // 위로 드래그 - 축소
        panel.classList.remove('expanded');
        panel.classList.add('collapsed');
        panel.style.top = '100px';
      }
    } else {
      // 드래그 거리가 짧으면 원래 위치로 복원
      if (top < 50) {
        panel.classList.remove('collapsed');
        panel.classList.add('expanded');
        panel.style.top = '0px';
      } else {
        panel.classList.remove('expanded');
        panel.classList.add('collapsed');
        panel.style.top = '100px';
      }
    }

    setTimeout(() => adjustMypagePanelLayout(), 30);
  });
}

// 즐겨찾기 매장을 불러오는 함수
async function loadFavoriteStores(userId) {
  try {
    const response = await fetch(`/api/users/favorites/${userId}`);
    if (!response.ok) {
      throw new Error('즐겨찾기 매장 정보 조회 실패');
    }
    const data = await response.json();
    return data.stores || [];
  } catch (error) {
    console.error('즐겨찾기 매장 로딩 실패:', error);
    return [];
  }
}

// 프로필 섹션 업데이트 함수
async function updateProfileSection(currentUserInfo, ordersData, favoriteStoresData) {
  const profileName = document.getElementById('profileName');
  const profileLevel = document.getElementById('profileLevel');
  const totalOrders = document.getElementById('totalOrders');
  const totalReviews = document.getElementById('totalReviews');
  const favoriteCount = document.getElementById('favoriteCount');
  const profileImage = document.getElementById('profileImage');

  if (!profileName || !profileLevel) return;

  // 사용자명 업데이트
  const displayName = currentUserInfo.name || currentUserInfo.username || userInfo.id;
  profileName.textContent = displayName;

  // 등급 계산 (주문 수 기반)
  const orderCount = ordersData ? ordersData.length : 0;
  let userLevel = '브론즈';
  let levelColor = '#cd7f32';

  if (orderCount >= 50) {
    userLevel = '다이아몬드';
    levelColor = '#b9f2ff';
  } else if (orderCount >= 30) {
    userLevel = '플래티넘';
    levelColor = '#e5e4e2';
  } else if (orderCount >= 15) {
    userLevel = '골드';
    levelColor = '#ffd700';
  } else if (orderCount >= 5) {
    userLevel = '실버';
    levelColor = '#c0c0c0';
  }

  profileLevel.textContent = `${userLevel} 등급`;

  // 통계 정보 업데이트
  if (totalOrders) {
    try {
      const allOrdersResponse = await fetch(`/api/orders/mypage/${userInfo.id}?limit=1000`);
      if (allOrdersResponse.ok) {
        const allOrdersData = await allOrdersResponse.json();
        totalOrders.textContent = allOrdersData.orders?.length || 0;
      } else {
        totalOrders.textContent = orderCount;
      }
    } catch (error) {
      totalOrders.textContent = orderCount;
    }
  }

  if (totalReviews) {
    try {
      const reviewsResponse = await fetch(`/api/reviews/users/${userInfo.id}`);
      if (reviewsResponse.ok) {
        const reviewsData = await reviewsResponse.json();
        totalReviews.textContent = reviewsData.total || 0;
      } else {
        totalReviews.textContent = '0';
      }
    } catch (error) {
      totalReviews.textContent = '0';
    }
  }

  if (favoriteCount) {
    favoriteCount.textContent = favoriteStoresData?.length || 0;
  }

  // 프로필 이미지 업데이트
  if (profileImage) {
    const firstChar = displayName.charAt(0).toUpperCase();
    profileImage.innerHTML = `<span class="avatar-text">${isNaN(firstChar) ? firstChar : '👤'}</span>`;
  }

  console.log('✅ 프로필 섹션 업데이트 완료:', {
    name: displayName,
    level: userLevel,
    orders: totalOrders?.textContent,
    reviews: totalReviews?.textContent,
    favorites: favoriteCount?.textContent
  });
}

// 사용자 데이터를 비동기로 로드하는 함수
async function loadUserData() {
  try {
    const userResponse = await fetch('/api/users/info', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: userInfo.id })
    });

    if (!userResponse.ok) throw new Error('사용자 정보 조회 실패');
    const userData = await userResponse.json();
    const currentUserInfo = userData.user;

    const ordersResponse = await fetch(`/api/orders/mypage/${userInfo.id}?limit=3`);
    let ordersData = [];
    if (ordersResponse.ok) {
      const ordersResult = await ordersResponse.json();
      ordersData = ordersResult.orders || [];
    }

    const favoriteStoresData = await loadFavoriteStores(userInfo.id);

    // 프로필 정보 업데이트
    updateProfileSection(currentUserInfo, ordersData, favoriteStoresData);

    // 각 섹션 업데이트
    await updateOrderList(currentUserInfo, ordersData);
    await updateReviewList(currentUserInfo);
    updateFavoriteStoresUI(favoriteStoresData);
    await updateRegularLevelsList(currentUserInfo);
    await updateStorePointsList(currentUserInfo);

  } catch (error) {
    console.error('사용자 데이터 로딩 실패:', error);
  }
}

// 주문내역 업데이트 함수
async function updateOrderList(currentUserInfo, ordersData) {
  const orderList = document.querySelector('#orderList');
  if (!orderList) return;

  orderList.innerHTML = '';

  if (ordersData && ordersData.length > 0) {
    const reviewCheckPromises = ordersData.map(order => checkOrderHasReview(order.id));
    const reviewStatuses = await Promise.all(reviewCheckPromises);

    ordersData.slice(0, 3).forEach((order, index) => {
      const orderDiv = document.createElement('div');
      orderDiv.className = 'order-item';

      const orderData = order.order_data || {};
      const items = orderData.items ? orderData.items.map(i => `${i.name}(${i.qty}개)`).join(', ') : '메뉴 정보 없음';
      const storeName = orderData.store || order.store_name || '매장 정보 없음';
      const hasReview = reviewStatuses[index];

      orderDiv.innerHTML = `
        <div class="order-info">
          <strong>${storeName}</strong><br>
          ${items}<br>
          <span style="color: #6b7280; font-size: 13px;">
            ${order.final_amount?.toLocaleString() || order.total_amount?.toLocaleString() || '0'}원 •
            ${new Date(order.order_date).toLocaleDateString()}
          </span>
        </div>
        <div class="review-section">
          ${hasReview ?
            `<span style="color: #059669; font-size: 13px; font-weight: 600;">✅ 리뷰 완료</span>` :
            `<button class="review-btn" data-order-id="${order.id}" data-order-index="${index}">리뷰 작성</button>`
          }
        </div>
      `;
      orderList.appendChild(orderDiv);
    });

    document.querySelectorAll('.review-btn').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        const orderIndex = parseInt(e.target.getAttribute('data-order-index'));
        const order = ordersData[orderIndex];
        
        // 리뷰 작성 스크립트 로드
        await loadReviewWriteScript();
        
        // 이전 화면 정보 저장
        window.previousScreen = 'renderMyPage';
        
        // 리뷰 작성 화면으로 이동
        if (typeof renderReviewWrite === 'function') {
          renderReviewWrite(order);
        } else {
          console.error('renderReviewWrite 함수를 찾을 수 없습니다');
        }
      });
    });
  } else {
    orderList.innerHTML = `<p style="color: #6b7280; text-align: center; padding: 20px;">주문 내역이 없습니다.</p>`;
  }
}

// 리뷰내역 업데이트 함수
async function updateReviewList(currentUserInfo) {
  const reviewList = document.querySelector('#reviewList');
  if (!reviewList) return;

  reviewList.innerHTML = '';

  try {
    const response = await fetch(`/api/reviews/users/${currentUserInfo.id}`);
    if (!response.ok) throw new Error('리뷰 조회 실패');

    const data = await response.json();
    if (data.success && data.reviews && data.reviews.length > 0) {
      data.reviews.forEach(review => {
        const reviewDiv = document.createElement('div');
        reviewDiv.className = 'review-item';
        reviewDiv.innerHTML = `
          <div class="review-header">
            <span class="review-store">${review.storeName}</span>
            <span class="review-rating">★ ${review.score}</span>
          </div>
          <div class="review-content">${review.content}</div>
          <div class="review-date">${review.date}</div>
        `;
        reviewList.appendChild(reviewDiv);
      });
    } else {
      reviewList.innerHTML = `<p style="color: #6b7280; text-align: center; padding: 20px;">작성한 리뷰가 없습니다.</p>`;
    }
  } catch (error) {
    console.error('리뷰 조회 실패:', error);
    reviewList.innerHTML = `<p style="color: #ef4444; text-align: center; padding: 20px;">리뷰를 불러올 수 없습니다.</p>`;
  }
}

// 즐겨찾기 매장 UI 업데이트 함수
function updateFavoriteStoresUI(favoriteStoresData) {
  const favoriteStoresListDiv = document.getElementById('favoriteStoresList');
  if (!favoriteStoresListDiv) return;

  favoriteStoresListDiv.innerHTML = '';

  if (favoriteStoresData && favoriteStoresData.length > 0) {
    const displayStores = favoriteStoresData.slice(0, 3);

    displayStores.forEach(store => {
      const favoriteDiv = document.createElement('div');
      favoriteDiv.className = 'favorite-store-item';
      favoriteDiv.innerHTML = `
        <div class="favorite-store-content" onclick="goToStore(${store.id})">
          <div class="favorite-store-name">${store.name}</div>
          <div class="favorite-store-info">${store.category || '기타'} • ${store.address || '주소 정보 없음'}</div>
        </div>
      `;
      favoriteStoresListDiv.appendChild(favoriteDiv);
    });
  } else {
    favoriteStoresListDiv.innerHTML = `<p style="color: #6b7280; text-align: center; padding: 20px;">즐겨찾는 매장이 없습니다.</p>`;
  }
}

// 단골 레벨 업데이트 함수
async function updateRegularLevelsList(currentUserInfo) {
  const regularLevelsListDiv = document.getElementById('regularLevelsList');
  if (!regularLevelsListDiv) return;

  regularLevelsListDiv.innerHTML = '';

  try {
    if (!window.RegularLevelManager) {
      await new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = '/TLG/utils/regularLevelManager.js';
        script.onload = resolve;
        script.onerror = reject;
        document.head.appendChild(script);
      });
    }

    const regularLevels = await window.RegularLevelManager.getUserAllRegularLevels(currentUserInfo.id);

    if (regularLevels && regularLevels.length > 0) {
      const displayLevels = regularLevels.slice(0, 3);

      displayLevels.forEach(levelData => {
        const levelDiv = document.createElement('div');
        levelDiv.className = 'regular-level-item';
        levelDiv.innerHTML = `
          <div class="level-store-header" onclick="goToStore(${levelData.storeId})">
            <div class="level-store-name">${levelData.storeName || '매장 정보 없음'}</div>
            <div class="level-badge" style="background: ${window.RegularLevelManager.getLevelColor(levelData.currentLevel?.rank)}">
              ${levelData.currentLevel ? levelData.currentLevel.name : '신규 고객'}
            </div>
          </div>
          <div style="color: #6b7280; font-size: 13px;">
            ${levelData.visitCount || 0}회 방문 • ${(levelData.points || 0).toLocaleString()}P • ${(levelData.totalSpent || 0).toLocaleString()}원
          </div>
        `;
        regularLevelsListDiv.appendChild(levelDiv);
      });
    } else {
      regularLevelsListDiv.innerHTML = `<p style="color: #6b7280; text-align: center; padding: 20px;">단골 매장이 없습니다.</p>`;
    }
  } catch (error) {
    console.error('단골 레벨 조회 실패:', error);
    regularLevelsListDiv.innerHTML = `<p style="color: #ef4444; text-align: center; padding: 20px;">단골 정보를 불러올 수 없습니다.</p>`;
  }
}

// 매장별 포인트 업데이트 함수
async function updateStorePointsList(currentUserInfo) {
  const storePointsListDiv = document.getElementById('storePointsList');
  if (!storePointsListDiv) return;

  storePointsListDiv.innerHTML = '';

  try {
    const response = await fetch(`/api/regular-levels/user/${currentUserInfo.id}/all-points`);
    if (!response.ok) throw new Error('포인트 조회 실패');

    const data = await response.json();
    if (data.success && data.storePoints && data.storePoints.length > 0) {
      const storesWithPoints = data.storePoints
        .filter(store => store.points > 0)
        .sort((a, b) => b.points - a.points)
        .slice(0, 3);

      if (storesWithPoints.length > 0) {
        storesWithPoints.forEach(store => {
          const pointsDiv = document.createElement('div');
          pointsDiv.className = 'store-points-item';
          pointsDiv.innerHTML = `
            <div class="points-store-info" onclick="goToStore(${store.storeId})">
              <div class="points-store-name">${store.storeName}</div>
              <div class="points-store-category">${store.storeCategory || '기타'}</div>
            </div>
            <div class="points-amount">
              <span class="points-value">${store.points.toLocaleString()}P</span>
              <span class="points-label">보유 포인트</span>
            </div>
          `;
          storePointsListDiv.appendChild(pointsDiv);
        });
      } else {
        storePointsListDiv.innerHTML = `<p style="color: #6b7280; text-align: center; padding: 20px;">보유 포인트가 없습니다.</p>`;
      }
    } else {
      storePointsListDiv.innerHTML = `<p style="color: #6b7280; text-align: center; padding: 20px;">포인트 정보가 없습니다.</p>`;
    }
  } catch (error) {
    console.error('포인트 조회 실패:', error);
    storePointsListDiv.innerHTML = `<p style="color: #ef4444; text-align: center; padding: 20px;">포인트 정보를 불러올 수 없습니다.</p>`;
  }
}

// 주문에 대한 리뷰 존재 여부 확인 함수
async function checkOrderHasReview(orderId) {
  try {
    const response = await fetch(`/api/orders/${orderId}/review-status`);
    const data = await response.json();
    return data.success ? data.hasReview : false;
  } catch (error) {
    console.error(`리뷰 상태 확인 오류:`, error);
    return false;
  }
}

// 리뷰 작성 스크립트 로드 함수
async function loadReviewWriteScript() {
  if (typeof window.renderReviewWrite === 'function') {
    return; // 이미 로드됨
  }

  try {
    console.log('🔄 renderReviewWrite 스크립트 로드 시작');
    const script = document.createElement('script');
    script.src = '/TLG/pages/store/review/renderReviewWrite.js';
    
    await new Promise((resolve, reject) => {
      script.onload = () => {
        console.log('✅ renderReviewWrite 스크립트 로드 완료');
        resolve();
      };
      script.onerror = () => {
        console.error('❌ renderReviewWrite 스크립트 로드 실패');
        reject();
      };
      document.head.appendChild(script);
    });
  } catch (error) {
    console.error('❌ renderReviewWrite 스크립트 로드 중 오류:', error);
    throw error;
  }
}

// 별점 표시 업데이트
function updateStarDisplay(modal, rating) {
  const stars = modal.querySelectorAll('.star');
  stars.forEach((star, index) => {
    if (index < rating) {
      star.classList.add('active');
    } else {
      star.classList.remove('active');
    }
  });
}

// 리뷰 서버 전송
async function submitReviewFromOrders(order, rating, reviewText) {
  const orderData = order.order_data || {};
  const storeName = orderData.store || order.store_name || '매장 정보 없음';

  const reviewData = {
    userId: userInfo.id,
    storeId: order.store_id,
    storeName: storeName,
    orderId: order.id,
    rating: rating,
    reviewText: reviewText,
    orderDate: new Date(order.order_date).toISOString().slice(0, 10)
  };

  const response = await fetch('/api/reviews/submit-from-orders', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(reviewData)
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || '리뷰 등록 실패');
  }

  return response.json();
}

// 매장 상세 페이지로 이동
function goToStore(storeId) {
  if (typeof renderStore === 'function') {
    fetch(`/api/stores/${storeId}`)
      .then(response => response.json())
      .then(storeData => {
        if (storeData.success && storeData.store) {
          renderStore(storeData.store);
        }
      })
      .catch(error => {
        console.error('매장 정보 가져오기 실패:', error);
      });
  }
}

// 모달 함수들
async function showAllReviewsModal(currentUserInfo) {
  try {
    const response = await fetch(`/api/reviews/users/${currentUserInfo.id}`);
    const data = await response.json();

    if (!data.success) throw new Error('리뷰 데이터 조회 실패');

    const modal = document.createElement('div');
    modal.className = 'review-modal';
    modal.innerHTML = `
      <div class="review-modal-content" style="max-height: 80vh; overflow-y: auto;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; position: sticky; top: 0; background: white; padding-bottom: 10px; border-bottom: 1px solid #eee;">
          <h3>⭐ 내 리뷰 전체보기 (${data.total}개)</h3>
          <button class="modal-btn cancel-btn" onclick="this.closest('.review-modal').remove()">✕</button>
        </div>
        <div class="all-reviews-list">
          ${data.reviews.map(review => `
            <div class="review-item" style="cursor: pointer; margin-bottom: 12px;" onclick="closeModalAndGoToStore(${review.storeId})">
              <div class="review-header">
                <span class="review-store">${review.storeName}</span>
                <span class="review-rating">★ ${review.score}</span>
              </div>
              <div class="review-content">${review.content}</div>
              <div class="review-date">${review.date}</div>
            </div>
          `).join('')}
        </div>
      </div>
    `;

    document.body.appendChild(modal);

    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        document.body.removeChild(modal);
      }
    });

  } catch (error) {
    console.error('전체 리뷰 조회 실패:', error);
    alert('리뷰 목록을 불러올 수 없습니다.');
  }
}

async function showAllFavoritesModal(favoriteStoresData) {
  try {
    const modal = document.createElement('div');
    modal.className = 'review-modal';
    modal.innerHTML = `
      <div class="review-modal-content" style="max-height: 80vh; overflow-y: auto;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; position: sticky; top: 0; background: white; padding-bottom: 10px; border-bottom: 1px solid #eee;">
          <h3>💖 전체 즐겨찾기 매장 (${favoriteStoresData.length}개)</h3>
          <button class="modal-btn cancel-btn" onclick="this.closest('.review-modal').remove()">✕</button>
        </div>
        <div class="all-favorites-list">
          ${favoriteStoresData.map(store => `
            <div class="favorite-store-item" style="cursor: pointer; margin-bottom: 12px;" onclick="closeModalAndGoToStore(${store.id})">
              <div class="favorite-store-content">
                <div class="favorite-store-name">${store.name}</div>
                <div class="favorite-store-info">${store.category || '기타'} • ${store.address || '주소 정보 없음'}</div>
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    `;

    document.body.appendChild(modal);

    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        document.body.removeChild(modal);
      }
    });

  } catch (error) {
    console.error('전체 즐겨찾기 조회 실패:', error);
    alert('즐겨찾기 목록을 불러올 수 없습니다.');
  }
}

async function showAllRegularLevelsModal(regularLevels) {
  console.log('showAllRegularLevelsModal 호출됨');
  const modal = document.createElement('div');
  modal.className = 'review-modal';
  modal.innerHTML = `
    <div class="review-modal-content">
      <h3>🏆 전체 단골 레벨</h3>
      <p>단골 레벨 정보 로딩 중...</p>
      <button class="modal-btn cancel-btn" onclick="this.closest('.review-modal').remove()">닫기</button>
    </div>
  `;
  document.body.appendChild(modal);
  modal.addEventListener('click', (e) => {
    if (e.target === modal) {
      document.body.removeChild(modal);
    }
  });
}

async function showAllStorePointsModal(storePoints) {
  console.log('showAllStorePointsModal 호출됨');
  const modal = document.createElement('div');
  modal.className = 'review-modal';
  modal.innerHTML = `
    <div class="review-modal-content" style="max-height: 80vh; overflow-y: auto;">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; position: sticky; top: 0; background: white; padding-bottom: 10px; border-bottom: 1px solid #eee;">
        <h3>💰 전체 매장별 포인트 현황 (${storePoints.length}개)</h3>
        <button class="modal-btn cancel-btn" onclick="this.closest('.review-modal').remove()">✕</button>
      </div>
      <div class="all-store-points-list">
        ${storePoints.map(store => `
          <div class="store-points-modal-item" style="cursor: pointer; margin-bottom: 12px;" onclick="closeModalAndGoToStore(${store.storeId})">
            <div class="points-store-header">
              <div class="points-store-name">${store.storeName}</div>
              <div class="points-store-category">${store.storeCategory || '기타'}</div>
            </div>
            <div class="points-modal-stats">
              <span class="points-value">${store.points.toLocaleString()}P</span> •
              <span>${store.visitCount}회 방문</span> •
              <span>${store.totalSpent.toLocaleString()}원 누적</span>
            </div>
            ${store.lastVisitAt ? `
              <div class="points-modal-last-visit">
                📅 마지막 방문: ${new Date(store.lastVisitAt).toLocaleDateString()}
              </div>
            ` : ''}
          </div>
        `).join('')}
      </div>
    </div>
    <style>
      .store-points-modal-item {
        background: #f8f9fa;
        border-radius: 12px;
        padding: 16px;
        border: 1px solid #e9ecef;
        transition: background 0.2s;
      }
      .store-points-modal-item:hover {
        background: #e9ecef;
      }
      .points-store-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 8px;
      }
      .points-modal-stats {
        color: #666;
        font-size: 14px;
        margin-bottom: 4px;
      }
      .points-modal-stats .points-value {
        color: #28a745;
        font-weight: 600;
      }
      .points-modal-last-visit {
        color: #999;
        font-size: 12px;
      }
    </style>
  `;

  document.body.appendChild(modal);

  modal.addEventListener('click', (e) => {
    if (e.target === modal) {
      document.body.removeChild(modal);
    }
  });
}

// 모달 닫고 매장으로 이동하는 전역 함수
window.closeModalAndGoToStore = function(storeId) {
  const modal = document.querySelector('.review-modal');
  if (modal) {
    document.body.removeChild(modal);
  }
  goToStore(storeId);
};

// 전역 함수로 등록
window.renderMyPage = renderMyPage;