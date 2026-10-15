import type { ButtonHTMLAttributes } from 'react'

/** `dashed`: dato sin completar (borde punteado). */
type Props = ButtonHTMLAttributes<HTMLButtonElement> & { active?: boolean; dashed?: boolean }

/** Chip táctil (≥44 px de alto). */
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
