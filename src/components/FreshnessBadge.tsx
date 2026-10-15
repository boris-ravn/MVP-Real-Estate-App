import { freshness, type FreshnessLevel } from '../domain/freshness'

const STYLES: Record<FreshnessLevel, string> = {
  fresh: 'bg-emerald-100 text-emerald-800 ring-emerald-300',
  stale: 'bg-amber-100 text-amber-900 ring-amber-300',
  old: 'bg-slate-100 text-slate-600 ring-slate-300',
}

export function FreshnessBadge({ lastConfirmedAt }: { lastConfirmedAt: string }) {
  const { level, label } = freshness(lastConfirmedAt)
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ring-1 ${STYLES[level]}`}>
      <span aria-hidden className="size-1.5 rounded-full bg-current" />
      {label}
    </span>
  )
}
