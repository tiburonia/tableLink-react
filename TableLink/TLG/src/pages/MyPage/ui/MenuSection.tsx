/**
 * MenuSection - 메뉴 섹션 컴포넌트
 */

import styles from './MenuSection.module.css'

interface MenuItem {
  label: string
  onClick: () => void
  isDanger?: boolean
}

interface MenuSectionProps {
  title?: string
  items: MenuItem[]
}

export function MenuSection({ title, items }: MenuSectionProps) {
  return (
    <section className={styles.section}>
      {title && <h3 className={styles.title}>{title}</h3>}
      <ul className={styles.menuList}>
        {items.map((item, index) => (
          <li 
            key={index}
            onClick={item.onClick}
            className={styles.menuItem}
          >
            <span style={{ color: item.isDanger ? '#ff3b30' : undefined }}>
              {item.label}
            </span>
            <span className={styles.arrow}>›</span>
          </li>
        ))}
      </ul>
    </section>
  )
}
