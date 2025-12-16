// 인증 서비스 (백엔드 연동)
const API_BASE =  'https://stunning-broccoli-7vwxrrpqr7vj29pj-5000.app.github.dev'

async function safeJson(res: Response) {
  try {
    return await res.json()
  } catch {
    return null
  }
}

export const authService = {
  login: async (id: string, password: string): Promise<{ success: boolean; message?: string; user?: any }> => {
    try {
      const res = await fetch(`${API_BASE}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, password }),
      })
      const data = await safeJson(res)
      if (!res.ok) {
        return { success: false, message: data?.error || '로그인 실패' }
      }
      // 로그인 성공 시 사용자 정보 저장
      const user = {
        user_id: data.user.id,
        user_pk: data.user.userId,
        name: data.user.name,
        phone: data.user.phone,
        email: data.user.email,
        address: data.user.address,
        birth: data.user.birth,
        gender: data.user.gender
      }

      localStorage.setItem('user', JSON.stringify(user))
      localStorage.setItem('user_id', user.user_id)
      localStorage.setItem('user_name', user.name || '')
      localStorage.setItem('is_logged_in', 'true')

      return { success: true, user: data.user }
    } catch (err) {
      console.error('authService.login error', err)
      return { success: false, message: '서버 연결 실패' }
    }
  },

  register: async (id: string, name: string, password: string, phone?: string) => {
    try {
      const res = await fetch(`${API_BASE}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, name, password, phone }),
      })
      const data = await safeJson(res)
      if (!res.ok) return { success: false, message: data?.error || '회원가입 실패' }
      return { success: true, user: data }
    } catch (err) {
      console.error('authService.register error', err)
      return { success: false, message: '서버 연결 실패' }
    }
  },

  logout: () => {
    localStorage.removeItem('user_id')
    localStorage.removeItem('user_name')
    localStorage.removeItem('is_logged_in')
  },

  isAuthenticated: (): boolean => {
    return localStorage.getItem('is_logged_in') === 'true'
  },

  getUser: () => {
    return {
      id: localStorage.getItem('user_id') || '',
      name: localStorage.getItem('user_name') || '',
    }
  },
}
