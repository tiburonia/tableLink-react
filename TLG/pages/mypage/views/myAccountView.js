
/**
 * View Layer: DOM 렌더링 전담
 * 순수하게 UI 렌더링만 수행, 비즈니스 로직 없음
 */

export const myAccountView = {
  // 메인 컨테이너 렌더링
  render(data) {
    const main = document.getElementById('main');
    
    // CSS 로드
    this.loadStyles();
    
    // 전역 스타일 리셋
    this.resetGlobalStyles();
    
    // HTML 템플릿 렌더링
    main.innerHTML = this.getTemplate(data);
    
    // 데이터 바인딩
    this.bindData(data);
  },

  // CSS 파일 로드
  loadStyles() {
    if (!document.getElementById('myAccountStyles')) {
      const link = document.createElement('link');
      link.id = 'myAccountStyles';
      link.rel = 'stylesheet';
      link.href = '/TLG/pages/mypage/views/styles/myAccount.css';
      document.head.appendChild(link);
    }
  },

  // 전역 스타일 리셋
  resetGlobalStyles() {
    document.body.style.cssText = '';
    document.documentElement.style.cssText = '';
    const main = document.getElementById('main');
    if (main) main.style.cssText = '';
  },

  // 메인 HTML 템플릿
  getTemplate(data) {
    return `
      <div class="account-wrapper" data-testid="account-wrapper">
        <!-- 헤더 -->
        ${this.getHeaderTemplate()}
        
        <!-- 스크롤 컨텐츠 -->
        <div class="account-content" data-testid="account-content">
          <!-- 프로필 카드 -->
          ${this.getProfileCardTemplate()}
          
          <!-- 통계 그리드 -->
          ${this.getStatsGridTemplate()}
          
          <!-- 단골 레벨 섹션 -->
          ${this.getRegularLevelsTemplate()}
          
          <!-- 퀵 액션 메뉴 -->
          ${this.getQuickMenuTemplate()}
          
          <!-- 최근 활동 -->
          ${this.getRecentActivityTemplate()}
          
          <!-- 개인정보 섹션 -->
          ${this.getPersonalInfoTemplate()}
          
          <!-- 로그아웃 버튼 -->
          ${this.getLogoutTemplate()}
        </div>
      </div>
    `;
  },

  // 헤더 템플릿
  getHeaderTemplate() {
    return `
      <header class="account-header" data-testid="account-header">
        <button class="back-btn" id="backBtn" data-testid="button-back">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="15,18 9,12 15,6"></polyline>
          </svg>
        </button>
        <h1>내 계정</h1>
        <div class="header-spacer"></div>
      </header>
    `;
  },

  // 프로필 카드 템플릿
  getProfileCardTemplate() {
    return `
      <div class="profile-card" data-testid="profile-card">
        <div class="profile-avatar">
          <img id="profileImage" src="" alt="프로필" class="avatar-img" data-testid="img-profile">
          <div class="status-indicator"></div>
        </div>
        <div class="profile-info">
          <h2 id="userName" class="user-name" data-testid="text-username">로딩중...</h2>
          <p id="userEmail" class="user-email" data-testid="text-email">이메일을 불러오는 중...</p>
          <div class="vip-badge" id="vipBadge" data-testid="badge-vip">
            <span class="badge-text">GOLD</span>
          </div>
        </div>
        <button class="edit-profile-btn" id="editProfileBtn" data-testid="button-edit-profile">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="m18 2 4 4-14 14H4v-4L18 2z"></path>
          </svg>
        </button>
      </div>
    `;
  },

  // 통계 그리드 템플릿
  getStatsGridTemplate() {
    return `
      <div class="stats-grid" data-testid="stats-grid">
        <div class="stat-card primary" data-testid="card-stat-orders">
          <div class="stat-icon">🛍️</div>
          <div class="stat-content">
            <span class="stat-number" id="totalOrders" data-testid="text-total-orders">-</span>
            <span class="stat-label">총 주문</span>
          </div>
        </div>
        <div class="stat-card secondary" data-testid="card-stat-points">
          <div class="stat-icon">💎</div>
          <div class="stat-content">
            <span class="stat-number" id="currentPoints" data-testid="text-current-points">-</span>
            <span class="stat-label">포인트</span>
          </div>
        </div>
        <div class="stat-card tertiary" data-testid="card-stat-spent">
          <div class="stat-icon">💰</div>
          <div class="stat-content">
            <span class="stat-number" id="monthlySpent" data-testid="text-monthly-spent">-</span>
            <span class="stat-label">이번달 사용</span>
          </div>
        </div>
      </div>
    `;
  },

  // 단골 레벨 템플릿
  getRegularLevelsTemplate() {
    return `
      <div class="modern-card loyalty-card" data-testid="card-loyalty">
        <div class="card-header loyalty-gradient-header">
          <div class="header-content">
            <div class="header-icon loyalty-icon">🏆</div>
            <div class="header-text">
              <h3>나의 단골 레벨</h3>
              <p>즐겨찾는 매장에서의 등급</p>
            </div>
          </div>
          <button class="view-all-btn modern-btn loyalty-btn" id="viewAllLevelsBtn" data-testid="button-view-all-levels">
            <span>전체보기</span>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path d="M9 18L15 12L9 6" stroke="currentColor" stroke-width="2"/>
            </svg>
          </button>
        </div>
        <div class="card-body loyalty-body">
          <div class="regular-levels-container" id="regularLevelsContainer" data-testid="container-regular-levels">
            <div class="loading-skeleton modern-skeleton">
              <div class="skeleton-shimmer"></div>
              <span>단골 레벨 정보를 불러오는 중...</span>
            </div>
          </div>
        </div>
      </div>
    `;
  },

  // 퀵 메뉴 템플릿
  getQuickMenuTemplate() {
    return `
      <div class="modern-card quick-menu-card" data-testid="card-quick-menu">
        <div class="card-header">
          <div class="header-content">
            <div class="header-icon">⚡</div>
            <div class="header-text">
              <h3>빠른 메뉴</h3>
              <p>자주 사용하는 기능들</p>
            </div>
          </div>
        </div>
        <div class="card-body no-padding">
          <div class="quick-menu-grid modern-grid">
            <button class="quick-menu-item modern-item" id="couponBtn" data-testid="button-coupon">
              <div class="item-background"></div>
              <div class="item-content">
                <div class="menu-icon">🎫</div>
                <span class="menu-label">쿠폰함</span>
                <div class="menu-badge" id="couponBadge" data-testid="badge-coupon">3</div>
              </div>
              <div class="item-hover-effect"></div>
            </button>
            <button class="quick-menu-item modern-item" id="favoritesBtn" data-testid="button-favorites">
              <div class="item-background"></div>
              <div class="item-content">
                <div class="menu-icon">⭐</div>
                <span class="menu-label">즐겨찾기</span>
              </div>
              <div class="item-hover-effect"></div>
            </button>
            <button class="quick-menu-item modern-item" id="achievementsBtn" data-testid="button-achievements">
              <div class="item-background"></div>
              <div class="item-content">
                <div class="menu-icon">🏆</div>
                <span class="menu-label">업적</span>
              </div>
              <div class="item-hover-effect"></div>
            </button>
            <button class="quick-menu-item modern-item" id="settingsBtn" data-testid="button-settings">
              <div class="item-background"></div>
              <div class="item-content">
                <div class="menu-icon">⚙️</div>
                <span class="menu-label">설정</span>
              </div>
              <div class="item-hover-effect"></div>
            </button>
          </div>
        </div>
      </div>
    `;
  },

  // 최근 활동 템플릿
  getRecentActivityTemplate() {
    return `
      <div class="modern-card activity-card" data-testid="card-activity">
        <div class="card-header activity-gradient-header">
          <div class="header-content">
            <div class="header-icon activity-icon">📈</div>
            <div class="header-text">
              <h3>최근 활동</h3>
              <p>최근 주문 내역</p>
            </div>
          </div>
          <button class="view-all-btn modern-btn activity-btn" id="viewAllOrdersBtn" data-testid="button-view-all-orders">
            <span>전체보기</span>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path d="M9 18L15 12L9 6" stroke="currentColor" stroke-width="2"/>
            </svg>
          </button>
        </div>
        <div class="card-body activity-body">
          <div class="activity-list modern-list" id="recentOrdersList" data-testid="list-recent-orders">
            <div class="loading-skeleton modern-skeleton">
              <div class="skeleton-shimmer"></div>
              <span>주문 내역을 불러오는 중...</span>
            </div>
          </div>
        </div>
      </div>
    `;
  },

  // 개인정보 템플릿
  getPersonalInfoTemplate() {
    return `
      <div class="modern-card info-card" data-testid="card-personal-info">
        <div class="card-header gradient-header info-gradient">
          <div class="header-content">
            <div class="header-icon">👤</div>
            <div class="header-text">
              <h3>개인정보</h3>
              <p>계정 및 프로필 정보</p>
            </div>
          </div>
          <button class="edit-btn modern-btn" id="editPersonalInfoBtn" data-testid="button-edit-personal-info">
            <span>수정</span>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" stroke="currentColor" stroke-width="2"/>
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" stroke="currentColor" stroke-width="2"/>
            </svg>
          </button>
        </div>
        <div class="card-body">
          <div class="personal-info-list modern-info-list" id="personalInfoList" data-testid="list-personal-info">
            <div class="loading-skeleton modern-skeleton">
              <div class="skeleton-shimmer"></div>
              <span>개인정보를 불러오는 중...</span>
            </div>
          </div>
        </div>
      </div>
    `;
  },

  // 로그아웃 템플릿
  getLogoutTemplate() {
    return `
      <div class="logout-section">
        <button class="logout-btn" id="logoutBtn" data-testid="button-logout">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
            <polyline points="16,17 21,12 16,7"></polyline>
            <line x1="21" y1="12" x2="9" y2="12"></line>
          </svg>
          로그아웃
        </button>
      </div>
    `;
  },

  // 데이터 바인딩
  bindData(data) {
    this.updateProfileHeader(data);
    this.updateStatsGrid(data);
    this.updateRegularLevels(data);
    this.updateRecentActivity(data);
    this.updatePersonalInfo(data);
  },

  // 프로필 헤더 업데이트
  updateProfileHeader(data) {
    const profileImage = document.getElementById('profileImage');
    const userName = document.getElementById('userName');
    const userEmail = document.getElementById('userEmail');
    const vipBadge = document.getElementById('vipBadge');

    if (profileImage) profileImage.src = data.profileImage;
    if (userName) userName.textContent = data.name;
    if (userEmail) userEmail.textContent = data.email;

    if (vipBadge) {
      vipBadge.innerHTML = `<span class="badge-text">${data.vipLevel}</span>`;
      
      const vipColors = {
        'PLATINUM': 'linear-gradient(135deg, #9ca3af, #6b7280)',
        'GOLD': 'linear-gradient(135deg, #fbbf24, #f59e0b)',
        'SILVER': 'linear-gradient(135deg, #d1d5db, #9ca3af)',
        'BRONZE': 'linear-gradient(135deg, #d97706, #92400e)'
      };
      
      vipBadge.style.background = vipColors[data.vipLevel] || vipColors['BRONZE'];
    }
  },

  // 통계 그리드 업데이트
  updateStatsGrid(data) {
    const totalOrders = document.getElementById('totalOrders');
    const currentPoints = document.getElementById('currentPoints');
    const monthlySpent = document.getElementById('monthlySpent');

    if (totalOrders) totalOrders.textContent = data.totalOrders;
    if (currentPoints) currentPoints.textContent = `${data.point.toLocaleString()}P`;
    if (monthlySpent) monthlySpent.textContent = `${data.monthlyStats.currentMonth.spent.toLocaleString()}원`;
  },

  // 단골 레벨 업데이트
  updateRegularLevels(data) {
    const container = document.getElementById('regularLevelsContainer');
    if (!container) return;

    if (data.regularLevels && data.regularLevels.length > 0) {
      container.innerHTML = data.regularLevels.slice(0, 3).map((levelInfo, index) => `
        <div class="regular-level-item" data-testid="item-regular-level-${index}">
          <div class="level-store-name">
            <span>${levelInfo.store}</span>
            <span class="level-badge">${levelInfo.level}</span>
          </div>
          <div class="level-progress">🎯 ${levelInfo.points} / ${levelInfo.nextLevelPoints} 포인트</div>
          <div class="level-benefits">${levelInfo.benefits.join(', ')}</div>
        </div>
      `).join('');
    } else {
      container.innerHTML = `
        <div class="modern-skeleton">
          <div class="skeleton-shimmer"></div>
          <span>등록된 단골 레벨이 없습니다</span>
        </div>
      `;
    }
  },

  // 최근 활동 업데이트
  updateRecentActivity(data) {
    const activityList = document.getElementById('recentOrdersList');
    if (!activityList) return;

    const recentOrders = data.orderList.slice(0, 3);

    if (recentOrders.length > 0) {
      activityList.innerHTML = recentOrders.map((order, index) => `
        <div class="activity-item" data-testid="item-activity-${index}">
          <div class="activity-store">🏪 ${order.store}</div>
          <div class="activity-items">${order.items.map(item => `${item.name} × ${item.qty}`).join(', ')}</div>
          <div class="activity-meta">
            <span class="activity-date">📅 ${order.date}</span>
            <span class="activity-total">${order.total.toLocaleString()}원</span>
          </div>
        </div>
      `).join('');
    } else {
      activityList.innerHTML = `
        <div class="modern-skeleton">
          <div class="skeleton-shimmer"></div>
          <span>최근 주문 내역이 없습니다</span>
        </div>
      `;
    }
  },

  // 개인정보 업데이트
  updatePersonalInfo(data) {
    const personalInfoList = document.getElementById('personalInfoList');
    if (!personalInfoList) return;

    personalInfoList.innerHTML = `
      <div class="info-item" data-testid="info-phone">
        <span class="info-label">전화번호</span>
        <span class="info-value">${data.phone}</span>
      </div>
      <div class="info-item" data-testid="info-email">
        <span class="info-label">이메일</span>
        <span class="info-value">${data.email}</span>
      </div>
      <div class="info-item" data-testid="info-joindate">
        <span class="info-label">가입일</span>
        <span class="info-value">${data.joinDate}</span>
      </div>
      <div class="info-item" data-testid="info-totalspent">
        <span class="info-label">총 사용금액</span>
        <span class="info-value">${data.totalSpent.toLocaleString()}원</span>
      </div>
      <div class="info-item" data-testid="info-viplevel">
        <span class="info-label">VIP 등급</span>
        <span class="info-value">${data.vipLevel}</span>
      </div>
      <div class="info-item" data-testid="info-points">
        <span class="info-label">보유 포인트</span>
        <span class="info-value">${data.point.toLocaleString()}P</span>
      </div>
    `;
  }
};

export default myAccountView;
