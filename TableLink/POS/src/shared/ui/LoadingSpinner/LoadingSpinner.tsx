import styles from './LoadingSpinner.module.css'

export interface LoadingSpinnerProps {
  size?: 'small' | 'medium' | 'large'
  text?: string
}

export function LoadingSpinner({ size = 'medium', text }: LoadingSpinnerProps) {
  return (
    <div className={styles.container}>
      <div className={`${styles.spinner} ${styles[size]}`} />
      {text && <p className={styles.message}>{text}</p>}
    </div>
  )
}
