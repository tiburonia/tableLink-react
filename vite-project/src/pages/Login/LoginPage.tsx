import { useNavigate } from 'react-router-dom'
import { useLoginForm } from './hooks/index'
import { LoginForm } from './ui/index'
import './LoginPage.css'

export const LoginPage = () => {
  const navigate = useNavigate()
  const { formData, setFormData, errors, isLoading, handleSubmit } = useLoginForm(() => {
    // 로그인 성공 시 페이지 새로고침으로 상태 반영
    window.location.href = '/'
  })

  return (
    <div className="login-page">
      <div className="login-page__container">
        <LoginForm
          Id={formData.Id}
          password={formData.password}
          onIdChange={(Id: string) => setFormData({ ...formData, Id })}
          onPasswordChange={(password: string) => setFormData({ ...formData, password })}
          onSubmit={handleSubmit}
          isLoading={isLoading}
          IdError={errors.Id}
          passwordError={errors.password}
          generalError={errors.general}
        />
      </div>
    </div>
  )
}
