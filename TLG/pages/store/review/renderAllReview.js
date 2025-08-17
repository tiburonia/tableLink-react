
async function renderAllReview(store) {
  console.log('🔍 리뷰 전체보기 로딩 중...', store.name);

  const mainEl = document.getElementById('main');
  if (!mainEl) return;

  // 즉시 스켈레톤 UI 표시
  mainEl.innerHTML = `
    <!-- 상단 헤더 (고정) -->
    <div id="allReviewHeader" class="all-review-header">
      <button id="backBtn" class="header-action-btn" aria-label="뒤로가기">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
          <path d="M19 12H5M12 19l-7-7 7-7" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </button>
      
      <div class="header-title-section">
        <h1 class="header-title">${store.name}</h1>
        <p class="header-subtitle">고객 리뷰</p>
      </div>
      
      <button id="TLL" class="header-action-btn" aria-label="QR결제">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
          <rect x="3" y="3" width="8" height="8" rx="2" stroke="currentColor" stroke-width="2"/>
          <rect x="13" y="3" width="8" height="8" rx="2" stroke="currentColor" stroke-width="2"/>
          <rect x="3" y="13" width="8" height="8" rx="2" stroke="currentColor" stroke-width="2"/>
          <rect x="13" y="13" width="8" height="8" rx="2" stroke="currentColor" stroke-width="2"/>
        </svg>
      </button>
    </div>

    <!-- 스크롤 가능한 컨텐츠 영역 -->
    <div id="allReviewScrollArea" class="all-review-scroll-area">
      <div id="allReviewContent" class="all-review-content">
        <!-- 스켈레톤 로딩 -->
        <div class="review-skeleton-container">
          <!-- 헤더 스켈레톤 -->
          <div class="skeleton-header">
            <div class="skeleton-rating-section">
              <div class="skeleton-big-score"></div>
              <div class="skeleton-score-info">
                <div class="skeleton-line" style="width: 100px; height: 16px;"></div>
                <div class="skeleton-line" style="width: 80px; height: 14px;"></div>
              </div>
            </div>
          </div>

          <!-- 리뷰 카드 스켈레톤 -->
          <div class="skeleton-reviews-section">
            ${Array(4).fill(0).map(() => `
              <div class="skeleton-review-card">
                <div class="skeleton-review-header">
                  <div class="skeleton-user-avatar"></div>
                  <div class="skeleton-user-info">
                    <div class="skeleton-line" style="width: 100px; height: 16px;"></div>
                    <div class="skeleton-line" style="width: 70px; height: 14px;"></div>
                  </div>
                  <div class="skeleton-rating">
                    <div class="skeleton-line" style="width: 60px; height: 18px;"></div>
                  </div>
                </div>
                <div class="skeleton-review-content">
                  <div class="skeleton-line" style="width: 100%; height: 16px;"></div>
                  <div class="skeleton-line" style="width: 85%; height: 16px;"></div>
                  <div class="skeleton-line" style="width: 60%; height: 16px;"></div>
                </div>
              </div>
            `).join('')}
          </div>
        </div>
      </div>
    </div>

    <!-- 하단 바텀바 (고정) -->
    <nav id="storeBottomBar" class="store-bottom-bar">
      <button id="telephone" class="bottom-action-btn phone-btn" aria-label="전화">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
          <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" stroke="currentColor" stroke-width="2"/>
        </svg>
      </button>
      <button id="order" class="bottom-action-btn order-btn">
        <span>포장·예약하기</span>
      </button>
    </nav>

    ${getAllReviewStyles()}
  `;

  try {
    // localStorage에서 사용자 정보 가져오기
    const currentUserInfo = window.cacheManager ? window.cacheManager.getUserInfo() : null;
    const currentUserId = currentUserInfo ? currentUserInfo.id : null;

    console.log('👤 현재 사용자 정보:', currentUserId ? `사용자 ${currentUserId}` : '비로그인');

    // 서버에서 리뷰 데이터 가져오기
    console.log('🌐 서버에서 리뷰 데이터 가져오는 중...');
    const response = await fetch(`/api/stores/${store.id}/reviews`);
    if (!response.ok) {
      throw new Error('리뷰 데이터 조회 실패');
    }

    const reviewData = await response.json();
    const reviews = reviewData.reviews || [];

    console.log('📖 가져온 리뷰 데이터:', reviews);

    const total = reviews.length;
    const avgScore = total
      ? (reviews.reduce((sum, r) => sum + r.score, 0) / total).toFixed(1)
      : "0.0";

    // 실제 컨텐츠로 교체
    setTimeout(() => {
      const contentEl = document.getElementById('allReviewContent');
      if (contentEl) {
        if (total === 0) {
          contentEl.innerHTML = `
            <div class="empty-review-state">
              <div class="empty-review-illustration">
                <svg width="120" height="120" viewBox="0 0 24 24" fill="none">
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" stroke="#e2e8f0" stroke-width="2" fill="none"/>
                  <path d="M8 9h8M8 13h6" stroke="#e2e8f0" stroke-width="2" stroke-linecap="round"/>
                </svg>
              </div>
              <h3 class="empty-title">아직 등록된 리뷰가 없어요</h3>
              <p class="empty-description">이 매장의 첫 번째 리뷰를 남겨보세요!</p>
              <button class="write-first-review-btn" onclick="alert('리뷰 작성 기능은 준비 중입니다')">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                  <path d="M12 4v16m8-8H4" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                </svg>
                첫 리뷰 작성하기
              </button>
            </div>
          `;
        } else {
          const starsDisplay = Math.round(parseFloat(avgScore));
          const emptyStars = 5 - starsDisplay;
          
          contentEl.innerHTML = `
            <div class="review-summary-card">
              <div class="summary-content">
                <div class="rating-display">
                  <div class="rating-stars">
                    ${'★'.repeat(starsDisplay)}<span class="empty-stars">${'☆'.repeat(emptyStars)}</span>
                  </div>
                  <div class="rating-info">
                    <span class="rating-score">${avgScore}</span>
                    <span class="rating-total">${total}개의 리뷰</span>
                  </div>
                </div>
                <div class="summary-stats">
                  <div class="stat-item">
                    <span class="stat-number">${reviews.filter(r => r.score === 5).length}</span>
                    <span class="stat-label">5점</span>
                  </div>
                  <div class="stat-item">
                    <span class="stat-number">${reviews.filter(r => r.score === 4).length}</span>
                    <span class="stat-label">4점</span>
                  </div>
                  <div class="stat-item">
                    <span class="stat-number">${reviews.filter(r => r.score === 3).length}</span>
                    <span class="stat-label">3점</span>
                  </div>
                  <div class="stat-item">
                    <span class="stat-number">${reviews.filter(r => r.score <= 2).length}</span>
                    <span class="stat-label">2점↓</span>
                  </div>
                </div>
              </div>
            </div>

            <div class="reviews-section">
              <h3 class="reviews-section-title">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" stroke="currentColor" stroke-width="2" fill="none"/>
                </svg>
                전체 리뷰
              </h3>
              
              <div class="reviews-list">
                ${reviews.map(review => {
                  const reviewDate = new Date(review.created_at || review.date).toLocaleDateString('ko-KR', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric'
                  });
                  
                  const isMyReview = review.userId === currentUserId;
                  
                  return `
                    <div class="modern-review-card ${isMyReview ? 'my-review' : ''}">
                      <div class="review-card-header">
                        <div class="user-info">
                          <div class="user-avatar ${isMyReview ? 'my-avatar' : ''}">
                            ${isMyReview ? '👤' : '👤'}
                          </div>
                          <div class="user-details">
                            <div class="user-name ${isMyReview ? 'my-name' : ''}">
                              ${isMyReview ? '내 리뷰' : `사용자${review.userId}`}
                            </div>
                            <div class="review-date">${reviewDate}</div>
                          </div>
                        </div>
                        <div class="review-rating">
                          <div class="rating-stars">
                            ${'★'.repeat(review.score)}<span class="empty-stars">${'☆'.repeat(5 - review.score)}</span>
                          </div>
                        </div>
                      </div>
                      
                      <div class="review-content-text">
                        ${review.content}
                      </div>
                      
                      ${isMyReview ? `
                        <div class="my-review-actions">
                          <button class="action-btn edit-btn" onclick="editMyReview(${review.id}, '${review.content.replace(/'/g, "\\'")}', ${review.score})">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" stroke="currentColor" stroke-width="2"/>
                              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" stroke="currentColor" stroke-width="2"/>
                            </svg>
                            수정
                          </button>
                          <button class="action-btn delete-btn" onclick="deleteMyReview(${review.id})">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                              <polyline points="3,6 5,6 21,6" stroke="currentColor" stroke-width="2"/>
                              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" stroke="currentColor" stroke-width="2"/>
                            </svg>
                            삭제
                          </button>
                        </div>
                      ` : ''}
                    </div>
                  `;
                }).join('')}
              </div>
            </div>
          `;
        }
      }
    }, 1000); // 1초 후 실제 데이터로 교체

    // 버튼 이벤트 바인딩
    document.getElementById('backBtn').addEventListener('click', () => {
      renderStore(store);
    });

    document.getElementById('TLL').addEventListener('click', () => {
      alert('QR 결제 기능은 아직 준비 중입니다');
    });

    document.getElementById('telephone').addEventListener('click', () => {
      alert('전화 기능은 아직 준비 중입니다');
    });

    document.getElementById('order').addEventListener('click', () => {
      alert('포장·예약하기 기능은 준비 중입니다');
    });

    // 내 리뷰 수정/삭제 함수들을 전역으로 등록
    window.editMyReview = async (reviewId, currentContent, currentScore) => {
      // 수정 모달 생성
      const modal = document.createElement('div');
      modal.className = 'review-edit-modal';
      modal.innerHTML = `
        <div class="modal-backdrop"></div>
        <div class="review-edit-modal-content">
          <div class="modal-header">
            <h3>리뷰 수정</h3>
            <button class="modal-close-btn" type="button">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
              </svg>
            </button>
          </div>

          <div class="modal-content">
            <div class="rating-section">
              <label class="modal-label">평점</label>
              <div class="star-rating">
                <span class="star" data-rating="1">★</span>
                <span class="star" data-rating="2">★</span>
                <span class="star" data-rating="3">★</span>
                <span class="star" data-rating="4">★</span>
                <span class="star" data-rating="5">★</span>
              </div>
            </div>

            <div class="content-section">
              <label class="modal-label">리뷰 내용</label>
              <textarea class="review-edit-textarea" placeholder="리뷰 내용을 입력하세요...">${currentContent}</textarea>
            </div>
          </div>

          <div class="modal-actions">
            <button class="modal-btn cancel-btn" type="button">취소</button>
            <button class="modal-btn submit-btn" type="button">수정 완료</button>
          </div>
        </div>
      `;

      document.body.appendChild(modal);

      let selectedRating = currentScore;

      // 초기 별점 표시
      const updateStarDisplay = (rating) => {
        const stars = modal.querySelectorAll('.star');
        stars.forEach((star, index) => {
          if (index < rating) {
            star.classList.add('active');
          } else {
            star.classList.remove('active');
          }
        });
      };

      updateStarDisplay(selectedRating);

      // 별점 선택 이벤트
      modal.querySelectorAll('.star').forEach(star => {
        star.addEventListener('click', (e) => {
          selectedRating = parseInt(e.target.getAttribute('data-rating'));
          updateStarDisplay(selectedRating);
        });
      });

      // 닫기 버튼들
      const closeModal = () => {
        document.body.removeChild(modal);
      };

      modal.querySelector('.modal-close-btn').addEventListener('click', closeModal);
      modal.querySelector('.cancel-btn').addEventListener('click', closeModal);

      // 수정 완료 버튼
      modal.querySelector('.submit-btn').addEventListener('click', async () => {
        const newContent = modal.querySelector('.review-edit-textarea').value.trim();

        if (newContent === '') {
          alert('리뷰 내용을 입력해주세요.');
          return;
        }

        try {
          console.log('✏️ 리뷰 수정 요청:', { reviewId, newContent, selectedRating });

          const response = await fetch(`/api/reviews/${reviewId}`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              content: newContent,
              score: selectedRating,
              userId: currentUserId
            })
          });

          if (response.ok) {
            console.log('✅ 리뷰 수정 성공');
            alert('리뷰가 수정되었습니다.');
            closeModal();

            // 해당 매장의 별점 캐시도 초기화하여 새로 가져오도록 함
            if (window.cacheManager) {
              localStorage.removeItem(`tablelink_store_rating_${store.id}`);
              console.log(`⭐ 매장 ${store.id} 별점 캐시 초기화`);
            }

            // 리뷰 목록 새로고침
            renderAllReview(store);
          } else {
            const errorData = await response.json();
            console.error('❌ 리뷰 수정 실패:', errorData);
            alert('리뷰 수정에 실패했습니다: ' + (errorData.error || '알 수 없는 오류'));
          }
        } catch (error) {
          console.error('❌ 리뷰 수정 오류:', error);
          alert('리뷰 수정 중 오류가 발생했습니다.');
        }
      });

      // 모달 배경 클릭 시 닫기
      modal.querySelector('.modal-backdrop').addEventListener('click', closeModal);
    };

    window.deleteMyReview = async (reviewId) => {
      if (confirm('정말로 이 리뷰를 삭제하시겠습니까?\n삭제된 리뷰는 복구할 수 없습니다.')) {
        try {
          console.log('🗑️ 리뷰 삭제 요청:', { reviewId, userId: currentUserId });

          const response = await fetch(`/api/reviews/${reviewId}`, {
            method: 'DELETE',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ userId: currentUserId })
          });

          if (response.ok) {
            const responseData = await response.json();
            console.log('✅ 리뷰 삭제 성공:', responseData);
            alert('리뷰가 삭제되었습니다.');

            // 해당 매장의 별점 캐시도 초기화하여 새로 가져오도록 함
            if (window.cacheManager) {
              localStorage.removeItem(`tablelink_store_rating_${store.id}`);
              console.log(`⭐ 매장 ${store.id} 별점 캐시 초기화`);
            }

            // 리뷰 목록 새로고침
            renderAllReview(store);
          } else {
            const errorData = await response.json();
            console.error('❌ 리뷰 삭제 실패:', errorData);
            alert('리뷰 삭제에 실패했습니다: ' + (errorData.error || '알 수 없는 오류'));
          }
        } catch (error) {
          console.error('❌ 리뷰 삭제 오류:', error);
          alert('리뷰 삭제 중 오류가 발생했습니다.');
        }
      }
    };

  } catch (error) {
    console.error('❌ 리뷰 데이터 로딩 실패:', error);

    // 에러 발생 시 에러 UI 표시
    setTimeout(() => {
      const contentEl = document.getElementById('allReviewContent');
      if (contentEl) {
        contentEl.innerHTML = `
          <div class="error-state">
            <div class="error-illustration">
              <svg width="120" height="120" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="10" stroke="#ef4444" stroke-width="2" fill="none"/>
                <path d="M15 9l-6 6M9 9l6 6" stroke="#ef4444" stroke-width="2" stroke-linecap="round"/>
              </svg>
            </div>
            <h3 class="error-title">리뷰를 불러올 수 없습니다</h3>
            <p class="error-description">네트워크 오류가 발생했습니다.<br>잠시 후 다시 시도해주세요.</p>
            <button class="retry-btn" onclick="renderAllReview(${JSON.stringify(store).replace(/"/g, '&quot;')})">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <path d="M1 4v6h6M23 20v-6h-6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                <path d="M20.49 9A9 9 0 0 0 5.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 0 1 3.51 15" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
              다시 시도
            </button>
          </div>
        `;
      }
    }, 1000);
  }
}

// 스타일 함수
function getAllReviewStyles() {
  return `
    <style>
      body, #main {
        overflow: hidden;
        margin: 0;
        padding: 0;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
      }

      /* 헤더 스타일 */
      .all-review-header {
        position: fixed;
        top: 0;
        left: 50%;
        transform: translateX(-50%);
        width: 100%;
        max-width: 430px;
        height: 64px;
        background: rgba(255, 255, 255, 0.95);
        backdrop-filter: blur(20px);
        border-bottom: 1px solid rgba(0, 0, 0, 0.05);
        z-index: 1001;
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 0 16px;
        box-sizing: border-box;
      }

      .header-action-btn {
        width: 40px;
        height: 40px;
        border: none;
        border-radius: 12px;
        background: rgba(41, 126, 252, 0.1);
        color: #297efc;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        transition: all 0.2s ease;
        flex-shrink: 0;
      }

      .header-action-btn:hover {
        background: rgba(41, 126, 252, 0.15);
        transform: scale(1.05);
      }

      .header-action-btn:active {
        transform: scale(0.95);
      }

      .header-title-section {
        flex: 1;
        text-align: center;
        padding: 0 12px;
      }

      .header-title {
        font-size: 18px;
        font-weight: 700;
        color: #1a1a1a;
        margin: 0 0 2px 0;
        line-height: 1.2;
      }

      .header-subtitle {
        font-size: 13px;
        color: #666;
        margin: 0;
        line-height: 1.2;
      }

      /* 스크롤 영역 */
      .all-review-scroll-area {
        position: fixed;
        top: 64px;
        bottom: 72px;
        left: 50%;
        transform: translateX(-50%);
        width: 100%;
        max-width: 430px;
        overflow-y: auto;
        -webkit-overflow-scrolling: touch;
        z-index: 1;
      }

      .all-review-scroll-area::-webkit-scrollbar {
        width: 3px;
      }

      .all-review-scroll-area::-webkit-scrollbar-track {
        background: transparent;
      }

      .all-review-scroll-area::-webkit-scrollbar-thumb {
        background: rgba(0, 0, 0, 0.1);
        border-radius: 3px;
      }

      .all-review-content {
        padding: 20px 16px;
        background: #f8fafc;
        min-height: 100%;
      }

      /* 스켈레톤 스타일 */
      .review-skeleton-container {
        display: flex;
        flex-direction: column;
        gap: 20px;
      }

      .skeleton-header {
        background: white;
        border-radius: 16px;
        padding: 24px;
        box-shadow: 0 2px 20px rgba(0, 0, 0, 0.05);
      }

      .skeleton-rating-section {
        display: flex;
        align-items: center;
        gap: 20px;
      }

      .skeleton-big-score {
        width: 80px;
        height: 80px;
        background: linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 50%, #f1f5f9 100%);
        background-size: 200% 100%;
        border-radius: 50%;
        animation: skeleton-shimmer 2s infinite;
      }

      .skeleton-score-info {
        flex: 1;
        display: flex;
        flex-direction: column;
        gap: 8px;
      }

      .skeleton-reviews-section {
        display: flex;
        flex-direction: column;
        gap: 16px;
      }

      .skeleton-review-card {
        background: white;
        border-radius: 16px;
        padding: 20px;
        box-shadow: 0 2px 20px rgba(0, 0, 0, 0.05);
      }

      .skeleton-review-header {
        display: flex;
        align-items: center;
        gap: 12px;
        margin-bottom: 16px;
      }

      .skeleton-user-avatar {
        width: 44px;
        height: 44px;
        background: linear-gradient(135deg, #e2e8f0 0%, #cbd5e1 50%, #e2e8f0 100%);
        background-size: 200% 100%;
        border-radius: 50%;
        animation: skeleton-shimmer 2s infinite;
        flex-shrink: 0;
      }

      .skeleton-user-info {
        flex: 1;
        display: flex;
        flex-direction: column;
        gap: 6px;
      }

      .skeleton-rating {
        flex-shrink: 0;
      }

      .skeleton-review-content {
        display: flex;
        flex-direction: column;
        gap: 8px;
      }

      .skeleton-line {
        background: linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 50%, #f1f5f9 100%);
        background-size: 200% 100%;
        border-radius: 6px;
        animation: skeleton-shimmer 2s infinite;
      }

      @keyframes skeleton-shimmer {
        0% { background-position: 200% 0; }
        100% { background-position: -200% 0; }
      }

      /* 실제 컨텐츠 스타일 */
      .review-summary-card {
        background: linear-gradient(135deg, #297efc 0%, #4f46e5 100%);
        border-radius: 20px;
        padding: 28px;
        margin-bottom: 24px;
        color: white;
        box-shadow: 0 8px 32px rgba(41, 126, 252, 0.3);
      }

      .summary-content {
        display: flex;
        flex-direction: column;
        gap: 20px;
      }

      .rating-display {
        text-align: center;
      }

      .rating-stars {
        font-size: 28px;
        margin-bottom: 8px;
        display: block;
      }

      .rating-stars .empty-stars {
        opacity: 0.3;
      }

      .rating-info {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 8px;
      }

      .rating-score {
        font-size: 32px;
        font-weight: 800;
        line-height: 1;
      }

      .rating-total {
        font-size: 16px;
        opacity: 0.9;
      }

      .summary-stats {
        display: flex;
        justify-content: space-around;
        padding-top: 20px;
        border-top: 1px solid rgba(255, 255, 255, 0.2);
      }

      .stat-item {
        text-align: center;
      }

      .stat-number {
        display: block;
        font-size: 20px;
        font-weight: 700;
        margin-bottom: 4px;
      }

      .stat-label {
        font-size: 12px;
        opacity: 0.8;
      }

      .reviews-section {
        margin-top: 8px;
      }

      .reviews-section-title {
        display: flex;
        align-items: center;
        gap: 8px;
        font-size: 18px;
        font-weight: 700;
        color: #1a1a1a;
        margin: 0 0 16px 0;
      }

      .reviews-list {
        display: flex;
        flex-direction: column;
        gap: 16px;
      }

      .modern-review-card {
        background: white;
        border-radius: 16px;
        padding: 20px;
        box-shadow: 0 2px 20px rgba(0, 0, 0, 0.05);
        border: 1px solid #f1f5f9;
        transition: all 0.3s ease;
      }

      .modern-review-card:hover {
        box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
        transform: translateY(-2px);
      }

      .modern-review-card.my-review {
        background: linear-gradient(135deg, #fef7ff 0%, #f3e8ff 100%);
        border: 2px solid #a855f7;
        box-shadow: 0 4px 24px rgba(168, 85, 247, 0.15);
      }

      .review-card-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-bottom: 16px;
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
        background: linear-gradient(135deg, #e2e8f0 0%, #cbd5e1 100%);
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 18px;
        flex-shrink: 0;
      }

      .user-avatar.my-avatar {
        background: linear-gradient(135deg, #a855f7 0%, #8b5cf6 100%);
        color: white;
      }

      .user-details {
        flex: 1;
      }

      .user-name {
        font-size: 16px;
        font-weight: 600;
        color: #374151;
        margin-bottom: 2px;
      }

      .user-name.my-name {
        color: #7c3aed;
        font-weight: 700;
      }

      .review-date {
        font-size: 13px;
        color: #9ca3af;
      }

      .review-rating {
        flex-shrink: 0;
      }

      .review-rating .rating-stars {
        font-size: 16px;
        color: #fbbf24;
      }

      .review-rating .empty-stars {
        opacity: 0.3;
      }

      .review-content-text {
        font-size: 16px;
        line-height: 1.6;
        color: #374151;
        margin-bottom: 16px;
        word-break: break-word;
      }

      .my-review-actions {
        display: flex;
        gap: 8px;
        padding-top: 16px;
        border-top: 1px solid rgba(168, 85, 247, 0.2);
      }

      .action-btn {
        display: flex;
        align-items: center;
        gap: 6px;
        padding: 8px 12px;
        font-size: 13px;
        font-weight: 600;
        border: none;
        border-radius: 8px;
        cursor: pointer;
        transition: all 0.2s ease;
      }

      .edit-btn {
        background: rgba(245, 158, 11, 0.1);
        color: #d97706;
      }

      .edit-btn:hover {
        background: rgba(245, 158, 11, 0.2);
      }

      .delete-btn {
        background: rgba(239, 68, 68, 0.1);
        color: #dc2626;
      }

      .delete-btn:hover {
        background: rgba(239, 68, 68, 0.2);
      }

      /* 빈 상태 */
      .empty-review-state {
        text-align: center;
        padding: 60px 20px;
        background: white;
        border-radius: 20px;
        box-shadow: 0 4px 24px rgba(0, 0, 0, 0.05);
      }

      .empty-review-illustration {
        margin-bottom: 24px;
        opacity: 0.6;
      }

      .empty-title {
        font-size: 20px;
        font-weight: 700;
        color: #374151;
        margin: 0 0 8px 0;
      }

      .empty-description {
        font-size: 16px;
        color: #6b7280;
        margin: 0 0 24px 0;
        line-height: 1.5;
      }

      .write-first-review-btn {
        display: inline-flex;
        align-items: center;
        gap: 8px;
        padding: 12px 24px;
        background: linear-gradient(135deg, #297efc 0%, #4f46e5 100%);
        color: white;
        border: none;
        border-radius: 12px;
        font-size: 16px;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.2s ease;
        box-shadow: 0 4px 16px rgba(41, 126, 252, 0.3);
      }

      .write-first-review-btn:hover {
        transform: translateY(-2px);
        box-shadow: 0 8px 24px rgba(41, 126, 252, 0.4);
      }

      /* 에러 상태 */
      .error-state {
        text-align: center;
        padding: 60px 20px;
        background: white;
        border-radius: 20px;
        box-shadow: 0 4px 24px rgba(0, 0, 0, 0.05);
      }

      .error-illustration {
        margin-bottom: 24px;
        opacity: 0.6;
      }

      .error-title {
        font-size: 20px;
        font-weight: 700;
        color: #dc2626;
        margin: 0 0 8px 0;
      }

      .error-description {
        font-size: 16px;
        color: #6b7280;
        margin: 0 0 24px 0;
        line-height: 1.5;
      }

      .retry-btn {
        display: inline-flex;
        align-items: center;
        gap: 8px;
        padding: 12px 24px;
        background: #dc2626;
        color: white;
        border: none;
        border-radius: 12px;
        font-size: 16px;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.2s ease;
      }

      .retry-btn:hover {
        background: #b91c1c;
        transform: translateY(-1px);
      }

      /* 바텀바 */
      .store-bottom-bar {
        position: fixed;
        bottom: 0;
        left: 50%;
        transform: translateX(-50%);
        width: 100%;
        max-width: 430px;
        height: 72px;
        background: rgba(255, 255, 255, 0.95);
        backdrop-filter: blur(20px);
        border-top: 1px solid rgba(0, 0, 0, 0.05);
        display: flex;
        justify-content: space-between;
        align-items: center;
        z-index: 1000;
        padding: 0 16px;
        box-sizing: border-box;
      }

      .bottom-action-btn {
        border: none;
        outline: none;
        font-family: inherit;
        transition: all 0.2s ease;
        cursor: pointer;
        height: 48px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 16px;
        font-weight: 600;
        border-radius: 12px;
      }

      .phone-btn {
        width: 48px;
        min-width: 48px;
        background: rgba(41, 126, 252, 0.1);
        color: #297efc;
        margin-right: 12px;
      }

      .phone-btn:hover {
        background: rgba(41, 126, 252, 0.15);
        transform: scale(1.05);
      }

      .phone-btn:active {
        transform: scale(0.95);
      }

      .order-btn {
        flex: 1;
        background: linear-gradient(135deg, #297efc 0%, #4f46e5 100%);
        color: white;
        letter-spacing: 0.3px;
        box-shadow: 0 4px 16px rgba(41, 126, 252, 0.3);
      }

      .order-btn:hover {
        transform: translateY(-1px);
        box-shadow: 0 6px 20px rgba(41, 126, 252, 0.4);
      }

      .order-btn:active {
        transform: translateY(0);
      }

      /* 모달 스타일 */
      .review-edit-modal {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        z-index: 2000;
        display: flex;
        justify-content: center;
        align-items: center;
        padding: 20px;
        box-sizing: border-box;
      }

      .modal-backdrop {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.5);
        backdrop-filter: blur(4px);
      }

      .review-edit-modal-content {
        position: relative;
        background: white;
        border-radius: 20px;
        width: 100%;
        max-width: 400px;
        max-height: 80vh;
        overflow: hidden;
        box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
        display: flex;
        flex-direction: column;
      }

      .modal-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 20px 24px;
        border-bottom: 1px solid #f1f5f9;
      }

      .modal-header h3 {
        font-size: 18px;
        font-weight: 700;
        color: #1a1a1a;
        margin: 0;
      }

      .modal-close-btn {
        width: 32px;
        height: 32px;
        border: none;
        background: #f1f5f9;
        border-radius: 8px;
        color: #6b7280;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        transition: all 0.2s ease;
      }

      .modal-close-btn:hover {
        background: #e2e8f0;
        color: #374151;
      }

      .modal-content {
        padding: 24px;
        flex: 1;
        overflow-y: auto;
      }

      .rating-section,
      .content-section {
        margin-bottom: 24px;
      }

      .modal-label {
        display: block;
        font-size: 14px;
        font-weight: 600;
        color: #374151;
        margin-bottom: 8px;
      }

      .star-rating {
        display: flex;
        gap: 4px;
      }

      .star {
        font-size: 24px;
        cursor: pointer;
        color: #d1d5db;
        transition: color 0.2s ease;
      }

      .star.active {
        color: #fbbf24;
      }

      .star:hover {
        color: #f59e0b;
      }

      .review-edit-textarea {
        width: 100%;
        height: 120px;
        border: 2px solid #e5e7eb;
        border-radius: 12px;
        padding: 12px;
        font-size: 16px;
        font-family: inherit;
        resize: vertical;
        transition: border-color 0.2s ease;
        box-sizing: border-box;
      }

      .review-edit-textarea:focus {
        outline: none;
        border-color: #297efc;
        box-shadow: 0 0 0 3px rgba(41, 126, 252, 0.1);
      }

      .modal-actions {
        display: flex;
        gap: 12px;
        padding: 20px 24px;
        border-top: 1px solid #f1f5f9;
      }

      .modal-btn {
        flex: 1;
        padding: 12px 20px;
        border: none;
        border-radius: 12px;
        font-size: 16px;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.2s ease;
      }

      .cancel-btn {
        background: #f1f5f9;
        color: #6b7280;
      }

      .cancel-btn:hover {
        background: #e2e8f0;
        color: #374151;
      }

      .submit-btn {
        background: linear-gradient(135deg, #297efc 0%, #4f46e5 100%);
        color: white;
        box-shadow: 0 4px 16px rgba(41, 126, 252, 0.3);
      }

      .submit-btn:hover {
        transform: translateY(-1px);
        box-shadow: 0 6px 20px rgba(41, 126, 252, 0.4);
      }

      /* 반응형 */
      @media (max-width: 480px) {
        .all-review-content {
          padding: 16px 12px;
        }

        .review-summary-card {
          padding: 20px;
          margin-bottom: 20px;
        }

        .rating-score {
          font-size: 28px;
        }

        .modern-review-card {
          padding: 16px;
        }

        .modal-content {
          padding: 20px;
        }

        .modal-actions {
          padding: 16px 20px;
        }
      }
    </style>
  `;
}
