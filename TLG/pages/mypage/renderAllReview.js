
// 내 리뷰 전체보기 렌더링 함수
async function renderAllReview(userInfo) {
  try {
    console.log('⭐ 내 리뷰 전체보기 화면 렌더링');

    const main = document.getElementById('main');
    
    // 스켈레톤 UI 먼저 표시
    main.innerHTML = `
      <div class="review-history-container">
        <div class="review-history-header">
          <button id="backBtn" class="header-back-btn" onclick="renderMyPage()">
            <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor">
              <path d="M19 12H5m7-7l-7 7 7 7"/>
            </svg>
          </button>
          <div class="header-info">
            <h1>⭐ 내 리뷰</h1>
            <p class="header-subtitle">작성한 모든 리뷰를 확인하세요</p>
          </div>
        </div>

        <div class="review-history-content">
          <div class="review-stats-card">
            <div class="stat-item">
              <div class="stat-number skeleton-text">-</div>
              <div class="stat-label">총 리뷰</div>
            </div>
            <div class="stat-item">
              <div class="stat-number skeleton-text">-</div>
              <div class="stat-label">평점 평균</div>
            </div>
            <div class="stat-item">
              <div class="stat-number skeleton-text">-</div>
              <div class="stat-label">이번 달</div>
            </div>
          </div>

          <div class="reviews-section">
            <div class="section-header">
              <h2>리뷰 목록</h2>
              <div class="review-count skeleton-badge">로딩중...</div>
            </div>
            
            <div id="reviewsList" class="reviews-list">
              ${generateReviewSkeletonCards(5)}
            </div>
          </div>
        </div>
      </div>

      ${getReviewHistoryStyles()}
    `;

    // 실제 데이터 로드
    await loadReviewData(userInfo);

  } catch (error) {
    console.error('❌ 내 리뷰 전체보기 로드 실패:', error);
    showReviewErrorState();
  }
}

// 리뷰 스켈레톤 카드 생성
function generateReviewSkeletonCards(count) {
  return Array.from({ length: count }, (_, i) => `
    <div class="review-card skeleton-card">
      <div class="review-card-header">
        <div class="skeleton-store-name"></div>
        <div class="skeleton-rating"></div>
      </div>
      <div class="review-card-body">
        <div class="skeleton-content"></div>
        <div class="skeleton-content short"></div>
        <div class="review-card-footer">
          <div class="skeleton-date"></div>
        </div>
      </div>
    </div>
  `).join('');
}

// 실제 리뷰 데이터 로드
async function loadReviewData(userInfo) {
  try {
    const response = await fetch(`/api/reviews/users/${userInfo.id}`);
    if (!response.ok) throw new Error('리뷰 조회 실패');

    const data = await response.json();
    const reviewsData = data.reviews || [];

    // 통계 데이터 계산
    const totalReviews = reviewsData.length;
    const averageRating = reviewsData.length > 0 ? 
      (reviewsData.reduce((sum, review) => sum + review.score, 0) / reviewsData.length).toFixed(1) : 0;
    const thisMonthReviews = reviewsData.filter(review => {
      const reviewDate = new Date(review.date);
      const now = new Date();
      return reviewDate.getMonth() === now.getMonth() && 
             reviewDate.getFullYear() === now.getFullYear();
    }).length;

    // 통계 업데이트
    updateReviewStats(totalReviews, averageRating, thisMonthReviews);

    // 리뷰 목록 업데이트
    updateReviewsList(reviewsData);

  } catch (error) {
    console.error('❌ 리뷰 데이터 로드 실패:', error);
    showReviewErrorState();
  }
}

// 통계 업데이트
function updateReviewStats(totalReviews, averageRating, thisMonthReviews) {
  const statNumbers = document.querySelectorAll('.stat-number');
  if (statNumbers[0]) statNumbers[0].textContent = totalReviews + '개';
  if (statNumbers[1]) statNumbers[1].textContent = averageRating + '점';
  if (statNumbers[2]) statNumbers[2].textContent = thisMonthReviews + '개';

  // 스켈레톤 클래스 제거
  statNumbers.forEach(el => el.classList.remove('skeleton-text'));
}

// 리뷰 목록 업데이트
function updateReviewsList(reviewsData) {
  const reviewsList = document.getElementById('reviewsList');
  const reviewCount = document.querySelector('.review-count');

  if (reviewCount) {
    reviewCount.textContent = `${reviewsData.length}개`;
    reviewCount.classList.remove('skeleton-badge');
  }

  if (reviewsData.length === 0) {
    reviewsList.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">📝</div>
        <h3>아직 작성한 리뷰가 없어요</h3>
        <p>첫 리뷰를 작성해보세요!</p>
        <button class="primary-btn" onclick="renderMap()">
          <span class="btn-icon">🗺️</span>
          매장 찾기
        </button>
      </div>
    `;
    return;
  }

  const reviewsHTML = reviewsData.map((review, index) => {
    return `
      <div class="review-card" onclick="goToStore(${review.storeId || 1})">
        <div class="review-card-header">
          <div class="store-info">
            <h3 class="store-name">${review.storeName}</h3>
            <div class="review-meta">
              <span class="review-date">${review.date}</span>
            </div>
          </div>
          <div class="review-rating">
            <div class="rating-stars">${'★'.repeat(review.score)}${'☆'.repeat(5-review.score)}</div>
            <span class="rating-number">${review.score}점</span>
          </div>
        </div>

        <div class="review-card-body">
          <div class="review-content">
            <p class="content-text">${review.content}</p>
          </div>
        </div>
      </div>
    `;
  }).join('');

  reviewsList.innerHTML = reviewsHTML;
}

// 에러 상태 표시
function showReviewErrorState() {
  const main = document.getElementById('main');
  if (main) {
    main.innerHTML = `
      <div class="review-history-container">
        <div class="review-history-header">
          <button id="backBtn" class="header-back-btn" onclick="renderMyPage()">
            <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor">
              <path d="M19 12H5m7-7l-7 7 7 7"/>
            </svg>
          </button>
          <div class="header-info">
            <h1>⭐ 내 리뷰</h1>
          </div>
        </div>

        <div class="review-history-content">
          <div class="error-state">
            <div class="error-icon">⚠️</div>
            <h3>리뷰를 불러올 수 없어요</h3>
            <p>잠시 후 다시 시도해주세요</p>
            <button class="primary-btn" onclick="renderAllReview(userInfo)">
              <span class="btn-icon">🔄</span>
              다시 시도
            </button>
          </div>
        </div>
      </div>

      ${getReviewHistoryStyles()}
    `;
  }
}

// 매장으로 이동
function goToStore(storeId) {
  if (typeof renderStore === 'function') {
    fetch(`/api/stores/${storeId}`)
      .then(response => response.json())
      .then(storeData => {
        if (storeData.success && storeData.store) {
          renderStore(storeData.store);
        }
      })
      .catch(error => {
        console.error('매장 정보 가져오기 실패:', error);
      });
  }
}

// 스타일 정의
function getReviewHistoryStyles() {
  return `
    <style>
      .review-history-container {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        width: 100%;
        max-width: 430px;
        margin: 0 auto;
        display: flex;
        flex-direction: column;
        background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
        overflow: hidden;
      }

      .review-history-header {
        height: 80px;
        background: white;
        padding: 20px 16px;
        display: flex;
        align-items: center;
        gap: 16px;
        box-shadow: 0 2px 12px rgba(0, 0, 0, 0.04);
        flex-shrink: 0;
        z-index: 100;
      }

      .header-back-btn {
        width: 44px;
        height: 44px;
        border-radius: 12px;
        border: none;
        background: #f1f5f9;
        color: #475569;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        transition: all 0.2s ease;
      }

      .header-back-btn:hover {
        background: #e2e8f0;
        color: #334155;
      }

      .header-info {
        flex: 1;
      }

      .header-info h1 {
        margin: 0 0 4px 0;
        font-size: 22px;
        font-weight: 700;
        color: #1e293b;
        line-height: 1.2;
      }

      .header-subtitle {
        margin: 0;
        font-size: 13px;
        color: #64748b;
        font-weight: 500;
      }

      .review-history-content {
        flex: 1;
        overflow-y: auto;
        padding: 20px;
        display: flex;
        flex-direction: column;
        gap: 20px;
      }

      .review-stats-card {
        background: white;
        border-radius: 16px;
        padding: 20px;
        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.04);
        border: 1px solid rgba(226, 232, 240, 0.8);
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 16px;
      }

      .stat-item {
        text-align: center;
      }

      .stat-number {
        font-size: 20px;
        font-weight: 800;
        color: #1e293b;
        margin-bottom: 4px;
        background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        background-clip: text;
      }

      .stat-label {
        font-size: 12px;
        color: #64748b;
        font-weight: 600;
      }

      .reviews-section {
        background: white;
        border-radius: 16px;
        padding: 20px;
        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.04);
        border: 1px solid rgba(226, 232, 240, 0.8);
        flex: 1;
        display: flex;
        flex-direction: column;
      }

      .section-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 20px;
        padding-bottom: 12px;
        border-bottom: 2px solid #f1f5f9;
      }

      .section-header h2 {
        margin: 0;
        font-size: 18px;
        font-weight: 700;
        color: #1e293b;
      }

      .review-count {
        background: #f1f5f9;
        color: #475569;
        padding: 4px 12px;
        border-radius: 12px;
        font-size: 12px;
        font-weight: 600;
      }

      .reviews-list {
        flex: 1;
        display: flex;
        flex-direction: column;
        gap: 16px;
        overflow-y: auto;
      }

      .review-card {
        background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
        border-radius: 12px;
        padding: 16px;
        border: 1px solid #e2e8f0;
        transition: all 0.2s ease;
        cursor: pointer;
      }

      .review-card:hover {
        transform: translateY(-2px);
        box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
        border-color: #cbd5e1;
      }

      .review-card-header {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        margin-bottom: 12px;
      }

      .store-info {
        flex: 1;
      }

      .store-name {
        margin: 0 0 4px 0;
        font-size: 16px;
        font-weight: 700;
        color: #1e293b;
        line-height: 1.3;
      }

      .review-meta {
        display: flex;
        align-items: center;
        gap: 8px;
      }

      .review-date {
        font-size: 12px;
        color: #64748b;
        font-weight: 500;
      }

      .review-rating {
        text-align: right;
      }

      .rating-stars {
        color: #f59e0b;
        font-size: 14px;
        margin-bottom: 2px;
      }

      .rating-number {
        font-size: 12px;
        color: #64748b;
        font-weight: 600;
      }

      .review-card-body {
        display: flex;
        flex-direction: column;
        gap: 12px;
      }

      .review-content {
        flex: 1;
      }

      .content-text {
        margin: 0;
        font-size: 14px;
        color: #475569;
        line-height: 1.4;
      }

      .primary-btn {
        padding: 12px 24px;
        border: none;
        border-radius: 12px;
        background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
        color: white;
        font-size: 14px;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.2s ease;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 8px;
      }

      .primary-btn:hover {
        transform: translateY(-2px);
        box-shadow: 0 4px 16px rgba(245, 158, 11, 0.3);
      }

      .empty-state,
      .error-state {
        text-align: center;
        padding: 60px 20px;
        color: #64748b;
      }

      .empty-icon,
      .error-icon {
        font-size: 64px;
        margin-bottom: 16px;
      }

      .empty-state h3,
      .error-state h3 {
        margin: 0 0 8px 0;
        font-size: 18px;
        font-weight: 700;
        color: #1e293b;
      }

      .empty-state p,
      .error-state p {
        margin: 0 0 24px 0;
        font-size: 14px;
        color: #64748b;
      }

      /* 스켈레톤 애니메이션 */
      .skeleton-text,
      .skeleton-badge,
      .skeleton-store-name,
      .skeleton-rating,
      .skeleton-content,
      .skeleton-date {
        background: linear-gradient(90deg, #f1f5f9 25%, #e2e8f0 50%, #f1f5f9 75%);
        background-size: 200% 100%;
        animation: skeleton-loading 2s infinite;
        border-radius: 4px;
      }

      .skeleton-card {
        pointer-events: none;
      }

      .skeleton-store-name {
        height: 16px;
        width: 120px;
        margin-bottom: 4px;
      }

      .skeleton-rating {
        height: 14px;
        width: 60px;
      }

      .skeleton-content {
        height: 14px;
        width: 100%;
        margin-bottom: 4px;
      }

      .skeleton-content.short {
        width: 70%;
      }

      .skeleton-date {
        height: 12px;
        width: 80px;
      }

      @keyframes skeleton-loading {
        0% {
          background-position: -200% 0;
        }
        100% {
          background-position: 200% 0;
        }
      }

      @media (max-width: 480px) {
        .review-history-header {
          padding: 16px 12px;
        }

        .review-history-content {
          padding: 16px 12px;
        }

        .review-stats-card,
        .reviews-section {
          padding: 16px;
        }

        .header-info h1 {
          font-size: 20px;
        }
      }
    </style>
  `;
}

// 전역으로 함수 노출
window.renderAllReview = renderAllReview;
