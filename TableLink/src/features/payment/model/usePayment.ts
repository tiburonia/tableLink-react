import { useState } from 'react'
import { paymentApi, type PaymentRequest } from '../api/paymentApi'

export function usePayment() {
  const [isProcessing, setIsProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const processPayment = async (paymentData: PaymentRequest) => {
    try {
      setIsProcessing(true)
      setError(null)

      const result = await paymentApi.requestPayment(paymentData)
      
      return { success: true, data: result }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Payment failed'
      setError(message)
      return { success: false, error: message }
    } finally {
      setIsProcessing(false)
    }
  }

  const approveTossPayment = async (params: {
    paymentKey: string
    orderId: string
    amount: number
  }) => {
    try {
      setIsProcessing(true)
      setError(null)

      const result = await paymentApi.approveTossPayment(params)
      
      return { success: true, data: result }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Approval failed'
      setError(message)
      return { success: false, error: message }
    } finally {
      setIsProcessing(false)
    }
  }

  const cancelPayment = async (paymentKey: string, reason: string) => {
    try {
      setIsProcessing(true)
      setError(null)

      const result = await paymentApi.cancelPayment(paymentKey, reason)
      
      return { success: true, data: result }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Cancellation failed'
      setError(message)
      return { success: false, error: message }
    } finally {
      setIsProcessing(false)
    }
  }

  return {
    isProcessing,
    error,
    processPayment,
    approveTossPayment,
    cancelPayment,
  }
}
