
/**
 * StoreFeed Controller
 * 이벤트 처리 및 흐름 제어
 */

import { storeFeedService } from '../services/storeFeedService.js';
import { storeFeedView } from '../views/storeFeedView.js';

export const storeFeedController = {
  state: {
    currentStoreId: null,
    feedData: null
  },

  /**
   * 피드 초기화 및 렌더링
   */
  async initialize(storeId) {
    console.log(`🎬 [StoreFeedController] 매장 ${storeId} 피드 초기화`);

    try {
      this.state.currentStoreId = storeId;

      // Service를 통한 데이터 로드
      this.state.feedData = await storeFeedService.loadStoreFeed(storeId);

      // View 렌더링
      const main = document.getElementById('main');
      if (main) {
        main.innerHTML = storeFeedView.render(this.state.feedData);
      }

      // 이벤트 리스너 설정
      this.setupEventListeners();

      console.log('✅ [StoreFeedController] 피드 초기화 완료');
    } catch (error) {
      console.error('❌ [StoreFeedController] 초기화 실패:', error);
      this.showError(error.message);
    }
  },

  /**
   * 이벤트 리스너 설정
   */
  setupEventListeners() {
    document.addEventListener('click', async (e) => {
      // 네비게이션 필터링
      const filterBtn = e.target.closest('.nav-btn');
      if (filterBtn) {
        this.handleFilterChange(filterBtn);
        return;
      }

      const target = e.target.closest('[data-action]');
      if (!target) return;

      const action = target.dataset.action;

      switch (action) {
        case 'back-to-store':
          e.preventDefault();
          if (typeof window.renderStore === 'function' && this.state.currentStoreId) {
            const storeData = { id: this.state.currentStoreId };
            window.renderStore(storeData);
          }
          break;

        case 'toggle-like':
          e.preventDefault();
          await this.handleLikeToggle(target);
          break;

        case 'toggle-follow':
          e.preventDefault();
          await this.handleFollowToggle(target);
          break;
      }
    });
  },

  /**
   * 좋아요 토글 처리
   */
  async handleLikeToggle(button) {
    const postId = parseInt(button.dataset.postId);
    const post = this.state.feedData.posts.find(p => p.id === postId);
    
    if (!post) return;

    const result = await storeFeedService.toggleLike(postId, post.isLiked);

    // 상태 업데이트
    post.isLiked = result.isLiked;
    post.likes += result.likes;

    // UI 업데이트
    const icon = button.querySelector('.like-icon');
    const count = button.querySelector('.like-count');
    
    if (icon) icon.textContent = result.isLiked ? '❤️' : '🤍';
    if (count) count.textContent = post.likes;
    
    button.classList.toggle('liked', result.isLiked);
  },

  /**
   * 단골 등록/해제 처리
   */
  async handleFollowToggle(button) {
    const store = this.state.feedData.store;
    const result = await storeFeedService.toggleFollow(store.id, store.isFollowing);

    // 상태 업데이트
    store.isFollowing = result.isFollowing;
    store.followers += result.followers;

    // UI 업데이트
    button.textContent = result.isFollowing ? '단골중 ✓' : '단골 등록';
    button.classList.toggle('following', result.isFollowing);

    // 팔로워 수 업데이트
    const followersSpan = document.querySelector('.store-info span');
    if (followersSpan) {
      followersSpan.textContent = `${store.followers}명의 단골`;
    }
  },

  /**
   * 필터 변경 핸들러
   */
  handleFilterChange(filterBtn) {
    const selected = filterBtn.dataset.filter;
    
    // 모든 버튼 비활성화
    document.querySelectorAll('.nav-btn').forEach(btn => btn.classList.remove('active'));
    
    // 선택된 버튼 활성화
    filterBtn.classList.add('active');

    // 피드 포스트 필터링
    document.querySelectorAll('.feed-post').forEach(post => {
      if (selected === 'all' || post.dataset.type === selected) {
        post.style.display = 'block';
      } else {
        post.style.display = 'none';
      }
    });

    console.log(`🔄 [StoreFeedController] 필터 변경: ${selected}`);
  },

  /**
   * 에러 표시
   */
  showError(message) {
    const main = document.getElementById('main');
    if (main) {
      main.innerHTML = `
        <div style="padding: 40px 20px; text-align: center;">
          <h2 style="color: #ef4444; margin-bottom: 12px;">피드를 불러올 수 없습니다</h2>
          <p style="color: #6b7280; margin-bottom: 20px;">${message}</p>
          <button onclick="renderStore({id: ${this.state.currentStoreId}})" 
                  style="padding: 10px 20px; background: #3b82f6; color: white; border: none; border-radius: 8px; cursor: pointer;">
            매장으로 돌아가기
          </button>
        </div>
      `;
    }
  }
};

// 전역 등록
window.storeFeedController = storeFeedController;
