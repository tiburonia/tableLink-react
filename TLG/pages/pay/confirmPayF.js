/**
 * 결제 확인 처리 모듈 (하위 호환성 래퍼)
 * 새로운 레이어드 아키텍처로 위임
 */

import { tossPaymentService } from './services/tossPaymentService.js';
import { paymentService } from './services/paymentService.js';
import { getUserInfoSafely } from '../../utils/authManager.js';

/**
 * 사용자 정보 가져오기 (레거시 호환)
 */
function getUserInfo() {
  const userInfo = getUserInfoSafely();
  if (userInfo && userInfo.id) {
    return userInfo;
  }
  
  // 추가 레거시 방식 시도
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

/**
 * 메인 결제 확인 함수 (하위 호환성)
 */
async function confirmPay(orderData, pointsUsed, store, currentOrder, finalAmount, couponId = null, couponDiscount = 0, paymentMethod = '카드') {
  console.log('💳 confirmPay 호출 (레거시 호환 모드)');
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
    // 결제 준비 데이터 구성
    console.log('📤 결제 준비 데이터 구성');
    const prepareData = paymentService.prepareTossPaymentData(
      userInfo,
      orderData,
      currentOrder,
      finalAmount,
      paymentMethod
    );

    prepareData.customerName = userInfo.name || '고객';
    prepareData.customerEmail = userInfo.email || 'customer@tablelink.com';

    console.log('💳 Toss Payments 결제 플로우 실행');
    const result = await tossPaymentService.executePaymentFlow(prepareData, paymentMethod);

    console.log('✅ 결제 처리 완료:', result);
    return result;

  } catch (error) {
    console.error('❌ 결제 처리 실패:', error);
    throw error;
  }
}

// 전역 등록 (하위 호환성)
window.confirmPay = confirmPay;

console.log('✅ confirmPayF 모듈 로드 완료 (하위 호환 모드)');
