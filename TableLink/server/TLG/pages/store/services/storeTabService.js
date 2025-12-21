
/**
 * 매장 탭 서비스 - 비즈니스 로직
 * stores 객체에서 데이터를 추출하여 처리
 */

export const storeTabService = {
  /**
   * 메뉴 데이터 가져오기 (stores 객체에서)
   */
  async getMenuData(storeId) {
    if (!storeId) {
      throw new Error('매장 ID가 필요합니다');
    }

    try {
      // stores 객체에서 매장 데이터 가져오기
      const store = window.stores?.[storeId];
      
      if (!store) {
        console.warn(`⚠️ stores 객체에서 매장 ${storeId}를 찾을 수 없습니다`);
        return [];
      }

      // 메뉴 데이터 추출
      const rawMenuData = store.menu || [];
      
      // 비즈니스 로직: 데이터 검증 및 변환
      const validatedMenu = this.validateAndTransformMenuData(rawMenuData);

      console.log(`✅ 메뉴 데이터 처리 완료 (stores 객체): ${validatedMenu.length}개`);
      return validatedMenu;
    } catch (error) {
      console.error('❌ 메뉴 데이터 처리 실패:', error);
      return [];
    }
  },

  /**
   * 메뉴 데이터 검증 및 변환
   */
  validateAndTransformMenuData(rawData) {
    if (!rawData) {
      console.warn('⚠️ 메뉴 데이터가 없습니다');
      return [];
    }

    // 문자열인 경우 JSON 파싱
    let menuData = rawData;
    if (typeof rawData === 'string') {
      try {
        menuData = JSON.parse(rawData);
        console.log('✅ 메뉴 JSON 파싱 성공');
      } catch (parseError) {
        console.error('❌ 메뉴 JSON 파싱 실패:', parseError);
        return [];
      }
    }

    // 배열로 정규화
    if (!Array.isArray(menuData)) {
      menuData = [menuData];
    }

    // 각 메뉴 아이템 검증 및 정규화
    return menuData.map(item => this.normalizeMenuItem(item)).filter(Boolean);
  },

  /**
   * 개별 메뉴 아이템 정규화
   */
  normalizeMenuItem(item) {
    if (!item || typeof item !== 'object') {
      return null;
    }

    return {
      id: item.id || item.menu_id || null,
      name: item.name || '이름 없음',
      description: item.description || '',
      price: parseInt(item.price) || 0,
      category: item.category || '기타',
      image_url: item.image_url || item.imageUrl || null,
      is_popular: Boolean(item.is_popular || item.isPopular),
      is_new: Boolean(item.is_new || item.isNew),
      discount_rate: parseInt(item.discount_rate || item.discountRate) || 0,
      is_available: item.is_available !== false
    };
  },

  /**
   * 리뷰 데이터 가져오기 (stores 객체에서)
   */
  async getReviewData(storeId) {
    if (!storeId) {
      throw new Error('매장 ID가 필요합니다');
    }

    try {
      // stores 객체에서 매장 데이터 가져오기
      const store = window.stores?.[storeId];
      
      if (!store) {
        console.warn(`⚠️ stores 객체에서 매장 ${storeId}를 찾을 수 없습니다`);
        return [];
      }

      // 리뷰 데이터 추출
      const reviews = store.reviews || [];

      // 비즈니스 로직: 리뷰 정렬 및 필터링
      const processedReviews = this.processReviews(reviews);

      console.log(`✅ 리뷰 데이터 처리 완료 (stores 객체): ${processedReviews.length}개`);
      return processedReviews;
    } catch (error) {
      console.error('❌ 리뷰 데이터 처리 실패:', error);
      return [];
    }
  },

  /**
   * 리뷰 데이터 처리
   */
  processReviews(reviews) {
    if (!Array.isArray(reviews)) {
      return [];
    }

    return reviews
      .map(review => this.normalizeReview(review))
      .filter(review => review && review.score >= 1)
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  },

  /**
   * 개별 리뷰 정규화
   */
  normalizeReview(review) {
    if (!review || typeof review !== 'object') {
      return null;
    }

    return {
      id: review.id || review.review_id,
      user_name: review.user_name || review.userName || `사용자${review.user_id}`,
      user_id: review.user_id || review.userId,
      score: parseFloat(review.score || review.rating) || 0,
      content: review.content || review.review_text || '',
      created_at: review.created_at || review.date || new Date().toISOString(),
      images: review.images || review.review_images || []
    };
  },

  /**
   * 프로모션 데이터 가져오기 (stores 객체에서)
   */
  async getPromotions(storeId) {
    if (!storeId) {
      console.warn('⚠️ 매장 ID가 없습니다');
      return [];
    }

    try {
      // stores 객체에서 매장 데이터 가져오기
      const store = window.stores?.[storeId];
      
      if (!store) {
        console.warn(`⚠️ stores 객체에서 매장 ${storeId}를 찾을 수 없습니다`);
        return this.getDummyPromotions();
      }

      // 프로모션 데이터 추출
      const promotions = store.promotions || [];

      // 비즈니스 로직: 활성 프로모션 필터링 및 정렬
      const activePromotions = this.filterActivePromotions(promotions);

      console.log(`✅ 프로모션 데이터 처리 완료 (stores 객체): ${activePromotions.length}개`);
      return activePromotions.length > 0 ? activePromotions : this.getDummyPromotions();
    } catch (error) {
      console.error('❌ 프로모션 데이터 처리 실패:', error);
      return this.getDummyPromotions();
    }
  },

  /**
   * 활성 프로모션 필터링
   */
  filterActivePromotions(promotions) {
    if (!Array.isArray(promotions)) {
      return [];
    }

    const now = new Date();

    return promotions
      .map(promo => this.normalizePromotion(promo))
      .filter(promo => {
        if (!promo || !promo.isActive) return false;
        
        const startDate = new Date(promo.startDate);
        const endDate = new Date(promo.endDate);
        
        return now >= startDate && now <= endDate;
      })
      .sort((a, b) => {
        const discountA = parseInt(a.discountRate) || 0;
        const discountB = parseInt(b.discountRate) || 0;
        return discountB - discountA;
      });
  },

  /**
   * 개별 프로모션 정규화
   */
  normalizePromotion(promo) {
    if (!promo || typeof promo !== 'object') {
      return null;
    }

    return {
      id: promo.id || promo.promotion_id,
      name: promo.name || promo.title || '이름 없음',
      description: promo.description || '',
      type: promo.type || '할인',
      discountRate: promo.discount_rate || promo.discountRate || '0%',
      minOrderAmount: promo.min_order_amount || promo.minOrderAmount || '0원',
      maxDiscount: promo.max_discount || promo.maxDiscount || '무제한',
      startDate: promo.start_date || promo.startDate,
      endDate: promo.end_date || promo.endDate,
      isActive: promo.is_active !== false
    };
  },

  /**
   * 더미 프로모션 데이터
   */
  getDummyPromotions() {
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
  },

  /**
   * 카테고리별 메뉴 그룹화
   */
  groupMenuByCategory(menuData) {
    if (!Array.isArray(menuData) || menuData.length === 0) {
      return {};
    }

    return menuData.reduce((groups, item) => {
      const category = item.category || '기타';
      if (!groups[category]) {
        groups[category] = [];
      }
      groups[category].push(item);
      return groups;
    }, {});
  },

  /**
   * 리뷰 통계 계산
   */
  calculateReviewStats(reviews) {
    if (!Array.isArray(reviews) || reviews.length === 0) {
      return {
        totalCount: 0,
        averageScore: 0,
        scoreDistribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 }
      };
    }

    const totalScore = reviews.reduce((sum, review) => sum + (review.score || 0), 0);
    const scoreDistribution = reviews.reduce((dist, review) => {
      const score = Math.floor(review.score || 0);
      if (score >= 1 && score <= 5) {
        dist[score] = (dist[score] || 0) + 1;
      }
      return dist;
    }, { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 });

    return {
      totalCount: reviews.length,
      averageScore: (totalScore / reviews.length).toFixed(1),
      scoreDistribution
    };
  }
};

// 전역 등록
window.storeTabService = storeTabService;

console.log('✅ storeTabService 모듈 로드 완료 (stores 객체 기반)');
