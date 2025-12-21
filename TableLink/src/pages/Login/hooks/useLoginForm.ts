import { useState } from 'react'
import { authService } from '@/shared/api'

interface LoginFormData {
  Id: string
  password: string
}

interface LoginErrors {
  Id?: string
  password?: string
  general?: string
}

export const useLoginForm = (onLoginSuccess?: () => void) => {
  const [formData, setFormData] = useState<LoginFormData>({
    Id: '',
    password: '',
  })
  const [errors, setErrors] = useState<LoginErrors>({})
  const [isLoading, setIsLoading] = useState(false)

  const validateForm = (): boolean => {
    const newErrors: LoginErrors = {}

    if (!formData.Id) {
      newErrors.Id = '아이디를 입력해주세요'
    }
    if (!formData.password) {
      newErrors.password = '비밀번호를 입력해주세요'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async () => {
    if (!validateForm()) return

    setIsLoading(true)
    setErrors({})

    try {
      const result = await authService.login(formData.Id, formData.password)
      if (result.success) {
        console.log('로그인 성공:', formData.Id)
        if (onLoginSuccess) {
          onLoginSuccess()
        }
      } else {
        setErrors({ general: result.message || '로그인에 실패했습니다' })
      }
    } catch (error) {
      console.error('로그인 오류:', error)
      setErrors({ general: '로그인 중 오류가 발생했습니다' })
    } finally {
      setIsLoading(false)
    }
  }

  return {
    formData,
    setFormData,
    errors,
    isLoading,
    handleSubmit,
  }
}
