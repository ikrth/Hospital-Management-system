import { forwardRef } from 'react'
import { cn } from '../../utils/cn'

const VARIANTS = {
  primary: 'bg-[var(--accent)] text-white hover:bg-[var(--accent-hover)] active:scale-[0.98] shadow-sm',
  secondary: 'border border-[var(--border)] bg-[var(--bg-card)] text-[var(--text-primary)] hover:bg-[var(--bg-secondary)] active:scale-[0.98]',
  ghost: 'bg-transparent text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)] hover:text-[var(--text-primary)] active:scale-[0.98]',
  danger: 'bg-red-500 text-white hover:bg-red-600 active:scale-[0.98] shadow-sm',
}

const SIZES = {
  sm: 'px-3 py-1.5 text-xs',
  md: 'px-4 py-2 text-sm',
  lg: 'px-6 py-3 text-base',
}

export const Button = forwardRef(({
  variant = 'primary',
  size = 'md',
  isLoading = false,
  icon: Icon,
  className,
  children,
  disabled,
  ...rest
}, ref) => {
  return (
    <button
      ref={ref}
      disabled={disabled || isLoading}
      className={cn(
        'inline-flex items-center justify-center gap-2 rounded-xl font-medium transition-all duration-200',
        'focus:outline-none focus:ring-2 focus:ring-[var(--accent)] focus:ring-offset-2 focus:ring-offset-[var(--bg-primary)]',
        'disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none',
        VARIANTS[variant],
        SIZES[size],
        className
      )}
      {...rest}
    >
      {isLoading ? (
        <>
          <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
          </svg>
          Loading...
        </>
      ) : (
        <>
          {Icon && <Icon size={size === 'sm' ? 14 : size === 'lg' ? 20 : 16} className="shrink-0" />}
          {children}
        </>
      )}
    </button>
  )
})
Button.displayName = 'Button'
