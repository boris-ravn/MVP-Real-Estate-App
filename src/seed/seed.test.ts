import { describe, expect, it } from 'vitest'
import { freshness } from '../domain/freshness'
import { ZONES } from '../domain/listing'
import { buildSeedListings } from './listings'
import { SEED_MESSAGES } from './messages'

const now = new Date(2026, 9, 15, 12, 0)
const listings = buildSeedListings(now)
const share = (n: number) => n / listings.length

describe('seed data', () => {
  it('has between 25 and 30 listings with unique ids', () => {
    expect(listings.length).toBeGreaterThanOrEqual(25)
    expect(listings.length).toBeLessThanOrEqual(30)
    expect(new Set(listings.map((l) => l.id)).size).toBe(listings.length)
  })

  it('mixes operations ~50/35/15', () => {
    const count = (op: string) => listings.filter((l) => l.operation === op).length
    expect(share(count('venta'))).toBeCloseTo(0.5, 1)
    expect(share(count('alquiler'))).toBeCloseTo(0.35, 1)
    expect(share(count('anticretico'))).toBeCloseTo(0.15, 1)
  })

  it('mixes freshness ~40/35/25', () => {
    const count = (lvl: string) => listings.filter((l) => freshness(l.lastConfirmedAt, now).level === lvl).length
    expect(share(count('fresh'))).toBeCloseTo(0.4, 1)
    expect(share(count('stale'))).toBeCloseTo(0.35, 1)
    expect(share(count('old'))).toBeCloseTo(0.25, 1)
  })

  it('uses currency by operation and plausible prices', () => {
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

  it('includes listings with incomplete data', () => {
    expect(listings.some((l) => l.bathrooms === null && l.type !== 'terreno')).toBe(true)
    expect(listings.some((l) => l.commissionShare === null)).toBe(true)
  })

  it('covers the acceptance criterion: Depto + Alquiler + Cala Cala + Garaje + Mascotas', () => {
    const r = listings.filter(
      (l) => l.type === 'departamento' && l.operation === 'alquiler' && l.zone === 'Cala Cala' && l.garage && l.pets,
    )
    expect(r.length).toBeGreaterThanOrEqual(2)
  })

  it('covers test task 1: rent, 2 bedrooms, garage, pets, up to Bs 4.000', () => {
    const r = listings.filter(
      (l) => l.operation === 'alquiler' && l.type === 'departamento' && l.bedrooms === 2 && l.garage && l.pets && l.price <= 4000,
    )
    expect(r.length).toBeGreaterThanOrEqual(2)
  })

  it('includes own listings, one for rent (task 3) and at least one unconfirmed for >7 days (F5 banner)', () => {
    const mine = listings.filter((l) => l.isMine)
    expect(mine.length).toBeGreaterThanOrEqual(2)
    expect(mine.some((l) => l.operation === 'alquiler')).toBe(true)
    expect(mine.some((l) => freshness(l.lastConfirmedAt, now).days > 7)).toBe(true)
  })

  it('has 8 to 10 agents with fictional +591 7000000x numbers', () => {
    const agents = new Set(listings.filter((l) => !l.isMine).map((l) => l.agent.whatsapp))
    expect(agents.size).toBeGreaterThanOrEqual(8)
    expect(agents.size).toBeLessThanOrEqual(10)
    for (const w of agents) expect(w).toMatch(/^\+5917000000\d$/)
  })

  it('has 11 sample parser messages (8 from v1 + 3 from v2)', () => {
    expect(SEED_MESSAGES).toHaveLength(11)
  })
})
