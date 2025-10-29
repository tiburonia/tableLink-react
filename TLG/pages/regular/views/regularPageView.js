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

        <!-- 탭 컨텐츠 영역 -->
        <div class="tab-content-area">
          <!-- 주변 매장 탭 -->
          <div class="tab-pane active" id="nearbyPane">
            ${this.renderFavoriteStoresPreview(favoriteStores)}
            ${this.renderRecentVisited(stores)}
            ${this.renderStoresList(stores)}
            ${this.renderFollowingPostsPreview(posts)}

            
          </div>

          <!-- 팔로우 매장 탭 -->
          <div class="tab-pane" id="followingPane" style="display:none;">
            ${this.renderStoreFeed(posts)}
          </div>
        </div>

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
          <button class="icon-btn hamburger-btn" id="sideMenuBtn" aria-label="메뉴">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="3" y1="12" x2="21" y2="12"/>
              <line x1="3" y1="6" x2="21" y2="6"/>
              <line x1="3" y1="18" x2="21" y2="18"/>
            </svg>
          </button>
          <h1 class="page-title">내 맛집</h1>
          <div class="header-actions">
            <button class="icon-btn" id="notificationBtn" aria-label="알림">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
                <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
              </svg>
              <span class="notification-badge">3</span>
            </button>
            <button class="icon-btn" id="messageBtn" aria-label="메시지">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
              </svg>
            </button>
          </div>
        </div>

        <!-- 탭 네비게이션 -->
        <div class="tab-navigation">
          <button class="tab-nav-btn active" data-tab="nearby" id="nearbyTab">
            주변 매장
          </button>
          <button class="tab-nav-btn" data-tab="following" id="followingTab">
            팔로우·단골 매장
          </button>
        </div>
      </header>

      <!-- 사이드패널 오버레이 -->
      <div class="side-panel-overlay" id="sidePanelOverlay"></div>

      <!-- 사이드패널 -->
      <div class="side-panel" id="sidePanel">
        <div class="side-panel-header">
          <div class="side-panel-profile">
            <div class="side-panel-avatar">
              <img src="/TableLink.png" alt="프로필" onerror="this.style.display='none'">
            </div>
            <div class="side-panel-user-info">
              <h3 class="side-panel-username">${window.userInfo?.userId || '게스트'}</h3>
              <p class="side-panel-email">${window.userInfo?.name || ''}</p>
            </div>
          </div>
          <button class="side-panel-close-btn" id="sidePanelCloseBtn">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="18" y1="6" x2="6" y2="18"/>
              <line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        <nav class="side-panel-nav">
          <a href="#" class="side-panel-menu-item" onclick="renderMyPage(); window.closeSidePanel(); return false;">
            <div class="side-panel-menu-icon">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                <circle cx="12" cy="7" r="4"/>
              </svg>
            </div>
            <span class="side-panel-menu-text">내 프로필</span>
            <svg class="side-panel-menu-arrow" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M9 18l6-6-6-6"/>
            </svg>
          </a>

          <a href="#" class="side-panel-menu-item" onclick="renderStoreFeed(); window.closeSidePanel(); return false;">
            <div class="side-panel-menu-icon">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/>
                <line x1="4" y1="22" x2="4" y2="15"/>
              </svg>
            </div>
            <span class="side-panel-menu-text">팔로우 매장</span>
            <svg class="side-panel-menu-arrow" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M9 18l6-6-6-6"/>
            </svg>
          </a>

          <a href="#" class="side-panel-menu-item" onclick="renderAllRegularLevels(window.userInfo); window.closeSidePanel(); return false;">
            <div class="side-panel-menu-icon">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                <circle cx="9" cy="7" r="4"/>
                <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
                <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
              </svg>
            </div>
            <span class="side-panel-menu-text">단골 매장</span>
            <svg class="side-panel-menu-arrow" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M9 18l6-6-6-6"/>
            </svg>
          </a>

          <a href="#" class="side-panel-menu-item" onclick="renderAllCoupons(window.userInfo); window.closeSidePanel(); return false;">
            <div class="side-panel-menu-icon">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/>
                <line x1="7" y1="7" x2="7.01" y2="7"/>
              </svg>
            </div>
            <span class="side-panel-menu-text">쿠폰함</span>
            <svg class="side-panel-menu-arrow" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M9 18l6-6-6-6"/>
            </svg>
          </a>

          <div class="side-panel-divider"></div>

          <a href="#" class="side-panel-menu-item" onclick="renderMyAccount(); window.closeSidePanel(); return false;">
            <div class="side-panel-menu-icon">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="3"/>
                <path d="M12 1v6m0 6v6m-8.66-8.66l5.2 3M15.46 8.34l5.2-3m-5.2 10.32l5.2 3M9.66 15.66l-5.2 3"/>
              </svg>
            </div>
            <span class="side-panel-menu-text">설정</span>
            <svg class="side-panel-menu-arrow" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M9 18l6-6-6-6"/>
            </svg>
          </a>

          <a href="#" class="side-panel-menu-item" onclick="alert('알림 설정'); window.closeSidePanel(); return false;">
            <div class="side-panel-menu-icon">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
                <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
              </svg>
            </div>
            <span class="side-panel-menu-text">알림 설정</span>
            <svg class="side-panel-menu-arrow" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M9 18l6-6-6-6"/>
            </svg>
          </a>

          <div class="side-panel-divider"></div>

          <a href="#" class="side-panel-menu-item" onclick="alert('고객센터'); window.closeSidePanel(); return false;">
            <div class="side-panel-menu-icon">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="10"/>
                <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/>
                <line x1="12" y1="17" x2="12.01" y2="17"/>
              </svg>
            </div>
            <span class="side-panel-menu-text">고객센터</span>
            <svg class="side-panel-menu-arrow" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M9 18l6-6-6-6"/>
            </svg>
          </a>

          <a href="#" class="side-panel-menu-item side-panel-menu-item-danger" onclick="if(confirm('로그아웃 하시겠습니까?')) { window.performLogout(); window.closeSidePanel(); } return false;">
            <div class="side-panel-menu-icon">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
                <polyline points="16 17 21 12 16 7"/>
                <line x1="21" y1="12" x2="9" y2="12"/>
              </svg>
            </div>
            <span class="side-panel-menu-text">로그아웃</span>
          </a>
        </nav>

        <div class="side-panel-footer">
          <p class="side-panel-version">TableLink v1.0.0</p>
        </div>
      </div>
    `;
  },



  /**
   * 매장 소식 피드 섹션
   */
  renderStoreFeed(posts) {
    if (!posts || posts.length === 0) {
      return `
        <div class="feed-empty-state">
          <div class="empty-icon">📭</div>
          <h3>팔로우 중인 매장이 없습니다</h3>
          <p>자주 가는 매장을 팔로우하고<br>최신 소식을 받아보세요!</p>
        </div>
      `;
    }

    return `
      <div class="feed-list">
        ${posts.map(post => this.renderPostCard(post)).join('')}
      </div>
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
   * 최근 방문 매장 섹션
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
   * 최근 방문 카드
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
          <div class="recent-info-row">
            <span class="recent-category">${store.category}</span>
            <span class="recent-divider">·</span>
            <span class="recent-visit">${store.lastVisit}</span>
          </div>
          <div class="recent-stats-row">
            <span class="recent-points">💰 ${store.points.toLocaleString()}P</span>
            ${store.coupons > 0 ? `<span class="recent-coupons">🎟️ ${store.coupons}장</span>` : ''}
          </div>
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
   * 팔로우 매장 게시물 미리보기 (주변 매장 탭)
   */
  renderFollowingPostsPreview(posts) {
    if (!posts || posts.length === 0) return '';

    const previewPosts = posts.slice(0, 3);

    return `
      <section class="following-posts-preview-section">
        <div class="section-header-compact">
          <h2 class="section-title">📰 팔로우 매장 소식</h2>
          <button class="view-all-btn" onclick="document.getElementById('followingTab').click()">
            전체보기
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M9 18l6-6-6-6"/>
            </svg>
          </button>
        </div>

        <div class="following-posts-preview-list">
          ${previewPosts.map(post => this.renderPostCardCompact(post)).join('')}
        </div>
      </section>
      <!-- lazy-loading 방식으로 끊임없이 추가 게시물 로딩 -->
    `;
  },

  /**
   * 컴팩트 게시물 카드 (미리보기용 - 인스타그램 스타일)
   */
  renderPostCardCompact(post) {
    const relativeTime = window.regularPageService?.getRelativeTime(post.createdAt) || '최근';
    const typeInfo = this.getTypeInfo(post.postType);
    const truncatedContent = post.content.length > 80
      ? post.content.substring(0, 80) + '...'
      : post.content;

    return `
      <article class="post-card-compact-preview instagram-style" data-action="goto-feed">
        <div class="post-header-compact">
          <div class="post-header-left">
            <span class="store-avatar">${post.storeLogo || '🏪'}</span>
            <div class="post-header-info">
              <h4 class="post-compact-store-name">${post.storeName}</h4>
              <span class="post-compact-time">${relativeTime}</span>
            </div>
          </div>
          <span class="post-type-badge-compact" style="background: ${typeInfo.color}20; color: ${typeInfo.color};">
            ${typeInfo.icon}
          </span>
        </div>

        ${post.hasImage ? `
          <div class="post-image-large">
            <img 
              src="${post.imageUrl || '/TableLink.png'}" 
              alt="${post.title}"
              onerror="this.src='/TableLink.png'"
            >
          </div>
        ` : ''}

        <div class="post-content-compact">
          <h3 class="post-compact-title-large">${post.title}</h3>
          <p class="post-compact-preview-large">${truncatedContent}</p>
        </div>

        <div class="post-actions-compact">
          <button class="action-btn-compact" onclick="event.stopPropagation()">
            <span class="action-icon">${post.hasLiked ? '❤️' : '🤍'}</span>
            <span class="action-text">좋아요 ${post.likes}</span>
          </button>
          <button class="action-btn-compact" onclick="event.stopPropagation()">
            <span class="action-icon">💬</span>
            <span class="action-text">댓글 ${post.comments}</span>
          </button>
          ${post.hasCoupon ? `
            <button class="coupon-btn-compact ${post.couponReceived ? 'received' : ''}" 
                    onclick="event.stopPropagation(); receiveCoupon(${post.id}, ${post.storeId})"
                    ${post.couponReceived ? 'disabled' : ''}>
              <span class="coupon-icon">${post.couponReceived ? '✓' : '🎁'}</span>
              <span class="coupon-text">${post.couponReceived ? '받음' : '쿠폰받기'}</span>
            </button>
          ` : ''}
        </div>
      </article>
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
              <div class="favorite-list-left">
                <div class="favorite-list-image">
                  <img 
                    src="${store.imageUrl || '/TableLink.png'}" 
                    alt="${store.storeName}"
                    onerror="this.src='/TableLink.png'"
                  >
                </div>
                <div class="favorite-list-info">
                  <div class="favorite-list-name-row">
                    <h3 class="favorite-list-name">${store.storeName}</h3>
                  </div>
                  <div class="favorite-list-meta">
                    <span class="favorite-list-category">${store.category || '기타'}</span>
                    ${store.distance ? `
                      <span class="favorite-list-divider">·</span>
                      <span class="favorite-list-distance">${store.distance}</span>
                    ` : ''}
                  </div>
                </div>
              </div>
              <button class="favorite-remove-btn" onclick="event.stopPropagation(); removeFavorite(${store.storeId})">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
                </svg>
              </button>
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
          position: sticky;
          top: 0;
          z-index: 100;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
        }

        .header-content {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 12px 20px;
        }

        .hamburger-btn {
          margin-right: 12px;
        }

        .page-title {
          margin: 0;
          font-size: 20px;
          font-weight: 700;
          color: #1f2937;
          flex: 1;
        }

        .header-actions {
          display: flex;
          gap: 8px;
        }

        .icon-btn {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          border: none;
          background: #f3f4f6;
          color: #6b7280;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s;
          position: relative;
        }

        .icon-btn:active {
          transform: scale(0.95);
          background: #e5e7eb;
        }

        .notification-badge {
          position: absolute;
          top: 6px;
          right: 6px;
          background: #ef4444;
          color: white;
          font-size: 10px;
          font-weight: 700;
          width: 16px;
          height: 16px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          border: 2px solid white;
        }

        /* ===== 탭 네비게이션 ===== */
        .tab-navigation {
          display: flex;
          border-bottom: 1px solid #e5e7eb;
          background: white;
        }

        .tab-nav-btn {
          flex: 1;
          padding: 14px 16px;
          border: none;
          background: transparent;
          color: #9ca3af;
          font-size: 15px;
          font-weight: 600;
          cursor: pointer;
          position: relative;
          transition: all 0.2s;
        }

        .tab-nav-btn.active {
          color: #FF8A00;
        }

        .tab-nav-btn.active::after {
          content: '';
          position: absolute;
          bottom: -1px;
          left: 0;
          right: 0;
          height: 3px;
          background: #FF8A00;
          border-radius: 3px 3px 0 0;
        }

        .tab-nav-btn:hover:not(.active) {
          color: #6b7280;
          background: #f9fafb;
        }

        /* ===== 탭 컨텐츠 영역 ===== */
        .tab-content-area {
          flex: 1;
          overflow-y: auto;
          background: #fafafa;
        }

        .tab-pane {
          min-height: 100%;
          animation: fadeIn 0.3s ease;
        }

        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        /* ===== 피드 리스트 ===== */
        .feed-list {
          padding: 12px 0;
        }

        .feed-empty-state {
          text-align: center;
          padding: 80px 20px;
        }

        .feed-empty-state .empty-icon {
          font-size: 64px;
          margin-bottom: 16px;
          opacity: 0.5;
        }

        .feed-empty-state h3 {
          margin: 0 0 8px 0;
          font-size: 18px;
          font-weight: 700;
          color: #1f2937;
        }

        .feed-empty-state p {
          margin: 0;
          font-size: 14px;
          color: #9ca3af;
          line-height: 1.6;
        }

        /* ===== 최근 방문 섹션 ===== */
        .recent-section-minimal {
          padding: 16px 20px;
          background: white;
          margin-bottom: 8px;
        }

        .section-header-compact {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin: 12px;
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
          gap: 10px;
        }

        .recent-card-minimal {
          display: flex;
          align-items: center;
          gap: 14px;
          padding: 14px;
          background: #f9fafb;
          border-radius: 12px;
          cursor: pointer;
          transition: all 0.2s;
        }

        .recent-card-minimal:active {
          background: #f3f4f6;
          transform: scale(0.98);
        }

        .recent-icon-minimal {
          font-size: 28px;
          width: 50px;
          height: 50px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: white;
          border-radius: 12px;
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
          margin-bottom: 4px;
        }

        .recent-name-minimal {
          margin: 0;
          font-size: 15px;
          font-weight: 700;
          color: #1f2937;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .recent-level-minimal {
          font-size: 16px;
          flex-shrink: 0;
        }

        .recent-info-row {
          display: flex;
          align-items: center;
          gap: 6px;
          margin-bottom: 4px;
        }

        .recent-category {
          font-size: 13px;
          color: #6b7280;
          font-weight: 500;
        }

        .recent-divider {
          font-size: 12px;
          color: #d1d5db;
        }

        .recent-visit {
          font-size: 13px;
          color: #9ca3af;
          font-weight: 500;
        }

        .recent-stats-row {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .recent-points {
          font-size: 13px;
          font-weight: 600;
          color: #FF8A00;
        }

        .recent-coupons {
          font-size: 12px;
          font-weight: 600;
          color: #10b981;
        }

        .recent-meta-minimal {
          margin: 0;
          font-size: 12px;
          color: #9ca3af;
          font-weight: 500;
        }

        /* ===== 단골 소식 피드 섹션 ===== */
        .feed-post-card {
          background: white;
          margin-bottom: 8px;
          padding: 16px 20px;
          border-bottom: 8px solid #f8fafc;
          transition: all 0.2s;
          cursor: pointer;
        }

        .feed-post-card:active {
          background: #f9fafb;
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

        /* ===== 팔로우 매장 게시물 미리보기 (인스타그램 스타일) ===== */
        .following-posts-preview-section {
          padding: 16px 0;
          background: white;
          margin-bottom: 8px;
        }

        .following-posts-preview-list {
          display: flex;
          flex-direction: column;
          gap: 0;
        }

        .post-card-compact-preview {
          display: flex;
          flex-direction: column;
          background: white;
          border-bottom: 8px solid #f8fafc;
          cursor: pointer;
          transition: all 0.2s;
          padding: 0;
        }

        .post-card-compact-preview:active {
          background: #fafafa;
        }

        .post-header-compact {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 12px 16px;
        }

        .post-header-left {
          display: flex;
          align-items: center;
          gap: 10px;
          flex: 1;
          min-width: 0;
        }

        .store-avatar {
          width: 40px;
          height: 40px;
          background: linear-gradient(135deg, #FF8A00, #FF9F33);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 20px;
          flex-shrink: 0;
          box-shadow: 0 2px 8px rgba(255, 138, 0, 0.2);
        }

        .post-header-info {
          flex: 1;
          min-width: 0;
        }

        .post-compact-store-name {
          margin: 0;
          font-size: 14px;
          font-weight: 700;
          color: #1f2937;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .post-compact-time {
          font-size: 11px;
          color: #9ca3af;
          font-weight: 500;
        }

        .post-type-badge-compact {
          padding: 4px 10px;
          border-radius: 12px;
          font-size: 12px;
          font-weight: 600;
          flex-shrink: 0;
        }

        .post-image-large {
          width: 100%;
          aspect-ratio: 3 / 1;
          overflow: hidden;
          background: #f3f4f6;
        }

        .post-image-large img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .post-content-compact {
          padding: 12px 16px;
        }

        .post-compact-title-large {
          margin: 0 0 6px 0;
          font-size: 16px;
          font-weight: 700;
          color: #1f2937;
          line-height: 1.4;
        }

        .post-compact-preview-large {
          margin: 0;
          font-size: 14px;
          color: #6b7280;
          line-height: 1.5;
        }

        .post-actions-compact {
          display: flex;
          align-items: center;
          gap: 4px;
          padding: 8px 12px 12px 12px;
          border-top: 1px solid #f3f4f6;
        }

        .action-btn-compact {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 6px 12px;
          border: none;
          background: #f9fafb;
          border-radius: 8px;
          font-size: 13px;
          font-weight: 600;
          color: #6b7280;
          cursor: pointer;
          transition: all 0.2s;
        }

        .action-btn-compact:active {
          background: #f3f4f6;
          transform: scale(0.97);
        }

        .action-icon {
          font-size: 16px;
        }

        .action-text {
          font-size: 12px;
        }

        .coupon-btn-compact {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 6px 14px;
          border: none;
          background: linear-gradient(135deg, #FF8A00, #FF9F33);
          color: white;
          border-radius: 8px;
          font-size: 13px;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.2s;
          margin-left: auto;
        }

        .coupon-btn-compact:active {
          transform: scale(0.97);
        }

        .coupon-btn-compact.received {
          background: #e5e7eb;
          color: #9ca3af;
          cursor: not-allowed;
        }

        .coupon-icon {
          font-size: 14px;
        }

        .coupon-text {
          font-size: 12px;
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
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .favorite-list-card {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          padding: 14px;
          background: #f9fafb;
          border-radius: 12px;
          cursor: pointer;
          transition: all 0.2s;
          position: relative;
        }

        .favorite-list-card:active {
          transform: scale(0.98);
          background: #f3f4f6;
        }

        .favorite-list-left {
          display: flex;
          align-items: center;
          gap: 14px;
          flex: 1;
          min-width: 0;
        }

        .favorite-list-image {
          width: 50px;
          height: 50px;
          border-radius: 12px;
          overflow: hidden;
          background: white;
          flex-shrink: 0;
        }

        .favorite-list-image img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .favorite-list-info {
          flex: 1;
          min-width: 0;
        }

        .favorite-list-name-row {
          display: flex;
          align-items: center;
          gap: 6px;
          margin-bottom: 4px;
        }

        .favorite-list-name {
          margin: 0;
          font-size: 15px;
          font-weight: 700;
          color: #1f2937;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          flex: 1;
        }

        .favorite-list-meta {
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .favorite-list-category {
          margin: 0;
          font-size: 13px;
          color: #6b7280;
          font-weight: 500;
        }

        .favorite-list-divider {
          font-size: 12px;
          color: #d1d5db;
        }

        .favorite-list-distance {
          margin: 0;
          font-size: 13px;
          color: #9ca3af;
          font-weight: 500;
        }

        .favorite-remove-btn {
          width: 36px;
          height: 36px;
          border-radius: 10px;
          border: none;
          background: white;
          color: #ef4444;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s;
          flex-shrink: 0;
        }

        .favorite-remove-btn:active {
          transform: scale(0.95);
          background: #fee2e2;
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

        /* ===== 사이드패널 오버레이 ===== */
        .side-panel-overlay {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: rgba(0, 0, 0, 0);
          opacity: 0;
          visibility: hidden;
          transition: opacity 0.3s ease, visibility 0.3s ease;
          z-index: 9998;
          pointer-events: none;
        }

        .side-panel-overlay.active {
          opacity: 1;
          visibility: visible;
          background: rgba(0, 0, 0, 0.4);
          pointer-events: auto;
          backdrop-filter: blur(2px);
        }

        /* ===== 사이드패널 ===== */
        .side-panel {
          position: fixed;
          top: 0;
          left: 0;
          width: 280px;
          height: 100%;
          background: #ffffff;
          box-shadow: 4px 0 24px rgba(0, 0, 0, 0.15);
          transform: translate3d(-100%, 0, 0);
          transition: transform 0.35s cubic-bezier(0.4, 0, 0.2, 1);
          z-index: 9999;
          display: flex;
          flex-direction: column;
          overflow: hidden;
        }

        .side-panel.active {
          transform: translate3d(0, 0, 0);
        }

        .side-panel.dragging {
          transition: none;
        }

        /* 사이드패널 헤더 */
        .side-panel-header {
          padding: 40px 20px 20px 20px;
          background: linear-gradient(135deg, #FF8A00, #FF9F33);
          position: relative;
          flex-shrink: 0;
        }

        .side-panel-profile {
          display: flex;
          align-items: center;
          gap: 14px;
        }

        .side-panel-avatar {
          width: 56px;
          height: 56px;
          border-radius: 50%;
          background: white;
          overflow: hidden;
          border: 3px solid rgba(255, 255, 255, 0.3);
          flex-shrink: 0;
        }

        .side-panel-avatar img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .side-panel-user-info {
          flex: 1;
          min-width: 0;
        }

        .side-panel-username {
          margin: 0 0 4px 0;
          font-size: 18px;
          font-weight: 700;
          color: white;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .side-panel-email {
          margin: 0;
          font-size: 13px;
          color: rgba(255, 255, 255, 0.85);
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .side-panel-close-btn {
          position: absolute;
          top: 12px;
          right: 12px;
          width: 36px;
          height: 36px;
          border-radius: 50%;
          background: rgba(255, 255, 255, 0.2);
          border: none;
          color: white;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s;
        }

        .side-panel-close-btn:active {
          background: rgba(255, 255, 255, 0.3);
          transform: scale(0.95);
        }

        /* 사이드패널 네비게이션 */
        .side-panel-nav {
          flex: 1;
          overflow-y: auto;
          padding: 12px 0;
        }

        .side-panel-nav::-webkit-scrollbar {
          width: 4px;
        }

        .side-panel-nav::-webkit-scrollbar-thumb {
          background: #d1d5db;
          border-radius: 4px;
        }

        .side-panel-menu-item {
          display: flex;
          align-items: center;
          gap: 14px;
          padding: 16px 20px;
          color: #1f2937;
          text-decoration: none;
          transition: all 0.2s;
          position: relative;
        }

        .side-panel-menu-item:active {
          background: #f3f4f6;
        }

        .side-panel-menu-item::after {
          content: '';
          position: absolute;
          bottom: 0;
          left: 20px;
          right: 20px;
          height: 1px;
          background: #f3f4f6;
        }

        .side-panel-menu-item:last-of-type::after {
          display: none;
        }

        .side-panel-menu-icon {
          width: 36px;
          height: 36px;
          background: #f3f4f6;
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          color: #6b7280;
        }

        .side-panel-menu-text {
          flex: 1;
          font-size: 15px;
          font-weight: 600;
          color: #1f2937;
        }

        .side-panel-menu-arrow {
          color: #9ca3af;
          flex-shrink: 0;
        }

        .side-panel-menu-item-danger {
          color: #ef4444;
        }

        .side-panel-menu-item-danger .side-panel-menu-icon {
          background: #fee2e2;
          color: #ef4444;
        }

        .side-panel-menu-item-danger .side-panel-menu-text {
          color: #ef4444;
        }

        .side-panel-divider {
          height: 8px;
          background: #f9fafb;
          margin: 8px 0;
        }

        /* 사이드패널 푸터 */
        .side-panel-footer {
          padding: 16px 20px;
          border-top: 1px solid #f3f4f6;
          background: #fafafa;
          flex-shrink: 0;
        }

        .side-panel-version {
          margin: 0;
          font-size: 12px;
          color: #9ca3af;
          text-align: center;
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

          .side-panel {
            width: 85%;
            max-width: 320px;
          }
        }
      </style>
    `;
  }
};

window.regularPageView = regularPageView;
console.log('✅ regularPageView v3 모듈 로드 완료 (네비게이션 개선)');