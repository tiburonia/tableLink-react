/**
 * MyPage Repository
 * 마이페이지 데이터 계층 - API 호출 담당
 */

export const mypageRepository = {
  /**
   * 마이페이지 통합 데이터 조회
   * @param {number} userId - users.id (PK 값)
   */
  async getMypageData(userId) {
    try {
      const response = await fetch(`/api/auth/users/${userId}/mypage`);

      if (!response.ok) {
        throw new Error('마이페이지 데이터 조회 실패');
      }

      const result = await response.json();
      return result.data;
    } catch (error) {
      console.error('❌ getMypageData 실패:', error);
      throw error;
    }
  },

  /**
   * 사용자 정보 조회 (레거시 - 사용하지 않음)
   * @deprecated getMypageData 통합 API 사용
   */
  async getUserInfo(userId) {
    try {
      const response = await fetch('/api/auth/users/info', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId })
      });

      if (!response.ok) {
        throw new Error('사용자 정보 조회 실패');
      }

      const data = await response.json();
      return data.user;
    } catch (error) {
      console.error('❌ getUserInfo 실패:', error);
      throw error;
    }
  },

  };