
/**
 * 팔로잉 서비스 - 비즈니스 로직 처리
 */
let followingRepository;

try {
  const repoModule = await import('../repositories/followingRepository.js');
  followingRepository = repoModule.followingRepository;
} catch (error) {
  console.warn('⚠️ followingRepository 모듈 임포트 실패:', error);
}

export const followingService = {
  /**
   * 팔로잉 상태 조회 (stores 객체 사용 - API 호출 없음)
   */
  async getFollowingStatus(userId, storeId) {
    try {
      // stores 객체에서 팔로잉 상태 가져오기
      const storeData = window.stores?.[storeId];
      return storeData?.isFollowing || false;
    } catch (error) {
      console.error('❌ 팔로잉 상태 확인 중 오류:', error);
      return false;
    }
  },

  /**
   * 팔로잉 토글 처리
   */
  async toggleFollowing(store, userId) {
    const storeId = store.id || store.storeId;
    const storeName = store.name || store.storeName;

    if (!storeId) {
      throw new Error('매장 정보가 올바르지 않습니다.');
    }

    if (!userId) {
      throw new Error('사용자 정보가 없습니다.');
    }

    console.log(`🔄 팔로잉 토글 시작: storeId=${storeId}, storeName=${storeName}`);

    // 현재 팔로잉 상태 확인
    const currentStatus = await this.getFollowingStatus(userId, storeId);
    console.log(`📋 현재 팔로잉 상태: ${currentStatus ? '팔로잉 중' : '미팔로우'}`);

    // 서버에 팔로잉 토글 요청
    const action = currentStatus ? 'remove' : 'add';
    const result = await followingRepository.toggleFollowing(userId, storeId, action);

    // 로컬 스토리지 캐시 무효화
    this.invalidateCache(userId);

    const isNowFollowing = result.action === 'added' || result.action === 'already_added';

    return {
      success: true,
      isFollowing: isNowFollowing,
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
      const cacheKey = `tablelink_following_${userId}`;
      localStorage.removeItem(cacheKey);
      console.log('🗑️ 팔로잉 캐시 무효화:', cacheKey);
    }
  }
};

// 전역 등록
window.followingService = followingService;
