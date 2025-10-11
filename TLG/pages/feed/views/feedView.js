
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
            <path d="M19 12H5M12 19l-7-7 7-7"/>
          </svg>
        </button>
        <h2 class="feed-title">단골 소식</h2>
        <div class="header-spacer"></div>
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
    const relativeTime = window.feedService?.getRelativeTime(post.createdAt) || '최근';
    const typeInfo = this.getTypeInfo(post.postType);

    return `
      <article class="feed-post" data-post-id="${post.id}" data-type="${post.postType}">
        <div class="post-header">
          <div class="post-store-logo">${post.storeLogo}</div>
          <div class="post-meta">
            <span class="post-author">${post.storeName}</span>
            <span class="post-date">${relativeTime}</span>
          </div>
          ${this.renderTypeBadge(post.postType)}
        </div>

        ${post.hasImage ? `<img src="${post.imageUrl}" class="post-image" alt="${post.title}">` : ''}

        <div class="post-body">
          <h3 class="post-title">${post.title}</h3>
          <p class="post-caption">${post.content}</p>
          
          <div class="post-actions">
            <button class="like-btn ${post.hasLiked ? 'liked' : ''}" onclick="toggleLike(${post.id})">
              <span class="like-icon">${post.hasLiked ? '❤️' : '🤍'}</span>
              <span class="like-count">${post.likes}</span>
            </button>
            <button class="comment-btn" onclick="viewComments(${post.id})">
              <span class="comment-icon">💬</span>
              <span class="comment-text">댓글 ${post.comments}</span>
            </button>
            ${post.hasCoupon ? `
              <button class="coupon-btn ${post.couponReceived ? 'received' : ''}" 
                      onclick="receiveCoupon(${post.id}, ${post.storeId})"
                      ${post.couponReceived ? 'disabled' : ''}>
                <span class="coupon-icon">${post.couponReceived ? '✅' : '🎁'}</span>
                <span class="coupon-text">${post.couponReceived ? '받음' : '쿠폰'}</span>
              </button>
            ` : ''}
          </div>
        </div>
      </article>
    `;
  },

  /**
   * 게시물 타입 정보
   */
  getTypeInfo(type) {
    const typeMap = {
      story: { icon: '📖', text: '스토리', color: '#667eea' },
      promotion: { icon: '🎁', text: '이벤트', color: '#f59e0b' },
      notice: { icon: '📢', text: '공지', color: '#ef4444' }
    };
    return typeMap[type] || typeMap.story;
  },

  /**
   * 게시물 타입 뱃지
   */
  renderTypeBadge(type) {
    const badge = this.getTypeInfo(type);
    return `
      <span class="post-type-badge" style="background: ${badge.color}20; color: ${badge.color};">
        ${badge.icon} ${badge.text}
      </span>
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
          display: flex;
          flex-direction: column;
          background: #fafafa;
          height: 794px;
          overflow: hidden;
          position: relative;
        }

        /* 헤더 */
        .feed-header {
          position: sticky;
          top: 0;
          background: white;
          border-bottom: 1px solid #e5e7eb;
          padding: 60px 16px 12px 16px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          z-index: 100;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
        }

        .feed-title {
          font-size: 18px;
          font-weight: 700;
          color: #111827;
          letter-spacing: -0.5px;
        }

        .back-btn {
          background: none;
          border: none;
          cursor: pointer;
          padding: 4px;
          display: flex;
          align-items: center;
          color: #374151;
          transition: all 0.2s;
        }

        .back-btn:hover {
          color: #111827;
          transform: scale(1.1);
        }

        .header-spacer {
          width: 32px;
        }

        /* 탭 */
        .feed-tabs {
          position: sticky;
          top: 84px;
          background: white;
          padding: 12px 16px 8px 16px;
          display: flex;
          gap: 8px;
          overflow-x: auto;
          z-index: 99;
          border-bottom: 1px solid #f3f4f6;
        }

        .feed-tab {
          flex-shrink: 0;
          padding: 8px 14px;
          border-radius: 16px;
          border: none;
          background: #f3f4f6;
          color: #6b7280;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 5px;
          transition: all 0.2s;
        }

        .feed-tab.active {
          background: #111827;
          color: white;
        }

        .feed-tab:hover {
          background: #e5e7eb;
        }

        .feed-tab.active:hover {
          background: #1f2937;
        }

        .tab-icon {
          font-size: 14px;
        }

        /* 피드 컨텐츠 */
        .feed-content {
          flex: 1;
          overflow-y: auto;
          padding-bottom: 70px;
        }

        .feed-list {
          display: flex;
          flex-direction: column;
          gap: 12px;
          padding: 12px 0;
        }

        .feed-post {
          background: white;
          margin: 0 0 12px 0;
          border-radius: 16px;
          overflow: hidden;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
          transition: all 0.2s;
        }

        .feed-post:hover {
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
        }

        .post-header {
          display: flex;
          align-items: center;
          padding: 12px 16px;
          border-bottom: 1px solid #f9fafb;
        }

        .post-store-logo {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          background: #f3f4f6;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 20px;
          margin-right: 10px;
          border: 2px solid #f3f4f6;
        }

        .post-meta {
          flex: 1;
          display: flex;
          flex-direction: column;
        }

        .post-author {
          font-weight: 600;
          font-size: 14px;
          color: #111827;
        }

        .post-date {
          font-size: 12px;
          color: #9ca3af;
          margin-top: 2px;
        }

        .post-type-badge {
          padding: 4px 10px;
          border-radius: 12px;
          font-size: 11px;
          font-weight: 600;
          display: flex;
          align-items: center;
          gap: 4px;
        }

        .post-image {
          width: 100%;
          height: 280px;
          object-fit: cover;
          padding: 20px;
        }

        .post-body {
          padding: 14px 16px;
        }

        .post-title {
          font-size: 16px;
          font-weight: 700;
          color: #111827;
          margin: 0 0 8px 0;
          line-height: 1.4;
        }

        .post-caption {
          font-size: 14px;
          color: #374151;
          line-height: 1.5;
          margin-bottom: 12px;
        }

        .post-actions {
          display: flex;
          gap: 16px;
          padding-top: 8px;
          border-top: 1px solid #f3f4f6;
        }

        .post-actions button {
          background: none;
          border: none;
          font-size: 13px;
          cursor: pointer;
          color: #6b7280;
          transition: all 0.2s;
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 6px 10px;
          border-radius: 8px;
        }

        .post-actions button:hover {
          background: #f9fafb;
          color: #111827;
        }

        .like-btn.liked {
          color: #ef4444;
        }

        .like-btn.liked .like-icon {
          animation: likeAnimation 0.3s ease;
        }

        @keyframes likeAnimation {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.3); }
        }

        .like-icon, .comment-icon, .coupon-icon {
          font-size: 16px;
        }

        .coupon-btn.received {
          color: #10b981;
          cursor: not-allowed;
        }

        .coupon-btn.received:hover {
          background: #f0fdf4;
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
          left: 0;
          width: 100%;
          max-width: 430px;
          background: rgba(255, 255, 255, 0.92);
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          display: flex;
          justify-content: space-around;
          align-items: center;
          padding: 8px 0 12px 0;
          border-top: 1px solid #e5e7eb;
          box-shadow: 0 -2px 8px rgba(0, 0, 0, 0.05);
          z-index: 1000;
        }

        .nav-item {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 2px;
          border: none;
          background: none;
          color: #6b7280;
          cursor: pointer;
          transition: all 0.2s ease;
          padding: 4px 12px;
        }

        .nav-icon {
          font-size: 20px;
          transition: transform 0.2s ease;
        }

        .nav-label {
          font-size: 10px;
          letter-spacing: -0.2px;
          font-weight: 500;
        }

        .nav-item:hover {
          color: #374151;
        }

        .nav-item:hover .nav-icon {
          transform: scale(1.1);
        }
      </style>
    `;
  }
};

window.feedView = feedView;
console.log('✅ feedView 모듈 로드 완료');
