
// API 호출 유틸리티 함수들
class API {
  static async getStores() {
    try {
      const response = await fetch('/api/stores');
      const data = await response.json();
      return data.stores || [];
    } catch (error) {
      console.error('stores 조회 실패:', error);
      return [];
    }
  }

  static async getUserInfo(userId) {
    try {
      const response = await fetch(`/api/users/${userId}`);
      if (response.ok) {
        const data = await response.json();
        return data.user;
      }
      return null;
    } catch (error) {
      console.error('사용자 정보 조회 실패:', error);
      return null;
    }
  }

  static async updateUserInfo(userId, userInfo) {
    try {
      const response = await fetch(`/api/users/${userId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userInfo)
      });
      return response.ok;
    } catch (error) {
      console.error('사용자 정보 업데이트 실패:', error);
      return false;
    }
  }

  static async login(id, pw) {
    try {
      const response = await fetch('/api/users/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ id, pw })
      });
      
      if (response.ok) {
        const data = await response.json();
        return data;
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error);
      }
    } catch (error) {
      throw error;
    }
  }

  static async signup(userInfo) {
    try {
      const response = await fetch('/api/users/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userInfo)
      });
      
      if (response.ok) {
        const data = await response.json();
        return data;
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error);
      }
    } catch (error) {
      throw error;
    }
  }
}

window.API = API;
