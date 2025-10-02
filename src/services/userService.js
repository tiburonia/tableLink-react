
const userRepository = require('../repositories/userRepository');
const orderRepository = require('../repositories/orderRepository');

/**
 * 사용자 서비스 - 비즈니스 로직
 */
class UserService {
  /**
   * 마이페이지 통합 데이터 조회
   */
  async getMypageData(userId) {
    try {
      console.log('📖 마이페이지 통합 데이터 조회:', userId);

      // 병렬로 모든 데이터 조회
      const [userInfo, recentOrders, reviews, favoriteStores, regularLevels] = await Promise.all([
        userRepository.getUserById(userId),
        orderRepository.getUserOrders(userId, { limit: 3 }),
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

      console.log('✅ 마이페이지 통합 데이터 조회 완료');

      return {
        userInfo,
        recentOrders,
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
}

module.exports = new UserService();
