
/**
 * 즐겨찾기 버튼 뷰 - UI 렌더링 전담
 */
export const favoriteButtonView = {
  /**
   * 즐겨찾기 버튼 UI 업데이트
   */
  updateFavoriteButton(storeId, isFavorited) {
    const btn = document.getElementById('favoriteBtn');
    if (!btn) {
      console.warn('⚠️ favoriteBtn 요소를 찾을 수 없음');
      return;
    }
    
    btn.textContent = isFavorited ? '❤️' : '🤍';
    btn.classList.toggle('favorited', isFavorited);
    btn.setAttribute('data-favorited', isFavorited);
    
    console.log(`🔄 즐겨찾기 버튼 UI 업데이트: ${isFavorited ? '좋아요' : '좋아요 취소'}`);
  },

  /**
   * 성공 메시지 표시 (옵션)
   */
  showSuccessMessage(message) {
    // 필요시 토스트 메시지 등으로 확장 가능
    console.log('✅', message);
  },

  /**
   * 에러 메시지 표시
   */
  showErrorMessage(message) {
    alert(message);
    console.error('❌', message);
  }
};

// 전역 등록
window.favoriteButtonView = favoriteButtonView;
