/**
 * 단골매장 페이지 Controller
 * 흐름 제어 및 이벤트 처리
 */

import { regularPageService } from '/TLG/pages/regular/services/regularPageService.js';
import { regularPageView } from '/TLG/pages/regular/views/regularPageView.js';

export const regularPageController = {
  /**
   * 페이지 초기화
   */
  async init() {
    console.log('🏪 단골매장 페이지 초기화 시작');

    try {
      // 사용자 정보 가져오기 (AuthManager 사용)
      const userInfo = window.getUserInfoSafely ? window.getUserInfoSafely() : window.userInfo;

      if (!userInfo || !userInfo.userId) {
        console.warn('⚠️ 로그인 필요');
        alert('로그인이 필요합니다.');
        if (typeof window.renderLogin === 'function') {
          window.renderLogin();
        }
        return;
      }

      console.log('✅ 사용자 정보 확인:', userInfo.name, '(PK:', userInfo.userId, ')');

      // 데이터 로딩 (PK 사용)
      const result = await regularPageService.getRegularStoresData(userInfo.userId);

      if (!result.success) {
        throw new Error(result.error || '데이터 로딩 실패');
      }

      // UI 렌더링
      const main = document.getElementById('main');
      if (!main) {
        throw new Error('main 엘리먼트를 찾을 수 없습니다.');
      }

      main.innerHTML = regularPageView.render(result);

      // 이벤트 리스너 설정
      this.setupEventListeners();

      console.log('✅ 단골매장 페이지 초기화 완료');

    } catch (error) {
      console.error('❌ 단골매장 페이지 초기화 실패:', error);
      this.showError(error.message);
    }
  },

  /**
   * 팔로잉 탭 스켈레톤 표시
   */
  showFollowingSkeleton() {
    const followingPane = document.getElementById('followingPane');
    if (!followingPane) return;

    followingPane.innerHTML = `
      <div class="following-skeleton">
        ${Array(3).fill(0).map(() => `
          <div class="skeleton-store-card">
            <div class="skeleton-store-image skeleton-loading"></div>
            <div class="skeleton-store-info">
              <div class="skeleton-line skeleton-loading" style="width: 60%; height: 20px; margin-bottom: 8px;"></div>
              <div class="skeleton-line skeleton-loading" style="width: 40%; height: 16px; margin-bottom: 12px;"></div>
              <div class="skeleton-line skeleton-loading" style="width: 80%; height: 14px;"></div>
            </div>
          </div>
        `).join('')}
      </div>

      <style>
        .following-skeleton {
          padding: 16px;
        }

        .skeleton-store-card {
          display: flex;
          gap: 12px;
          padding: 16px;
          background: white;
          border-radius: 12px;
          margin-bottom: 12px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
        }

        .skeleton-store-image {
          width: 80px;
          height: 80px;
          border-radius: 8px;
          flex-shrink: 0;
        }

        .skeleton-store-info {
          flex: 1;
          display: flex;
          flex-direction: column;
          justify-content: center;
        }

        .skeleton-line {
          border-radius: 4px;
        }

        .skeleton-loading {
          background: linear-gradient(90deg, #f1f5f9 25%, #e2e8f0 50%, #f1f5f9 75%);
          background-size: 200% 100%;
          animation: skeleton-loading 1.5s infinite;
        }

        @keyframes skeleton-loading {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
      </style>
    `;
  },

  /**
   * 팔로잉 탭 실제 컨텐츠 렌더링
   */
  renderFollowingContent(recentVisited = null, posts = null) {
    const followingPane = document.getElementById('followingPane');
    if (!followingPane) return;

    // 실제 데이터가 없으면 더미 데이터 사용
    const dummyStores = recentVisited || [
      {
        storeId: 386,
        storeName: '본격 로스터리카페',
        category: '카페',
        lastVisit: '2일 전',
        level: 'PLATINUM',
        points: 12500,
        coupons: 2
      },
      {
        storeId: 497,
        storeName: '정통 양념치킨',
        category: '치킨',
        lastVisit: '5일 전',
        level: 'GOLD',
        points: 8400,
        coupons: 1
      },
      {
        storeId: 173,
        storeName: '유명한 본가',
        category: '한식',
        lastVisit: '1주일 전',
        level: 'SILVER',
        points: 5200,
        coupons: 0
      }
    ];

    const dummyPosts = posts || [
      {
        id: 1,
        storeId: 386,
        storeName: '본격 로스터리카페',
        storeLogo: '☕',
        postType: 'event',
        title: '플래티넘 단골 전용 10% 쿠폰 오픈!',
        content: '이번 주말 한정으로 단골 손님에게만 10% 즉시할인 쿠폰을 드립니다! 놓치지 마세요!',
        hasImage: true,
        imageUrl: 'TableLink.png',
        createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        likes: 28,
        comments: 5,
        hasLiked: false
      },
      {
        id: 2,
        storeId: 497,
        storeName: '정통 양념치킨',
        storeLogo: '🍗',
        postType: 'new_menu',
        title: '매콤달콤 신메뉴 출시!',
        content: '새로운 매콤달콤 치킨이 나왔어요! 단골 고객님께 먼저 소개합니다 😋',
        hasImage: true,
        imageUrl: 'TableLink.png',
        createdAt: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
        likes: 42,
        comments: 12,
        hasLiked: true
      }
    ];

    followingPane.innerHTML = `
      ${this.renderRecentVisitedSection(dummyStores)}
      ${this.renderStoreFeedSection(dummyPosts)}
    `;
  },

  /**
   * 최근 방문 매장 섹션 렌더링
   */
  renderRecentVisitedSection(stores) {
    const getLevelIcon = (level) => {
      const icons = {
        'PLATINUM': '💎',
        'GOLD': '🥇',
        'SILVER': '🥈',
        'BRONZE': '🥉'
      };
      return icons[level] || '🏅';
    };

    return `
      <section class="recent-section-minimal">
        <div class="section-header-compact">
          <h2 class="section-title">📍 최근 방문</h2>
        </div>
        <div class="recent-list-minimal">
          ${stores.map(store => `
            <div class="recent-card-minimal" onclick="goToStore(${store.storeId})">
              <div class="recent-icon-minimal">
                ${store.category === '카페' ? '☕' : store.category === '치킨' ? '🍗' : '🍜'}
              </div>
              <div class="recent-details-minimal">
                <div class="recent-name-row">
                  <h3 class="recent-name-minimal">${store.storeName}</h3>
                  <span class="recent-level-minimal">${getLevelIcon(store.level)}</span>
                </div>
                <div class="recent-info-row">
                  <span class="recent-category">${store.category}</span>
                  <span class="recent-divider">·</span>
                  <span class="recent-visit">${store.lastVisit}</span>
                </div>
              </div>
              <div class="recent-stats">
                <div class="recent-points">${store.points.toLocaleString()}P</div>
                ${store.coupons > 0 ? `<div class="recent-coupons">🎟️ ${store.coupons}</div>` : ''}
              </div>
            </div>
          `).join('')}
        </div>
      </section>
    `;
  },

  /**
   * 매장 소식 피드 섹션 렌더링
   */
  renderStoreFeedSection(posts) {
    const getRelativeTime = (date) => {
      const now = new Date();
      const diff = now - new Date(date);
      const minutes = Math.floor(diff / (1000 * 60));
      const hours = Math.floor(diff / (1000 * 60 * 60));
      
      if (minutes < 60) return `${minutes}분 전`;
      if (hours < 24) return `${hours}시간 전`;
      return '최근';
    };

    const getTypeInfo = (postType) => {
      const typeMap = {
        'event': { icon: '🎉', color: '#FF8A00', label: '이벤트' },
        'new_menu': { icon: '🍽️', color: '#10b981', label: '신메뉴' },
        'promotion': { icon: '🎁', color: '#f59e0b', label: '프로모션' },
        'notice': { icon: '📢', color: '#6366f1', label: '공지사항' }
      };
      return typeMap[postType] || { icon: '📝', color: '#64748b', label: '소식' };
    };

    return `
      <div class="feed-list">
        ${posts.map(post => {
          const relativeTime = getRelativeTime(post.createdAt);
          const typeInfo = getTypeInfo(post.postType);
          const truncatedContent = post.content.length > 80 ? post.content.substring(0, 80) + '...' : post.content;

          return `
            <article class="feed-post-card instagram-style" data-action="goto-feed">
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
              </div>
            </article>
          `;
        }).join('')}
      </div>
    `;
  },

  /**
   * 이벤트 리스너 설정
   */
  setupEventListeners() {
    // 탭 전환
    const nearbyTab = document.getElementById('nearbyTab');
    const followingTab = document.getElementById('followingTab');
    const nearbyPane = document.getElementById('nearbyPane');
    const followingPane = document.getElementById('followingPane');

    if (nearbyTab) {
      nearbyTab.addEventListener('click', () => {
        nearbyTab.classList.add('active');
        followingTab?.classList.remove('active');
        nearbyPane.style.display = 'block';
        followingPane.style.display = 'none';
      });
    }

    if (followingTab) {
      followingTab.addEventListener('click', async () => {
        followingTab.classList.add('active');
        nearbyTab?.classList.remove('active');
        followingPane.style.display = 'block';
        nearbyPane.style.display = 'none';

        // 스켈레톤 표시
        this.showFollowingSkeleton();

        try {
          // 사용자 정보 가져오기
          const userInfo = window.getUserInfoSafely ? window.getUserInfoSafely() : window.userInfo;
          
          if (!userInfo || !userInfo.userId) {
            throw new Error('사용자 정보를 찾을 수 없습니다');
          }

          // 실제 API 호출
          const followingData = await regularPageService.getFollowingStoresData(userInfo.userId);
          
          if (followingData.success) {
            this.renderFollowingContent(followingData.recentVisited, followingData.posts);
          } else {
            throw new Error(followingData.error || '데이터 로딩 실패');
          }
        } catch (error) {
          console.error('❌ 팔로잉 탭 로딩 실패:', error);
          // 에러 발생 시 더미 데이터로 폴백
          this.renderFollowingContent();
        }
      });
    }

    // 즐겨찾기 전체보기
    const viewAllBtns = document.querySelectorAll('.view-all-btn[data-tab="favorite"]');
    viewAllBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        this.showFavoriteListGrid();
      });
    });

    // 더보기 버튼
    const showAllBtn = document.getElementById('showAllBtn');
    if (showAllBtn) {
      showAllBtn.addEventListener('click', () => {
        this.showAllStores();
      });
    }

    // 피드로 이동 (이벤트 위임)
    document.addEventListener('click', async (e) => {
      const target = e.target.closest('[data-action="goto-feed"]');
      if (target) {
        e.preventDefault();
        await this.navigateToFeed();
      }
    });

    // 사이드패널 이벤트
    this.setupSidePanelEvents();
  },

  /**
   * 피드 페이지로 이동
   */
  async navigateToFeed() {
    try {
      const { default: renderFeed } = await import('/TLG/pages/feed/renderFeed.js');
      await renderFeed();
    } catch (error) {
      console.error('❌ 피드 페이지 이동 실패:', error);
      alert('피드 페이지를 불러올 수 없습니다.');
    }
  },

  /**
   * 사이드패널 이벤트 설정
   */
  setupSidePanelEvents() {
    const sideMenuBtn = document.getElementById('sideMenuBtn');
    const sidePanel = document.getElementById('sidePanel');
    const sidePanelOverlay = document.getElementById('sidePanelOverlay');
    const sidePanelCloseBtn = document.getElementById('sidePanelCloseBtn');

    let startX = 0;
    let currentX = 0;
    let isDragging = false;

    // 사이드패널 열기
    const openSidePanel = () => {
      sidePanel.classList.add('active');
      sidePanelOverlay.classList.add('active');
      document.body.style.overflow = 'hidden';
    };

    // 사이드패널 닫기
    const closeSidePanel = () => {
      sidePanel.classList.remove('active');
      sidePanelOverlay.classList.remove('active');
      document.body.style.overflow = '';
    };

    // 전역 함수로 등록 (다른 곳에서도 사용 가능)
    window.closeSidePanel = closeSidePanel;

    // 메뉴 버튼 클릭
    if (sideMenuBtn) {
      sideMenuBtn.addEventListener('click', openSidePanel);
    }

    // 닫기 버튼 클릭
    if (sidePanelCloseBtn) {
      sidePanelCloseBtn.addEventListener('click', closeSidePanel);
    }

    // 오버레이 클릭
    if (sidePanelOverlay) {
      sidePanelOverlay.addEventListener('click', closeSidePanel);
    }

    // 터치 드래그로 닫기
    if (sidePanel) {
      sidePanel.addEventListener('touchstart', (e) => {
        startX = e.touches[0].clientX;
        isDragging = true;
        sidePanel.classList.add('dragging');
      });

      sidePanel.addEventListener('touchmove', (e) => {
        if (!isDragging) return;

        currentX = e.touches[0].clientX;
        const deltaX = currentX - startX;

        // 오른쪽으로만 드래그 허용 (패널이 열리는 방향)
        if (deltaX > 0) {
          const translateX = Math.min(deltaX, 280); // 최대 280px까지 이동
          sidePanel.style.transform = `translate3d(${translateX}px, 0, 0)`;
        } else {
          // 왼쪽으로 드래그할 경우 패널을 닫는 동작을 하기 위함
          const translateX = Math.max(deltaX, -280); // 최대 -280px까지 이동 (닫기 동작)
          sidePanel.style.transform = `translate3d(${translateX}px, 0, 0)`;
        }
      });

      sidePanel.addEventListener('touchend', () => {
        if (!isDragging) return;

        isDragging = false;
        sidePanel.classList.remove('dragging');

        const deltaX = currentX - startX;

        // 드래그 거리가 충분하면 닫기 (왼쪽으로 드래그)
        if (deltaX < -100) {
          closeSidePanel();
        } else {
          // 드래그 거리가 충분하지 않으면 원래 위치로 복귀
          sidePanel.style.transform = 'translate3d(0, 0, 0)';
        }
      });
    }

    // ESC 키로 닫기
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && sidePanel.classList.contains('active')) {
        closeSidePanel();
      }
    });
  },

  /**
   * 에러 표시
   */
  showError(message) {
    const main = document.getElementById('main');
    if (main) {
      main.innerHTML = `
        <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100vh; padding: 20px; text-align: center;">
          <div style="font-size: 64px; margin-bottom: 20px;">😢</div>
          <h2 style="color: #1f2937; margin: 0 0 8px 0;">오류가 발생했습니다</h2>
          <p style="color: #9ca3af; margin: 0 0 24px 0;">${message}</p>
          <button onclick="renderSubMain()" style="padding: 12px 24px; background: #FF8A00; color: white; border: none; border-radius: 8px; font-weight: 700; cursor: pointer;">
            홈으로 돌아가기
          </button>
        </div>
      `;
    }
  }
};

window.regularPageController = regularPageController;
console.log('✅ regularPageController 모듈 로드 완료');