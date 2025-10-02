
/**
 * 리뷰 작성 컨트롤러 - 이벤트 처리 및 흐름 제어
 */

import { reviewService } from '../services/reviewService.js';
import { reviewWriteView } from '../views/reviewWriteView.js';

// 컨트롤러 정의
export const reviewWriteController = {
  // 상태 관리
  state: {
    currentOrder: null,
    selectedRating: 0,
    reviewContent: ''
  },

  /**
   * 리뷰 작성 화면 렌더링
   */
  async renderReviewWrite(order) {
    try {
      console.log('📝 리뷰 작성 화면 렌더링:', order);

      if (!order) {
        throw new Error('주문 정보가 없습니다');
      }

      // 상태 초기화
      this.state.currentOrder = order;
      this.state.selectedRating = 0;
      this.state.reviewContent = '';

      // 주문 정보 포맷팅
      const orderInfo = reviewService.formatOrderInfo(order);

      // View를 통한 UI 렌더링
      reviewWriteView.renderHTML(orderInfo);

      // 이벤트 리스너 설정
      this.setupEventListeners();

      console.log('✅ 리뷰 작성 화면 렌더링 완료');
    } catch (error) {
      console.error('❌ 리뷰 작성 화면 렌더링 실패:', error);
      reviewWriteView?.showError(error.message);
    }
  },

  /**
   * 이벤트 리스너 설정
   */
  setupEventListeners() {
    this.setupStarRatingEvents();
    this.setupTextareaEvents();
    this.setupSubmitButton();
  },

  /**
   * 별점 선택 이벤트
   */
  setupStarRatingEvents() {
    const stars = document.querySelectorAll('.star-large');
    const ratingText = document.getElementById('ratingText');

    const ratingTexts = {
      1: '⭐ 별로예요',
      2: '⭐⭐ 그저 그래요',
      3: '⭐⭐⭐ 보통이에요',
      4: '⭐⭐⭐⭐ 좋아요',
      5: '⭐⭐⭐⭐⭐ 최고예요!'
    };

    stars.forEach(star => {
      star.addEventListener('click', (e) => {
        this.state.selectedRating = parseInt(e.target.getAttribute('data-rating'));
        this.updateStarDisplay(this.state.selectedRating, stars);
        ratingText.textContent = ratingTexts[this.state.selectedRating];
        ratingText.className = 'rating-text selected';
        this.checkFormValidity();
      });

      star.addEventListener('mouseenter', (e) => {
        const hoverRating = parseInt(e.target.getAttribute('data-rating'));
        this.updateStarDisplay(hoverRating, stars, true);
      });
    });

    document.getElementById('starRating').addEventListener('mouseleave', () => {
      this.updateStarDisplay(this.state.selectedRating, stars);
    });
  },

  /**
   * 텍스트 입력 이벤트
   */
  setupTextareaEvents() {
    const textarea = document.getElementById('reviewTextarea');
    const charCount = document.getElementById('charCount');

    textarea.addEventListener('input', (e) => {
      this.state.reviewContent = e.target.value;
      const length = e.target.value.length;
      charCount.textContent = length;
      
      if (length > 450) {
        charCount.style.color = '#ef4444';
      } else if (length > 350) {
        charCount.style.color = '#f59e0b';
      } else {
        charCount.style.color = '#6b7280';
      }
      
      this.checkFormValidity();
    });
  },

  /**
   * 제출 버튼 이벤트
   */
  setupSubmitButton() {
    const submitBtn = document.getElementById('submitReviewBtn');
    
    submitBtn.addEventListener('click', async () => {
      await this.handleSubmit(submitBtn);
    });
  },

  /**
   * 리뷰 제출 처리
   */
  async handleSubmit(submitBtn) {
    // 검증
    const validation = reviewService.validateReviewData(
      this.state.selectedRating,
      this.state.reviewContent
    );

    if (!validation.isValid) {
      alert(validation.errors.join('\n'));
      return;
    }

    try {
      // 버튼 비활성화
      submitBtn.disabled = true;
      submitBtn.innerHTML = '<span class="btn-icon">⏳</span> 등록 중...';

      // 리뷰 데이터 준비
      const reviewData = reviewService.prepareReviewData(
        this.state.currentOrder,
        this.state.selectedRating,
        this.state.reviewContent.trim()
      );

      // 리뷰 제출
      const result = await reviewService.submitReview(reviewData);

      if (!result.success) {
        throw new Error(result.error || '리뷰 등록에 실패했습니다');
      }

      // 성공 메시지 표시
      reviewWriteView.showSuccessMessage();
      
      // 2초 후 이전 화면으로 이동
      setTimeout(() => {
        this.goBack();
      }, 2000);

    } catch (error) {
      console.error('❌ 리뷰 등록 오류:', error);
      alert('리뷰 등록에 실패했습니다: ' + error.message);
      submitBtn.disabled = false;
      submitBtn.innerHTML = '<span class="btn-icon">📝</span> 리뷰 등록하기';
    }
  },

  /**
   * 별점 표시 업데이트
   */
  updateStarDisplay(rating, stars, isHover = false) {
    stars.forEach((star, index) => {
      if (index < rating) {
        star.classList.add('active');
        if (isHover) star.classList.add('hover');
      } else {
        star.classList.remove('active', 'hover');
      }
    });
  },

  /**
   * 폼 유효성 검사
   */
  checkFormValidity() {
    const submitBtn = document.getElementById('submitReviewBtn');
    const hasRating = this.state.selectedRating > 0;
    const hasContent = this.state.reviewContent.trim().length >= 10;
    
    submitBtn.disabled = !(hasRating && hasContent);
    
    if (hasRating && hasContent) {
      submitBtn.classList.add('ready');
    } else {
      submitBtn.classList.remove('ready');
    }
  },

  /**
   * 뒤로가기
   */
  goBack() {
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
};

// 전역 등록 (호환성)
window.reviewWriteController = reviewWriteController;

console.log('✅ reviewWriteController 모듈 로드 완료');
