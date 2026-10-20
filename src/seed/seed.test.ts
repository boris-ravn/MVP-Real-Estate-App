import { describe, expect, it } from 'vitest'
import { freshness } from '../domain/freshness'
import { ZONES } from '../domain/listing'
import { buildSeedListings } from './listings'
import { SEED_MESSAGES } from './messages'

const now = new Date(2026, 9, 15, 12, 0)
const listings = buildSeedListings(now)
const share = (n: number) => n / listings.length

describe('datos semilla', () => {
  it('tiene entre 25 y 30 propiedades con ids únicos', () => {
    expect(listings.length).toBeGreaterThanOrEqual(25)
    expect(listings.length).toBeLessThanOrEqual(30)
    expect(new Set(listings.map((l) => l.id)).size).toBe(listings.length)
  })

  it('mezcla operaciones ~50/35/15', () => {
    const count = (op: string) => listings.filter((l) => l.operation === op).length
    expect(share(count('venta'))).toBeCloseTo(0.5, 1)
    expect(share(count('alquiler'))).toBeCloseTo(0.35, 1)
    expect(share(count('anticretico'))).toBeCloseTo(0.15, 1)
  })

  it('mezcla frescura ~40/35/25', () => {
    const count = (lvl: string) => listings.filter((l) => freshness(l.lastConfirmedAt, now).level === lvl).length
    expect(share(count('fresh'))).toBeCloseTo(0.4, 1)
    expect(share(count('stale'))).toBeCloseTo(0.35, 1)
    expect(share(count('old'))).toBeCloseTo(0.25, 1)
  })

  it('usa moneda según operación y precios plausibles', () => {
    for (const l of listings) {
      expect(l.currency).toBe(l.operation === 'alquiler' ? 'BOB' : 'USD')
      expect(ZONES).toContain(l.zone)
      if (l.operation === 'venta' && l.type === 'departamento') expect(l.price).toBeGreaterThanOrEqual(55000)
      if (l.operation === 'venta' && l.type === 'departamento') expect(l.price).toBeLessThanOrEqual(180000)
      if (l.operation === 'venta' && l.type === 'casa') expect(l.price).toBeGreaterThanOrEqual(90000)
      if (l.operation === 'venta' && l.type === 'casa') expect(l.price).toBeLessThanOrEqual(350000)
      if (l.operation === 'alquiler' && l.type === 'departamento') expect(l.price).toBeGreaterThanOrEqual(2000)
      if (l.operation === 'alquiler' && l.type === 'departamento') expect(l.price).toBeLessThanOrEqual(6000)
      if (l.operation === 'anticretico') expect(l.price).toBeGreaterThanOrEqual(20000)
      if (l.operation === 'anticretico') expect(l.price).toBeLessThanOrEqual(60000)
    }
  })

  it('incluye propiedades con datos incompletos', () => {
    expect(listings.some((l) => l.bathrooms === null && l.type !== 'terreno')).toBe(true)
    expect(listings.some((l) => l.commissionShare === null)).toBe(true)
  })

  it('cubre el criterio de aceptación: Depto + Alquiler + Cala Cala + Garaje + Mascotas', () => {
    const r = listings.filter(
      (l) => l.type === 'departamento' && l.operation === 'alquiler' && l.zone === 'Cala Cala' && l.garage && l.pets,
    )
    expect(r.length).toBeGreaterThanOrEqual(2)
  })

  it('cubre la tarea 1 de la prueba: alquiler, 2 dorm, garaje, mascotas, hasta Bs 4.000', () => {
    const r = listings.filter(
      (l) => l.operation === 'alquiler' && l.type === 'departamento' && l.bedrooms === 2 && l.garage && l.pets && l.price <= 4000,
    )
    expect(r.length).toBeGreaterThanOrEqual(2)
  })

  it('trae propiedades propias, una en alquiler (tarea 3) y al menos una con >7 días sin confirmar (banner F5)', () => {
    const mine = listings.filter((l) => l.isMine)
    expect(mine.length).toBeGreaterThanOrEqual(2)
    expect(mine.some((l) => l.operation === 'alquiler')).toBe(true)
    expect(mine.some((l) => freshness(l.lastConfirmedAt, now).days > 7)).toBe(true)
  })

  it('tiene 8 a 10 asesores con números ficticios +591 7000000x', () => {
    const agents = new Set(listings.filter((l) => !l.isMine).map((l) => l.agent.whatsapp))
    expect(agents.size).toBeGreaterThanOrEqual(8)
    expect(agents.size).toBeLessThanOrEqual(10)
    for (const w of agents) expect(w).toMatch(/^\+5917000000\d$/)
  })

  it('tiene 11 mensajes de ejemplo para el parser (8 del v1 + 3 del v2)', () => {
    expect(SEED_MESSAGES).toHaveLength(11)
  })
})
