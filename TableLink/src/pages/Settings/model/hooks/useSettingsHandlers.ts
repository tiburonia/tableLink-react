import { useState } from 'react'

export interface SNSConnections {
  kakao: boolean
  naver: boolean
  apple: boolean
}

export const useSettingsHandlers = (
  onLogout: () => void,
  navigate: (path: string) => void,
  userInfo?: {
    email?: string
  }
) => {
  const [snsConnections] = useState<SNSConnections>({
    kakao: false,
    naver: false,
    apple: userInfo?.email?.includes('appleid.com') || false,
  })

  const handleBack = () => {
    navigate('/mypage')
  }

  const handleSNSConnect = (snsType: string) => {
    const messages: Record<string, string> = {
      kakao: '카카오톡 연동 기능은 준비중입니다.',
      naver: '네이버 연동 기능은 준비중입니다.',
      apple: '애플 연동 기능은 준비중입니다.',
    }
    alert(messages[snsType] || 'SNS 연동 준비중입니다.')
  }

  const handleEditField = (field: string) => {
    const messages: Record<string, string> = {
      nickname: '닉네임 수정 기능은 준비중입니다.',
      email: '이메일 수정 기능은 준비중입니다.',
      phone: '휴대폰번호 수정 기능은 준비중입니다.',
      password: '비밀번호 변경 기능은 준비중입니다.',
    }
    alert(messages[field] || '수정 기능 준비중입니다.')
  }

  const handleWithdraw = () => {
    if (
      confirm(
        '정말로 회원탈퇴를 하시겠습니까?\n탈퇴 시 모든 데이터가 삭제되며 복구할 수 없습니다.'
      )
    ) {
      alert('회원탈퇴 기능은 준비중입니다.')
    }
  }

  const handleLogout = () => {
    if (confirm('로그아웃 하시겠습니까?')) {
      onLogout()
      navigate('/login')
    }
  }

  return {
    snsConnections,
    handleBack,
    handleSNSConnect,
    handleEditField,
    handleWithdraw,
    handleLogout,
  }
}
