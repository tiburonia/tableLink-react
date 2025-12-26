/**
 * 주문 세션 관련 헬퍼 함수
 */

import type { OrderTicketStatus, OrderSessionStatus, PaymentStatus, PaymentMethod } from './types'

export const getTicketStatusText = (status: OrderTicketStatus): string => {
  const statusMap: Record<OrderTicketStatus, string> = {
    'PENDING': '대기중',
    'COOKING': '조리중',
    'READY': '완료',
    'SERVED': '서빙완료',
    'CANCELLED': '취소됨'
  }
  return statusMap[status] || status
}

export const getSessionStatusText = (status: OrderSessionStatus): string => {
  const statusMap: Record<OrderSessionStatus, string> = {
    'OPEN': '진행중',
    'COOKING': '조리중',
    'READY': '완료',
    'DONE': '서빙완료',
    'CLOSED': '종료',
  }
  return statusMap[status] || status
}

export const getPaymentStatusText = (status: PaymentStatus): string => {
  const statusMap: Record<PaymentStatus, string> = {
    'PAID': '결제완료',
    'UNPAID': '결제대기',
    'COMPLETED': '완료',
    'completed': '완료',
    'pending': '대기중',
    'failed': '실패',
    'cancelled': '취소',
    'refunded': '환불완료'
  }
  return statusMap[status] || status
}

export const getPaymentMethodIcon = (method: PaymentMethod): string => {
  const methodIcons: Record<PaymentMethod, string> = {
    'TOSS': '💳',
    'CARD': '💳',
    'CASH': '💵',
    'MOBILE': '📱'
  }
  return methodIcons[method] || '💳'
}

export const formatOrderTime = (dateString: string): string => {
  const date = new Date(dateString)
  return date.toLocaleTimeString('ko-KR', {
    hour: '2-digit',
    minute: '2-digit'
  })
}

export const getElapsedTime = (startTime: string): string => {
  const start = new Date(startTime)
  const now = new Date()
  const diffMs = now.getTime() - start.getTime()

  const hours = Math.floor(diffMs / (1000 * 60 * 60))
  const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60))

  if (hours > 0) {
    return `${hours}시간 ${minutes}분`
  } else {
    return `${minutes}분`
  }
}
