
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
  }
};

// 전역 등록
window.storeTabService = storeTabService;

console.log('✅ storeTabService 모듈 로드 완료');
