const userRepository = require('../repositories/userRepository');

/**
 * 사용자 서비스 - 비즈니스 로직
 */
class UserService {
  /**
   * 마이페이지 통합 데이터 조회
   * @param {number} userId - users.id (PK 값)
   */
  async getMypageData(userId) {
    try {
      console.log('📖 마이페이지 통합 데이터 조회 (PK):', userId);

      // 병렬로 모든 데이터 조회 (주문에 리뷰 존재 여부 포함)
      const [userInfo, recentOrders, reviews, favoriteStores, regularLevels] = await Promise.all([
        userRepository.getUserById(userId),
        userRepository.getUserOrders(userId, { limit: 3 }),
        userRepository.getUserReviews(userId),
        userRepository.getFavoriteStores(userId),
        userRepository.getRegularLevels(userId, 3)
      ]);

      // 통계 계산
      const stats = {
        totalOrders: recentOrders.length,
        totalReviews: reviews.total || 0,
        favoriteCount: favoriteStores.length
      };

      console.log('✅ 마이페이지 통합 데이터 조회 완료 (리뷰 상태 포함)');

      return {
        userInfo,
        recentOrders, // hasReview 필드 포함
        reviews: {
          total: reviews.total || 0,
          items: reviews.reviews || []
        },
        favoriteStores,
        regularLevels,
        stats
      };
    } catch (error) {
      console.error('❌ getMypageData 실패:', error);
      throw error;
    }
  }

  /**
   * 사용자 정보 조회 (쿠폰 포함)
   */
  async getUserWithCoupons(userId) {
    const user = await userRepository.getUserByUserId(userId);
    if (!user) {
      throw new Error('사용자를 찾을 수 없습니다');
    }

    const coupons = await userRepository.getUserCoupons(user.id);

    return {
      id: user.user_id,
      userId: user.id,
      name: user.name,
      phone: user.phone,
      email: user.email || '',
      address: user.address || '',
      birth: user.birth || '',
      gender: user.gender || '',
      coupons,
      couponStats: {
        total: coupons.unused.length + coupons.used.length,
        unused: coupons.unused.length,
        used: coupons.used.length
      }
    };
  }

  /**
   * 사용자 매장 정보 조회 (가장 최근 방문한 매장 또는 기본 레벨)
   */
  async getUserStoreInfo(storeId, userId) {
    const storeInfo = await userRepository.getUserStoreInfo(userId);

    if (!storeInfo) {
      // 사용자 매장 정보가 없을 경우 기본 레벨 조회
      const defaultLevel = await userRepository.getDefaultUserStoreInfo(storeId);
      
      if (!defaultLevel) {
        return {
          hasStoreInfo: false,
          message: '매장 레벨 정보를 찾을 수 없습니다'
        };
      }

      return {
        hasStoreInfo: false,
        isDefault: true,
        Level: {
          id: defaultLevel.id,
          storeId: defaultLevel.store_id,
          levelName: defaultLevel.level,
          minOrders: defaultLevel.min_orders,
          minSpent: defaultLevel.min_spent,
          benefits: defaultLevel.benefits
        }
      };
    }

    return {
      hasStoreInfo: true,
      Level: {
        id: storeInfo.id,
        storeId: storeInfo.store_id,
        levelName: storeInfo.level,
        minOrders: storeInfo.min_orders,
        minSpent: storeInfo.min_spent,
        benefits: storeInfo.benefits,

        // 추가 정보
        visitCount: storeInfo.visit_count,
        totalSpent: storeInfo.total_spent,
        lastVisit: storeInfo.last_visit,
        createdAt: storeInfo.created_at,
        updatedAt: storeInfo.updated_at
      }
    };
  }

  /**
   * 즐겨찾기 매장 조회
   */
  async getFavoriteStores(userId) {
    return await userRepository.getFavoriteStores(userId);
  }

  /**
   * 즐겨찾기 토글
   */
  async toggleFavorite(userId, storeId, action) {
    const user = await userRepository.getUserById(userId);
    if (!user) {
      throw new Error('사용자를 찾을 수 없습니다');
    }

    const store = await userRepository.getStoreById(storeId);
    if (!store) {
      throw new Error('매장을 찾을 수 없습니다');
    }

    const isFavorited = await userRepository.checkFavoriteExists(userId, storeId);
    const finalAction = action || (isFavorited ? 'remove' : 'add');

    if (finalAction === 'add') {
      if (isFavorited) {
        return {
          message: '이미 즐겨찾기에 등록된 매장입니다',
          storeName: store.name,
          action: 'already_added'
        };
      }

      await userRepository.addFavorite(userId, storeId);
      await userRepository.incrementStoreFavoriteCount(storeId);

      console.log(`✅ 사용자 ${userId}가 매장 ${store.name} 즐겨찾기 추가`);

      return {
        message: '즐겨찾기에 추가되었습니다',
        storeName: store.name,
        action: 'added'
      };
    } else if (finalAction === 'remove') {
      if (!isFavorited) {
        return {
          message: '즐겨찾기에 없는 매장입니다',
          storeName: store.name,
          action: 'not_found'
        };
      }

      await userRepository.removeFavorite(userId, storeId);
      await userRepository.decrementStoreFavoriteCount(storeId);

      console.log(`✅ 사용자 ${userId}가 매장 ${store.name} 즐겨찾기 제거`);

      return {
        message: '즐겨찾기에서 제거되었습니다',
        storeName: store.name,
        action: 'removed'
      };
    } else {
      throw new Error('잘못된 액션입니다. add 또는 remove만 허용됩니다.');
    }
  }

  /**
   * 즐겨찾기 상태 확인
   */
  async getFavoriteStatus(userId, storeId) {
    return await userRepository.checkFavoriteExists(userId, storeId);
  }

  /**
   * 사용자 정보 업데이트
   */
  async updateUserInfo(userId, updateData) {
    // 전화번호 중복 체크
    const phoneExists = await userRepository.checkPhoneDuplicate(updateData.phone, userId);
    if (phoneExists) {
      throw new Error('이미 사용 중인 전화번호입니다.');
    }

    const updatedUser = await userRepository.updateUser(userId, updateData);
    if (!updatedUser) {
      throw new Error('사용자를 찾을 수 없습니다.');
    }

    console.log('✅ 사용자 정보 업데이트 완료:', userId);
    return updatedUser;
  }

  /**
   * 전화번호로 회원 조회
   */
  async searchByPhone(phone) {
    // 전화번호에서 하이픈 제거
    const cleanPhone = phone.replace(/[-\s]/g, '');
    console.log(`📱 정규화된 전화번호: ${phone} → ${cleanPhone}`);

    const user = await userRepository.getUserByPhone(cleanPhone);

    if (!user) {
      console.log(`❌ 전화번호 ${phone}로 등록된 회원 없음`);
      return null;
    }

    console.log(`✅ 회원 조회 성공: ${user.name} (ID: ${user.id})`);

    return {
      id: user.id,
      name: user.name,
      phone: user.phone,
      email: user.email,
      point: user.point || 0,
      createdAt: user.created_at
    };
  }
}

module.exports = new UserService();