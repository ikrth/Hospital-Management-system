import React, { useEffect, useRef } from 'react'

const TimelineItem = ({ id, date, title, subtitle, content, icon: Icon, iconColor }) => {
  const itemRef = useRef(null)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('animate-in')
          observer.unobserve(entry.target)
        }
      },
      { threshold: 0.1 }
    )

    if (itemRef.current) observer.observe(itemRef.current)

    return () => observer.disconnect()
  }, [])

  return (
    <div ref={itemRef} className="timeline-item flex gap-6 relative pb-10 last:pb-0">
      {/* Date circle */}
      <div className="absolute left-0 top-0 -translate-x-1/2 w-4 h-4 rounded-full border-2 border-teal-500 bg-[var(--bg-primary)] z-10" />
      
      {/* Left side: Date (optional if you want it aligned differently, but request says 'Date bubble on left') */}
      <div className="w-24 shrink-0 pt-0.5">
        <span className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider">{date}</span>
      </div>

      {/* Right side: Card content */}
      <div className="flex-1">
        <div className="card p-5 hover:shadow-lg transition-shadow">
          <div className="flex items-start justify-between mb-3">
            <div>
              <h4 className="font-bold text-[var(--text-primary)]">{title}</h4>
              <p className="text-sm text-[var(--text-secondary)]">{subtitle}</p>
            </div>
            {Icon && (
              <div className="p-2 rounded-lg bg-[var(--bg-secondary)]" style={{ color: iconColor || 'var(--accent)' }}>
                <Icon size={18} />
              </div>
            )}
          </div>
          <div className="text-sm text-[var(--text-secondary)]">
            {content}
          </div>
        </div>
      </div>
    </div>
  )
}

export const Timeline = ({ items }) => {
  if (!items || items.length === 0) return null

  return (
    <div className="relative pl-12 ml-4">
      {/* Vertical line */}
      <div className="absolute left-0 top-2 bottom-2 w-0.5 bg-teal-200 dark:bg-teal-800" />
      
      <div className="flex flex-col">
        {items.map((item) => (
          <TimelineItem key={item.id} {...item} />
        ))}
      </div>
    </div>
  )
}
