
/**
 * 즐겨찾기 레포지토리 - API 호출 담당
 */
export const favoriteRepository = {
  /**
   * 즐겨찾기 상태 확인
   */
  async checkFavoriteStatus(userId, storeId) {
    const response = await fetch(`/api/users/favorite/status/${userId}/${storeId}`);
    
    if (!response.ok) {
      throw new Error(`즐겨찾기 상태 확인 실패: ${response.status}`);
    }

    const data = await response.json();
    
    if (!data.success) {
      throw new Error(data.error || '즐겨찾기 상태 확인 실패');
    }

    return data.isFavorited;
  },

  /**
   * 즐겨찾기 토글 (추가/제거)
   */
  async toggleFavorite(userId, storeId, action) {
    const response = await fetch('/api/auth/users/favorite/toggle', {
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
      throw new Error(`즐겨찾기 토글 실패: ${response.status}`);
    }

    const data = await response.json();
    
    if (!data.success) {
      throw new Error(data.error || '즐겨찾기 토글 실패');
    }

    return data;
  }
};

// 전역 등록
window.favoriteRepository = favoriteRepository;
