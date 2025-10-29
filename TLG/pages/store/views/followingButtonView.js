
/**
 * 팔로잉 버튼 뷰 - UI 렌더링 전담
 */
export const followingButtonView = {
  /**
   * 팔로잉 버튼 UI 업데이트
   */
  updateFollowingButton(storeId, isFollowing) {
    const btn = document.getElementById('followingBtn');
    if (!btn) {
      console.warn('⚠️ followingBtn 요소를 찾을 수 없음');
      return;
    }
    
    btn.textContent = isFollowing ? '❤️' : '🤍';
    btn.classList.toggle('following', isFollowing);
    btn.setAttribute('data-following', isFollowing);
    
    console.log(`🔄 팔로잉 버튼 UI 업데이트: ${isFollowing ? '팔로잉 중' : '미팔로우'}`);
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
window.followingButtonView = followingButtonView;
