import { authService } from '../services/authService.js';

export async function handleLogin(email, password) {
  try {
    const result = await authService.login(email, password);
    if (result?.user) {
      window.location.hash = '#/';
      return result;
    }
    throw new Error('로그인 실패');
  } catch (error) {
    console.error('Login failed:', error);
    throw error;
  }
}

export async function handleSignup(userData) {
  try {
    const result = await authService.signup(userData);
    if (result?.user) {
      window.location.hash = '#/';
      return result;
    }
    throw new Error('회원가입 실패');
  } catch (error) {
    console.error('Signup failed:', error);
    throw error;
  }
}

export async function handleLogout() {
  try {
    await authService.logout();
    window.location.hash = '#/login';
  } catch (error) {
    console.error('Logout failed:', error);
    throw error;
  }
}

export function checkAuth() {
  return authService.isAuthenticated();
}

export function getCurrentUser() {
  return authService.getCurrentUser();
}
