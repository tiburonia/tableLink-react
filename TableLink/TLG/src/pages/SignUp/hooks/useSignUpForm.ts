import { useState, useCallback } from 'react'
import { authService } from '@/shared/api'

export interface SignUpFormData {
  userId: string
  password: string
  passwordConfirm: string
  name: string
  phone: string
}

export interface ValidationState {
  userId: { isValid: boolean; isChecked: boolean; message: string }
  password: { isValid: boolean; message: string; strength: number }
  passwordConfirm: { isValid: boolean; message: string }
  name: { isValid: boolean; message: string }
  phone: { isValid: boolean; isChecked: boolean; message: string }
}

const initialFormData: SignUpFormData = {
  userId: '',
  password: '',
  passwordConfirm: '',
  name: '',
  phone: '',
}

const initialValidation: ValidationState = {
  userId: { isValid: false, isChecked: false, message: '' },
  password: { isValid: false, message: '', strength: 0 },
  passwordConfirm: { isValid: false, message: '' },
  name: { isValid: false, message: '' },  // 필수 필드
  phone: { isValid: false, isChecked: false, message: '' },  // 필수 필드
}

// 유효성 검사 함수들
const validateUserId = (userId: string) => {
  if (!userId) return { isValid: false, message: '' }
  if (userId.length < 3) return { isValid: false, message: '아이디는 3자 이상이어야 합니다' }
  if (userId.length > 20) return { isValid: false, message: '아이디는 20자 이하여야 합니다' }
  if (!/^[a-zA-Z0-9]+$/.test(userId)) return { isValid: false, message: '영문과 숫자만 사용 가능합니다' }
  return { isValid: true, message: '중복 확인을 해주세요' }
}

const validatePassword = (password: string) => {
  if (!password) return { isValid: false, message: '', strength: 0 }
  if (password.length < 4) return { isValid: false, message: '비밀번호는 최소 4자 이상이어야 합니다', strength: 0 }

  let strength = 0
  if (password.length >= 4) strength++
  if (password.length >= 8) strength++
  if (/[A-Za-z]/.test(password) && /[0-9]/.test(password)) strength++
  if (/[^A-Za-z0-9]/.test(password)) strength++

  return { isValid: true, message: '사용 가능한 비밀번호입니다', strength }
}

const validateName = (name: string) => {
  if (!name) return { isValid: false, message: '이름을 입력해주세요' }  // 필수 필드
  if (name.length < 2) return { isValid: false, message: '이름은 2자 이상 입력해주세요' }
  if (name.length > 50) return { isValid: false, message: '이름은 50자 이하로 입력해주세요' }  // VARCHAR(50)
  if (!/^[가-힣a-zA-Z\s]+$/.test(name)) return { isValid: false, message: '한글, 영문만 사용 가능합니다' }
  return { isValid: true, message: '올바른 이름입니다' }
}

const validatePhone = (phone: string) => {
  if (!phone) return { isValid: false, message: '전화번호를 입력해주세요' }  // 필수 필드
  if (!/^010-\d{4}-\d{4}$/.test(phone)) return { isValid: false, message: '올바른 전화번호 형식이 아닙니다 (010-0000-0000)' }
  return { isValid: true, message: '중복 확인을 해주세요' }
}

export const formatPhone = (value: string): string => {
  const numbers = value.replace(/[^\d]/g, '')
  if (numbers.length <= 3) return numbers
  if (numbers.length <= 7) return `${numbers.slice(0, 3)}-${numbers.slice(3)}`
  return `${numbers.slice(0, 3)}-${numbers.slice(3, 7)}-${numbers.slice(7, 11)}`
}

export const useSignUpForm = (onSuccess: () => void) => {
  const [formData, setFormData] = useState<SignUpFormData>(initialFormData)
  const [validation, setValidation] = useState<ValidationState>(initialValidation)
  const [isLoading, setIsLoading] = useState(false)

  // 폼 데이터 업데이트 및 유효성 검사
  const updateFormData = useCallback((newData: Partial<SignUpFormData>) => {
    setFormData(prev => {
      const updated = { ...prev, ...newData }
      
      // 각 필드별 유효성 검사 수행
      setValidation(prevValidation => {
        const newValidation = { ...prevValidation }
        
        if ('userId' in newData) {
          const result = validateUserId(updated.userId)
          newValidation.userId = { 
            isValid: result.isValid, 
            isChecked: false, // 값이 변경되면 중복확인 초기화
            message: result.message 
          }
        }
        
        if ('password' in newData) {
          const result = validatePassword(updated.password)
          newValidation.password = { 
            isValid: result.isValid, 
            message: result.message,
            strength: result.strength
          }
          
          // 비밀번호가 변경되면 비밀번호 확인도 재검사
          if (updated.passwordConfirm) {
            const isMatch = updated.password === updated.passwordConfirm
            newValidation.passwordConfirm = {
              isValid: isMatch,
              message: isMatch ? '비밀번호가 일치합니다' : '비밀번호가 일치하지 않습니다'
            }
          }
        }
        
        if ('passwordConfirm' in newData) {
          const isMatch = updated.password === updated.passwordConfirm
          newValidation.passwordConfirm = {
            isValid: isMatch && updated.passwordConfirm.length > 0,
            message: !updated.passwordConfirm 
              ? '' 
              : isMatch 
                ? '비밀번호가 일치합니다' 
                : '비밀번호가 일치하지 않습니다'
          }
        }
        
        if ('name' in newData) {
          const result = validateName(updated.name)
          newValidation.name = { isValid: result.isValid, message: result.message }
        }
        
        if ('phone' in newData) {
          const formattedPhone = formatPhone(updated.phone)
          updated.phone = formattedPhone
          const result = validatePhone(formattedPhone)
          newValidation.phone = { 
            isValid: result.isValid, 
            isChecked: false, // 값이 변경되면 중복확인 초기화 (필수 필드)
            message: result.message 
          }
        }
        
        return newValidation
      })
      
      return updated
    })
  }, [])

  // 아이디 중복 확인
  const handleCheckId = useCallback(async () => {
    const result = validateUserId(formData.userId)
    if (!result.isValid) {
      setValidation(prev => ({
        ...prev,
        userId: { isValid: false, isChecked: false, message: result.message }
      }))
      return
    }

    try {
      // TODO: 실제 API 연동
      console.log('📡 아이디 중복확인 요청:', formData.userId)
      const response = await authService.checkIdAvailable(formData.userId)
      console.log('📡 아이디 중복확인 응답:', response)

      if (response.available) {
        setValidation(prev => ({
          ...prev,
          userId: { isValid: true, isChecked: true, message: '사용 가능한 아이디입니다' }
        }))
      } else {
        setValidation(prev => ({
          ...prev,
          userId: { isValid: true, isChecked: false, message: '이미 사용중인 아이디입니다' }
        }))
      }
    } catch (error) {
      console.error('아이디 중복확인 오류:', error)
      setValidation(prev => ({
        ...prev,
        userId: { isValid: false, isChecked: false, message: '중복 확인 중 오류가 발생했습니다' }
      }))
    }
  }, [formData.userId])

  // 전화번호 중복 확인
  const handleCheckPhone = useCallback(async () => {
    const result = validatePhone(formData.phone)
    if (!result.isValid) {
      setValidation(prev => ({
        ...prev,
        phone: { isValid: false, isChecked: false, message: result.message }
      }))
      return
    }

    try {
      // TODO: 실제 API 연동
      console.log('📡 전화번호 중복확인 요청:', formData.phone)
      const response = await authService.checkPhoneAvailable(formData.phone)
      console.log('📡 전화번호 중복확인 응답:', response)

      if (response.available) {
        setValidation(prev => ({
          ...prev,
          phone: { isValid: true, isChecked: true, message: '사용 가능한 전화번호입니다' }
        }))
      } else {
        setValidation(prev => ({
          ...prev,
          phone: { isValid: true, isChecked: false, message: '이미 등록된 전화번호입니다' }
        }))
      }
    } catch (error) {
      console.error('전화번호 중복확인 오류:', error)
      setValidation(prev => ({
        ...prev,
        phone: { isValid: false, isChecked: false, message: '중복 확인 중 오류가 발생했습니다' }
      }))
    }
  }, [formData.phone])

  // 폼 제출
  const handleSubmit = useCallback(async () => {
    // 필수 필드 유효성 확인
    const isUserIdValid = validation.userId.isValid && validation.userId.isChecked
    const isPasswordValid = validation.password.isValid
    const isPasswordConfirmValid = validation.passwordConfirm.isValid
    const isNameValid = validation.name.isValid && formData.name.length > 0  // 필수 필드
    const isPhoneValid = validation.phone.isValid && validation.phone.isChecked  // 필수 필드

    if (!isUserIdValid || !isPasswordValid || !isPasswordConfirmValid || !isNameValid || !isPhoneValid) {
      console.log('❌ 유효성 검사 실패:', { 
        isUserIdValid, 
        isPasswordValid, 
        isPasswordConfirmValid, 
        isNameValid, 
        isPhoneValid 
      })
      return
    }

    setIsLoading(true)

    try {
      const signupData = {
        user_id: formData.userId,
        user_pw: formData.password,
        name: formData.name,
        phone: formData.phone
      }

      console.log('📡 회원가입 요청:', signupData)
      
      // TODO: 실제 API 연동
      const response = await authService.signup(signupData)
      console.log('📡 회원가입 응답:', response)

      if (response.success) {
        alert(`${response.user?.name || formData.userId}님, 회원가입이 완료되었습니다!`)
        onSuccess()
      } else {
        alert(response.message || '회원가입에 실패했습니다')
      }
    } catch (error) {
      console.error('회원가입 오류:', error)
      alert('회원가입 중 오류가 발생했습니다. 다시 시도해주세요.')
    } finally {
      setIsLoading(false)
    }
  }, [formData, validation, onSuccess])

  // 제출 버튼 활성화 여부 (모든 필드 필수)
  const canSubmit = 
    validation.userId.isValid && 
    validation.userId.isChecked &&
    validation.password.isValid &&
    validation.passwordConfirm.isValid &&
    validation.name.isValid &&
    formData.name.length > 0 &&
    validation.phone.isValid && 
    validation.phone.isChecked

  return {
    formData,
    setFormData: updateFormData,
    validation,
    isLoading,
    canSubmit,
    handleCheckId,
    handleCheckPhone,
    handleSubmit,
  }
}
