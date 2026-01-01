import type { SignUpFormData, ValidationState } from '../../hooks'
import styles from './SignUpForm.module.css'

interface SignUpFormProps {
  formData: SignUpFormData
  validation: ValidationState
  isLoading: boolean
  onFormDataChange: (data: Partial<SignUpFormData>) => void
  onCheckId: () => void
  onCheckPhone: () => void
  onSubmit: () => void
  onGoToLogin: () => void
}

export const SignUpForm = ({
  formData,
  validation,
  isLoading,
  onFormDataChange,
  onCheckId,
  onCheckPhone,
  onSubmit,
  onGoToLogin,
}: SignUpFormProps) => {

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit()
  }

  const getInputClassName = (field: keyof ValidationState) => {
    const v = validation[field]
    if (!v.message) return styles.formInput
    
    if (field === 'userId' || field === 'phone') {
      const fieldValidation = v as { isValid: boolean; isChecked: boolean; message: string }
      if (fieldValidation.isChecked && fieldValidation.isValid) return `${styles.formInput} ${styles.success}`
      if (!fieldValidation.isValid && fieldValidation.message) return `${styles.formInput} ${styles.error}`
      if (fieldValidation.isValid && !fieldValidation.isChecked) return `${styles.formInput} ${styles.info}`
    } else {
      if (v.isValid) return `${styles.formInput} ${styles.success}`
      if (!v.isValid && v.message) return `${styles.formInput} ${styles.error}`
    }
    
    return styles.formInput
  }

  const getStatusClassName = (field: keyof ValidationState) => {
    const v = validation[field]
    if (!v.message) return styles.inputStatus
    
    if (field === 'userId' || field === 'phone') {
      const fieldValidation = v as { isValid: boolean; isChecked: boolean; message: string }
      if (fieldValidation.isChecked && fieldValidation.isValid) return `${styles.inputStatus} ${styles.success}`
      if (!fieldValidation.isValid) return `${styles.inputStatus} ${styles.error}`
      return `${styles.inputStatus} ${styles.info}`
    } else {
      if (v.isValid) return `${styles.inputStatus} ${styles.success}`
      return `${styles.inputStatus} ${styles.error}`
    }
  }

  const getStatusIcon = (field: keyof ValidationState) => {
    const v = validation[field]
    if (!v.message) return ''
    
    if (field === 'userId' || field === 'phone') {
      const fieldValidation = v as { isValid: boolean; isChecked: boolean; message: string }
      if (fieldValidation.isChecked && fieldValidation.isValid) return '✅'
      if (!fieldValidation.isValid) return '❌'
      return '⏳'
    } else {
      if (v.isValid) return '✅'
      return '❌'
    }
  }

  const getStrengthClass = (index: number) => {
    const strength = validation.password.strength
    if (index >= strength) return styles.strengthSegment
    
    const levels = ['', 'weak', 'fair', 'good', 'strong']
    const levelClass = levels[strength] || ''
    return `${styles.strengthSegment} ${styles.active} ${styles[levelClass] || ''}`
  }

  const getStrengthText = () => {
    const texts = ['비밀번호를 입력해주세요', '약함', '보통', '좋음', '매우 강함']
    return `보안 강도: ${texts[validation.password.strength]}`
  }

  const canSubmit = 
    validation.userId.isValid && 
    validation.userId.isChecked &&
    validation.password.isValid &&
    validation.passwordConfirm.isValid &&
    validation.name.isValid &&
    (!formData.phone || (validation.phone.isValid && validation.phone.isChecked))

  return (
    <form className={styles.signupForm} onSubmit={handleSubmit}>
      {/* 헤더 */}
      <div className={styles.signupFormHeader}>
        <div className={styles.logoContainer}>
          <span className={styles.logoText}>TL</span>
        </div>
        <h1 className={styles.signupFormTitle}>회원가입</h1>
        <p className={styles.signupFormSubtitle}>TableLink와 함께 새로운 주문 경험을 시작하세요</p>
      </div>

      {/* 폼 컨텐츠 */}
      <div className={styles.signupFormContent}>
        {/* 아이디 */}
        <div className={styles.formGroup}>
          <label className={styles.formLabel}>
            아이디<span className={styles.requiredMark}>*</span>
          </label>
          <div className={styles.inputContainer}>
            <input
              type="text"
              className={getInputClassName('userId')}
              placeholder="영문, 숫자 조합 (3-20자)"
              value={formData.userId}
              onChange={(e) => onFormDataChange({ userId: e.target.value })}
              autoComplete="username"
              maxLength={20}
              disabled={isLoading}
            />
            <button
              type="button"
              className={styles.checkButton}
              onClick={onCheckId}
              disabled={!validation.userId.isValid || validation.userId.isChecked || isLoading}
            >
              중복확인
            </button>
          </div>
          <div className={getStatusClassName('userId')}>
            {validation.userId.message && (
              <>
                <span className={styles.statusIcon}>{getStatusIcon('userId')}</span>
                {validation.userId.message}
              </>
            )}
          </div>
          <div className={styles.formHint}>영문과 숫자만 사용 가능합니다 (중복확인 필요)</div>
        </div>

        {/* 비밀번호 */}
        <div className={styles.formGroup}>
          <label className={styles.formLabel}>
            비밀번호<span className={styles.requiredMark}>*</span>
          </label>
          <div className={styles.inputContainer}>
            <input
              type="password"
              className={getInputClassName('password')}
              placeholder="안전한 비밀번호를 입력하세요"
              value={formData.password}
              onChange={(e) => onFormDataChange({ password: e.target.value })}
              autoComplete="new-password"
              disabled={isLoading}
            />
          </div>
          <div className={styles.passwordStrength}>
            <div className={styles.strengthBarContainer}>
              {[0, 1, 2, 3].map((i) => (
                <div key={i} className={getStrengthClass(i)} />
              ))}
            </div>
            <div className={styles.strengthText}>{getStrengthText()}</div>
          </div>
          <div className={getStatusClassName('password')}>
            {validation.password.message && (
              <>
                <span className={styles.statusIcon}>{getStatusIcon('password')}</span>
                {validation.password.message}
              </>
            )}
          </div>
        </div>

        {/* 비밀번호 확인 */}
        <div className={styles.formGroup}>
          <label className={styles.formLabel}>
            비밀번호 확인<span className={styles.requiredMark}>*</span>
          </label>
          <div className={styles.inputContainer}>
            <input
              type="password"
              className={getInputClassName('passwordConfirm')}
              placeholder="비밀번호를 다시 입력하세요"
              value={formData.passwordConfirm}
              onChange={(e) => onFormDataChange({ passwordConfirm: e.target.value })}
              autoComplete="new-password"
              disabled={isLoading}
            />
          </div>
          <div className={getStatusClassName('passwordConfirm')}>
            {validation.passwordConfirm.message && (
              <>
                <span className={styles.statusIcon}>{getStatusIcon('passwordConfirm')}</span>
                {validation.passwordConfirm.message}
              </>
            )}
          </div>
        </div>

        {/* 이름 */}
        <div className={styles.formGroup}>
          <label className={styles.formLabel}>
            이름<span className={styles.requiredMark}>*</span>
          </label>
          <div className={styles.inputContainer}>
            <input
              type="text"
              className={getInputClassName('name')}
              placeholder="이름을 입력해주세요"
              value={formData.name}
              onChange={(e) => onFormDataChange({ name: e.target.value })}
              autoComplete="name"
              maxLength={50}
              disabled={isLoading}
            />
          </div>
          <div className={getStatusClassName('name')}>
            {validation.name.message && (
              <>
                <span className={styles.statusIcon}>{getStatusIcon('name')}</span>
                {validation.name.message}
              </>
            )}
          </div>
          <div className={styles.formHint}>실명을 입력해주세요</div>
        </div>

        {/* 전화번호 */}
        <div className={styles.formGroup}>
          <label className={styles.formLabel}>
            전화번호<span className={styles.requiredMark}>*</span>
          </label>
          <div className={styles.inputContainer}>
            <input
              type="tel"
              className={getInputClassName('phone')}
              placeholder="010-1234-5678"
              value={formData.phone}
              onChange={(e) => onFormDataChange({ phone: e.target.value })}
              autoComplete="tel"
              maxLength={13}
              disabled={isLoading}
            />
            <button
              type="button"
              className={styles.checkButton}
              onClick={onCheckPhone}
              disabled={!validation.phone.isValid || validation.phone.isChecked || isLoading}
            >
              중복확인
            </button>
          </div>
          <div className={getStatusClassName('phone')}>
            {validation.phone.message && (
              <>
                <span className={styles.statusIcon}>{getStatusIcon('phone')}</span>
                {validation.phone.message}
              </>
            )}
          </div>
          <div className={styles.formHint}>전화번호를 등록하시면 주문 내역 연동 및 알림 서비스를 받을 수 있습니다</div>
        </div>

        {/* 제출 버튼 */}
        <button
          type="submit"
          className={styles.submitButton}
          disabled={!canSubmit || isLoading}
        >
          <div className={styles.btnContent}>
            {isLoading ? (
              <>
                <div className={styles.btnSpinner} />
                <span>처리중...</span>
              </>
            ) : (
              <span>회원가입 완료</span>
            )}
          </div>
        </button>
      </div>

      {/* 로그인 링크 */}
      <div className={styles.loginLink}>
        <p className={styles.loginText}>이미 계정이 있으신가요?</p>
        <button type="button" className={styles.loginButton} onClick={onGoToLogin}>
          로그인하기
        </button>
      </div>
    </form>
  )
}
