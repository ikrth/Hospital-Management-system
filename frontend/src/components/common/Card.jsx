import { cn } from '../../utils/cn'

const PADDINGS = {
  sm: 'p-4',
  md: 'p-6',
  lg: 'p-8',
}

export function Card({ children, className, padding = 'md', hover = false }) {
  return (
    <div
      className={cn(
        'bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl shadow-[var(--shadow)]',
        hover && 'hover:-translate-y-1 hover:shadow-[var(--shadow-md)] transition-transform duration-200',
        PADDINGS[padding],
        className
      )}
    >
      {children}
    </div>
  )
}
