
// 리뷰 관리자
window.ReviewManager = {
  // 매장 리뷰 미리보기 렌더링 (상위 2개)
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
            <div class="empty-reviews">
              <div class="empty-reviews-icon">💬</div>
              <h4>아직 리뷰가 없어요</h4>
              <p>이 매장의 첫 번째 리뷰를 남겨보세요!</p>
              <button class="write-first-review-btn" onclick="alert('리뷰 작성 기능은 주문 후 이용 가능합니다')">
                첫 리뷰 남기기
              </button>
            </div>
          `;
        } else {
          const reviewsHTML = reviews.slice(0, 2).map(review => {
            // 날짜 포맷팅
            const reviewDate = review.created_at ? 
              new Date(review.created_at).toLocaleDateString('ko-KR', {
                month: 'short',
                day: 'numeric'
              }) : '날짜 정보 없음';

            // 사용자 이름 첫 글자로 아바타 생성
            const userInitial = (review.user_name || '익명').charAt(0);
            const avatarColors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];
            const avatarColor = avatarColors[Math.abs((review.user_name || '익명').length) % avatarColors.length];

            return `
              <div class="review-card modern-review">
                <div class="review-header">
                  <div class="review-user">
                    <div class="user-avatar" style="
                      width: 32px; 
                      height: 32px; 
                      border-radius: 50%; 
                      background: ${avatarColor}; 
                      color: white; 
                      display: flex; 
                      align-items: center; 
                      justify-content: center; 
                      font-weight: 600; 
                      font-size: 14px;
                      margin-right: 8px;
                    ">${userInitial}</div>
                    <div>
                      <div style="font-weight: 600; font-size: 14px; color: #374151;">
                        ${review.user_name || '익명'}
                      </div>
                      <div style="font-size: 12px; color: #9ca3af;">
                        ${reviewDate}
                      </div>
                    </div>
                  </div>
                  <div class="review-meta">
                    <span class="review-score">★ ${review.score}</span>
                  </div>
                </div>
                <div class="review-text">${review.content || '내용 없음'}</div>
              </div>
            `;
          }).join('');

          reviewPreviewContent.innerHTML = reviewsHTML;
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
          <div class="empty-reviews">
            <div class="empty-reviews-icon">⚠️</div>
            <h4>리뷰를 불러올 수 없습니다</h4>
            <p>네트워크 연결을 확인하고 다시 시도해주세요</p>
            <button class="write-first-review-btn" onclick="window.ReviewManager.renderTopReviews(window.currentStore)">
              다시 시도
            </button>
          </div>
        `;
      }
    }
  },

  // 전체 리뷰 조회
  async loadAllReviews(storeId) {
    try {
      console.log(`🔍 매장 ${storeId} 전체 리뷰 조회 중...`);
      
      const response = await fetch(`/api/stores/${storeId}/reviews`);
      if (!response.ok) {
        throw new Error(`리뷰 조회 실패: ${response.status}`);
      }
      
      const data = await response.json();
      console.log(`✅ 매장 ${storeId} 전체 리뷰 ${data.reviews.length}개 조회 완료`);
      
      return {
        success: true,
        reviews: data.reviews || [],
        total: data.total || 0
      };
    } catch (error) {
      console.error('❌ 전체 리뷰 조회 실패:', error);
      return {
        success: false,
        reviews: [],
        total: 0,
        error: error.message
      };
    }
  },

  // 리뷰 통계 계산
  calculateReviewStats(reviews) {
    if (!reviews || reviews.length === 0) {
      return {
        total: 0,
        average: 0.0,
        distribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 }
      };
    }

    const total = reviews.length;
    const sum = reviews.reduce((acc, review) => acc + (review.score || 0), 0);
    const average = (sum / total).toFixed(1);
    
    const distribution = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    reviews.forEach(review => {
      const score = review.score || 0;
      if (score >= 1 && score <= 5) {
        distribution[score]++;
      }
    });

    return {
      total,
      average: parseFloat(average),
      distribution
    };
  },

  // 리뷰 제출
  async submitReview(reviewData) {
    try {
      console.log('📝 리뷰 제출 시작:', reviewData);
      
      const response = await fetch('/api/reviews/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(reviewData)
      });

      const result = await response.json();
      
      if (response.ok && result.success) {
        console.log('✅ 리뷰 제출 성공:', result);
        return {
          success: true,
          review: result.review,
          message: result.message
        };
      } else {
        console.error('❌ 리뷰 제출 실패:', result);
        return {
          success: false,
          error: result.error || '리뷰 제출에 실패했습니다.'
        };
      }
    } catch (error) {
      console.error('❌ 리뷰 제출 오류:', error);
      return {
        success: false,
        error: '네트워크 오류가 발생했습니다.'
      };
    }
  },

  // 리뷰 수정
  async updateReview(reviewId, updateData) {
    try {
      console.log('✏️ 리뷰 수정 시작:', { reviewId, updateData });
      
      const response = await fetch(`/api/reviews/${reviewId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(updateData)
      });

      const result = await response.json();
      
      if (response.ok && result.success) {
        console.log('✅ 리뷰 수정 성공:', result);
        return {
          success: true,
          review: result.review,
          message: result.message
        };
      } else {
        console.error('❌ 리뷰 수정 실패:', result);
        return {
          success: false,
          error: result.error || '리뷰 수정에 실패했습니다.'
        };
      }
    } catch (error) {
      console.error('❌ 리뷰 수정 오류:', error);
      return {
        success: false,
        error: '네트워크 오류가 발생했습니다.'
      };
    }
  },

  // 리뷰 삭제
  async deleteReview(reviewId, userId) {
    try {
      console.log('🗑️ 리뷰 삭제 시작:', { reviewId, userId });
      
      const response = await fetch(`/api/reviews/${reviewId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ userId })
      });

      const result = await response.json();
      
      if (response.ok && result.success) {
        console.log('✅ 리뷰 삭제 성공:', result);
        return {
          success: true,
          message: result.message,
          storeId: result.storeId
        };
      } else {
        console.error('❌ 리뷰 삭제 실패:', result);
        return {
          success: false,
          error: result.error || '리뷰 삭제에 실패했습니다.'
        };
      }
    } catch (error) {
      console.error('❌ 리뷰 삭제 오류:', error);
      return {
        success: false,
        error: '네트워크 오류가 발생했습니다.'
      };
    }
  },

  // 사용자별 리뷰 조회
  async getUserReviews(userId, limit = 10) {
    try {
      console.log(`👤 사용자 ${userId} 리뷰 조회 중...`);
      
      const response = await fetch(`/api/users/${userId}/reviews?limit=${limit}`);
      if (!response.ok) {
        throw new Error(`사용자 리뷰 조회 실패: ${response.status}`);
      }
      
      const data = await response.json();
      console.log(`✅ 사용자 ${userId} 리뷰 ${data.reviews.length}개 조회 완료`);
      
      return {
        success: true,
        reviews: data.reviews || [],
        total: data.total || 0
      };
    } catch (error) {
      console.error('❌ 사용자 리뷰 조회 실패:', error);
      return {
        success: false,
        reviews: [],
        total: 0,
        error: error.message
      };
    }
  },

  // 리뷰 유효성 검사
  validateReview(reviewData) {
    const errors = [];

    if (!reviewData.userId) {
      errors.push('사용자 정보가 필요합니다.');
    }

    if (!reviewData.storeId) {
      errors.push('매장 정보가 필요합니다.');
    }

    if (!reviewData.rating || reviewData.rating < 1 || reviewData.rating > 5) {
      errors.push('별점은 1~5점 사이여야 합니다.');
    }

    if (!reviewData.reviewText || reviewData.reviewText.trim().length < 5) {
      errors.push('리뷰 내용은 5자 이상이어야 합니다.');
    }

    if (reviewData.reviewText && reviewData.reviewText.length > 500) {
      errors.push('리뷰 내용은 500자를 초과할 수 없습니다.');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  },

  // 리뷰 HTML 렌더링 헬퍼
  renderReviewHTML(review, currentUserId = null) {
    const isMyReview = currentUserId && review.userId === currentUserId;
    
    return `
      <div class="review-card" data-review-id="${review.id}">
        <div class="review-header">
          <span class="review-user ${isMyReview ? 'my-user' : ''}">
            ${isMyReview ? '👤 내 리뷰' : `👤 ${review.user || '익명'}`}
          </span>
          <span class="review-score">★ ${review.score}</span>
          <span class="review-date">${review.date || ''}</span>
        </div>
        <div class="review-text">${review.content}</div>
        ${isMyReview ? `
          <div class="my-review-actions">
            <button class="edit-review-btn" data-review-id="${review.id}">
              ✏️ 수정
            </button>
            <button class="delete-review-btn" data-review-id="${review.id}">
              🗑️ 삭제
            </button>
          </div>
        ` : ''}
      </div>
    `;
  },

  // 별점 분포 차트 HTML 생성
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

console.log('✅ ReviewManager 로드 완료');
