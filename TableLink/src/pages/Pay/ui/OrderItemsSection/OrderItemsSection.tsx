import styles from './OrderItemsSection.module.css'

interface OrderItem {
  id: string | number
  name: string
  quantity: number
  price: number
}

interface OrderItemsSectionProps {
  items: OrderItem[]
  formatAmount: (amount: number) => string
}

export const OrderItemsSection = ({ items, formatAmount }: OrderItemsSectionProps) => {
  return (
    <section className={styles.section}>
      <h2 className={styles.sectionTitle}>🛒 주문 내역</h2>
      <div className={styles.orderItems}>
        {items.map((item) => (
          <div key={item.id} className={styles.orderItem}>
            <div className={styles.itemInfo}>
              <span className={styles.itemName}>{item.name}</span>
              <span className={styles.itemQuantity}>x{item.quantity}</span>
            </div>
            <span className={styles.itemPrice}>
              {formatAmount(item.price * item.quantity)}원
            </span>
          </div>
        ))}
      </div>
    </section>
  )
}
