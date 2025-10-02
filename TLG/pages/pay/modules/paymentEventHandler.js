
/**
 * 결제 이벤트 핸들러 모듈
 */

import { PaymentDataService } from './paymentDataService.js';
import { getUserInfoSafely } from '../../../../utils/authManager.js';

export class PaymentEventHandler {
  /**
   * 이벤트 리스너 설정
   */
  static setupEventListeners(orderData, currentOrder, store, tableNum) {
    this.setupNavigationEvents(store, tableNum);
    this.setupPointEvents(orderData);
    this.setupCouponEvents(orderData);
    this.setupPaymentMethodEvents();
    this.setupPaymentEvents(orderData, currentOrder, store, tableNum);
  }

  /**
   * 네비게이션 이벤트 설정
   */
  static setupNavigationEvents(store, tableNum) {
    const payBackBtn = document.getElementById('payBackBtn');
    const cancelPayBtn = document.getElementById('cancelPayBtn');

    if (payBackBtn) {
      payBackBtn.addEventListener('click', () => {
        this.navigateBack(store, tableNum);
      });
    }

    if (cancelPayBtn) {
      cancelPayBtn.addEventListener('click', () => {
        this.navigateBack(store, tableNum);
      });
    }
  }

  /**
   * 안전한 뒤로가기 처리
   */
  static navigateBack(store, tableNum) {
    try {
      if (typeof window.renderOrderScreen === 'function') {
        window.renderOrderScreen(store, tableNum);
      } else if (typeof renderOrderScreen === 'function') {
        renderOrderScreen(store, tableNum);
      } else {
        console.error('❌ renderOrderScreen 함수를 찾을 수 없습니다');
        // 폴백: 브라우저 뒤로가기
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
   * 포인트 관련 이벤트 설정
   */
  static setupPointEvents(orderData) {
    const maxPointBtn = document.getElementById('maxPointBtn');
    const usePointInput = document.getElementById('usePoint');

    // 전액 사용 버튼
    if (maxPointBtn) {
      maxPointBtn.addEventListener('click', () => {
        if (usePointInput) {
          const maxUsable = Math.min(parseInt(usePointInput.max) || 0, orderData.total);
          usePointInput.value = maxUsable;
          PaymentDataService.calculateFinalAmount(orderData.total);
        }
      });
    }

    // 포인트 입력 - 실시간 검증
    if (usePointInput) {
      usePointInput.addEventListener('input', (e) => {
        const value = parseInt(e.target.value) || 0;
        const maxPoints = parseInt(e.target.max) || 0;
        const maxUsable = Math.min(maxPoints, orderData.total);

        if (value > maxUsable) {
          e.target.value = maxUsable;
        }
        if (value < 0) {
          e.target.value = 0;
        }

        PaymentDataService.calculateFinalAmount(orderData.total);
      });
    }
  }

  /**
   * 쿠폰 관련 이벤트 설정
   */
  static setupCouponEvents(orderData) {
    // 쿠폰 선택
    document.addEventListener('change', (e) => {
      if (e.target.id === 'couponSelect') {
        PaymentDataService.calculateFinalAmount(orderData.total);
      }
    });
  }

  /**
   * 결제 수단 선택 이벤트 설정
   */
  static setupPaymentMethodEvents() {
    document.addEventListener('click', (e) => {
      const methodItem = e.target.closest('.payment-method-item');
      if (methodItem) {
        // 모든 결제 수단 선택 해제
        document.querySelectorAll('.payment-method-item').forEach(item => {
          item.classList.remove('active');
        });

        // 선택된 결제 수단 활성화
        methodItem.classList.add('active');

        const selectedMethod = methodItem.dataset.method;
        console.log('💳 결제 수단 선택:', selectedMethod);
      }
    });
  }

  /**
   * 결제 관련 이벤트 설정
   */
  static setupPaymentEvents(orderData, currentOrder, store, tableNum) {
    const confirmPayBtn = document.getElementById('confirmPayBtn');
    
    if (confirmPayBtn) {
      confirmPayBtn.addEventListener('click', async (event) => {
        // 중복 클릭 방지
        if (confirmPayBtn.disabled) return;
        
        try {
          confirmPayBtn.disabled = true;
          confirmPayBtn.textContent = '처리중...';
          
          await this.handlePaymentConfirm(orderData, currentOrder, store, tableNum);
        } catch (error) {
          console.error('❌ 결제 처리 실패:', error);
          alert('결제 처리 중 오류가 발생했습니다: ' + error.message);
        } finally {
          // 버튼 상태 복원
          confirmPayBtn.disabled = false;
          confirmPayBtn.innerHTML = `
            <span>결제하기</span>
            <span class="btn-price">${orderData.total.toLocaleString()}원</span>
          `;
        }
      });
    }
  }

  /**
   * 결제 확인 처리
   */
  static async handlePaymentConfirm(orderData, currentOrder, store, tableNum) {
    try {
      const { validatedPoints, couponDiscount, finalAmount } = PaymentDataService.calculateFinalAmount(orderData.total);
      
      const couponSelect = document.getElementById('couponSelect');
      const selectedCouponId = couponSelect ? couponSelect.value : null;
      const selectedPaymentMethod = document.querySelector('.payment-method-item.active')?.dataset.method || '카드';

      console.log('💳 TLL 결제 확인 버튼 클릭:', {
        validatedPoints,
        selectedCouponId,
        couponDiscount,
        finalAmount,
        paymentMethod: selectedPaymentMethod
      });

      // 1. TLL 체크 생성
      const checkId = await this.createTLLCheck(tableNum);

      // 2. TLL 주문 생성
      await this.createTLLOrder(checkId, orderData);

      // 3. 토스페이먼츠 결제 요청
      await this.requestTossPayment(checkId, store, tableNum, orderData, finalAmount, validatedPoints, selectedCouponId, couponDiscount, selectedPaymentMethod);

    } catch (error) {
      console.error('❌ TLL 결제 처리 실패:', error);
      alert('결제 처리 중 오류가 발생했습니다: ' + error.message);
    }
  }

  /**
   * TLL 체크 생성
   */
  static async createTLLCheck(tableNum) {
    const qrCode = `TABLE_${tableNum}`;
    const userInfo = getUserInfoSafely();
    
    let requestBody = { qr_code: qrCode };
    if (userInfo.id && userInfo.id !== 'guest') {
      requestBody.user_id = userInfo.id;
    } else if (userInfo.phone) {
      requestBody.guest_phone = userInfo.phone;
    } else {
      requestBody.guest_phone = '010-0000-0000';
    }

    console.log('📝 TLL 체크 생성 요청:', requestBody);

    const checkResponse = await fetch('/api/tll/checks/from-qr', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestBody)
    });

    if (!checkResponse.ok) {
      const errorData = await checkResponse.json();
      throw new Error(errorData.error || 'TLL 체크 생성 실패');
    }

    const checkData = await checkResponse.json();
    const checkId = checkData.check_id;
    console.log('✅ TLL 체크 생성 완료:', checkId);

    return checkId;
  }

  /**
   * TLL 주문 생성
   */
  static async createTLLOrder(checkId, orderData) {
    const orderItems = orderData.items.map(item => ({
      menu_name: item.name,
      unit_price: item.price,
      quantity: item.qty,
      options: {},
      notes: '',
      cook_station: item.cook_station || 'KITCHEN'
    }));

    const orderResponse = await fetch('/api/tll/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        check_id: checkId,
        items: orderItems,
        payment_method: 'TOSS',
        toss_order_id: `TLL_${checkId}_${Date.now()}`
      })
    });

    if (!orderResponse.ok) {
      const errorData = await orderResponse.json();
      throw new Error(errorData.error || 'TLL 주문 생성 실패');
    }

    const orderResult = await orderResponse.json();
    console.log('✅ TLL 주문 생성 성공:', orderResult);

    return orderResult;
  }

  /**
   * 토스페이먼츠 결제 요청
   */
  static async requestTossPayment(checkId, store, tableNum, orderData, finalAmount, validatedPoints, selectedCouponId, couponDiscount, selectedPaymentMethod) {
    // 토스페이먼츠 모듈 로드 확인
    if (!window.requestTossPayment) {
      console.log('🔄 토스페이먼츠 모듈 로드 중...');
      await import('/TLG/pages/store/pay/tossPayments.js');
    }

    if (!window.requestTossPayment) {
      throw new Error('토스페이먼츠 모듈 로드 실패');
    }

    // 주문 정보 세션에 저장 (결제 성공 후 사용)
    sessionStorage.setItem('tllPendingOrder', JSON.stringify({
      checkId: checkId,
      storeId: store.id,
      storeName: store.name,
      tableNumber: tableNum,
      tableName: `${tableNum}번 테이블`,
      items: orderData.items,
      totalAmount: finalAmount,
      usedPoints: validatedPoints,
      usedCoupon: selectedCouponId,
      couponDiscount: couponDiscount
    }));

    // 결제 데이터 구성
    const userInfo = getUserInfoSafely();
    const paymentData = {
      amount: finalAmount,
      orderId: `TLL_${checkId}_${Date.now()}`,
      orderName: `${store.name} - ${tableNum}번 테이블`,
      customerName: userInfo.name || '고객',
      customerEmail: userInfo.email || 'customer@tablelink.com'
    };

    console.log('💳 TLL 결제 데이터:', paymentData);

    // 결제 요청 (결제창으로 리디렉션)
    const paymentResult = await window.requestTossPayment(paymentData, selectedPaymentMethod);

    if (!paymentResult.success) {
      if (paymentResult.code === 'USER_CANCEL') {
        console.log('💳 결제가 취소되었습니다');
        return;
      }
      throw new Error(paymentResult.error || '결제 요청 실패');
    }

    console.log('✅ TLL 결제 요청 성공 - 결제창으로 이동');
  }
}
