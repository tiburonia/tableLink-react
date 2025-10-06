
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

        <!-- 메인 컨텐츠 영역 -->
        <div class="main-scroll-container">
          <!-- 히어로 섹션 -->
          ${this.renderHeroSection()}

          <!-- 퀵 액션 -->
          ${this.renderQuickActions()}

          <!-- 추천 매장 -->
          ${this.renderRecommendedStores()}

          <!-- 단골 & 최근 -->
          ${this.renderFavoriteSection()}

          <!-- 내 주변 -->
          ${this.renderNearbySection()}

          <!-- 혜택 -->
          ${this.renderPromoSection()}
        </div>
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
          <div class="header-location">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
            </svg>
            <div class="location-info">
              <span class="location-label">현재위치</span>
              <span class="location-name">서울 강남구</span>
            </div>
          </div>
          <div class="header-actions">
            <button id="notificationBtn" class="header-icon-btn" onclick="renderNotification()">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.9 2 2 2zm6-6v-5c0-3.07-1.63-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.64 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2zm-2 1H8v-6c0-2.48 1.51-4.5 4-4.5s4 2.02 4 4.5v6z"/>
              </svg>
              <span class="notification-badge">3</span>
            </button>
          </div>
        </div>
      </header>
    `;
  },

  /**
   * 히어로 섹션 렌더링
   */
  renderHeroSection() {
    return `
      <section id="heroSection">
        <div class="hero-content">
          <h1 class="hero-title">어디로 갈까요?</h1>
          <p class="hero-subtitle">가까운 맛집을 찾아보세요</p>
          
          <div class="search-bar" onclick="renderSearch('')">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="11" cy="11" r="8"/>
              <path d="m21 21-4.35-4.35"/>
            </svg>
            <span class="search-placeholder">매장명, 음식, 지역 검색</span>
          </div>
        </div>
      </section>
    `;
  },

  /**
   * 추천 매장 섹션 렌더링
   */
  renderRecommendedStores() {
    return `
      <section id="recommendedSection">
        <div class="section-header">
          <h2 class="section-title">지금 인기있는 맛집</h2>
          <button class="see-all-btn" onclick="renderMap()">전체보기</button>
        </div>
        <div class="recommended-scroll">
          ${this.renderRecommendedCards()}
        </div>
      </section>
    `;
  },

  /**
   * 추천 매장 카드 렌더링
   */
  renderRecommendedCards() {
    const stores = [
      { name: '맛있는 파스타', category: '이탈리안', rating: '4.8', image: '/api/placeholder/200/140', discount: '-20%' },
      { name: '프리미엄 스시', category: '일식', rating: '4.9', image: '/api/placeholder/200/140', badge: 'NEW' },
      { name: '감성 카페', category: '카페', rating: '4.7', image: '/api/placeholder/200/140' },
    ];

    return stores.map(store => `
      <div class="recommended-card">
        <div class="card-image">
          <img src="${store.image}" alt="${store.name}" />
          ${store.discount ? `<span class="card-discount">${store.discount}</span>` : ''}
          ${store.badge ? `<span class="card-badge">${store.badge}</span>` : ''}
          <button class="card-bookmark">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2">
              <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/>
            </svg>
          </button>
        </div>
        <div class="card-content">
          <h3 class="card-title">${store.name}</h3>
          <div class="card-meta">
            <span class="card-category">${store.category}</span>
            <div class="card-rating">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="#FFB800">
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
              </svg>
              <span>${store.rating}</span>
            </div>
          </div>
        </div>
      </div>
    `).join('');
  },

  /**
   * 퀵 액션 렌더링
   */
  renderQuickActions() {
    return `
      <section id="quickActionsSection">
        <div class="quick-actions-grid">
          <button class="quick-action-card" onclick="renderMap().catch(console.error)">
            <div class="action-icon">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/>
                <circle cx="12" cy="10" r="3"/>
              </svg>
            </div>
            <span class="action-label">내 주변</span>
          </button>
          <button class="quick-action-card" onclick="TLL().catch(console.error)">
            <div class="action-icon">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor">
                <rect x="3" y="3" width="18" height="18" rx="2"/>
                <path d="M7 7h3v3H7zm0 7h3v3H7zm7-7h3v3h-3z" fill="white"/>
              </svg>
            </div>
            <span class="action-label">QR 주문</span>
          </button>
          <button class="quick-action-card" onclick="renderMyPage()">
            <div class="action-icon">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z"/>
              </svg>
            </div>
            <span class="action-label">마이페이지</span>
          </button>
          <button class="quick-action-card">
            <div class="action-icon">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor">
                <path d="M20 6h-2.18c.11-.31.18-.65.18-1 0-1.66-1.34-3-3-3-1.05 0-1.96.54-2.5 1.35l-.5.67-.5-.68C10.96 2.54 10.05 2 9 2 7.34 2 6 3.34 6 5c0 .35.07.69.18 1H4c-1.11 0-1.99.89-1.99 2L2 19c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V8c0-1.11-.89-2-2-2zm-5-2c.55 0 1 .45 1 1s-.45 1-1 1-1-.45-1-1 .45-1 1-1zM9 4c.55 0 1 .45 1 1s-.45 1-1 1-1-.45-1-1 .45-1 1-1zm11 15H4v-2h16v2zm0-5H4V8h5.08L7 10.83 8.62 12 11 8.76l1-1.36 1 1.36L15.38 12 17 10.83 14.92 8H20v6z"/>
              </svg>
            </div>
            <span class="action-label">쿠폰함</span>
          </button>
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
          <h2 class="section-title">단골 & 최근 방문</h2>
          <button class="see-all-btn">전체</button>
        </div>
        <div class="favorite-list" id="favRecentContainer">
          <div class="favorite-item">
            <div class="favorite-image">
              <img src="/api/placeholder/80/80" alt="매장" />
            </div>
            <div class="favorite-info">
              <div class="favorite-header">
                <h4 class="favorite-name">맛있는 분식집</h4>
                <button class="favorite-heart active">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
                  </svg>
                </button>
              </div>
              <div class="favorite-rating">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="#FFB800">
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                </svg>
                <span>4.8</span>
                <span class="favorite-category">분식</span>
              </div>
              <div class="favorite-distance">250m • 도보 3분</div>
            </div>
          </div>
          <div class="favorite-item">
            <div class="favorite-image">
              <img src="/api/placeholder/80/80" alt="매장" />
            </div>
            <div class="favorite-info">
              <div class="favorite-header">
                <h4 class="favorite-name">행복한 카페</h4>
                <button class="favorite-heart">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/>
                  </svg>
                </button>
              </div>
              <div class="favorite-rating">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="#FFB800">
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                </svg>
                <span>4.6</span>
                <span class="favorite-category">카페</span>
              </div>
              <div class="favorite-distance">180m • 도보 2분</div>
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
          <h2 class="section-title">내 주변 맛집</h2>
          <button class="see-all-btn" onclick="renderMap()">전체</button>
        </div>
        <div class="nearby-list" id="nearbyContainer">
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
      { name: '신선한 초밥', category: '일식', rating: '4.9', distance: '320m', reviews: 1234 },
      { name: '황금 족발', category: '한식', rating: '4.7', distance: '450m', reviews: 856 },
      { name: '이탈리아 파스타', category: '양식', rating: '4.8', distance: '580m', reviews: 692 },
      { name: '건강한 샐러드', category: '샐러드', rating: '4.6', distance: '210m', reviews: 445 },
    ];

    return dummyStores.map(store => `
      <div class="nearby-item">
        <div class="nearby-thumb">
          <img src="/api/placeholder/70/70" alt="${store.name}" />
        </div>
        <div class="nearby-details">
          <h4 class="nearby-title">${store.name}</h4>
          <div class="nearby-meta">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="#FFB800">
              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
            </svg>
            <span class="nearby-rating">${store.rating}</span>
            <span class="nearby-divider">•</span>
            <span class="nearby-category">${store.category}</span>
            <span class="nearby-divider">•</span>
            <span class="nearby-distance">${store.distance}</span>
          </div>
          <div class="nearby-reviews">리뷰 ${store.reviews.toLocaleString()}</div>
        </div>
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
          <h2 class="section-title">진행중인 혜택</h2>
          <button class="see-all-btn">전체</button>
        </div>
        <div class="promo-banner" id="promoContainer">
          <div class="promo-item">
            <div class="promo-text">
              <span class="promo-badge">NEW</span>
              <h3 class="promo-heading">신규 회원 특별 할인</h3>
              <p class="promo-description">첫 주문 시 20% 할인 쿠폰 증정</p>
            </div>
            <div class="promo-visual">
              <svg width="60" height="60" viewBox="0 0 24 24" fill="white" opacity="0.9">
                <path d="M20 6h-2.18c.11-.31.18-.65.18-1 0-1.66-1.34-3-3-3-1.05 0-1.96.54-2.5 1.35l-.5.67-.5-.68C10.96 2.54 10.05 2 9 2 7.34 2 6 3.34 6 5c0 .35.07.69.18 1H4c-1.11 0-1.99.89-1.99 2L2 19c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V8c0-1.11-.89-2-2-2z"/>
              </svg>
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
