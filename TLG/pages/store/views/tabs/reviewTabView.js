
/**
 * 리뷰 탭 뷰 - UI 렌더링
 */

export const reviewTabView = {
  /**
   * 리뷰 탭 렌더링
   */
  async render(store, reviewData) {
    if (!reviewData || reviewData.length === 0) {
      return this.renderEmptyState();
    }

    // 최근 리뷰 3개만 표시
    const recentReviews = reviewData.slice(0, 3);
    const totalReviews = reviewData.length;

    return `
      <div class="review-tab-container">
        <div class="review-tab-header">
          <h3 class="review-tab-title">
            <span class="review-icon">💬</span>
            최근 리뷰
          </h3>
          <span class="review-count">${totalReviews}개</span>
        </div>

        <div class="review-list">
          ${recentReviews.map(review => this.renderReviewItem(review)).join('')}
        </div>

        ${totalReviews > 3 ? `
          <div class="review-footer">
            <button class="see-more-btn">
              <span class="btn-text">모든 리뷰 보기</span>
              <span class="btn-arrow">→</span>
            </button>
          </div>
        ` : ''}
      </div>
      ${this.getReviewTabStyles()}
    `;
  },

  /**
   * 개별 리뷰 아이템 렌더링
   */
  renderReviewItem(review) {
    const userName = review.user_name || `사용자${review.user_id}`;
    const rating = review.score || review.rating || 0;
    const content = review.content || review.review_text || '';
    const date = new Date(review.created_at || review.date).toLocaleDateString('ko-KR');

    return `
      <div class="review-item">
        <div class="review-header">
          <div class="user-info">
            <div class="user-avatar">${userName.charAt(0)}</div>
            <div class="user-details">
              <div class="user-name">${userName}</div>
              <div class="review-date">${date}</div>
            </div>
          </div>
          <div class="review-rating">
            <span class="rating-stars">${'★'.repeat(rating)}${'☆'.repeat(5 - rating)}</span>
          </div>
        </div>
        <div class="review-content">
          <p class="review-text">${content}</p>
        </div>
      </div>
    `;
  },

  /**
   * 빈 상태 렌더링
   */
  renderEmptyState() {
    return `
      <div class="empty-review-state">
        <div class="empty-icon">💬</div>
        <h3 class="empty-title">아직 리뷰가 없습니다</h3>
        <p class="empty-description">첫 번째 리뷰를 남겨주세요!</p>
      </div>
      ${this.getReviewTabStyles()}
    `;
  },

  /**
   * 이벤트 리스너 연결
   */
  attachEventListeners(store) {
    const seeMoreBtn = document.querySelector('.see-more-btn');
    if (seeMoreBtn) {
      seeMoreBtn.addEventListener('click', () => {
        console.log('📖 리뷰 더보기 버튼 클릭');
        if (typeof renderAllReview === 'function') {
          renderAllReview(store);
        } else if (typeof window.renderAllReview === 'function') {
          window.renderAllReview(store);
        } else {
          console.error('❌ renderAllReview 함수를 찾을 수 없습니다');
        }
      });
    }
  },

  /**
   * 스타일 정의
   */
  getReviewTabStyles() {
    return `
      <style>
        .review-tab-container {
          padding: 20px 16px;
        }

        .review-tab-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 16px;
        }

        .review-tab-title {
          display: flex;
          align-items: center;
          gap: 8px;
          margin: 0;
          font-size: 18px;
          font-weight: 700;
          color: #1a1a1a;
        }

        .review-icon {
          font-size: 20px;
        }

        .review-count {
          font-size: 14px;
          font-weight: 600;
          color: #666;
          background: #f1f5f9;
          padding: 4px 12px;
          border-radius: 12px;
        }

        .review-list {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .review-item {
          background: white;
          border-radius: 12px;
          padding: 16px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
        }

        .review-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 12px;
        }

        .user-info {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .user-avatar {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 16px;
          font-weight: 700;
        }

        .user-details {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .user-name {
          font-size: 14px;
          font-weight: 600;
          color: #1a1a1a;
        }

        .review-date {
          font-size: 12px;
          color: #666;
        }

        .review-rating {
          flex-shrink: 0;
        }

        .rating-stars {
          font-size: 14px;
          color: #fbbf24;
        }

        .review-content {
          margin-top: 8px;
        }

        .review-text {
          margin: 0;
          font-size: 14px;
          line-height: 1.6;
          color: #374151;
        }

        .review-footer {
          margin-top: 20px;
          text-align: center;
        }

        .see-more-btn {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 12px 24px;
          background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
          color: white;
          border: none;
          border-radius: 12px;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .see-more-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 16px rgba(59, 130, 246, 0.3);
        }

        .btn-arrow {
          font-size: 16px;
        }

        .empty-review-state {
          padding: 80px 20px;
          text-align: center;
        }

        .empty-icon {
          font-size: 64px;
          margin-bottom: 16px;
        }

        .empty-title {
          margin: 0 0 8px 0;
          font-size: 18px;
          font-weight: 700;
          color: #1a1a1a;
        }

        .empty-description {
          margin: 0;
          font-size: 14px;
          color: #666;
        }
      </style>
    `;
  }
};

// 전역 등록
window.reviewTabView = reviewTabView;

console.log('✅ reviewTabView 모듈 로드 완료');
