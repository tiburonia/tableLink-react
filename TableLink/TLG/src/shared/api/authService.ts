// 인증 서비스 (백엔드 연동)
// HTTPS 사용 권장 - 비밀번호 평문이 전송되므로 반드시 HTTPS 사용
const API_BASE = import.meta.env.VITE_API_URL || 'https://stunning-broccoli-7vwxrrpqr7vj29pj-5000.app.github.dev'

// HTTPS 확인 경고 (개발 환경에서만)
if (import.meta.env.DEV && !API_BASE.startsWith('https://')) {
  console.warn('⚠️ [보안 경고] API가 HTTPS를 사용하지 않습니다. 비밀번호가 평문으로 전송될 수 있습니다.')
}

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
      const res = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, password }),
      })
      const data = await safeJson(res)
      if (!res.ok) {
        return { success: false, message: data?.error || '로그인 실패' }
      }
      
      // 로그인 성공 시 사용자 정보 저장 (새 API 응답 필드)
      const user = {
        user_id: data.user.user_id,      // 로그인 아이디
        user_pk: data.user.user_pk,      // DB PK
        uuid: data.user.uuid,            // UUID
        name: data.user.name,
        phone: data.user.phone,
        email: data.user.email,
        address: data.user.address,
        birth: data.user.birth,
        gender: data.user.gender,
        accessToken: data.user.accessToken,
        refreshToken: data.user.refreshToken
      }

      localStorage.setItem('user', JSON.stringify(user))
      localStorage.setItem('user_id', user.user_id)
      localStorage.setItem('user_pk', String(user.user_pk))
      localStorage.setItem('user_uuid', user.uuid || '')
      localStorage.setItem('user_name', user.name || '')
      localStorage.setItem('is_logged_in', 'true')
      
      // JWT 토큰 저장
      if (user.accessToken) {
        localStorage.setItem('accessToken', user.accessToken)
      }
      if (user.refreshToken) {
        localStorage.setItem('refreshToken', user.refreshToken)
      }

      return { success: true, user }
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

  // 회원가입 (DB 스키마에 맞춤: user_id, user_pw, name, phone 필수)
  signup: async (signupData: { user_id: string; user_pw: string; name: string; phone: string }) => {
    try {
      console.log('📡 [authService] 회원가입 요청:', signupData)
      const res = await fetch(`${API_BASE}/auth/users/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(signupData),
      })
      const data = await safeJson(res)
      console.log('📡 [authService] 회원가입 응답:', data)
      
      if (!res.ok) return { success: false, message: data?.error || '회원가입 실패' }
      return { success: true, user: data.user, message: data.message }
    } catch (err) {
      console.error('authService.signup error', err)
      return { success: false, message: '서버 연결 실패' }
    }
  },

  // 아이디 중복 확인
  checkIdAvailable: async (userId: string) => {
    try {
      console.log('📡 [authService] 아이디 중복확인:', userId)
      const res = await fetch(`${API_BASE}/auth/users/check-id`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: userId }),
      })
      const data = await safeJson(res)
      console.log('📡 [authService] 아이디 중복확인 응답:', data)
      
      if (!res.ok) return { available: false, message: data?.error || '확인 실패' }
      return { available: data.available, message: data.message }
    } catch (err) {
      console.error('authService.checkIdAvailable error', err)
      return { available: false, message: '서버 연결 실패' }
    }
  },

  // 전화번호 중복 확인
  checkPhoneAvailable: async (phone: string) => {
    try {
      console.log('📡 [authService] 전화번호 중복확인:', phone)
      const res = await fetch(`${API_BASE}/auth/users/check-phone`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone }),
      })
      const data = await safeJson(res)
      console.log('📡 [authService] 전화번호 중복확인 응답:', data)
      
      if (!res.ok) return { available: false, message: data?.error || '확인 실패' }
      return { available: data.available, message: data.message }
    } catch (err) {
      console.error('authService.checkPhoneAvailable error', err)
      return { available: false, message: '서버 연결 실패' }
    }
  },

  logout: () => {
    localStorage.removeItem('user')
    localStorage.removeItem('user_id')
    localStorage.removeItem('user_pk')
    localStorage.removeItem('user_uuid')
    localStorage.removeItem('user_name')
    localStorage.removeItem('is_logged_in')
    localStorage.removeItem('accessToken')
    localStorage.removeItem('refreshToken')
  },

  isAuthenticated: (): boolean => {
    return localStorage.getItem('is_logged_in') === 'true'
  },

  getUser: () => {
    const userStr = localStorage.getItem('user')
    if (userStr) {
      try {
        const user = JSON.parse(userStr)
        return {
          user_id: user.user_id || '',
          user_pk: user.user_pk || 0,
          uuid: user.uuid || '',
          name: user.name || '',
          phone: user.phone || '',
          email: user.email || '',
          address: user.address || '',
          birth: user.birth || '',
          gender: user.gender || '',
        }
      } catch {
        return {
          user_id: localStorage.getItem('user_id') || '',
          user_pk: parseInt(localStorage.getItem('user_pk') || '0'),
          uuid: localStorage.getItem('user_uuid') || '',
          name: localStorage.getItem('user_name') || '',
        }
      }
    }
    return {
      user_id: localStorage.getItem('user_id') || '',
      user_pk: parseInt(localStorage.getItem('user_pk') || '0'),
      uuid: localStorage.getItem('user_uuid') || '',
      name: localStorage.getItem('user_name') || '',
    }
  },
}
