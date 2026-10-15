import type { ReactNode } from 'react'

export function SwitchRow({ checked, onChange, icon, label }: { checked: boolean; onChange: (v: boolean) => void; icon?: ReactNode; label: string }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className="flex min-h-12 w-full items-center justify-between gap-3 py-1 text-left"
    >
      <span className="flex items-center gap-3 text-base text-slate-800">
        {icon}
        {label}
      </span>
      <span className={`relative h-7 w-12 shrink-0 rounded-full transition ${checked ? 'bg-brand-600' : 'bg-slate-300'}`}>
        <span className={`absolute top-0.5 size-6 rounded-full bg-white shadow transition-all ${checked ? 'left-[22px]' : 'left-0.5'}`} />
      </span>
    </button>
  )
}
