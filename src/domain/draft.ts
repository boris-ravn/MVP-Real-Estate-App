import type { ParsedListing } from '../parser/parseListing'
import type { Agent, Listing, Operation, PhotoId, PropertyType, Zone } from './listing'
import { formatPrice } from './format'
import { currencyFor, OPERATION_LABELS, TYPE_LABELS } from './listing'

/** Ficha en edición (paso 2 de Publicar). `null` = el participante aún no lo completó. */
export interface Draft {
  operation: Operation | null
  type: PropertyType | null
  zone: Zone | null
  price: number | null
  bedrooms: number | null
  bathrooms: number | null
  builtM2: number | null
  landM2: number | null
  garage: boolean | null
  pets: boolean | null
  storage: boolean | null
  bankCredit: boolean | null
  docsOk: boolean | null
  utilities: boolean | null
  rentGuarantee: string | null
  /** Solo alquiler, Bs por mes; 0 = incluidas. */
  rentExpenses: number | null
  commissionShare: number | null
  ownerAuthorized: boolean
  photos: PhotoId[]
  description: string
}

export type DraftField = Exclude<keyof Draft, 'ownerAuthorized' | 'photos' | 'description'>

export const FIELD_LABELS: Record<DraftField, string> = {
  operation: 'Operación',
  type: 'Tipo',
  zone: 'Zona',
  price: 'Precio',
  bedrooms: 'Dormitorios',
  bathrooms: 'Baños',
  builtM2: 'm² construidos',
  landM2: 'm² de terreno',
  garage: 'Garaje',
  pets: 'Acepta mascotas',
  storage: 'Baulera',
  bankCredit: 'Acepta crédito bancario',
  docsOk: 'Documentación al día',
  utilities: 'Servicios básicos completos',
  rentGuarantee: 'Garantía',
  rentExpenses: 'Expensas',
  commissionShare: 'Comisión compartida',
}

export const REQUIRED_FIELDS: DraftField[] = ['operation', 'type', 'zone', 'price']

export function draftFromParsed(p: ParsedListing, text: string): Draft {
  return {
    operation: p.operation ?? null,
    type: p.type ?? null,
    zone: p.zone ?? null,
    price: p.price ?? null,
    bedrooms: p.bedrooms ?? null,
    bathrooms: p.bathrooms ?? null,
    builtM2: p.builtM2 ?? null,
    landM2: p.landM2 ?? null,
    garage: p.garage ?? null,
    pets: p.pets ?? null,
    storage: p.storage ?? null,
    bankCredit: p.bankCredit ?? null,
    docsOk: p.docsOk ?? null,
    utilities: p.utilities ?? null,
    rentGuarantee: p.rentGuarantee ?? null,
    rentExpenses: p.rentExpenses ?? null,
    commissionShare: p.commissionShare ?? null,
    ownerAuthorized: false,
    photos: ['fachada'],
    description: text.trim(),
  }
}

export const EMPTY_DRAFT: Draft = draftFromParsed({ detected: [] }, '')

/** Campos que tienen sentido según tipo y operación (un terreno no tiene baños). */
export function relevantFields(d: Pick<Draft, 'type' | 'operation'>): DraftField[] {
  const land = d.type === 'terreno'
  const local = d.type === 'local'
  const rent = d.operation === 'alquiler'
  const fields: (DraftField | false)[] = [
    'operation',
    'type',
    'zone',
    'price',
    !land && !local && 'bedrooms',
    !land && 'bathrooms',
    !land && 'builtM2',
    (land || d.type === 'casa') && 'landM2',
    !land && 'garage',
    !land && !local && 'pets',
    !land && 'storage',
    !rent && 'bankCredit',
    'docsOk',
    'utilities',
    rent && 'rentGuarantee',
    rent && 'rentExpenses',
    'commissionShare',
  ]
  return fields.filter((f): f is DraftField => f !== false)
}

/**
 * Campos que van en "Te falta" al llegar a Revisar (C2): los relevantes sin dato y los sugeridos.
 * Se calcula una sola vez, para que un campo no salte al resumen mientras el asesor lo completa.
 */
export function pendingAtStart(d: Draft, suggested: string[] = []): DraftField[] {
  return relevantFields(d).filter((f) => d[f] == null || suggested.includes(f))
}

const SUMMARY_BOOLS: Partial<Record<DraftField, [string, string]>> = {
  garage: ['Garaje', 'Sin garaje'],
  pets: ['Mascotas', 'Sin mascotas'],
  storage: ['Baulera', 'Sin baulera'],
  bankCredit: ['Crédito bancario', 'Sin crédito'],
  docsOk: ['Papeles al día', 'Papeles pendientes'],
  utilities: ['Servicios completos', 'Servicios incompletos'],
}

/** Resumen en una línea de los campos dados, en el orden de la ficha: "Departamento · Alquiler · Bs 3.500 · 2 dorm · Garaje". */
export function draftSummary(d: Draft, fields: DraftField[]): string {
  const parts: string[] = []
  const has = (f: DraftField) => fields.includes(f) && d[f] != null
  if (has('type')) parts.push(TYPE_LABELS[d.type!])
  if (has('operation')) parts.push(OPERATION_LABELS[d.operation!])
  if (has('zone')) parts.push(d.zone!)
  if (has('price')) parts.push(d.operation ? formatPrice(d.price!, currencyFor(d.operation)) : String(d.price))
  if (has('rentExpenses')) parts.push(d.rentExpenses === 0 ? 'Expensas incluidas' : `Expensas Bs ${d.rentExpenses}`)
  if (has('bedrooms')) parts.push(`${d.bedrooms} dorm`)
  if (has('bathrooms')) parts.push(`${d.bathrooms} ${d.bathrooms === 1 ? 'baño' : 'baños'}`)
  if (has('builtM2')) parts.push(`${d.builtM2} m²`)
  if (has('landM2')) parts.push(`Terreno ${d.landM2} m²`)
  for (const [f, [yes, no]] of Object.entries(SUMMARY_BOOLS) as [DraftField, [string, string]][]) {
    if (has(f)) parts.push(d[f] ? yes : no)
  }
  if (has('rentGuarantee')) parts.push(`Garantía ${d.rentGuarantee}`)
  if (has('commissionShare')) parts.push(`Comparte ${d.commissionShare}%`)
  return parts.join(' · ')
}

export function missingRequired(d: Draft): DraftField[] {
  return REQUIRED_FIELDS.filter((f) => d[f] == null)
}

export function draftToListing(d: Draft, agent: Agent, now: Date = new Date()): Listing {
  if (missingRequired(d).length) throw new Error('Faltan campos obligatorios')
  const relevant = new Set(relevantFields(d))
  const keep = <K extends DraftField>(k: K): Draft[K] | null => (relevant.has(k) ? d[k] : null)
  const iso = now.toISOString()
  return {
    id: `mine-${now.getTime()}`,
    operation: d.operation!,
    type: d.type!,
    zone: d.zone!,
    price: d.price!,
    currency: currencyFor(d.operation!),
    bedrooms: keep('bedrooms'),
    bathrooms: keep('bathrooms'),
    builtM2: keep('builtM2'),
    landM2: keep('landM2'),
    garage: keep('garage'),
    pets: keep('pets'),
    storage: keep('storage'),
    bankCredit: keep('bankCredit'),
    docsOk: d.docsOk,
    utilities: d.utilities,
    rentGuarantee: keep('rentGuarantee'),
    rentExpenses: keep('rentExpenses'),
    commissionShare: d.commissionShare,
    ownerAuthorized: d.ownerAuthorized,
    photos: d.photos.length ? d.photos : ['fachada'],
    description: d.description,
    agent,
    lastConfirmedAt: iso,
    status: 'active',
    createdAt: iso,
    isMine: true,
  }
}
