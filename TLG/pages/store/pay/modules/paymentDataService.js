
/**
 * 결제 데이터 처리 서비스 모듈
 */

import { getUserInfoSafely } from '../../../../utils/authManager.js';

export class PaymentDataService {
  /**
   * 주문 데이터 준비
   */
  static prepareOrderData(currentOrder, store, tableNum) {
    // 매장 메뉴 데이터 안전하게 처리
    let menuData = [];
    if (store.menu && Array.isArray(store.menu)) {
      menuData = store.menu;
    } else if (typeof store.menu === 'string') {
      try {
        menuData = JSON.parse(store.menu);
      } catch (error) {
        console.warn('⚠️ 매장 메뉴 JSON 파싱 실패:', error);
        menuData = [];
      }
    }

    // 주문 아이템 처리
    let total = 0;
    const items = [];
    
    for (const name in currentOrder) {
      const qty = currentOrder[name];
      const menu = menuData.find(m => m.name === name);
      
      if (!menu) {
        console.warn(`⚠️ 메뉴 "${name}"를 찾을 수 없습니다`);
        continue;
      }
      
      const price = menu.price * qty;
      total += price;
      items.push({ name, qty, price: menu.price, totalPrice: price });
    }

    return {
      store: store.name,
      storeId: store.id,
      date: new Date().toLocaleString(),
      table: tableNum,
      tableNum: tableNum,
      items,
      total
    };
  }

  /**
   * 매장별 포인트 로드
   */
  static async loadStorePoint(storeId) {
    const userInfo = getUserInfoSafely();
    if (!userInfo || !userInfo.id) {
      console.error('❌ 사용자 정보가 없습니다');
      document.getElementById('storePointDisplay').textContent = '로그인 필요';
      return;
    }

    const userId = userInfo.id;
    console.log(`💰 사용자 ${userId}의 매장 ${storeId} 포인트 조회 중...`);

    try {
      const response = await fetch(`/api/regular-levels/user/${userId}/store/${storeId}/points`);
      const data = await response.json();

      if (data.success && data.points !== undefined) {
        const points = data.points || 0;
        console.log(`✅ 매장 포인트 조회 완료: ${points}P`);
        
        this.updatePointUI(points);
      } else {
        console.log('ℹ️ 사용 가능한 포인트가 없습니다');
        document.getElementById('storePointDisplay').textContent = '0P';
      }
    } catch (error) {
      console.error('❌ 포인트 조회 실패:', error);
      document.getElementById('storePointDisplay').textContent = '조회 실패';
    }
  }

  /**
   * 포인트 UI 업데이트
   */
  static updatePointUI(points) {
    document.getElementById('storePointDisplay').textContent = `${points.toLocaleString()}P`;

    const usePointInput = document.getElementById('usePoint');
    const maxPointBtn = document.getElementById('maxPointBtn');

    if (points > 0) {
      const orderTotal = parseInt(document.querySelector('.subtotal-amount').textContent.replace(/[,원]/g, ''));
      usePointInput.max = Math.min(points, orderTotal);
      usePointInput.disabled = false;
      maxPointBtn.disabled = false;
    }
  }

  /**
   * 쿠폰 로드
   */
  static async loadCoupons() {
    const userInfo = getUserInfoSafely();
    if (!userInfo || !userInfo.id) {
      document.getElementById('couponList').innerHTML = '<p>로그인이 필요합니다</p>';
      console.warn('⚠️ 쿠폰 로드: 사용자 정보를 찾을 수 없습니다.');
      return;
    }

    const userId = userInfo.id;
    console.log(`🎫 사용자 ${userId}의 쿠폰 조회 중...`);

    try {
      const response = await fetch(`/api/auth/user/${userId}`);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();

      if (data.success && data.user?.coupons?.unused?.length > 0) {
        console.log(`✅ 사용 가능한 쿠폰 ${data.user.coupons.unused.length}개 발견`);
        this.renderCoupons(data.user.coupons.unused);
      } else {
        console.log('ℹ️ 사용 가능한 쿠폰이 없습니다');
        document.getElementById('couponList').innerHTML = '<p>사용 가능한 쿠폰이 없습니다</p>';
      }
    } catch (error) {
      console.error('❌ 쿠폰 조회 실패:', error);
      document.getElementById('couponList').innerHTML = '<p>쿠폰 조회 실패</p>';
    }
  }

  /**
   * 쿠폰 렌더링
   */
  static renderCoupons(coupons) {
    const couponSelect = document.createElement('select');
    couponSelect.id = 'couponSelect';

    couponSelect.innerHTML = `
      <option value="">쿠폰을 선택하세요</option>
      ${coupons.map(coupon => `
        <option value="${coupon.id}" data-discount="${coupon.discountValue || coupon.discount_amount || 0}">
          ${coupon.name} - ${(coupon.discountValue || coupon.discount_amount || 0).toLocaleString()}원 할인
        </option>
      `).join('')}
    `;

    document.getElementById('couponList').appendChild(couponSelect);
  }

  /**
   * 최종 금액 계산
   */
  static calculateFinalAmount(orderTotal) {
    const usePointInput = document.getElementById('usePoint');
    const usePoint = parseInt(usePointInput.value) || 0;
    const maxUsable = Math.min(parseInt(usePointInput.max) || 0, orderTotal);

    // 포인트 사용량 실시간 제한
    const validatedPoints = Math.min(usePoint, maxUsable);
    if (usePoint !== validatedPoints) {
      usePointInput.value = validatedPoints;
    }

    const couponSelect = document.getElementById('couponSelect');
    const couponDiscount = couponSelect ? 
      parseInt(couponSelect.selectedOptions[0]?.dataset.discount) || 0 : 0;

    const totalDiscount = validatedPoints + couponDiscount;
    const finalAmount = Math.max(0, orderTotal - totalDiscount);

    // UI 업데이트
    this.updateAmountDisplay(totalDiscount, finalAmount, validatedPoints, couponDiscount);

    return { validatedPoints, couponDiscount, finalAmount };
  }

  /**
   * 금액 표시 업데이트
   */
  static updateAmountDisplay(totalDiscount, finalAmount, validatedPoints, couponDiscount) {
    // 할인 행 표시/숨김
    const discountRow = document.getElementById('discountRow');
    if (totalDiscount > 0) {
      discountRow.style.display = 'flex';
      document.getElementById('discountAmount').textContent = `-${totalDiscount.toLocaleString()}원`;

      if (validatedPoints > 0 && couponDiscount > 0) {
        document.getElementById('discountLabel').textContent = '포인트 + 쿠폰 할인';
      } else if (validatedPoints > 0) {
        document.getElementById('discountLabel').textContent = '포인트 할인';
      } else {
        document.getElementById('discountLabel').textContent = '쿠폰 할인';
      }
    } else {
      discountRow.style.display = 'none';
    }

    // 최종 금액 업데이트
    document.getElementById('finalAmount').textContent = `${finalAmount.toLocaleString()}원`;
    document.getElementById('payBtnAmount').textContent = `${finalAmount.toLocaleString()}원`;

    // 적립 포인트 업데이트
    const earnedPoints = Math.floor(finalAmount * 0.1);
    document.getElementById('pointEarned').textContent = `+${earnedPoints.toLocaleString()}P`;
  }
}
