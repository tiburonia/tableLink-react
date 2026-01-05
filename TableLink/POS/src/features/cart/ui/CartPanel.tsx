import { useCart } from '../model'
import { Button } from '@/shared/ui'
import styles from './CartPanel.module.css'

interface CartPanelProps {
  onOrder: () => void
  disabled?: boolean
}

export function CartPanel({ onOrder, disabled }: CartPanelProps) {
  const {
    cart,
    handleUpdateQuantity,
    handleRemoveItem,
    handleClearCart,
    getCartTotal,
    getCartItemCount,
  } = useCart()

  const total = getCartTotal()
  const itemCount = getCartItemCount()

  if (cart.length === 0) {
    return (
      <div className={styles.panel}>
        <div className={styles.empty}>
          <span className={styles.emptyIcon}>🛒</span>
          <p>장바구니가 비어있습니다</p>
          <p className={styles.emptyHint}>메뉴를 선택해주세요</p>
        </div>
      </div>
    )
  }

  return (
    <div className={styles.panel}>
      <div className={styles.header}>
        <h3 className={styles.title}>
          장바구니
          <span className={styles.count}>{itemCount}</span>
        </h3>
        <button
          className={styles.clearBtn}
          onClick={handleClearCart}
        >
          전체삭제
        </button>
      </div>

      <div className={styles.items}>
        {cart.map((item) => (
          <div key={item.menu_id} className={styles.item}>
            <div className={styles.itemInfo}>
              <span className={styles.itemName}>{item.menu_name}</span>
              <span className={styles.itemPrice}>
                {(item.price * item.quantity).toLocaleString()}원
              </span>
            </div>

            <div className={styles.quantityControl}>
              <button
                className={styles.qtyBtn}
                onClick={() => handleUpdateQuantity(item.menu_id, item.quantity - 1)}
              >
                -
              </button>
              <span className={styles.quantity}>{item.quantity}</span>
              <button
                className={styles.qtyBtn}
                onClick={() => handleUpdateQuantity(item.menu_id, item.quantity + 1)}
              >
                +
              </button>
              <button
                className={styles.removeBtn}
                onClick={() => handleRemoveItem(item.menu_id)}
              >
                ✕
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className={styles.footer}>
        <div className={styles.totalRow}>
          <span className={styles.totalLabel}>총 금액</span>
          <span className={styles.totalAmount}>{total.toLocaleString()}원</span>
        </div>

        <Button
          variant="primary"
          size="large"
          fullWidth
          onClick={onOrder}
          disabled={disabled || cart.length === 0}
        >
          주문하기
        </Button>
      </div>
    </div>
  )
}
