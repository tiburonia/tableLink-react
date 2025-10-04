
// 매장 서비스 - 비즈니스 로직 및 데이터 처리
let storeRepository;

try {
  const repoModule = await import('../repositories/storeRepository.js');
  storeRepository = repoModule.storeRepository;
} catch (error) {
  console.warn('⚠️ storeRepository 모듈 임포트 실패:', error);
}

export const storeService = {
  /**
   * storeData 표준화 및 검증
   */
  async normalizeStoreData(rawStoreData) {
    console.log('🔧 매장 데이터 표준화 시작:', rawStoreData);

    if (!rawStoreData) {
      throw new Error('매장 데이터가 없습니다');
    }

    // ID 정규화
    let storeId = rawStoreData.id || rawStoreData.store_id;
    if (typeof storeId === 'string' && !isNaN(storeId)) {
      storeId = parseInt(storeId, 10);
    }

    if (!storeId || storeId <= 0) {
      throw new Error('매장 ID가 유효하지 않습니다');
    }

    if (!rawStoreData.name) {
      throw new Error('매장 이름이 없습니다');
    }

    // 메뉴 데이터 정규화
    let menu = rawStoreData.menu;
    if (menu && typeof menu === 'string') {
      try {
        menu = JSON.parse(menu);
      } catch (error) {
        console.warn('⚠️ 메뉴 JSON 파싱 실패:', error);
        menu = [];
      }
    }
    if (!Array.isArray(menu)) {
      menu = [];
    }

    // 표준화된 storeData 객체 생성
    const normalizedStore = {
      id: storeId,
      store_id: storeId,
      name: rawStoreData.name,
      category: rawStoreData.category || '기타',
      address: this.formatAddress(rawStoreData),
      ratingAverage: this.parseRating(rawStoreData.ratingAverage),
      reviewCount: parseInt(rawStoreData.reviewCount) || 0,
      favoriteCount: parseInt(rawStoreData.favoriteCount) || 0,
      isOpen: rawStoreData.isOpen !== false,
      coord: this.normalizeCoordinates(rawStoreData),
      region: this.normalizeRegion(rawStoreData),
      menu: menu
    };

    console.log('✅ 매장 데이터 표준화 완료:', {
      id: normalizedStore.id,
      name: normalizedStore.name,
      category: normalizedStore.category,
      isOpen: normalizedStore.isOpen,
      menuCount: normalizedStore.menu.length
    });

    return normalizedStore;
  },

  /**
   * 주소 포맷팅
   */
  formatAddress(storeData) {
    if (storeData.address) {
      return storeData.address;
    }

    const addressParts = [
      storeData.sido,
      storeData.sigungu,
      storeData.eupmyeondong,
      storeData.detail_address
    ].filter(Boolean);

    return addressParts.length > 0 ? addressParts.join(' ') : '주소 정보 없음';
  },

  /**
   * 평점 파싱
   */
  parseRating(rating) {
    if (rating === null || rating === undefined) return 0.0;
    const parsed = parseFloat(rating);
    return isNaN(parsed) ? 0.0 : parsed;
  },

  /**
   * 좌표 정규화
   */
  normalizeCoordinates(storeData) {
    return {
      lat: parseFloat(storeData.lat || storeData.latitude || 0),
      lng: parseFloat(storeData.lng || storeData.longitude || 0)
    };
  },

  /**
   * 지역 정보 정규화
   */
  normalizeRegion(storeData) {
    return {
      sido: storeData.sido || '',
      sigungu: storeData.sigungu || '',
      eupmyeondong: storeData.eupmyeondong || ''
    };
  },

  /**
   * 매장 평점 정보 조회 (stores 객체 사용)
   * @deprecated - stores 객체에서 직접 가져오세요
   */
  async getStoreRating(storeId) {
    console.warn('⚠️ getStoreRating는 더 이상 사용되지 않습니다. stores 객체를 사용하세요.');
    const store = window.stores?.[storeId];
    return {
      ratingAverage: store?.ratingAverage || 0,
      reviewCount: store?.reviewCount || 0
    };
  },

  /**
   * 프로모션 데이터 조회 (stores 객체 사용)
   * @deprecated - stores 객체에서 직접 가져오세요
   */
  async getPromotions(storeId) {
    console.warn('⚠️ getPromotions는 더 이상 사용되지 않습니다. stores 객체를 사용하세요.');
    const store = window.stores?.[storeId];
    return store?.promotions || [];
  },

  /**
   * 매장 데이터 조회 및 표준화
   */
  async fetchStoreData(storeId, userId = null) {
    try {
      console.log(`🔍 매장 ${storeId} 데이터 조회 시작`);

      // Repository에서 원시 데이터 가져오기
      const rawStoreData = await storeRepository.fetchStoreById(storeId, userId);

      // 비즈니스 로직: 데이터 표준화
      const normalizedStore = await this.normalizeStoreData(rawStoreData);

      console.log(`✅ 매장 ${storeId} 데이터 표준화 완료`);
      return normalizedStore;
    } catch (error) {
      console.error(`❌ 매장 ${storeId} 데이터 조회 실패:`, error);
      throw error;
    }
  },

  /**
   * 상위 사용자 데이터 조회 (stores 객체 사용)
   * @deprecated - stores 객체에서 직접 가져오세요
   */
  async getTopUsers(storeId) {
    console.warn('⚠️ getTopUsers는 더 이상 사용되지 않습니다. stores 객체를 사용하세요.');
    const store = window.stores?.[storeId];
    return store?.topUsers || [];
  },

  /**
   * 매장 정보 유효성 검증
   */
  validateStoreData(storeData) {
    const required = ['id', 'name'];
    return required.every(field => {
      return storeData.hasOwnProperty(field) && storeData[field];
    });
  },

  /**
   * 레거시 데이터 호환성 처리
   */
  handleLegacyData(rawData) {
    // 기존 레거시 형식을 새로운 표준으로 변환
    if (rawData.store_id && !rawData.id) {
      rawData.id = rawData.store_id;
    }

    if (rawData.full_address && !rawData.address) {
      rawData.address = rawData.full_address;
    }

    return rawData;
  }
};

// 전역 등록
window.storeService = storeService;
