import styles from './CategoryTabs.module.css'
import type { Category } from '@/entities/menu'

interface CategoryTabsProps {
  categories: Category[]
  selectedCategory: number | null
  onSelect: (categoryId: number) => void
}

export function CategoryTabs({
  categories,
  selectedCategory,
  onSelect,
}: CategoryTabsProps) {
  return (
    <div className={styles.tabs}>
      {categories.map((category) => (
        <button
          key={category.category_id}
          className={`${styles.tab} ${
            selectedCategory === category.category_id ? styles.active : ''
          }`}
          onClick={() => onSelect(category.category_id)}
        >
          {category.category_name}
        </button>
      ))}
    </div>
  )
}
