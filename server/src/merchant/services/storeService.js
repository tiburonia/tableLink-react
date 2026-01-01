const storeRepository = require('../repositories/storeRepository');

/**
 * TLM Store 서비스 - 매장 관련 비즈니스 로직
 */
class MerchantStoreService {
  /**
   * 매장 전체 등록 (트랜잭션으로 모든 테이블에 데이터 생성)
   */
  async createStore(memberId, storeData) {
    console.log('🏪 매장 등록 시작:', { memberId, storeName: storeData.name });

    // 필수 필드 검증
    if (!storeData.latitude || !storeData.longitude) {
      throw new Error('위도(latitude)와 경도(longitude)는 필수 입력값입니다. 주소 검색을 통해 좌표를 설정해주세요.');
    }

    try {
      // 1. stores 테이블에 매장 기본 정보 생성
      const store = await storeRepository.createStore({
        name: storeData.name,
        is_open: false, // 초기에는 영업 종료 상태
      });
      console.log('✅ stores 생성 완료:', store.id);

      // 2. store_info 테이블에 상세 정보 생성 (amenities JSONB 포함)
      const storeInfo = await storeRepository.createStoreInfo(store.id, {
        category: storeData.category,
        store_tel_number: storeData.store_tel_number,
        store_name: storeData.name,
        amenities: storeData.amenities || {},
      });
      console.log('✅ store_info 생성 완료');

      // 3. store_addresses 테이블에 주소 정보 생성
      const storeAddress = await storeRepository.createStoreAddress(store.id, {
        sido: storeData.sido,
        sigungu: storeData.sigungu,
        eupmyeondong: storeData.eupmyeondong,
        road_address: storeData.road_address,
        detail_address: storeData.detail_address,
        latitude: storeData.latitude,
        longitude: storeData.longitude,
      });
      console.log('✅ store_addresses 생성 완료');

      // 4. store_members 테이블에 멤버 연결 (owner 역할)
      const storeMember = await storeRepository.createStoreMember(
        store.id,
        memberId,
        'owner'
      );
      console.log('✅ store_members 생성 완료');

      // 5. 기본 단골 등급 생성 (브론즈, 실버, 골드, 플래티넘)
      const regularLevels = await storeRepository.createDefaultRegularLevels(store.id);
      console.log('✅ store_regular_levels 생성 완료:', regularLevels.length, '개 등급');

      // 6. 메뉴 생성 (필수)
      let menus = [];
      if (storeData.menuItems && storeData.menuItems.length > 0) {
        menus = await storeRepository.createMenuItems(store.id, storeData.menuItems);
        console.log('✅ store_menu 생성 완료:', menus.length, '개 메뉴');
      } else {
        throw new Error('최소 1개 이상의 메뉴를 등록해야 합니다');
      }

      // 7. 테이블 생성 (필수)
      let tables = [];
      if (storeData.tables && storeData.tables.length > 0) {
        tables = await storeRepository.createStoreTables(store.id, storeData.tables);
        console.log('✅ store_tables 생성 완료:', tables.length, '개 테이블');
      } else {
        throw new Error('최소 1개 이상의 테이블을 등록해야 합니다');
      }

      // 8. 영업시간 생성 (필수 - 없으면 기본값 생성)
      const hours = await storeRepository.createStoreHours(store.id, storeData.hours);
      console.log('✅ store_hours 생성 완료:', hours.length, '일');

      console.log('🎉 매장 등록 완료! storeId:', store.id);

      // 전체 생성된 정보 반환
      return {
        store: {
          id: store.id,
          name: store.name,
          is_open: store.is_open,
          created_at: store.created_at,
        },
        info: storeInfo,
        address: storeAddress,
        member: storeMember,
        regularLevels: regularLevels,
        menus: menus,
        tables: tables,
        hours: hours,
      };
    } catch (error) {
      console.error('❌ 매장 등록 실패:', error);
      throw error;
    }
  }

  /**
   * 메뉴 추가
   */
  async addMenuItem(storeId, menuItem) {
    console.log('🍽️ 메뉴 추가:', { storeId, menuName: menuItem.name });
    
    const result = await storeRepository.createMenuItem(storeId, menuItem);
    console.log('✅ 메뉴 추가 완료:', result.id);
    
    return result;
  }

  /**
   * 여러 메뉴 일괄 추가
   */
  async addMenuItems(storeId, menuItems) {
    console.log('🍽️ 메뉴 일괄 추가:', { storeId, count: menuItems.length });
    
    const results = await storeRepository.createMenuItems(storeId, menuItems);
    console.log('✅ 메뉴 일괄 추가 완료:', results.length, '개');
    
    return results;
  }

  /**
   * 회원이 소유한 매장 목록 조회
   */
  async getMyStores(memberId) {
    console.log('📋 내 매장 목록 조회:', memberId);
    
    const stores = await storeRepository.getStoresByMemberId(memberId);
    console.log('✅ 매장 목록 조회 완료:', stores.length, '개');
    
    return stores;
  }

  /**
   * 매장 상세 정보 조회
   */
  async getStoreDetail(storeId) {
    console.log('🔍 매장 상세 조회:', storeId);
    
    const store = await storeRepository.getStoreFullInfo(storeId);
    if (!store) {
      throw new Error('매장을 찾을 수 없습니다');
    }
    
    console.log('✅ 매장 상세 조회 완료:', store.name);
    return store;
  }
}

module.exports = new MerchantStoreService();
