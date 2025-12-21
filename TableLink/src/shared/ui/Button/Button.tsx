import React, { type ButtonHTMLAttributes } from 'react'
import './Button.css'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger'
  size?: 'sm' | 'md' | 'lg'
  isLoading?: boolean
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'primary', size = 'md', isLoading = false, className, children, ...rest }, ref) => {
    return (
      <button
        ref={ref}
        className={`button button--${variant} button--${size} ${className || ''}`}
        disabled={isLoading || rest.disabled}
        {...rest}
      >
        {isLoading ? '로딩 중...' : children}
      </button>
    )
  }
)

Button.displayName = 'Button'
