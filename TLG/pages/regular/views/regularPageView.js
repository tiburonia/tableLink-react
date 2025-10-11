
/**
 * 단골매장 페이지 View (v3 - 네비게이션 개선)
 * UI 렌더링 - 단일 네비게이션 레이어 + 탭 전환
 */

export const regularPageView = {
  /**
   * 메인 페이지 렌더링
   */
  render(data) {
    const { summary, stores, posts, favoriteStores = [] } = data;

    return `
      <div class="regular-page-container">
        ${this.renderHeader(summary)}
        
        <!-- Regular Pane (단골 매장) -->
        <div class="regular-pane">
          ${this.renderStoreFeed(posts)}
          ${this.renderRecentVisited(stores)}
          ${this.renderStoresList(stores)}
          ${this.renderFavoriteStoresPreview(favoriteStores)}
        </div>

        <!-- Favorite Pane (즐겨찾기 전체) -->
        <div class="favorite-pane" style="display:none">
          ${this.renderFavoriteListGrid(favoriteStores)}
        </div>
        ${this.renderLocalToggle()}
        ${this.renderBottomNav()}
      </div>
      ${this.getStyles()}
    `;
  },

  /**
   * 헤더 영역
   */
  renderHeader(summary) {
    return `
      <header class="regular-header">
        <div class="header-content">
          <h1 class="page-title">🍽️ 내 맛집</h1>
          <div class="header-actions">
            <button class="icon-btn" id="searchBtn" aria-label="검색">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="11" cy="11" r="8"/>
                <path d="m21 21-4.35-4.35"/>
              </svg>
            </button>
          </div>
        </div>
        <p class="header-subtitle">총 단골 ${summary?.totalStores || 0}곳 · 최근 방문 ${summary?.lastVisit || '-'}</p>
      </header>
    `;
  },

  /**
   * 로컬 토글 바 (단골/즐겨찾기)
   */
  renderLocalToggle() {
    return `
      <div class="local-toggle">
        <button class="toggle-btn active" data-tab="regular">❤️ 단골</button>
        <button class="toggle-btn" data-tab="favorite">⭐ 즐겨찾기</button>
      </div>
    `;
  },

  /**
   * 매장 소식 피드 섹션
   */
  renderStoreFeed(posts) {
    if (!posts || posts.length === 0) return '';

    const newPostsCount = posts.filter(p => {
      const diff = Date.now() - new Date(p.createdAt);
      return diff < 24 * 60 * 60 * 1000;
    }).length;

    const previewPosts = posts.slice(0, 3);

    return `
      <section class="feed-section">
        ${newPostsCount > 0 ? `
          <div class="new-posts-banner">
            <span class="banner-icon">🔔</span>
            <span class="banner-text">새로운 단골 소식 ${newPostsCount}개</span>
          </div>
        ` : ''}
        
        <div class="section-header-compact">
          <h2 class="section-title">🗞 단골 매장 소식</h2>
          <button class="view-all-btn" onclick="renderFeed()">
            전체보기
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M9 18l6-6-6-6"/>
            </svg>
          </button>
        </div>
        
        <div class="feed-list-preview">
          ${previewPosts.map(post => this.renderPostCard(post)).join('')}
        </div>

        ${posts.length > 3 ? `
          <button class="show-more-btn" onclick="renderFeed()">
            <span>더 많은 소식 보기 (${posts.length - 3}개)</span>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M19 9l-7 7-7-7"/>
            </svg>
          </button>
        ` : ''}
      </section>
    `;
  },

  /**
   * 매장 소식 카드
   */
  renderPostCard(post) {
    const levelColor = window.regularPageService?.getLevelColor(post.userLevel) || '#64748b';
    const relativeTime = window.regularPageService?.getRelativeTime(post.createdAt) || '최근';
    const tagColor = this.getTagColor(post.postType);

    return `
      <div class="post-card">
        <div class="post-header">
          <div class="post-store-info">
            <div class="post-store-logo">${post.storeLogo}</div>
            <div class="post-store-details">
              <h4 class="post-store-name">${post.storeName}</h4>
              <span class="post-meta-time">🕓 ${relativeTime}</span>
            </div>
          </div>
          <div class="post-level-badge" style="background: ${levelColor}">
            ${post.userLevelName}
          </div>
        </div>

        <div class="post-body">
          <div class="post-tag" style="background: ${tagColor}">
            ${post.targetTag}
          </div>
          <h3 class="post-title">${post.title}</h3>
          
          ${post.hasImage ? `
            <div class="post-image-container">
              <img src="${post.imageUrl}" alt="${post.title}" class="post-image" />
            </div>
          ` : ''}
          
          <p class="post-content">${post.content}</p>
        </div>

        <div class="post-actions">
          <div class="post-reactions">
            <button class="reaction-btn ${post.hasLiked ? 'active' : ''}" onclick="toggleLike(${post.id})">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="${post.hasLiked ? '#FF8A00' : 'none'}" stroke="currentColor" stroke-width="2">
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
              </svg>
              <span>${post.likes}</span>
            </button>
            <button class="reaction-btn" onclick="viewComments(${post.id})">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
              </svg>
              <span>${post.comments}</span>
            </button>
            <button class="reaction-btn" onclick="sharePost(${post.id})">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/>
                <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>
              </svg>
            </button>
          </div>

          ${post.hasCoupon ? `
            <button class="coupon-btn ${post.couponReceived ? 'received' : ''}" 
                    onclick="receiveCoupon(${post.id}, ${post.storeId})"
                    ${post.couponReceived ? 'disabled' : ''}>
              ${post.couponReceived ? '✅ 쿠폰받음' : '🎟️ 쿠폰받기'}
            </button>
          ` : ''}
        </div>
      </div>
    `;
  },

  /**
   * 태그 색상
   */
  getTagColor(postType) {
    const colors = {
      'event': '#FF8A00',
      'new_menu': '#10b981',
      'promotion': '#f59e0b',
      'notice': '#6366f1'
    };
    return colors[postType] || '#64748b';
  },

  /**
   * 최근 방문 매장 섹션
   */
  renderRecentVisited(stores) {
    if (!stores || stores.length === 0) return '';

    const recentStores = stores.slice(0, 3);

    return `
      <section class="recent-section">
        <div class="section-header-compact">
          <h2 class="section-title">📍 최근 방문한 매장</h2>
        </div>
        <div class="recent-list">
          ${recentStores.map(store => this.renderRecentCard(store)).join('')}
        </div>
      </section>
    `;
  },

  /**
   * 최근 방문 카드
   */
  renderRecentCard(store) {
    const levelColor = window.regularPageService?.getLevelColor(store.level) || '#64748b';
    const levelIcon = window.regularPageService?.getLevelIcon(store.level) || '🏅';

    return `
      <div class="recent-card" onclick="goToStore(${store.storeId})">
        <div class="recent-thumbnail">
          <div class="thumbnail-placeholder" style="background: linear-gradient(135deg, ${levelColor}50, ${levelColor}30)">
            <span class="thumbnail-icon">${store.category === '카페' ? '☕' : store.category === '치킨' ? '🍗' : '🍜'}</span>
          </div>
        </div>
        <div class="recent-info">
          <div class="recent-header">
            <h3 class="recent-name">${store.storeName}</h3>
            <span class="recent-badge" style="background: ${levelColor}">${levelIcon} ${store.levelName}</span>
          </div>
          <p class="recent-meta">${store.lastVisit} 방문 · 포인트 ${store.points.toLocaleString()}P</p>
          <div class="recent-actions">
            <button class="recent-btn primary" onclick="event.stopPropagation(); orderFromStore(${store.storeId})">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"/>
              </svg>
              다시 주문
            </button>
            ${store.hasUnwrittenReview ? `
              <button class="recent-btn secondary" onclick="event.stopPropagation(); writeReview(${store.storeId})">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/>
                  <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/>
                </svg>
                리뷰 남기기
              </button>
            ` : ''}
          </div>
        </div>
      </div>
    `;
  },

  /**
   * 매장 리스트 - 카드 강화
   */
  renderStoresList(stores) {
    if (!stores || stores.length === 0) {
      return this.renderEmptyState();
    }

    return `
      <section class="stores-section">
        <div class="section-header-compact">
          <h2 class="section-title">내 단골 매장</h2>
          <button class="filter-btn" id="filterBtn">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="4" y1="21" x2="4" y2="14"/>
              <line x1="4" y1="10" x2="4" y2="3"/>
              <line x1="12" y1="21" x2="12" y2="12"/>
              <line x1="12" y1="8" x2="12" y2="3"/>
              <line x1="20" y1="21" x2="20" y2="16"/>
              <line x1="20" y1="12" x2="20" y2="3"/>
            </svg>
          </button>
        </div>
        <div class="stores-grid">
          ${stores.map(store => this.renderEnhancedStoreCard(store)).join('')}
        </div>
      </section>
    `;
  },

  /**
   * 강화된 매장 카드
   */
  renderEnhancedStoreCard(store) {
    const levelColor = window.regularPageService?.getLevelColor(store.level) || '#64748b';
    const levelIcon = window.regularPageService?.getLevelIcon(store.level) || '🏅';

    return `
      <div class="store-card-v2" onclick="goToStore(${store.storeId})">
        <div class="store-card-header">
          <div class="store-thumbnail-v2" style="background: linear-gradient(135deg, ${levelColor}40, ${levelColor}20)">
            <span class="store-icon-v2">${store.category === '카페' ? '☕' : store.category === '치킨' ? '🍗' : '🍜'}</span>
          </div>
          <div class="store-badge-v2" style="background: ${levelColor}">
            ${levelIcon} ${store.levelName}
          </div>
        </div>
        
        <div class="store-card-body">
          <h3 class="store-name-v2">${store.storeName}</h3>
          <p class="store-category-v2">${store.category}</p>
          
          <div class="store-stats-v2">
            <div class="stat-item-v2">
              <span class="stat-label-v2">포인트</span>
              <span class="stat-value-v2">${store.points.toLocaleString()}P</span>
            </div>
            <div class="stat-divider-v2"></div>
            <div class="stat-item-v2">
              <span class="stat-label-v2">쿠폰</span>
              <span class="stat-value-v2">${store.coupons}장</span>
            </div>
          </div>

          <div class="store-meta-v2">
            <span class="meta-text">🕒 ${store.lastVisit}</span>
            <span class="meta-text">📍 ${store.distance}</span>
          </div>

          ${store.hasUnwrittenReview ? `
            <div class="review-alert">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
                <line x1="12" y1="9" x2="12" y2="13"/>
                <line x1="12" y1="17" x2="12.01" y2="17"/>
              </svg>
              리뷰 작성하고 쿠폰 받기
            </div>
          ` : ''}
        </div>
      </div>
    `;
  },

  /**
   * Empty State
   */
  renderEmptyState() {
    return `
      <section class="stores-section">
        <div class="empty-state-v2">
          <div class="empty-icon-v2">🏪</div>
          <h3 class="empty-title-v2">단골 매장이 없어요</h3>
          <p class="empty-text-v2">자주 가는 매장을 단골로 등록하고<br>특별한 혜택을 받아보세요!</p>
          <button class="empty-btn" onclick="renderMap()">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/>
              <circle cx="12" cy="10" r="3"/>
            </svg>
            매장 찾아보기
          </button>
        </div>
      </section>
    `;
  },

  /**
   * 즐겨찾기 매장 미리보기 (가로 스크롤)
   */
  renderFavoriteStoresPreview(favoriteStores) {
    if (!favoriteStores || favoriteStores.length === 0) return '';

    const preview = favoriteStores.slice(0, 8);

    return `
      <section class="favorite-section">
        <div class="section-header-compact">
          <h2 class="section-title">⭐ 내가 찜해둔 곳</h2>
          <button class="view-all-btn" data-tab="favorite">
            전체보기
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M9 18l6-6-6-6"/>
            </svg>
          </button>
        </div>

        <div class="favorite-scroll">
          ${preview.map(store => `
            <div class="favorite-card" onclick="goToStore(${store.storeId})">
              <div class="favorite-thumb">
                <img src="${store.imageUrl || '/assets/store_default.png'}" alt="${store.storeName}" onerror="this.src='/assets/store_default.png'" />
              </div>
              <div class="favorite-info">
                <h3 class="favorite-name">${store.storeName}</h3>
                <p class="favorite-category">${store.category || '기타'}</p>
              </div>
            </div>
          `).join('')}
        </div>
      </section>
    `;
  },

  /**
   * 즐겨찾기 전체 그리드
   */
  renderFavoriteListGrid(favoriteStores) {
    if (!favoriteStores || favoriteStores.length === 0) {
      return `
        <div class="empty-state-v2">
          <div class="empty-icon-v2">⭐</div>
          <h3 class="empty-title-v2">즐겨찾기한 매장이 없어요</h3>
          <p class="empty-text-v2">마음에 드는 매장을 즐겨찾기하고<br>빠르게 찾아보세요!</p>
          <button class="empty-btn" onclick="renderMap()">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/>
              <circle cx="12" cy="10" r="3"/>
            </svg>
            매장 찾아보기
          </button>
        </div>
      `;
    }

    return `
      <section class="favorite-list-grid-section">
        <div class="section-header-compact">
          <h2 class="section-title">⭐ 즐겨찾기 (${favoriteStores.length}곳)</h2>
          <button class="filter-btn">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="4" y1="21" x2="4" y2="14"/>
              <line x1="4" y1="10" x2="4" y2="3"/>
              <line x1="12" y1="21" x2="12" y2="12"/>
              <line x1="12" y1="8" x2="12" y2="3"/>
              <line x1="20" y1="21" x2="20" y2="16"/>
              <line x1="20" y1="12" x2="20" y2="3"/>
            </svg>
          </button>
        </div>
        <div class="favorite-list-grid">
          ${favoriteStores.map(store => `
            <div class="favorite-list-card" onclick="goToStore(${store.storeId})">
              <div class="favorite-list-image">
                <img src="${store.imageUrl || '/assets/store_default.png'}" alt="${store.storeName}" onerror="this.src='/assets/store_default.png'" />
                <button class="favorite-remove-btn" onclick="event.stopPropagation(); removeFavorite(${store.storeId})">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
                  </svg>
                </button>
              </div>
              <div class="favorite-list-info">
                <h3 class="favorite-list-name">${store.storeName}</h3>
                <p class="favorite-list-category">${store.category || '기타'}</p>
                ${store.distance ? `<p class="favorite-list-distance">📍 ${store.distance}</p>` : ''}
              </div>
            </div>
          `).join('')}
        </div>
      </section>
    `;
  },

  /**
   * 바텀 네비게이션
   */
  renderBottomNav() {
    return `
      <nav class="bottom-nav-bar">
        <button onclick="renderSubMain()" class="nav-item">
          <span class="nav-icon">
            <img width="24" height="24" src="https://img.icons8.com/external-solid-adri-ansyah/24/external-home-essentials-ui-solid-adri-ansyah.png" alt="home"/>
          </span>
          <span class="nav-label">홈</span>
        </button>
        <button onclick="TLL()" class="nav-item">
          <span class="nav-icon">
            <img width="26" height="26" src="https://img.icons8.com/external-tanah-basah-glyph-tanah-basah/26/external-qr-metaverse-tanah-basah-glyph-tanah-basah.png" alt="qr"/>
          </span>
          <span class="nav-label">QR 주문</span>
        </button>
        <button onclick="renderMap()" class="nav-item">
          <span class="nav-icon">
            <img width="24" height="24" src="https://img.icons8.com/ios-filled/24/marker.png" alt="map"/>
          </span>
          <span class="nav-label">내주변</span>
        </button>
        <button class="nav-item active">
          <span class="nav-icon">
            <img width="26" height="26" src="https://img.icons8.com/pastel-glyph/26/shop--v2.png" alt="regular"/>
          </span>
          <span class="nav-label">내맛집</span>
        </button>
        <button onclick="renderMyPage()" class="nav-item">
          <span class="nav-icon">
            <img width="26" height="26" src="https://img.icons8.com/ios-filled/26/more.png" alt="more"/>
          </span>
          <span class="nav-label">더보기</span>
        </button>
      </nav>
    `;
  },

  /**
   * 스타일
   */
  getStyles() {
    return `
      <style>
        * {
          box-sizing: border-box;
        }

        .regular-page-container {
          height: 714px;
          background: #fafafa;
          padding-bottom: calc(68px + 16px);
          overflow-y: auto;
        }

        /* ===== 헤더 ===== */
        .regular-header {
          background: white;
          padding: 0px 20px 16px 20px;
          position: sticky;
          top: 0;
          z-index: 100;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
        }

        .header-content {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 8px;
        }

        .page-title {
          margin: 0;
          font-size: 24px;
          font-weight: 800;
          color: #1f2937;
          letter-spacing: -0.02em;
        }

        .header-actions {
          display: flex;
          gap: 8px;
        }

        .icon-btn {
          width: 36px;
          height: 36px;
          border-radius: 10px;
          border: none;
          background: #f3f4f6;
          color: #6b7280;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s;
        }

        .icon-btn:active {
          transform: scale(0.95);
          background: #e5e7eb;
        }

        .header-subtitle {
          margin: 0;
          font-size: 13px;
          color: #9ca3af;
          font-weight: 500;
        }

        /* ===== 로컬 토글 (Floating Capsule Segmented Control) ===== */
        .local-toggle {
          position: fixed;
          left: 50%;
          bottom: 90px;
          transform: translateX(-50%);
          display: inline-flex;
          align-items: center;
          padding: 4px;
          background: rgba(255, 255, 255, 0.95);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          border-radius: 100px;
          box-shadow: 
            0 8px 32px rgba(0, 0, 0, 0.08),
            0 2px 8px rgba(0, 0, 0, 0.04),
            inset 0 1px 0 rgba(255, 255, 255, 0.9);
          border: 1px solid rgba(0, 0, 0, 0.06);
          z-index: 90;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .local-toggle:hover {
          box-shadow: 
            0 12px 40px rgba(0, 0, 0, 0.12),
            0 4px 12px rgba(0, 0, 0, 0.06),
            inset 0 1px 0 rgba(255, 255, 255, 0.9);
        }

        .toggle-btn {
          position: relative;
          border: none;
          background: transparent;
          border-radius: 100px;
          padding: 10px 24px;
          font-size: 14px;
          font-weight: 600;
          color: #6b7280;
          cursor: pointer;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          white-space: nowrap;
          z-index: 1;
          flex: 1;
        }

        .toggle-btn:hover:not(.active) {
          color: #374151;
        }

        .toggle-btn.active {
          background: linear-gradient(135deg, #FF8A00 0%, #FF9F33 100%);
          color: white;
          font-weight: 700;
          box-shadow: 
            0 4px 16px rgba(255, 138, 0, 0.25),
            0 2px 8px rgba(255, 138, 0, 0.15),
            inset 0 1px 0 rgba(255, 255, 255, 0.2);
          transform: scale(1.02);
        }

        .toggle-btn.active::before {
          content: '';
          position: absolute;
          inset: 0;
          border-radius: 100px;
          background: linear-gradient(180deg, rgba(255, 255, 255, 0.2) 0%, transparent 100%);
          pointer-events: none;
        }

        /* ===== Pane 전환 ===== */
        .regular-pane,
        .favorite-pane {
          transition: opacity 0.25s ease, transform 0.25s ease;
        }

        /* ===== 최근 방문 섹션 ===== */
        .recent-section {
          padding: 16px 20px;
        }

        .section-header-compact {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 16px;
        }

        .section-title {
          margin: 0;
          font-size: 18px;
          font-weight: 700;
          color: #1f2937;
        }

        .filter-btn {
          width: 32px;
          height: 32px;
          border-radius: 8px;
          border: none;
          background: #f3f4f6;
          color: #6b7280;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s;
        }

        .filter-btn:active {
          background: #e5e7eb;
        }

        .view-all-btn {
          display: flex;
          align-items: center;
          gap: 4px;
          padding: 6px 12px;
          border-radius: 8px;
          border: none;
          background: #f3f4f6;
          color: #6b7280;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
        }

        .view-all-btn:active {
          background: #e5e7eb;
        }

        .show-more-btn {
          width: 100%;
          padding: 16px;
          border-radius: 12px;
          border: 2px dashed #e5e7eb;
          background: white;
          color: #6b7280;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          margin-top: 12px;
          transition: all 0.2s;
        }

        .show-more-btn:hover {
          border-color: #FF8A00;
          color: #FF8A00;
          background: #fff5eb;
        }

        .recent-list {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .recent-card {
          background: white;
          border-radius: 16px;
          padding: 16px;
          display: flex;
          gap: 14px;
          cursor: pointer;
          transition: all 0.2s;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
        }

        .recent-card:active {
          transform: scale(0.98);
        }

        .recent-thumbnail {
          flex-shrink: 0;
        }

        .thumbnail-placeholder {
          width: 64px;
          height: 64px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .thumbnail-icon {
          font-size: 28px;
        }

        .recent-info {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .recent-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
        }

        .recent-name {
          margin: 0;
          font-size: 16px;
          font-weight: 700;
          color: #1f2937;
        }

        .recent-badge {
          padding: 4px 10px;
          border-radius: 8px;
          font-size: 11px;
          color: white;
          font-weight: 700;
          white-space: nowrap;
        }

        .recent-meta {
          margin: 0;
          font-size: 13px;
          color: #6b7280;
          font-weight: 500;
        }

        .recent-actions {
          display: flex;
          gap: 8px;
          margin-top: 4px;
        }

        .recent-btn {
          padding: 8px 14px;
          border-radius: 8px;
          border: none;
          font-size: 12px;
          font-weight: 600;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 4px;
          transition: all 0.2s;
        }

        .recent-btn.primary {
          background: #FF8A00;
          color: white;
        }

        .recent-btn.primary:active {
          background: #e67a00;
        }

        .recent-btn.secondary {
          background: #f3f4f6;
          color: #6b7280;
        }

        .recent-btn.secondary:active {
          background: #e5e7eb;
        }

        /* ===== 매장 소식 피드 ===== */
        .feed-section {
          padding: 16px 20px;
        }

        .new-posts-banner {
          background: linear-gradient(135deg, #FF8A00 0%, #ff9f33 100%);
          color: white;
          padding: 12px 16px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 16px;
          box-shadow: 0 4px 12px rgba(255, 138, 0, 0.3);
        }

        .banner-icon {
          font-size: 18px;
          animation: ring 2s infinite;
        }

        @keyframes ring {
          0%, 100% { transform: rotate(0deg); }
          10%, 30% { transform: rotate(-10deg); }
          20%, 40% { transform: rotate(10deg); }
        }

        .banner-text {
          font-size: 14px;
          font-weight: 700;
        }

        .feed-list-preview {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .post-card {
          background: white;
          border-radius: 16px;
          padding: 20px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
          transition: all 0.3s ease;
        }

        .post-card:active {
          transform: scale(0.99);
        }

        .post-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 16px;
        }

        .post-store-info {
          display: flex;
          gap: 12px;
          align-items: center;
        }

        .post-store-logo {
          width: 44px;
          height: 44px;
          border-radius: 12px;
          background: #f3f4f6;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 22px;
        }

        .post-store-details {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .post-store-name {
          margin: 0;
          font-size: 15px;
          font-weight: 700;
          color: #1f2937;
        }

        .post-meta-time {
          font-size: 12px;
          color: #9ca3af;
          font-weight: 500;
        }

        .post-level-badge {
          padding: 6px 12px;
          border-radius: 8px;
          font-size: 11px;
          color: white;
          font-weight: 700;
        }

        .post-body {
          margin-bottom: 16px;
        }

        .post-tag {
          display: inline-block;
          padding: 4px 10px;
          border-radius: 6px;
          font-size: 11px;
          color: white;
          font-weight: 700;
          margin-bottom: 12px;
        }

        .post-title {
          margin: 0 0 12px 0;
          font-size: 17px;
          font-weight: 700;
          color: #1f2937;
          line-height: 1.4;
        }

        .post-image-container {
          width: 100%;
          border-radius: 12px;
          overflow: hidden;
          margin-bottom: 12px;
        }

        .post-image {
          width: 100%;
          height: auto;
          display: block;
        }

        .post-content {
          margin: 0;
          font-size: 14px;
          color: #4b5563;
          line-height: 1.6;
        }

        .post-actions {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding-top: 16px;
          border-top: 1px solid #f3f4f6;
        }

        .post-reactions {
          display: flex;
          gap: 12px;
        }

        .reaction-btn {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 8px 12px;
          border-radius: 8px;
          border: none;
          background: #f3f4f6;
          color: #6b7280;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
        }

        .reaction-btn.active {
          background: #fff5eb;
          color: #FF8A00;
        }

        .reaction-btn:active {
          transform: scale(0.95);
        }

        .coupon-btn {
          padding: 10px 20px;
          border-radius: 10px;
          border: none;
          background: #FF8A00;
          color: white;
          font-size: 13px;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.2s;
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .coupon-btn:active {
          transform: scale(0.95);
          background: #e67a00;
        }

        .coupon-btn.received {
          background: #10b981;
          cursor: not-allowed;
        }

        /* ===== 매장 그리드 ===== */
        .stores-section {
          padding: 16px 20px;
        }

        .stores-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 12px;
        }

        .store-card-v2 {
          background: white;
          border-radius: 16px;
          padding: 16px;
          cursor: pointer;
          transition: all 0.2s;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
        }

        .store-card-v2:active {
          transform: scale(0.97);
        }

        .store-card-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 12px;
        }

        .store-thumbnail-v2 {
          width: 48px;
          height: 48px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .store-icon-v2 {
          font-size: 24px;
        }

        .store-badge-v2 {
          padding: 4px 8px;
          border-radius: 8px;
          font-size: 10px;
          color: white;
          font-weight: 700;
        }

        .store-card-body {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .store-name-v2 {
          margin: 0;
          font-size: 15px;
          font-weight: 700;
          color: #1f2937;
          line-height: 1.3;
        }

        .store-category-v2 {
          margin: 0;
          font-size: 12px;
          color: #9ca3af;
          font-weight: 500;
        }

        .store-stats-v2 {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 8px 0;
        }

        .stat-item-v2 {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .stat-label-v2 {
          font-size: 11px;
          color: #9ca3af;
          font-weight: 500;
        }

        .stat-value-v2 {
          font-size: 13px;
          font-weight: 700;
          color: #FF8A00;
        }

        .stat-divider-v2 {
          width: 1px;
          height: 24px;
          background: #e5e7eb;
        }

        .store-meta-v2 {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .meta-text {
          font-size: 11px;
          color: #6b7280;
        }

        .review-alert {
          background: #fef2f2;
          color: #dc2626;
          padding: 8px;
          border-radius: 8px;
          font-size: 11px;
          font-weight: 600;
          display: flex;
          align-items: center;
          gap: 6px;
          margin-top: 4px;
        }

        /* ===== Empty State ===== */
        .empty-state-v2 {
          text-align: center;
          padding: 60px 20px;
          background: white;
          border-radius: 20px;
          margin: 20px 0;
        }

        .empty-icon-v2 {
          font-size: 56px;
          margin-bottom: 16px;
          opacity: 0.6;
        }

        .empty-title-v2 {
          margin: 0 0 8px 0;
          font-size: 18px;
          font-weight: 700;
          color: #1f2937;
        }

        .empty-text-v2 {
          margin: 0 0 24px 0;
          font-size: 14px;
          color: #9ca3af;
          line-height: 1.6;
        }

        .empty-btn {
          padding: 12px 24px;
          border-radius: 12px;
          border: none;
          background: #FF8A00;
          color: white;
          font-size: 14px;
          font-weight: 700;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          gap: 8px;
          transition: all 0.2s;
        }

        .empty-btn:active {
          transform: translateY(-1px);
          box-shadow: 0 4px 16px rgba(255, 138, 0, 0.3);
        }

        /* ===== 즐겨찾기 매장 ===== */
        .favorite-section {
          padding: 16px 20px;
          background: white;
          border-radius: 20px 20px 0 0;
          margin-top: 12px;
          box-shadow: 0 -2px 8px rgba(0, 0, 0, 0.03);
        }

        .favorite-scroll {
          display: flex;
          overflow-x: auto;
          gap: 12px;
          padding-bottom: 16px;
          margin-top: 8px;
          -webkit-overflow-scrolling: touch;
          scrollbar-width: none;
        }

        .favorite-scroll::-webkit-scrollbar {
          display: none;
        }

        .favorite-card {
          min-width: 110px;
          flex-shrink: 0;
          background: #f9fafb;
          border-radius: 12px;
          padding: 10px;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.06);
          transition: all 0.2s;
          cursor: pointer;
        }

        .favorite-card:active {
          transform: scale(0.97);
          background: #f3f4f6;
        }

        .favorite-thumb {
          width: 100%;
          height: 70px;
          border-radius: 10px;
          overflow: hidden;
          background: #e5e7eb;
          margin-bottom: 8px;
        }

        .favorite-thumb img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .favorite-info {
          text-align: center;
        }

        .favorite-name {
          margin: 0;
          font-size: 13px;
          font-weight: 700;
          color: #1f2937;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .favorite-category {
          margin: 2px 0 0 0;
          font-size: 11px;
          color: #9ca3af;
          font-weight: 500;
        }

        /* ===== 즐겨찾기 전체 그리드 ===== */
        .favorite-list-grid-section {
          padding: 16px 20px;
        }

        .favorite-list-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 12px;
        }

        .favorite-list-card {
          background: white;
          border-radius: 16px;
          overflow: hidden;
          cursor: pointer;
          transition: all 0.2s;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
          position: relative;
        }

        .favorite-list-card:active {
          transform: scale(0.97);
        }

        .favorite-list-image {
          position: relative;
          width: 100%;
          height: 140px;
          overflow: hidden;
          background: #e5e7eb;
        }

        .favorite-list-image img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .favorite-remove-btn {
          position: absolute;
          top: 8px;
          right: 8px;
          width: 36px;
          height: 36px;
          border-radius: 50%;
          border: none;
          background: rgba(255, 255, 255, 0.9);
          color: #ef4444;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s;
          z-index: 10;
        }

        .favorite-remove-btn:active {
          transform: scale(0.9);
          background: white;
        }

        .favorite-list-info {
          padding: 12px;
        }

        .favorite-list-name {
          margin: 0 0 4px 0;
          font-size: 15px;
          font-weight: 700;
          color: #1f2937;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .favorite-list-category {
          margin: 0 0 4px 0;
          font-size: 12px;
          color: #9ca3af;
          font-weight: 500;
        }

        .favorite-list-distance {
          margin: 0;
          font-size: 11px;
          color: #6b7280;
        }

        /* ===== 바텀 네비게이션 ===== */
        .bottom-nav-bar {
          position: fixed;
          bottom: 0;
          background: white;
          display: flex;
          justify-content: space-around;
          padding: 8px 0 12px 0;
          border-top: 1px solid #f3f4f6;
          box-shadow: 0 -1px 3px rgba(0, 0, 0, 0.05);
          z-index: 1000;
        }

        .nav-item {
          background: none;
          border: none;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 4px;
          cursor: pointer;
          padding: 6px 12px;
          flex: 1;
          transition: all 0.2s;
        }

        .nav-item.active .nav-label {
          color: #FF8A00;
          font-weight: 700;
        }

        .nav-label {
          font-size: 11px;
          color: #9ca3af;
          font-weight: 500;
        }

        /* 반응형 */
        @media (max-width: 380px) {
          .stores-grid,
          .favorite-list-grid {
            grid-template-columns: 1fr;
          }

          .recent-actions {
            flex-wrap: wrap;
          }
        }
      </style>
    `;
  }
};

window.regularPageView = regularPageView;
console.log('✅ regularPageView v3 모듈 로드 완료 (네비게이션 개선)');
