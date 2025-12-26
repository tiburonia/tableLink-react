import styles from './PayFooter.module.css'

interface PayFooterProps {
  formattedAmount: string
  processing: boolean
  disabled: boolean
  onPayment: () => void
}

export const PayFooter = ({
  formattedAmount,
  processing,
  disabled,
  onPayment,
}: PayFooterProps) => {
  return (
    <footer className={styles.footer}>
      <button
        className={styles.payButton}
        onClick={onPayment}
        disabled={disabled}
      >
        {processing ? (
          <>
            <span className={styles.spinner}></span>
            결제 진행 중...
          </>
        ) : (
          <>{formattedAmount}원 결제하기</>
        )}
      </button>
    </footer>
  )
}
