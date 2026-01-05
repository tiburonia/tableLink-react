import styles from './MenuCard.module.css'
import type { MenuItem } from '../model'

interface MenuCardProps {
  item: MenuItem
  onClick: (item: MenuItem) => void
  disabled?: boolean
}

export function MenuCard({ item, onClick, disabled }: MenuCardProps) {
  const { menu_name, price, is_soldout, is_available, image_url } = item

  const isDisabled = disabled || is_soldout || !is_available

  const handleClick = () => {
    if (!isDisabled) {
      onClick(item)
    }
  }

  return (
    <div
      className={`${styles.card} ${isDisabled ? styles.disabled : ''}`}
      onClick={handleClick}
    >
      {image_url && (
        <div className={styles.imageWrapper}>
          <img src={image_url} alt={menu_name} className={styles.image} />
          {is_soldout && (
            <div className={styles.soldoutOverlay}>
              <span>품절</span>
            </div>
          )}
        </div>
      )}

      <div className={styles.info}>
        <h3 className={styles.name}>{menu_name}</h3>
        <p className={styles.price}>{price.toLocaleString()}원</p>
      </div>

      {!is_available && !is_soldout && (
        <div className={styles.unavailableBadge}>판매중지</div>
      )}
    </div>
  )
}
