// 리뷰 관리자
window.ReviewManager = {
  async renderTopReviews(store) {
    try {
      console.log(`🔍 매장 ${store.id} 리뷰 미리보기 로딩 중...`);
      const response = await fetch(`/api/stores/${store.id}/reviews?limit=2`);
      if (!response.ok) {
        console.error(`❌ 리뷰 API 응답 실패: ${response.status} ${response.statusText}`);
        throw new Error(`Failed to fetch reviews: ${response.status}`);
      }
      const data = await response.json();
      const reviews = data.reviews || [];

      console.log(`📖 리뷰 미리보기 데이터:`, reviews);

      const reviewPreviewContent = document.getElementById('reviewPreviewContent');
      if (reviewPreviewContent) {
        if (reviews.length === 0) {
          reviewPreviewContent.innerHTML = `
            <div class="review-card" style="text-align: center; color: #888;">
              <div>아직 등록된 리뷰가 없습니다.</div>
              <div style="font-size: 13px; margin-top: 4px;">첫 리뷰를 남겨주세요!</div>
            </div>
          `;
        } else {
          reviewPreviewContent.innerHTML = reviews.slice(0, 2).map(review => `
            <div class="review-card">
              <span class="review-user">${review.user || '익명'}</span>
              <span class="review-score">★ ${review.score}</span>
              <span class="review-date">${review.date || '날짜 정보 없음'}</span>
              <div class="review-text">${review.content}</div>
            </div>
          `).join('');
        }
        console.log('✅ 리뷰 미리보기 렌더링 완료');
      } else {
        console.warn('⚠️ reviewPreviewContent 엘리먼트를 찾을 수 없음');
      }
    } catch (error) {
      console.error('❌ 리뷰 미리보기 오류 (상세):', error);
      const reviewPreviewContent = document.getElementById('reviewPreviewContent');
      if (reviewPreviewContent) {
        reviewPreviewContent.innerHTML = `
          <div class="review-card" style="text-align: center; color: #ff6b6b;">
            <div>리뷰를 불러올 수 없습니다.</div>
            <div style="font-size: 13px; margin-top: 4px;">오류: ${error.message}</div>
          </div>
        `;
      }
    }
  }
};