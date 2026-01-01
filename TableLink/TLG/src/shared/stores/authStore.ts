import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

/**
 * 인증 상태 관리를 위한 Zustand Store
 * localStorage를 사용하여 토큰 및 사용자 정보 영구 저장
 * API 응답 필드: user_id, user_pk, uuid
 */

interface User {
  user_id: string;    // 로그인 아이디 (users.user_id)
  user_pk: number;    // DB PK (users.id)
  uuid: string;       // UUID (users.uuid)
  name: string;
  phone?: string;
  email?: string;
  address?: string;
  birth?: string;
  gender?: string;
}

interface AuthState {
  // 상태
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  
  // Actions
  login: (userData: User, accessToken: string, refreshToken: string) => void;
  logout: () => void;
  updateAccessToken: (newAccessToken: string) => void;
  updateUser: (userData: Partial<User>) => void;
  clearAuth: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      // 초기 상태
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,

      // 로그인
      login: (userData, accessToken, refreshToken) => {
        set({
          user: userData,
          accessToken,
          refreshToken,
          isAuthenticated: true
        });
      },

      // 로그아웃
      logout: () => {
        set({
          user: null,
          accessToken: null,
          refreshToken: null,
          isAuthenticated: false
        });
      },

      // Access Token 갱신
      updateAccessToken: (newAccessToken) => {
        set({ accessToken: newAccessToken });
      },

      // 사용자 정보 업데이트
      updateUser: (userData) => {
        set((state) => ({
          user: state.user ? { ...state.user, ...userData } : null
        }));
      },

      // 인증 정보 전체 삭제
      clearAuth: () => {
        set({
          user: null,
          accessToken: null,
          refreshToken: null,
          isAuthenticated: false
        });
      }
    }),
    {
      name: 'tablelink-auth-storage', // localStorage 키 이름
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        user: state.user,
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
        isAuthenticated: state.isAuthenticated
      })
    }
  )
);
