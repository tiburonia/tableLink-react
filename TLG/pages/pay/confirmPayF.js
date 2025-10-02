/**
 * 결제 확인 처리 모듈 (새로운 prepare-confirm 시스템)
 */

// 사용자 정보 가져오기
function getUserInfo() {
  try {
    const cookies = document.cookie.split(';').map(cookie => cookie.trim());
    const userInfoCookie = cookies.find(cookie => cookie.startsWith('userInfo='));

    if (userInfoCookie) {
      const userInfoValue = decodeURIComponent(userInfoCookie.split('=')[1]);
      return JSON.parse(userInfoValue);
    }

    const localStorageUserInfo = localStorage.getItem('userInfo');
    if (localStorageUserInfo) {
      return JSON.parse(localStorageUserInfo);
    }

    if (window.userInfo && window.userInfo.id) {
      return window.userInfo;
    }

    return null;
  } catch (error) {
    console.error('❌ 사용자 정보 파싱 오류:', error);
    return null;
  }
}

// 메인 결제 확인 함수
async function confirmPay(orderData, pointsUsed, store, currentOrder, finalAmount, couponId = null, couponDiscount = 0, paymentMethod = '카드') {
  console.log('💳 새로운 결제 시스템 - 결제 확인 처리 시작');
  console.log('📋 결제 파라미터:', { 
    orderData, 
    pointsUsed, 
    finalAmount, 
    paymentMethod,
    storeName: store?.name || orderData?.storeName 
  });

  const userInfo = getUserInfo();
  if (!userInfo || !userInfo.id) {
    throw new Error('로그인 정보를 찾을 수 없습니다. 다시 로그인해주세요.');
  }

  try {
    // 토스페이먼츠 모듈 로드 확인
    if (!window.requestTossPayment) {
      console.log('🔄 토스페이먼츠 모듈 로드 중...');
      await import('/TLG/pages/store/pay/tossPayments.js');

      await new Promise(resolve => setTimeout(resolve, 1000));

      if (!window.requestTossPayment) {
        throw new Error('토스페이먼츠 모듈을 로드할 수 없습니다.');
      }
    }

    // 1. 서버에 결제 준비 요청 (/api/toss/prepare)
    console.log('📋 서버에 결제 준비 요청 시작');

    // 아이템 배열 준비 - 우선순위: currentOrder > orderData.items
    let itemsArray = [];
    
    if (Array.isArray(currentOrder) && currentOrder.length > 0) {
      itemsArray = currentOrder;
      console.log('📋 currentOrder 배열 사용:', currentOrder.length, '개');
    } else if (Array.isArray(orderData.items) && orderData.items.length > 0) {
      itemsArray = orderData.items;
      console.log('📋 orderData.items 배열 사용:', orderData.items.length, '개');
    } else {
      console.error('❌ 유효한 아이템 배열을 찾을 수 없음:', { currentOrder, orderData_items: orderData.items });
      throw new Error('주문 아이템 정보가 없습니다.');
    }
    
    console.log('📋 confirmPay - 최종 아이템 배열:', {
      길이: itemsArray.length,
      첫번째아이템: itemsArray[0],
      전체아이템: itemsArray
    });

    // cook_station을 jsonb 형태로 전송하도록 수정
    const prepareData = {
      userPK: parseInt(userInfo.userId), // users.id PK를 정수로 전달
      storeId: orderData.storeId || store?.id || store?.store_id,
      storeName: orderData.storeName || orderData.store || store?.name,
      tableNumber: orderData.tableNum || 1,
      orderData: {
        items: itemsArray.map((item, index) => {
          // menuId 우선순위 처리
          let finalMenuId = null;
          if (item.menuId && !isNaN(parseInt(item.menuId))) {
            finalMenuId = parseInt(item.menuId);
          } else if (item.menu_id && !isNaN(parseInt(item.menu_id))) {
            finalMenuId = parseInt(item.menu_id);
          } else if (item.id && !isNaN(parseInt(item.id))) {
            finalMenuId = parseInt(item.id);
          }

          const processedItem = {
            menuId: finalMenuId,
            menu_id: finalMenuId, // 서버 호환성
            name: item.name || '메뉴명 없음',
            price: parseInt(item.price) || 0,
            quantity: parseInt(item.quantity || item.qty) || 1,
            totalPrice: item.totalPrice || (parseInt(item.price) * parseInt(item.quantity || item.qty || 1)),
            cook_station: item.cook_station || 'KITCHEN'
          };
          
          console.log(`📋 아이템 ${index + 1} 상세 처리:`, {
            원본아이템: {
              name: item.name,
              menuId: item.menuId,
              menu_id: item.menu_id,
              id: item.id,
              cook_station: item.cook_station,
              price: item.price,
              quantity: item.quantity
            },
            처리결과: processedItem,
            menuId변환: `${item.menuId} -> ${finalMenuId}`,
            cook_station유지: `${item.cook_station} -> ${processedItem.cook_station}`
          });
          
          return processedItem;
        }),
        total: orderData.total || finalAmount,
        storeName: orderData.storeName || orderData.store || store?.name,
        // cook_station을 jsonb 형태로 구성
        cook_station: {
          stations: itemsArray.filter(item => item.cook_station !== 'DRINK') // DRINK 제외
            .map(item => item.cook_station || 'KITCHEN')
            .filter((value, index, self) => self.indexOf(value) === index), // 중복 제거
          drink_count: itemsArray.filter(item => item.cook_station === 'DRINK').length,
          total_items: itemsArray.length
        }
      },
      amount: parseInt(finalAmount),
      paymentMethod: paymentMethod || '카드'
    };

    console.log('📤 결제 준비 데이터:', prepareData);

    const prepareResponse = await fetch('/api/toss/prepare', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(prepareData)
    });

    if (!prepareResponse.ok) {
      const errorData = await prepareResponse.json();
      throw new Error(errorData.error || '결제 준비 실패');
    }

    const prepareResult = await prepareResponse.json();
    const generatedOrderId = prepareResult.orderId;

    console.log('✅ 결제 준비 완료, orderId:', generatedOrderId);

    // 2. 토스페이먼츠 결제 요청 (orderId만 URL에 포함)
    console.log('💳 토스페이먼츠 결제 요청 - 결제 방법:', paymentMethod);

    const paymentResult = await window.requestTossPayment({
      amount: finalAmount,
      orderId: generatedOrderId,
      orderName: `${orderData.storeName || orderData.store} 주문`,
      customerName: userInfo.name || '고객',
      customerEmail: userInfo.email || 'customer@tablelink.com',
      successUrl: `${window.location.origin}/toss-success.html`,
      failUrl: `${window.location.origin}/toss-fail.html`
    }, paymentMethod);

    console.log('✅ 토스페이먼츠 결제 결과:', paymentResult);

    if (!paymentResult.success) {
      throw new Error(paymentResult.error || '결제에 실패했습니다.');
    }

  } catch (error) {
    console.error('❌ 결제 처리 중 오류:', error);
    alert(`결제 실패: ${error.message}`);
    throw error;
  }
}

// 전역 함수로 등록
window.confirmPay = confirmPay;

console.log('✅ 새로운 결제 확인 모듈 로드 완료 - confirmPay 전역 등록:', typeof window.confirmPay);