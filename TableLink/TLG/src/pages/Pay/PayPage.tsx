/**
 * PayPage - 결제 페이지
 * 
 * FSD 원칙: 페이지는 조립만 한다
 * - useState ❌
 * - useEffect ❌
 * - API 호출 ❌
 */

import { usePayPage } from '@/features/payment'
import {
  LoadingState,
  PayHeader,
  StoreInfoSection,
  OrderItemsSection,
  AmountSection,
  PaymentMethodsSection,
  PayFooter,
} from './ui'
import styles from './PayPage.module.css'

export const PayPage = () => {
  // Feature Hook에서 모든 상태와 로직을 가져옴
  const {
    paymentInfo,
    selectedMethod,
    loading,
    processing,
    paymentMethods,
    formattedInfo,
    selectMethod,
    handlePayment,
    goBack,
    formatAmount,
  } = usePayPage()

  if (loading) {
    return <LoadingState />
  }

  if (!paymentInfo || !formattedInfo) {
    return null
  }

  return (
    <div className="mobile-app">
      <div className="mobile-content">
        <PayHeader onBack={goBack} />

        <div className={styles.payContent}>
          <StoreInfoSection
            storeName={paymentInfo.storeName}
            tableNumber={paymentInfo.tableNumber}
          />

          <OrderItemsSection
            items={paymentInfo.items}
            formatAmount={formatAmount}
          />

          <AmountSection formattedAmount={formattedInfo.formattedAmount} />

          <PaymentMethodsSection
            methods={paymentMethods}
            selectedMethod={selectedMethod}
            onSelectMethod={selectMethod}
          />
        </div>

        <PayFooter
          formattedAmount={formattedInfo.formattedAmount}
          processing={processing}
          disabled={processing || !selectedMethod}
          onPayment={handlePayment}
        />
      </div>
    </div>
  )
}
