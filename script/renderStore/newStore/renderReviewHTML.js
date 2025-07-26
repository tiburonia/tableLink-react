function renderReviewHTML(store) {
  const reviews = store.reviews || [];
  const total = store.reviewTotal || reviews.length;
  const avgScore = total && reviews.length > 0
    ? (reviews.reduce((sum, r) => sum + r.score, 0) / reviews.length).toFixed(1)
    : "0.0";
  // 미리보기로 2~3개만 표시 (최신순)
  const preview = reviews.slice(0, 3);


  // 리뷰 없을 때 안내
  if (total === 0) {
    return `
      <div class="review-preview">
        <div class="review-title-row">
          <span class="review-title">리뷰 미리보기</span>
        </div>
        <div class="review-all-empty">
          <div style="font-size:16px;font-weight:600;margin-bottom:8px;">등록된 리뷰가 없습니다.</div>
          <div style="color:#aaa;">첫 리뷰를 남겨주세요!</div>
        </div>
        <button class="see-more-btn" style="margin-top:10px;">전체 리뷰 보기</button>
      </div>
    `;
  }

  return `
    <div class="review-preview">
      <div class="review-title-row" style="justify-content:space-between;align-items:center;">
        <div>
          <span class="review-title" style="font-size:16px;font-weight:700;">리뷰 미리보기</span>
          <span class="review-title" style="margin-left:10px;color:#297efc;font-size:14px;">★ ${avgScore}</span>
          <span style="margin-left:4px;color:#888;font-size:13px;">(${total}개)</span>
        </div>
        <button class="see-more-btn">전체보기</button>
      </div>
      <div class="review-preview-list">
        ${preview.map(r => `
          <div class="review-card">
            <div class="review-meta">
              <span class="review-user">👤 ${r.user || r.userId || '익명'}</span>
              <span class="review-score">★ ${r.score}</span>
              <span class="review-date">${r.date || ''}</span>
            </div>
            <div class="review-text">${r.content}</div>
          </div>
        `).join('')}
      </div>
    </div>

    <style>
      .review-preview {
        background: #fff;
        border-radius: 12px;
        box-shadow: 0 2px 8px rgba(0,0,0,0.03);
        padding: 14px 13px 13px 14px;
        margin-bottom: 12px;
        display: flex;
        flex-direction: column;
        gap: 6px;
      }
      .review-title-row {
        display: flex;
        align-items: center;
        margin-bottom: 5px;
      }
      .review-title {
        font-size: 15px;
        font-weight: 600;
        color: #333;
      }
      .see-more-btn {
        font-size: 13px;
        color: #297efc;
        background: none;
        border: none;
        cursor: pointer;
        padding: 2px 11px;
        border-radius: 6px;
        transition: background 0.13s;
      }
      .see-more-btn:hover { background: #f0f6ff; }
      .review-preview-list { display: flex; flex-direction: column; gap: 9px; }
      .review-card { /* 위에 카드랑 동일 스타일이면 이 부분 통일해도 됨 */ }

    </style>
  `;




}
// 전체 리뷰 보기 핸들러 함수
async function handleViewAllReviews() {
  try {
    // 캐시에서 현재 매장 정보 가져오기
    const currentStore = window.currentStore;
    if (!currentStore) {
      console.error('❌ 현재 매장 정보를 찾을 수 없습니다');
      return;
    }
    
    console.log('🔍 전체 리뷰 보기 - 매장:', currentStore.name);
    renderAllReview(currentStore);
    
  } catch (error) {
    console.error('❌ 전체 리뷰 보기 실패:', error);
    alert('리뷰를 불러올 수 없습니다.');
  }
}

