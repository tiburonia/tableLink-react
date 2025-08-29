// 쿠키에서 userInfo를 가져오는 헬퍼 함수
function getUserInfoFromCookie() {
  try {
    // 쿠키에서 userInfo 찾기
    const cookies = document.cookie.split(';').map(cookie => cookie.trim());
    const userInfoCookie = cookies.find(cookie => cookie.startsWith('userInfo='));

    if (userInfoCookie) {
      const userInfoValue = decodeURIComponent(userInfoCookie.split('=')[1]);
      return JSON.parse(userInfoValue);
    }

    // 쿠키에 없으면 localStorage 확인
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

async function confirmPay(orderData, pointsUsed, store, currentOrder, finalAmount, couponId = null, couponDiscount = 0, paymentMethod = '카드') {
  console.log('💳 결제 확인 처리 시작');
  console.log('주문 데이터:', orderData);
  console.log('사용 포인트:', pointsUsed);
  console.log('최종 금액:', finalAmount);
  console.log('쿠폰 ID:', couponId);
  console.log('쿠폰 할인:', couponDiscount);

  // userInfo 안전하게 가져오기 (쿠키 우선)
  const userInfo = getUserInfoFromCookie();
  if (!userInfo || !userInfo.id) {
    console.error('❌ 사용자 정보 없음:', {
      cookies: document.cookie,
      localStorage: localStorage.getItem('userInfo'),
      windowUserInfo: window.userInfo
    });
    throw new Error('로그인 정보를 찾을 수 없습니다. 다시 로그인해주세요.');
  }

  console.log('✅ 사용자 정보 확인:', userInfo.id);

  try {
    // 토스페이먼츠 모듈 동적 로드
    if (!window.requestTossPayment) {
      console.log('🔄 토스페이먼츠 모듈 로드 중...');
      await import('/TLG/pages/store/pay/tossPayments.js');

      // 모듈 로드 후 잠시 대기
      await new Promise(resolve => setTimeout(resolve, 500));

      if (!window.requestTossPayment) {
        throw new Error('토스페이먼츠 모듈을 로드할 수 없습니다.');
      }
      console.log('✅ 토스페이먼츠 모듈 로드 완료');
    }

    // 토스페이먼츠 결제 처리
    console.log('💳 토스페이먼츠 결제 시작');

    const orderId = `TLL_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // 주문 데이터를 sessionStorage에 저장 (결제 성공 후 사용)
    const pendingOrderData = {
      userId: userInfo.id,
      storeId: orderData.storeId,
      storeName: orderData.store,
      tableNumber: orderData.tableNum,
      orderData: {
        store: orderData.store,
        storeId: orderData.storeId,
        date: orderData.date,
        table: orderData.table,
        tableNum: orderData.tableNum,
        items: orderData.items,
        total: orderData.total
      },
      usedPoint: pointsUsed || 0,
      finalTotal: finalAmount,
      selectedCouponId: couponId,
      couponDiscount: couponDiscount || 0
    };

    console.log('💾 주문 데이터 sessionStorage 저장:', pendingOrderData);
    sessionStorage.setItem('pendingOrderData', JSON.stringify(pendingOrderData));

    // 결제 방법도 별도 저장
    sessionStorage.setItem('paymentMethod', paymentMethod);

    // 토스페이먼츠 결제창 호출
    const paymentResult = await window.requestTossPayment({
      amount: finalAmount,
      orderId: orderId,
      orderName: `${orderData.store} 주문`,
      customerName: userInfo.name || '고객',
      customerEmail: userInfo.email || 'guest@tablelink.com',
      customerMobilePhone: userInfo.phone || undefined
    }, paymentMethod);

    if (!paymentResult.success) {
      // 결제 실패 시 저장된 주문 데이터 삭제
      sessionStorage.removeItem('pendingOrderData');
      throw new Error(paymentResult.message || '결제가 취소되었습니다.');
    }

    console.log('✅ 토스페이먼츠 결제 성공:', paymentResult);

    // 결제 처리 API 호출 (PG 결제 정보 포함)
    const response = await fetch('/api/orders/pay', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userId: userInfo.id,
        storeId: orderData.storeId,
        storeName: orderData.store,
        tableNumber: orderData.tableNum,
        orderData: {
          store: orderData.store,
          storeId: orderData.storeId,
          date: orderData.date,
          table: orderData.table,
          tableNum: orderData.tableNum,
          items: orderData.items,
          total: orderData.total
        },
        usedPoint: pointsUsed || 0,
        finalTotal: finalAmount,
        selectedCouponId: couponId,
        couponDiscount: couponDiscount || 0,
        // PG 결제 정보 추가
        pgPaymentKey: paymentResult.paymentKey,
        pgOrderId: paymentResult.orderId,
        pgPaymentMethod: paymentResult.method || 'CARD'
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || '결제 처리에 실패했습니다.');
    }

    const result = await response.json();
    console.log('✅ 결제 성공:', result);

    // 성공 페이지 렌더링
    main.innerHTML = `
      <div class="payment-success-container">
        <div class="success-content">
          <div class="success-icon">✅</div>
          <h1 class="success-title">결제 완료!</h1>
          <p class="success-message">주문이 성공적으로 접수되었습니다.</p>

          <div class="order-summary-card">
            <div class="summary-header">
              <h3>주문 내역</h3>
              <span class="order-number">주문번호: ${result.result?.orderId || 'N/A'}</span>
            </div>
            <div class="summary-details">
              <div class="store-info">
                <strong>${orderData.store}</strong>
                <span>테이블 ${orderData.table}</span>
              </div>
              <div class="items-list">
                ${orderData.items.map(item => 
                  `<div class="item-row">
                    <span class="item-name">${item.name} × ${item.qty}</span>
                    <span class="item-price">${item.totalPrice.toLocaleString()}원</span>
                  </div>`
                ).join('')}
              </div>
              <div class="payment-details">
                <div class="detail-row">
                  <span>주문 금액</span>
                  <span>${orderData.total.toLocaleString()}원</span>
                </div>
                ${pointsUsed > 0 ? `
                  <div class="detail-row discount">
                    <span>포인트 사용</span>
                    <span>-${pointsUsed.toLocaleString()}원</span>
                  </div>
                ` : ''}
                ${couponDiscount > 0 ? `
                  <div class="detail-row discount">
                    <span>쿠폰 할인</span>
                    <span>-${couponDiscount.toLocaleString()}원</span>
                  </div>
                ` : ''}
                <div class="detail-row final">
                  <span>최종 결제 금액</span>
                  <span>${finalAmount.toLocaleString()}원</span>
                </div>
              </div>
            </div>
          </div>

          <div class="points-earned-card">
            <div class="points-icon">🎉</div>
            <div class="points-info">
              <h4>포인트 적립</h4>
              <p>${(result.result?.earnedPoint || Math.floor(finalAmount * 0.1)).toLocaleString()}P가 적립되었습니다!</p>
            </div>
          </div>

          <div class="action-buttons">
            <button id="goToMain" class="btn primary">메인으로</button>
            <button id="goToMyPage" class="btn secondary">주문내역 보기</button>
          </div>
        </div>
      </div>

      <style>
        * {
          box-sizing: border-box;
        }

        .payment-success-container {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          width: 100%;
          max-width: 430px;
          margin: 0 auto;
          background: linear-gradient(135deg, #f0f9ff 0%, #e0e7ff 100%);
          overflow-y: auto;
          -webkit-overflow-scrolling: touch;
          padding: 20px;
          box-sizing: border-box;
        }

        .success-content {
          max-width: 500px;
          width: 100%;
          text-align: center;
          padding: 20px;
          margin: 0 auto;
          display: flex;
          flex-direction: column;
          justify-content: flex-start;
          padding-top: 0px;
        }

        .success-icon {
          font-size: 80px;
          margin-bottom: 20px;
          animation: bounce 1s ease-in-out;
        }

        @keyframes bounce {
          0%, 20%, 53%, 80%, 100% {
            animation-timing-function: cubic-bezier(0.215, 0.610, 0.355, 1.000);
            transform: translate3d(0,0,0);
          }
          40%, 43% {
            animation-timing-function: cubic-bezier(0.755, 0.050, 0.855, 0.060);
            transform: translate3d(0, -10px, 0);
          }
          70% {
            animation-timing-function: cubic-bezier(0.755, 0.050, 0.855, 0.060);
            transform: translate3d(0, -5px, 0);
          }
          90% {
            transform: translate3d(0,-1px,0);
          }
        }

        .success-title {
          font-size: 32px;
          font-weight: 700;
          color: #1e293b;
          margin: 0 0 12px 0;
        }

        .success-message {
          font-size: 16px;
          color: #64748b;
          margin: 0 0 30px 0;
          line-height: 1.6;
        }

        .order-summary-card {
          background: white;
          border-radius: 16px;
          padding: 24px;
          margin-bottom: 20px;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
          border: 1px solid rgba(226, 232, 240, 0.8);
          text-align: left;
        }

        .summary-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
          padding-bottom: 12px;
          border-bottom: 2px solid #f1f5f9;
        }

        .summary-header h3 {
          margin: 0;
          font-size: 18px;
          font-weight: 700;
          color: #1e293b;
        }

        .order-number {
          background: #f1f5f9;
          color: #475569;
          padding: 4px 12px;
          border-radius: 12px;
          font-size: 12px;
          font-weight: 600;
        }

        .store-info {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 16px;
          padding: 12px;
          background: #f8fafc;
          border-radius: 8px;
        }

        .store-info strong {
          color: #1e293b;
          font-size: 16px;
        }

        .store-info span {
          color: #64748b;
          font-size: 14px;
          font-weight: 500;
        }

        .items-list {
          margin-bottom: 16px;
        }

        .item-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 8px 0;
          border-bottom: 1px solid #f1f5f9;
        }

        .item-row:last-child {
          border-bottom: none;
        }

        .item-name {
          color: #1e293b;
          font-weight: 500;
        }

        .item-price {
          color: #3b82f6;
          font-weight: 600;
        }

        .payment-details {
          border-top: 2px solid #f1f5f9;
          padding-top: 16px;
        }

        .detail-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 4px 0;
          color: #475569;
        }

        .detail-row.discount {
          color: #059669;
          font-weight: 600;
        }

        .detail-row.final {
          font-size: 18px;
          font-weight: 700;
          color: #1e293b;
          border-top: 1px solid #e2e8f0;
          padding-top: 12px;
          margin-top: 8px;
        }

        .points-earned-card {
          background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
          border-radius: 16px;
          padding: 20px;
          margin-bottom: 30px;
          color: white;
          display: flex;
          align-items: center;
          gap: 16px;
          box-shadow: 0 4px 20px rgba(59, 130, 246, 0.3);
        }

        .points-icon {
          font-size: 32px;
        }

        .points-info h4 {
          margin: 0 0 4px 0;
          font-size: 16px;
          font-weight: 700;
        }

        .points-info p {
          margin: 0;
          font-size: 14px;
          opacity: 0.9;
        }

        .action-buttons {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .btn {
          padding: 16px 24px;
          border: none;
          border-radius: 12px;
          font-size: 16px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
          width: 100%;
        }

        .btn.primary {
          background: linear-gradient(135deg, #059669 0%, #047857 100%);
          color: white;
          box-shadow: 0 4px 16px rgba(5, 150, 105, 0.25);
        }

        .btn.primary:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(5, 150, 105, 0.35);
        }

        .btn.secondary {
          background: white;
          color: #475569;
          border: 2px solid #e2e8f0;
        }

        .btn.secondary:hover {
          background: #f8fafc;
          border-color: #cbd5e1;
        }

        .btn:active {
          transform: translateY(0);
        }

        @media (max-width: 480px) {
          .payment-success-container {
            padding: 12px;
          }

          .success-content {
            padding: 16px;
          }

          .order-summary-card {
            padding: 20px;
          }

          .success-title {
            font-size: 28px;
          }

          .success-icon {
            font-size: 60px;
          }
        }
      </style>
    `;

    // 버튼 이벤트 리스너
    document.getElementById('goToMain').addEventListener('click', () => {
      renderMap();
    });

    document.getElementById('goToMyPage').addEventListener('click', () => {
      renderMyPage();
    });

    console.log('✅ 결제 성공 페이지 렌더링 완료');

  } catch (error) {
    console.error('❌ 결제 처리 실패:', error);

    // 결제 실패 UI 모듈 동적 로드 및 렌더링
    handlePaymentFailure(error, orderData, currentOrder, store);
  }
}

// 결제 실패 처리 함수
async function handlePaymentFailure(error, orderData, currentOrder, store) {
  try {
    // 결제 실패 UI 모듈 동적 로드
    if (!window.renderPaymentFailure) {
      console.log('🔄 결제 실패 UI 모듈 로드 중...');
      await import('/TLG/pages/store/pay/paymentFailureUI.js');
    }

    // 결제 실패 UI 렌더링
    if (typeof window.renderPaymentFailure === 'function') {
      window.renderPaymentFailure(error, orderData, currentOrder, store);
    } else {
      throw new Error('결제 실패 UI 모듈을 로드할 수 없습니다');
    }
  } catch (loadError) {
    console.error('❌ 결제 실패 UI 로드 실패:', loadError);

    // 폴백: 기본 에러 알림
    alert('결제 처리 중 오류가 발생했습니다: ' + error.message);

    // 주문 화면으로 돌아가기
    if (typeof renderOrderScreen === 'function') {
      renderOrderScreen(store, orderData.tableNum);
    } else if (typeof renderMap === 'function') {
      renderMap();
    }
  }
}

// 함수를 전역으로 등록
window.confirmPay = confirmPay;
window.handlePaymentFailure = handlePaymentFailure;

console.log('✅ confirmPay 및 결제 실패 처리 함수가 전역으로 등록되었습니다');