import { cn } from '../../utils/cn'

const SIZES = {
  sm: 'w-8 h-8 text-xs',
  md: 'w-10 h-10 text-sm',
  lg: 'w-16 h-16 text-xl',
}

export function Avatar({ name, src, size = 'md', className }) {
  const initials = name
    ? name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()
    : '?'

  if (src) {
    return (
      <img
        src={src}
        alt={name || 'Avatar'}
        className={cn('rounded-full object-cover shrink-0', SIZES[size], className)}
      />
    )
  }

  return (
    <div
      className={cn(
        'rounded-full flex items-center justify-center font-bold text-white shrink-0',
        'bg-[var(--accent)]',
        SIZES[size],
        className
      )}
      title={name}
    >
      {initials}
    </div>
  )
}
