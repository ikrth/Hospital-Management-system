import { clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

/**
 * Merge Tailwind classes safely, resolving conflicts via tailwind-merge
 * and handling conditional classes via clsx.
 */
export function cn(...inputs) {
  return twMerge(clsx(inputs))
}
