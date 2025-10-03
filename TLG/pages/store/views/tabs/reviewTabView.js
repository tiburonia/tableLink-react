
/**
 * 리뷰 탭 뷰 - UI 렌더링
 */

export const reviewTabView = {
  /**
   * 리뷰 탭 렌더링
   */
  render(store, reviewData) {
    if (!reviewData || reviewData.length === 0) {
      return this.renderEmptyState();
    }

    // 최근 리뷰 3개만 표시
    const recentReviews = reviewData.slice(0, 3);
    const totalReviews = reviewData.length;

    return `
      <div class="review-tab-container">
        <div class="review-tab-header">
          <div class="header-left">
            <h3 class="review-tab-title">
              <span class="review-icon">💬</span>
              최근 리뷰
            </h3>
            <span class="review-count">${totalReviews}개</span>
          </div>
        </div>

        <div class="review-list">
          ${recentReviews.map(review => this.renderReviewItem(review)).join('')}
        </div>

        ${totalReviews > 3 ? `
          <button class="see-more-btn">
            <span class="btn-text">모든 리뷰 보기</span>
            <span class="btn-icon">→</span>
          </button>
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
    const date = new Date(review.created_at || review.date).toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

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
            ${this.renderStars(rating)}
          </div>
        </div>
        <div class="review-content">
          <p class="review-text">${content}</p>
        </div>
      </div>
    `;
  },

  /**
   * 별점 렌더링
   */
  renderStars(rating) {
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;
    const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);

    return `
      <div class="rating-stars">
        ${'<span class="star filled">★</span>'.repeat(fullStars)}
        ${hasHalfStar ? '<span class="star half">★</span>' : ''}
        ${'<span class="star empty">☆</span>'.repeat(emptyStars)}
        <span class="rating-number">${rating.toFixed(1)}</span>
      </div>
    `;
  },

  /**
   * 빈 상태 렌더링
   */
  renderEmptyState() {
    return `
      <div class="review-tab-container">
        <div class="empty-review-state">
          <div class="empty-icon">💬</div>
          <h3 class="empty-title">아직 리뷰가 없습니다</h3>
          <p class="empty-description">첫 번째 리뷰를 남겨주세요!</p>
        </div>
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
          padding: 24px 16px;
          background: #f8fafc;
          min-height: 300px;
        }

        .review-tab-header {
          margin-bottom: 20px;
        }

        .header-left {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .review-tab-title {
          display: flex;
          align-items: center;
          gap: 8px;
          margin: 0;
          font-size: 20px;
          font-weight: 700;
          color: #1e293b;
        }

        .review-icon {
          font-size: 24px;
          filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.1));
        }

        .review-count {
          font-size: 14px;
          font-weight: 600;
          color: #64748b;
          background: #e2e8f0;
          padding: 6px 14px;
          border-radius: 20px;
          line-height: 1;
        }

        .review-list {
          display: flex;
          flex-direction: column;
          gap: 12px;
          margin-bottom: 20px;
        }

        .review-item {
          background: white;
          border-radius: 16px;
          padding: 20px;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
          border: 1px solid #e2e8f0;
          transition: all 0.2s ease;
        }

        .review-item:hover {
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.12);
          transform: translateY(-2px);
          border-color: #cbd5e1;
        }

        .review-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 14px;
        }

        .user-info {
          display: flex;
          align-items: center;
          gap: 12px;
          flex: 1;
        }

        .user-avatar {
          width: 44px;
          height: 44px;
          border-radius: 50%;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 18px;
          font-weight: 700;
          box-shadow: 0 2px 8px rgba(102, 126, 234, 0.3);
        }

        .user-details {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .user-name {
          font-size: 15px;
          font-weight: 700;
          color: #1e293b;
        }

        .review-date {
          font-size: 13px;
          color: #64748b;
          font-weight: 500;
        }

        .review-rating {
          flex-shrink: 0;
        }

        .rating-stars {
          display: flex;
          align-items: center;
          gap: 2px;
        }

        .rating-stars .star {
          font-size: 16px;
          line-height: 1;
        }

        .rating-stars .star.filled {
          color: #f59e0b;
          text-shadow: 0 1px 2px rgba(245, 158, 11, 0.3);
        }

        .rating-stars .star.half {
          color: #f59e0b;
          opacity: 0.6;
        }

        .rating-stars .star.empty {
          color: #cbd5e1;
        }

        .rating-number {
          font-size: 14px;
          font-weight: 700;
          color: #f59e0b;
          margin-left: 6px;
        }

        .review-content {
          margin-top: 12px;
        }

        .review-text {
          margin: 0;
          font-size: 15px;
          line-height: 1.6;
          color: #475569;
          word-break: keep-all;
        }

        .see-more-btn {
          width: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          padding: 16px 24px;
          background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
          color: white;
          border: none;
          border-radius: 12px;
          font-size: 15px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s ease;
          box-shadow: 0 4px 12px rgba(59, 130, 246, 0.2);
        }

        .see-more-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 20px rgba(59, 130, 246, 0.3);
          background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
        }

        .see-more-btn:active {
          transform: translateY(0);
        }

        .btn-icon {
          font-size: 18px;
          transition: transform 0.3s ease;
        }

        .see-more-btn:hover .btn-icon {
          transform: translateX(4px);
        }

        .empty-review-state {
          padding: 80px 20px;
          text-align: center;
        }

        .empty-icon {
          font-size: 72px;
          margin-bottom: 20px;
          filter: drop-shadow(0 4px 8px rgba(0, 0, 0, 0.1));
        }

        .empty-title {
          margin: 0 0 10px 0;
          font-size: 20px;
          font-weight: 700;
          color: #1e293b;
        }

        .empty-description {
          margin: 0;
          font-size: 15px;
          color: #64748b;
          font-weight: 500;
        }

        @media (max-width: 480px) {
          .review-tab-container {
            padding: 20px 12px;
          }

          .review-tab-title {
            font-size: 18px;
          }

          .review-item {
            padding: 16px;
          }

          .user-avatar {
            width: 40px;
            height: 40px;
            font-size: 16px;
          }

          .user-name {
            font-size: 14px;
          }

          .review-text {
            font-size: 14px;
          }
        }
      </style>
    `;
  }
};

// 전역 등록
window.reviewTabView = reviewTabView;

console.log('✅ reviewTabView 모듈 로드 완료');
