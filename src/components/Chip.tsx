import type { ButtonHTMLAttributes } from 'react'

/** `dashed`: missing data (dashed border). */
type Props = ButtonHTMLAttributes<HTMLButtonElement> & { active?: boolean; dashed?: boolean }

/** Touch-friendly chip (≥44 px tall). */
export function Chip({ active = false, dashed = false, className = '', children, ...props }: Props) {
  return (
    <button
      type="button"
      aria-pressed={active}
      className={`inline-flex min-h-11 min-w-11 shrink-0 items-center justify-center gap-1.5 rounded-full px-4 text-sm font-medium ring-1 transition ${
        active
          ? 'bg-slate-900 text-white ring-slate-900'
          : dashed
            ? 'border border-dashed border-slate-400 bg-white text-slate-600 ring-transparent active:bg-slate-100'
            : 'bg-white text-slate-800 ring-slate-300 active:bg-slate-100'
      } ${className}`}
      {...props}
    >
      {children}
    </button>
  )
}
