
async function confirmPay(orderData, usedPoint, store, currentOrder, finalTotal, selectedCouponId, couponDiscount) {
  // 결제 버튼 비활성화 및 로딩 상태
  const confirmBtn = document.getElementById('confirmPay');
  const originalBtnContent = confirmBtn.innerHTML;
  
  confirmBtn.disabled = true;
  confirmBtn.innerHTML = `
    <div style="display: flex; align-items: center; justify-content: center; gap: 8px;">
      <div style="width: 20px; height: 20px; border: 2px solid rgba(255,255,255,0.3); border-top: 2px solid white; border-radius: 50%; animation: spin 1s linear infinite;"></div>
      <span>결제 처리 중...</span>
    </div>
    <style>
      @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }
    </style>
  `;

  try {
    console.log('💳 결제 처리 시작:', {
      orderData,
      usedPoint,
      finalTotal,
      storeId: store?.id,
      storeName: store?.name
    });

    // 서버에 결제 요청
    const response = await fetch('/api/orders/pay', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userId: userInfo.id,
        storeId: store?.id || orderData.storeId,
        storeName: store?.name || orderData.store,
        tableNumber: orderData.tableNum,
        orderData: orderData,
        usedPoint: usedPoint,
        finalTotal: finalTotal,
        selectedCouponId: selectedCouponId,
        couponDiscount: couponDiscount
      })
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || '결제 처리 중 오류가 발생했습니다');
    }

    console.log('✅ 서버 결제 처리 완료:', data);

    // 클라이언트 userInfo 업데이트 - 매장별 포인트 시스템으로 변경
    // 기존 전체 포인트 방식은 더 이상 사용하지 않음

    // 쿠폰 처리
    if (selectedCouponId) {
      const idx = userInfo.coupons.unused.findIndex(c => c.id == selectedCouponId);
      if (idx !== -1) {
        const usedCoupon = userInfo.coupons.unused.splice(idx, 1)[0];
        userInfo.coupons.used.push(usedCoupon);
      }
    }

    // 주문 내역 추가
    const orderRecord = {
      ...orderData,
      orderId: data.result.orderId,
      total: orderData.total,
      usedPoint: data.result.appliedPoint,
      couponDiscount: couponDiscount,
      totalDiscount: data.result.totalDiscount,
      couponUsed: selectedCouponId || null,
      realTotal: data.result.finalTotal,
      earnedPoint: data.result.earnedPoint,
      paymentStrategy: (couponDiscount > 0 || data.result.appliedPoint > 0)
        ? (couponDiscount >= data.result.appliedPoint ? "couponFirst" : "pointFirst")
        : "none"
    };

    if (!userInfo.orderList) {
      userInfo.orderList = [];
    }
    userInfo.orderList.push(orderRecord);

    // 캐시에 업데이트된 사용자 정보 저장
    if (window.cacheManager) {
      window.cacheManager.setUserInfo(userInfo);
      console.log('💳 결제 완료 후 사용자 정보 캐시 업데이트 완료');
    }

    // 성공 모달 표시
    showPaymentSuccessModal(data.result, selectedCouponId);

    // 웰컴 쿠폰이 발급된 경우
    if (data.result.welcomeCoupon) {
      if (!userInfo.coupons) {
        userInfo.coupons = { unused: [], used: [] };
      }
      userInfo.coupons.unused.push(data.result.welcomeCoupon);
      
      // 웰컴 쿠폰 알림 추가
      setTimeout(() => {
        showWelcomeCouponModal();
      }, 2000);
    }

    // 테이블 점유 상태 설정 (주문이 확정되었으므로)
    if (store?.id && orderData.tableNum) {
      try {
        console.log(`🔍 테이블 점유 요청 준비: 매장 ID ${store.id}, 테이블 이름: "${orderData.tableNum}"`);

        const occupyResponse = await fetch('/api/tables/occupy', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            storeId: store.id,
            tableName: orderData.tableNum
          })
        });

        if (occupyResponse.ok) {
          const occupyData = await occupyResponse.json();
          console.log('✅ 테이블 점유 상태 설정 성공:', occupyData.message);
        } else {
          const occupyError = await occupyResponse.json();
          console.warn('⚠️ 테이블 점유 상태 설정 실패:', occupyError.error);
        }
      } catch (error) {
        console.error('❌ 테이블 점유 API 호출 실패:', error);
      }
    } else {
      console.log(`⚠️ 테이블 점유 설정 건너뜀: storeId=${store?.id}, tableNum=${orderData.tableNum}`);
    }

    // 초기화
    for (const key in currentOrder) delete currentOrder[key];

    // 장바구니 위젯 숨기기 및 장바구니 초기화
    if (typeof savedCart !== 'undefined') {
      savedCart = {};
    }
    if (typeof renderCartWidget === 'function') {
      renderCartWidget();
    }

    // 3초 후 메인으로 이동
    setTimeout(() => {
      renderMap();
    }, 3000);

  } catch (error) {
    console.error('결제 처리 오류:', error);
    
    // 에러 모달 표시
    showPaymentErrorModal(error.message);
    
    // 버튼 복원
    confirmBtn.disabled = false;
    confirmBtn.innerHTML = originalBtnContent;
  }
}

// 결제 성공 모달
function showPaymentSuccessModal(result, selectedCouponId) {
  const modal = document.createElement('div');
  modal.className = 'payment-modal-overlay';
  
  const usedCouponName = selectedCouponId 
    ? userInfo.coupons?.used?.find(c => c.id == selectedCouponId)?.name || '쿠폰'
    : null;

  modal.innerHTML = `
    <div class="payment-modal success">
      <div class="modal-icon success">
        <svg viewBox="0 0 24 24" width="48" height="48" fill="none" stroke="currentColor" stroke-width="2">
          <path d="m9 12 2 2 4-4"/>
          <circle cx="12" cy="12" r="10"/>
        </svg>
      </div>
      <h2>결제 완료!</h2>
      <div class="payment-details">
        <div class="detail-row">
          <span>최종 결제 금액</span>
          <span class="amount">${result.finalTotal.toLocaleString()}원</span>
        </div>
        ${result.appliedPoint > 0 ? `
        <div class="detail-row">
          <span>사용된 포인트</span>
          <span class="used-point">-${result.appliedPoint.toLocaleString()}원</span>
        </div>
        ` : ''}
        ${result.totalDiscount > result.appliedPoint ? `
        <div class="detail-row">
          <span>쿠폰 할인</span>
          <span class="discount">-${(result.totalDiscount - result.appliedPoint).toLocaleString()}원</span>
        </div>
        ` : ''}
        <div class="detail-row">
          <span>적립된 포인트</span>
          <span class="earned">+${result.earnedPoint.toLocaleString()}원</span>
        </div>
      </div>
      ${usedCouponName ? `<p class="coupon-used">🎫 사용된 쿠폰: ${usedCouponName}</p>` : ''}
      <p class="auto-close">3초 후 자동으로 메인화면으로 이동합니다</p>
    </div>
    <style>
      .payment-modal-overlay {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0, 0, 0, 0.6);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 10000;
        backdrop-filter: blur(4px);
      }

      .payment-modal {
        background: white;
        padding: 32px;
        border-radius: 24px;
        max-width: 360px;
        width: 90%;
        text-align: center;
        box-shadow: 0 20px 60px rgba(0, 0, 0, 0.2);
        animation: modalSlideUp 0.3s ease-out;
      }

      @keyframes modalSlideUp {
        from {
          opacity: 0;
          transform: translateY(30px) scale(0.9);
        }
        to {
          opacity: 1;
          transform: translateY(0) scale(1);
        }
      }

      .modal-icon {
        width: 80px;
        height: 80px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        margin: 0 auto 24px auto;
      }

      .modal-icon.success {
        background: linear-gradient(135deg, #10b981 0%, #059669 100%);
        color: white;
      }

      .modal-icon.error {
        background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
        color: white;
      }

      .payment-modal h2 {
        margin: 0 0 24px 0;
        font-size: 24px;
        font-weight: 700;
        color: #1e293b;
      }

      .payment-details {
        background: #f8fafc;
        border-radius: 16px;
        padding: 20px;
        margin-bottom: 20px;
      }

      .detail-row {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 12px;
        font-size: 15px;
      }

      .detail-row:last-child {
        margin-bottom: 0;
        border-top: 2px solid #e2e8f0;
        padding-top: 12px;
      }

      .detail-row span:first-child {
        color: #64748b;
        font-weight: 500;
      }

      .amount {
        font-size: 18px;
        font-weight: 800;
        color: #1e293b;
      }

      .used-point, .discount {
        color: #ef4444;
        font-weight: 700;
      }

      .earned {
        color: #10b981;
        font-weight: 700;
      }

      .coupon-used {
        background: rgba(59, 130, 246, 0.1);
        color: #1d4ed8;
        padding: 12px;
        border-radius: 12px;
        font-size: 14px;
        font-weight: 600;
        margin-bottom: 16px;
      }

      .auto-close {
        color: #64748b;
        font-size: 13px;
        margin: 16px 0 0 0;
      }

      .error-message {
        color: #dc2626;
        font-weight: 500;
        margin-bottom: 20px;
        font-size: 15px;
      }

      .retry-btn {
        background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
        color: white;
        border: none;
        padding: 12px 24px;
        border-radius: 12px;
        font-weight: 700;
        cursor: pointer;
        margin-top: 16px;
      }
    </style>
  `;

  document.body.appendChild(modal);

  // 3초 후 모달 제거
  setTimeout(() => {
    modal.remove();
  }, 3000);
}

// 결제 에러 모달
function showPaymentErrorModal(errorMessage) {
  const modal = document.createElement('div');
  modal.className = 'payment-modal-overlay';
  
  modal.innerHTML = `
    <div class="payment-modal error">
      <div class="modal-icon error">
        <svg viewBox="0 0 24 24" width="48" height="48" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="12" cy="12" r="10"/>
          <line x1="15" y1="9" x2="9" y2="15"/>
          <line x1="9" y1="9" x2="15" y2="15"/>
        </svg>
      </div>
      <h2>결제 실패</h2>
      <p class="error-message">${errorMessage}</p>
      <button class="retry-btn" onclick="this.parentElement.parentElement.remove()">
        다시 시도
      </button>
    </div>
  `;

  document.body.appendChild(modal);

  // 클릭으로 닫기
  modal.addEventListener('click', (e) => {
    if (e.target === modal) {
      modal.remove();
    }
  });
}

// 웰컴 쿠폰 모달
function showWelcomeCouponModal() {
  const modal = document.createElement('div');
  modal.className = 'payment-modal-overlay';
  
  modal.innerHTML = `
    <div class="payment-modal success">
      <div class="modal-icon success">
        <span style="font-size: 32px;">🎉</span>
      </div>
      <h2>첫 주문 축하합니다!</h2>
      <p style="color: #10b981; font-weight: 600; font-size: 16px; margin-bottom: 20px;">
        10% 할인 쿠폰이 발급되었습니다
      </p>
      <button class="retry-btn" onclick="this.parentElement.parentElement.remove()">
        확인
      </button>
    </div>
  `;

  document.body.appendChild(modal);

  // 클릭으로 닫기
  modal.addEventListener('click', (e) => {
    if (e.target === modal) {
      modal.remove();
    }
  });
}

window.confirmPay = confirmPay;
