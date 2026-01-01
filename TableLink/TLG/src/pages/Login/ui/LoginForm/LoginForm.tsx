import { Link } from 'react-router-dom'
import { Input, Button } from '@/shared/ui'
import styles from './LoginForm.module.css'

interface LoginFormProps {
  Id: string
  password: string
  onIdChange: (value: string) => void
  onPasswordChange: (value: string) => void
  onSubmit: () => void
  isLoading?: boolean
  IdError?: string
  passwordError?: string
  generalError?: string
}

export const LoginForm = ({
  Id,
  password,
  onIdChange,
  onPasswordChange,
  onSubmit,
  isLoading = false,
  IdError,
  passwordError,
  generalError,
}: LoginFormProps) => {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit()
  }

  return (
    <form className={styles.loginForm} onSubmit={handleSubmit}>
      <div className={styles.loginFormHeader}>
        <h1 className={styles.loginFormTitle}>TableLink</h1>
        <p className={styles.loginFormSubtitle}>음식점 주문 관리 시스템</p>
      </div>

      {generalError && <div className={styles.loginFormAlert}>{generalError}</div>}

      <div className={styles.loginFormContent}>
        <Input
          label="아이디"
          type="text"
          placeholder="아이디를 입력해주세요"
          value={Id}
          onChange={(e) => onIdChange(e.target.value)}
          error={IdError}
          disabled={isLoading}
        />

        <Input
          label="비밀번호"
          type="password"
          placeholder="비밀번호를 입력해주세요"
          value={password}
          onChange={(e) => onPasswordChange(e.target.value)}
          error={passwordError}
          disabled={isLoading}
        />
      </div>

      <div className={styles.loginFormActions}>
        <Button type="submit" size="lg" isLoading={isLoading}>
          로그인
        </Button>
      </div>

      <div className={styles.loginFormFooter}>
        <a href="#" className={styles.loginFormLink}>
          비밀번호를 잊으셨나요?
        </a>
        <span className={styles.loginFormDivider}>|</span>
        <Link to="/signup" className={styles.loginFormLink}>
          회원가입
        </Link>
      </div>

      <div className={styles.loginFormHint}>
        <p style={{ fontSize: '0.75rem', color: '#95a5a6', marginTop: '1rem' }}>
          테스트 계정: admin@naver.com / 1234
        </p>
      </div>
    </form>
  )
}
