
/**
 * 리뷰 작성 뷰 - UI 렌더링
 */

export const reviewWriteView = {
  /**
   * 리뷰 작성 HTML 렌더링
   */
  renderHTML(orderInfo) {
    const main = document.getElementById('main');
    
    main.innerHTML = `
      <div class="review-write-container">
        <div class="review-write-header">
          <button id="reviewBackBtn" class="header-back-btn" data-action="go-back-from-review">
            <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor">
              <path d="M19 12H5m7-7l-7 7 7 7"/>
            </svg>
          </button>
          <div class="header-info">
            <h1>📝 리뷰 작성</h1>
            <p class="header-subtitle">주문에 대한 솔직한 후기를 남겨주세요</p>
          </div>
        </div>

        <div class="review-write-content">
          <!-- 주문 정보 카드 -->
          <div class="order-info-card">
            <div class="order-info-header">
              <h3>📋 주문 정보</h3>
              <span class="order-date">${orderInfo.orderDate}</span>
            </div>
            <div class="order-details">
              <div class="store-name">${orderInfo.storeName}</div>
              <div class="order-items">${orderInfo.items}</div>
              <div class="order-amount">${orderInfo.totalAmount}</div>
            </div>
          </div>

          <!-- 리뷰 작성 폼 -->
          <div class="review-form-card">
            <!-- 별점 선택 -->
            <div class="rating-section">
              <h3 class="form-label">⭐ 별점을 선택해주세요</h3>
              <div id="starRating" class="star-rating-large">
                ${[1, 2, 3, 4, 5].map(i => `<span class="star-large" data-rating="${i}">☆</span>`).join('')}
              </div>
              <div id="ratingText" class="rating-text">별점을 선택해주세요</div>
            </div>

            <!-- 리뷰 내용 -->
            <div class="content-section">
              <h3 class="form-label">✍️ 리뷰 내용</h3>
              <textarea 
                id="reviewTextarea" 
                class="review-textarea-large" 
                placeholder="음식은 어떠셨나요? 서비스는 만족스러우셨나요?&#10;&#10;최소 10자 이상 작성해주세요."
                maxlength="500"
              ></textarea>
              <div class="char-count"><span id="charCount">0</span> / 500자</div>
            </div>

            <!-- 리뷰 작성 팁 -->
            <div class="review-tips">
              <h4>💡 좋은 리뷰 작성 팁</h4>
              <ul>
                <li>음식의 맛과 품질에 대한 구체적인 설명</li>
                <li>서비스와 직원의 친절도</li>
                <li>매장의 분위기와 청결도</li>
                <li>가격 대비 만족도</li>
              </ul>
            </div>
          </div>

          <!-- 제출 버튼 -->
          <div class="submit-section">
            <button id="submitReviewBtn" class="submit-review-btn" disabled>
              <span class="btn-icon">📝</span>
              리뷰 등록하기
            </button>
          </div>
        </div>
      </div>
    `;
  },

  /**
   * 성공 메시지 표시
   */
  showSuccessMessage() {
    const successDiv = document.createElement('div');
    successDiv.className = 'success-message';
    successDiv.innerHTML = `
      <div class="success-content">
        <div class="success-icon">✅</div>
        <h3>리뷰가 등록되었습니다!</h3>
        <p>소중한 후기 감사합니다.</p>
      </div>
    `;
    
    document.body.appendChild(successDiv);
    
    setTimeout(() => {
      if (document.body.contains(successDiv)) {
        document.body.removeChild(successDiv);
      }
    }, 3000);
  },

  /**
   * 에러 메시지 표시
   */
  showError(message) {
    const main = document.getElementById('main');
    if (main) {
      main.innerHTML = `
        <div class="review-write-container">
          <div class="review-write-header">
            <button id="reviewBackBtn" class="header-back-btn" data-action="go-back-from-review">
              <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor">
                <path d="M19 12H5m7-7l-7 7 7 7"/>
              </svg>
            </button>
            <div class="header-info">
              <h1>📝 리뷰 작성</h1>
            </div>
          </div>

          <div class="review-write-content">
            <div class="error-state">
              <div class="error-icon">⚠️</div>
              <h3>리뷰 작성을 불러올 수 없어요</h3>
              <p>${message || '잠시 후 다시 시도해주세요'}</p>
              <button class="primary-btn" data-action="go-back-from-review">
                <span class="btn-icon">🔙</span>
                돌아가기
              </button>
            </div>
          </div>
        </div>
      `;
    }
  }
};

// 전역 등록 (호환성)
window.reviewWriteView = reviewWriteView;

console.log('✅ reviewWriteView 모듈 로드 완료');
