/**
 * POS Login Page - TLM 계정으로 로그인 후 매장 선택
 */

import { useState } from 'react'
import * as authApi from '@/shared/api/authApi'
import type { Member, Store } from '@/shared/api/authApi'
import { LoadingSpinner } from '@/shared/ui'
import styles from './LoginPage.module.css'

interface LoginPageProps {
  onLoginSuccess: (store: Store) => void
}

type PageMode = 'login' | 'selectStore'

export function LoginPage({ onLoginSuccess }: LoginPageProps) {
  const [mode, setMode] = useState<PageMode>('login')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  // 로그인 폼 상태
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  
  // 매장 선택 상태
  const [member, setMember] = useState<Member | null>(null)
  const [stores, setStores] = useState<Store[]>([])

  // 이메일 유효성 검사
  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }

  // 폼 유효성 검사
  const isFormValid = email.trim() !== '' && password.trim() !== '' && validateEmail(email)

  // 로그인 처리
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!isFormValid) {
      setError('이메일과 비밀번호를 올바르게 입력해주세요.')
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      console.log('🔐 [POS] TLM 계정 로그인 요청:', email)

      const response = await authApi.login({
        email,
        password,
      })

      if (response.success && response.data) {
        console.log('✅ [POS] 로그인 성공!')
        
        // 토큰 및 회원 정보 저장
        authApi.saveTokens(response.data.accessToken, response.data.refreshToken)
        authApi.saveMember(response.data.member)
        setMember(response.data.member)

        // 매장 목록 조회
        await fetchStores(response.data.member.id)
      } else {
        setError(response.error || '로그인에 실패했습니다.')
      }
    } catch (err) {
      console.error('❌ [POS] 로그인 실패:', err)
      setError('서버와의 연결에 실패했습니다.')
    } finally {
      setIsLoading(false)
    }
  }

  // 매장 목록 조회
  const fetchStores = async (memberId: string) => {
    setIsLoading(true)
    setError(null)

    try {
      console.log('📋 [POS] 매장 목록 조회:', memberId)

      const response = await authApi.getMyStores(memberId)

      if (response.success && response.stores) {
        console.log('✅ [POS] 매장 목록 조회 성공:', response.count, '개')
        setStores(response.stores)

        if (response.stores.length === 0) {
          setError('등록된 매장이 없습니다. TLM에서 매장을 먼저 등록해주세요.')
        } else if (response.stores.length === 1) {
          // 매장이 1개면 자동 선택
          handleSelectStore(response.stores[0])
        } else {
          // 매장이 여러 개면 선택 화면으로
          setMode('selectStore')
        }
      } else {
        setError(response.error || '매장 목록을 불러오지 못했습니다.')
      }
    } catch (err) {
      console.error('❌ [POS] 매장 목록 조회 실패:', err)
      setError('서버와의 연결에 실패했습니다.')
    } finally {
      setIsLoading(false)
    }
  }

  // 매장 선택 처리
  const handleSelectStore = (store: Store) => {
    console.log('🏪 [POS] 매장 선택:', store.name)
    authApi.saveStore(store)
    onLoginSuccess(store)
  }

  // 로그아웃 (매장 선택 화면에서 뒤로가기)
  const handleBack = () => {
    authApi.logout()
    setMember(null)
    setStores([])
    setMode('login')
    setEmail('')
    setPassword('')
    setError(null)
  }

  // 로그인 폼
  const renderLoginForm = () => (
    <form className={styles.form} onSubmit={handleLogin}>
      <h2 className={styles.title}>POS 로그인</h2>
      <p className={styles.subtitle}>TLM 계정으로 로그인하세요</p>

      {error && <div className={styles.error}>{error}</div>}

      <div className={styles.inputGroup}>
        <label htmlFor="email" className={styles.label}>이메일</label>
        <input
          id="email"
          type="email"
          className={styles.input}
          placeholder="이메일을 입력하세요"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={isLoading}
          autoComplete="email"
        />
      </div>

      <div className={styles.inputGroup}>
        <label htmlFor="password" className={styles.label}>비밀번호</label>
        <div className={styles.passwordWrapper}>
          <input
            id="password"
            type={showPassword ? 'text' : 'password'}
            className={styles.input}
            placeholder="비밀번호를 입력하세요"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={isLoading}
            autoComplete="current-password"
          />
          <button
            type="button"
            className={styles.togglePassword}
            onClick={() => setShowPassword(!showPassword)}
            tabIndex={-1}
          >
            {showPassword ? '🙈' : '👁️'}
          </button>
        </div>
      </div>

      <button
        type="submit"
        className={styles.submitButton}
        disabled={isLoading || !isFormValid}
      >
        {isLoading ? '로그인 중...' : '로그인'}
      </button>

      <p className={styles.notice}>
        ※ TLM(TableLink Manager)에서 등록한 계정으로 로그인하세요.
      </p>
    </form>
  )

  // 매장 선택 화면
  const renderStoreSelection = () => (
    <div className={styles.storeSelection}>
      <button className={styles.backButton} onClick={handleBack}>
        ← 뒤로
      </button>
      
      <h2 className={styles.title}>매장 선택</h2>
      <p className={styles.subtitle}>
        {member?.name || member?.email}님, POS를 사용할 매장을 선택하세요
      </p>

      {error && <div className={styles.error}>{error}</div>}

      <div className={styles.storeList}>
        {stores.map((store) => (
          <button
            key={store.id}
            className={styles.storeCard}
            onClick={() => handleSelectStore(store)}
          >
            <div className={styles.storeIcon}>🏪</div>
            <div className={styles.storeInfo}>
              <h3 className={styles.storeName}>{store.name}</h3>
              {store.full_address && (
                <p className={styles.storeAddress}>{store.full_address}</p>
              )}
              <div className={styles.storeStatus}>
                <span className={store.is_open ? styles.open : styles.closed}>
                  {store.is_open ? '🟢 영업중' : '🔴 영업종료'}
                </span>
                {store.rating_average && (
                  <span className={styles.rating}>
                    ⭐ {store.rating_average.toFixed(1)}
                  </span>
                )}
              </div>
            </div>
            <div className={styles.storeArrow}>→</div>
          </button>
        ))}
      </div>
    </div>
  )

  if (isLoading && mode === 'login' && member) {
    return (
      <div className={styles.page}>
        <div className={styles.container}>
          <LoadingSpinner size="large" text="매장 정보를 불러오는 중..." />
        </div>
      </div>
    )
  }

  return (
    <div className={styles.page}>
      <div className={styles.container}>
        <div className={styles.logo}>
          <div className={styles.logoIcon}>📱</div>
          <div className={styles.logoText}>TableLink POS</div>
        </div>

        {mode === 'login' ? renderLoginForm() : renderStoreSelection()}
      </div>
    </div>
  )
}
