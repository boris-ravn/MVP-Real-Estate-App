import { describe, expect, it } from 'vitest'
import { daysSince, freshness, freshnessLevel, needsConfirmation } from './freshness'

const now = new Date(2026, 9, 15, 12, 0)
const daysAgo = (n: number, hour = 9) => new Date(2026, 9, 15 - n, hour).toISOString()

describe('frescura', () => {
  it('cuenta días calendario, no horas', () => {
    expect(daysSince(new Date(2026, 9, 14, 23, 59).toISOString(), now)).toBe(1)
    expect(daysSince(daysAgo(0, 1), now)).toBe(0)
  })

  it('aplica los umbrales del PRD: ≤3 verde, 4–14 ámbar, >14 gris', () => {
    expect([0, 3, 4, 14, 15].map(freshnessLevel)).toEqual(['fresh', 'fresh', 'stale', 'stale', 'old'])
  })

  it('genera las etiquetas visibles', () => {
    expect(freshness(daysAgo(0), now).label).toBe('Confirmado hoy')
    expect(freshness(daysAgo(1), now).label).toBe('Confirmado ayer')
    expect(freshness(daysAgo(6), now).label).toBe('Confirmado hace 6 días')
    expect(freshness(daysAgo(19), now).label).toBe('Sin confirmar hace 19 días')
  })

  it('pide confirmación después de 7 días', () => {
    expect(needsConfirmation(daysAgo(7), now)).toBe(false)
    expect(needsConfirmation(daysAgo(8), now)).toBe(true)
  })
})
