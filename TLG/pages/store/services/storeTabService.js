
/**
 * 매장 탭 서비스 - 비즈니스 로직
 */

export const storeTabService = {
  /**
   * 메뉴 데이터 가져오기 및 검증
   */
  async getMenuData(store) {
    if (!store || !store.id) {
      throw new Error('매장 정보가 없습니다');
    }

    let menuData = store.menu;

    // null 또는 undefined 체크
    if (menuData === null || menuData === undefined) {
      console.warn('⚠️ 메뉴 데이터가 null/undefined입니다.');
      return [];
    }

    // 문자열인 경우 JSON 파싱
    if (typeof menuData === 'string') {
      try {
        menuData = JSON.parse(menuData);
        console.log('✅ 메뉴 JSON 파싱 성공');
      } catch (parseError) {
        console.error('❌ 메뉴 JSON 파싱 실패:', parseError);
        throw new Error('메뉴 데이터 형식 오류');
      }
    }

    // 배열이 아닌 경우 배열로 변환
    if (!Array.isArray(menuData)) {
      menuData = [menuData];
    }

    console.log(`✅ 처리된 메뉴 데이터 (개수: ${menuData.length})`);
    return menuData;
  },

  /**
   * 리뷰 데이터 가져오기
   */
  async getReviewData(store) {
    if (!store || !store.id) {
      throw new Error('매장 정보가 없습니다');
    }

    try {
      const response = await fetch(`/api/reviews/stores/${store.id}`);
      if (!response.ok) {
        throw new Error('리뷰 데이터 조회 실패');
      }

      const data = await response.json();
      const reviews = data.reviews || [];

      console.log(`✅ 리뷰 데이터 로드 완료: ${reviews.length}개`);
      return reviews;
    } catch (error) {
      console.error('❌ 리뷰 데이터 로드 실패:', error);
      return [];
    }
  },

  /**
   * 프로모션 데이터 가져오기
   */
  async getPromotions(storeId) {
    if (!storeId) {
      console.warn('⚠️ storeId가 없습니다. 빈 배열 반환');
      return [];
    }

    try {
      // 실제 API 호출
      const response = await fetch(`/api/stores/${storeId}/promotions`);
      
      if (!response.ok) {
        throw new Error('프로모션 데이터 조회 실패');
      }

      const data = await response.json();
      const promotions = data.promotions || [];

      console.log(`✅ 프로모션 데이터 로드 완료: ${promotions.length}개`);
      return promotions;
    } catch (error) {
      console.error('❌ 프로모션 데이터 로드 실패:', error);
      
      // 폴백: 더미 데이터 반환
      console.log('📦 더미 프로모션 데이터 사용');
      return [
        {
          id: 1,
          name: "신규 고객 웰컴 할인",
          description: "첫 방문 고객에게 드리는 특별한 혜택입니다.",
          type: "할인",
          discountRate: "15%",
          minOrderAmount: "10,000원",
          maxDiscount: "5,000원",
          startDate: "2025-01-01",
          endDate: "2025-12-31",
          isActive: true
        },
        {
          id: 2,
          name: "점심 특가 메뉴",
          description: "평일 점심시간 한정 특가 메뉴입니다.",
          type: "할인",
          discountRate: "30%",
          minOrderAmount: "8,000원",
          maxDiscount: "3,000원",
          startDate: "2025-01-01",
          endDate: "2025-12-30",
          isActive: true
        },
        {
          id: 3,
          name: "단골 고객 적립 혜택",
          description: "방문할 때마다 포인트가 쌓입니다.",
          type: "적립",
          discountRate: "5% 적립",
          minOrderAmount: "5,000원",
          maxDiscount: "무제한",
          startDate: "2025-01-01",
          endDate: "2025-12-31",
          isActive: true
        }
      ];
    }
  }
};

// 전역 등록
window.storeTabService = storeTabService;

console.log('✅ storeTabService 모듈 로드 완료');
