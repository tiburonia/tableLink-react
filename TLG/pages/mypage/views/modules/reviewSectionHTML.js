
/**
 * Review Section Component
 * 리뷰 섹션 UI 컴포넌트
 */

export function generateReviewSectionHTML(reviews) {
  const reviewListHTML = reviews.length > 0
    ? reviews.slice(0, 3).map(review => generateReviewItemHTML(review)).join('')
    : generateEmptyReviewHTML();

  return `
    <section class="section-card reviews-card">
      <div class="section-header">
        <div class="section-title">
          <div class="section-icon">⭐</div>
          <div class="section-text">
            <h3>내 리뷰</h3>
            <p class="section-subtitle">작성한 리뷰를 관리하세요</p>
          </div>
        </div>
        <button class="modern-see-more-btn" id="viewAllReviewsBtn">
          <span class="btn-text">전체보기</span>
          <div class="btn-icon">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
              <path d="M9 18L15 12L9 6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </div>
        </button>
      </div>
      <div id="reviewList" class="modern-content-list">
        ${reviewListHTML}
      </div>
    </section>
  `;
}

function generateReviewItemHTML(review) {
  const storeName = review.store_name || `매장 ${review.store_id}`;
  const rating = review.score || review.rating || 0;
  const content = review.content || review.review_text || '';
  const date = new Date(review.created_at).toLocaleDateString();

  return `
    <div class="review-item">
      <div class="review-header">
        <div class="review-store">${storeName}</div>
        <div class="review-rating">⭐ ${rating}점</div>
      </div>
      <div class="review-content">${content}</div>
      <div class="review-date">📅 ${date}</div>
    </div>
  `;
}

function generateEmptyReviewHTML() {
  return `
    <div class="empty-state">
      <div class="empty-icon">⭐</div>
      <div class="empty-text">작성한 리뷰가 없습니다</div>
    </div>
  `;
}
