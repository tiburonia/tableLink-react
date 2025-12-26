import styles from './PaymentMethodsSection.module.css'

interface PaymentMethod {
  id: string
  name: string
  icon: string
  available: boolean
}

interface PaymentMethodsSectionProps {
  methods: PaymentMethod[]
  selectedMethod: string | null
  onSelectMethod: (methodId: string) => void
}

export const PaymentMethodsSection = ({
  methods,
  selectedMethod,
  onSelectMethod,
}: PaymentMethodsSectionProps) => {
  return (
    <section className={styles.section}>
      <h2 className={styles.sectionTitle}>💳 결제 방법</h2>
      <div className={styles.methods}>
        {methods.map((method) => (
          <button
            key={method.id}
            className={`${styles.method} ${
              selectedMethod === method.id ? styles.selected : ''
            } ${!method.available ? styles.disabled : ''}`}
            onClick={() => method.available && onSelectMethod(method.id)}
            disabled={!method.available}
          >
            <span className={styles.methodIcon}>{method.icon}</span>
            <span className={styles.methodName}>{method.name}</span>
            {!method.available && (
              <span className={styles.methodBadge}>준비중</span>
            )}
          </button>
        ))}
      </div>
    </section>
  )
}
