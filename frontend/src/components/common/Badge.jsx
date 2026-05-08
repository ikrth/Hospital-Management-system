import { cn } from '../../utils/cn'

const VARIANTS = {
  success: 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400',
  warning: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-400',
  danger:  'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400',
  info:    'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400',
  default: 'bg-[var(--bg-secondary)] text-[var(--text-secondary)]',
}

const SIZES = {
  sm: 'px-2 py-0.5 text-[10px]',
  md: 'px-2.5 py-0.5 text-xs',
}

export function Badge({ variant = 'default', size = 'md', className, children }) {
  return (
    <span
      className={cn(
        'inline-flex items-center justify-center rounded-full font-medium',
        VARIANTS[variant],
        SIZES[size],
        className
      )}
    >
      {children}
    </span>
  )
}

export const priorityVariant = (level) => 
  ({ critical: 'danger', high: 'warning', medium: 'info', low: 'success' }[level] || 'default')

export const statusVariant = (status) => 
  ({ confirmed: 'success', pending: 'default', completed: 'info', cancelled: 'danger' }[status] || 'default')
