
/**
 * SubMain View
 * 서브메인 UI 렌더링 레이어
 */

export const subMainView = {
  /**
   * 메인 레이아웃 렌더링
   */
  renderLayout() {
    return `
      <main id="subContent">
        <!-- 헤더 -->
        ${this.renderHeader()}

        <!-- 인사말 섹션 -->
        ${this.renderGreetingSection()}

        <!-- 이벤트 배너 -->
        ${this.renderEventBanner()}

        <!-- 퀵 액션 -->
        ${this.renderQuickActions()}

        <!-- 단골 & 최근 -->
        ${this.renderFavoriteSection()}

        <!-- 내 주변 추천 -->
        ${this.renderNearbySection()}

        <!-- 혜택 섹션 -->
        ${this.renderPromoSection()}

        <!-- 통계 섹션 -->
        ${this.renderStatsSection()}
      </main>

      ${this.renderBottomNav()}
    `;
  },

  /**
   * 헤더 렌더링
   */
  renderHeader() {
    return `
      <header id="subHeader">
        <div class="header-left">
          <img src="/TableLink.png" alt="TableLink" class="logo" />
          <span class="logo-text">TableLink</span>
        </div>
        <div class="header-right">
          <button id="weatherBtn" class="header-btn" title="날씨">🌤️</button>
          <button id="qrBtn" class="header-btn" onclick="TLL().catch(console.error)" title="QR주문">📱</button>
          <button id="notificationBtn" class="header-btn" onclick="renderNotification()" title="알림">🔔</button>
        </div>
      </header>
    `;
  },

  /**
   * 인사말 섹션 렌더링
   */
  renderGreetingSection() {
    return `
      <section id="greetingSection">
        <div class="greeting-card">
          <div class="greeting-content">
            <h2 id="greetingText">안녕하세요! 오늘도 맛있는 하루 되세요 😊</h2>
            <p id="greetingSubtext">현재 시간: <span id="currentTime"></span></p>
          </div>
          <div class="greeting-weather">
            <div id="weatherWidget" class="weather-widget">
              <span class="weather-icon">🌤️</span>
              <span class="weather-temp">--°C</span>
            </div>
          </div>
        </div>
      </section>
    `;
  },

  /**
   * 이벤트 배너 렌더링
   */
  renderEventBanner() {
    return `
      <section id="eventBannerSection">
        <div id="eventBannerContainer"></div>
      </section>
    `;
  },

  /**
   * 퀵 액션 렌더링
   */
  renderQuickActions() {
    return `
      <section id="quickActionsSection">
        <h2 class="section-title">빠른 실행</h2>
        <div id="quickActionsContainer"></div>
      </section>
    `;
  },

  /**
   * 즐겨찾기 섹션 렌더링
   */
  renderFavoriteSection() {
    return `
      <section id="favRecentSection">
        <h2 class="section-title">단골 & 최근 방문</h2>
        <div id="favRecentContainer"></div>
      </section>
    `;
  },

  /**
   * 주변 섹션 렌더링
   */
  renderNearbySection() {
    return `
      <section id="nearbySection">
        <h2 class="section-title">내 주변 추천</h2>
        <div id="nearbyContainer"></div>
        <div id="nearbyLoadMore" style="display: none;">
          <button id="loadMoreBtn" class="load-more-btn">더보기</button>
        </div>
      </section>
    `;
  },

  /**
   * 프로모션 섹션 렌더링
   */
  renderPromoSection() {
    return `
      <section id="promoSection">
        <h2 class="section-title">진행중인 혜택</h2>
        <div id="promoContainer"></div>
      </section>
    `;
  },

  /**
   * 통계 섹션 렌더링
   */
  renderStatsSection() {
    return `
      <section id="statsSection">
        <h2 class="section-title">나의 이용 현황</h2>
        <div id="statsContainer">
          <div class="stats-grid">
            <div class="stat-card">
              <div class="stat-icon">📦</div>
              <div class="stat-value" id="totalOrdersCount">-</div>
              <div class="stat-label">총 주문</div>
            </div>
            <div class="stat-card">
              <div class="stat-icon">⭐</div>
              <div class="stat-value" id="totalReviewsCount">-</div>
              <div class="stat-label">작성 리뷰</div>
            </div>
            <div class="stat-card">
              <div class="stat-icon">💖</div>
              <div class="stat-value" id="favoritesCount">-</div>
              <div class="stat-label">즐겨찾기</div>
            </div>
            <div class="stat-card">
              <div class="stat-icon">💰</div>
              <div class="stat-value" id="totalPointsCount">-</div>
              <div class="stat-label">보유 포인트</div>
            </div>
          </div>
        </div>
      </section>
    `;
  },

  /**
   * 바텀 네비게이션 렌더링
   */
  renderBottomNav() {
    return `
      <nav class="bottom-nav-bar">
        <button id="homeBtn" class="nav-item active" title="홈" onclick="renderSubMain()">
          <span class="nav-icon">🏠</span>
        </button>
        <button id="tllBtn" class="nav-item" title="QR주문" onclick="TLL().catch(console.error)">
          <span class="nav-icon">📱</span>
        </button>
        <button id="renderMapBtn" class="nav-item" title="지도" onclick="renderMap().catch(console.error)">
          <span class="nav-icon">📍</span>
        </button>
        <button id="searchBtn" class="nav-item" title="검색" onclick="renderSearch('')">
          <span class="nav-icon">🔍</span>
        </button>
        <button class="nav-item" onclick="renderMyPage()" title="마이페이지">
          <span class="nav-icon">👤</span>
        </button>
      </nav>
    `;
  },

  /**
   * 퀵 액션 카드 렌더링
   */
  renderQuickActionCards() {
    const actions = [
      {
        icon: '📱',
        text: 'QR 주문',
        action: 'TLL().catch(console.error)',
        color: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
      },
      {
        icon: '🗺️',
        text: '매장 찾기',
        action: 'renderMap().catch(console.error)',
        color: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)'
      },
      {
        icon: '🔍',
        text: '검색',
        action: "renderSearch('')",
        color: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)'
      },
      {
        icon: '👤',
        text: '마이페이지',
        action: 'renderMyPage()',
        color: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)'
      }
    ];

    return `
      <div class="quick-actions-grid">
        ${actions.map((action, index) => `
          <button class="quick-action-card enhanced" onclick="${action.action}" style="background: ${action.color};">
            <div class="quick-action-icon">${action.icon}</div>
            <div class="quick-action-text">${action.text}</div>
          </button>
        `).join('')}
      </div>
    `;
  },

  /**
   * 즐겨찾기 카드 렌더링
   */
  renderFavoriteCards(stores) {
    if (!stores || stores.length === 0) {
      return `
        <div class="empty-state">
          <div class="empty-icon">🏪</div>
          <div class="empty-text">아직 방문한 매장이 없어요</div>
          <div class="empty-subtitle">새로운 맛집을 발견해보세요!</div>
        </div>
      `;
    }

    return `
      <div class="horizontal-scroll">
        ${stores.map(store => `
          <div class="fav-card enhanced" onclick="goToStore(${store.id})">
            <div class="fav-thumb">
              <img src="/api/placeholder/96/72" alt="${store.name}" onerror="this.style.display='none'">
              <div class="fav-badge">${store.type === 'favorite' ? '💖' : '🕒'}</div>
            </div>
            <div class="fav-info">
              <div class="fav-name">${store.name}</div>
              <div class="fav-rating">
                <span class="rating-star">★</span>
                <span class="rating-value">${store.ratingAverage || '0.0'}</span>
              </div>
            </div>
          </div>
        `).join('')}
      </div>
    `;
  },

  /**
   * 주변 매장 카드 렌더링
   */
  renderNearbyCards(stores) {
    if (!stores || stores.length === 0) {
      return `
        <div class="empty-state">
          <div class="empty-icon">📍</div>
          <div class="empty-text">주변 매장을 찾을 수 없어요</div>
          <div class="empty-subtitle">위치 권한을 확인하거나 다른 지역을 검색해보세요</div>
        </div>
      `;
    }

    return `
      <div class="nearby-list">
        ${stores.map(store => `
          <div class="nearby-card enhanced" onclick="goToStore(${store.id})">
            <div class="nearby-thumb">
              <img src="/api/placeholder/60/60" alt="${store.name}" onerror="this.style.display='none'">
            </div>
            <div class="nearby-info">
              <div class="nearby-name">${store.name}</div>
              <div class="nearby-details">
                <span class="rating">★ ${store.ratingAverage || '0.0'}</span>
                <span class="category">${store.category || '기타'}</span>
              </div>
              <div class="nearby-distance">${store.distance || '거리 정보 없음'}</div>
            </div>
            <button class="nearby-qr" onclick="event.stopPropagation(); selectStoreAndTLL(${store.id})" title="QR 주문">
              📱
            </button>
          </div>
        `).join('')}
      </div>
    `;
  },

  /**
   * 프로모션 배너 렌더링
   */
  renderPromoBanner(promotions) {
    if (!promotions || promotions.length === 0) {
      return `
        <div class="empty-state">
          <div class="empty-icon">🎉</div>
          <div class="empty-text">진행중인 혜택이 없어요</div>
          <div class="empty-subtitle">새로운 혜택이 곧 업데이트될 예정입니다</div>
        </div>
      `;
    }

    const promo = promotions[0];
    return `
      <div class="promo-banner enhanced" onclick="handlePromoClick(${promo.id})">
        <div class="promo-content">
          <div class="promo-title">${promo.title || '특별 혜택'}</div>
          <div class="promo-description">${promo.description || '자세한 내용을 확인해보세요!'}</div>
        </div>
        <div class="promo-image">
          <img src="/api/placeholder/300/120" alt="프로모션" onerror="this.style.display='none'">
        </div>
      </div>
    `;
  },

  /**
   * 스켈레톤 UI 렌더링
   */
  renderSkeletonCards(count) {
    return Array.from({ length: count }, () => `
      <div class="skeleton-card">
        <div class="skeleton-shimmer"></div>
      </div>
    `).join('');
  }
};
