
/**
 * 즐겨찾기 서비스 - 비즈니스 로직 처리
 */
let favoriteRepository;

try {
  const repoModule = await import('../repositories/favoriteRepository.js');
  favoriteRepository = repoModule.favoriteRepository;
} catch (error) {
  console.warn('⚠️ favoriteRepository 모듈 임포트 실패:', error);
}

export const favoriteService = {
  /**
   * 즐겨찾기 상태 조회
   */
  async getFavoriteStatus(userId, storeId) {
    try {
      return await favoriteRepository.checkFavoriteStatus(userId, storeId);
    } catch (error) {
      console.error('❌ 즐겨찾기 상태 확인 중 오류:', error);
      return false;
    }
  },

  /**
   * 즐겨찾기 토글 처리
   */
  async toggleFavorite(store, userId) {
    const storeId = store.id || store.storeId;
    const storeName = store.name || store.storeName;

    if (!storeId) {
      throw new Error('매장 정보가 올바르지 않습니다.');
    }

    if (!userId) {
      throw new Error('사용자 정보가 없습니다.');
    }

    console.log(`🔄 즐겨찾기 토글 시작: storeId=${storeId}, storeName=${storeName}`);

    // 현재 즐겨찾기 상태 확인
    const currentStatus = await this.getFavoriteStatus(userId, storeId);
    console.log(`📋 현재 즐겨찾기 상태: ${currentStatus ? '등록됨' : '등록안됨'}`);

    // 서버에 즐겨찾기 토글 요청
    const action = currentStatus ? 'remove' : 'add';
    const result = await favoriteRepository.toggleFavorite(userId, storeId, action);

    // 로컬 스토리지 캐시 무효화
    this.invalidateCache(userId);

    const isNowFavorited = result.action === 'added' || result.action === 'already_added';

    return {
      success: true,
      isFavorited: isNowFavorited,
      storeId,
      storeName,
      message: result.message
    };
  },

  /**
   * 캐시 무효화
   */
  invalidateCache(userId) {
    if (typeof localStorage !== 'undefined') {
      const cacheKey = `tablelink_favorites_${userId}`;
      localStorage.removeItem(cacheKey);
      console.log('🗑️ 즐겨찾기 캐시 무효화:', cacheKey);
    }
  }
};

// 전역 등록
window.favoriteService = favoriteService;
