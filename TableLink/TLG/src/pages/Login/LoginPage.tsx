import { useNavigate } from 'react-router-dom'
import { useLoginForm } from './hooks/index'
import { LoginForm } from './ui/index'
import { useAuthStore } from '@/features/auth'
import styles from './LoginPage.module.css'

export const LoginPage = () => {
  const navigate = useNavigate()
  const { setUser } = useAuthStore()
  const { formData, setFormData, errors, isLoading, handleSubmit } = useLoginForm((user) => {
    // 로그인 성공 시 인증 상태 업데이트 후 메인 페이지로 이동
    setUser(user)
    navigate('/main')
  })

  return (
    <div className="mobile-app">
    
        <div className={styles.loginPage}>
          <div className={styles.loginPageContainer}>
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
    
    </div>
  )
}
