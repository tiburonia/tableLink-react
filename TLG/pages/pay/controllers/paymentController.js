/**
 * Payment Controller - 이벤트 처리 및 흐름 제어
 * Views ← Controllers ← Services ← Repositories
 */

import { paymentService } from '../services/paymentService.js';
import { tossPaymentService } from '../services/tossPaymentService.js';
import { paymentView } from '../views/paymentView.js';
import { paymentFailureView } from '../views/paymentFailureView.js';
import { getUserInfoSafely } from '../../../utils/authManager.js';

export class PaymentController {
  constructor() {
    this.orderData = null;
    this.currentOrder = null;
    this.store = null;
    this.tableNum = null;
    this.selectedPaymentMethod = '카드';
  }

  /**
   * 결제 화면 초기화 및 렌더링
   */
  async initializePayment(currentOrder) {
    console.log('🔄 결제 컨트롤러 초기화');

    try {
      // 데이터 저장
      this.currentOrder = currentOrder;
      this.store = currentOrder.store_id;
      this.tableNum = currentOrder.table_Number;

      // 주문 데이터 준비
      this.orderData = paymentService.prepareOrderData(currentOrder);
      console.log('✅ 주문 데이터 준비 완료:', this.orderData);

      // UI 렌더링
      paymentView.renderPaymentScreen(this.orderData);

      // 이벤트 리스너 설정
      this.setupEventListeners();

      // 데이터 로드 (포인트, 쿠폰)
      await this.loadPaymentData();

      console.log('✅ 결제 화면 초기화 완료');

    } catch (error) {
      console.error('❌ 결제 화면 초기화 실패:', error);
      paymentView.showError(error.message);
    }
  }

  /**
   * 이벤트 리스너 설정
   */
  setupEventListeners() {
    this.setupNavigationEvents();
    this.setupPointEvents();
    this.setupCouponEvents();
    this.setupPaymentMethodEvents();
    this.setupConfirmPaymentEvent();
  }

  /**
   * 네비게이션 이벤트
   */
  setupNavigationEvents() {
    const payBackBtn = document.getElementById('payBackBtn');
    const cancelPayBtn = document.getElementById('cancelPayBtn');

    if (payBackBtn) {
      payBackBtn.addEventListener('click', () => this.handleBackNavigation());
    }

    if (cancelPayBtn) {
      cancelPayBtn.addEventListener('click', () => this.handleBackNavigation());
    }
  }

  /**
   * 뒤로가기 처리
   */
  handleBackNavigation() {
    try {
      if (typeof window.renderOrderScreen === 'function') {
        window.renderOrderScreen(this.store, this.tableNum);
      } else if (typeof renderOrderScreen === 'function') {
        renderOrderScreen(this.store, this.tableNum);
      } else {
        console.error('❌ renderOrderScreen 함수를 찾을 수 없습니다');
        if (window.history.length > 1) {
          window.history.back();
        } else {
          alert('이전 화면으로 돌아갈 수 없습니다.');
        }
      }
    } catch (error) {
      console.error('❌ 뒤로가기 처리 실패:', error);
      alert('화면 전환 중 오류가 발생했습니다.');
    }
  }

  /**
   * 포인트 이벤트
   */
  setupPointEvents() {
    const maxPointBtn = document.getElementById('maxPointBtn');
    const usePointInput = document.getElementById('usePoint');

    if (maxPointBtn) {
      maxPointBtn.addEventListener('click', () => {
        if (usePointInput) {
          const maxUsable = Math.min(parseInt(usePointInput.max) || 0, this.orderData.total);
          usePointInput.value = maxUsable;
          this.calculateAndUpdateAmount();
        }
      });
    }

    if (usePointInput) {
      usePointInput.addEventListener('input', () => {
        this.calculateAndUpdateAmount();
      });
    }
  }

  /**
   * 쿠폰 이벤트
   */
  setupCouponEvents() {
    const couponList = document.getElementById('couponList');
    if (couponList) {
      couponList.addEventListener('change', (e) => {
        if (e.target.id === 'couponSelect') {
          this.calculateAndUpdateAmount();
        }
      });
    }
  }

  /**
   * 결제 수단 선택 이벤트
   */
  setupPaymentMethodEvents() {
    const paymentMethods = document.querySelectorAll('.payment-method-item');
    
    paymentMethods.forEach(method => {
      method.addEventListener('click', (e) => {
        const selectedMethod = e.currentTarget.dataset.method;
        
        paymentMethods.forEach(m => m.classList.remove('active'));
        e.currentTarget.classList.add('active');
        
        this.selectedPaymentMethod = selectedMethod;
        console.log('✅ 결제 수단 선택:', selectedMethod);
      });
    });
  }

  /**
   * 결제 확인 이벤트
   */
  setupConfirmPaymentEvent() {
    const confirmPayBtn = document.getElementById('confirmPayBtn');
    
    if (confirmPayBtn) {
      confirmPayBtn.addEventListener('click', async () => {
        await this.handlePaymentConfirmation();
      });
    }
  }

  /**
   * 결제 데이터 로드 (포인트, 쿠폰)
   */
  async loadPaymentData() {
    console.log('📥 결제 데이터 로드 시작');

    // 포인트 로드
    await this.loadPoints();

    // 쿠폰 로드
    await this.loadCoupons();

    console.log('✅ 결제 데이터 로드 완료');
  }

  /**
   * 포인트 로드
   */
  async loadPoints() {
    const result = await paymentService.loadStorePoints(this.orderData.storeId);

    if (result.success) {
      paymentView.updatePointUI(result.points, this.orderData.total);
    } else {
      document.getElementById('storePointDisplay').textContent = result.error || '조회 실패';
    }
  }

  /**
   * 쿠폰 로드
   */
  async loadCoupons() {
    const result = await paymentService.loadUserCoupons();

    if (result.success) {
      paymentView.renderCoupons(result.coupons);
    } else {
      document.getElementById('couponList').innerHTML = `<p>${result.error || '쿠폰 조회 실패'}</p>`;
    }
  }

  /**
   * 최종 금액 계산 및 UI 업데이트
   */
  calculateAndUpdateAmount() {
    const usePointInput = document.getElementById('usePoint');
    const usePoint = parseInt(usePointInput.value) || 0;

    const couponSelect = document.getElementById('couponSelect');
    const couponDiscount = couponSelect ? 
      parseInt(couponSelect.selectedOptions[0]?.dataset.discount) || 0 : 0;

    const amountData = paymentService.calculateFinalAmount(
      this.orderData.total,
      usePoint,
      couponDiscount
    );

    if (usePoint !== amountData.validatedPoints) {
      usePointInput.value = amountData.validatedPoints;
    }

    paymentView.updateAmountDisplay(amountData);

    return amountData;
  }

  /**
   * 결제 확인 처리
   */
  async handlePaymentConfirmation() {
    console.log('💳 결제 확인 처리 시작');

    try {
      const userInfo = getUserInfoSafely();
      if (!userInfo || !userInfo.id) {
        throw new Error('로그인 정보를 찾을 수 없습니다. 다시 로그인해주세요.');
      }

      const amountData = this.calculateAndUpdateAmount();
      const { finalAmount } = amountData;

      if (finalAmount <= 0) {
        alert('결제 금액이 올바르지 않습니다.');
        return;
      }

      const confirmPayBtn = document.getElementById('confirmPayBtn');
      if (confirmPayBtn) {
        confirmPayBtn.disabled = true;
        confirmPayBtn.textContent = '결제 처리 중...';
      }

      console.log('📤 결제 준비 데이터 구성 시작');
      const prepareData = paymentService.prepareTossPaymentData(
        userInfo,
        this.orderData,
        this.currentOrder,
        finalAmount,
        this.selectedPaymentMethod
      );

      prepareData.customerName = userInfo.name || '고객';
      prepareData.customerEmail = userInfo.email || 'customer@tablelink.com';

      console.log('💳 Toss Payments 결제 플로우 실행');
      await tossPaymentService.executePaymentFlow(prepareData, this.selectedPaymentMethod);

      console.log('✅ 결제 처리 완료');

    } catch (error) {
      console.error('❌ 결제 처리 실패:', error);
      
      if (confirmPayBtn) {
        confirmPayBtn.disabled = false;
        confirmPayBtn.innerHTML = `
          <span>결제하기</span>
          <span id="payBtnAmount" class="btn-price">${this.orderData.total.toLocaleString()}원</span>
        `;
      }

      this.handlePaymentFailure(error);
    }
  }

  /**
   * 결제 실패 처리
   */
  handlePaymentFailure(error) {
    console.log('❌ 결제 실패 처리:', error.message);
    
    paymentFailureView.renderFailureScreen(error, this.orderData);
    this.setupFailureEventListeners();
  }

  /**
   * 실패 화면 이벤트 리스너
   */
  setupFailureEventListeners() {
    const retryPayment = document.getElementById('retryPayment');
    const backToOrder = document.getElementById('backToOrder');
    const backToMain = document.getElementById('backToMain');

    if (retryPayment) {
      retryPayment.addEventListener('click', () => {
        this.initializePayment(this.currentOrder, this.store, this.tableNum);
      });
    }

    if (backToOrder) {
      backToOrder.addEventListener('click', () => {
        this.handleBackNavigation();
      });
    }

    if (backToMain) {
      backToMain.addEventListener('click', () => {
        if (typeof window.renderMap === 'function') {
          window.renderMap();
        } else if (typeof renderMap === 'function') {
          renderMap();
        } else {
          window.location.href = '/';
        }
      });
    }
  }
}

// 전역 등록 (하위 호환성)
window.PaymentController = PaymentController;

console.log('✅ paymentController 모듈 로드 완료');
