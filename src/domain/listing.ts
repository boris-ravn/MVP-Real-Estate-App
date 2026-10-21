export type Operation = 'venta' | 'alquiler' | 'anticretico'
export type PropertyType = 'casa' | 'departamento' | 'terreno' | 'local'
/** USD for sale and anticrético; BOB (Bs) for rent. */
export type Currency = 'USD' | 'BOB'
export type ListingStatus = 'active' | 'closed'

export const ZONES = [
  'Queru Queru',
  'Cala Cala',
  'Sarco',
  'Zona Norte',
  'Centro',
  'Recoleta',
  'Mayorazgo',
  'Tupuraya',
  'Zona Sur',
  'Tiquipaya',
  'Sacaba',
  'Colcapirhua',
  'Quillacollo',
  'Temporal',
  'Muyurina',
] as const
export type Zone = (typeof ZONES)[number]

/** The 6 available placeholder photos (gradient + icon). */
export const PHOTO_IDS = ['fachada', 'living', 'cocina', 'dormitorio', 'bano', 'patio'] as const
export type PhotoId = (typeof PHOTO_IDS)[number]

export interface Agent {
  name: string
  /** International format without spaces, e.g. "+59170000001". */
  whatsapp: string
  /** ISO date. */
  memberSince: string
}

/** Listing details whose relevance depends on the type and operation (see `fieldLevel`). */
export type DetailField =
  | 'bedrooms'
  | 'bathrooms'
  | 'builtM2'
  | 'landM2'
  | 'garage'
  | 'pets'
  | 'storage'
  | 'bankCredit'
  | 'docsOk'
  | 'utilities'
  | 'rentGuarantee'
  | 'rentExpenses'
  | 'commissionShare'

/**
 * Standard listing for a property. `null` means "no data": the listing shows it
 * explicitly so it's clear what's missing.
 */
export interface Listing {
  id: string
  operation: Operation
  type: PropertyType
  zone: Zone
  price: number
  currency: Currency
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
  /** Rentals only, e.g. "2 meses". */
  rentGuarantee?: string | null
  /** Rentals only, monthly HOA fees (expensas) in Bs. */
  rentExpenses?: number | null
  /** % of the commission that is shared, e.g. 50. */
  commissionShare: number | null
  /** Fields that don't apply to this property (PRD v3 D1): the listing shows "No aplica" instead of "Sin dato". Missing in older data = none. */
  notApplicable?: DetailField[]
  ownerAuthorized: boolean
  photos: PhotoId[]
  description: string
  agent: Agent
  /** ISO datetime. */
  lastConfirmedAt: string
  status: ListingStatus
  /** ISO datetime. */
  createdAt: string
  isMine: boolean
}

export const OPERATION_LABELS: Record<Operation, string> = {
  venta: 'Venta',
  alquiler: 'Alquiler',
  anticretico: 'Anticrético',
}

/** For phrases like "Departamento en venta". */
export const OPERATION_PHRASE: Record<Operation, string> = {
  venta: 'en venta',
  alquiler: 'en alquiler',
  anticretico: 'en anticrético',
}

/** Status shown once a listing is closed (sold, rented…). */
export const CLOSED_LABELS: Record<Operation, string> = {
  venta: 'Vendida',
  alquiler: 'Alquilada',
  anticretico: 'Cerrada',
}

export const TYPE_LABELS: Record<PropertyType, string> = {
  casa: 'Casa',
  departamento: 'Departamento',
  terreno: 'Terreno',
  local: 'Local u oficina',
}

export function currencyFor(operation: Operation): Currency {
  return operation === 'alquiler' ? 'BOB' : 'USD'
}
