
/**
 * Order Controller
 * 주문 내역 전체 흐름 제어
 */

import { orderService } from '../services/orderService.js';
import { orderView } from '../views/orderView.js';

export const orderController = {
  /**
   * 주문 내역 렌더링
   */
  async renderAllOrders(userInfo) {
    try {
      console.log('📦 주문 내역 렌더링 시작');

      const main = document.getElementById('main');
      if (!main) {
        throw new Error('main 요소를 찾을 수 없습니다');
      }

      // 1. 스켈레톤 표시
      main.innerHTML = this.renderSkeleton();

      // 2. 데이터 로드
      const data = await orderService.loadOrderData(userInfo.userId);

      // 3. UI 렌더링
      main.innerHTML = orderView.renderHTML(data, userInfo);

      // 4. 이벤트 리스너 등록
      this.attachEventListeners(data.orders);

      console.log('✅ 주문 내역 렌더링 완료');

    } catch (error) {
      console.error('❌ 주문 내역 렌더링 실패:', error);
      this.showErrorState();
    }
  },

  /**
   * 이벤트 리스너 등록
   */
  attachEventListeners(orders) {
    // 리뷰 작성 버튼
    document.querySelectorAll('.review-btn').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        const orderIndex = parseInt(e.target.closest('.review-btn').getAttribute('data-order-index'));
        const order = orders[orderIndex];
        
        // 리뷰 작성 스크립트 로드
        await this.loadReviewWriteScript();
        
        // 이전 화면 정보 저장
        window.previousScreen = 'renderAllOrderHTML';
        
        // 리뷰 작성 화면으로 이동
        if (typeof renderReviewWrite === 'function') {
          renderReviewWrite(order);
        }
      });
    });
  },

  /**
   * 리뷰 작성 스크립트 로드
   */
  async loadReviewWriteScript() {
    if (typeof window.renderReviewWrite === 'function') {
      return;
    }

    const script = document.createElement('script');
    script.src = '/TLG/pages/store/views/review/renderReviewWrite.js';

    await new Promise((resolve, reject) => {
      script.onload = resolve;
      script.onerror = reject;
      document.head.appendChild(script);
    });
  },

  /**
   * 스켈레톤 렌더링
   */
  renderSkeleton() {
    return `
      <div class="order-history-container">
        <header class="order-header">
          <div class="header-back-btn skeleton"></div>
          <div class="header-info">
            <div class="skeleton-text" style="width: 120px; height: 20px; margin-bottom: 4px;"></div>
            <div class="skeleton-text" style="width: 180px; height: 14px;"></div>
          </div>
        </header>
        <div class="order-content">
          <div class="stats-grid">
            ${Array(3).fill(0).map(() => `
              <div class="stat-card">
                <div class="skeleton-text" style="width: 24px; height: 24px; margin: 0 auto 8px;"></div>
                <div class="skeleton-text" style="width: 50px; height: 16px; margin: 0 auto 4px;"></div>
                <div class="skeleton-text" style="width: 40px; height: 12px; margin: 0 auto;"></div>
              </div>
            `).join('')}
          </div>
        </div>
      </div>
      <style>
        .skeleton {
          background: #e2e8f0;
          border-radius: 8px;
          animation: pulse 1.5s infinite;
        }
        .skeleton-text {
          background: #e2e8f0;
          border-radius: 4px;
          animation: pulse 1.5s infinite;
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      </style>
    `;
  },

  /**
   * 에러 상태 표시
   */
  showErrorState() {
    const main = document.getElementById('main');
    if (main) {
      main.innerHTML = `
        <div class="order-history-container">
          <header class="order-header">
            <button class="header-back-btn" onclick="renderMyPage()">
              <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M15 18l-6-6 6-6"/>
              </svg>
            </button>
            <div class="header-info">
              <h1>📦 주문 내역</h1>
            </div>
          </header>
          <div class="empty-state" style="padding-top: 100px;">
            <div class="empty-icon">⚠️</div>
            <h3>주문 내역을 불러올 수 없어요</h3>
            <p>잠시 후 다시 시도해주세요</p>
            <button class="primary-btn" onclick="renderAllOrderHTML(window.userInfo)">
              <span>🔄</span>
              다시 시도
            </button>
          </div>
        </div>
      `;
    }
  }
};

// 재주문 전역 함수
window.handleReorder = function(orderId) {
  console.log('🔄 재주문 요청:', orderId);
  alert('재주문 기능은 준비중입니다.');
};
