async function confirmPay(orderData, usedPoint, store, currentOrder, finalTotal, selectedCouponId, couponDiscount) {
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
      alert(data.error || '결제 처리 중 오류가 발생했습니다');
      return;
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

    // 웰컴 쿠폰이 발급된 경우
    if (data.result.welcomeCoupon) {
      if (!userInfo.coupons) {
        userInfo.coupons = { unused: [], used: [] };
      }
      userInfo.coupons.unused.push(data.result.welcomeCoupon);
      alert('첫 주문시 10% 할인 쿠폰이 발급되었습니다');
    }

    // 캐시에 업데이트된 사용자 정보 저장
    if (window.cacheManager) {
      window.cacheManager.setUserInfo(userInfo);
      console.log('💳 결제 완료 후 사용자 정보 캐시 업데이트 완료');
    }

    let alertMessage = `결제가 완료되었습니다.\n최종 금액: ${data.result.finalTotal.toLocaleString()}원\n포인트 사용: ${data.result.appliedPoint.toLocaleString()}원\n적립 포인트: ${data.result.earnedPoint.toLocaleString()}원\n할인된 금액: ${data.result.totalDiscount.toLocaleString()}원`;

    if (selectedCouponId) {
      const usedCouponName = userInfo.coupons?.used?.find(c => c.id == selectedCouponId)?.name || '쿠폰';
      alertMessage += `\n사용된 쿠폰: ${usedCouponName}`;
    }

    alert(alertMessage);

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
    renderMap();

    // 장바구니 위젯 숨기기 및 장바구니 초기화
    if (typeof savedCart !== 'undefined') {
      savedCart = {};
    }
    if (typeof renderCartWidget === 'function') {
      renderCartWidget();
    }

  } catch (error) {
    console.error('결제 처리 오류:', error);
    alert('서버 연결에 실패했습니다. 다시 시도해주세요.');
  }
}

window.confirmPay = confirmPay;