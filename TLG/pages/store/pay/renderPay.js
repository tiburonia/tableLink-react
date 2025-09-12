/**
 * 결제 페이지 렌더링 모듈 (리팩토링 버전)
 * - 모듈화된 구조
 * - 향상된 스크롤 처리
 * - 개선된 오류 처리
 * - 최적화된 성능
 */

(function() {
  'use strict';

  console.log('🔄 renderPay 모듈 초기화');

  // =================== 데이터 관리 모듈 ===================
  const PaymentDataManager = {
    /**
     * 주문 데이터 정규화 및 검증
     */
    normalizeOrderData(currentOrder, store, tableNum) {
      console.log('📋 주문 데이터 정규화 시작:', { currentOrder, store, tableNum });

      if (!currentOrder || (Array.isArray(currentOrder) && currentOrder.length === 0) || 
          (typeof currentOrder === 'object' && Object.keys(currentOrder).length === 0)) {
        throw new Error('주문 데이터가 없습니다.');
      }

      if (!store?.name) {
        throw new Error('매장 정보가 올바르지 않습니다.');
      }

      const items = this.parseOrderItems(currentOrder, store);
      const total = items.reduce((sum, item) => sum + item.totalPrice, 0);

      const orderData = {
        storeId: store.id || store.store_id,
        storeName: store.name,
        tableNum: tableNum,
        total: total,
        items: items,
        itemCount: items.length
      };

      console.log('✅ 주문 데이터 정규화 완료:', orderData);
      return orderData;
    },

    /**
     * 주문 아이템 파싱
     */
    parseOrderItems(currentOrder, store) {
      const items = [];

      if (Array.isArray(currentOrder)) {
        // TLL 스타일 배열 구조
        currentOrder.forEach((orderItem, index) => {
          const item = this.parseArrayItem(orderItem, index);
          if (item) items.push(item);
        });
      } else if (typeof currentOrder === 'object') {
        // TLG 스타일 객체 구조
        Object.entries(currentOrder).forEach(([name, itemData]) => {
          const item = this.parseObjectItem(name, itemData, store);
          if (item) items.push(item);
        });
      }

      if (items.length === 0) {
        throw new Error('유효한 주문 아이템이 없습니다.');
      }

      return items;
    },

    /**
     * 배열 아이템 파싱
     */
    parseArrayItem(orderItem, index) {
      const name = orderItem.name || `메뉴 ${index + 1}`;
      const price = parseInt(orderItem.price) || 0;
      const quantity = parseInt(orderItem.quantity) || 1;
      const cookStation = orderItem.cook_station || 'KITCHEN'; // cook_station 추가

      if (price <= 0) {
        console.warn(`⚠️ 아이템 "${name}"의 가격이 유효하지 않습니다:`, price);
        return null;
      }

      return {
        name: name,
        price: price,
        quantity: quantity,
        totalPrice: price * quantity,
        cook_station: cookStation // cook_station 추가
      };
    },

    /**
     * 객체 아이템 파싱
     */
    parseObjectItem(name, itemData, store) {
      let price = 0;
      let quantity = 1;
      const cookStation = itemData.cook_station || 'KITCHEN'; // cook_station 추가

      if (typeof itemData === 'number') {
        // 수량만 있는 경우
        quantity = itemData;
        const menuItem = store?.menu?.find(m => m.name === name);
        price = menuItem ? parseInt(menuItem.price) || 0 : 0;
      } else if (typeof itemData === 'object') {
        // 객체 형태인 경우
        price = parseInt(itemData.price || itemData.unitPrice || 0);
        quantity = parseInt(itemData.count || itemData.quantity || itemData.qty || 1);
      }

      if (price <= 0) {
        console.warn(`⚠️ 메뉴 "${name}"의 가격을 찾을 수 없습니다`);
        return null;
      }

      return {
        name: name,
        price: price,
        quantity: quantity,
        totalPrice: price * quantity,
        cook_station: cookStation // cook_station 추가
      };
    }
  };

  // =================== API 서비스 모듈 ===================
  const PaymentAPIService = {
    /**
     * 사용자 포인트 조회
     */
    async fetchUserPoints(storeId) {
      try {
        const userInfo = this.getUserInfo();
        if (!userInfo?.id) return 0;

        const response = await fetch(`/api/regular-levels/user/${userInfo.id}/store/${storeId}/points`);
        if (!response.ok) throw new Error('포인트 조회 실패');

        const data = await response.json();
        return data.points || 0;
      } catch (error) {
        console.warn('⚠️ 포인트 조회 실패:', error);
        return 0;
      }
    },

    /**
     * 사용자 쿠폰 조회
     */
    async fetchUserCoupons() {
      try {
        const userInfo = this.getUserInfo();
        if (!userInfo?.id) return [];

        const response = await fetch(`/api/auth/user/${userInfo.id}`);
        if (!response.ok) throw new Error('쿠폰 조회 실패');

        const data = await response.json();
        return data.user?.coupons?.unused || [];
      } catch (error) {
        console.warn('⚠️ 쿠폰 조회 실패:', error);
        return [];
      }
    },

    /**
     * 사용자 정보 조회
     */
    getUserInfo() {
      try {
        // 쿠키에서 조회
        const cookies = document.cookie.split(';').map(cookie => cookie.trim());
        const userInfoCookie = cookies.find(cookie => cookie.startsWith('userInfo='));

        if (userInfoCookie) {
          const userInfoValue = decodeURIComponent(userInfoCookie.split('=')[1]);
          return JSON.parse(userInfoValue);
        }

        // localStorage에서 조회
        const localStorageUserInfo = localStorage.getItem('userInfo');
        if (localStorageUserInfo) {
          return JSON.parse(localStorageUserInfo);
        }

        // window 객체에서 조회
        if (window.userInfo?.id) {
          return window.userInfo;
        }

        return null;
      } catch (error) {
        console.error('❌ 사용자 정보 파싱 오류:', error);
        return null;
      }
    }
  };

  // =================== UI 렌더링 모듈 ===================
  const PaymentUIRenderer = {
    /**
     * 메인 결제 화면 렌더링
     */
    render(orderData) {
      const main = document.getElementById('main') || document.body;

      main.innerHTML = `
        <div class="payment-page">
          ${this.renderHeader(orderData)}
          ${this.renderMainContent(orderData)}
        </div>
        ${this.renderStyles()}
      `;
    },

    /**
     * 헤더 렌더링
     */
    renderHeader(orderData) {
      return `
        <header class="payment-header">
          <button class="back-btn" id="backBtn">←</button>
          <div class="header-info">
            <h1>결제하기</h1>
            <p>${orderData.storeName} • 테이블 ${orderData.tableNum}</p>
          </div>
        </header>
      `;
    },

    /**
     * 메인 콘텐츠 렌더링
     */
    renderMainContent(orderData) {
      return `
        <main class="payment-main">
          <div class="payment-content">
            ${this.renderOrderSummary(orderData)}
            ${this.renderPointsSection()}
            ${this.renderCouponSection()}
            ${this.renderPaymentMethod()}
            ${this.renderFinalAmount(orderData)}
            ${this.renderPayButton()}
          </div>
        </main>
      `;
    },

    /**
     * 주문 요약 섹션
     */
    renderOrderSummary(orderData) {
      return `
        <section class="order-summary">
          <h2>주문 내역</h2>
          <div class="order-items">
            ${orderData.items.map(item => `
              <div class="order-item">
                <div class="item-info">
                  <span class="item-name">${item.name}</span>
                  <span class="item-quantity">x${item.quantity}</span>
                </div>
                <span class="item-price">${item.price.toLocaleString()}원</span>
              </div>
            `).join('')}
          </div>
          <div class="order-total">
            <span>총 금액</span>
            <span id="orderTotal">${orderData.total.toLocaleString()}원</span>
          </div>
        </section>
      `;
    },

    /**
     * 포인트 사용 섹션
     */
    renderPointsSection() {
      return `
        <section class="points-section">
          <h3>포인트 사용</h3>
          <div class="points-info">
            <span>보유 포인트: <span id="currentPoints">0</span>P</span>
          </div>
          <div class="points-input">
            <input type="number" id="pointsToUse" placeholder="사용할 포인트" min="0" max="0">
            <button id="useAllPoints">전액 사용</button>
          </div>
        </section>
      `;
    },

    /**
     * 쿠폰 사용 섹션
     */
    renderCouponSection() {
      return `
        <section class="coupon-section">
          <h3>쿠폰 사용</h3>
          <select id="couponSelect">
            <option value="">쿠폰 선택</option>
          </select>
          <div class="coupon-discount" id="couponDiscount">0원 할인</div>
        </section>
      `;
    },

    /**
     * 결제 방법 섹션
     */
    renderPaymentMethod() {
      return `
        <section class="payment-method">
          <h3>결제 방법</h3>
          <div class="payment-methods">
            <button class="payment-method-btn active" data-method="카드">카드</button>
            <button class="payment-method-btn" data-method="가상계좌">가상계좌</button>
            <button class="payment-method-btn" data-method="간편결제">간편결제</button>
            <button class="payment-method-btn" data-method="휴대폰">휴대폰</button>
            <button class="payment-method-btn" data-method="계좌이체">계좌이체</button>
            <button class="payment-method-btn" data-method="문화상품권">문화상품권</button>
            <button class="payment-method-btn" data-method="도서문화상품권">도서문화상품권</button>
            <button class="payment-method-btn" data-method="게임문화상품권">게임문화상품권</button>
          </div>
        </section>
      `;
    },

    /**
     * 최종 금액 섹션
     */
    renderFinalAmount(orderData) {
      return `
        <section class="final-amount">
          <h3>최종 결제 금액</h3>
          <div class="amount" id="finalAmount">${orderData.total.toLocaleString()}원</div>
        </section>
      `;
    },

    /**
     * 결제 버튼 렌더링
     */
    renderPayButton() {
      return `
        <section class="payment-button-section">
          <button class="pay-btn" id="payBtn">결제하기</button>
        </section>
      `;
    },



    /**
     * CSS 스타일 렌더링 (데스크톱 전용)
     */
    renderStyles() {
      return `
        <style>
         /* 전체 레이아웃 - 메인 화면과 동일한 비율 */
         * { 
           margin: 0; 
           padding: 0; 
           box-sizing: border-box; 
         }

         body {
           overflow: hidden;
         }

         .payment-page {
           position: fixed;
           top: 0;
           left: 0;
           right: 0;
           bottom: 0;
           width: 100%;
           max-width: 430px;
           margin: 0 auto;
           height: 100vh;
           display: flex;
           flex-direction: column;
           background: #f8fafc;
           font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
         }

         /* 헤더 */
         .payment-header {
           flex-shrink: 0;
           height: 80px;
           background: white;
           display: flex;
           align-items: center;
           padding: 20px;
           border-bottom: 1px solid #e2e8f0;
           box-shadow: 0 2px 4px rgba(0,0,0,0.05);
           z-index: 10;
         }

         .back-btn {
           background: #f1f5f9;
           border: none;
           font-size: 18px;
           padding: 12px 16px;
           border-radius: 8px;
           margin-right: 20px;
           cursor: pointer;
           color: #475569;
           transition: background 0.2s;
         }

         .back-btn:hover { 
           background: #e2e8f0; 
         }

         .header-info h1 {
           font-size: 24px;
           font-weight: 700;
           margin: 0 0 4px 0;
           color: #1e293b;
         }

         .header-info p {
           font-size: 16px;
           color: #64748b;
           margin: 0;
         }

         /* 메인 콘텐츠 - 스크롤 최적화 */
         .payment-main {
           flex: 1;
           overflow-y: auto;
           overflow-x: hidden;
           background: #f8fafc;
           padding: 0;
         }

         .payment-content {
           display: flex;
           flex-direction: column;
           gap: 20px;
           padding: 20px;
           min-height: calc(100vh - 80px);
           padding-bottom: 120px;
         }

         /* 섹션 공통 스타일 */
         .order-summary,
         .points-section,
         .coupon-section,
         .payment-method,
         .final-amount,
         .payment-button-section {
           background: white;
           padding: 24px;
           border-radius: 16px;
           border: 1px solid #e2e8f0;
           box-shadow: 0 2px 6px rgba(0,0,0,0.05);
         }

         .order-summary h2,
         .points-section h3,
         .coupon-section h3,
         .payment-method h3,
         .final-amount h3 {
           font-size: 20px;
           font-weight: 700;
           margin: 0 0 20px 0;
           color: #1e293b;
         }

         /* 주문 내역 */
         .order-items { 
           margin-bottom: 25px; 
         }

         .order-item {
           display: flex;
           justify-content: space-between;
           align-items: center;
           padding: 15px 0;
           border-bottom: 1px solid #f1f5f9;
         }

         .order-item:last-child { 
           border-bottom: none; 
         }

         .item-info {
           display: flex;
           align-items: center;
           gap: 15px;
         }

         .item-name {
           font-weight: 600;
           color: #1e293b;
           font-size: 16px;
         }

         .item-quantity {
           background: #f1f5f9;
           color: #64748b;
           padding: 6px 10px;
           border-radius: 8px;
           font-size: 14px;
           font-weight: 700;
         }

         .item-price {
           font-weight: 700;
           color: #2563eb;
           font-size: 16px;
         }

         .order-total {
           display: flex;
           justify-content: space-between;
           font-weight: 700;
           font-size: 20px;
           border-top: 2px solid #e2e8f0;
           padding-top: 20px;
           color: #1e293b;
         }

         /* 포인트 */
         .points-info {
           margin-bottom: 15px;
           color: #64748b;
           font-weight: 500;
           font-size: 16px;
         }

         .points-input {
           display: flex;
           gap: 15px;
         }

         .points-input input {
           flex: 1;
           padding: 16px 18px;
           border: 2px solid #e2e8f0;
           border-radius: 12px;
           font-size: 16px;
           background: #f8fafc;
           font-weight: 600;
         }

         .points-input input:focus {
           outline: none;
           border-color: #3b82f6;
           background: white;
         }

         .points-input button {
           padding: 16px 24px;
           background: #3b82f6;
           color: white;
           border: none;
           border-radius: 12px;
           cursor: pointer;
           font-weight: 700;
           transition: all 0.2s;
           font-size: 16px;
         }

         .points-input button:hover { 
           background: #2563eb; 
         }

         /* 쿠폰 */
         .coupon-section select {
           width: 100%;
           padding: 16px 18px;
           border: 2px solid #e2e8f0;
           border-radius: 12px;
           margin-bottom: 15px;
           font-size: 16px;
           background: #f8fafc;
           font-weight: 600;
         }

         .coupon-section select:focus {
           outline: none;
           border-color: #3b82f6;
           background: white;
         }

         .coupon-discount {
           color: #059669;
           font-weight: 700;
           font-size: 16px;
         }

         /* 결제 방법 */
         .payment-methods {
           display: grid;
           grid-template-columns: repeat(4, 1fr);
           gap: 15px;
         }

         .payment-method-btn {
           padding: 16px 12px;
           border: 2px solid #e2e8f0;
           background: #f8fafc;
           border-radius: 12px;
           cursor: pointer;
           font-weight: 600;
           font-size: 14px;
           color: #475569;
           transition: all 0.2s;
           text-align: center;
         }

         .payment-method-btn:hover {
           border-color: #3b82f6;
           background: white;
         }

         .payment-method-btn.active {
           border-color: #3b82f6;
           background: #eff6ff;
           color: #1d4ed8;
         }

         /* 최종 금액 */
         .final-amount {
           background: linear-gradient(135deg, #f8fafc, #f1f5f9);
           border: 2px solid #e2e8f0;
           text-align: center;
         }

         .final-amount .amount {
           font-size: 32px;
           font-weight: 900;
           color: #2563eb;
         }

         /* 결제 버튼 섹션 */
         .payment-button-section {
           background: white;
           padding: 24px;
           border-radius: 16px;
           margin-bottom: 40px;
           border: 2px solid #059669;
           box-shadow: 0 4px 12px rgba(5, 150, 105, 0.15);
           position: relative;
           z-index: 10;
         }

         /* 결제 버튼 */
         .pay-btn {
           width: 100%;
           padding: 20px;
           background: linear-gradient(135deg, #059669 0%, #047857 100%);
           color: white;
           border: none;
           border-radius: 16px;
           font-size: 20px;
           font-weight: 800;
           cursor: pointer;
           box-shadow: 0 4px 12px rgba(5, 150, 105, 0.25);
           transition: all 0.2s;
           min-height: 60px;
         }

         .pay-btn:hover {
           transform: translateY(-2px);
           box-shadow: 0 6px 20px rgba(5, 150, 105, 0.35);
         }

         .pay-btn:active { 
           transform: translateY(0); 
         }

        </style>
      `;
    }
  };

  // =================== 상태 관리 모듈 ===================
  const PaymentStateManager = {
    state: {
      orderData: null,
      userPoints: 0,
      coupons: [],
      selectedCoupon: null,
      pointsUsed: 0,
      paymentMethod: '카드'
    },

    /**
     * 상태 초기화
     */
    initialize(orderData) {
      this.state.orderData = orderData;
      this.state.pointsUsed = 0;
      this.state.selectedCoupon = null;
      this.state.paymentMethod = '카드';
    },

    /**
     * 포인트 설정
     */
    setPoints(points) {
      this.state.userPoints = points;
      const pointsElement = document.getElementById('currentPoints');
      const pointsInput = document.getElementById('pointsToUse');

      if (pointsElement) {
        pointsElement.textContent = points.toLocaleString();
      }

      if (pointsInput) {
        pointsInput.max = points;
      }
    },

    /**
     * 쿠폰 설정
     */
    setCoupons(coupons) {
      this.state.coupons = coupons;
      this.updateCouponUI(coupons);
    },

    /**
     * 쿠폰 UI 업데이트
     */
    updateCouponUI(coupons) {
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

    /**
     * 최종 금액 계산
     */
    calculateFinalAmount() {
      const pointsUsed = parseInt(document.getElementById('pointsToUse')?.value || 0);
      const couponDiscount = parseInt(document.getElementById('couponDiscount')?.textContent?.replace(/[^\d]/g, '') || 0);

      const finalAmount = Math.max(0, this.state.orderData.total - pointsUsed - couponDiscount);

      const finalAmountElement = document.getElementById('finalAmount');
      if (finalAmountElement) {
        finalAmountElement.textContent = finalAmount.toLocaleString() + '원';
      }

      return finalAmount;
    }
  };

  // =================== 이벤트 관리 모듈 ===================
  const PaymentEventManager = {
    /**
     * 모든 이벤트 리스너 설정
     */
    setupAllEventListeners(currentOrder, store, tableNum) {
      this.setupNavigationEvents(store, tableNum);
      this.setupPointsEvents();
      this.setupCouponEvents();
      this.setupPaymentMethodEvents();
      this.setupPaymentEvents(currentOrder, store);
    },

    /**
     * 네비게이션 이벤트
     */
    setupNavigationEvents(store, tableNum) {
      document.getElementById('backBtn')?.addEventListener('click', () => {
        if (typeof renderOrderScreen === 'function') {
          renderOrderScreen(store, tableNum);
        }
      });
    },

    /**
     * 포인트 관련 이벤트
     */
    setupPointsEvents() {
      // 전액 사용 버튼
      document.getElementById('useAllPoints')?.addEventListener('click', () => {
        const currentPoints = PaymentStateManager.state.userPoints;
        const pointsInput = document.getElementById('pointsToUse');
        if (pointsInput) {
          pointsInput.value = currentPoints;
          PaymentStateManager.calculateFinalAmount();
        }
      });

      // 포인트 입력 변경
      document.getElementById('pointsToUse')?.addEventListener('input', (e) => {
        const maxPoints = PaymentStateManager.state.userPoints;
        if (parseInt(e.target.value) > maxPoints) {
          e.target.value = maxPoints;
        }
        PaymentStateManager.calculateFinalAmount();
      });
    },

    /**
     * 쿠폰 관련 이벤트
     */
    setupCouponEvents() {
      document.getElementById('couponSelect')?.addEventListener('change', (e) => {
        const selectedOption = e.target.selectedOptions[0];
        const couponDiscountElement = document.getElementById('couponDiscount');

        if (selectedOption && selectedOption.value && couponDiscountElement) {
          const discountType = selectedOption.dataset.discountType;
          const discountValue = parseInt(selectedOption.dataset.discountValue);
          const minOrderAmount = parseInt(selectedOption.dataset.minOrderAmount || 0);
          const orderTotal = PaymentStateManager.state.orderData.total;

          if (orderTotal >= minOrderAmount) {
            let discount = 0;
            if (discountType === 'PERCENT') {
              discount = Math.floor(orderTotal * discountValue / 100);
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

        PaymentStateManager.calculateFinalAmount();
      });
    },

    /**
     * 결제 방법 선택 이벤트
     */
    setupPaymentMethodEvents() {
      document.querySelectorAll('.payment-method-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
          // 모든 버튼에서 active 클래스 제거
          document.querySelectorAll('.payment-method-btn').forEach(b => b.classList.remove('active'));

          // 클릭된 버튼에 active 클래스 추가
          e.target.classList.add('active');

          // 선택된 결제 방법 저장
          const selectedMethod = e.target.dataset.method;
          PaymentStateManager.state.paymentMethod = selectedMethod;

          console.log('💳 결제 방법 선택됨:', selectedMethod);
        });
      });
    },

    /**
     * 결제 실행 이벤트
     */
    setupPaymentEvents(currentOrder, store) {
      document.getElementById('payBtn')?.addEventListener('click', async () => {
        await this.handlePayment(currentOrder, store);
      });
    },

    /**
     * 결제 처리
     */
    async handlePayment(currentOrder, store) {
      try {
        const orderData = PaymentStateManager.state.orderData;
        const pointsUsed = parseInt(document.getElementById('pointsToUse')?.value || 0);
        const selectedCoupon = document.getElementById('couponSelect');
        const couponId = selectedCoupon?.value || null;
        const couponDiscount = parseInt(document.getElementById('couponDiscount')?.textContent?.replace(/[^\d]/g, '') || 0);

        // 선택된 결제 방법 가져오기
        const selectedMethodElement = document.querySelector('.payment-method-btn.active');
        const selectedPaymentMethod = selectedMethodElement?.dataset.method || '카드';

        const finalAmount = PaymentStateManager.calculateFinalAmount();

        if (finalAmount <= 0) {
          alert('결제 금액이 0원 이하입니다.');
          return;
        }

        console.log('💳 선택된 결제 방법:', selectedPaymentMethod);
        console.log('💳 토스페이먼츠 결제 요청:', { selectedPaymentMethod, finalAmount });

        // 토스페이먼츠 결제 방식 매핑 (정확한 토스페이먼츠 API 파라미터로 매핑)
        const tossPaymentMethodMap = {
          '카드': '카드',
          '가상계좌': '가상계좌', 
          '간편결제': '간편결제',
          '휴대폰': '휴대폰',
          '계좌이체': '계좌이체',
          '문화상품권': '문화상품권',
          '도서문화상품권': '도서문화상품권',
          '게임문화상품권': '게임문화상품권'
        };

        const tossMethod = tossPaymentMethodMap[selectedPaymentMethod] || '카드';

        console.log('💳 매핑된 토스 결제 방법:', tossMethod);

        // 결제 확인 함수 호출
        if (typeof confirmPay === 'function') {
          // confirmPay 함수에 cook_station 정보 전달
          await confirmPay(orderData, pointsUsed, store, currentOrder, finalAmount, couponId, couponDiscount, tossMethod);
        } else {
          throw new Error('결제 처리 함수를 찾을 수 없습니다.');
        }

      } catch (error) {
        console.error('❌ 결제 처리 오류:', error);
        alert('결제 처리 중 오류가 발생했습니다: ' + error.message);
      }
    }
  };

  // =================== 모듈 로더 ===================
  const ModuleLoader = {
    /**
     * 필수 모듈들 로드
     */
    async loadRequiredModules() {
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
          await this.loadModule(module);
        } else {
          console.log(`✅ ${module.name} 모듈 이미 로드됨`);
        }
      }
    },

    /**
     * 개별 모듈 로드
     */
    async loadModule(module) {
      try {
        console.log(`🔄 ${module.name} 모듈 로드 중...`);

        await new Promise((resolve, reject) => {
          const script = document.createElement('script');
          script.src = module.path;
          script.async = false;
          script.onload = resolve;
          script.onerror = reject;
          document.head.appendChild(script);
        });

        // 모듈 등록 시간 확보
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
    }
  };

  // =================== 메인 결제 함수 ===================
  window.renderPay = async function(currentOrder, store, tableNum) {
    console.log('💳 결제 화면 렌더링 시작 - 매장:', store?.name || store, '테이블:', tableNum);

    try {
      // 1. 사용자 인증 확인
      const userInfo = PaymentAPIService.getUserInfo();
      if (!userInfo?.id) {
        console.error('❌ 사용자 정보가 없습니다 - 로그인 필요');
        alert('로그인이 필요합니다.');
        if (typeof renderLogin === 'function') {
          renderLogin();
        }
        return;
      }

      console.log('✅ 사용자 정보 확인:', userInfo.name || userInfo.id);

      // 2. 필수 모듈 로딩
      await ModuleLoader.loadRequiredModules();

      // 3. 토스페이먼츠 초기화 확인
      if (typeof window.initTossPayments === 'function') {
        try {
          await window.initTossPayments();
          console.log('✅ 토스페이먼츠 초기화 완료');
        } catch (error) {
          console.warn('⚠️ 토스페이먼츠 초기화 실패:', error);
        }
      }

      // 4. 주문 데이터 정규화
      const orderData = PaymentDataManager.normalizeOrderData(currentOrder, store, tableNum);

      // 5. 상태 초기화
      PaymentStateManager.initialize(orderData);

      // 6. UI 렌더링
      PaymentUIRenderer.render(orderData);

      // 7. 데이터 로딩 및 이벤트 설정
      await Promise.all([
        PaymentAPIService.fetchUserPoints(orderData.storeId).then(points => {
          PaymentStateManager.setPoints(points);
        }),
        PaymentAPIService.fetchUserCoupons().then(coupons => {
          PaymentStateManager.setCoupons(coupons);
        })
      ]);

      // 8. 이벤트 리스너 설정
      PaymentEventManager.setupAllEventListeners(currentOrder, store, tableNum);

      // 9. 초기 금액 계산
      PaymentStateManager.calculateFinalAmount();

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

  console.log('✅ renderPay 모듈 리팩토링 완료');
})();