/**
 * LoadingSpinner Component - 로딩 스피너
 */

import styles from './LoadingSpinner.module.css'

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg'
  color?: 'primary' | 'white' | 'gray'
  fullScreen?: boolean
  text?: string
}

export function LoadingSpinner({
  size = 'md',
  color = 'primary',
  fullScreen = false,
  text,
}: LoadingSpinnerProps) {
  const spinner = (
    <div className={styles.container}>
      <div className={`${styles.spinner} ${styles[size]} ${styles[color]}`}>
        <div></div>
        <div></div>
        <div></div>
        <div></div>
      </div>
      {text && <p className={styles.text}>{text}</p>}
    </div>
  )

  if (fullScreen) {
    return <div className={styles.fullScreen}>{spinner}</div>
  }

  return spinner
}
