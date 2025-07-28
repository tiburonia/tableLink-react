
async function confirmPay(orderData, usedPoint, store, currentOrder, finalTotal, selectedCouponId, couponDiscount) {
  try {
    // 서버에 결제 요청
    const response = await fetch('/api/orders/pay', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userId: userInfo.id,
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

    // 클라이언트 userInfo 업데이트
    userInfo.point = userInfo.point - data.result.appliedPoint + data.result.earnedPoint;
    
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

    // 🆕 캐시에 업데이트된 사용자 정보 저장
    cacheManager.setUserInfo(userInfo);
    console.log('💳 결제 완료 후 사용자 정보 캐시 업데이트 완료');

    let alertMessage = `결제가 완료되었습니다.\n최종 금액: ${data.result.finalTotal.toLocaleString()}원\n포인트 사용: ${data.result.appliedPoint.toLocaleString()}원\n적립 포인트: ${data.result.earnedPoint.toLocaleString()}원\n할인된 금액: ${data.result.totalDiscount.toLocaleString()}원`;
    
    if (selectedCouponId) {
      const usedCouponName = userInfo.coupons?.used?.find(c => c.id == selectedCouponId)?.name || '쿠폰';
      alertMessage += `\n사용된 쿠폰: ${usedCouponName}`;
    }
    
    alert(alertMessage);

    // 테이블 점유 상태 설정 (주문이 확정되었으므로)
    if (orderData.storeId && orderData.tableNum) {
      try {
        // 테이블 번호에서 숫자만 추출 (예: "테이블 1" -> 1, "vip룸 2" -> 2)
        console.log(`🔍 클라이언트 테이블 번호 추출 시작: "${orderData.tableNum}"`);
        
        const numberMatches = orderData.tableNum.match(/\d+/g);
        console.log(`🔍 클라이언트 정규식 매치 결과:`, numberMatches);
        
        const tableNumber = numberMatches && numberMatches.length > 0 ? parseInt(numberMatches[numberMatches.length - 1]) : null;
        console.log(`✅ 클라이언트에서 추출된 테이블 번호: ${tableNumber}`);
        
        console.log(`🔍 테이블 점유 요청 준비: 매장 ID ${orderData.storeId}, 테이블 번호 ${tableNumber}, 원본 테이블명: ${orderData.tableNum}`);
        
        const occupyResponse = await fetch('/api/tables/occupy', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            storeId: orderData.storeId,
            tableNumber: tableNumber
          })
        });

        const occupyData = await occupyResponse.json();
        
        if (occupyResponse.ok) {
          console.log(`🔒 테이블 점유 설정 완료:`, occupyData);
          
          // 테이블 상태 업데이트 후 즉시 렌더스토어 테이블 정보 새로고침
          if (typeof loadTableInfo === 'function' && store) {
            setTimeout(() => {
              loadTableInfo(store);
            }, 500);
          }
        } else {
          console.error('❌ 테이블 점유 설정 실패:', occupyData);
        }
      } catch (error) {
        console.error('❌ 테이블 점유 API 호출 실패:', error);
      }
    } else {
      console.log(`⚠️ 테이블 점유 설정 건너뜀: storeId=${orderData.storeId}, tableNum=${orderData.tableNum}`);
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
