import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Utility to merge tailwind classes conditionally
 */
export function cn(...inputs) {
  return twMerge(clsx(inputs));
}
