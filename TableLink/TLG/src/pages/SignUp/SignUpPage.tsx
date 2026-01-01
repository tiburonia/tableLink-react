import { useNavigate } from 'react-router-dom'
import { useSignUpForm } from './hooks'
import { SignUpForm } from './ui'
import styles from './SignUpPage.module.css'

export const SignUpPage = () => {
  const navigate = useNavigate()
  
  const { 
    formData, 
    setFormData, 
    validation, 
    isLoading, 
    handleCheckId,
    handleCheckPhone,
    handleSubmit 
  } = useSignUpForm(() => {
    // 회원가입 성공 시 로그인 페이지로 이동
    navigate('/login')
  })

  const handleGoToLogin = () => {
    navigate('/login')
  }

  return (
    <div className="mobile-app">
        <div className="mobile-content">
      <div className={styles.signupPage}>
        <div className={styles.signupPageContainer}>
          <SignUpForm
            formData={formData}
            validation={validation}
            isLoading={isLoading}
            onFormDataChange={setFormData}
            onCheckId={handleCheckId}
            onCheckPhone={handleCheckPhone}
            onSubmit={handleSubmit}
            onGoToLogin={handleGoToLogin}
          />
        </div>
      </div>
      </div>
    </div>
  )
}
