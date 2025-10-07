
/**
 * 리뷰 프리뷰 뷰 - UI 렌더링 계층
 */
export const reviewPreviewView = {
  /**
   * 리뷰 미리보기 렌더링
   */
  async renderTopReviews(reviews, currentUserId = null) {
    const reviewPreviewContent = document.getElementById('reviewPreviewContent');
    if (!reviewPreviewContent) {
      console.warn('⚠️ reviewPreviewContent 엘리먼트를 찾을 수 없음');
      return;
    }

    if (reviews.length === 0) {
      reviewPreviewContent.innerHTML = this.renderEmptyState();
      return;
    }

    const reviewsHTML = reviews.slice(0, 2).map((review, index) => 
      this.renderReviewCard(review, index, currentUserId)
    ).join('');

    reviewPreviewContent.innerHTML = reviewsHTML;
  },

  /**
   * 리뷰 카드 렌더링
   */
  renderReviewCard(review, index, currentUserId) {
    const userInitial = (review.user || '익명').charAt(0);
    const colors = ['#6366f1', '#8b5cf6', '#06b6d4', '#10b981', '#f59e0b', '#ef4444'];
    const avatarColor = colors[index % colors.length];
    const reviewDate = review.date ? new Date(review.date).toLocaleDateString('ko-KR', {
      month: 'short',
      day: 'numeric'
    }) : '날짜 정보 없음';

    const isMyReview = currentUserId && review.userId === currentUserId;

    return `
      <div class="premium-review-item ${isMyReview ? 'my-review' : ''}">
        <div class="premium-review-header">
          <div class="premium-user-avatar" style="background: ${avatarColor}">
            ${userInitial}
          </div>
          <div class="premium-user-info">
            <div class="premium-user-name">${isMyReview ? '내 리뷰' : review.user || '익명'}</div>
            <div class="premium-review-date">${reviewDate}</div>
          </div>
          <div class="premium-rating-badge">
            <span class="premium-star-icon">★</span>
            <span class="premium-rating-value">${review.score}</span>
          </div>
        </div>
        <div class="premium-review-text">${review.content}</div>
      </div>
    `;
  },

  /**
   * 빈 상태 렌더링
   */
  renderEmptyState() {
    return `
      <div class="empty-review-state">
        <div class="empty-review-icon">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" stroke="#cbd5e1" stroke-width="2" fill="none"/>
            <path d="M8 9h8M8 13h6" stroke="#cbd5e1" stroke-width="2" stroke-linecap="round"/>
          </svg>
        </div>
        <div class="empty-review-title">아직 등록된 리뷰가 없어요</div>
        <div class="empty-review-desc">이 매장의 첫 번째 리뷰를 남겨보세요!</div>
      </div>
      <style>
        .empty-review-state {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 40px 20px;
          text-align: center;
        }
        .empty-review-icon {
          margin-bottom: 16px;
          opacity: 0.6;
        }
        .empty-review-title {
          font-size: 16px;
          font-weight: 600;
          color: #374151;
          margin-bottom: 8px;
        }
        .empty-review-desc {
          font-size: 14px;
          color: #6b7280;
          line-height: 1.4;
        }
      </style>
    `;
  },

  /**
   * 별점 분포 차트 렌더링
   */
  renderRatingDistribution(distribution, total) {
    if (total === 0) {
      return '<div class="no-ratings">아직 평가가 없습니다.</div>';
    }

    let html = '<div class="rating-distribution">';
    
    for (let score = 5; score >= 1; score--) {
      const count = distribution[score] || 0;
      const percentage = total > 0 ? (count / total * 100).toFixed(1) : 0;
      
      html += `
        <div class="rating-bar">
          <span class="rating-score">${score}★</span>
          <div class="rating-progress">
            <div class="rating-fill" style="width: ${percentage}%"></div>
          </div>
          <span class="rating-count">${count}개</span>
        </div>
      `;
    }
    
    html += '</div>';
    return html;
  }
};

// 전역 등록
window.reviewPreviewView = reviewPreviewView;

console.log('✅ reviewPreviewView 로드 완료');
