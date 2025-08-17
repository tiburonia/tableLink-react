
// 리뷰 작성 화면을 전체 화면으로 렌더링하는 함수
async function renderReviewWrite(order) {
  try {
    console.log('📝 리뷰 작성 화면 렌더링:', order);

    const orderData = order.order_data || {};
    const items = orderData.items ? 
      orderData.items.map(i => `${i.name}(${i.qty}개)`).join(', ') : 
      '메뉴 정보 없음';
    const storeName = orderData.store || order.store_name || '매장 정보 없음';

    const main = document.getElementById('main');
    main.innerHTML = `
      <div class="review-write-container">
        <div class="review-write-header">
          <button id="reviewBackBtn" class="header-back-btn" onclick="goBackFromReview()">
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
              <span class="order-date">${new Date(order.order_date).toLocaleDateString()}</span>
            </div>
            <div class="order-details">
              <div class="store-name">${storeName}</div>
              <div class="order-items">${items}</div>
              <div class="order-amount">결제금액: ${(order.final_amount || order.total_amount || 0).toLocaleString()}원</div>
            </div>
          </div>

          <!-- 리뷰 작성 폼 -->
          <div class="review-form-card">
            <div class="rating-section">
              <h3 class="form-label">⭐ 평점을 선택해주세요</h3>
              <div class="star-rating-large" id="starRating">
                <span class="star-large" data-rating="1">★</span>
                <span class="star-large" data-rating="2">★</span>
                <span class="star-large" data-rating="3">★</span>
                <span class="star-large" data-rating="4">★</span>
                <span class="star-large" data-rating="5">★</span>
              </div>
              <div class="rating-text" id="ratingText">평점을 선택해주세요</div>
            </div>

            <div class="content-section">
              <h3 class="form-label">✍️ 리뷰 내용</h3>
              <textarea 
                id="reviewTextarea" 
                class="review-textarea-large" 
                placeholder="음식의 맛, 서비스, 분위기 등에 대한 솔직한 후기를 작성해주세요.&#10;&#10;다른 고객들에게 도움이 되는 구체적인 리뷰를 남겨주시면 감사하겠습니다!"
                maxlength="500"
              ></textarea>
              <div class="char-count">
                <span id="charCount">0</span>/500자
              </div>
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

      ${getReviewWriteStyles()}
    `;

    // 이벤트 리스너 설정
    setupReviewWriteEvents(order);

  } catch (error) {
    console.error('❌ 리뷰 작성 화면 렌더링 실패:', error);
    showReviewWriteError();
  }
}

// 리뷰 작성 이벤트 설정
function setupReviewWriteEvents(order) {
  let selectedRating = 0;

  // 별점 이벤트
  const stars = document.querySelectorAll('.star-large');
  const ratingText = document.getElementById('ratingText');
  const submitBtn = document.getElementById('submitReviewBtn');
  const textarea = document.getElementById('reviewTextarea');
  const charCount = document.getElementById('charCount');

  const ratingTexts = {
    1: '⭐ 별로예요',
    2: '⭐⭐ 그저 그래요',
    3: '⭐⭐⭐ 보통이에요',
    4: '⭐⭐⭐⭐ 좋아요',
    5: '⭐⭐⭐⭐⭐ 최고예요!'
  };

  stars.forEach(star => {
    star.addEventListener('click', (e) => {
      selectedRating = parseInt(e.target.getAttribute('data-rating'));
      updateStarDisplay(selectedRating);
      ratingText.textContent = ratingTexts[selectedRating];
      ratingText.className = 'rating-text selected';
      checkFormValidity();
    });

    star.addEventListener('mouseenter', (e) => {
      const hoverRating = parseInt(e.target.getAttribute('data-rating'));
      updateStarDisplay(hoverRating, true);
    });
  });

  document.getElementById('starRating').addEventListener('mouseleave', () => {
    updateStarDisplay(selectedRating);
  });

  // 텍스트 입력 이벤트
  textarea.addEventListener('input', (e) => {
    const length = e.target.value.length;
    charCount.textContent = length;
    
    if (length > 450) {
      charCount.style.color = '#ef4444';
    } else if (length > 350) {
      charCount.style.color = '#f59e0b';
    } else {
      charCount.style.color = '#6b7280';
    }
    
    checkFormValidity();
  });

  // 제출 버튼 이벤트
  submitBtn.addEventListener('click', async () => {
    if (selectedRating === 0) {
      alert('평점을 선택해주세요.');
      return;
    }

    const reviewText = textarea.value.trim();
    if (reviewText === '') {
      alert('리뷰 내용을 입력해주세요.');
      return;
    }

    if (reviewText.length < 10) {
      alert('리뷰는 최소 10자 이상 입력해주세요.');
      return;
    }

    try {
      submitBtn.disabled = true;
      submitBtn.innerHTML = '<span class="btn-icon">⏳</span> 등록 중...';
      
      await submitReviewFromOrders(order, selectedRating, reviewText);
      
      // 성공 메시지 표시 후 이전 화면으로
      showSuccessMessage();
      setTimeout(() => {
        goBackFromReview();
      }, 2000);

    } catch (error) {
      console.error('리뷰 등록 오류:', error);
      alert('리뷰 등록에 실패했습니다: ' + error.message);
      submitBtn.disabled = false;
      submitBtn.innerHTML = '<span class="btn-icon">📝</span> 리뷰 등록하기';
    }
  });

  function updateStarDisplay(rating, isHover = false) {
    stars.forEach((star, index) => {
      if (index < rating) {
        star.classList.add('active');
        if (isHover) star.classList.add('hover');
      } else {
        star.classList.remove('active', 'hover');
      }
    });
  }

  function checkFormValidity() {
    const hasRating = selectedRating > 0;
    const hasContent = textarea.value.trim().length >= 10;
    
    submitBtn.disabled = !(hasRating && hasContent);
    
    if (hasRating && hasContent) {
      submitBtn.classList.add('ready');
    } else {
      submitBtn.classList.remove('ready');
    }
  }
}

// 뒤로가기 함수
function goBackFromReview() {
  // 이전 화면 복원 로직
  if (window.previousScreen === 'renderAllOrderHTML') {
    if (typeof renderAllOrderHTML === 'function') {
      renderAllOrderHTML(window.userInfo || { id: 'user1' });
    } else {
      renderMyPage();
    }
  } else {
    renderMyPage();
  }
}

// 성공 메시지 표시
function showSuccessMessage() {
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
}

// 에러 상태 표시
function showReviewWriteError() {
  const main = document.getElementById('main');
  if (main) {
    main.innerHTML = `
      <div class="review-write-container">
        <div class="review-write-header">
          <button id="reviewBackBtn" class="header-back-btn" onclick="goBackFromReview()">
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
            <p>잠시 후 다시 시도해주세요</p>
            <button class="primary-btn" onclick="goBackFromReview()">
              <span class="btn-icon">🔙</span>
              돌아가기
            </button>
          </div>
        </div>
      </div>

      ${getReviewWriteStyles()}
    `;
  }
}

// 리뷰 서버 전송 (기존 함수 재사용)
async function submitReviewFromOrders(order, rating, reviewText) {
  const orderData = order.order_data || {};
  const storeName = orderData.store || order.store_name || '매장 정보 없음';

  const reviewData = {
    userId: window.userInfo?.id || 'user1',
    storeId: order.store_id,
    storeName: storeName,
    orderId: order.id,
    rating: rating,
    reviewText: reviewText,
    orderDate: new Date(order.order_date).toISOString().slice(0, 10)
  };

  const response = await fetch('/api/reviews/submit-from-orders', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(reviewData)
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || '리뷰 등록 실패');
  }

  return response.json();
}

// 스타일 정의
function getReviewWriteStyles() {
  return `
    <style>
      .review-write-container {
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

      .review-write-header {
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

      .review-write-content {
        flex: 1;
        overflow-y: auto;
        padding: 20px;
        display: flex;
        flex-direction: column;
        gap: 20px;
      }

      .order-info-card,
      .review-form-card {
        background: white;
        border-radius: 16px;
        padding: 20px;
        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.04);
        border: 1px solid rgba(226, 232, 240, 0.8);
      }

      .order-info-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 16px;
        padding-bottom: 12px;
        border-bottom: 2px solid #f1f5f9;
      }

      .order-info-header h3 {
        margin: 0;
        font-size: 16px;
        font-weight: 700;
        color: #1e293b;
      }

      .order-date {
        font-size: 12px;
        color: #64748b;
        font-weight: 500;
      }

      .order-details {
        display: flex;
        flex-direction: column;
        gap: 8px;
      }

      .store-name {
        font-size: 18px;
        font-weight: 700;
        color: #1e293b;
      }

      .order-items {
        font-size: 14px;
        color: #475569;
        line-height: 1.4;
      }

      .order-amount {
        font-size: 16px;
        font-weight: 600;
        color: #3b82f6;
        margin-top: 4px;
      }

      .rating-section,
      .content-section {
        margin-bottom: 24px;
      }

      .form-label {
        margin: 0 0 16px 0;
        font-size: 16px;
        font-weight: 700;
        color: #1e293b;
      }

      .star-rating-large {
        display: flex;
        justify-content: center;
        gap: 8px;
        margin-bottom: 12px;
      }

      .star-large {
        font-size: 36px;
        cursor: pointer;
        color: #d1d5db;
        transition: all 0.2s ease;
        user-select: none;
      }

      .star-large.active {
        color: #fbbf24;
        transform: scale(1.1);
      }

      .star-large.hover {
        color: #f59e0b;
        transform: scale(1.05);
      }

      .rating-text {
        text-align: center;
        font-size: 14px;
        color: #6b7280;
        font-weight: 500;
      }

      .rating-text.selected {
        color: #1e293b;
        font-weight: 600;
        font-size: 16px;
      }

      .review-textarea-large {
        width: 100%;
        min-height: 120px;
        border: 2px solid #e5e7eb;
        border-radius: 12px;
        padding: 16px;
        font-size: 16px;
        font-family: inherit;
        resize: vertical;
        transition: border-color 0.2s ease;
        box-sizing: border-box;
        line-height: 1.5;
      }

      .review-textarea-large:focus {
        outline: none;
        border-color: #3b82f6;
        box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
      }

      .char-count {
        text-align: right;
        font-size: 12px;
        color: #6b7280;
        margin-top: 8px;
      }

      .review-tips {
        background: #f8fafc;
        border-radius: 12px;
        padding: 16px;
        border-left: 4px solid #3b82f6;
      }

      .review-tips h4 {
        margin: 0 0 12px 0;
        font-size: 14px;
        font-weight: 600;
        color: #1e293b;
      }

      .review-tips ul {
        margin: 0;
        padding-left: 16px;
        list-style-type: disc;
      }

      .review-tips li {
        font-size: 13px;
        color: #475569;
        margin-bottom: 4px;
        line-height: 1.4;
      }

      .submit-section {
        margin-top: auto;
        padding-top: 20px;
      }

      .submit-review-btn {
        width: 100%;
        padding: 16px 24px;
        border: none;
        border-radius: 12px;
        background: #d1d5db;
        color: #6b7280;
        font-size: 16px;
        font-weight: 600;
        cursor: not-allowed;
        transition: all 0.2s ease;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 8px;
      }

      .submit-review-btn.ready {
        background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
        color: white;
        cursor: pointer;
        box-shadow: 0 4px 16px rgba(59, 130, 246, 0.3);
      }

      .submit-review-btn.ready:hover {
        transform: translateY(-2px);
        box-shadow: 0 6px 20px rgba(59, 130, 246, 0.4);
      }

      .submit-review-btn:disabled {
        background: #d1d5db;
        color: #6b7280;
        cursor: not-allowed;
        transform: none;
        box-shadow: none;
      }

      .error-state {
        text-align: center;
        padding: 60px 20px;
        color: #64748b;
      }

      .error-icon {
        font-size: 64px;
        margin-bottom: 16px;
      }

      .error-state h3 {
        margin: 0 0 8px 0;
        font-size: 18px;
        font-weight: 700;
        color: #1e293b;
      }

      .error-state p {
        margin: 0 0 24px 0;
        font-size: 14px;
        color: #64748b;
      }

      .primary-btn {
        padding: 12px 24px;
        border: none;
        border-radius: 12px;
        background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
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
        box-shadow: 0 4px 16px rgba(59, 130, 246, 0.3);
      }

      .success-message {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.5);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 3000;
      }

      .success-content {
        background: white;
        border-radius: 20px;
        padding: 40px;
        text-align: center;
        box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
        max-width: 300px;
        margin: 20px;
      }

      .success-icon {
        font-size: 48px;
        margin-bottom: 16px;
      }

      .success-content h3 {
        margin: 0 0 8px 0;
        font-size: 18px;
        font-weight: 700;
        color: #1e293b;
      }

      .success-content p {
        margin: 0;
        font-size: 14px;
        color: #64748b;
      }

      @media (max-width: 480px) {
        .review-write-header {
          padding: 16px 12px;
        }

        .review-write-content {
          padding: 16px 12px;
        }

        .order-info-card,
        .review-form-card {
          padding: 16px;
        }

        .star-large {
          font-size: 32px;
        }

        .header-info h1 {
          font-size: 20px;
        }
      }
    </style>
  `;
}

// 전역으로 함수 노출
window.renderReviewWrite = renderReviewWrite;
window.goBackFromReview = goBackFromReview;
