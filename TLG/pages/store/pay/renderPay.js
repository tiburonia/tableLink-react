
(function() {
  'use strict';

  console.log('🔄 renderPay 모듈 로드 시작');

  // PaymentDataService 모듈
  const PaymentDataService = {
    prepareOrderData: function(currentOrder, store, tableNum) {
      const items = Object.entries(currentOrder).map(([key, item]) => {
        const price = parseInt(item.price) || 0;
        const quantity = parseInt(item.count) || 1;
        return {
          name: key,
          price: price,
          quantity: quantity,
          totalPrice: price * quantity
        };
      });

      const total = items.reduce((sum, item) => sum + item.totalPrice, 0);

      return {
        storeId: store.id || store.store_id,
        store: store.name,
        tableNum: tableNum,
        total: total,
        items: items
      };
    },

    loadStorePoint: async function(storeId) {
      try {
        const userInfo = getUserInfoSafely();
        if (!userInfo?.id) return 0;

        const response = await fetch(`/api/regular-levels/user/${userInfo.id}/store/${storeId}/points`);
        if (!response.ok) throw new Error('포인트 조회 실패');

        const data = await response.json();
        const points = data.points || 0;
        
        const pointsElement = document.getElementById('currentPoints');
        if (pointsElement) {
          pointsElement.textContent = points.toLocaleString();
        }
        
        return points;
      } catch (error) {
        console.warn('⚠️ 포인트 로딩 실패:', error);
        return 0;
      }
    },

    loadCoupons: async function() {
      try {
        const userInfo = getUserInfoSafely();
        if (!userInfo?.id) return [];

        const response = await fetch(`/api/auth/user/${userInfo.id}`);
        if (!response.ok) throw new Error('쿠폰 조회 실패');

        const data = await response.json();
        const coupons = data.user?.coupons?.unused || [];
        
        this.updateCouponUI(coupons);
        return coupons;
      } catch (error) {
        console.warn('⚠️ 쿠폰 로딩 실패:', error);
        return [];
      }
    },

    updateCouponUI: function(coupons) {
      const couponSelect = document.getElementById('couponSelect');
      if (!couponSelect) return;

      couponSelect.innerHTML = '<option value="">쿠폰 선택</option>';
      
      coupons.forEach(coupon => {
        const option = document.createElement('option');
        option.value = coupon.id;
        option.textContent = `${coupon.name} (${coupon.discountValue}${coupon.discountType === 'PERCENT' ? '%' : '원'} 할인)`;
        option.dataset.discountType = coupon.discountType;
        option.dataset.discountValue = coupon.discountValue;
        option.dataset.minOrderAmount = coupon.minOrderAmount || 0;
        option.dataset.maxDiscount = coupon.maxDiscount || 0;
        couponSelect.appendChild(option);
      });
    },

    calculateFinalAmount: function(baseAmount) {
      const pointsUsed = parseInt(document.getElementById('pointsToUse')?.value || 0);
      const couponDiscount = parseInt(document.getElementById('couponDiscount')?.textContent?.replace(/[^\d]/g, '') || 0);
      
      const finalAmount = Math.max(0, baseAmount - pointsUsed - couponDiscount);
      
      const finalAmountElement = document.getElementById('finalAmount');
      if (finalAmountElement) {
        finalAmountElement.textContent = finalAmount.toLocaleString() + '원';
      }
      
      return finalAmount;
    }
  };

  // PaymentUIManager 모듈
  const PaymentUIManager = {
    renderPaymentScreen: function(orderData) {
      const main = document.getElementById('main') || document.body;
      
      main.innerHTML = `
        <div class="payment-container">
          <div class="payment-header">
            <button class="back-btn" id="backBtn">←</button>
            <h1 class="payment-title">결제하기</h1>
          </div>
          
          <div class="payment-content">
            <div class="order-summary">
              <h2>주문 내역</h2>
              <div class="store-info">
                <span class="store-name">${orderData.store}</span>
                <span class="table-num">테이블 ${orderData.tableNum}</span>
              </div>
              <div class="order-items">
                ${orderData.items.map(item => `
                  <div class="order-item">
                    <span class="item-name">${item.name || '메뉴명 없음'}</span>
                    <span class="item-quantity">x${item.quantity || 1}</span>
                    <span class="item-price">${(item.price || 0).toLocaleString()}원</span>
                  </div>
                `).join('')}
              </div>
              <div class="order-total">
                <span>총 금액</span>
                <span id="orderTotal">${orderData.total.toLocaleString()}원</span>
              </div>
            </div>

            <div class="payment-options">
              <div class="points-section">
                <h3>포인트 사용</h3>
                <div class="points-info">
                  <span>보유 포인트: <span id="currentPoints">0</span>P</span>
                </div>
                <div class="points-input">
                  <input type="number" id="pointsToUse" placeholder="사용할 포인트" min="0" max="0">
                  <button id="useAllPoints">전액 사용</button>
                </div>
              </div>

              <div class="coupon-section">
                <h3>쿠폰 사용</h3>
                <select id="couponSelect">
                  <option value="">쿠폰 선택</option>
                </select>
                <div class="coupon-discount" id="couponDiscount">0원 할인</div>
              </div>

              <div class="payment-method">
                <h3>결제 방법</h3>
                <div class="payment-methods">
                  <button class="payment-method-btn active" data-method="카드">카드</button>
                  <button class="payment-method-btn" data-method="현금">현금</button>
                </div>
              </div>

              <div class="final-amount">
                <h3>최종 결제 금액</h3>
                <div class="amount" id="finalAmount">${orderData.total.toLocaleString()}원</div>
              </div>

              <button class="pay-btn" id="payBtn">결제하기</button>
            </div>
          </div>
        </div>

        <style>
          .payment-container {
            max-width: 430px;
            margin: 0 auto;
            background: #fff;
            min-height: 100vh;
          }

          .payment-header {
            display: flex;
            align-items: center;
            padding: 16px;
            border-bottom: 1px solid #e5e7eb;
            position: sticky;
            top: 0;
            background: #fff;
            z-index: 100;
          }

          .back-btn {
            background: none;
            border: none;
            font-size: 24px;
            margin-right: 16px;
            cursor: pointer;
          }

          .payment-title {
            font-size: 20px;
            font-weight: 600;
            margin: 0;
          }

          .payment-content {
            padding: 20px;
          }

          .order-summary {
            background: #f9fafb;
            padding: 20px;
            border-radius: 12px;
            margin-bottom: 20px;
          }

          .order-summary h2 {
            margin: 0 0 16px 0;
            font-size: 18px;
          }

          .store-info {
            display: flex;
            justify-content: space-between;
            margin-bottom: 16px;
            font-weight: 500;
          }

          .order-items {
            border-top: 1px solid #e5e7eb;
            padding-top: 12px;
          }

          .order-item {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 8px 0;
          }

          .item-name {
            flex: 1;
          }

          .item-quantity {
            margin: 0 12px;
            color: #6b7280;
          }

          .order-total {
            display: flex;
            justify-content: space-between;
            font-weight: 600;
            font-size: 18px;
            border-top: 2px solid #e5e7eb;
            padding-top: 12px;
            margin-top: 12px;
          }

          .payment-options h3 {
            font-size: 16px;
            margin: 24px 0 12px 0;
          }

          .points-info {
            margin-bottom: 8px;
            color: #6b7280;
          }

          .points-input {
            display: flex;
            gap: 8px;
          }

          .points-input input {
            flex: 1;
            padding: 12px;
            border: 1px solid #d1d5db;
            border-radius: 8px;
          }

          .points-input button {
            padding: 12px 16px;
            background: #3b82f6;
            color: white;
            border: none;
            border-radius: 8px;
            cursor: pointer;
          }

          .coupon-section select {
            width: 100%;
            padding: 12px;
            border: 1px solid #d1d5db;
            border-radius: 8px;
            margin-bottom: 8px;
          }

          .coupon-discount {
            color: #dc2626;
            font-weight: 500;
          }

          .payment-methods {
            display: flex;
            gap: 8px;
          }

          .payment-method-btn {
            flex: 1;
            padding: 12px;
            border: 2px solid #e5e7eb;
            background: white;
            border-radius: 8px;
            cursor: pointer;
          }

          .payment-method-btn.active {
            border-color: #3b82f6;
            background: #eff6ff;
            color: #1d4ed8;
          }

          .final-amount {
            background: #f3f4f6;
            padding: 20px;
            border-radius: 12px;
            margin: 20px 0;
          }

          .final-amount .amount {
            font-size: 24px;
            font-weight: 700;
            color: #1f2937;
            text-align: center;
          }

          .pay-btn {
            width: 100%;
            padding: 16px;
            background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
            color: white;
            border: none;
            border-radius: 12px;
            font-size: 18px;
            font-weight: 600;
            cursor: pointer;
          }

          .pay-btn:hover {
            transform: translateY(-2px);
            box-shadow: 0 8px 25px rgba(59, 130, 246, 0.3);
          }
        </style>
      `;
    }
  };

  // PaymentEventHandler 모듈
  const PaymentEventHandler = {
    setupEventListeners: function(orderData, currentOrder, store, tableNum) {
      // 뒤로가기 버튼
      document.getElementById('backBtn')?.addEventListener('click', () => {
        if (typeof renderOrderScreen === 'function') {
          renderOrderScreen(store, tableNum);
        }
      });

      // 포인트 전액 사용 버튼
      document.getElementById('useAllPoints')?.addEventListener('click', () => {
        const currentPoints = parseInt(document.getElementById('currentPoints')?.textContent || 0);
        const pointsInput = document.getElementById('pointsToUse');
        if (pointsInput) {
          pointsInput.value = currentPoints;
          pointsInput.max = currentPoints;
          PaymentDataService.calculateFinalAmount(orderData.total);
        }
      });

      // 포인트 입력 변경
      document.getElementById('pointsToUse')?.addEventListener('input', (e) => {
        const maxPoints = parseInt(document.getElementById('currentPoints')?.textContent || 0);
        if (parseInt(e.target.value) > maxPoints) {
          e.target.value = maxPoints;
        }
        PaymentDataService.calculateFinalAmount(orderData.total);
      });

      // 쿠폰 선택 변경
      document.getElementById('couponSelect')?.addEventListener('change', (e) => {
        const selectedOption = e.target.selectedOptions[0];
        const couponDiscountElement = document.getElementById('couponDiscount');
        
        if (selectedOption && selectedOption.value && couponDiscountElement) {
          const discountType = selectedOption.dataset.discountType;
          const discountValue = parseInt(selectedOption.dataset.discountValue);
          const minOrderAmount = parseInt(selectedOption.dataset.minOrderAmount || 0);
          
          if (orderData.total >= minOrderAmount) {
            let discount = 0;
            if (discountType === 'PERCENT') {
              discount = Math.floor(orderData.total * discountValue / 100);
              const maxDiscount = parseInt(selectedOption.dataset.maxDiscount || 0);
              if (maxDiscount > 0) {
                discount = Math.min(discount, maxDiscount);
              }
            } else {
              discount = discountValue;
            }
            couponDiscountElement.textContent = `${discount.toLocaleString()}원 할인`;
          } else {
            couponDiscountElement.textContent = `최소 주문금액 ${minOrderAmount.toLocaleString()}원 미달`;
          }
        } else if (couponDiscountElement) {
          couponDiscountElement.textContent = '0원 할인';
        }
        
        PaymentDataService.calculateFinalAmount(orderData.total);
      });

      // 결제 방법 선택
      document.querySelectorAll('.payment-method-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
          document.querySelectorAll('.payment-method-btn').forEach(b => b.classList.remove('active'));
          e.target.classList.add('active');
        });
      });

      // 결제하기 버튼
      document.getElementById('payBtn')?.addEventListener('click', async () => {
        await this.handlePayment(orderData, currentOrder, store);
      });
    },

    handlePayment: async function(orderData, currentOrder, store) {
      try {
        const pointsUsed = parseInt(document.getElementById('pointsToUse')?.value || 0);
        const selectedCoupon = document.getElementById('couponSelect');
        const couponId = selectedCoupon?.value || null;
        const couponDiscount = parseInt(document.getElementById('couponDiscount')?.textContent?.replace(/[^\d]/g, '') || 0);
        const paymentMethod = document.querySelector('.payment-method-btn.active')?.dataset.method || '카드';
        const finalAmount = PaymentDataService.calculateFinalAmount(orderData.total);

        if (finalAmount <= 0) {
          alert('결제 금액이 0원 이하입니다.');
          return;
        }

        // 결제 확인 함수 호출
        if (typeof confirmPay === 'function') {
          await confirmPay(orderData, pointsUsed, store, currentOrder, finalAmount, couponId, couponDiscount, paymentMethod);
        } else {
          throw new Error('결제 처리 함수를 찾을 수 없습니다.');
        }

      } catch (error) {
        console.error('❌ 결제 처리 오류:', error);
        alert('결제 처리 중 오류가 발생했습니다: ' + error.message);
      }
    }
  };

  // 유틸리티 함수들
  function getUserInfoSafely() {
    try {
      // 쿠키에서 userInfo 찾기
      const cookies = document.cookie.split(';').map(cookie => cookie.trim());
      const userInfoCookie = cookies.find(cookie => cookie.startsWith('userInfo='));

      if (userInfoCookie) {
        const userInfoValue = decodeURIComponent(userInfoCookie.split('=')[1]);
        return JSON.parse(userInfoValue);
      }

      // localStorage 확인
      const localStorageUserInfo = localStorage.getItem('userInfo');
      if (localStorageUserInfo) {
        return JSON.parse(localStorageUserInfo);
      }

      // window.userInfo 확인
      if (window.userInfo && window.userInfo.id) {
        return window.userInfo;
      }

      return null;
    } catch (error) {
      console.error('❌ 사용자 정보 파싱 오류:', error);
      return null;
    }
  }

  function calculateOrderTotal(currentOrder) {
    let total = 0;
    for (const [key, item] of Object.entries(currentOrder)) {
      const price = parseInt(item.price) || 0;
      const count = parseInt(item.count) || 1;
      total += price * count;
    }
    return total;
  }

  // 메인 renderPay 함수
  window.renderPay = async function(currentOrder, store, tableNum) {
    console.log('💳 결제 화면 렌더링 시작 - 매장:', store?.name || store, '테이블:', tableNum);

    const userInfo = getUserInfoSafely();
    if (!userInfo || !userInfo.id) {
      console.error('❌ 사용자 정보가 없습니다 - 로그인 필요');
      alert('로그인이 필요합니다.');
      if (typeof renderLogin === 'function') {
        renderLogin();
      }
      return;
    }

    console.log('✅ 사용자 정보 확인:', userInfo.name || userInfo.id);

    try {
      // 1. 필수 모듈 로딩 (순서 중요)
      await loadRequiredModules();

      // 2. 주문 데이터 검증 및 준비
      if (!currentOrder || Object.keys(currentOrder).length === 0) {
        throw new Error('주문 데이터가 없습니다.');
      }

      if (!store || !store.name) {
        throw new Error('매장 정보가 없습니다.');
      }

      // 주문 데이터 상세 검증
      console.log('📋 주문 데이터 검증:', currentOrder);
      for (const [itemName, item] of Object.entries(currentOrder)) {
        if (!item.price || isNaN(parseInt(item.price))) {
          console.warn(`⚠️ 메뉴 "${itemName}"의 가격이 유효하지 않습니다:`, item.price);
        }
        if (!item.count || isNaN(parseInt(item.count))) {
          console.warn(`⚠️ 메뉴 "${itemName}"의 수량이 유효하지 않습니다:`, item.count);
        }
      }

      const orderData = PaymentDataService.prepareOrderData(currentOrder, store, tableNum);
      console.log('💳 주문 데이터 준비 완료:', orderData);

      // 3. UI 렌더링
      PaymentUIManager.renderPaymentScreen(orderData);

      // 4. 데이터 로딩 및 이벤트 설정
      await initializePaymentScreen(orderData, currentOrder, store, tableNum);

      console.log('✅ 결제 화면 렌더링 완료');

    } catch (error) {
      console.error('❌ 결제 화면 렌더링 실패:', error);
      alert('결제 화면을 불러올 수 없습니다: ' + error.message);
      
      // 오류 시 이전 화면으로 복귀
      if (typeof renderOrderScreen === 'function') {
        renderOrderScreen(store, tableNum);
      }
    }
  };

  /**
   * 필수 모듈 로딩 (순서 보장)
   */
  async function loadRequiredModules() {
    const modules = [
      {
        name: 'tossPayments',
        path: '/TLG/pages/store/pay/tossPayments.js',
        check: () => window.requestTossPayment && window.initTossPayments
      },
      {
        name: 'confirmPay',
        path: '/TLG/pages/store/pay/confirmPayF.js',
        check: () => window.confirmPay
      }
    ];

    for (const module of modules) {
      if (!module.check()) {
        try {
          console.log(`🔄 ${module.name} 모듈 로드 중...`);
          
          // 스크립트 태그로 로드
          await new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = module.path;
            script.async = false;
            script.onload = resolve;
            script.onerror = reject;
            document.head.appendChild(script);
          });
          
          // 모듈 로드 후 잠시 대기 (전역 함수 등록 시간 확보)
          await new Promise(resolve => setTimeout(resolve, 100));
          
          if (module.check()) {
            console.log(`✅ ${module.name} 모듈 로드 완료`);
          } else {
            console.warn(`⚠️ ${module.name} 모듈 로드됨, 하지만 함수가 등록되지 않음`);
          }
        } catch (error) {
          console.error(`❌ ${module.name} 모듈 로드 실패:`, error);
          throw new Error(`${module.name} 모듈을 로드할 수 없습니다.`);
        }
      } else {
        console.log(`✅ ${module.name} 모듈 이미 로드됨`);
      }
    }
  }

  /**
   * 결제 화면 초기화 (데이터 로딩 및 이벤트 설정)
   */
  async function initializePaymentScreen(orderData, currentOrder, store, tableNum) {
    try {
      console.log('🔄 결제 화면 초기화 시작');

      // 1. 병렬로 데이터 로딩
      const dataPromises = [
        PaymentDataService.loadStorePoint(orderData.storeId).catch(error => {
          console.warn('⚠️ 포인트 로딩 실패:', error);
        }),
        PaymentDataService.loadCoupons().catch(error => {
          console.warn('⚠️ 쿠폰 로딩 실패:', error);
        })
      ];

      await Promise.allSettled(dataPromises);
      console.log('✅ 데이터 로딩 완료');

      // 2. 이벤트 리스너 설정
      PaymentEventHandler.setupEventListeners(orderData, currentOrder, store, tableNum);
      console.log('✅ 이벤트 리스너 설정 완료');

      // 3. 초기 금액 계산
      PaymentDataService.calculateFinalAmount(orderData.total);
      console.log('✅ 초기 금액 계산 완료');

    } catch (error) {
      console.error('❌ 결제 화면 초기화 실패:', error);
      throw error;
    }
  }

  console.log('✅ renderPay 모듈 로드 완료');
})();
