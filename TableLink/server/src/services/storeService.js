
const storeRepository = require('../repositories/storeRepository');
const tableRepository = require('../repositories/tableRepository');
const reviewRepository = require('../repositories/reviewRepository');

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
    const storeResult = await storeRepository.getStoreById(numericStoreId);
    const store = storeResult[0]; // 배열의 첫 번째 요소 사용

    
    //매장 메뉴 조회
    const menu = await storeRepository.getStoreMenu(numericStoreId)

    //테이블 정보 조회
    const table = await tableRepository.getStoreTable(numericStoreId)

    //매장 리뷰 조회 (최근 5개)
    const review = await reviewRepository.getStoreReviews(numericStoreId, 2, 0)

    //매장 프로모션 조회 >> store_regular_levels
    const promotion = await storeRepository.getStorePromotion(numericStoreId)

    //매장 편의시설 조회 
    const amenities = await storeRepository.getStoreAmenities(numericStoreId)
    
    
    if (!store) {
      throw new Error('매장을 찾을 수 없습니다');
    }
  

    const storeBasicInfo = {
      // 기본 매장 정보를 루트 레벨에 펼침
      ...(store || {}),
      
      // 추가 데이터
      menu: menu || [],                    // 메뉴 목록
      tables: table || [],                 // 테이블 정보
      reviews: review || [],               // 최근 리뷰 5개
      promotions: promotion || [],
      amenities: amenities ? {
        wifi: amenities.wifi,
        parking: amenities.parking,
        pet_friendly: amenities.pet_friendly,
        power_outlet: amenities.power_outlet,
        smoking_area: amenities.smoking_area
      } : {},        

      
      // 메타 정보
      menuCount: menu ? menu.length : 0,
      tableCount: table ? table.length : 0,
      reviewCount: review ? review.length : 0,
      promotionCount: promotion ? promotion.length : 0,
      
      
      
      // 테이블 상태 요약
      tableStatusSummary: table ? {
        available: table.filter(t => t.status === 'AVAILABLE').length,
        occupied: table.filter(t => t.status === 'OCCUPIED').length,
        total: table.length
      } : { available: 0, occupied: 0, total: 0 },
      
      
    }; 

    console.log(`✅ 매장 ${storeId} 기본 정보 조회 완료: ${store.name}`);
    console.log(`📊 포함된 데이터: 메뉴 ${storeBasicInfo.menuCount}개, 테이블 ${storeBasicInfo.tableCount}개, 리뷰 ${storeBasicInfo.reviewCount}개, 프로모션 ${storeBasicInfo.promotionCount}개`);
    
    return storeBasicInfo;
  }




  /**
   * POS 전용 매장 정보 조회 (OCCUPIED 테이블의 주문 정보 포함)
   */
  async getPOSStoreInfo(storeId) {
    const numericStoreId = parseInt(storeId);
    if (isNaN(numericStoreId) || numericStoreId <= 0) {
      throw new Error('유효하지 않은 매장 ID입니다');
    }

    console.log(`🏪 [POS] 매장 ${storeId} 정보 조회 요청`);

    // 매장 기본정보 조회
    const storeResult = await storeRepository.getStoreById(numericStoreId);
    const store = storeResult[0];

    if (!store) {
      throw new Error('매장을 찾을 수 없습니다');
    }

    // 테이블과 주문 정보 통합 조회
    const rawData = await tableRepository.getStoreTablesWithOrders(numericStoreId);
    
    // 테이블별로 그룹화하여 구조화
    const tablesMap = new Map();
    
    rawData.forEach(row => {
      const tableId = row.table_id;
      
      if (!tablesMap.has(tableId)) {
        tablesMap.set(tableId, {
          id: tableId,
          tableNumber: tableId,
          tableName: row.table_name || `${tableId}번`,
          capacity: row.capacity || 4,
          status: row.status,
          isOccupied: row.status === 'OCCUPIED',
          orders: []
        });
      }
      
      const table = tablesMap.get(tableId);
      
      // OCCUPIED 상태이고 주문이 있는 경우에만 처리
      if (row.status === 'OCCUPIED' && row.order_id && row.item_id) {
        // source별로 주문 찾기
        let sourceOrder = table.orders.find(order => order.source === row.source_system);
        
        if (!sourceOrder) {
          sourceOrder = {
            source: row.source_system,
            items: {},
            createdAt: row.order_created_at
          };
          table.orders.push(sourceOrder);
        }
        
        // 아이템 집계 (메뉴명 기준, 단가와 전체 가격 포함)
        const menuName = row.menu_name;
        if (sourceOrder.items[menuName]) {
          sourceOrder.items[menuName].quantity += row.quantity;
          sourceOrder.items[menuName].totalPrice += row.total_price || 0;
        } else {
          sourceOrder.items[menuName] = {
            quantity: row.quantity,
            unitPrice: row.unit_price || 0,
            totalPrice: row.total_price || 0
          };
        }
      }
    });
    
    const tables = Array.from(tablesMap.values()).sort((a, b) => a.tableNumber - b.tableNumber);

    const posStoreInfo = {
      id: store.id,
      store_id: store.id,
      name: store.name,
      is_open: store.is_open,
      store_tel_number: store.store_tel_number,
      rating_average: parseFloat(store.rating_average) || 0.0,
      review_count: store.review_count || 0,
      sido: store.sido,
      sigungu: store.sigungu,
      eupmyeondong: store.eupmyeondong,
      full_address: store.full_address,
      lng: store.lng,
      lat: store.lat,
      tables: tables,
      tableCount: tables.length
    };

    console.log(`✅ [POS] 매장 ${storeId} 정보 조회 완료: ${store.name} (테이블 ${tables.length}개)`);
    
    return posStoreInfo;
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

  /**
   * 모든 매장 목록 조회 (지도용)
   */
  async getAllStores() {
    const stores = await storeRepository.getAllStores();
    
    return stores.map(store => ({
      id: store.id.toString(),
      name: store.name || '매장명 없음',
      latitude: parseFloat(store.latitude),
      longitude: parseFloat(store.longitude),
      address: store.road_address || store.jibun_address || store.full_address || '주소 정보 없음',
      phone: store.store_tel_number,
      category: store.category || '기타',
      rating: parseFloat(store.rating_average) || 0,
      isOpen: store.is_open !== false
    }));
  }
}

module.exports = new StoreService();
