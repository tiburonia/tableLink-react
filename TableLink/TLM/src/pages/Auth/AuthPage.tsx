import { useState } from 'react'
import styles from './AuthPage.module.css'
import * as authApi from '@/shared/api/authApi'

type AuthMode = 'login' | 'register'

interface LoginData {
  email: string
  password: string
}

interface RegisterData {
  name: string
  email: string
  phone: string
  password: string
  passwordConfirm: string
  agreeTerms: boolean
}

interface FormErrors {
  name?: string
  email?: string
  phone?: string
  password?: string
  passwordConfirm?: string
  agreeTerms?: string
}

export function AuthPage() {
  const [mode, setMode] = useState<AuthMode>('login')
  const [showPassword, setShowPassword] = useState(false)
  const [showPasswordConfirm, setShowPasswordConfirm] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [registerSuccess, setRegisterSuccess] = useState(false)
  const [apiError, setApiError] = useState<string | null>(null)

  // 로그인 폼 상태
  const [loginData, setLoginData] = useState<LoginData>({
    email: '',
    password: '',
  })

  // 회원가입 폼 상태
  const [registerData, setRegisterData] = useState<RegisterData>({
    name: '',
    email: '',
    phone: '',
    password: '',
    passwordConfirm: '',
    agreeTerms: false,
  })

  const [errors, setErrors] = useState<FormErrors>({})

  // 이메일 유효성 검사
  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }

  // 전화번호 유효성 검사
  const validatePhone = (phone: string): boolean => {
    const phoneRegex = /^01[0-9]-?[0-9]{3,4}-?[0-9]{4}$/
    return phoneRegex.test(phone.replace(/-/g, ''))
  }

  // 비밀번호 유효성 검사 (최소 8자, 영문+숫자)
  const validatePassword = (password: string): boolean => {
    return password.length >= 8 && /[a-zA-Z]/.test(password) && /[0-9]/.test(password)
  }

  // 로그인 폼 유효성 검사
  const validateLoginForm = (): boolean => {
    const newErrors: FormErrors = {}

    if (!loginData.email) {
      newErrors.email = '이메일을 입력해주세요'
    } else if (!validateEmail(loginData.email)) {
      newErrors.email = '올바른 이메일 형식이 아닙니다'
    }

    if (!loginData.password) {
      newErrors.password = '비밀번호를 입력해주세요'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  // 회원가입 폼 유효성 검사
  const validateRegisterForm = (): boolean => {
    const newErrors: FormErrors = {}

    if (!registerData.name.trim()) {
      newErrors.name = '이름을 입력해주세요'
    } else if (registerData.name.trim().length < 2) {
      newErrors.name = '이름은 2자 이상이어야 합니다'
    }

    if (!registerData.email) {
      newErrors.email = '이메일을 입력해주세요'
    } else if (!validateEmail(registerData.email)) {
      newErrors.email = '올바른 이메일 형식이 아닙니다'
    }

    if (!registerData.phone) {
      newErrors.phone = '전화번호를 입력해주세요'
    } else if (!validatePhone(registerData.phone)) {
      newErrors.phone = '올바른 전화번호 형식이 아닙니다'
    }

    if (!registerData.password) {
      newErrors.password = '비밀번호를 입력해주세요'
    } else if (!validatePassword(registerData.password)) {
      newErrors.password = '비밀번호는 8자 이상, 영문과 숫자를 포함해야 합니다'
    }

    if (!registerData.passwordConfirm) {
      newErrors.passwordConfirm = '비밀번호 확인을 입력해주세요'
    } else if (registerData.password !== registerData.passwordConfirm) {
      newErrors.passwordConfirm = '비밀번호가 일치하지 않습니다'
    }

    if (!registerData.agreeTerms) {
      newErrors.agreeTerms = '이용약관에 동의해주세요'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  // 로그인 처리
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateLoginForm()) return

    setIsLoading(true)
    setApiError(null)

    try {
      console.log('🔐 [TLM 로그인 요청]', loginData.email)

      const response = await authApi.login({
        email: loginData.email,
        password: loginData.password,
      })

      if (response.success && response.data) {
        console.log('✅ 로그인 성공!')
        
        // 토큰 및 회원 정보 저장
        authApi.saveTokens(response.data.accessToken, response.data.refreshToken)
        authApi.saveMember(response.data.member)

        // 홈으로 이동하여 App.tsx에서 인증 상태 및 매장 소유 여부 확인
        window.location.href = '/'
      } else {
        setApiError(response.error || '로그인에 실패했습니다')
      }
    } catch (error) {
      console.error('❌ 로그인 실패:', error)
      setApiError('서버와의 연결에 실패했습니다')
    } finally {
      setIsLoading(false)
    }
  }

  // 회원가입 처리
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateRegisterForm()) return

    setIsLoading(true)
    setApiError(null)

    try {
      console.log('📝 [TLM 회원가입 요청]', registerData.email)

      // 서버에서 bcrypt 해싱 처리하므로 평문 비밀번호 전송
      const response = await authApi.signup({
        email: registerData.email,
        password: registerData.password,
        name: registerData.name || undefined,
        phone: registerData.phone.replace(/-/g, '') || undefined, // 하이픈 제거
      })

      if (response.success) {
        console.log('✅ 회원가입 성공!')
        setRegisterSuccess(true)

        // 3초 후 로그인 화면으로 이동
        setTimeout(() => {
          setRegisterSuccess(false)
          setMode('login')
          // 이메일은 유지하여 로그인 편의 제공
          setLoginData({ email: registerData.email, password: '' })
          setRegisterData({
            name: '',
            email: '',
            phone: '',
            password: '',
            passwordConfirm: '',
            agreeTerms: false,
          })
        }, 3000)
      } else {
        setApiError(response.error || '회원가입에 실패했습니다')
      }
    } catch (error) {
      console.error('❌ 회원가입 실패:', error)
      setApiError('서버와의 연결에 실패했습니다')
    } finally {
      setIsLoading(false)
    }
  }

  // 모드 전환
  const switchMode = (newMode: AuthMode) => {
    setMode(newMode)
    setErrors({})
    setApiError(null)
    setRegisterSuccess(false)
  }

  // 전화번호 자동 포맷팅
  const formatPhone = (value: string): string => {
    const numbers = value.replace(/[^0-9]/g, '')
    if (numbers.length <= 3) return numbers
    if (numbers.length <= 7) return `${numbers.slice(0, 3)}-${numbers.slice(3)}`
    return `${numbers.slice(0, 3)}-${numbers.slice(3, 7)}-${numbers.slice(7, 11)}`
  }

  return (
    <div className="mobile-app">
      <div className="mobile-content">
        <div className={styles.page}>
          {/* 로고 */}
          <div className={styles.logo}>
            <div className={styles.logoIcon}>🏪</div>
            <div className={styles.logoText}>TableLink</div>
            <div className={styles.logoSubtext}>매장 관리 시스템</div>
          </div>

          {/* 로그인 폼 */}
          {mode === 'login' && (
            <form className={styles.form} onSubmit={handleLogin}>
              <h2>로그인</h2>
              <p>매장 관리를 시작하세요</p>

              {apiError && (
                <div className={styles.errorAlert}>
                  <span>⚠️</span>
                  <p>{apiError}</p>
                </div>
              )}

              <div className="input-group">
                <label htmlFor="login-email">이메일</label>
                <input
                  id="login-email"
                  type="email"
                  placeholder="이메일을 입력하세요"
                  value={loginData.email}
                  onChange={(e) => setLoginData({ ...loginData, email: e.target.value })}
                  className={errors.email ? 'input-error' : ''}
                />
                {errors.email && <div className="error-message">{errors.email}</div>}
              </div>

              <div className="input-group">
                <label htmlFor="login-password">비밀번호</label>
                <div className={styles.passwordWrapper}>
                  <input
                    id="login-password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="비밀번호를 입력하세요"
                    value={loginData.password}
                    onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
                    className={errors.password ? 'input-error' : ''}
                  />
                  <button
                    type="button"
                    className={styles.togglePassword}
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? '🙈' : '👁️'}
                  </button>
                </div>
                {errors.password && <div className="error-message">{errors.password}</div>}
              </div>

              <button
                type="submit"
                className={`btn-primary ${styles.submitBtn}`}
                disabled={isLoading}
              >
                {isLoading ? '로그인 중...' : '로그인'}
              </button>

              {/* 빠른 로그인 버튼 */}
              <button
                type="button"
                className={styles.quickLoginBtn}
                disabled={isLoading}
                onClick={async () => {
                  setIsLoading(true)
                  setApiError(null)
                  try {
                    const response = await authApi.login({
                      email: 'junhuck7150@gmail.com',
                      password: 'cchcch11@',
                    })
                    if (response.success && response.data) {
                      console.log('✅ 빠른 로그인 성공!')
                      // 토큰 및 회원 정보 저장
                      authApi.saveTokens(response.data.accessToken, response.data.refreshToken)
                      authApi.saveMember(response.data.member)
                      // 페이지 새로고침하여 App.tsx에서 인증 상태 확인
                      window.location.reload()
                    } else {
                      setApiError(response.error || '로그인에 실패했습니다.')
                    }
                  } catch {
                    setApiError('서버 연결에 실패했습니다.')
                  } finally {
                    setIsLoading(false)
                  }
                }}
              >
                ⚡ 빠른 로그인 (테스트 계정)
              </button>

              <div className={styles.divider}>
                <span>또는</span>
              </div>

              <div className={styles.switchText}>
                아직 계정이 없으신가요?
                <button type="button" onClick={() => switchMode('register')}>
                  회원가입
                </button>
              </div>
            </form>
          )}

          {/* 회원가입 폼 */}
          {mode === 'register' && (
            <form className={styles.form} onSubmit={handleRegister}>
              <h2>회원가입</h2>
              <p>매장 관리자 계정을 만드세요</p>

              {registerSuccess && (
                <div className={styles.successMessage}>
                  <span>🎉</span>
                  <p>회원가입이 완료되었습니다!<br />로그인 화면으로 이동합니다...</p>
                </div>
              )}

              {apiError && !registerSuccess && (
                <div className={styles.errorAlert}>
                  <span>⚠️</span>
                  <p>{apiError}</p>
                </div>
              )}

              <div className="input-group">
                <label htmlFor="register-name">이름</label>
                <input
                  id="register-name"
                  type="text"
                  placeholder="이름을 입력하세요"
                  value={registerData.name}
                  onChange={(e) => setRegisterData({ ...registerData, name: e.target.value })}
                  className={errors.name ? 'input-error' : ''}
                  disabled={registerSuccess}
                />
                {errors.name && <div className="error-message">{errors.name}</div>}
              </div>

              <div className="input-group">
                <label htmlFor="register-email">이메일</label>
                <input
                  id="register-email"
                  type="email"
                  placeholder="이메일을 입력하세요"
                  value={registerData.email}
                  onChange={(e) => setRegisterData({ ...registerData, email: e.target.value })}
                  className={errors.email ? 'input-error' : ''}
                  disabled={registerSuccess}
                />
                {errors.email && <div className="error-message">{errors.email}</div>}
              </div>

              <div className="input-group">
                <label htmlFor="register-phone">전화번호</label>
                <input
                  id="register-phone"
                  type="tel"
                  placeholder="010-0000-0000"
                  value={registerData.phone}
                  onChange={(e) =>
                    setRegisterData({ ...registerData, phone: formatPhone(e.target.value) })
                  }
                  className={errors.phone ? 'input-error' : ''}
                  disabled={registerSuccess}
                />
                {errors.phone && <div className="error-message">{errors.phone}</div>}
              </div>

              <div className="input-group">
                <label htmlFor="register-password">비밀번호</label>
                <div className={styles.passwordWrapper}>
                  <input
                    id="register-password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="8자 이상, 영문+숫자 조합"
                    value={registerData.password}
                    onChange={(e) =>
                      setRegisterData({ ...registerData, password: e.target.value })
                    }
                    className={errors.password ? 'input-error' : ''}
                    disabled={registerSuccess}
                  />
                  <button
                    type="button"
                    className={styles.togglePassword}
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? '🙈' : '👁️'}
                  </button>
                </div>
                {errors.password && <div className="error-message">{errors.password}</div>}
              </div>

              <div className="input-group">
                <label htmlFor="register-password-confirm">비밀번호 확인</label>
                <div className={styles.passwordWrapper}>
                  <input
                    id="register-password-confirm"
                    type={showPasswordConfirm ? 'text' : 'password'}
                    placeholder="비밀번호를 다시 입력하세요"
                    value={registerData.passwordConfirm}
                    onChange={(e) =>
                      setRegisterData({ ...registerData, passwordConfirm: e.target.value })
                    }
                    className={errors.passwordConfirm ? 'input-error' : ''}
                    disabled={registerSuccess}
                  />
                  <button
                    type="button"
                    className={styles.togglePassword}
                    onClick={() => setShowPasswordConfirm(!showPasswordConfirm)}
                  >
                    {showPasswordConfirm ? '🙈' : '👁️'}
                  </button>
                </div>
                {errors.passwordConfirm && (
                  <div className="error-message">{errors.passwordConfirm}</div>
                )}
              </div>

              <div className={styles.checkboxGroup}>
                <input
                  id="agree-terms"
                  type="checkbox"
                  checked={registerData.agreeTerms}
                  onChange={(e) =>
                    setRegisterData({ ...registerData, agreeTerms: e.target.checked })
                  }
                  disabled={registerSuccess}
                />
                <label htmlFor="agree-terms">
                  <a href="#terms">이용약관</a> 및 <a href="#privacy">개인정보처리방침</a>에
                  동의합니다
                </label>
              </div>
              {errors.agreeTerms && <div className="error-message">{errors.agreeTerms}</div>}

              <button
                type="submit"
                className={`btn-primary ${styles.submitBtn}`}
                disabled={isLoading || registerSuccess}
              >
                {isLoading ? '가입 처리 중...' : '회원가입'}
              </button>

              <div className={styles.divider}>
                <span>또는</span>
              </div>

              <div className={styles.switchText}>
                이미 계정이 있으신가요?
                <button type="button" onClick={() => switchMode('login')}>
                  로그인
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
