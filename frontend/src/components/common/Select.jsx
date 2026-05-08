import { forwardRef } from 'react'
import { cn } from '../../utils/cn'

export const Select = forwardRef(({
  label,
  error,
  className,
  id,
  children,
  ...rest
}, ref) => {
  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      {label && (
        <label htmlFor={id} className="text-sm font-medium text-[var(--text-secondary)]">
          {label}
        </label>
      )}
      <select
        ref={ref}
        id={id}
        className={cn(
          'w-full rounded-xl border bg-[var(--bg-card)] px-4 py-2.5 text-[var(--text-primary)] border-[var(--border)]',
          'focus:outline-none focus:ring-2 focus:ring-[var(--accent)] focus:border-transparent',
          'transition-all duration-200',
          'disabled:opacity-50 disabled:bg-[var(--bg-secondary)] disabled:cursor-not-allowed',
          error && 'border-red-500 focus:ring-red-500'
        )}
        style={{ appearance: 'auto' }}
        {...rest}
      >
        {children}
      </select>
      {error && <p className="text-red-500 text-xs mt-0.5">{error}</p>}
    </div>
  )
})
Select.displayName = 'Select'
