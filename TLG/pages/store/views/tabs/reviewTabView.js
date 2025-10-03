
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
    const avgRating = this.calculateAverageRating(reviewData);

    return `
      <div class="review-tab-container">
        <!-- 헤더 섹션 -->
        <div class="review-tab-header">
          <div class="header-content">
            <div class="header-left">
              <div class="review-icon-badge">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" fill="url(#star-gradient)" stroke="url(#star-gradient)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                  <defs>
                    <linearGradient id="star-gradient" x1="2" y1="2" x2="22" y2="21.02">
                      <stop offset="0%" stop-color="#f59e0b"/>
                      <stop offset="100%" stop-color="#d97706"/>
                    </linearGradient>
                  </defs>
                </svg>
              </div>
              <div class="header-title-section">
                <h3 class="review-tab-title">고객 리뷰</h3>
                <p class="review-tab-subtitle">실제 방문 후기를 확인하세요</p>
              </div>
            </div>
            <div class="header-stats">
              <div class="avg-rating">
                <span class="rating-value">${avgRating}</span>
                <div class="rating-stars-mini">${this.renderStarsMini(avgRating)}</div>
              </div>
              <span class="review-count-badge">${totalReviews}개</span>
            </div>
          </div>
        </div>

        <!-- 리뷰 리스트 -->
        <div class="review-list-modern">
          ${recentReviews.map((review, idx) => this.renderReviewItem(review, idx)).join('')}
        </div>

        <!-- 더보기 버튼 -->
        ${totalReviews > 3 ? `
          <button class="see-more-reviews-btn" onclick="if(typeof renderAllReview === 'function') { renderAllReview(${JSON.stringify(store).replace(/"/g, '&quot;')}); } else { alert('리뷰 전체보기 기능을 불러올 수 없습니다.'); }">
            <span class="btn-content">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <path d="M5 12h14M12 5l7 7-7 7" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
              <span class="btn-text">모든 리뷰 보기 (${totalReviews - 3}개 더)</span>
            </span>
          </button>
        ` : ''}
      </div>
      ${this.getReviewTabStyles()}
    `;
  },

  /**
   * 평균 평점 계산
   */
  calculateAverageRating(reviews) {
    if (!reviews || reviews.length === 0) return 0;
    const sum = reviews.reduce((acc, review) => acc + (review.score || review.rating || 0), 0);
    return (sum / reviews.length).toFixed(1);
  },

  /**
   * 미니 별점 렌더링
   */
  renderStarsMini(rating) {
    const fullStars = Math.floor(rating);
    return '★'.repeat(fullStars);
  },

  /**
   * 개별 리뷰 아이템 렌더링
   */
  renderReviewItem(review, index) {
    const userName = review.user_name || `사용자${review.user_id}`;
    const rating = review.score || review.rating || 0;
    const content = review.content || review.review_text || '';
    const date = new Date(review.created_at || review.date).toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    const colors = ['#667eea', '#f093fb', '#4facfe', '#43e97b', '#fa709a', '#feca57'];
    const avatarColor = colors[index % colors.length];

    return `
      <div class="review-card-modern" style="animation-delay: ${index * 0.1}s">
        <div class="review-card-inner">
          <!-- 리뷰 헤더 -->
          <div class="review-card-header">
            <div class="user-section">
              <div class="user-avatar-modern" style="background: ${avatarColor}">
                ${userName.charAt(0).toUpperCase()}
              </div>
              <div class="user-info-modern">
                <div class="user-name-modern">${userName}</div>
                <div class="review-date-modern">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                    <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2"/>
                    <path d="M12 6v6l4 2" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                  </svg>
                  ${date}
                </div>
              </div>
            </div>
            <div class="rating-badge-modern">
              ${this.renderStars(rating)}
            </div>
          </div>

          <!-- 리뷰 내용 -->
          <div class="review-card-content">
            <p class="review-text-modern">${content}</p>
          </div>

          <!-- 리뷰 푸터 -->
          <div class="review-card-footer">
            <div class="reaction-buttons">
              <button class="reaction-btn">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                  <path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
                도움돼요
              </button>
            </div>
          </div>
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
      <div class="rating-stars-display">
        ${'<span class="star-filled">★</span>'.repeat(fullStars)}
        ${hasHalfStar ? '<span class="star-half">★</span>' : ''}
        ${'<span class="star-empty">☆</span>'.repeat(emptyStars)}
        <span class="rating-number-display">${rating.toFixed(1)}</span>
      </div>
    `;
  },

  /**
   * 빈 상태 렌더링
   */
  renderEmptyState() {
    return `
      <div class="review-tab-container">
        <div class="empty-review-modern">
          <div class="empty-illustration">
            <svg width="120" height="120" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="10" stroke="url(#empty-gradient)" stroke-width="2"/>
              <path d="M8 14s1.5 2 4 2 4-2 4-2M9 9h.01M15 9h.01" stroke="url(#empty-gradient)" stroke-width="2" stroke-linecap="round"/>
              <defs>
                <linearGradient id="empty-gradient" x1="2" y1="2" x2="22" y2="22">
                  <stop offset="0%" stop-color="#cbd5e1"/>
                  <stop offset="100%" stop-color="#94a3b8"/>
                </linearGradient>
              </defs>
            </svg>
          </div>
          <h3 class="empty-title">아직 리뷰가 없습니다</h3>
          <p class="empty-description">이 매장의 첫 번째 리뷰를 남겨주세요!<br/>소중한 의견이 다른 고객에게 큰 도움이 됩니다.</p>
          <button class="write-first-review-btn" onclick="if(typeof renderReviewWrite === 'function') { renderReviewWrite(${JSON.stringify(store).replace(/"/g, '&quot;')}); } else { alert('리뷰 작성 기능은 준비 중입니다.'); }">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
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
    const seeMoreBtn = document.querySelector('.see-more-reviews-btn');
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

    const writeFirstBtn = document.querySelector('.write-first-review-btn');
    if (writeFirstBtn) {
      writeFirstBtn.addEventListener('click', () => {
        console.log('✍️ 첫 리뷰 작성 버튼 클릭');
        // 리뷰 작성 페이지로 이동
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
          background: linear-gradient(180deg, #f8fafc 0%, #f1f5f9 100%);
          min-height: 300px;
        }

        /* 헤더 스타일 */
        .review-tab-header {
          margin-bottom: 24px;
          background: white;
          border-radius: 20px;
          padding: 20px;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.06);
          border: 1px solid rgba(0, 0, 0, 0.04);
        }

        .header-content {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 16px;
        }

        .header-left {
          display: flex;
          align-items: center;
          gap: 16px;
          flex: 1;
        }

        .review-icon-badge {
          width: 48px;
          height: 48px;
          background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
          border-radius: 14px;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 4px 12px rgba(245, 158, 11, 0.2);
        }

        .header-title-section {
          flex: 1;
        }

        .review-tab-title {
          margin: 0 0 4px 0;
          font-size: 20px;
          font-weight: 800;
          color: #1e293b;
          letter-spacing: -0.5px;
        }

        .review-tab-subtitle {
          margin: 0;
          font-size: 13px;
          color: #64748b;
          font-weight: 500;
        }

        .header-stats {
          display: flex;
          flex-direction: column;
          align-items: flex-end;
          gap: 6px;
        }

        .avg-rating {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .rating-value {
          font-size: 28px;
          font-weight: 900;
          background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .rating-stars-mini {
          color: #f59e0b;
          font-size: 14px;
          line-height: 1;
        }

        .review-count-badge {
          font-size: 12px;
          font-weight: 600;
          color: #64748b;
          background: #f1f5f9;
          padding: 4px 12px;
          border-radius: 12px;
        }

        /* 리뷰 리스트 */
        .review-list-modern {
          display: flex;
          flex-direction: column;
          gap: 16px;
          margin-bottom: 20px;
        }

        .review-card-modern {
          background: white;
          border-radius: 16px;
          overflow: hidden;
          box-shadow: 0 2px 12px rgba(0, 0, 0, 0.06);
          border: 1px solid rgba(0, 0, 0, 0.04);
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          animation: slideInUp 0.5s ease-out forwards;
          opacity: 0;
        }

        @keyframes slideInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .review-card-modern:hover {
          transform: translateY(-4px);
          box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
        }

        .review-card-inner {
          padding: 20px;
        }

        .review-card-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 16px;
        }

        .user-section {
          display: flex;
          align-items: center;
          gap: 12px;
          flex: 1;
        }

        .user-avatar-modern {
          width: 48px;
          height: 48px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 20px;
          font-weight: 700;
          color: white;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
          flex-shrink: 0;
        }

        .user-info-modern {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .user-name-modern {
          font-size: 16px;
          font-weight: 700;
          color: #1e293b;
        }

        .review-date-modern {
          display: flex;
          align-items: center;
          gap: 4px;
          font-size: 12px;
          color: #64748b;
          font-weight: 500;
        }

        .review-date-modern svg {
          stroke: #94a3b8;
        }

        .rating-badge-modern {
          flex-shrink: 0;
        }

        .rating-stars-display {
          display: flex;
          align-items: center;
          gap: 2px;
          background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
          padding: 6px 12px;
          border-radius: 12px;
        }

        .rating-stars-display .star-filled {
          color: #f59e0b;
          font-size: 16px;
          line-height: 1;
        }

        .rating-stars-display .star-half {
          color: #f59e0b;
          opacity: 0.5;
          font-size: 16px;
          line-height: 1;
        }

        .rating-stars-display .star-empty {
          color: #cbd5e1;
          font-size: 16px;
          line-height: 1;
        }

        .rating-number-display {
          font-size: 14px;
          font-weight: 700;
          color: #92400e;
          margin-left: 6px;
        }

        .review-card-content {
          margin-bottom: 16px;
        }

        .review-text-modern {
          margin: 0;
          font-size: 15px;
          line-height: 1.6;
          color: #475569;
          word-break: keep-all;
        }

        .review-card-footer {
          padding-top: 12px;
          border-top: 1px solid #f1f5f9;
        }

        .reaction-buttons {
          display: flex;
          gap: 8px;
        }

        .reaction-btn {
          display: flex;
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

        .reaction-btn:hover {
          background: #eff6ff;
          border-color: #3b82f6;
          color: #3b82f6;
        }

        .reaction-btn svg {
          stroke: currentColor;
        }

        /* 더보기 버튼 */
        .see-more-reviews-btn {
          width: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 16px 24px;
          background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
          color: white;
          border: none;
          border-radius: 14px;
          font-size: 15px;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          box-shadow: 0 4px 16px rgba(59, 130, 246, 0.3);
        }

        .see-more-reviews-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 24px rgba(59, 130, 246, 0.4);
          background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
        }

        .see-more-reviews-btn:active {
          transform: translateY(0);
        }

        .btn-content {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .btn-content svg {
          transition: transform 0.3s ease;
        }

        .see-more-reviews-btn:hover .btn-content svg {
          transform: translateX(4px);
        }

        /* 빈 상태 */
        .empty-review-modern {
          padding: 60px 20px;
          text-align: center;
          background: white;
          border-radius: 20px;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.06);
        }

        .empty-illustration {
          margin-bottom: 24px;
          display: flex;
          justify-content: center;
          animation: float 3s ease-in-out infinite;
        }

        @keyframes float {
          0%, 100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-10px);
          }
        }

        .empty-title {
          margin: 0 0 12px 0;
          font-size: 22px;
          font-weight: 800;
          color: #1e293b;
          letter-spacing: -0.5px;
        }

        .empty-description {
          margin: 0 0 24px 0;
          font-size: 15px;
          color: #64748b;
          line-height: 1.6;
        }

        .write-first-review-btn {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 14px 28px;
          background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
          color: white;
          border: none;
          border-radius: 12px;
          font-size: 15px;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.3s ease;
          box-shadow: 0 4px 16px rgba(245, 158, 11, 0.3);
        }

        .write-first-review-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 24px rgba(245, 158, 11, 0.4);
        }

        .write-first-review-btn svg {
          stroke: currentColor;
        }

        /* 반응형 */
        @media (max-width: 480px) {
          .review-tab-container {
            padding: 16px 12px;
          }

          .review-tab-header {
            padding: 16px;
          }

          .review-icon-badge {
            width: 44px;
            height: 44px;
          }

          .review-tab-title {
            font-size: 18px;
          }

          .review-card-inner {
            padding: 16px;
          }

          .user-avatar-modern {
            width: 44px;
            height: 44px;
            font-size: 18px;
          }

          .user-name-modern {
            font-size: 15px;
          }

          .review-text-modern {
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
