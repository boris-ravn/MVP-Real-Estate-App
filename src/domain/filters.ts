import { formatPrice } from './format'
import type { Listing, Operation, PropertyType, Zone } from './listing'
import { currencyFor, OPERATION_LABELS, TYPE_LABELS } from './listing'

export const BOOLEAN_FILTERS = ['garage', 'pets', 'storage', 'bankCredit', 'docsOk', 'utilities'] as const
export type BooleanFilter = (typeof BOOLEAN_FILTERS)[number]

export const BOOLEAN_FILTER_LABELS: Record<BooleanFilter, string> = {
  garage: 'Garaje',
  pets: 'Acepta mascotas',
  storage: 'Baulera',
  bankCredit: 'Acepta crédito bancario',
  docsOk: 'Documentación al día',
  utilities: 'Servicios básicos completos',
}

/** 1, 2, 3 = exacto; 4 = "4 o más". */
export type BedroomsFilter = 1 | 2 | 3 | 4

export interface Filters {
  operation: Operation | null
  type: PropertyType | null
  zones: Zone[]
  /** El precio se interpreta en la moneda de la operación elegida (Bs alquiler, $us el resto). */
  priceMin: number | null
  priceMax: number | null
  bedrooms: BedroomsFilter | null
  /** true = exigir que la propiedad lo tenga (las que no tienen el dato quedan fuera). */
  required: Record<BooleanFilter, boolean>
}

export const EMPTY_FILTERS: Filters = {
  operation: null,
  type: null,
  zones: [],
  priceMin: null,
  priceMax: null,
  bedrooms: null,
  required: { garage: false, pets: false, storage: false, bankCredit: false, docsOk: false, utilities: false },
}

export type FilterKey = 'operation' | 'type' | 'zones' | 'price' | 'bedrooms' | BooleanFilter

export function matches(l: Listing, f: Filters): boolean {
  if (f.operation && l.operation !== f.operation) return false
  if (f.type && l.type !== f.type) return false
  if (f.zones.length > 0 && !f.zones.includes(l.zone)) return false
  if (f.operation && (f.priceMin != null || f.priceMax != null)) {
    if (l.currency !== currencyFor(f.operation)) return false
    if (f.priceMin != null && l.price < f.priceMin) return false
    if (f.priceMax != null && l.price > f.priceMax) return false
  }
  if (f.bedrooms != null) {
    if (l.bedrooms == null) return false
    if (f.bedrooms === 4 ? l.bedrooms < 4 : l.bedrooms !== f.bedrooms) return false
  }
  for (const key of BOOLEAN_FILTERS) {
    if (f.required[key] && l[key] !== true) return false
  }
  return true
}

export function filterListings(listings: Listing[], f: Filters): Listing[] {
  return listings.filter((l) => matches(l, f))
}

export function activeFilterKeys(f: Filters): FilterKey[] {
  const keys: FilterKey[] = []
  if (f.operation) keys.push('operation')
  if (f.type) keys.push('type')
  if (f.zones.length) keys.push('zones')
  if (f.priceMin != null || f.priceMax != null) keys.push('price')
  if (f.bedrooms != null) keys.push('bedrooms')
  for (const k of BOOLEAN_FILTERS) if (f.required[k]) keys.push(k)
  return keys
}

export function removeFilter(f: Filters, key: FilterKey): Filters {
  switch (key) {
    case 'operation':
      // El precio depende de la moneda de la operación: se quitan juntos.
      return { ...f, operation: null, priceMin: null, priceMax: null }
    case 'type':
      return { ...f, type: null }
    case 'zones':
      return { ...f, zones: [] }
    case 'price':
      return { ...f, priceMin: null, priceMax: null }
    case 'bedrooms':
      return { ...f, bedrooms: null }
    default:
      return { ...f, required: { ...f.required, [key]: false } }
  }
}

export function setOperation(f: Filters, operation: Operation | null): Filters {
  const sameCurrency = operation && f.operation && currencyFor(operation) === currencyFor(f.operation)
  return sameCurrency ? { ...f, operation } : { ...f, operation, priceMin: null, priceMax: null }
}

export function filterLabel(f: Filters, key: FilterKey): string {
  switch (key) {
    case 'operation':
      return f.operation ? OPERATION_LABELS[f.operation] : 'Operación'
    case 'type':
      return f.type ? TYPE_LABELS[f.type] : 'Tipo'
    case 'zones':
      if (f.zones.length === 0) return 'Zona'
      return f.zones.length === 1 ? f.zones[0] : `${f.zones[0]} +${f.zones.length - 1}`
    case 'price':
      return priceLabel(f) ?? 'Precio'
    case 'bedrooms':
      return f.bedrooms == null ? 'Dormitorios' : f.bedrooms === 4 ? '4+ dorm' : `${f.bedrooms} dorm`
    default:
      return BOOLEAN_FILTER_LABELS[key]
  }
}

function priceLabel(f: Filters): string | null {
  if (!f.operation || (f.priceMin == null && f.priceMax == null)) return null
  const c = currencyFor(f.operation)
  if (f.priceMin != null && f.priceMax != null) return `${formatPrice(f.priceMin, c)} – ${groupShort(f.priceMax)}`
  if (f.priceMax != null) return `Hasta ${formatPrice(f.priceMax, c)}`
  return `Desde ${formatPrice(f.priceMin!, c)}`
}

function groupShort(n: number): string {
  return formatPrice(n, 'BOB').replace('Bs ', '')
}

/** Atajos de precio máximo por operación, para filtrar con un toque. */
export const PRICE_PRESETS: Record<Operation, number[]> = {
  venta: [80000, 120000, 200000, 350000],
  alquiler: [2500, 4000, 6000],
  anticretico: [25000, 40000, 60000],
}

/**
 * Para el estado vacío: el filtro cuya eliminación devuelve más resultados.
 * Ej.: "No hay resultados. Prueba quitando Baulera".
 */
export function mostRestrictiveFilter(
  listings: Listing[],
  f: Filters,
): { key: FilterKey; label: string; count: number } | null {
  let best: { key: FilterKey; label: string; count: number } | null = null
  for (const key of activeFilterKeys(f)) {
    const count = filterListings(listings, removeFilter(f, key)).length
    if (count > 0 && (!best || count > best.count)) best = { key, label: filterLabel(f, key), count }
  }
  return best
}

/** Resumen compacto para el evento filter_applied. */
export function describeFilters(f: Filters): Record<string, unknown> {
  return Object.fromEntries(
    activeFilterKeys(f).map((k) => {
      if (k === 'zones') return [k, f.zones]
      if (k === 'price') return [k, [f.priceMin, f.priceMax]]
      if (k === 'operation' || k === 'type' || k === 'bedrooms') return [k, f[k]]
      return [k, true]
    }),
  )
}
