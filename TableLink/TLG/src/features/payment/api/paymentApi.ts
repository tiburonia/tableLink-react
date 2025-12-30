/**
 * Payment Feature - 결제 기능
 */


const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'

export interface PaymentRequest {
  orderId: number
  amount: number
  method: 'card' | 'cash' | 'toss' | 'kakao'
  customerName?: string
  customerEmail?: string
  customerPhone?: string
}

export interface PaymentResponse {
  paymentKey: string
  orderId: number
  status: 'success' | 'pending' | 'failed'
  approvedAt?: string
  receipt?: {
    url: string
    cardNumber?: string
    approvedAt: string
  }
}

export const paymentApi = {
  /**
   * 결제 요청
   */
  async requestPayment(paymentData: PaymentRequest): Promise<PaymentResponse> {
    const response = await fetch(`${API_BASE_URL}/payments/request`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(paymentData),
    })
    if (!response.ok) throw new Error('Payment request failed')
    return response.json()
  },

  /**
   * Toss 결제 승인
   */
  async approveTossPayment(params: {
    paymentKey: string
    orderId: string
    amount: number
  }): Promise<PaymentResponse> {
    const response = await fetch(`${API_BASE_URL}/payments/toss/approve`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(params),
    })
    if (!response.ok) throw new Error('Toss payment approval failed')
    return response.json()
  },

  /**
   * 결제 상태 조회
   */
  async getPaymentStatus(paymentKey: string): Promise<PaymentResponse> {
    const response = await fetch(`${API_BASE_URL}/payments/${paymentKey}/status`, {
      credentials: 'include',
    })
    if (!response.ok) throw new Error('Failed to fetch payment status')
    return response.json()
  },

  /**
   * 결제 취소/환불
   */
  async cancelPayment(paymentKey: string, reason: string): Promise<PaymentResponse> {
    const response = await fetch(`${API_BASE_URL}/payments/${paymentKey}/cancel`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ reason }),
    })
    if (!response.ok) throw new Error('Payment cancellation failed')
    return response.json()
  },
}
