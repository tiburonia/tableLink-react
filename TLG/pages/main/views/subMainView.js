
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
        <div class="header-container">
          <div class="header-left">
            <div class="logo-wrapper">
              <img src="/TableLink.png" alt="TableLink" class="logo" />
              <div class="logo-info">
                <span class="logo-text">TableLink</span>
                <span class="logo-subtitle">오늘의 맛집 추천</span>
              </div>
            </div>
          </div>
          <div class="header-right">
            <button id="weatherBtn" class="header-btn" title="날씨">
              <span class="icon">🌤️</span>
            </button>
            <button id="qrBtn" class="header-btn" onclick="TLL().catch(console.error)" title="QR주문">
              <span class="icon">📱</span>
            </button>
            <button id="notificationBtn" class="header-btn" onclick="renderNotification()" title="알림">
              <span class="icon">🔔</span>
              <span class="badge">3</span>
            </button>
          </div>
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
          <div class="greeting-header">
            <div class="greeting-content">
              <h2 id="greetingText">안녕하세요! 오늘도 맛있는 하루 되세요 😊</h2>
              <p id="greetingSubtext">
                <span class="time-icon">🕐</span>
                <span id="currentTime"></span>
              </p>
            </div>
            <div class="greeting-weather">
              <div id="weatherWidget" class="weather-widget">
                <span class="weather-icon">🌤️</span>
                <div class="weather-info">
                  <span class="weather-temp">--°C</span>
                  <span class="weather-desc">맑음</span>
                </div>
              </div>
            </div>
          </div>
          <div class="greeting-stats">
            <div class="stat-item">
              <span class="stat-icon">🎯</span>
              <div class="stat-info">
                <span class="stat-value">28</span>
                <span class="stat-label">방문</span>
              </div>
            </div>
            <div class="stat-divider"></div>
            <div class="stat-item">
              <span class="stat-icon">⭐</span>
              <div class="stat-info">
                <span class="stat-value">12</span>
                <span class="stat-label">리뷰</span>
              </div>
            </div>
            <div class="stat-divider"></div>
            <div class="stat-item">
              <span class="stat-icon">💰</span>
              <div class="stat-info">
                <span class="stat-value">4,200</span>
                <span class="stat-label">포인트</span>
              </div>
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
        <div class="banner-slider">
          <div class="banner-item active">
            <div class="banner-content">
              <div class="banner-tag">🔥 HOT</div>
              <h3 class="banner-title">신규 회원 특별 혜택</h3>
              <p class="banner-desc">첫 주문 시 20% 할인 쿠폰</p>
            </div>
            <div class="banner-visual">
              <div class="discount-badge">20%</div>
            </div>
          </div>
          <div class="banner-indicators">
            <span class="indicator active"></span>
            <span class="indicator"></span>
            <span class="indicator"></span>
          </div>
        </div>
      </section>
    `;
  },

  /**
   * 퀵 액션 렌더링
   */
  renderQuickActions() {
    return `
      <section id="quickActionsSection">
        <div class="section-header">
          <h2 class="section-title">빠른 메뉴</h2>
          <button class="see-all-btn">전체보기 ›</button>
        </div>
        <div class="quick-actions-scroll">
          <div class="quick-action-item" onclick="TLL().catch(console.error)">
            <div class="action-icon-wrapper gradient-purple">
              <span class="action-icon">📱</span>
            </div>
            <span class="action-label">QR주문</span>
          </div>
          <div class="quick-action-item" onclick="renderMap().catch(console.error)">
            <div class="action-icon-wrapper gradient-blue">
              <span class="action-icon">🗺️</span>
            </div>
            <span class="action-label">주변매장</span>
          </div>
          <div class="quick-action-item" onclick="renderSearch('')">
            <div class="action-icon-wrapper gradient-green">
              <span class="action-icon">🔍</span>
            </div>
            <span class="action-label">검색</span>
          </div>
          <div class="quick-action-item" onclick="renderMyPage()">
            <div class="action-icon-wrapper gradient-orange">
              <span class="action-icon">👤</span>
            </div>
            <span class="action-label">마이페이지</span>
          </div>
          <div class="quick-action-item">
            <div class="action-icon-wrapper gradient-pink">
              <span class="action-icon">🎁</span>
            </div>
            <span class="action-label">쿠폰함</span>
          </div>
          <div class="quick-action-item">
            <div class="action-icon-wrapper gradient-teal">
              <span class="action-icon">📋</span>
            </div>
            <span class="action-label">주문내역</span>
          </div>
        </div>
      </section>
    `;
  },

  /**
   * 즐겨찾기 섹션 렌더링
   */
  renderFavoriteSection() {
    return `
      <section id="favRecentSection">
        <div class="section-header">
          <h2 class="section-title">
            <span class="title-icon">💖</span>
            단골 & 최근 방문
          </h2>
          <button class="see-all-btn">전체 ›</button>
        </div>
        <div class="favorite-container">
          <div class="fav-card enhanced">
            <div class="fav-image">
              <img src="/api/placeholder/120/90" alt="매장" />
              <div class="fav-badge">💖</div>
              <div class="fav-discount">-15%</div>
            </div>
            <div class="fav-info">
              <h4 class="fav-name">맛있는 분식집</h4>
              <div class="fav-rating">
                <span class="stars">⭐⭐⭐⭐⭐</span>
                <span class="rating-num">4.8</span>
              </div>
              <div class="fav-meta">
                <span class="meta-item">🚶 250m</span>
                <span class="meta-divider">•</span>
                <span class="meta-item">⏱️ 15분</span>
              </div>
              <div class="fav-tags">
                <span class="tag">분식</span>
                <span class="tag">배달가능</span>
              </div>
            </div>
          </div>
          <div class="fav-card enhanced">
            <div class="fav-image">
              <img src="/api/placeholder/120/90" alt="매장" />
              <div class="fav-badge">🕒</div>
            </div>
            <div class="fav-info">
              <h4 class="fav-name">행복한 카페</h4>
              <div class="fav-rating">
                <span class="stars">⭐⭐⭐⭐⭐</span>
                <span class="rating-num">4.6</span>
              </div>
              <div class="fav-meta">
                <span class="meta-item">🚶 180m</span>
                <span class="meta-divider">•</span>
                <span class="meta-item">⏱️ 10분</span>
              </div>
              <div class="fav-tags">
                <span class="tag">카페</span>
                <span class="tag">테이크아웃</span>
              </div>
            </div>
          </div>
        </div>
      </section>
    `;
  },

  /**
   * 주변 섹션 렌더링
   */
  renderNearbySection() {
    return `
      <section id="nearbySection">
        <div class="section-header">
          <h2 class="section-title">
            <span class="title-icon">📍</span>
            내 주변 추천
          </h2>
          <button class="filter-btn">
            <span>필터</span>
            <span class="filter-icon">⚙️</span>
          </button>
        </div>
        <div class="category-filters">
          <button class="category-chip active">전체</button>
          <button class="category-chip">한식</button>
          <button class="category-chip">중식</button>
          <button class="category-chip">일식</button>
          <button class="category-chip">양식</button>
          <button class="category-chip">카페</button>
        </div>
        <div class="nearby-list">
          ${this.renderNearbyDummyCards()}
        </div>
      </section>
    `;
  },

  /**
   * 주변 매장 더미 카드 렌더링
   */
  renderNearbyDummyCards() {
    const dummyStores = [
      { name: '신선한 초밥', category: '일식', rating: '4.9', distance: '320m', time: '20분', status: '영업중', tag: '오늘의 특가' },
      { name: '황금 족발', category: '한식', rating: '4.7', distance: '450m', time: '25분', status: '영업중', tag: '배달 가능' },
      { name: '이탈리아 파스타', category: '양식', rating: '4.8', distance: '580m', time: '30분', status: '영업중', tag: '신규 오픈' },
      { name: '건강한 샐러드', category: '샐러드', rating: '4.6', distance: '210m', time: '15분', status: '영업중', tag: '건강식' },
    ];

    return dummyStores.map(store => `
      <div class="nearby-card enhanced">
        <div class="nearby-image">
          <img src="/api/placeholder/80/80" alt="${store.name}" />
          <div class="store-status ${store.status === '영업중' ? 'open' : 'closed'}">${store.status}</div>
        </div>
        <div class="nearby-info">
          <div class="nearby-header">
            <h4 class="nearby-name">${store.name}</h4>
            <button class="nearby-heart">♡</button>
          </div>
          <div class="nearby-rating">
            <span class="rating-star">⭐</span>
            <span class="rating-value">${store.rating}</span>
            <span class="category-tag">${store.category}</span>
          </div>
          <div class="nearby-meta">
            <span class="meta-item">🚶 ${store.distance}</span>
            <span class="meta-divider">•</span>
            <span class="meta-item">⏱️ ${store.time}</span>
          </div>
          <div class="nearby-tag special">${store.tag}</div>
        </div>
        <button class="nearby-qr-btn" onclick="event.stopPropagation();">
          <span class="qr-icon">📱</span>
        </button>
      </div>
    `).join('');
  },

  /**
   * 프로모션 섹션 렌더링
   */
  renderPromoSection() {
    return `
      <section id="promoSection">
        <div class="section-header">
          <h2 class="section-title">
            <span class="title-icon">🎉</span>
            진행중인 혜택
          </h2>
          <button class="see-all-btn">더보기 ›</button>
        </div>
        <div class="promo-grid">
          <div class="promo-card gradient-purple">
            <div class="promo-badge">NEW</div>
            <div class="promo-content">
              <h4 class="promo-title">신규 회원 특별 할인</h4>
              <p class="promo-desc">첫 주문 20% 할인</p>
              <div class="promo-validity">~ 2025.02.28</div>
            </div>
            <div class="promo-icon">🎁</div>
          </div>
          <div class="promo-card gradient-blue">
            <div class="promo-badge">HOT</div>
            <div class="promo-content">
              <h4 class="promo-title">리뷰 작성 이벤트</h4>
              <p class="promo-desc">리뷰 쓰고 포인트 받기</p>
              <div class="promo-validity">~ 2025.03.15</div>
            </div>
            <div class="promo-icon">⭐</div>
          </div>
          <div class="promo-card gradient-green">
            <div class="promo-content">
              <h4 class="promo-title">친구 초대 이벤트</h4>
              <p class="promo-desc">친구 초대하고 쿠폰 받기</p>
              <div class="promo-validity">상시 진행</div>
            </div>
            <div class="promo-icon">👥</div>
          </div>
        </div>
      </section>
    `;
  },

  /**
   * 통계 섹션 렌더링
   */
  renderStatsSection() {
    return `
      <section id="statsSection">
        <div class="section-header">
          <h2 class="section-title">
            <span class="title-icon">📊</span>
            나의 이용 현황
          </h2>
          <button class="stats-detail-btn">상세보기 ›</button>
        </div>
        <div class="stats-container">
          <div class="stats-summary">
            <div class="summary-item">
              <div class="summary-label">이번 달 주문</div>
              <div class="summary-value">
                <span class="value-number">8</span>
                <span class="value-unit">회</span>
                <span class="value-trend up">↑ 2</span>
              </div>
            </div>
            <div class="summary-divider"></div>
            <div class="summary-item">
              <div class="summary-label">이번 달 사용 금액</div>
              <div class="summary-value">
                <span class="value-number">124,000</span>
                <span class="value-unit">원</span>
                <span class="value-trend up">↑ 12%</span>
              </div>
            </div>
          </div>
          <div class="stats-grid">
            <div class="stat-card enhanced">
              <div class="stat-icon-wrapper gradient-purple">
                <span class="stat-icon">📦</span>
              </div>
              <div class="stat-content">
                <div class="stat-value" id="totalOrdersCount">28</div>
                <div class="stat-label">총 주문</div>
              </div>
            </div>
            <div class="stat-card enhanced">
              <div class="stat-icon-wrapper gradient-orange">
                <span class="stat-icon">⭐</span>
              </div>
              <div class="stat-content">
                <div class="stat-value" id="totalReviewsCount">12</div>
                <div class="stat-label">작성 리뷰</div>
              </div>
            </div>
            <div class="stat-card enhanced">
              <div class="stat-icon-wrapper gradient-pink">
                <span class="stat-icon">💖</span>
              </div>
              <div class="stat-content">
                <div class="stat-value" id="favoritesCount">5</div>
                <div class="stat-label">즐겨찾기</div>
              </div>
            </div>
            <div class="stat-card enhanced">
              <div class="stat-icon-wrapper gradient-teal">
                <span class="stat-icon">💰</span>
              </div>
              <div class="stat-content">
                <div class="stat-value" id="totalPointsCount">4,200</div>
                <div class="stat-label">포인트</div>
              </div>
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
        <button onclick="renderSubMain()" class="nav-item active">
          <span class="nav-icon">🏠</span>
          <span class="nav-label">홈</span>
        </button>
        <button onclick="TLL()" class="nav-item">
          <span class="nav-icon">📱</span>
          <span class="nav-label">QR주문</span>
        </button>
        <button onclick="renderMap()" class="nav-item" id="renderMapBtn">
          <span class="nav-icon">📍</span>
          <span class="nav-label">내주변</span>
        </button>
        <button onclick="renderSearch()" class="nav-item">
          <span class="nav-icon">🔍</span>
          <span class="nav-label">검색</span>
        </button>
        <button class="nav-item" onclick="renderMyPage()">
          <span class="nav-icon">👤</span>
          <span class="nav-label">마이</span>
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
