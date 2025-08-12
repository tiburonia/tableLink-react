async function renderReviewHTML(store) {
  console.log(`🔍 매장 ${store.id} 리뷰 미리보기 렌더링 시작`);

  // 즉시 로딩 UI 표시
  const loadingHTML = `
    <div class="review-loading-container">
      <div class="loading-skeleton">
        <div class="skeleton-header">
          <div class="skeleton-line" style="width: 150px; height: 16px;"></div>
          <div class="skeleton-line" style="width: 80px; height: 14px;"></div>
        </div>
        <div class="skeleton-content">
          <div class="skeleton-line" style="width: 100%; height: 12px;"></div>
          <div class="skeleton-line" style="width: 90%; height: 12px;"></div>
          <div class="skeleton-line" style="width: 80%; height: 12px;"></div>
        </div>
      </div>
      <div class="loading-skeleton">
        <div class="skeleton-header">
          <div class="skeleton-line" style="width: 140px; height: 16px;"></div>
          <div class="skeleton-line" style="width: 75px; height: 14px;"></div>
        </div>
        <div class="skeleton-content">
          <div class="skeleton-line" style="width: 95%; height: 12px;"></div>
          <div class="skeleton-line" style="width: 85%; height: 12px;"></div>
        </div>
      </div>
      <style>
        .review-loading-container {
          padding: 16px;
        }
        .loading-skeleton {
          background: #f8fafc;
          border-radius: 12px;
          padding: 16px;
          margin-bottom: 12px;
          border: 1px solid #e2e8f0;
        }
        .skeleton-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 12px;
        }
        .skeleton-content {
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
        
        let reviewHTML = '<div class="review-list-container">';
        
        reviews.forEach(review => {
          const reviewDate = new Date(review.created_at).toLocaleDateString('ko-KR', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          });

          reviewHTML += `
            <div class="review-card modern-review">
              <div class="review-header">
                <span class="review-user">👤 ${review.user_name || '익명'}</span>
                <div class="review-meta">
                  <span class="review-score">★ ${review.score}</span>
                  <span class="review-date">${reviewDate}</span>
                </div>
              </div>
              <div class="review-text">${review.content || '내용 없음'}</div>
            </div>
          `;
        });
        
        reviewHTML += '</div>';
        storeContent.innerHTML = reviewHTML;
        console.log('✅ 리뷰 HTML 업데이트 완료');
      } else {
        storeContent.innerHTML = `
          <div class="no-review-message">
            <div class="no-review-icon">💬</div>
            <div class="no-review-text">아직 리뷰가 없습니다</div>
            <div class="no-review-sub">첫 번째 리뷰를 남겨보세요!</div>
          </div>
          <style>
            .no-review-message {
              text-align: center;
              padding: 40px 20px;
              color: #6b7280;
            }
            .no-review-icon {
              font-size: 48px;
              margin-bottom: 16px;
            }
            .no-review-text {
              font-size: 18px;
              font-weight: 600;
              margin-bottom: 8px;
              color: #374151;
            }
            .no-review-sub {
              font-size: 14px;
              color: #9ca3af;
            }
          </style>
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
        <div class="error-message">
          <div class="error-icon">⚠️</div>
          <div class="error-text">리뷰를 불러올 수 없습니다</div>
          <div class="error-sub">${error.message}</div>
        </div>
        <style>
          .error-message {
            text-align: center;
            padding: 40px 20px;
            color: #ef4444;
          }
          .error-icon {
            font-size: 48px;
            margin-bottom: 16px;
          }
          .error-text {
            font-size: 18px;
            font-weight: 600;
            margin-bottom: 8px;
          }
          .error-sub {
            font-size: 14px;
            color: #9ca3af;
          }
        </style>
      `;
    }
  }

    // 총 리뷰 수와 평균 평점 계산
    const total = reviews.length;
    const avgScore = total > 0
      ? (reviews.reduce((sum, r) => sum + (r.score || r.rating || 0), 0) / total).toFixed(1)
      : "0.0";

    // 리뷰 없을 때 안내
    if (total === 0) {
      return `
        <div class="review-preview">
          <div class="review-title-row">
            <span class="review-title">리뷰 미리보기</span>
          </div>
          <div class="review-empty-state">
            <div class="empty-icon">📝</div>
            <div class="empty-title">등록된 리뷰가 없습니다</div>
            <div class="empty-subtitle">첫 리뷰를 남겨주세요!</div>
          </div>
          <button class="see-more-btn full-width" onclick="renderAllReview(window.currentStore)">
            전체 리뷰 보기
          </button>
        </div>
        ${getReviewStyles()}
      `;
    }

    // 리뷰가 있을 때
    return `
      <div class="review-preview">
        <div class="review-header">
          <div class="review-title-section">
            <span class="review-title">리뷰 미리보기</span>
            <div class="review-stats">
              <span class="review-rating">★ ${avgScore}</span>
              <span class="review-count">(${total}개 리뷰)</span>
            </div>
          </div>
          <button class="see-more-btn" onclick="renderAllReview(window.currentStore)">
            전체보기 →
          </button>
        </div>

        <div class="review-preview-list">
          ${reviews.slice(0, 3).map((review, index) => {
            console.log(`🔍 리뷰 ${index + 1} 처리 중:`, review);

            const rating = review.score || review.rating || 5;
            const content = review.content || review.review_text || '좋은 매장입니다!';
            const userName = review.user || review.user_name || '익명 사용자';
            const reviewDate = review.date || (review.created_at ? new Date(review.created_at).toLocaleDateString('ko-KR') : formatDate(new Date()));

            console.log(`📝 리뷰 ${index + 1} 처리된 데이터:`, {
              rating,
              content,
              userName,
              reviewDate
            });

            return `
            <div class="review-card">
              <div class="review-card-header">
                <div class="reviewer-info">
                  <span class="reviewer-name">${userName}</span>
                  <span class="review-date">${reviewDate}</span>
                </div>
                <div class="review-rating-badge">
                  <span class="rating-stars">${'★'.repeat(Math.max(1, Math.min(5, rating)))}</span>
                  <span class="rating-number">${rating}</span>
                </div>
              </div>
              <div class="review-content">
                ${content.length > 100 ? content.substring(0, 100) + '...' : content}
              </div>
            </div>
            `;
          }).join('')}
        </div>

        ${total > 3 ? `
          <div class="review-more-indicator">
            <span>+${total - 3}개의 리뷰가 더 있습니다</span>
          </div>
        ` : ''}
      </div>
      ${getReviewStyles()}
    `;

  } catch (error) {
    console.error('❌ 리뷰 미리보기 렌더링 실패:', error);
    console.error('❌ 에러 상세:', error.message);
    console.error('❌ 에러 스택:', error.stack);

    // 에러 발생 시 기본 UI 반환
    return `
      <div class="review-preview">
        <div class="review-title-row">
          <span class="review-title">리뷰 미리보기</span>
        </div>
        <div class="review-error-state">
          <div class="error-icon">⚠️</div>
          <div class="error-message">리뷰를 불러올 수 없습니다</div>
          <button class="retry-btn" onclick="location.reload()">다시 시도</button>
        </div>
      </div>
      ${getReviewStyles()}
    `;
  }
}

// 날짜 포맷팅 함수
function formatDate(date) {
  return new Intl.DateTimeFormat('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  }).format(date);
}

// 스타일 함수 분리
function getReviewStyles() {
  return `
    <style>
      .review-preview {
        background: #fff;
        border-radius: 16px;
        box-shadow: 0 4px 20px rgba(0,0,0,0.06);
        padding: 20px;
        margin-bottom: 16px;
        border: 1px solid #f0f0f0;
        transition: all 0.3s ease;
      }

      .review-preview:hover {
        box-shadow: 0 6px 30px rgba(0,0,0,0.1);
      }

      .review-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 16px;
        padding-bottom: 12px;
        border-bottom: 1px solid #f5f5f5;
      }

      .review-title-section {
        display: flex;
        flex-direction: column;
        gap: 4px;
      }

      .review-title {
        font-size: 18px;
        font-weight: 700;
        color: #1a1a1a;
      }

      .review-stats {
        display: flex;
        align-items: center;
        gap: 8px;
      }

      .review-rating {
        color: #ff6b35;
        font-weight: 600;
        font-size: 16px;
      }

      .review-count {
        color: #666;
        font-size: 14px;
      }

      .see-more-btn {
        background: linear-gradient(135deg, #297efc, #4f46e5);
        color: white;
        border: none;
        padding: 8px 16px;
        border-radius: 20px;
        font-size: 13px;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.3s ease;
        box-shadow: 0 2px 8px rgba(41, 126, 252, 0.3);
      }

      .see-more-btn:hover {
        transform: translateY(-2px);
        box-shadow: 0 4px 15px rgba(41, 126, 252, 0.4);
      }

      .see-more-btn.full-width {
        width: 100%;
        margin-top: 16px;
        padding: 12px;
        font-size: 14px;
      }

      .review-preview-list {
        display: flex;
        flex-direction: column;
        gap: 12px;
      }

      .review-card {
        background: #fafbfc;
        border-radius: 12px;
        padding: 16px;
        border: 1px solid #e8eaed;
        transition: all 0.2s ease;
      }

      .review-card:hover {
        background: #f5f7fa;
        border-color: #297efc;
      }

      .review-card-header {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        margin-bottom: 10px;
      }

      .reviewer-info {
        display: flex;
        flex-direction: column;
        gap: 2px;
      }

      .reviewer-name {
        font-weight: 600;
        color: #1a1a1a;
        font-size: 14px;
      }

      .review-date {
        color: #888;
        font-size: 12px;
      }

      .review-rating-badge {
        display: flex;
        align-items: center;
        gap: 4px;
        background: #fff;
        padding: 4px 8px;
        border-radius: 20px;
        border: 1px solid #e0e0e0;
      }

      .rating-stars {
        color: #ff6b35;
        font-size: 12px;
      }

      .rating-number {
        color: #666;
        font-size: 12px;
        font-weight: 600;
      }

      .review-content {
        color: #333;
        font-size: 14px;
        line-height: 1.5;
        margin-top: 8px;
      }

      .review-more-indicator {
        text-align: center;
        padding: 12px;
        background: #f8f9fa;
        border-radius: 8px;
        margin-top: 12px;
        color: #666;
        font-size: 13px;
        font-weight: 500;
      }

      /* 빈 상태 스타일 */
      .review-empty-state {
        text-align: center;
        padding: 40px 20px;
        color: #666;
      }

      .empty-icon {
        font-size: 48px;
        margin-bottom: 16px;
        opacity: 0.5;
      }

      .empty-title {
        font-size: 16px;
        font-weight: 600;
        margin-bottom: 8px;
        color: #333;
      }

      .empty-subtitle {
        font-size: 14px;
        color: #888;
      }

      /* 에러 상태 스타일 */
      .review-error-state {
        text-align: center;
        padding: 40px 20px;
      }

      .error-icon {
        font-size: 48px;
        margin-bottom: 16px;
      }

      .error-message {
        font-size: 16px;
        color: #e74c3c;
        margin-bottom: 16px;
        font-weight: 600;
      }

      .retry-btn {
        background: #e74c3c;
        color: white;
        border: none;
        padding: 10px 20px;
        border-radius: 8px;
        cursor: pointer;
        font-weight: 600;
        transition: background 0.3s ease;
      }

      .retry-btn:hover {
        background: #c0392b;
      }

      /* 반응형 디자인 */
      @media (max-width: 768px) {
        .review-header {
          flex-direction: column;
          align-items: flex-start;
          gap: 12px;
        }

        .see-more-btn {
          align-self: flex-end;
        }

        .review-card-header {
          flex-direction: column;
          gap: 8px;
        }

        .review-rating-badge {
          align-self: flex-start;
        }
      }
    </style>
  `;
}