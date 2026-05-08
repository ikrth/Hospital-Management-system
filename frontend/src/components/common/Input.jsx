import { forwardRef } from 'react'
import { cn } from '../../utils/cn'

export const Input = forwardRef(({
  label,
  error,
  icon: Icon,
  rightElement,
  className,
  id,
  ...rest
}, ref) => {
  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      {label && (
        <label htmlFor={id} className="text-sm font-medium text-[var(--text-secondary)]">
          {label}
        </label>
      )}
      <div className="relative">
        {Icon && (
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] pointer-events-none">
            <Icon size={16} />
          </span>
        )}
        <input
          ref={ref}
          id={id}
          className={cn(
            'w-full rounded-xl border bg-[var(--bg-card)] py-2.5 text-[var(--text-primary)] border-[var(--border)]',
            'focus:outline-none focus:ring-2 focus:ring-[var(--accent)] focus:border-transparent',
            'placeholder:text-[var(--text-muted)] transition-all duration-200',
            'disabled:opacity-50 disabled:bg-[var(--bg-secondary)] disabled:cursor-not-allowed',
            Icon ? 'pl-10' : 'px-4',
            rightElement ? 'pr-12' : 'pr-4',
            error && 'border-red-500 focus:ring-red-500'
          )}
          {...rest}
        />
        {rightElement && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            {rightElement}
          </div>
        )}
      </div>
      {error && <p className="text-red-500 text-xs mt-0.5">{error}</p>}
    </div>
  )
})
Input.displayName = 'Input'
