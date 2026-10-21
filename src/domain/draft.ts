import type { ParsedListing } from '../parser/parseListing'
import type { Agent, Currency, DetailField, Listing, Operation, PhotoId, PropertyType, Zone } from './listing'
import { DETAIL_FIELDS, fieldLevel } from './fields'
import { formatPrice } from './format'
import { currencyFor, OPERATION_LABELS, TYPE_LABELS } from './listing'

/** Listing being edited (Publish step 2, Review). `null` = the participant hasn't filled it in yet. */
export interface Draft {
  operation: Operation | null
  type: PropertyType | null
  zone: Zone | null
  price: number | null
  /** Currency written in the message or chosen by the agent; `null` = the operation's default (see `draftCurrency`). */
  currency: Currency | null
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
  /** Rentals only, Bs per month; 0 = included. */
  rentExpenses: number | null
  commissionShare: number | null
  ownerAuthorized: boolean
  photos: PhotoId[]
  description: string
  /** Fields the agent marked "No aplica" (PRD v3 D1). Their value is kept in case the agent adds them back. */
  notApplicable: DetailField[]
  /** Fields that don't apply by default but the agent added back or that came with a value: they go under "Más datos". */
  added: DetailField[]
}

export type DraftField = Exclude<keyof Draft, 'currency' | 'ownerAuthorized' | 'photos' | 'description' | 'notApplicable' | 'added'>

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
  return keepFilledFields({
    operation: p.operation ?? null,
    type: p.type ?? null,
    zone: p.zone ?? null,
    price: p.price ?? null,
    // Only an explicit currency in the message counts; otherwise it follows the operation.
    currency: p.detected.includes('currency') ? (p.currency ?? null) : null,
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
    notApplicable: [],
    added: [],
  })
}

export const EMPTY_DRAFT: Draft = draftFromParsed({ detected: [] }, '')

/**
 * Where a field goes in Revisar (PRD v3 D1): `asked` = required and recommended (summary or "Te falta"),
 * `optional` = "Más datos", `notApplicable` = "No aplica". `null` = it never applies, so it isn't shown anywhere.
 */
export type ReviewSection = 'asked' | 'optional' | 'notApplicable'

const isDetail = (f: DraftField): f is DetailField => !REQUIRED_FIELDS.includes(f)
const ALL_FIELDS: DraftField[] = [...REQUIRED_FIELDS, ...DETAIL_FIELDS]

/** The type and operation set the default; what the agent marked or added back wins. */
export function sectionOf(f: DraftField, d: Draft): ReviewSection | null {
  if (!isDetail(f)) return 'asked'
  const level = fieldLevel(f, d)
  if (!level) return null
  if (d.notApplicable.includes(f)) return 'notApplicable'
  if (level === 'recommended') return 'asked'
  if (level === 'optional' || d.added.includes(f)) return 'optional'
  return 'notApplicable'
}

/** Fields of a section, in listing order. */
export function fieldsIn(d: Draft, section: ReviewSection): DraftField[] {
  return ALL_FIELDS.filter((f) => sectionOf(f, d) === section)
}

/** Required and recommended fields: the ones counted in "X de Y" and asked in "Te falta". */
export function askedFields(d: Draft): DraftField[] {
  return fieldsIn(d, 'asked')
}

/** A value is never hidden under "No aplica": e.g. "con baulera" on a house for sale goes to "Más datos" with its value. */
export function keepFilledFields(d: Draft): Draft {
  const hidden = DETAIL_FIELDS.filter((f) => d[f] != null && !d.notApplicable.includes(f) && sectionOf(f, d) === 'notApplicable')
  return hidden.length ? { ...d, added: [...d.added, ...hidden] } : d
}

export function markNotApplicable(d: Draft, f: DetailField): Draft {
  return { ...d, notApplicable: [...d.notApplicable, f], added: d.added.filter((x) => x !== f) }
}

/** "Agregar": back to "Te falta" if recommended, otherwise to "Más datos". */
export function addBack(d: Draft, f: DetailField): Draft {
  const next = { ...d, notApplicable: d.notApplicable.filter((x) => x !== f) }
  return fieldLevel(f, d) === 'notApplicable' ? { ...next, added: [...next.added, f] } : next
}

/**
 * Fields that go in "Te falta" (Missing) on reaching Revisar (C2): relevant ones without data plus suggested ones.
 * Computed only once, so a field doesn't jump to the summary while the agent is filling it in.
 */
export function pendingAtStart(d: Draft, suggested: string[] = []): DraftField[] {
  return askedFields(d).filter((f) => d[f] == null || suggested.includes(f))
}

/**
 * Adds the fields that a change made asked (e.g., switching to rent adds Garantía and
 * Expensas, or "Agregar" on a recommended field), so they show up in "Te falta" and stay
 * there once filled in. A field that was already asked never moves, even if the agent
 * clears it to type a new value.
 */
export function growPending(pending: DraftField[], prev: Draft, next: Draft): DraftField[] {
  const before = askedFields(prev)
  const added = askedFields(next).filter((f) => !before.includes(f) && next[f] == null && !pending.includes(f))
  return added.length ? [...pending, ...added] : pending
}

const SUMMARY_BOOLS: Partial<Record<DraftField, [string, string]>> = {
  garage: ['Garaje', 'Sin garaje'],
  pets: ['Mascotas', 'Sin mascotas'],
  storage: ['Baulera', 'Sin baulera'],
  bankCredit: ['Crédito bancario', 'Sin crédito'],
  docsOk: ['Papeles al día', 'Papeles pendientes'],
  utilities: ['Servicios completos', 'Servicios incompletos'],
}

/** One-line summary of the given fields, in listing order: "Departamento · Alquiler · Bs 3.500 · 2 dorm · Garaje". */
export function draftSummary(d: Draft, fields: DraftField[]): string {
  const parts: string[] = []
  const has = (f: DraftField) => fields.includes(f) && d[f] != null
  if (has('type')) parts.push(TYPE_LABELS[d.type!])
  if (has('operation')) parts.push(OPERATION_LABELS[d.operation!])
  if (has('zone')) parts.push(d.zone!)
  if (has('price')) parts.push(draftCurrency(d) ? formatPrice(d.price!, draftCurrency(d)!) : String(d.price))
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

/** Price currency: the one written in the message or chosen by the agent, otherwise Bs for rentals and $us for the rest. */
export function draftCurrency(d: Pick<Draft, 'currency' | 'operation'>): Currency | null {
  return d.currency ?? (d.operation ? currencyFor(d.operation) : null)
}

export function missingRequired(d: Draft): DraftField[] {
  return REQUIRED_FIELDS.filter((f) => d[f] == null)
}

export function draftToListing(d: Draft, agent: Agent, now: Date = new Date()): Listing {
  if (missingRequired(d).length) throw new Error('Missing required fields')
  // Fields under "No aplica", or that never apply, are saved without a value.
  const keep = <K extends DetailField>(k: K): Draft[K] | null => (sectionOf(k, d) === 'asked' || sectionOf(k, d) === 'optional' ? d[k] : null)
  const iso = now.toISOString()
  return {
    id: `mine-${now.getTime()}`,
    operation: d.operation!,
    type: d.type!,
    zone: d.zone!,
    price: d.price!,
    currency: draftCurrency(d)!,
    bedrooms: keep('bedrooms'),
    bathrooms: keep('bathrooms'),
    builtM2: keep('builtM2'),
    landM2: keep('landM2'),
    garage: keep('garage'),
    pets: keep('pets'),
    storage: keep('storage'),
    bankCredit: keep('bankCredit'),
    docsOk: keep('docsOk'),
    utilities: keep('utilities'),
    rentGuarantee: keep('rentGuarantee'),
    rentExpenses: keep('rentExpenses'),
    commissionShare: keep('commissionShare'),
    notApplicable: DETAIL_FIELDS.filter((f) => sectionOf(f, d) === 'notApplicable'),
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
