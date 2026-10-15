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

describe('filtros', () => {
  it('sin filtros devuelve todo', () => {
    expect(filterListings(listings, EMPTY_FILTERS)).toHaveLength(listings.length)
  })

  it('criterio de aceptación: Departamento + Alquiler + Cala Cala + Garaje + Mascotas', () => {
    const f = withReq({ garage: true, pets: true }, { operation: 'alquiler', type: 'departamento', zones: ['Cala Cala'] })
    const r = filterListings(listings, f)
    expect(r.length).toBeGreaterThan(0)
    for (const l of r) {
      expect(l).toMatchObject({ operation: 'alquiler', type: 'departamento', zone: 'Cala Cala', garage: true, pets: true })
    }
    // Ninguna que cumpla quedó fuera
    const expected = listings.filter(
      (l) => l.operation === 'alquiler' && l.type === 'departamento' && l.zone === 'Cala Cala' && l.garage && l.pets,
    )
    expect(r.map((l) => l.id).sort()).toEqual(expected.map((l) => l.id).sort())
  })

  it('zona es multiselección', () => {
    const r = filterListings(listings, { ...EMPTY_FILTERS, zones: ['Sarco', 'Sacaba'] })
    expect(new Set(r.map((l) => l.zone))).toEqual(new Set(['Sarco', 'Sacaba']))
  })

  it('precio usa la moneda de la operación', () => {
    const r = filterListings(listings, { ...EMPTY_FILTERS, operation: 'alquiler', priceMax: 4000 })
    expect(r.length).toBeGreaterThan(0)
    expect(r.every((l) => l.currency === 'BOB' && l.price <= 4000)).toBe(true)
  })

  it('cambiar a una operación con otra moneda limpia el precio', () => {
    const f = { ...EMPTY_FILTERS, operation: 'alquiler' as const, priceMax: 4000 }
    expect(setOperation(f, 'venta').priceMax).toBeNull()
    expect(setOperation({ ...f, operation: 'venta' }, 'anticretico').priceMax).toBe(4000)
  })

  it('dormitorios: exacto para 1–3 y "4 o más" para 4', () => {
    expect(filterListings(listings, { ...EMPTY_FILTERS, bedrooms: 2 }).every((l) => l.bedrooms === 2)).toBe(true)
    const four = filterListings(listings, { ...EMPTY_FILTERS, bedrooms: 4 })
    expect(four.length).toBeGreaterThan(0)
    expect(four.every((l) => (l.bedrooms ?? 0) >= 4)).toBe(true)
  })

  it('un filtro booleano excluye las propiedades sin el dato', () => {
    const r = filterListings(listings, withReq({ storage: true }))
    expect(r.every((l) => l.storage === true)).toBe(true)
  })

  it('el estado vacío sugiere el filtro más restrictivo', () => {
    // Alquiler en Cala Cala con baulera no existe en la semilla
    const f = withReq({ storage: true }, { operation: 'alquiler', zones: ['Cala Cala'] })
    expect(filterListings(listings, f)).toHaveLength(0)
    const s = mostRestrictiveFilter(listings, f)!
    expect(s.count).toBeGreaterThan(0)
    expect(filterListings(listings, removeFilter(f, s.key))).toHaveLength(s.count)
    // Ninguna otra eliminación devuelve más resultados
    for (const key of ['operation', 'zones', 'storage'] as const) {
      expect(filterListings(listings, removeFilter(f, key)).length).toBeLessThanOrEqual(s.count)
    }
  })

  it('etiquetas de chips', () => {
    expect(filterLabel(EMPTY_FILTERS, 'zones')).toBe('Zona')
    expect(filterLabel({ ...EMPTY_FILTERS, zones: ['Cala Cala', 'Sarco'] }, 'zones')).toBe('Cala Cala +1')
    expect(filterLabel({ ...EMPTY_FILTERS, operation: 'alquiler', priceMax: 4000 }, 'price')).toBe('Hasta Bs 4.000')
    expect(filterLabel({ ...EMPTY_FILTERS, bedrooms: 4 }, 'bedrooms')).toBe('4+ dorm')
  })
})
