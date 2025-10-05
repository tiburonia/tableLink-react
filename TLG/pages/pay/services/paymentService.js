/**
 * Payment Service - 비즈니스 로직 레이어
 * 결제 관련 비즈니스 로직 처리
 */

import { paymentRepository } from '../repositories/paymentRepository.js';

// getUserInfoSafely는 전역 함수로 사용 (authManager.js에서 window에 등록됨)
const getUserInfoSafely = () => window.getUserInfoSafely?.() || window.AuthManager?.getUserInfo?.();

export const paymentService = {
  /**
   * 주문 데이터 준비 및 검증
   */
  prepareOrderData(currentOrder) {
    console.log('📋 주문 데이터 준비 시작');

    // 매장 메뉴 데이터 파싱
    let menuData = this.parseMenuData(currentOrder.items);

    // 주문 아이템 처리
    const items = this.processOrderItems(currentOrder, menuData);
    const total = items.reduce((sum, item) => sum + item.totalPrice, 0);

    return {
      storeId: store.id || store.store_id,
      storeName: store.name,
      store: store.name,
      tableNum: tableNum,
      table: tableNum,
      total: total,
      items: items,
      itemCount: items.length,
      date: new Date().toLocaleString()
    };
  },

  /**
   * 메뉴 데이터 파싱
   */
  parseMenuData(items) {
    if (Array.isArray(items)) {
      return items;
    }

    if (typeof items === 'string') {
      try {
        return JSON.parse(items);
      } catch (error) {
        console.warn('⚠️ 매장 메뉴 JSON 파싱 실패, 빈 배열 반환');
        return [];
      }
    }

    return [];
  },

  /**
   * 주문 아이템 처리
   */
  processOrderItems(currentOrder) {
    if (!currentOrder.items || !Array.isArray(currentOrder.items)) {
      console.error('❌ 유효한 주문 아이템이 없습니다');
      return [];
    }

    return currentOrder.items.map(item => ({
      id: item.id || item.menuId,
      name: item.name,
      price: parseInt(item.price),
      qty: parseInt(item.quantity || item.qty || 1),
      totalPrice: parseInt(item.price) * parseInt(item.quantity || item.qty || 1)
    }));
  },

  /**
   * 배열 아이템 파싱 (TLL 주문용)
   */
  parseArrayItem(orderItem, index) {
    const name = orderItem.name || `메뉴 ${index + 1}`;
    const price = parseInt(orderItem.price) || 0;
    const quantity = parseInt(orderItem.quantity) || 1;
    const cookStation = orderItem.cook_station || 'KITCHEN';
    const menuId = orderItem.menuId || orderItem.menu_id || orderItem.id || null;

    return {
      name,
      qty: quantity,
      price,
      totalPrice: price * quantity,
      menuId,
      cook_station: cookStation
    };
  },

  /**
   * 매장별 포인트 로드
   */
  async loadStorePoints(storeId) {
    const userInfo = getUserInfoSafely();
    if (!userInfo || !userInfo.id) {
      console.error('❌ 사용자 정보가 없습니다');
      return { success: false, points: 0, error: '로그인 필요' };
    }

    const userId = userInfo.id;
    console.log(`💰 사용자 ${userId}의 매장 ${storeId} 포인트 조회 중...`);

    try {
      const data = await paymentRepository.fetchStorePoints(userId, storeId);

      if (data.success && data.points !== undefined) {
        const points = data.points || 0;
        console.log(`✅ 매장 포인트 조회 완료: ${points}P`);
        return { success: true, points };
      } else {
        console.log('ℹ️ 사용 가능한 포인트가 없습니다');
        return { success: true, points: 0 };
      }
    } catch (error) {
      console.error('❌ 포인트 조회 실패:', error);
      return { success: false, points: 0, error: error.message };
    }
  },

  /**
   * 사용자 쿠폰 로드
   */
  async loadUserCoupons() {
    const userInfo = getUserInfoSafely();
    if (!userInfo || !userInfo.id) {
      console.warn('⚠️ 쿠폰 로드: 사용자 정보를 찾을 수 없습니다.');
      return { success: false, coupons: [], error: '로그인 필요' };
    }

    const userId = userInfo.id;
    console.log(`🎫 사용자 ${userId}의 쿠폰 조회 중...`);

    try {
      const data = await paymentRepository.fetchUserCoupons(userId);

      if (data.success && data.user?.coupons?.unused?.length > 0) {
        console.log(`✅ 사용 가능한 쿠폰 ${data.user.coupons.unused.length}개 발견`);
        return { success: true, coupons: data.user.coupons.unused };
      } else {
        console.log('ℹ️ 사용 가능한 쿠폰이 없습니다');
        return { success: true, coupons: [] };
      }
    } catch (error) {
      console.error('❌ 쿠폰 조회 실패:', error);
      return { success: false, coupons: [], error: error.message };
    }
  },

  /**
   * 최종 금액 계산
   */
  calculateFinalAmount(orderTotal, pointsUsed, couponDiscount) {
    const validatedPoints = Math.min(pointsUsed, orderTotal);
    const totalDiscount = validatedPoints + couponDiscount;
    const finalAmount = Math.max(0, orderTotal - totalDiscount);
    const earnedPoints = Math.floor(finalAmount * 0.1);

    return {
      validatedPoints,
      couponDiscount,
      totalDiscount,
      finalAmount,
      earnedPoints
    };
  },

  /**
   * 결제 준비 데이터 구성
   */
  prepareTossPaymentData(userInfo, orderData, currentOrder, finalAmount, paymentMethod) {
    const itemsArray = Array.isArray(currentOrder) && currentOrder.length > 0 
      ? currentOrder 
      : orderData.items;

    if (!itemsArray || itemsArray.length === 0) {
      throw new Error('주문 아이템 정보가 없습니다.');
    }

    const prepareData = {
      userPK: parseInt(userInfo.userId),
      storeId: orderData.storeId,
      storeName: orderData.storeName,
      tableNumber: orderData.tableNum || 1,
      orderData: {
        items: itemsArray.map(item => {
          let finalMenuId = null;
          if (item.menuId && !isNaN(parseInt(item.menuId))) {
            finalMenuId = parseInt(item.menuId);
          } else if (item.menu_id && !isNaN(parseInt(item.menu_id))) {
            finalMenuId = parseInt(item.menu_id);
          } else if (item.id && !isNaN(parseInt(item.id))) {
            finalMenuId = parseInt(item.id);
          }

          return {
            menuId: finalMenuId,
            menu_id: finalMenuId,
            name: item.name || '메뉴명 없음',
            price: parseInt(item.price) || 0,
            quantity: parseInt(item.quantity || item.qty) || 1,
            totalPrice: item.totalPrice || (parseInt(item.price) * parseInt(item.quantity || item.qty || 1)),
            cook_station: item.cook_station || 'KITCHEN'
          };
        }),
        total: orderData.total || finalAmount,
        storeName: orderData.storeName,
        cook_station: {
          stations: itemsArray
            .filter(item => item.cook_station !== 'DRINK')
            .map(item => item.cook_station || 'KITCHEN')
            .filter((value, index, self) => self.indexOf(value) === index),
          drink_count: itemsArray.filter(item => item.cook_station === 'DRINK').length,
          total_items: itemsArray.length
        }
      },
      amount: parseInt(finalAmount),
      paymentMethod: paymentMethod || '카드'
    };

    console.log('📤 결제 준비 데이터:', prepareData);
    return prepareData;
  }
};

console.log('✅ paymentService 모듈 로드 완료');