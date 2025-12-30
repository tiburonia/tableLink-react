/**
 * 리뷰 탭 뷰 - UI 렌더링 (미니멀 디자인)
 */

export const reviewTabView = {
  /**
   * 리뷰 탭 렌더링
   */
  render(store, reviewData) {
    if (!reviewData || reviewData.length === 0) {
      return this.renderEmptyState(store);
    }

    // 최근 리뷰 3개만 표시
    const recentReviews = reviewData.slice(0, 3);
    const totalReviews = reviewData.length;
    const avgRating = this.calculateAverageRating(reviewData);
    const ratingDistribution = this.calculateRatingDistribution(reviewData);

    return `
      <div class="review-tab-container">
        <!-- 리뷰 요약 카드 -->
        <div class="review-summary-section">
          <div class="review-summary-card">
            <div class="summary-rating-display">
              <div class="rating-score-large">
                <span class="score-number">${avgRating}</span>
                <div class="score-stars">${this.renderFullStars(Math.round(parseFloat(avgRating)))}</div>
              </div>
              <div class="rating-meta">
                <span class="total-reviews">${totalReviews}개의 리뷰</span>
              </div>
            </div>

            <div class="rating-distribution">
              ${this.renderRatingBars(ratingDistribution, totalReviews)}
            </div>
          </div>
        </div>

        <!-- 최근 리뷰 섹션 -->
        <div class="recent-reviews-section">
          <div class="section-header">
            <h3 class="section-title">최근 리뷰</h3>
            <span class="review-count">${recentReviews.length}개</span>
          </div>

          <div class="review-list">
            ${recentReviews.map((review, idx) => this.renderReviewCard(review, idx)).join('')}
          </div>

          <!-- 더보기 버튼 -->
          ${totalReviews > 3 ? `
            <button class="view-all-reviews-btn" data-action="show-all-reviews" data-store-id="${store.id}">
              <span class="btn-text">모든 리뷰 보기</span>
              <span class="btn-count">(${totalReviews - 3}개 더)</span>
            </button>
          ` : ''}
        </div>
      </div>
      ${this.getReviewTabStyles()}
    `;
  },

  /**
   * 평균 평점 계산
   */
  calculateAverageRating(reviews) {
    if (!reviews || reviews.length === 0) return '0.0';
    const sum = reviews.reduce((acc, review) => acc + (review.score || review.rating || 0), 0);
    return (sum / reviews.length).toFixed(1);
  },

  /**
   * 평점 분포 계산
   */
  calculateRatingDistribution(reviews) {
    const distribution = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    reviews.forEach(review => {
      const score = review.score || review.rating || 0;
      if (score >= 1 && score <= 5) {
        distribution[score]++;
      }
    });
    return distribution;
  },

  /**
   * 평점 바 렌더링
   */
  renderRatingBars(distribution, total) {
    let html = '';
    for (let score = 5; score >= 1; score--) {
      const count = distribution[score] || 0;
      const percentage = total > 0 ? Math.round((count / total) * 100) : 0;

      html += `
        <div class="rating-bar-item">
          <span class="bar-label">${score}</span>
          <div class="bar-track">
            <div class="bar-fill" style="width: ${percentage}%"></div>
          </div>
          <span class="bar-percentage">${percentage}%</span>
        </div>
      `;
    }
    return html;
  },

  /**
   * 전체 별 렌더링
   */
  renderFullStars(count) {
    const filled = '★'.repeat(count);
    const empty = '☆'.repeat(5 - count);
    return filled + empty;
  },

  /**
   * 개별 리뷰 카드 렌더링
   */
  renderReviewCard(review, index) {
    const userName = review.user_name || review.user || `사용자${review.user_id}`;
    const rating = review.score || review.rating || 0;
    const content = review.content || review.review_text || '';
    const date = new Date(review.created_at || review.date).toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    return `
      <div class="review-card">
        <div class="review-header">
          <div class="user-info">
            <div class="user-avatar">${userName.charAt(0).toUpperCase()}</div>
            <div class="user-details">
              <div class="user-name">${userName}</div>
              <div class="review-date">${date}</div>
            </div>
          </div>
          <div class="review-rating">
            ${this.renderStarRating(rating)}
          </div>
        </div>

        <div class="review-content">
          <p class="review-text">${content}</p>
        </div>
      </div>
    `;
  },

  /**
   * 별점 표시 렌더링
   */
  renderStarRating(rating) {
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;
    const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);

    return `
      <div class="star-rating">
        ${'★'.repeat(fullStars)}${hasHalfStar ? '★' : ''}${'☆'.repeat(emptyStars)}
      </div>
    `;
  },

  /**
   * 빈 상태 렌더링
   */
  renderEmptyState(store) {
    return `
      <div class="review-tab-container">
        <div class="empty-review-state">
          <div class="empty-icon">💬</div>
          <h3 class="empty-title">아직 리뷰가 없어요</h3>
          <p class="empty-description">
            이 매장의 첫 번째 리뷰를 남겨주세요
          </p>
          <button class="write-review-btn" data-action="write-review" data-store-id="${store?.id || ''}">
            첫 리뷰 작성하기
          </button>
        </div>
      </div>
      ${this.getReviewTabStyles()}
    `;
  },

  /**
   * 이벤트 리스너 연결
   */
  attachEventListeners(store) {
    const viewAllBtn = document.querySelector('.view-all-reviews-btn');
    if (viewAllBtn) {
      viewAllBtn.addEventListener('click', () => {
        console.log('📖 모든 리뷰 보기 버튼 클릭');
        if (typeof renderAllReview === 'function') {
          renderAllReview(store);
        } else if (typeof window.renderAllReview === 'function') {
          window.renderAllReview(store);
        } else {
          console.error('❌ renderAllReview 함수를 찾을 수 없습니다');
        }
      });
    }

    const writeReviewBtn = document.querySelector('.write-review-btn');
    if (writeReviewBtn) {
      writeReviewBtn.addEventListener('click', () => {
        console.log('✍️ 리뷰 작성 버튼 클릭');
        alert('리뷰 작성 기능은 주문 완료 후 이용 가능합니다.');
      });
    }
  },

  /**
   * 스타일 정의 (미니멀 디자인)
   */
  getReviewTabStyles() {
    return `
      <style>
        .review-tab-container {
          padding: 20px 16px;
          background: #fafafa;
          min-height: 400px;
        }

        /* 리뷰 요약 섹션 */
        .review-summary-section {
          margin-bottom: 20px;
        }

        .review-summary-card {
          background: white;
          border-radius: 12px;
          padding: 24px;
          border: 1px solid #e5e5e5;
        }

        .summary-rating-display {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 20px;
          padding-bottom: 16px;
          border-bottom: 1px solid #f0f0f0;
        }

        .rating-score-large {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 4px;
        }

        .score-number {
          font-size: 40px;
          font-weight: 700;
          line-height: 1;
          color: #1a1a1a;
        }

        .score-stars {
          font-size: 14px;
          letter-spacing: 1px;
          color: #ffa500;
        }

        .rating-meta {
          display: flex;
          flex-direction: column;
          align-items: flex-end;
          gap: 4px;
        }

        .total-reviews {
          font-size: 15px;
          font-weight: 600;
          color: #666;
        }

        /* 평점 분포 바 */
        .rating-distribution {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .rating-bar-item {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .bar-label {
          font-size: 13px;
          font-weight: 500;
          width: 16px;
          color: #666;
        }

        .bar-track {
          flex: 1;
          height: 5px;
          background: #f0f0f0;
          border-radius: 3px;
          overflow: hidden;
        }

        .bar-fill {
          height: 100%;
          background: #333;
          border-radius: 3px;
          transition: width 0.5s ease;
        }

        .bar-percentage {
          font-size: 12px;
          font-weight: 500;
          width: 36px;
          text-align: right;
          color: #666;
        }

        /* 최근 리뷰 섹션 */
        .recent-reviews-section {
          background: white;
          border-radius: 12px;
          padding: 20px 16px;
          border: 1px solid #e5e5e5;
        }

        .section-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 16px;
        }

        .section-title {
          margin: 0;
          font-size: 17px;
          font-weight: 700;
          color: #1a1a1a;
        }

        .review-count {
          font-size: 13px;
          font-weight: 600;
          color: #999;
        }

        /* 리뷰 리스트 */
        .review-list {
          display: flex;
          flex-direction: column;
          gap: 12px;
          margin-bottom: 16px;
        }

        .review-card {
          background: #fafafa;
          border-radius: 10px;
          padding: 16px;
          border: 1px solid #f0f0f0;
        }

        .review-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 12px;
        }

        .user-info {
          display: flex;
          align-items: center;
          gap: 10px;
          flex: 1;
        }

        .user-avatar {
          width: 36px;
          height: 36px;
          border-radius: 50%;
          background: #e5e5e5;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 16px;
          font-weight: 600;
          color: #666;
          flex-shrink: 0;
        }

        .user-details {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .user-name {
          font-size: 15px;
          font-weight: 600;
          color: #1a1a1a;
        }

        .review-date {
          font-size: 12px;
          color: #999;
        }

        .review-rating {
          flex-shrink: 0;
        }

        .star-rating {
          font-size: 14px;
          color: #ffa500;
        }

        .review-content {
          margin-top: 8px;
        }

        .review-text {
          margin: 0;
          font-size: 14px;
          line-height: 1.5;
          color: #333;
        }

        /* 모든 리뷰 보기 버튼 */
        .view-all-reviews-btn {
          width: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          padding: 14px;
          background: #fafafa;
          color: #333;
          border: 1px solid #e5e5e5;
          border-radius: 10px;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .view-all-reviews-btn:hover {
          background: #f0f0f0;
        }

        .view-all-reviews-btn:active {
          transform: scale(0.98);
        }

        .btn-count {
          color: #999;
        }

        /* 빈 상태 */
        .empty-review-state {
          padding: 60px 20px;
          text-align: center;
          background: white;
          border-radius: 12px;
          border: 1px solid #e5e5e5;
        }

        .empty-icon {
          font-size: 48px;
          margin-bottom: 16px;
          opacity: 0.4;
        }

        .empty-title {
          margin: 0 0 8px 0;
          font-size: 18px;
          font-weight: 700;
          color: #1a1a1a;
        }

        .empty-description {
          margin: 0 0 24px 0;
          font-size: 14px;
          color: #666;
          line-height: 1.5;
        }

        .write-review-btn {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 12px 24px;
          background: #333;
          color: white;
          border: none;
          border-radius: 10px;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .write-review-btn:hover {
          background: #1a1a1a;
        }

        .write-review-btn:active {
          transform: scale(0.98);
        }

        /* 반응형 */
        @media (max-width: 480px) {
          .review-tab-container {
            padding: 16px 12px;
          }

          .review-summary-card {
            padding: 20px 16px;
          }

          .score-number {
            font-size: 36px;
          }

          .recent-reviews-section {
            padding: 16px 12px;
          }

          .review-card {
            padding: 14px;
          }

          .user-avatar {
            width: 32px;
            height: 32px;
            font-size: 14px;
          }

          .empty-review-state {
            padding: 48px 16px;
          }

          .empty-icon {
            font-size: 40px;
          }
        }
      </style>
    `;
  }
};

// 전역 등록
window.reviewTabView = reviewTabView;

console.log('✅ reviewTabView 모듈 로드 완료');