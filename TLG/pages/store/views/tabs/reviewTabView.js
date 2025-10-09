
/**
 * 리뷰 탭 뷰 - UI 렌더링
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
                <span class="review-quality">📝 실제 방문 후기</span>
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
            <h3 class="section-title">
              <span class="title-icon">💭</span>
              최근 리뷰
            </h3>
            <span class="review-badge">${recentReviews.length}개</span>
          </div>

          <div class="review-list">
            ${recentReviews.map((review, idx) => this.renderReviewCard(review, idx)).join('')}
          </div>

          <!-- 더보기 버튼 -->
          ${totalReviews > 3 ? `
            <button class="view-all-reviews-btn" data-action="show-all-reviews" data-store-id="${store.id}">
              <span class="btn-icon">📋</span>
              <span class="btn-text">모든 리뷰 보기</span>
              <span class="btn-count">(${totalReviews - 3}개 더)</span>
              <span class="btn-arrow">→</span>
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
          <span class="bar-label">${score}★</span>
          <div class="bar-track">
            <div class="bar-fill bar-fill-${score}" style="width: ${percentage}%"></div>
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
    return `<span class="stars-filled">${filled}</span><span class="stars-empty">${empty}</span>`;
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

    const avatarColors = [
      'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
      'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
      'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
      'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
      'linear-gradient(135deg, #30cfd0 0%, #330867 100%)'
    ];
    const avatarColor = avatarColors[index % avatarColors.length];

    return `
      <div class="review-card" style="animation-delay: ${index * 0.1}s">
        <div class="review-card-header">
          <div class="user-info">
            <div class="user-avatar" style="background: ${avatarColor}">
              ${userName.charAt(0).toUpperCase()}
            </div>
            <div class="user-details">
              <div class="user-name">${userName}</div>
              <div class="review-date">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2"/>
                  <path d="M12 6v6l4 2" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                </svg>
                ${date}
              </div>
            </div>
          </div>
          <div class="review-rating">
            ${this.renderStarRating(rating)}
          </div>
        </div>

        <div class="review-content">
          <p class="review-text">${content}</p>
        </div>

        <div class="review-footer">
          <button class="action-btn helpful-btn">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
              <path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
            <span>도움돼요</span>
          </button>
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
      <div class="star-rating-display">
        ${'<span class="star filled">★</span>'.repeat(fullStars)}
        ${hasHalfStar ? '<span class="star half">★</span>' : ''}
        ${'<span class="star empty">☆</span>'.repeat(emptyStars)}
        <span class="rating-value">${rating.toFixed(1)}</span>
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
          <div class="empty-illustration">
            <svg width="140" height="140" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="10" stroke="url(#emptyGradient)" stroke-width="2"/>
              <path d="M8 14s1.5 2 4 2 4-2 4-2M9 9h.01M15 9h.01" stroke="url(#emptyGradient)" stroke-width="2" stroke-linecap="round"/>
              <defs>
                <linearGradient id="emptyGradient" x1="2" y1="2" x2="22" y2="22">
                  <stop offset="0%" stop-color="#cbd5e1"/>
                  <stop offset="100%" stop-color="#94a3b8"/>
                </linearGradient>
              </defs>
            </svg>
          </div>
          <h3 class="empty-title">아직 리뷰가 없어요</h3>
          <p class="empty-description">
            이 매장의 첫 번째 리뷰를 남겨주세요!<br/>
            여러분의 소중한 의견이 다른 고객에게 큰 도움이 됩니다.
          </p>
          <button class="write-review-btn" data-action="write-review" data-store-id="${store?.id || ''}">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
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

    // 도움돼요 버튼들
    document.querySelectorAll('.helpful-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        const button = e.currentTarget;
        button.classList.toggle('active');
        
        if (button.classList.contains('active')) {
          button.querySelector('span').textContent = '도움이 됐어요';
        } else {
          button.querySelector('span').textContent = '도움돼요';
        }
      });
    });
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
          min-height: 400px;
        }

        /* 리뷰 요약 섹션 */
        .review-summary-section {
          margin-bottom: 24px;
        }

        .review-summary-card {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          border-radius: 20px;
          padding: 28px 24px;
          color: white;
          box-shadow: 0 8px 32px rgba(102, 126, 234, 0.3);
        }

        .summary-rating-display {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 24px;
          padding-bottom: 20px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.2);
        }

        .rating-score-large {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 8px;
        }

        .score-number {
          font-size: 48px;
          font-weight: 900;
          line-height: 1;
          text-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
        }

        .score-stars {
          font-size: 16px;
          letter-spacing: 2px;
        }

        .score-stars .stars-filled {
          color: #fbbf24;
        }

        .score-stars .stars-empty {
          color: rgba(255, 255, 255, 0.3);
        }

        .rating-meta {
          display: flex;
          flex-direction: column;
          align-items: flex-end;
          gap: 6px;
        }

        .total-reviews {
          font-size: 16px;
          font-weight: 700;
          opacity: 0.95;
        }

        .review-quality {
          font-size: 13px;
          opacity: 0.8;
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
          gap: 10px;
        }

        .bar-label {
          font-size: 13px;
          font-weight: 600;
          width: 30px;
          opacity: 0.9;
        }

        .bar-track {
          flex: 1;
          height: 6px;
          background: rgba(255, 255, 255, 0.2);
          border-radius: 3px;
          overflow: hidden;
        }

        .bar-fill {
          height: 100%;
          border-radius: 3px;
          transition: width 0.5s ease;
        }

        .bar-fill-5 { background: #10b981; }
        .bar-fill-4 { background: #3b82f6; }
        .bar-fill-3 { background: #f59e0b; }
        .bar-fill-2 { background: #ef4444; }
        .bar-fill-1 { background: #991b1b; }

        .bar-percentage {
          font-size: 12px;
          font-weight: 600;
          width: 40px;
          text-align: right;
          opacity: 0.9;
        }

        /* 최근 리뷰 섹션 */
        .recent-reviews-section {
          background: white;
          border-radius: 20px;
          padding: 24px 20px;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.04);
        }

        .section-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
        }

        .section-title {
          display: flex;
          align-items: center;
          gap: 10px;
          margin: 0;
          font-size: 18px;
          font-weight: 800;
          color: #1e293b;
        }

        .title-icon {
          font-size: 22px;
        }

        .review-badge {
          background: linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%);
          color: #475569;
          padding: 6px 14px;
          border-radius: 12px;
          font-size: 13px;
          font-weight: 700;
        }

        /* 리뷰 리스트 */
        .review-list {
          display: flex;
          flex-direction: column;
          gap: 16px;
          margin-bottom: 20px;
        }

        .review-card {
          background: linear-gradient(135deg, #ffffff 0%, #f8fafc 100%);
          border-radius: 16px;
          padding: 20px;
          border: 1px solid #e2e8f0;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          animation: slideUp 0.5s ease-out forwards;
        }

        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .review-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 12px 32px rgba(0, 0, 0, 0.1);
          border-color: #cbd5e1;
        }

        .review-card-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 16px;
        }

        .user-info {
          display: flex;
          align-items: center;
          gap: 12px;
          flex: 1;
        }

        .user-avatar {
          width: 48px;
          height: 48px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 20px;
          font-weight: 800;
          color: white;
          box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
          flex-shrink: 0;
        }

        .user-details {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .user-name {
          font-size: 16px;
          font-weight: 700;
          color: #1e293b;
        }

        .review-date {
          display: flex;
          align-items: center;
          gap: 4px;
          font-size: 12px;
          color: #64748b;
          font-weight: 500;
        }

        .review-date svg {
          stroke: #94a3b8;
        }

        .review-rating {
          flex-shrink: 0;
        }

        .star-rating-display {
          display: flex;
          align-items: center;
          gap: 4px;
          background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
          padding: 8px 12px;
          border-radius: 12px;
        }

        .star-rating-display .star {
          font-size: 14px;
          line-height: 1;
        }

        .star-rating-display .star.filled {
          color: #f59e0b;
        }

        .star-rating-display .star.half {
          color: #f59e0b;
          opacity: 0.6;
        }

        .star-rating-display .star.empty {
          color: #cbd5e1;
        }

        .star-rating-display .rating-value {
          font-size: 13px;
          font-weight: 700;
          color: #92400e;
          margin-left: 4px;
        }

        .review-content {
          margin-bottom: 16px;
        }

        .review-text {
          margin: 0;
          font-size: 15px;
          line-height: 1.6;
          color: #475569;
          word-break: keep-all;
        }

        .review-footer {
          padding-top: 12px;
          border-top: 1px solid #f1f5f9;
        }

        .action-btn {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 8px 16px;
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          border-radius: 10px;
          font-size: 13px;
          font-weight: 600;
          color: #64748b;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .action-btn:hover {
          background: #eff6ff;
          border-color: #3b82f6;
          color: #3b82f6;
        }

        .action-btn.active {
          background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
          border-color: #3b82f6;
          color: white;
        }

        .action-btn svg {
          stroke: currentColor;
        }

        /* 모든 리뷰 보기 버튼 */
        .view-all-reviews-btn {
          width: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          padding: 16px 24px;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          border: none;
          border-radius: 14px;
          font-size: 15px;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          box-shadow: 0 4px 16px rgba(102, 126, 234, 0.3);
        }

        .view-all-reviews-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 24px rgba(102, 126, 234, 0.4);
        }

        .view-all-reviews-btn:active {
          transform: translateY(0);
        }

        .btn-icon {
          font-size: 18px;
        }

        .btn-count {
          opacity: 0.9;
        }

        .btn-arrow {
          font-size: 18px;
          transition: transform 0.3s ease;
        }

        .view-all-reviews-btn:hover .btn-arrow {
          transform: translateX(4px);
        }

        /* 빈 상태 */
        .empty-review-state {
          padding: 80px 20px;
          text-align: center;
          background: white;
          border-radius: 20px;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.04);
        }

        .empty-illustration {
          margin-bottom: 28px;
          display: flex;
          justify-content: center;
          animation: float 3s ease-in-out infinite;
        }

        @keyframes float {
          0%, 100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-12px);
          }
        }

        .empty-title {
          margin: 0 0 12px 0;
          font-size: 24px;
          font-weight: 800;
          color: #1e293b;
          letter-spacing: -0.5px;
        }

        .empty-description {
          margin: 0 0 28px 0;
          font-size: 15px;
          color: #64748b;
          line-height: 1.6;
        }

        .write-review-btn {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 14px 28px;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          border: none;
          border-radius: 12px;
          font-size: 15px;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.3s ease;
          box-shadow: 0 4px 16px rgba(102, 126, 234, 0.3);
        }

        .write-review-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 24px rgba(102, 126, 234, 0.4);
        }

        .write-review-btn svg {
          stroke: currentColor;
        }

        /* 반응형 */
        @media (max-width: 480px) {
          .review-tab-container {
            padding: 20px 12px;
          }

          .review-summary-card {
            padding: 24px 20px;
          }

          .score-number {
            font-size: 40px;
          }

          .recent-reviews-section {
            padding: 20px 16px;
          }

          .review-card {
            padding: 16px;
          }

          .user-avatar {
            width: 44px;
            height: 44px;
            font-size: 18px;
          }

          .empty-review-state {
            padding: 60px 20px;
          }

          .empty-illustration svg {
            width: 120px;
            height: 120px;
          }
        }
      </style>
    `;
  }
};

// 전역 등록
window.reviewTabView = reviewTabView;

console.log('✅ reviewTabView 모듈 로드 완료');
