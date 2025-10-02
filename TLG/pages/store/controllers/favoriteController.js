
/**
 * 즐겨찾기 컨트롤러 - 이벤트 처리 및 조율
 */
let favoriteService, favoriteButtonView;

try {
  const serviceModule = await import('../services/favoriteService.js');
  favoriteService = serviceModule.favoriteService;

  const viewModule = await import('../views/favoriteButtonView.js');
  favoriteButtonView = viewModule.favoriteButtonView;
} catch (error) {
  console.warn('⚠️ 즐겨찾기 모듈 임포트 실패:', error);
}

export const favoriteController = {
  /**
   * 즐겨찾기 토글 처리
   */
  async toggleFavorite(store) {
    try {
      // userInfo는 전역 변수로 가정
      if (!window.userInfo || !window.userInfo.id) {
        favoriteButtonView.showErrorMessage('로그인이 필요합니다.');
        return;
      }

      const result = await favoriteService.toggleFavorite(store, window.userInfo.id);

      if (result.success) {
        // UI 업데이트
        favoriteButtonView.updateFavoriteButton(result.storeId, result.isFavorited);
        
        // 성공 메시지 표시
        if (result.message) {
          favoriteButtonView.showSuccessMessage(result.message);
        }
      }
    } catch (error) {
      console.error('❌ 즐겨찾기 토글 중 오류:', error);
      favoriteButtonView.showErrorMessage(error.message || '서버 연결에 실패했습니다.');
    }
  },

  /**
   * 즐겨찾기 버튼 초기화
   */
  async initializeFavoriteButton(store) {
    try {
      const storeId = store.id || store.storeId;
      if (!storeId) {
        console.warn('⚠️ storeId가 없어 즐겨찾기 초기화를 건너뜁니다');
        return;
      }

      if (!window.userInfo || !window.userInfo.id) {
        console.warn('⚠️ 사용자 정보가 없어 즐겨찾기 초기화를 건너뜁니다');
        return;
      }

      const isFavorited = await favoriteService.getFavoriteStatus(window.userInfo.id, storeId);
      favoriteButtonView.updateFavoriteButton(storeId, isFavorited);
      
      console.log(`✅ 즐겨찾기 버튼 초기화 완료: storeId=${storeId}, favorited=${isFavorited}`);
    } catch (error) {
      console.error('❌ 즐겨찾기 버튼 초기화 실패:', error);
    }
  }
};

// 전역 등록
window.favoriteController = favoriteController;
