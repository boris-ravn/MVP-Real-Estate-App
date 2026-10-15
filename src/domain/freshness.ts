export type FreshnessLevel = 'fresh' | 'stale' | 'old'

const DAY_MS = 24 * 60 * 60 * 1000

function startOfDay(d: Date): number {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime()
}

/** Días calendario transcurridos desde `iso` hasta `now` (0 = hoy). */
export function daysSince(iso: string, now: Date = new Date()): number {
  const diff = startOfDay(now) - startOfDay(new Date(iso))
  return Math.max(0, Math.round(diff / DAY_MS))
}

/** ≤3 días: fresh (verde) · 4–14: stale (ámbar) · >14: old (gris). */
export function freshnessLevel(days: number): FreshnessLevel {
  if (days <= 3) return 'fresh'
  if (days <= 14) return 'stale'
  return 'old'
}

export function freshnessLabel(days: number): string {
  if (days > 14) return `Sin confirmar hace ${days} días`
  if (days === 0) return 'Confirmado hoy'
  if (days === 1) return 'Confirmado ayer'
  return `Confirmado hace ${days} días`
}

export function freshness(iso: string, now: Date = new Date()) {
  const days = daysSince(iso, now)
  return { days, level: freshnessLevel(days), label: freshnessLabel(days) }
}

/** Umbral de F5: más de 7 días sin confirmar pide confirmación. */
export const NEEDS_CONFIRMATION_AFTER_DAYS = 7

export function needsConfirmation(iso: string, now: Date = new Date()): boolean {
  return daysSince(iso, now) > NEEDS_CONFIRMATION_AFTER_DAYS
}
