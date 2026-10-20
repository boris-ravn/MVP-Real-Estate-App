import type { ParsedListing } from '../parser/parseListing'
import type { Agent, Listing, Operation, PhotoId, PropertyType, Zone } from './listing'
import { currencyFor } from './listing'

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
