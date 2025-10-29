
/**
 * 팔로잉 컨트롤러 - 이벤트 처리 및 조율
 */
let followingService, followingButtonView;

try {
  const serviceModule = await import('../services/followingService.js');
  followingService = serviceModule.followingService;

  const viewModule = await import('../views/followingButtonView.js');
  followingButtonView = viewModule.followingButtonView;
} catch (error) {
  console.warn('⚠️ 팔로잉 모듈 임포트 실패:', error);
}

export const followingController = {
  /**
   * 팔로잉 토글 처리
   */
  async toggleFollowing(store) {
    try {
      // userInfo는 전역 변수로 가정
      if (!window.userInfo || !window.userInfo.id) {
        followingButtonView.showErrorMessage('로그인이 필요합니다.');
        return;
      }

      const result = await followingService.toggleFollowing(store, window.userInfo.id);

      if (result.success) {
        // UI 업데이트
        followingButtonView.updateFollowingButton(result.storeId, result.isFollowing);
        
        // 성공 메시지 표시
        if (result.message) {
          followingButtonView.showSuccessMessage(result.message);
        }
      }
    } catch (error) {
      console.error('❌ 팔로잉 토글 중 오류:', error);
      followingButtonView.showErrorMessage(error.message || '서버 연결에 실패했습니다.');
    }
  },

  /**
   * 팔로잉 버튼 초기화 (stores 객체 사용 - API 호출 없음)
   */
  async initializeFollowingButton(store) {
    try {
      const storeId = store.id || store.storeId;
      if (!storeId) {
        console.warn('⚠️ storeId가 없어 팔로잉 초기화를 건너뜁니다');
        return;
      }

      if (!window.userInfo || !window.userInfo.id) {
        console.warn('⚠️ 사용자 정보가 없어 팔로잉 초기화를 건너뜁니다');
        return;
      }

      // stores 객체에서 팔로잉 상태 가져오기 (API 호출 없음)
      const storeData = window.stores?.[storeId] || store;
      const isFollowing = storeData.isFollowing || false;
      
      followingButtonView.updateFollowingButton(storeId, isFollowing);
      
      console.log(`✅ 팔로잉 버튼 초기화 완료 (stores 객체 사용): storeId=${storeId}, following=${isFollowing}`);
    } catch (error) {
      console.error('❌ 팔로잉 버튼 초기화 실패:', error);
    }
  }
};

// 전역 등록
window.followingController = followingController;
