
/**
 * 팔로잉 레포지토리 - API 호출 담당
 */
export const followingRepository = {
  /**
   * 팔로잉 상태 확인
   */
  async checkFollowingStatus(userId, storeId) {
    const response = await fetch(`/api/users/following/status/${userId}/${storeId}`);
    
    if (!response.ok) {
      throw new Error(`팔로잉 상태 확인 실패: ${response.status}`);
    }

    const data = await response.json();
    
    if (!data.success) {
      throw new Error(data.error || '팔로잉 상태 확인 실패');
    }

    return data.isFollowing;
  },

  /**
   * 팔로잉 토글 (추가/제거)
   */
  async toggleFollowing(userId, storeId, action) {
    const response = await fetch('/api/auth/users/following/toggle', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userId,
        storeId,
        action
      })
    });

    if (!response.ok) {
      throw new Error(`팔로잉 토글 실패: ${response.status}`);
    }

    const data = await response.json();
    
    if (!data.success) {
      throw new Error(data.error || '팔로잉 토글 실패');
    }

    return data;
  }
};

// 전역 등록
window.followingRepository = followingRepository;
