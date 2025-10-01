
const storeRepository = require('../repositories/storeRepository');
const tableRepository = require('../repositories/tableRepository');

/**
 * 매장 서비스 - 비즈니스 로직 처리
 */
class StoreService {
  /**
   * 매장 기본 정보 조회
   */
  async getStoreInfo(storeId, userId) {
    // ID 유효성 검사
    const numericStoreId = parseInt(storeId);
    const numericUserId = parseInt(userId)
    if (isNaN(numericStoreId) || numericStoreId <= 0) {
      throw new Error('유효하지 않은 매장 ID입니다');
    }

    if (isNaN(numericUserId) || numericUserId <= 0) {
      throw new Error('유효하지 않은 사용자 ID입니다')
    }

    console.log(`🏪 매장 ${storeId} 기본 정보 조회 요청`);

    // 매장 기본정보 조회
    const store = await storeRepository.getStoreById(numericStoreId);

    const storeData = {
      id: store.id,
      store_id: store.id,
      name: store.name || '매장명 없음',
      category: store.category ? store.category : '기타',
      address: store.full_address ? store.full_address : '주소 정보 없음',
      rating_average: store.rating_average ? parseFloat(store.rating_average) : 0.0,
      review_count: store.review_count ? store.review_count : 0,
      favorite_count: 0,
      isOpen: store.is_open,
      coord:  {
        lat: parseFloat(store.lat),
        lng: parseFloat(store.lng)
      },
      region: {
        sido: store.sido,
        sigungu: store.sigungu,
        eupmyeondong: store.eupmyeondong
      }
    }
    

    //매장 메뉴 조회
    const menu = await storeRepository.getStoreMenu(numericStoreId)

    //테이블 정보 조회
    const table = await tableRepository.getStoreTable(numericStoreId)

    //매장 리뷰 조회 (ORDER BY created_at DESC) LIMIT 5)
    const review = await storeRepository.getStoreReview(numericStoreId)

    //매장 프로모션 조회 >> store_regular_levels
    const promotion = await storeRepository.getStorePromotion(numericStoreId)
    
    
    if (!store) {
      throw new Error('매장을 찾을 수 없습니다');
    }
    /**  userId를 활용한 개인화된 매장 정보 조회 로직 구현예정
     *   const formattedStoreInfo = this.formatStoreData(store)
     */

    const storeBasicInfo = {
      
    } 
     

    

    console.log(`✅ 매장 ${storeId} 기본 정보 조회 완료: ${store.name}`);
    
    return storeData;
  }

  /**
   * 매장 검색
   */
  async searchStores(query, limit) {
    if (!query || query.trim().length < 1) {
      throw new Error('검색어를 입력해주세요');
    }

    const searchQuery = query.trim();
    const searchLimit = Math.min(parseInt(limit) || 20, 100);

    console.log(`🔍 매장 검색 요청: "${searchQuery}" (limit: ${searchLimit})`);

    const stores = await storeRepository.searchStores(searchQuery, searchLimit);

    const formattedStores = stores.map(store => this.formatStoreData(store));

    console.log(`✅ 매장 검색 완료: ${formattedStores.length}개 결과`);

    return {
      stores: formattedStores,
      query: searchQuery,
      count: formattedStores.length
    };
  }

  /**
   * 매장 메뉴 조회
   */
  async getStoreMenu(storeId) {
    // ID 유효성 검사
    const numericStoreId = parseInt(storeId);
    if (isNaN(numericStoreId) || numericStoreId <= 0) {
      throw new Error('유효하지 않은 매장 ID입니다');
    }

    console.log(`🔍 매장 ${storeId} 메뉴 조회 요청`);

    // 매장 존재 확인
    const store = await storeRepository.getStoreBasicInfo(numericStoreId);
    if (!store) {
      throw new Error('매장을 찾을 수 없습니다');
    }

    // 메뉴 조회
    const menu = await storeRepository.getStoreMenu(numericStoreId);

    console.log(`✅ 매장 ${storeId} 메뉴 ${menu.length}개 조회 완료`);

    return {
      store: store,
      menu: menu
    };
  }

  /**
   * 매장 평점 정보 조회
   */
  async getStoreRating(storeId) {
    const numericStoreId = parseInt(storeId);
    if (isNaN(numericStoreId) || numericStoreId <= 0) {
      throw new Error('유효하지 않은 매장 ID입니다');
    }

    const rating = await storeRepository.getStoreRating(numericStoreId);
    
    return {
      ratingAverage: rating.ratingAverage || 0.0,
      reviewCount: rating.reviewCount || 0
    };
  }

  /**
   * 매장 프로모션 조회
   */
  async getStorePromotions(storeId) {
    const numericStoreId = parseInt(storeId);
    if (isNaN(numericStoreId) || numericStoreId <= 0) {
      throw new Error('유효하지 않은 매장 ID입니다');
    }

    const promotions = await storeRepository.getStorePromotions(numericStoreId);
    
    return promotions;
  }

  /**
   * 매장 상위 사용자 조회
   */
  async getStoreTopUsers(storeId) {
    const numericStoreId = parseInt(storeId);
    if (isNaN(numericStoreId) || numericStoreId <= 0) {
      throw new Error('유효하지 않은 매장 ID입니다');
    }

    const users = await storeRepository.getStoreTopUsers(numericStoreId);
    
    return users;
  }

  /**
   * 매장 데이터 포맷팅
   */
  formatStoreData(store) {
    return {
      id: store.id,
      store_id: store.id,
      name: store.name || '매장명 없음',
      category: store.category || '기타',
      address: store.full_address || '주소 정보 없음',
      ratingAverage: parseFloat(store.rating_average) || 0.0,
      reviewCount: store.review_count || 0,
      favoriteCount: 0,
      isOpen: store.is_open !== false,
      coord: store.lat && store.lng ? { 
        lat: parseFloat(store.lat), 
        lng: parseFloat(store.lng) 
      } : null,
      region: {
        sido: store.sido,
        sigungu: store.sigungu,
        eupmyeondong: store.eupmyeondong
      }
    };
  }
}

module.exports = new StoreService();
