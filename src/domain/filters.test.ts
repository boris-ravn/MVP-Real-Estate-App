import { describe, expect, it } from 'vitest'
import { buildSeedListings } from '../seed/listings'
import {
  EMPTY_FILTERS,
  filterLabel,
  filterListings,
  mostRestrictiveFilter,
  removeFilter,
  setOperation,
  type Filters,
} from './filters'

const listings = buildSeedListings(new Date(2026, 9, 15, 12))
const withReq = (req: Partial<Filters['required']>, f: Partial<Filters> = {}): Filters => ({
  ...EMPTY_FILTERS,
  ...f,
  required: { ...EMPTY_FILTERS.required, ...req },
})

describe('filters', () => {
  it('returns everything with no filters', () => {
    expect(filterListings(listings, EMPTY_FILTERS)).toHaveLength(listings.length)
  })

  it('acceptance criterion: Departamento + Alquiler + Cala Cala + Garaje + Mascotas', () => {
    const f = withReq({ garage: true, pets: true }, { operation: 'alquiler', type: 'departamento', zones: ['Cala Cala'] })
    const r = filterListings(listings, f)
    expect(r.length).toBeGreaterThan(0)
    for (const l of r) {
      expect(l).toMatchObject({ operation: 'alquiler', type: 'departamento', zone: 'Cala Cala', garage: true, pets: true })
    }
    // No matching listing was left out
    const expected = listings.filter(
      (l) => l.operation === 'alquiler' && l.type === 'departamento' && l.zone === 'Cala Cala' && l.garage && l.pets,
    )
    expect(r.map((l) => l.id).sort()).toEqual(expected.map((l) => l.id).sort())
  })

  it('zone is multi-select', () => {
    const r = filterListings(listings, { ...EMPTY_FILTERS, zones: ['Sarco', 'Sacaba'] })
    expect(new Set(r.map((l) => l.zone))).toEqual(new Set(['Sarco', 'Sacaba']))
  })

  it('price uses the currency of the operation', () => {
    const r = filterListings(listings, { ...EMPTY_FILTERS, operation: 'alquiler', priceMax: 4000 })
    expect(r.length).toBeGreaterThan(0)
    expect(r.every((l) => l.currency === 'BOB' && l.price <= 4000)).toBe(true)
  })

  it('switching to an operation with another currency clears the price', () => {
    const f = { ...EMPTY_FILTERS, operation: 'alquiler' as const, priceMax: 4000 }
    expect(setOperation(f, 'venta').priceMax).toBeNull()
    expect(setOperation({ ...f, operation: 'venta' }, 'anticretico').priceMax).toBe(4000)
  })

  it('bedrooms: is a minimum ("2+" includes 3 and 4) and excludes listings without the data (C6)', () => {
    const two = filterListings(listings, { ...EMPTY_FILTERS, bedrooms: 2 })
    expect(two.every((l) => l.bedrooms != null && l.bedrooms >= 2)).toBe(true)
    expect(two.some((l) => l.bedrooms === 2)).toBe(true)
    expect(two.some((l) => (l.bedrooms ?? 0) >= 3)).toBe(true)
    expect(two).toHaveLength(listings.filter((l) => l.bedrooms != null && l.bedrooms >= 2).length)
    const four = filterListings(listings, { ...EMPTY_FILTERS, bedrooms: 4 })
    expect(four.length).toBeGreaterThan(0)
    expect(four.every((l) => (l.bedrooms ?? 0) >= 4)).toBe(true)
  })

  it('a boolean filter excludes listings without the data', () => {
    const r = filterListings(listings, withReq({ storage: true }))
    expect(r.every((l) => l.storage === true)).toBe(true)
  })

  it('the empty state suggests the most restrictive filter', () => {
    // No rental in Cala Cala with storage exists in the seed
    const f = withReq({ storage: true }, { operation: 'alquiler', zones: ['Cala Cala'] })
    expect(filterListings(listings, f)).toHaveLength(0)
    const s = mostRestrictiveFilter(listings, f)!
    expect(s.count).toBeGreaterThan(0)
    expect(filterListings(listings, removeFilter(f, s.key))).toHaveLength(s.count)
    // No other removal returns more results
    for (const key of ['operation', 'zones', 'storage'] as const) {
      expect(filterListings(listings, removeFilter(f, key)).length).toBeLessThanOrEqual(s.count)
    }
  })

  it('chip labels', () => {
    expect(filterLabel(EMPTY_FILTERS, 'zones')).toBe('Zona')
    expect(filterLabel({ ...EMPTY_FILTERS, zones: ['Cala Cala', 'Sarco'] }, 'zones')).toBe('Cala Cala +1')
    expect(filterLabel({ ...EMPTY_FILTERS, operation: 'alquiler', priceMax: 4000 }, 'price')).toBe('Hasta Bs 4.000')
    expect(filterLabel({ ...EMPTY_FILTERS, bedrooms: 4 }, 'bedrooms')).toBe('4+ dorm')
    expect(filterLabel({ ...EMPTY_FILTERS, bedrooms: 2 }, 'bedrooms')).toBe('2+ dorm')
  })
})
