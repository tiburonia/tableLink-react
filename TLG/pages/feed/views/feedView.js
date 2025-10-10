
/**
 * 단골 소식 피드 View
 * SNS 스타일 피드 UI
 */

export const feedView = {
  /**
   * 메인 피드 페이지 렌더링
   */
  render(data, currentTab = 'all') {
    const { posts, totalCount } = data;

    return `
      <div class="feed-page-container">
        ${this.renderHeader()}
        ${this.renderTabs(currentTab)}
        ${this.renderFeedList(posts)}
        ${this.renderBottomNav()}
      </div>
      ${this.getStyles()}
    `;
  },

  /**
   * 헤더 렌더링
   */
  renderHeader() {
    return `
      <header class="feed-header">
        <button class="back-btn" onclick="renderRegularPage()">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M19 12H5m7-7l-7 7 7 7"/>
          </svg>
        </button>
        <h1 class="feed-title">📰 단골 소식</h1>
        <div class="feed-actions">
          <button class="icon-btn" id="searchFeedBtn">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="11" cy="11" r="8"/>
              <path d="m21 21-4.35-4.35"/>
            </svg>
          </button>
          <button class="icon-btn" id="filterFeedBtn">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="4" y1="21" x2="4" y2="14"/>
              <line x1="4" y1="10" x2="4" y2="3"/>
              <line x1="12" y1="21" x2="12" y2="12"/>
              <line x1="12" y1="8" x2="12" y2="3"/>
              <line x1="20" y1="21" x2="20" y2="16"/>
              <line x1="20" y1="12" x2="20" y2="3"/>
            </svg>
          </button>
        </div>
      </header>
    `;
  },

  /**
   * 탭 렌더링
   */
  renderTabs(currentTab) {
    const tabs = [
      { id: 'all', label: '전체', icon: '📢' },
      { id: 'fav', label: '내 단골', icon: '❤️' },
      { id: 'event', label: '이벤트', icon: '🎉' },
      { id: 'menu', label: '신메뉴', icon: '🍽️' }
    ];

    return `
      <div class="feed-tabs">
        ${tabs.map(tab => `
          <button 
            class="feed-tab ${currentTab === tab.id ? 'active' : ''}" 
            data-tab="${tab.id}"
            onclick="switchFeedTab('${tab.id}')">
            <span class="tab-icon">${tab.icon}</span>
            <span class="tab-label">${tab.label}</span>
          </button>
        `).join('')}
      </div>
    `;
  },

  /**
   * 피드 리스트 렌더링
   */
  renderFeedList(posts) {
    if (!posts || posts.length === 0) {
      return `
        <div class="feed-empty">
          <div class="empty-icon">📭</div>
          <h3>소식이 없어요</h3>
          <p>단골 매장의 새로운 소식을 기다려주세요!</p>
        </div>
      `;
    }

    return `
      <div class="feed-content">
        <div class="feed-list">
          ${posts.map(post => this.renderPostCard(post)).join('')}
        </div>
      </div>
    `;
  },

  /**
   * 포스트 카드 렌더링
   */
  renderPostCard(post) {
    const levelColor = window.feedService?.getLevelColor(post.userLevel) || '#64748b';
    const relativeTime = window.feedService?.getRelativeTime(post.createdAt) || '최근';
    const tagColor = window.feedService?.getTagColor(post.postType) || '#64748b';

    return `
      <div class="feed-post-card" data-post-id="${post.id}">
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
              <img src="${post.imageUrl}" alt="${post.title}" class="post-image" loading="lazy" />
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

          <div class="post-cta-buttons">
            ${post.hasCoupon ? `
              <button class="coupon-btn-feed ${post.couponReceived ? 'received' : ''}" 
                      onclick="receiveCoupon(${post.id}, ${post.storeId})"
                      ${post.couponReceived ? 'disabled' : ''}>
                ${post.couponReceived ? '✅ 쿠폰받음' : '🎟️ 쿠폰받기'}
              </button>
            ` : ''}
            <button class="order-btn-feed" onclick="goToStore(${post.storeId})">
              🍴 주문하기
            </button>
          </div>
        </div>
      </div>
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
        <button onclick="renderRegularPage()" class="nav-item">
          <span class="nav-icon">
            <img width="26" height="26" src="https://img.icons8.com/pastel-glyph/26/shop--v2.png" alt="regular"/>
          </span>
          <span class="nav-label">단골매장</span>
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
        .feed-page-container {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 775px;
          background: #fafafa;
          overflow-y: auto;
          padding-bottom: 80px;
        }

        /* 헤더 */
        .feed-header {
          position: sticky;
          top: 0;
          background: white;
          padding: 60px 16px 16px 16px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          z-index: 100;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
        }

        .back-btn {
          width: 40px;
          height: 40px;
          border-radius: 12px;
          border: none;
          background: #f3f4f6;
          color: #475569;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.2s;
        }

        .back-btn:active {
          background: #e5e7eb;
        }

        .feed-title {
          margin: 0;
          font-size: 20px;
          font-weight: 800;
          color: #1f2937;
          flex: 1;
          text-align: center;
        }

        .feed-actions {
          display: flex;
          gap: 8px;
        }

        .icon-btn {
          width: 40px;
          height: 40px;
          border-radius: 12px;
          border: none;
          background: #f3f4f6;
          color: #6b7280;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.2s;
        }

        .icon-btn:active {
          background: #e5e7eb;
        }

        /* 탭 */
        .feed-tabs {
          position: sticky;
          top: 72px;
          background: white;
          padding: 12px 16px;
          display: flex;
          gap: 8px;
          overflow-x: auto;
          z-index: 99;
          border-bottom: 1px solid #f3f4f6;
        }

        .feed-tab {
          flex-shrink: 0;
          padding: 10px 16px;
          border-radius: 20px;
          border: none;
          background: #f3f4f6;
          color: #6b7280;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 6px;
          transition: all 0.2s;
        }

        .feed-tab.active {
          background: linear-gradient(135deg, #FF8A00 0%, #ff9f33 100%);
          color: white;
          box-shadow: 0 4px 12px rgba(255, 138, 0, 0.3);
        }

        .feed-tab:active {
          transform: scale(0.95);
        }

        .tab-icon {
          font-size: 16px;
        }

        /* 피드 컨텐츠 */
        .feed-content {
          padding: 16px;
        }

        .feed-list {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .feed-post-card {
          background: white;
          border-radius: 16px;
          padding: 20px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
          transition: all 0.3s ease;
        }

        .feed-post-card:active {
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
          width: 48px;
          height: 48px;
          border-radius: 14px;
          background: #f3f4f6;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 24px;
        }

        .post-store-details {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .post-store-name {
          margin: 0;
          font-size: 16px;
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
          font-size: 18px;
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
          flex-wrap: wrap;
          gap: 12px;
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

        .post-cta-buttons {
          display: flex;
          gap: 8px;
        }

        .coupon-btn-feed,
        .order-btn-feed {
          padding: 10px 16px;
          border-radius: 10px;
          border: none;
          font-size: 13px;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.2s;
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .coupon-btn-feed {
          background: #FF8A00;
          color: white;
        }

        .coupon-btn-feed:active {
          transform: scale(0.95);
          background: #e67a00;
        }

        .coupon-btn-feed.received {
          background: #10b981;
          cursor: not-allowed;
        }

        .order-btn-feed {
          background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%);
          color: white;
        }

        .order-btn-feed:active {
          transform: scale(0.95);
        }

        /* Empty State */
        .feed-empty {
          text-align: center;
          padding: 80px 20px;
        }

        .empty-icon {
          font-size: 64px;
          margin-bottom: 16px;
          opacity: 0.6;
        }

        .feed-empty h3 {
          margin: 0 0 8px 0;
          font-size: 18px;
          font-weight: 700;
          color: #1f2937;
        }

        .feed-empty p {
          margin: 0;
          font-size: 14px;
          color: #9ca3af;
        }

        /* 바텀 네비 */
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

        .nav-label {
          font-size: 11px;
          color: #9ca3af;
          font-weight: 500;
        }
      </style>
    `;
  }
};

window.feedView = feedView;
console.log('✅ feedView 모듈 로드 완료');
