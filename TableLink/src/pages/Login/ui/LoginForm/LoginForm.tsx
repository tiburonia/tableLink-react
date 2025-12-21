import { Input, Button } from '@/shared/ui'
import './LoginForm.css'

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
    <form className="login-form" onSubmit={handleSubmit}>
      <div className="login-form__header">
        <h1 className="login-form__title">TableLink</h1>
        <p className="login-form__subtitle">음식점 주문 관리 시스템</p>
      </div>

      {generalError && <div className="login-form__alert">{generalError}</div>}

      <div className="login-form__content">
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

      <div className="login-form__actions">
        <Button type="submit" size="lg" isLoading={isLoading}>
          로그인
        </Button>
      </div>

      <div className="login-form__footer">
        <a href="#" className="login-form__link">
          비밀번호를 잊으셨나요?
        </a>
        <span className="login-form__divider">|</span>
        <a href="#" className="login-form__link">
          회원가입
        </a>
      </div>

      <div className="login-form__hint">
        <p style={{ fontSize: '0.75rem', color: '#95a5a6', marginTop: '1rem' }}>
          테스트 계정: admin@naver.com / 1234
        </p>
      </div>
    </form>
  )
}
