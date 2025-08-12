
async function renderReviewHTML(store) {
  console.log(`🔍 매장 ${store.id} 리뷰 미리보기 렌더링 시작`);

  // 즉시 로딩 UI 표시 (더 세련된 스켈레톤)
  const loadingHTML = `
    <div class="review-loading-container">
      <div class="loading-header">
        <div class="skeleton-line" style="width: 120px; height: 24px; border-radius: 6px;"></div>
        <div class="skeleton-line" style="width: 80px; height: 18px; border-radius: 4px;"></div>
      </div>
      <div class="loading-reviews">
        ${Array(3).fill(0).map(() => `
          <div class="loading-review-card">
            <div class="loading-card-header">
              <div class="skeleton-avatar"></div>
              <div class="loading-user-info">
                <div class="skeleton-line" style="width: 100px; height: 16px;"></div>
                <div class="skeleton-line" style="width: 70px; height: 14px;"></div>
              </div>
              <div class="skeleton-rating">
                <div class="skeleton-line" style="width: 60px; height: 20px;"></div>
              </div>
            </div>
            <div class="loading-content">
              <div class="skeleton-line" style="width: 100%; height: 14px;"></div>
              <div class="skeleton-line" style="width: 85%; height: 14px;"></div>
              <div class="skeleton-line" style="width: 70%; height: 14px;"></div>
            </div>
          </div>
        `).join('')}
      </div>
      <style>
        .review-loading-container {
          padding: 24px;
          background: #ffffff;
          border-radius: 20px;
          box-shadow: 0 8px 32px rgba(0,0,0,0.08);
          margin: 16px 0;
        }
        
        .loading-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 24px;
          padding-bottom: 16px;
          border-bottom: 1px solid #f1f5f9;
        }
        
        .loading-reviews {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }
        
        .loading-review-card {
          background: #f8fafc;
          border-radius: 16px;
          padding: 20px;
          border: 1px solid #e2e8f0;
        }
        
        .loading-card-header {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 16px;
        }
        
        .skeleton-avatar {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          background: linear-gradient(90deg, #e2e8f0 25%, #f1f5f9 50%, #e2e8f0 75%);
          background-size: 200% 100%;
          animation: skeleton-loading 1.5s infinite;
          flex-shrink: 0;
        }
        
        .loading-user-info {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 4px;
        }
        
        .skeleton-rating {
          flex-shrink: 0;
        }
        
        .loading-content {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        
        .skeleton-line {
          background: linear-gradient(90deg, #e2e8f0 25%, #f1f5f9 50%, #e2e8f0 75%);
          background-size: 200% 100%;
          animation: skeleton-loading 1.5s infinite;
          border-radius: 4px;
        }
        
        @keyframes skeleton-loading {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
      </style>
    </div>
  `;

  // 비동기 데이터 로드 및 UI 업데이트
  loadReviewData(store, loadingHTML);
  
  return loadingHTML;
}

async function loadReviewData(store, loadingHTML) {
  try {
    // 서버에서 리뷰 데이터 가져오기
    const response = await fetch(`/api/reviews/preview/${store.id}`);

    console.log('📡 API 응답 상태:', response.status);

    if (!response.ok) {
      throw new Error(`리뷰 데이터 조회 실패: ${response.status}`);
    }

    const reviewData = await response.json();
    console.log('📦 받은 리뷰 데이터 전체:', reviewData);

    // 응답 구조 확인
    if (!reviewData.success) {
      console.error('❌ 서버에서 오류 응답:', reviewData.error);
      throw new Error(reviewData.error || '리뷰 조회 실패');
    }

    const reviews = reviewData.reviews || [];
    console.log('📋 처리할 리뷰 배열:', reviews);

    // 실제 리뷰 데이터로 UI 업데이트
    const storeContent = document.getElementById('storeContent');
    if (storeContent) {
      if (reviews.length > 0) {
        console.log('🔍 첫 번째 리뷰 데이터 구조:', reviews[0]);
        
        const total = reviews.length;
        const avgScore = total > 0
          ? (reviews.reduce((sum, r) => sum + (r.score || 0), 0) / total).toFixed(1)
          : "0.0";

        let reviewHTML = `
          <div class="modern-review-container">
            <div class="review-header-section">
              <div class="header-left">
                <h3 class="review-title">고객 리뷰</h3>
                <div class="review-summary">
                  <div class="rating-display">
                    <span class="rating-stars">${'★'.repeat(Math.round(parseFloat(avgScore)))}</span>
                    <span class="rating-number">${avgScore}</span>
                  </div>
                  <span class="review-count">${total}개의 리뷰</span>
                </div>
              </div>
              <button class="view-all-button" onclick="renderAllReview(window.currentStore)">
                <span>전체보기</span>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                  <path d="M9 18L15 12L9 6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
              </button>
            </div>
            
            <div class="reviews-grid">
        `;
        
        reviews.forEach((review, index) => {
          const reviewDate = new Date(review.created_at).toLocaleDateString('ko-KR', {
            month: 'short',
            day: 'numeric'
          });

          const userInitial = (review.user_name || '익명').charAt(0);
          const colors = ['#6366f1', '#8b5cf6', '#06b6d4', '#10b981', '#f59e0b', '#ef4444'];
          const avatarColor = colors[index % colors.length];

          reviewHTML += `
            <div class="modern-review-card">
              <div class="review-card-header">
                <div class="user-avatar" style="background: ${avatarColor}">
                  ${userInitial}
                </div>
                <div class="user-info">
                  <div class="user-name">${review.user_name || '익명'}</div>
                  <div class="review-date">${reviewDate}</div>
                </div>
                <div class="review-rating">
                  <div class="rating-badge">
                    <span class="star-icon">★</span>
                    <span class="rating-value">${review.score}</span>
                  </div>
                </div>
              </div>
              <div class="review-content">
                <p class="review-text">${review.content || '내용 없음'}</p>
              </div>
            </div>
          `;
        });
        
        reviewHTML += `
            </div>
            
            ${total > 3 ? `
              <div class="more-reviews-indicator">
                <div class="indicator-content">
                  <span class="indicator-text">+${total - 3}개의 리뷰가 더 있습니다</span>
                  <button class="show-more-btn" onclick="renderAllReview(window.currentStore)">
                    모두 보기 →
                  </button>
                </div>
              </div>
            ` : ''}
          </div>
        `;
        
        storeContent.innerHTML = reviewHTML + getModernReviewStyles();
        console.log('✅ 리뷰 HTML 업데이트 완료');
      } else {
        storeContent.innerHTML = `
          <div class="modern-review-container">
            <div class="empty-review-state">
              <div class="empty-icon">
                <svg width="64" height="64" viewBox="0 0 24 24" fill="none">
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" stroke="#cbd5e1" stroke-width="2" fill="none"/>
                  <path d="M8 9h8M8 13h6" stroke="#cbd5e1" stroke-width="2" stroke-linecap="round"/>
                </svg>
              </div>
              <h3 class="empty-title">아직 리뷰가 없어요</h3>
              <p class="empty-description">이 매장의 첫 번째 리뷰를 남겨보세요!</p>
              <button class="write-review-btn" onclick="alert('리뷰 작성 기능 준비중입니다!')">
                <span>첫 리뷰 작성하기</span>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                  <path d="M12 4v16m8-8H4" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                </svg>
              </button>
            </div>
          </div>
          ${getModernReviewStyles()}
        `;
        console.log('📝 리뷰 없음 메시지 표시');
      }
    }

  } catch (error) {
    console.error('❌ 리뷰 데이터 로드 실패:', error);
    
    // 오류 발생 시 오류 메시지 표시
    const storeContent = document.getElementById('storeContent');
    if (storeContent) {
      storeContent.innerHTML = `
        <div class="modern-review-container">
          <div class="error-state">
            <div class="error-icon">
              <svg width="64" height="64" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="10" stroke="#ef4444" stroke-width="2" fill="none"/>
                <path d="M15 9l-6 6M9 9l6 6" stroke="#ef4444" stroke-width="2" stroke-linecap="round"/>
              </svg>
            </div>
            <h3 class="error-title">리뷰를 불러올 수 없습니다</h3>
            <p class="error-description">${error.message}</p>
            <button class="retry-btn" onclick="location.reload()">
              <span>다시 시도</span>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <path d="M1 4v6h6M23 20v-6h-6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                <path d="M20.49 9A9 9 0 0 0 5.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 0 1 3.51 15" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </button>
          </div>
        </div>
        ${getModernReviewStyles()}
      `;
    }
  }
}

// 현대적인 스타일 함수
function getModernReviewStyles() {
  return `
    <style>
      .modern-review-container {
        background: #ffffff;
        border-radius: 20px;
        padding: 24px;
        margin: 12px 0;
        box-shadow: 0 8px 32px rgba(0,0,0,0.08);
        border: 1px solid #f1f5f9;
        position: relative;
        overflow: hidden;
      }

      .modern-review-container::before {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        height: 4px;
        background: linear-gradient(90deg, #6366f1, #8b5cf6, #06b6d4);
      }

      .review-header-section {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 20px;
        padding-bottom: 16px;
        border-bottom: 2px solid #f8fafc;
      }

      .header-left {
        display: flex;
        flex-direction: column;
        gap: 8px;
      }

      .review-title {
        font-size: 22px;
        font-weight: 700;
        color: #1e293b;
        margin: 0;
        line-height: 1.3;
      }

      .review-summary {
        display: flex;
        align-items: center;
        gap: 14px;
      }

      .rating-display {
        display: flex;
        align-items: center;
        gap: 8px;
        background: #fef3c7;
        padding: 6px 12px;
        border-radius: 20px;
        border: 1px solid #fbbf24;
      }

      .rating-stars {
        color: #f59e0b;
        font-size: 16px;
        font-weight: bold;
      }

      .rating-number {
        color: #92400e;
        font-weight: 700;
        font-size: 16px;
      }

      .review-count {
        color: #64748b;
        font-size: 14px;
        font-weight: 500;
      }

      .view-all-button {
        display: flex;
        align-items: center;
        gap: 8px;
        background: linear-gradient(135deg, #6366f1, #8b5cf6);
        color: white;
        border: none;
        padding: 12px 20px;
        border-radius: 16px;
        font-size: 14px;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.3s ease;
        box-shadow: 0 4px 16px rgba(99, 102, 241, 0.3);
      }

      .view-all-button:hover {
        transform: translateY(-2px);
        box-shadow: 0 8px 25px rgba(99, 102, 241, 0.4);
      }

      .reviews-grid {
        display: flex;
        flex-direction: column;
        gap: 14px;
      }

      .modern-review-card {
        background: linear-gradient(145deg, #ffffff, #f8fafc);
        border-radius: 16px;
        padding: 20px;
        border: 1px solid #e2e8f0;
        transition: all 0.3s ease;
        position: relative;
        overflow: hidden;
      }

      .modern-review-card::before {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        width: 4px;
        height: 100%;
        background: linear-gradient(180deg, #6366f1, #8b5cf6);
        opacity: 0;
        transition: opacity 0.3s ease;
      }

      .modern-review-card:hover {
        transform: translateY(-4px);
        box-shadow: 0 12px 32px rgba(0,0,0,0.12);
        border-color: #6366f1;
      }

      .modern-review-card:hover::before {
        opacity: 1;
      }

      .review-card-header {
        display: flex;
        align-items: center;
        gap: 16px;
        margin-bottom: 16px;
      }

      .user-avatar {
        width: 44px;
        height: 44px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
        font-weight: 700;
        font-size: 16px;
        flex-shrink: 0;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      }

      .user-info {
        flex: 1;
        display: flex;
        flex-direction: column;
        gap: 4px;
      }

      .user-name {
        font-weight: 600;
        color: #1e293b;
        font-size: 16px;
      }

      .review-date {
        color: #64748b;
        font-size: 14px;
        font-weight: 500;
      }

      .review-rating {
        flex-shrink: 0;
      }

      .rating-badge {
        display: flex;
        align-items: center;
        gap: 4px;
        background: #fff7ed;
        border: 1px solid #fed7aa;
        padding: 8px 12px;
        border-radius: 12px;
      }

      .star-icon {
        color: #f97316;
        font-size: 16px;
      }

      .rating-value {
        color: #9a3412;
        font-weight: 700;
        font-size: 14px;
      }

      .review-content {
        margin-top: 8px;
      }

      .review-text {
        color: #475569;
        font-size: 15px;
        line-height: 1.6;
        margin: 0;
        word-break: break-word;
      }

      .more-reviews-indicator {
        margin-top: 20px;
        padding-top: 20px;
        border-top: 1px solid #e2e8f0;
      }

      .indicator-content {
        display: flex;
        justify-content: space-between;
        align-items: center;
        background: #f8fafc;
        padding: 16px 20px;
        border-radius: 16px;
        border: 1px solid #e2e8f0;
      }

      .indicator-text {
        color: #64748b;
        font-size: 14px;
        font-weight: 500;
      }

      .show-more-btn {
        background: transparent;
        border: none;
        color: #6366f1;
        font-size: 14px;
        font-weight: 600;
        cursor: pointer;
        transition: color 0.2s ease;
      }

      .show-more-btn:hover {
        color: #4f46e5;
      }

      /* 빈 상태 스타일 */
      .empty-review-state {
        text-align: center;
        padding: 60px 20px;
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 16px;
      }

      .empty-icon {
        margin-bottom: 8px;
        opacity: 0.6;
      }

      .empty-title {
        font-size: 20px;
        font-weight: 700;
        color: #1e293b;
        margin: 0;
      }

      .empty-description {
        font-size: 16px;
        color: #64748b;
        margin: 0 0 24px 0;
        max-width: 300px;
      }

      .write-review-btn {
        display: flex;
        align-items: center;
        gap: 8px;
        background: linear-gradient(135deg, #10b981, #059669);
        color: white;
        border: none;
        padding: 14px 24px;
        border-radius: 16px;
        font-size: 16px;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.3s ease;
        box-shadow: 0 4px 16px rgba(16, 185, 129, 0.3);
      }

      .write-review-btn:hover {
        transform: translateY(-2px);
        box-shadow: 0 8px 25px rgba(16, 185, 129, 0.4);
      }

      /* 에러 상태 스타일 */
      .error-state {
        text-align: center;
        padding: 60px 20px;
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 16px;
      }

      .error-icon {
        margin-bottom: 8px;
        opacity: 0.8;
      }

      .error-title {
        font-size: 20px;
        font-weight: 700;
        color: #dc2626;
        margin: 0;
      }

      .error-description {
        font-size: 16px;
        color: #64748b;
        margin: 0 0 24px 0;
        max-width: 400px;
      }

      .retry-btn {
        display: flex;
        align-items: center;
        gap: 8px;
        background: linear-gradient(135deg, #ef4444, #dc2626);
        color: white;
        border: none;
        padding: 14px 24px;
        border-radius: 16px;
        font-size: 16px;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.3s ease;
        box-shadow: 0 4px 16px rgba(239, 68, 68, 0.3);
      }

      .retry-btn:hover {
        transform: translateY(-2px);
        box-shadow: 0 8px 25px rgba(239, 68, 68, 0.4);
      }

      /* 현재 비율 최적화 */
      .modern-review-container {
        max-width: 100%;
        width: 100%;
      }

      .review-header-section {
        align-items: center;
        justify-content: space-between;
      }

      .review-summary {
        align-items: center;
        gap: 12px;
      }

      .reviews-grid {
        gap: 14px;
      }

      .modern-review-card {
        padding: 22px;
        margin: 0;
      }

      .review-card-header {
        gap: 14px;
        align-items: center;
      }

      .user-avatar {
        width: 42px;
        height: 42px;
        font-size: 15px;
      }

      .user-name {
        font-size: 15px;
      }

      .review-text {
        font-size: 14px;
        line-height: 1.5;
      }

      .indicator-content {
        flex-direction: row;
        justify-content: space-between;
        align-items: center;
        padding: 14px 18px;
      }
    </style>
  `;
}
