/**
 * 내정보 관리 View - 네이티브 앱 스타일
 * 계정 정보 및 SNS 연동 관리 페이지
 */

export const accountSettingsView = {
  /**
   * 메인 렌더링
   */
  render(data) {
    const main = document.getElementById('main');
    if (!main) {
      console.error('❌ main 요소를 찾을 수 없습니다');
      return;
    }

    main.innerHTML = this.getTemplate(data);
    this.injectStyles();
    console.log('✅ accountSettingsView 렌더링 완료');
  },

  /**
   * 메인 템플릿
   */
  getTemplate(data) {
    const { userInfo, snsConnections } = data;

    return `
      <div class="account-settings-wrapper">
        <!-- 헤더 -->
        ${this.getHeaderTemplate()}
        
        <!-- 스크롤 컨텐츠 -->
        <div class="account-settings-content">
          <!-- SNS 연동 섹션 -->
          ${this.getSNSSection(snsConnections)}
          
          <!-- 계정 정보 섹션 -->
          ${this.getAccountInfoSection(userInfo)}
          
          <!-- 하단 버튼 영역 -->
          ${this.getFooterButtons()}
        </div>
      </div>
    `;
  },

  /**
   * 헤더 템플릿
   */
  getHeaderTemplate() {
    return `
      <header class="settings-header">
        <button class="header-back-btn" id="backBtn">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path d="M15 18L9 12L15 6" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </button>
        <h1 class="header-title">내정보 관리</h1>
        <div class="header-spacer"></div>
      </header>
    `;
  },

  /**
   * SNS 연동 섹션
   */
  getSNSSection(connections = {}) {
    return `
      <section class="settings-section">
        <div class="section-header-settings">
          <h2 class="section-title-settings">SNS 연동</h2>
          <p class="section-subtitle-settings">연동된 계정으로 로그인할 수 있어요</p>
        </div>
        <div class="sns-buttons-container">
          <button class="sns-button kakao ${connections.kakao ? 'connected' : ''}" id="kakaoBtn" data-sns="kakao">
            <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
              <circle cx="16" cy="16" r="16" fill="#FEE500"/>
              <path d="M16 8C11.029 8 7 11.134 7 15C7 17.395 8.604 19.484 11 20.71V24L14.29 22.35C14.85 22.45 15.42 22.5 16 22.5C20.971 22.5 25 19.366 25 15.5C25 11.634 20.971 8 16 8Z" fill="#3C1E1E"/>
            </svg>
            <span>카카오톡</span>
          </button>
          
          <button class="sns-button naver ${connections.naver ? 'connected' : ''}" id="naverBtn" data-sns="naver">
            <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
              <circle cx="16" cy="16" r="16" fill="#03C75A"/>
              <path d="M18.5 16L13.5 9H9V23H13.5V16L18.5 23H23V9H18.5V16Z" fill="white"/>
            </svg>
            <span>네이버</span>
          </button>
          
          <button class="sns-button apple ${connections.apple ? 'connected' : ''}" id="appleBtn" data-sns="apple">
            <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
              <circle cx="16" cy="16" r="16" fill="#000000"/>
              <path d="M16.5 11.5C15.83 11.5 14.9 12.08 14.1 12.08C13.24 12.08 12.43 11.53 11.68 11.53C10.14 11.53 8.5 12.69 8.5 15.39C8.5 16.96 9.05 18.61 9.85 20.05C10.52 21.24 11.09 22.22 11.97 22.22C12.67 22.22 13.13 21.72 14.04 21.72C14.97 21.72 15.34 22.21 16.18 22.21C17.06 22.21 17.67 21.13 18.34 19.94C19.09 18.58 19.38 17.25 19.4 17.18C19.38 17.17 17.65 16.5 17.65 14.53C17.65 12.89 18.99 12.09 19.06 12.04C18.24 10.85 16.97 10.73 16.5 10.71V11.5ZM18.72 10.28C19.32 9.56 19.74 8.56 19.74 7.56C19.74 7.41 19.73 7.26 19.7 7.14C18.73 7.18 17.55 7.79 16.87 8.56C16.31 9.18 15.8 10.17 15.8 11.19C15.8 11.35 15.83 11.51 15.84 11.56C15.91 11.57 16.03 11.59 16.15 11.59C17.01 11.59 18.14 11.01 18.72 10.28Z" fill="white"/>
            </svg>
            <span>애플</span>
          </button>
        </div>
      </section>
    `;
  },

  /**
   * 계정 정보 섹션
   */
  getAccountInfoSection(userInfo) {
    const nickname = userInfo?.name || userInfo?.username || '사용자';
    const email = userInfo?.email || '';
    const phone = userInfo?.phone || '';
    const isEmailVerified = email.includes('appleid.com') || userInfo?.emailVerified;

    return `
      <section class="settings-section">
        <div class="section-header-settings">
          <h2 class="section-title-settings">계정 정보</h2>
        </div>
        <div class="account-info-list">
          <!-- 닉네임 -->
          <div class="info-row" id="nicknameRow">
            <span class="info-label">닉네임</span>
            <div class="info-value-container">
              <span class="info-value">${nickname}</span>
              <svg class="arrow-icon" width="20" height="20" viewBox="0 0 20 20" fill="none">
                <path d="M7 15L12 10L7 5" stroke="#86868b" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </div>
          </div>

          <!-- 이메일 -->
          <div class="info-row" id="emailRow">
            <span class="info-label">이메일</span>
            <div class="info-value-container">
              <span class="info-value">${email || '등록된 이메일 없음'}</span>
              ${isEmailVerified ? '<span class="verified-badge">인증 완료</span>' : ''}
              <svg class="arrow-icon" width="20" height="20" viewBox="0 0 20 20" fill="none">
                <path d="M7 15L12 10L7 5" stroke="#86868b" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </div>
          </div>

          <!-- 휴대폰번호 -->
          <div class="info-row" id="phoneRow">
            <span class="info-label">휴대폰번호</span>
            <div class="info-value-container">
              <span class="info-value">${phone || '등록된 번호 없음'}</span>
              <svg class="arrow-icon" width="20" height="20" viewBox="0 0 20 20" fill="none">
                <path d="M7 15L12 10L7 5" stroke="#86868b" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </div>
          </div>

          <!-- 비밀번호 -->
          <div class="info-row" id="passwordRow">
            <span class="info-label">비밀번호</span>
            <div class="info-value-container">
              <span class="info-value password-text">새로운 비밀번호로 변경 가능</span>
              <svg class="arrow-icon" width="20" height="20" viewBox="0 0 20 20" fill="none">
                <path d="M7 15L12 10L7 5" stroke="#86868b" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </div>
          </div>
        </div>
      </section>
    `;
  },

  /**
   * 하단 버튼 영역
   */
  getFooterButtons() {
    return `
      <div class="footer-buttons">
        <button class="text-button" id="withdrawBtn">회원탈퇴</button>
        <button class="text-button" id="logoutBtn">로그아웃</button>
      </div>
    `;
  },

  /**
   * 스타일 주입
   */
  injectStyles() {
    const styleId = 'account-settings-styles';
    if (document.getElementById(styleId)) return;

    const style = document.createElement('style');
    style.id = styleId;
    style.textContent = this.getStyles();
    document.head.appendChild(style);
  },

  /**
   * CSS 스타일
   */
  getStyles() {
    return `
      /* 메인 래퍼 */
      .account-settings-wrapper {
        width: 100%;
        height: 100vh;
        background: #ffffff;
        display: flex;
        flex-direction: column;
        overflow: hidden;
      }

      /* 헤더 */
      .settings-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 16px 20px;
        padding-top: max(16px, env(safe-area-inset-top));
        background: #ffffff;
        border-bottom: 1px solid #f5f5f7;
        position: sticky;
        top: 0;
        z-index: 100;
      }

      .header-back-btn {
        width: 40px;
        height: 40px;
        border: none;
        background: transparent;
        color: #1d1d1f;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        transition: all 0.2s;
        border-radius: 50%;
      }

      .header-back-btn:active {
        background: #f5f5f7;
        transform: scale(0.95);
      }

      .header-title {
        margin: 0;
        font-size: 17px;
        font-weight: 700;
        color: #1d1d1f;
        letter-spacing: -0.3px;
      }

      .header-spacer {
        width: 40px;
      }

      /* 컨텐츠 */
      .account-settings-content {
        flex: 1;
        overflow-y: auto;
        -webkit-overflow-scrolling: touch;
        padding: 20px;
        padding-bottom: max(20px, env(safe-area-inset-bottom));
      }

      /* 섹션 */
      .settings-section {
        margin-bottom: 32px;
      }

      .section-header-settings {
        margin-bottom: 16px;
      }

      .section-title-settings {
        margin: 0 0 6px 0;
        font-size: 20px;
        font-weight: 800;
        color: #1d1d1f;
        letter-spacing: -0.3px;
      }

      .section-subtitle-settings {
        margin: 0;
        font-size: 14px;
        color: #86868b;
        font-weight: 500;
      }

      /* SNS 버튼 컨테이너 */
      .sns-buttons-container {
        display: flex;
        gap: 12px;
        justify-content: space-between;
      }

      .sns-button {
        flex: 1;
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 10px;
        padding: 20px 12px;
        background: #f5f5f7;
        border: 1px solid #e5e5e7;
        border-radius: 16px;
        cursor: pointer;
        transition: all 0.2s;
        position: relative;
      }

      .sns-button:active {
        transform: scale(0.97);
        background: #e5e5e7;
      }

      .sns-button.connected::before {
        content: '✓';
        position: absolute;
        top: 8px;
        right: 8px;
        width: 20px;
        height: 20px;
        background: #34c759;
        color: white;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 12px;
        font-weight: 700;
      }

      .sns-button span {
        font-size: 13px;
        font-weight: 600;
        color: #1d1d1f;
      }

      /* 계정 정보 리스트 */
      .account-info-list {
        background: #ffffff;
        border-radius: 16px;
        overflow: hidden;
        border: 1px solid #f5f5f7;
      }

      .info-row {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 16px 20px;
        border-bottom: 1px solid #f5f5f7;
        cursor: pointer;
        transition: background 0.2s;
      }

      .info-row:last-child {
        border-bottom: none;
      }

      .info-row:active {
        background: #f5f5f7;
      }

      .info-label {
        font-size: 15px;
        font-weight: 600;
        color: #1d1d1f;
      }

      .info-value-container {
        display: flex;
        align-items: center;
        gap: 8px;
      }

      .info-value {
        font-size: 15px;
        color: #86868b;
        max-width: 200px;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      .password-text {
        font-size: 13px;
      }

      .verified-badge {
        padding: 4px 8px;
        background: #34c759;
        color: white;
        border-radius: 6px;
        font-size: 11px;
        font-weight: 700;
        white-space: nowrap;
      }

      .arrow-icon {
        flex-shrink: 0;
      }

      /* 하단 버튼 */
      .footer-buttons {
        display: flex;
        gap: 16px;
        justify-content: center;
        margin-top: 40px;
        padding: 20px 0;
      }

      .text-button {
        padding: 12px 20px;
        background: transparent;
        border: none;
        color: #86868b;
        font-size: 15px;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.2s;
        border-radius: 8px;
      }

      .text-button:active {
        background: #f5f5f7;
        transform: scale(0.95);
      }

      /* 반응형 */
      @media (max-width: 480px) {
        .sns-buttons-container {
          flex-direction: column;
        }

        .sns-button {
          flex-direction: row;
          justify-content: flex-start;
          padding: 16px;
        }

        .info-value {
          max-width: 150px;
        }
      }

      /* 터치 최적화 */
      * {
        -webkit-tap-highlight-color: transparent;
      }
    `;
  }
};

export default accountSettingsView;
