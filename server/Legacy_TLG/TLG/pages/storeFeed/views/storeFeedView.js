
/**
 * StoreFeed View
 * UI 렌더링 계층 - SNS 스타일 하단 네비게이션 포함
 */

export const storeFeedView = {
  /**
   * 메인 피드 HTML 렌더링
   */
  render(feedData) {
    const { store, posts } = feedData;

    return `
      <section class="store-feed sns-mode">
        <header class="feed-header">
          <button class="back-btn" data-action="back-to-store">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M19 12H5M12 19l-7-7 7-7"/>
            </svg>
          </button>
          <h2>${store.name}</h2>
          <div class="header-spacer"></div>
        </header>

        <div class="store-profile">
          <img src="${store.logo}" alt="logo" class="store-avatar"/>
          <div class="store-info">
            <h3>${store.name}</h3>
            <p>${store.bio}</p>
            <span>${store.followers}명의 단골</span>
          </div>
          <button class="follow-btn ${store.isFollowing ? 'following' : ''}" data-action="toggle-follow">
            ${store.isFollowing ? '단골중 ✓' : '단골 등록'}
          </button>
        </div>

        <div class="feed-timeline" id="feed-timeline">
          ${posts.length > 0 
            ? posts.map(post => this.renderPost(post)).join('') 
            : this.renderEmptyState()
          }
        </div>

        <!-- SNS 스타일 하단 네비게이션 -->
        <nav class="feed-nav">
          <button class="nav-btn active" data-filter="all">
            <span class="nav-icon">🏠</span>
            <span class="nav-label">전체</span>
          </button>
          <button class="nav-btn" data-filter="story">
            <span class="nav-icon">📖</span>
            <span class="nav-label">스토리</span>
          </button>
          <button class="nav-btn" data-filter="promotion">
            <span class="nav-icon">🎁</span>
            <span class="nav-label">이벤트</span>
          </button>
          <button class="nav-btn" data-filter="notice">
            <span class="nav-icon">📢</span>
            <span class="nav-label">공지</span>
          </button>
        </nav>

        ${this.getStyles()}
      </section>
    `;
  },

  /**
   * 개별 게시물 렌더링
   */
  renderPost(post) {
    return `
      <article class="feed-post ${post.type}" data-type="${post.type}" data-post-id="${post.id}">
        <div class="post-header">
          <img src="${post.avatar}" alt="avatar" class="post-avatar"/>
          <div class="post-meta">
            <span class="post-author">${post.author}</span>
            <span class="post-date">${post.date}</span>
          </div>
          ${this.renderTypeBadge(post.type)}
        </div>

        ${post.image ? `<img src="${post.image}" class="post-image" alt="post image">` : ''}

        <div class="post-body">
          <p class="post-caption">${post.caption}</p>
          <div class="post-actions">
            <button class="like-btn ${post.isLiked ? 'liked' : ''}" data-action="toggle-like" data-post-id="${post.id}">
              <span class="like-icon">${post.isLiked ? '❤️' : '🤍'}</span>
              <span class="like-count">${post.likes}</span>
            </button>
            <button class="comment-btn">
              <span class="comment-icon">💬</span>
              <span class="comment-text">댓글</span>
            </button>
            <button class="save-btn">
              <span class="save-icon">🔖</span>
              <span class="save-text">저장</span>
            </button>
          </div>
        </div>
      </article>
    `;
  },

  /**
   * 게시물 타입 뱃지
   */
  renderTypeBadge(type) {
    const badges = {
      story: { icon: '📖', text: '스토리', color: '#667eea' },
      promotion: { icon: '🎁', text: '프로모션', color: '#f59e0b' },
      notice: { icon: '📢', text: '공지', color: '#ef4444' }
    };

    const badge = badges[type] || badges.story;

    return `
      <span class="post-type-badge" style="background: ${badge.color}20; color: ${badge.color};">
        ${badge.icon} ${badge.text}
      </span>
    `;
  },

  /**
   * 빈 상태 렌더링
   */
  renderEmptyState() {
    return `
      <div class="feed-empty-state">
        <div class="empty-icon">📭</div>
        <h3 class="empty-title">아직 게시물이 없어요</h3>
        <p class="empty-text">매장의 새로운 소식을 기다려주세요!</p>
      </div>
    `;
  },

  /**
   * CSS 스타일
   */
  getStyles() {
    return `
      <style>
        .sns-mode {
          display: flex;
          flex-direction: column;
          background: #fafafa;
          height: 794px;
          overflow: hidden;
          position: relative;
          padding: 0;
        }

        /* 헤더 */
        .feed-header {
          position: sticky;
          top: 0;
          background: white;
          border-bottom: 1px solid #e5e7eb;
          padding: 12px 16px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          z-index: 100;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
        }

        .feed-header h2 {
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

        /* 매장 프로필 */
        .store-profile {
          display: flex;
          align-items: center;
          background: white;
          padding: 16px;
          border-bottom: 1px solid #f3f4f6;
        }

        .store-avatar {
          width: 70px;
          height: 70px;
          border-radius: 50%;
          object-fit: cover;
          border: 2px solid #f3f4f6;
        }

        .store-info {
          flex: 1;
          margin-left: 12px;
        }

        .store-info h3 {
          margin-bottom: 4px;
          font-size: 16px;
          font-weight: 700;
          color: #111827;
        }

        .store-info p {
          color: #6b7280;
          font-size: 13px;
          margin-bottom: 4px;
        }

        .store-info span {
          color: #9ca3af;
          font-size: 12px;
          font-weight: 500;
        }

        .follow-btn {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          border: none;
          border-radius: 20px;
          padding: 8px 16px;
          cursor: pointer;
          font-size: 13px;
          font-weight: 600;
          transition: all 0.3s;
          box-shadow: 0 2px 8px rgba(102, 126, 234, 0.3);
        }

        .follow-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
        }

        .follow-btn.following {
          background: #f3f4f6;
          color: #6b7280;
          box-shadow: none;
        }

        /* 피드 타임라인 */
        .feed-timeline {
          flex: 1;
          overflow-y: auto;
          padding-bottom: 70px;
        }

        .feed-post {
          background: white;
          margin-bottom: 12px;
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

        .post-avatar {
          width: 40px;
          height: 40px;
          border-radius: 50%;
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

        .like-icon, .comment-icon, .save-icon {
          font-size: 16px;
        }

        /* ===== SNS 스타일 하단 네비게이션 ===== */
        .feed-nav {
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
          z-index: 150;
        }

        .nav-btn {
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

        .nav-btn.active {
          color: #111827;
        }

        .nav-btn.active .nav-icon {
          transform: scale(1.15);
        }

        .nav-btn:hover {
          color: #374151;
        }

        .nav-btn:hover .nav-icon {
          transform: scale(1.1);
        }

        /* 빈 상태 스타일 */
        .feed-empty-state {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 80px 20px;
          text-align: center;
        }

        .empty-icon {
          font-size: 64px;
          margin-bottom: 16px;
          opacity: 0.6;
        }

        .empty-title {
          font-size: 18px;
          font-weight: 700;
          color: #374151;
          margin-bottom: 8px;
        }

        .empty-text {
          font-size: 14px;
          color: #9ca3af;
          line-height: 1.5;
        }
      </style>
    `;
  }
};
