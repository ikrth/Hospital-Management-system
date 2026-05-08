import { cn } from '../../utils/cn'

const PRESETS = {
  text: 'h-4 rounded-full w-3/4',
  card: 'h-32 rounded-2xl w-full',
  avatar: 'h-10 w-10 rounded-full',
}

export function Skeleton({ className, variant = 'text' }) {
  return (
    <div
      className={cn(
        'animate-pulse bg-[var(--border)]',
        PRESETS[variant],
        className
      )}
      style={{
        background: 'linear-gradient(90deg, var(--bg-secondary) 25%, var(--border) 50%, var(--bg-secondary) 75%)',
        backgroundSize: '200% 100%',
        animation: 'shimmer 1.5s infinite linear',
      }}
    />
  )
}
