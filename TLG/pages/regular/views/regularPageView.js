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
          ${this.renderFavoriteStoresPreview(favoriteStores)}
          ${this.renderStoreFeed(posts)}
          ${this.renderRecentVisited(stores)}
          ${this.renderStoresList(stores)}
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
   * 매장 소식 카드 (미니멀 버전)
   */
  renderPostCard(post) {
    const relativeTime = window.regularPageService?.getRelativeTime(post.createdAt) || '최근';
    const typeInfo = this.getTypeInfo(post.postType);
    const truncatedContent = post.content.length > 50
      ? post.content.substring(0, 50) + '...'
      : post.content;

    return `
      <article class="feed-post-card" onclick="renderFeed()">
        <div class="post-card-compact">
          <div class="post-left">
            <span class="store-emoji-small">${post.storeLogo}</span>
            <div class="post-info">
              <div class="post-header-row">
                <span class="post-type-tag" style="color: ${typeInfo.color};">
                  ${typeInfo.icon}
                </span>
                <h4 class="post-card-title-compact">${post.title}</h4>
              </div>
              <p class="post-card-preview">${truncatedContent}</p>
              <div class="post-meta-row">
                <span class="store-name-small">${post.storeName}</span>
                <span class="post-time-small">${relativeTime}</span>
              </div>
            </div>
          </div>

          ${post.hasImage ? `
            <div class="post-thumbnail">
              <img 
                src="${post.imageUrl || '/TableLink.png'}" 
                alt="매장 소식"
                onerror="this.src='/TableLink.png'"
              >
            </div>
          ` : ''}
        </div>

        <div class="post-actions-minimal">
          <button class="action-btn-minimal" onclick="event.stopPropagation(); toggleLike(${post.id})">
            <span>${post.hasLiked ? '❤️' : '🤍'}</span>
            <span class="action-count">${post.likes}</span>
          </button>
          <button class="action-btn-minimal" onclick="event.stopPropagation(); viewComments(${post.id})">
            <span>💬</span>
            <span class="action-count">${post.comments}</span>
          </button>
          ${post.hasCoupon ? `
            <button class="coupon-btn-minimal ${post.couponReceived ? 'received' : ''}"
                    onclick="event.stopPropagation(); receiveCoupon(${post.id}, ${post.storeId})"
                    ${post.couponReceived ? 'disabled' : ''}>
              ${post.couponReceived ? '✓' : '🎁'}
            </button>
          ` : ''}
        </div>
      </article>
    `;
  },

  /**
   * 포스트 타입 정보
   */
  getTypeInfo(postType) {
    const typeMap = {
      'event': { icon: '🎉', color: '#FF8A00', label: '이벤트' },
      'new_menu': { icon: '🍽️', color: '#10b981', label: '신메뉴' },
      'promotion': { icon: '🎁', color: '#f59e0b', label: '프로모션' },
      'notice': { icon: '📢', color: '#6366f1', label: '공지사항' }
    };
    return typeMap[postType] || { icon: '📝', color: '#64748b', label: '소식' };
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
   * 최근 방문 매장 섹션 (미니멀)
   */
  renderRecentVisited(stores) {
    if (!stores || stores.length === 0) return '';

    const recentStores = stores.slice(0, 3);

    return `
      <section class="recent-section-minimal">
        <div class="section-header-compact">
          <h2 class="section-title">📍 최근 방문</h2>
        </div>
        <div class="recent-list-minimal">
          ${recentStores.map(store => this.renderRecentCardMinimal(store)).join('')}
        </div>
      </section>
    `;
  },

  /**
   * 최근 방문 카드 (미니멀)
   */
  renderRecentCardMinimal(store) {
    const levelIcon = window.regularPageService?.getLevelIcon(store.level) || '🏅';

    return `
      <div class="recent-card-minimal" onclick="goToStore(${store.storeId})">
        <div class="recent-icon-minimal">
          ${store.category === '카페' ? '☕' : store.category === '치킨' ? '🍗' : '🍜'}
        </div>
        <div class="recent-details-minimal">
          <div class="recent-name-row">
            <h3 class="recent-name-minimal">${store.storeName}</h3>
            <span class="recent-level-minimal">${levelIcon}</span>
          </div>
          <p class="recent-meta-minimal">${store.lastVisit} · ${store.points.toLocaleString()}P</p>
        </div>
      </div>
    `;
  },

  /**
   * 매장 리스트 (미니멀 + 자세히 보기)
   */
  renderStoresList(stores) {
    if (!stores || stores.length === 0) {
      return this.renderEmptyState();
    }

    const initialCount = 4;
    const hasMore = stores.length > initialCount;

    return `
      <section class="stores-section-minimal">
        <div class="section-header-compact">
          <h2 class="section-title">내 단골 매장</h2>
        </div>
        <div class="stores-list-minimal" id="storesList">
          ${stores.slice(0, initialCount).map(store => this.renderStoreCardMinimal(store)).join('')}
        </div>
        ${hasMore ? `
          <button class="show-all-stores-btn" onclick="showAllStores()" id="showAllBtn">
            전체 ${stores.length}곳 보기
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M19 9l-7 7-7-7"/>
            </svg>
          </button>
        ` : ''}
        <div class="hidden-stores" style="display:none">
          ${hasMore ? stores.slice(initialCount).map(store => this.renderStoreCardMinimal(store)).join('') : ''}
        </div>
      </section>
    `;
  },

  /**
   * 미니멀 매장 카드
   */
  renderStoreCardMinimal(store) {
    const levelIcon = window.regularPageService?.getLevelIcon(store.level) || '🏅';

    return `
      <div class="store-card-minimal" onclick="goToStore(${store.storeId})">
        <div class="store-left-minimal">
          <div class="store-icon-minimal">
            ${store.category === '카페' ? '☕' : store.category === '치킨' ? '🍗' : '🍜'}
          </div>
          <div class="store-info-minimal">
            <div class="store-name-row">
              <h3 class="store-name-minimal">${store.storeName}</h3>
              <span class="store-level-badge-minimal">${levelIcon}</span>
            </div>
            <p class="store-meta-minimal">${store.category} · ${store.lastVisit}</p>
          </div>
        </div>
        <div class="store-right-minimal">
          <div class="store-points-minimal">${store.points.toLocaleString()}P</div>
          ${store.coupons > 0 ? `<div class="store-coupons-minimal">🎟️ ${store.coupons}</div>` : ''}
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
                <img 
                  src="${store.imageUrl || '/TableLink.png'}" 
                  alt="${store.storeName}"
                  onerror="this.src='/TableLink.png'"
                >
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
                <img 
                  src="${store.imageUrl || '/TableLink.png'}" 
                  alt="${store.storeName}"
                  onerror="this.src='/TableLink.png'"
                >
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
          min-width: 100px;
          position: relative;
          border: none;
          background: transparent;
          border-radius: 100px;
          padding: 10px 12px;
          font-size: 14px;
          font-weight: 600;
          color: #6b7280;
          cursor: pointer;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          white-space: nowrap;
          z-index: 1;
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

        /* ===== 최근 방문 섹션 (미니멀) ===== */
        .recent-section-minimal {
          padding: 12px 20px;
          background: white;
          margin-bottom: 8px;
        }

        .section-header-compact {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 12px;
        }

        .section-title {
          margin: 0;
          font-size: 16px;
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

        .recent-list-minimal {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .recent-card-minimal {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 10px 12px;
          background: #f9fafb;
          border-radius: 10px;
          cursor: pointer;
          transition: all 0.2s;
        }

        .recent-card-minimal:active {
          background: #f3f4f6;
          transform: scale(0.98);
        }

        .recent-icon-minimal {
          font-size: 24px;
          width: 40px;
          height: 40px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: white;
          border-radius: 10px;
          flex-shrink: 0;
        }

        .recent-details-minimal {
          flex: 1;
          min-width: 0;
        }

        .recent-name-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 8px;
          margin-bottom: 2px;
        }

        .recent-name-minimal {
          margin: 0;
          font-size: 14px;
          font-weight: 700;
          color: #1f2937;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .recent-level-minimal {
          font-size: 14px;
          flex-shrink: 0;
        }

        .recent-meta-minimal {
          margin: 0;
          font-size: 12px;
          color: #9ca3af;
          font-weight: 500;
        }

        /* ===== 단골 소식 피드 섹션 (미니멀) ===== */
        .feed-section {
          background: white;
          border-radius: 12px;
          padding: 16px;
          margin-bottom: 16px;
        }

        .new-posts-banner {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          padding: 8px 12px;
          border-radius: 8px;
          display: flex;
          align-items: center;
          gap: 6px;
          margin-bottom: 12px;
          font-size: 12px;
          font-weight: 600;
        }

        .banner-icon {
          font-size: 14px;
        }

        .feed-list-preview {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .feed-post-card {
          background: #f8f9fa;
          border-radius: 10px;
          padding: 12px;
          transition: all 0.2s;
          cursor: pointer;
        }

        .feed-post-card:hover {
          background: #f1f3f5;
          transform: translateX(2px);
        }

        .post-card-compact {
          display: flex;
          gap: 10px;
          margin-bottom: 8px;
        }

        .post-left {
          flex: 1;
          display: flex;
          gap: 10px;
          min-width: 0;
        }

        .store-emoji-small {
          font-size: 18px;
          flex-shrink: 0;
        }

        .post-info {
          flex: 1;
          min-width: 0;
        }

        .post-header-row {
          display: flex;
          align-items: center;
          gap: 6px;
          margin-bottom: 4px;
        }

        .post-type-tag {
          font-size: 14px;
          flex-shrink: 0;
        }

        .post-card-title-compact {
          font-size: 14px;
          font-weight: 700;
          color: #2c3e50;
          margin: 0;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          flex: 1;
        }

        .post-card-preview {
          font-size: 12px;
          color: #7f8c8d;
          line-height: 1.4;
          margin: 0 0 6px 0;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .post-meta-row {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 11px;
          color: #95a5a6;
        }

        .store-name-small {
          font-weight: 600;
        }

        .post-time-small {
          color: #bdc3c7;
        }

        .post-thumbnail {
          width: 60px;
          height: 60px;
          border-radius: 8px;
          overflow: hidden;
          flex-shrink: 0;
        }

        .post-thumbnail img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .post-actions-minimal {
          display: flex;
          gap: 4px;
          padding-top: 8px;
          border-top: 1px solid #ecf0f1;
        }

        .action-btn-minimal {
          display: flex;
          align-items: center;
          gap: 4px;
          padding: 4px 8px;
          border: none;
          background: transparent;
          border-radius: 6px;
          font-size: 12px;
          cursor: pointer;
          transition: all 0.2s;
        }

        .action-btn-minimal:hover {
          background: rgba(0, 0, 0, 0.05);
        }

        .action-count {
          font-size: 11px;
          color: #7f8c8d;
        }

        .coupon-btn-minimal {
          margin-left: auto;
          padding: 4px 10px;
          border: none;
          background: linear-gradient(135deg, #FF8A00 0%, #FF9F33 100%);
          color: white;
          border-radius: 6px;
          font-size: 12px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
        }

        .coupon-btn-minimal.received {
          background: #e9ecef;
          color: #95a5a6;
          cursor: not-allowed;
        }

        .show-more-btn {
          width: 100%;
          padding: 10px;
          background: #f8f9fa;
          border: none;
          border-radius: 8px;
          color: #546e7a;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 4px;
          margin-top: 8px;
          transition: all 0.2s;
        }

        .show-more-btn:hover {
          background: #e9ecef;
        }

        /* ===== 매장 섹션 (미니멀) ===== */
        .stores-section-minimal {
          padding: 12px 20px;
          background: white;
          margin-bottom: 80px;
        }

        .stores-list-minimal {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .store-card-minimal {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          padding: 12px;
          background: #f9fafb;
          border-radius: 10px;
          cursor: pointer;
          transition: all 0.2s;
        }

        .store-card-minimal:active {
          background: #f3f4f6;
          transform: scale(0.98);
        }

        .store-left-minimal {
          display: flex;
          align-items: center;
          gap: 12px;
          flex: 1;
          min-width: 0;
        }

        .store-icon-minimal {
          font-size: 24px;
          width: 44px;
          height: 44px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: white;
          border-radius: 10px;
          flex-shrink: 0;
        }

        .store-info-minimal {
          flex: 1;
          min-width: 0;
        }

        .store-name-row {
          display: flex;
          align-items: center;
          gap: 6px;
          margin-bottom: 2px;
        }

        .store-name-minimal {
          margin: 0;
          font-size: 14px;
          font-weight: 700;
          color: #1f2937;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .store-level-badge-minimal {
          font-size: 14px;
          flex-shrink: 0;
        }

        .store-meta-minimal {
          margin: 0;
          font-size: 12px;
          color: #9ca3af;
          font-weight: 500;
        }

        .store-right-minimal {
          display: flex;
          flex-direction: column;
          align-items: flex-end;
          gap: 2px;
          flex-shrink: 0;
        }

        .store-points-minimal {
          font-size: 13px;
          font-weight: 700;
          color: #FF8A00;
        }

        .store-coupons-minimal {
          font-size: 11px;
          color: #6b7280;
        }

        .show-all-stores-btn {
          width: 100%;
          padding: 12px;
          margin-top: 12px;
          border-radius: 10px;
          border: 1px solid #e5e7eb;
          background: white;
          color: #6b7280;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          transition: all 0.2s;
        }

        .show-all-stores-btn:active {
          background: #f9fafb;
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